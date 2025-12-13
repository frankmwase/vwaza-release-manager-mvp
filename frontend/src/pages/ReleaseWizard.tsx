import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch, getMediaUrl } from '../lib/api';

const GENRE_OPTIONS = [
    'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Blues',
    'Country', 'Reggae', 'Classical', 'Folk', 'Soul', 'Funk', 'Gospel', 'Other'
];

export default function ReleaseWizard() {
    const { id } = useParams();
    const [step, setStep] = useState(1);
    const [releaseId, setReleaseId] = useState<number | null>(id ? parseInt(id) : null);
    const [formData, setFormData] = useState({ title: '', genre: '' });
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
    const [tracks, setTracks] = useState<any[]>([]);
    const [uploadQueue, setUploadQueue] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isCreatingDraft, setIsCreatingDraft] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            apiFetch(`/releases/${id}`).then(data => {
                setReleaseId(data.id);
                setFormData({ title: data.title, genre: data.genre });
                // Parse comma-separated genres
                const genres = data.genre ? data.genre.split(',').map((g: string) => g.trim()) : [];
                setSelectedGenres(genres);
                setExistingCoverUrl(data.cover_url);
                setTracks(data.tracks || []);
                if (data.tracks && data.tracks.length > 0) {
                    setStep(3);
                } else if (data.title) {
                    setStep(2);
                }
            }).catch(console.error);
        }
    }, [id]);

    useEffect(() => {
        if (coverFile) {
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result as string);
            reader.readAsDataURL(coverFile);
        } else {
            setCoverPreview(null);
        }
    }, [coverFile]);

    const handleGenreToggle = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        );
    };

    const handleCreateDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedGenres.length === 0) {
            alert('Please select at least one genre');
            return;
        }

        if (isCreatingDraft) return; // Prevent double submission

        try {
            setIsCreatingDraft(true);
            let coverUrl = existingCoverUrl;
            if (coverFile) {
                const fd = new FormData();
                fd.append('file', coverFile);
                const res = await apiFetch('/upload/cover', { method: 'POST', body: fd });
                coverUrl = res.url;
            }

            if (releaseId) {
                // Already have a draft, just move to next step
                setStep(2);
                setIsCreatingDraft(false);
                return;
            }

            const genreString = selectedGenres.join(', ');
            const res = await apiFetch('/releases', {
                method: 'POST',
                body: JSON.stringify({ title: formData.title, genre: genreString, cover_url: coverUrl })
            });
            setReleaseId(res.id);
            setStep(2);
            setIsCreatingDraft(false);
        } catch (err) {
            alert('Failed to create/update draft');
            setIsCreatingDraft(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
        setUploadQueue(prev => [...prev, ...files]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setUploadQueue(prev => [...prev, ...files]);
    };

    const removeFromQueue = (index: number) => {
        setUploadQueue(prev => prev.filter((_, i) => i !== index));
    };

    const handleTrackUpload = async () => {
        if (!releaseId) return;
        setIsUploading(true);

        try {
            for (const file of uploadQueue) {
                const fd = new FormData();
                fd.append('file', file);
                const track = await apiFetch(`/releases/${releaseId}/tracks`, { method: 'POST', body: fd });
                setTracks(prev => [...prev, track]);
            }
            setUploadQueue([]);
            setIsUploading(false);
        } catch (err) {
            alert('Error uploading tracks');
            setIsUploading(false);
        }
    };

    const removeTrack = async (trackId: number) => {
        // Note: Backend doesn't have delete track endpoint, so we'll just remove from UI
        // In production, you'd want a DELETE /releases/:id/tracks/:trackId endpoint
        setTracks(prev => prev.filter(t => t.id !== trackId));
    };

    const handleSubmitRelease = async () => {
        if (!releaseId) return;
        try {
            await apiFetch(`/releases/${releaseId}/submit`, { method: 'PUT' });
            navigate('/artist');
        } catch (err) {
            console.error('Failed to submit release', err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-800 w-full max-w-3xl p-8 rounded-2xl shadow-2xl relative border border-gray-100 dark:border-gray-700">
                <button onClick={() => navigate('/artist')} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Create New Release</h2>
                    <div className="flex items-center gap-2 text-sm">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                    }`}>
                                    {s}
                                </div>
                                {s < 3 && <div className={`w-12 h-1 mx-1 ${step > s ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                {step === 1 && (
                    <form onSubmit={handleCreateDraft} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Release Title *</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Enter your release title"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Genres * (Select one or more)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {GENRE_OPTIONS.map(genre => (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => handleGenreToggle(genre)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedGenres.includes(genre)
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Cover Art</label>
                            <div className="flex items-start gap-4">
                                {(coverPreview || existingCoverUrl) && (
                                    <img
                                        src={coverPreview || getMediaUrl(existingCoverUrl!)}
                                        alt="Cover Preview"
                                        className="w-32 h-32 object-cover rounded-lg shadow-md"
                                    />
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="cover-upload"
                                        onChange={e => setCoverFile(e.target.files?.[0] || null)}
                                    />
                                    <label
                                        htmlFor="cover-upload"
                                        className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition shadow-sm"
                                    >
                                        📷 {coverFile || existingCoverUrl ? 'Change Cover Art' : 'Select Cover Art'}
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">Recommended: 3000x3000px, JPG or PNG</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => navigate('/artist')} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreatingDraft}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingDraft ? '⏳ Creating...' : 'Next: Upload Tracks →'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <div className="space-y-6 text-gray-900 dark:text-white">
                        <div
                            className={`border-3 border-dashed rounded-xl p-12 text-center transition ${isDragging
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="text-6xl mb-4">🎵</div>
                            <input
                                type="file"
                                multiple
                                accept="audio/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="track-upload"
                            />
                            <label
                                htmlFor="track-upload"
                                className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-lg font-bold cursor-pointer hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition transform hover:-translate-y-0.5 text-lg"
                            >
                                🎧 Select Audio Files
                            </label>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">or drag and drop audio files here</p>
                            <p className="text-sm text-gray-500 mt-2">Supported: MP3, WAV, FLAC, AAC</p>
                        </div>

                        {uploadQueue.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-300">Ready to Upload ({uploadQueue.length})</h3>
                                <div className="space-y-2 mb-4">
                                    {uploadQueue.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                                            <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                                            <button
                                                onClick={() => removeFromQueue(idx)}
                                                className="ml-2 text-red-500 hover:text-red-700 transition"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleTrackUpload}
                                    disabled={isUploading}
                                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition"
                                >
                                    {isUploading ? '⏳ Uploading...' : '✓ Upload All Tracks'}
                                </button>
                            </div>
                        )}

                        {tracks.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                <h3 className="font-semibold mb-3 text-green-900 dark:text-green-300">Uploaded Tracks ({tracks.length})</h3>
                                <div className="space-y-2">
                                    {tracks.map(t => (
                                        <div key={t.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                                            <span className="text-sm font-medium">✓ {t.title}</span>
                                            <button
                                                onClick={() => removeTrack(t.id)}
                                                className="text-red-500 hover:text-red-700 text-sm transition"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(1)} className="px-6 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                ← Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={tracks.length === 0}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/30 transition transform hover:-translate-y-0.5"
                            >
                                Next: Review & Submit →
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 text-gray-900 dark:text-white">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <h3 className="text-2xl font-bold mb-2">{formData.title}</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedGenres.map(genre => (
                                    <span key={genre} className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                            {(coverPreview || existingCoverUrl) && (
                                <img
                                    src={coverPreview || getMediaUrl(existingCoverUrl!)}
                                    alt="Cover"
                                    className="w-48 h-48 object-cover rounded-lg shadow-lg"
                                />
                            )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                            <h4 className="font-bold text-lg mb-4">Tracks ({tracks.length})</h4>
                            <div className="space-y-2">
                                {tracks.map((t, idx) => (
                                    <div key={t.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                                        <span className="text-gray-500 font-mono text-sm">{idx + 1}.</span>
                                        <span className="flex-1 font-medium">{t.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                ℹ️ Upon submission, your release will be processed and sent for admin review.
                            </p>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(2)} className="px-6 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmitRelease}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-lg text-lg font-bold hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-indigo-500/50 transition transform hover:-translate-y-1"
                            >
                                🚀 Submit Release
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
