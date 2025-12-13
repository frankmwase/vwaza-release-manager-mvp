import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch, getMediaUrl } from '../lib/api';

export default function ReleaseDetails() {
    const { id } = useParams();
    const [release, setRelease] = useState<any>(null);

    useEffect(() => {
        if (id) {
            apiFetch(`/releases/${id}`)
                .then(setRelease)
                .catch(err => console.error('Failed to load release', err));
        }
    }, [id]);

    if (!release) return <div className="p-8 text-center">Loading...</div>;

    const isDraft = release.status === 'DRAFT';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Release Details</h1>
                    <Link to="/artist" className="text-indigo-600 hover:text-indigo-500">Back to Dashboard</Link>
                </div>

                <div className="p-8 flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/3">
                        {release.cover_url ? (
                            <img src={getMediaUrl(release.cover_url)} alt={release.title} className="w-full rounded shadow-lg" />
                        ) : (
                            <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded">
                                <span className="text-gray-400">No Cover Art</span>
                            </div>
                        )}
                        <div className="mt-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold 
                                ${release.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                                    release.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'}`}>
                                {release.status}
                            </span>
                        </div>
                    </div>

                    <div className="md:w-2/3 space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold">{release.title}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">{release.genre}</p>
                            <p className="text-sm text-gray-400 mt-1">Created on {new Date(release.created_at).toLocaleDateString()}</p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4">Tracks</h3>
                            {release.tracks && release.tracks.length > 0 ? (
                                <div className="space-y-3">
                                    {release.tracks.map((track: any) => (
                                        <div key={track.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <span className="font-medium">{track.title}</span>
                                            <audio controls src={getMediaUrl(track.audio_url)} className="h-8 w-full sm:w-auto" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No tracks uploaded yet.</p>
                            )}
                        </div>

                        {release.status === 'REJECTED' && release.reject_reason && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900">
                                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Rejection Feedback</h3>
                                <p className="text-gray-700 dark:text-gray-300">{release.reject_reason}</p>
                            </div>
                        )}

                        {isDraft && (
                            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-900">
                                <p className="mb-4">This release is still in draft mode.</p>
                                <Link to={`/artist/release/${release.id}/edit`} className="bg-yellow-600 text-white px-6 py-2 rounded font-bold hover:bg-yellow-700">
                                    Continue Editing
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
