import React, { useEffect, useState } from 'react';
import { apiFetch, getMediaUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const [releases, setReleases] = useState<any[]>([]);
    const [selectedRelease, setSelectedRelease] = useState<any | null>(null);
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
    }, []);

    const handleReview = async (id: number, status: 'PUBLISHED' | 'REJECTED') => {
        try {
            await apiFetch(`/releases/${id}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchReleases();
            setSelectedRelease(null);
        } catch (err) {
            alert('Action failed');
        }
    };

    const loadReleaseDetails = async (id: number) => {
        try {
            const data = await apiFetch(`/releases/${id}`);
            setSelectedRelease(data);
        } catch (err) {
            console.error(err);
        }
    };

    const pendingReleases = releases.filter(r => r.status === 'PENDING_REVIEW');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center text-white">
                <h1 className="text-xl font-bold dark:text-white text-gray-900">Vwaza Admin</h1>
                <button onClick={logout} className="text-red-600 hover:text-red-800">Logout</button>
            </nav>

            <div className="flex">
                {/* Sidebar List */}
                <aside className="w-1/3 border-r h-[calc(100vh-64px)] overflow-y-auto bg-white dark:bg-gray-800">
                    <div className="p-4 font-bold border-b">Review Queue ({pendingReleases.length})</div>
                    {pendingReleases.map(r => (
                        <div key={r.id} onClick={() => loadReleaseDetails(r.id)} className={`p-4 border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedRelease?.id === r.id ? 'bg-indigo-50 dark:bg-gray-700' : ''}`}>
                            <h3 className="font-bold">{r.title}</h3>
                            <p className="text-sm text-gray-500">{r.genre}</p>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 rounded">Pending Review</span>
                        </div>
                    ))}
                    {pendingReleases.length === 0 && <div className="p-4 text-gray-500">No pending releases.</div>}

                    <div className="p-4 font-bold border-b mt-8">Other Releases</div>
                    {releases.filter(r => r.status !== 'PENDING_REVIEW').map(r => (
                        <div key={r.id} className="p-4 border-b opacity-50">
                            <h3 className="font-bold">{r.title}</h3>
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 rounded">{r.status}</span>
                        </div>
                    ))}
                </aside>

                {/* Main Content */}
                <main className="w-2/3 p-8">
                    {selectedRelease ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">{selectedRelease.title}</h2>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">Genre: {selectedRelease.genre}</p>
                                </div>
                                {selectedRelease.cover_url && <img src={getMediaUrl(selectedRelease.cover_url)} className="w-32 h-32 object-cover rounded" />}
                            </div>

                            <div className="mt-8">
                                <h3 className="text-xl font-bold mb-4">Tracks</h3>
                                <div className="space-y-4">
                                    {selectedRelease.tracks?.map((t: any) => (
                                        <div key={t.id} className="border p-3 rounded flex items-center justify-between">
                                            <span>{t.title}</span>
                                            <audio controls src={getMediaUrl(t.audio_url)} className="h-8" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-10 flex gap-4 pt-6 border-t">
                                <button onClick={() => handleReview(selectedRelease.id, 'PUBLISHED')} className="bg-green-600 text-white px-6 py-2 rounded text-lg font-bold hover:bg-green-700">Approve & Publish</button>
                                <button onClick={() => handleReview(selectedRelease.id, 'REJECTED')} className="bg-red-600 text-white px-6 py-2 rounded text-lg font-bold hover:bg-red-700">Reject</button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            Select a release to review
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
