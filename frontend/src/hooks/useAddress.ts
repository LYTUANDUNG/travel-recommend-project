import { useState, useEffect } from 'react';

// Using esgoo.net - A reliable, popular JSON API for Vietnam Administrative Units
const BASE_URL = 'https://esgoo.net/api-tinhthanh';

export interface Province {
    id: string; // Esgoo uses 'id' instead of 'code'
    name: string;
    full_name: string;
}

export interface FlattenedWard {
    id: string;
    name: string;
    full_name: string;
    parentDistrictName: string;
    fullName: string; // For display: "Ward - District"
}

// Response Wrapper from Esgoo
interface EsgooResponse {
    error: number;
    error_text: string;
    data: any[];
}

export function useAddress() {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cache to prevent refetching same province details
    const [provinceDetailsCache, setProvinceDetailsCache] = useState<Record<string, FlattenedWard[]>>({});

    // 1. Initial Load: Fetch Province List (Level 1)
    useEffect(() => {
        const fetchProvinces = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${BASE_URL}/1/0.htm`);
                const json: EsgooResponse = await response.json();

                if (json.error === 0) {
                    setProvinces(json.data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        full_name: p.full_name
                    })));
                } else {
                    throw new Error(json.error_text);
                }
            } catch (err) {
                console.error("Esgoo Province Init Error:", err);
                setError("Có lỗi khi tải danh sách Tỉnh/Thành.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProvinces();
    }, []);

    // 2. Fetch Wards by Province (Lazy & Parallel)
    // Strategy: Fetch Districts of Province -> Then Fetch Wards of ALL Districts in Parallel -> Flatten
    const getWardsByProvince = async (provinceId: string): Promise<FlattenedWard[]> => {
        if (!provinceId) return [];

        // Return from cache
        if (provinceDetailsCache[provinceId]) {
            return provinceDetailsCache[provinceId];
        }

        setIsLoading(true);
        try {
            // A. Fetch Districts (Level 2)
            const distRes = await fetch(`${BASE_URL}/2/${provinceId}.htm`);
            const distJson: EsgooResponse = await distRes.json();

            if (distJson.error !== 0) throw new Error(distJson.error_text);
            const districts = distJson.data;

            // B. Fetch Wards for ALL Districts (Parallel)
            // Limit concurrency if needed, but for ~10 requests browser handles it fine
            const wardPromises = districts.map(async (district: any) => {
                try {
                    const wardRes = await fetch(`${BASE_URL}/3/${district.id}.htm`);
                    const wardJson: EsgooResponse = await wardRes.json();
                    if (wardJson.error === 0) {
                        return wardJson.data.map((w: any) => ({
                            id: w.id,
                            name: w.name,
                            full_name: w.full_name,
                            parentDistrictName: district.full_name,
                            fullName: `${w.full_name} - ${district.full_name}`
                        }));
                    }
                    return [];
                } catch (e) {
                    console.warn(`Failed to fetch wards for district ${district.id}`, e);
                    return [];
                }
            });

            const wardsArrays = await Promise.all(wardPromises);
            const flattened = wardsArrays.flat();

            // Update Cache
            setProvinceDetailsCache(prev => ({
                ...prev,
                [provinceId]: flattened
            }));

            return flattened;

        } catch (err) {
            console.error("Esgoo Detail Fetch Error:", err);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    return {
        provinces,
        getWardsByProvince,
        isLoading,
        error
    };
}
