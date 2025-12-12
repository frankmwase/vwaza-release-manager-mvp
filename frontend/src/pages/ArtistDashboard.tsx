import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, getMediaUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ArtistDashboard() {
    const [releases, setReleases] = useState<any[]>([]);
    const { logout, user } = useAuth();

    const fetchReleases = async () => {
        try {
            const data = await apiFetch('/releases');
            setReleases(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchReleases();
        const interval = setInterval(fetchReleases, 5000); // Polling for status updates
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-gray-200 text-gray-800';
            case 'PROCESSING': return 'bg-yellow-200 text-yellow-800';
            case 'PENDING_REVIEW': return 'bg-blue-200 text-blue-800';
            case 'PUBLISHED': return 'bg-green-200 text-green-800';
            case 'REJECTED': return 'bg-red-200 text-red-800';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Vwaza Artist: {user?.email}</h1>
                <button onClick={logout} className="text-red-600 hover:text-red-800">Logout</button>
            </nav>

            <main className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">My Releases</h2>
                    <Link to="/artist/new" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
                        New Release
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {releases.map(release => (
                        <div key={release.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(release.status)}`}>
                                    {release.status}
                                </span>
                                <span className="text-xs text-gray-500">{new Date(release.created_at).toLocaleDateString()}</span>
                            </div>
                            {release.cover_url && (
                                <img src={getMediaUrl(release.cover_url)} alt={release.title} className="w-full h-48 object-cover rounded mb-4" />
                            )}
                            <h3 className="text-lg font-bold mb-1">{release.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{release.genre}</p>
                        </div>
                    ))}
                    {releases.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No releases yet. Create one to get started!
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
