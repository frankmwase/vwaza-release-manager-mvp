import React, { useEffect, useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { apiFetch, getMediaUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const STATUS_ORDER = ['DRAFT', 'PROCESSING', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Drafts', color: 'text-gray-800', bg: 'bg-gray-200' },
    PROCESSING: { label: 'Processing', color: 'text-yellow-800', bg: 'bg-yellow-200' },
    PENDING_REVIEW: { label: 'Pending Review', color: 'text-blue-800', bg: 'bg-blue-200' },
    PUBLISHED: { label: 'Published', color: 'text-green-800', bg: 'bg-green-200' },
    REJECTED: { label: 'Rejected', color: 'text-red-800', bg: 'bg-red-200' },
};

export default function ArtistDashboard() {
    const [releases, setReleases] = useState<any[]>([]);
    const [activeStatus, setActiveStatus] = useState<string | null>('DRAFT');
    const { logout, user } = useAuth();
    const navigate = useNavigate();

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
        STATUS_ORDER.forEach(s => groups[s] = []);
        releases.forEach(r => {
            if (groups[r.status]) groups[r.status].push(r);
            else groups[r.status] = [r]; // Fallback if status not in order
        });
        return groups;
    }, [releases]);

    // Auto-select first non-empty status if current is empty
    useEffect(() => {
        const currentItems = groupedReleases[activeStatus || 'DRAFT'] || [];
        if (currentItems.length === 0) {
            const firstNonEmpty = STATUS_ORDER.find(s => groupedReleases[s] && groupedReleases[s].length > 0);
            if (firstNonEmpty && firstNonEmpty !== activeStatus) {
                setActiveStatus(firstNonEmpty);
            }
        }
    }, [groupedReleases, activeStatus]);

    const handleCardClick = (release: any) => {
        if (release.status === 'DRAFT') {
            navigate(`/artist/release/${release.id}/edit`);
        } else {
            navigate(`/artist/release/${release.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col">
            <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center z-10 relative">
                <h1 className="text-xl font-bold">Solitaire User</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{user?.email}</span>
                    <button onClick={logout} className="text-red-600 hover:text-red-800">Logout</button>
                </div>
            </nav>

            <main className="flex-1 p-6 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">My Library</h2>
                    <NavLink to="/artist/new" className="bg-violet-600 text-white px-6 py-2 rounded-full font-bold hover:bg-violet-700 shadow-lg shadow-violet-500/30 transition-all hover:scale-105">
                        + New Release
                    </NavLink>
                </div>

                <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-start">
                    {STATUS_ORDER.map((status) => {
                        const items = groupedReleases[status] || [];
                        const isActive = activeStatus === status;
                        const config = STATUS_CONFIG[status];

                        if (items.length === 0 && !isActive) return null; // Hide empty stacks if not active

                        return (
                            <motion.div
                                key={status}
                                layout
                                initial={false}
                                onClick={() => !isActive && setActiveStatus(status)}
                                animate={{
                                    flex: isActive ? 1 : 0,
                                    width: isActive ? "auto" : 260,
                                    opacity: isActive ? 1 : 0.6,
                                    scale: isActive ? 1 : 0.95,
                                    filter: isActive ? 'grayscale(0%)' : 'grayscale(40%)'
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={cn(
                                    "relative rounded-2xl p-4 transition-all duration-300",
                                    isActive ? "shadow-xl bg-white dark:bg-gray-800 ring-1 ring-violet-500/20" : "cursor-pointer hover:opacity-80 bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:scale-105"
                                )}
                            >
                                <motion.h3 layout="position" className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className={cn("w-3 h-3 rounded-full", config.bg.replace('bg-', 'bg-'))} style={{ backgroundColor: 'currentColor' }} />
                                    {config.label}
                                    <span className="text-gray-400 text-sm">({items.length})</span>
                                </motion.h3>

                                {isActive ? (
                                    // Expanded Grid View
                                    <motion.div
                                        layout
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                    >
                                        <AnimatePresence>
                                            {items.map((release) => (
                                                <motion.div
                                                    layoutId={`card-${release.id}`}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    key={release.id}
                                                    onClick={(e) => { e.stopPropagation(); handleCardClick(release); }}
                                                    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md cursor-pointer group"
                                                    whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                                                >
                                                    <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                                        {release.cover_url ? (
                                                            <img src={getMediaUrl(release.cover_url)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Cover</div>
                                                        )}
                                                        <div className={cn("absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold shadow-sm", config.bg, config.color)}>
                                                            {release.status}
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold truncate">{release.title}</h4>
                                                    <p className="text-sm text-gray-500">{release.genre}</p>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {items.length === 0 && <div className="text-gray-400 italic">No releases in this status.</div>}
                                    </motion.div>
                                ) : (
                                    // Collapsed Stack View
                                    <div className="relative h-64 w-full">
                                        {items.slice(0, 3).reverse().map((release, index) => {
                                            const reverseIndex = Math.min(items.length, 3) - 1 - index; // 2, 1, 0 (top)
                                            return (
                                                <motion.div
                                                    layoutId={`card-${release.id}`}
                                                    key={release.id}
                                                    className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-4"
                                                    style={{
                                                        zIndex: index, // Top item has highest index
                                                        top: reverseIndex * 8, // slight offset down
                                                        scale: 1 - (reverseIndex * 0.05), // slight scale down for depth
                                                    }}
                                                >
                                                    {index === items.length - 1 || index === 2 ? ( // Show content only on top card visually
                                                        <>
                                                            {release.cover_url && (
                                                                <img src={getMediaUrl(release.cover_url)} className="w-full h-32 object-cover rounded mb-2 opacity-80" />
                                                            )}
                                                            <div className="font-bold truncate">{release.title}</div>
                                                            <div className={cn("text-xs mt-1 inline-block px-2 py-0.5 rounded", config.bg, config.color)}>{config.label}</div>
                                                        </>
                                                    ) : <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded opacity-50" />}
                                                </motion.div>
                                            );
                                        })}
                                        {items.length === 0 && (
                                            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                                Empty
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
