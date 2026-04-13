import { useNavigate } from 'react-router-dom';
import LocationCard from './LocationCard';
import type { Location } from '../types';

interface LocationListProps {
    title: string;
    locations: Location[];
}

export default function LocationList({ title, locations }: LocationListProps) {
    const navigate = useNavigate();
    if (locations.length === 0) return null;

    return (
        <div className="py-8">
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">{title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {locations.map((loc) => (
                    <LocationCard
                        key={loc.location_id}
                        location={loc}
                        onClick={() => navigate(`/detail/${loc.location_id}`)}
                    />
                ))}
            </div>
        </div>
    );
}
