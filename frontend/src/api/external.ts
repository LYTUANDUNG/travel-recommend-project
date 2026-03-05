import axios from 'axios';

// Types for Province API
export interface Province {
    code: number;
    name: string;
    division_type: string;
    codename: string;
    phone_code: number;
    districts: any[];
}

// Types for Overpass API (OSM)
export interface OSMNode {
    type: string;
    id: number;
    lat: number;
    lon: number;
    tags: {
        amenity?: string;
        name?: string;
        "addr:city"?: string;
        "addr:street"?: string;
        cuisine?: string;
        opening_hours?: string;
        phone?: string;
        website?: string;
        [key: string]: any;
    };
}

const PROVINCE_API_URL = 'https://provinces.open-api.vn/api';
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export const externalApi = {
    // Get all provinces
    getProvinces: async (): Promise<Province[]> => {
        try {
            const response = await axios.get(`${PROVINCE_API_URL}/?depth=1`);
            return response.data;
        } catch (error) {
            console.error("Error fetching provinces:", error);
            return [];
        }
    },

    // Get POIs near location based on category
    getNearbyPOIs: async (lat: number, lng: number, category: string = 'all', radius: number = 3000): Promise<OSMNode[]> => {
        try {
            let nodeFilter = '';

            switch (category) {
                case 'Khách sạn':
                    nodeFilter = `node["tourism"="hotel"](around:${radius},${lat},${lng});`;
                    break;
                case 'Nhà hàng':
                case 'Ẩm thực':
                    nodeFilter = `
            (
              node["amenity"="restaurant"](around:${radius},${lat},${lng});
              node["amenity"="cafe"](around:${radius},${lat},${lng});
            );
          `;
                    break;
                case 'Di tích':
                case 'Văn hóa':
                    nodeFilter = `
            (
              node["historic"](around:${radius},${lat},${lng});
              node["tourism"="museum"](around:${radius},${lat},${lng});
            );
          `;
                    break;
                case 'Giải trí':
                    nodeFilter = `
            (
              node["leisure"="park"](around:${radius},${lat},${lng});
              node["amenity"="cinema"](around:${radius},${lat},${lng});
              node["tourism"="theme_park"](around:${radius},${lat},${lng});
            );
          `;
                    break;
                case 'Thiên nhiên':
                    nodeFilter = `
            (
              node["natural"](around:${radius},${lat},${lng});
              node["tourism"="viewpoint"](around:${radius},${lat},${lng});
            );
          `;
                    break;
                default:
                    // 'All' - Get a mix of popular spots
                    nodeFilter = `
            (
              node["tourism"="hotel"](around:${radius},${lat},${lng});
              node["amenity"="restaurant"](around:${radius},${lat},${lng});
              node["historic"](around:${radius},${lat},${lng});
            );
          `;
            }

            const query = `
        [out:json][timeout:25];
        (
          ${nodeFilter}
        );
        out body;
        >;
        out skel qt;
      `;

            const response = await axios.post(OVERPASS_API_URL, query, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data && response.data.elements) {
                return response.data.elements.filter((el: any) => el.tags && el.tags.name).slice(0, 50); // Limit to 50 items
            }
            return [];
        } catch (error) {
            console.error("Error fetching POIs from Overpass:", error);
            return [];
        }
    },

    // Search location by name (Nominatim)
    searchLocation: async (query: string): Promise<{ lat: number, lon: number } | null> => {
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: query,
                    format: 'json',
                    limit: 1,
                    countrycodes: 'vn'
                }
            });
            if (response.data && response.data.length > 0) {
                return {
                    lat: parseFloat(response.data[0].lat),
                    lon: parseFloat(response.data[0].lon)
                };
            }
            return null;
        } catch (error) {
            console.error("Error searching location:", error);
            return null;
        }
    },

    // Get directions using Mapbox API
    getDirections: async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<any> => {
        const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
        try {
            const response = await axios.get(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}`,
                {
                    params: {
                        geometries: 'geojson',
                        access_token: MAPBOX_TOKEN,
                        steps: true
                    }
                }
            );

            if (response.data && response.data.routes && response.data.routes.length > 0) {
                return response.data.routes[0];
            }
            return null;
        } catch (error) {
            console.error("Error fetching directions:", error);
            // Fallback to OSRM if Mapbox fails (or token invalid) for demo purposes
            try {
                const osrmResponse = await axios.get(
                    `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
                );
                if (osrmResponse.data && osrmResponse.data.routes && osrmResponse.data.routes.length > 0) {
                    return osrmResponse.data.routes[0];
                }
            } catch (osrmError) {
                console.error("OSRM fallback also failed:", osrmError);
            }
            return null;
        }
    }
};
