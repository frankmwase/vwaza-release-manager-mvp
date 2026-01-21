import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface AnalyticsData {
    overview: {
        totalReleases: number;
        totalArtists: number;
        releasesByStatus: {
            status: string;
            count: number;
            percentage: number;
        }[];
    };
    topArtists: {
        artist_id: number;
        artist_email: string;
        release_count: number;
        published_count: number;
        pending_count: number;
    }[];
    genreStats: {
        genre: string;
        count: number;
        percentage: number;
    }[];
    releaseTrends: {
        date: string;
        count: number;
    }[];
    recentReleases: {
        id: number;
        title: string;
        genre: string;
        status: string;
        artist_email: string;
        created_at: string;
        track_count: number;
    }[];
}

const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-500',
    PROCESSING: 'bg-blue-500',
    PENDING_REVIEW: 'bg-yellow-500',
    PUBLISHED: 'bg-green-500',
    REJECTED: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
    DRAFT: 'Draft',
    PROCESSING: 'Processing',
    PENDING_REVIEW: 'Pending Review',
    PUBLISHED: 'Published',
    REJECTED: 'Rejected',
};

export default function AdminAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { logout } = useAuth();

    const fetchAnalytics = async () => {
        try {
            const analyticsData = await apiFetch('/analytics');
            setData(analyticsData);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-gray-900 flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-400">Failed to load analytics data</p>
            </div>
        );
    }

    const maxTrendCount = Math.max(...data.releaseTrends.map(t => t.count), 1);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            {/* Navbar */}
            <nav className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
                        <h1 className="text-xl font-bold tracking-tight">Solitaire Analytics</h1>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to="/admin"
                            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/admin/analytics"
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 transition"
                        >
                            Analytics
                        </Link>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-full transition"
                >
                    Logout
                </button>
            </nav>

            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className="text-3xl font-bold mb-2">Platform Analytics</h2>
                    <p className="text-gray-600 dark:text-gray-400">Comprehensive insights and statistics</p>
                </motion.div>

                {/* Overview Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                >
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-2xl">
                                🎵
                            </div>
                        </div>
                        <p className="text-3xl font-bold mb-1">{data.overview.totalReleases}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Releases</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-2xl">
                                👥
                            </div>
                        </div>
                        <p className="text-3xl font-bold mb-1">{data.overview.totalArtists}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active Artists</p>
                    </div>

                    {data.overview.releasesByStatus.find(s => s.status === 'PENDING_REVIEW') && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center text-2xl">
                                    ⏳
                                </div>
                            </div>
                            <p className="text-3xl font-bold mb-1">
                                {data.overview.releasesByStatus.find(s => s.status === 'PENDING_REVIEW')?.count || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
                        </div>
                    )}

                    {data.overview.releasesByStatus.find(s => s.status === 'PUBLISHED') && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl">
                                    ✅
                                </div>
                            </div>
                            <p className="text-3xl font-bold mb-1">
                                {data.overview.releasesByStatus.find(s => s.status === 'PUBLISHED')?.count || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
                        </div>
                    )}
                </motion.div>

                {/* Status Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8"
                >
                    <h3 className="text-xl font-bold mb-6">Release Status Distribution</h3>
                    <div className="space-y-4">
                        {data.overview.releasesByStatus.map((status, index) => (
                            <motion.div
                                key={status.status}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">{statusLabels[status.status] || status.status}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {status.count} ({status.percentage.toFixed(1)}%)
                                    </span>
                                </div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${status.percentage}%` }}
                                        transition={{ delay: 0.4 + index * 0.05, duration: 0.8 }}
                                        className={cn('h-full', statusColors[status.status] || 'bg-gray-500')}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Top Artists */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span>🏆</span> Top Artists
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                            {data.topArtists.map((artist, index) => (
                                <motion.div
                                    key={artist.artist_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + index * 0.05 }}
                                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{artist.artist_email}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {artist.release_count} releases • {artist.published_count} published
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {artist.release_count}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Genre Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span>🎸</span> Popular Genres
                        </h3>
                        <div className="space-y-3">
                            {data.genreStats.slice(0, 10).map((genre, index) => (
                                <motion.div
                                    key={genre.genre}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + index * 0.05 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium truncate">{genre.genre}</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                            {genre.count} ({genre.percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${genre.percentage}%` }}
                                            transition={{ delay: 0.5 + index * 0.05, duration: 0.6 }}
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Release Trends */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8"
                >
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span>📈</span> Release Trends (Last 30 Days)
                    </h3>
                    <div className="flex items-end gap-2 h-64 overflow-x-auto">
                        {data.releaseTrends.slice().reverse().map((trend, index) => {
                            const height = (trend.count / maxTrendCount) * 100;
                            return (
                                <motion.div
                                    key={trend.date}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: 0.5 + index * 0.02, duration: 0.4 }}
                                    className="flex-1 min-w-[20px] bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg relative group cursor-pointer hover:from-indigo-600 hover:to-purple-600 transition-colors"
                                    title={`${new Date(trend.date).toLocaleDateString()}: ${trend.count} releases`}
                                >
                                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {trend.count}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        Hover over bars to see details
                    </div>
                </motion.div>

                {/* Recent Releases */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
                >
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span>🕒</span> Recent Activity
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {data.recentReleases.map((release, index) => (
                            <motion.div
                                key={release.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.03 }}
                                className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0">
                                    🎵
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate">{release.title}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                        {release.artist_email} • {release.genre}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        {release.track_count} track{release.track_count !== 1 ? 's' : ''} • {new Date(release.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={cn(
                                    'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                                    release.status === 'PUBLISHED' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                                    release.status === 'PENDING_REVIEW' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                                    release.status === 'REJECTED' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                                    release.status === 'PROCESSING' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                                    release.status === 'DRAFT' && 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                )}>
                                    {statusLabels[release.status] || release.status}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgb(156 163 175 / 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgb(156 163 175 / 0.7);
                }
            `}</style>
        </div>
    );
}
