import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, getMediaUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const COLUMNS = [
    { id: 'PENDING_REVIEW', label: 'Review Queue', color: 'bg-blue-100 text-blue-800', border: 'border-blue-200' },
    { id: 'PUBLISHED', label: 'Published', color: 'bg-green-100 text-green-800', border: 'border-green-200' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800', border: 'border-red-200' },
];

export default function AdminDashboard() {
    const [releases, setReleases] = useState<any[]>([]);
    const [selectedRelease, setSelectedRelease] = useState<any | null>(null);
    const [rejectReason, setRejectReason] = useState<string>('');
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
        const interval = setInterval(fetchReleases, 5000);
        return () => clearInterval(interval);
    }, []);

    const groupedReleases = useMemo(() => {
        const groups: Record<string, any[]> = {};
        COLUMNS.forEach(c => groups[c.id] = []);
        releases.forEach(r => {
            if (groups[r.status]) groups[r.status].push(r);
        });
        return groups;
    }, [releases]);

    const handleReview = async (id: number, status: 'PUBLISHED' | 'REJECTED') => {
        try {
            // Optimistic update
            const updatedReleases = releases.map(r => r.id === id ? { ...r, status } : r);
            setReleases(updatedReleases);
            setSelectedRelease(null); // Close modal immediately
            setRejectReason(''); // Clear reject reason

            const body: any = { status };
            if (status === 'REJECTED' && rejectReason.trim()) {
                body.reject_reason = rejectReason.trim();
            }

            await apiFetch(`/releases/${id}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            fetchReleases(); // Re-fetch to ensure sync
        } catch (err) {
            alert('Action failed');
            fetchReleases(); // Revert on failure
        }
    };

    const loadReleaseDetails = async (release: any) => {
        // Use cached data for immediate open, then fetch full details (tracks)
        setSelectedRelease(release);
        try {
            const data = await apiFetch(`/releases/${release.id}`);
            setSelectedRelease(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col font-sans">
            {/* Navbar */}
            <nav className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
                        <h1 className="text-xl font-bold tracking-tight">Solitaire Admin</h1>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to="/admin"
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 transition"
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/admin/analytics"
                            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                            Analytics
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Admin Mode</span>
                    <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-full transition">Logout</button>
                </div>
            </nav>

            {/* Stats Header */}
            <header className="px-8 py-6">
                <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COLUMNS.map(col => (
                        <div key={col.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">{col.label}</p>
                                <p className="text-3xl font-bold">{(groupedReleases[col.id] || []).length}</p>
                            </div>
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl", col.color)}>
                                {col.id === 'PENDING_REVIEW' && '⏳'}
                                {col.id === 'PUBLISHED' && '✅'}
                                {col.id === 'REJECTED' && '❌'}
                            </div>
                        </div>
                    ))}
                </div>
            </header>

            {/* Kanban Board */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8">
                <div className="h-full flex gap-8 min-w-[1000px]">
                    {COLUMNS.map(col => (
                        <div key={col.id} className="flex-1 flex flex-col h-full bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200">{col.label}</h3>
                                <span className={cn("text-xs px-2 py-1 rounded-full font-bold", col.color)}>
                                    {(groupedReleases[col.id] || []).length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                <AnimatePresence mode="popLayout">
                                    {(groupedReleases[col.id] || []).map((release: any) => (
                                        <motion.div
                                            layout
                                            layoutId={`card-${release.id}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            key={release.id}
                                            onClick={() => loadReleaseDetails(release)}
                                            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow group"
                                            whileHover={{ y: -2 }}
                                        >
                                            <div className="flex gap-4">
                                                {release.cover_url ? (
                                                    <img src={getMediaUrl(release.cover_url)} className="w-16 h-16 rounded-lg object-cover bg-gray-200" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">🎵</div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold truncate text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{release.title}</h4>
                                                    <p className="text-sm text-gray-500 truncate">{release.genre}</p>
                                                    <p className="text-xs text-gray-400 mt-2">{new Date(release.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {(groupedReleases[col.id] || []).length === 0 && (
                                    <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                        No releases
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedRelease && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedRelease(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="relative h-48 bg-gray-900">
                                {selectedRelease.cover_url && (
                                    <>
                                        <img src={getMediaUrl(selectedRelease.cover_url)} className="w-full h-full object-cover opacity-50 blur-lg" />
                                        <img src={getMediaUrl(selectedRelease.cover_url)} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-40 w-40 object-cover rounded shadow-lg z-10" />
                                    </>
                                )}
                                <button
                                    onClick={() => setSelectedRelease(null)}
                                    className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold mb-2">{selectedRelease.title}</h2>
                                    <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium">
                                        {selectedRelease.genre}
                                    </span>
                                </div>

                                <div className="space-y-4 mb-8 max-h-60 overflow-y-auto custom-scrollbar">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tracks</h3>
                                    {selectedRelease.tracks?.map((t: any) => (
                                        <div key={t.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center justify-between transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                                            <span className="font-medium text-sm">{t.title}</span>
                                            <audio controls src={getMediaUrl(t.audio_url)} className="h-8 w-32" />
                                        </div>
                                    ))}
                                    {(!selectedRelease.tracks || selectedRelease.tracks.length === 0) && (
                                        <p className="text-gray-500 text-sm italic">No tracks available.</p>
                                    )}
                                </div>

                                {selectedRelease.status === 'PENDING_REVIEW' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Reject Reason (Optional)
                                            </label>
                                            <textarea
                                                id="reject-reason"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                placeholder="Provide feedback to the artist..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => handleReview(selectedRelease.id, 'REJECTED')}
                                                className="py-3 px-4 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleReview(selectedRelease.id, 'PUBLISHED')}
                                                className="py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1"
                                            >
                                                Approve & Publish
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <p className="text-sm text-gray-500">Status: <span className="font-bold text-gray-900 dark:text-white">{selectedRelease.status}</span></p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
