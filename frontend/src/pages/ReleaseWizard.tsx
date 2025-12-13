import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch, getMediaUrl } from '../lib/api';

export default function ReleaseWizard() {
    const { id } = useParams();
    const [step, setStep] = useState(1);
    const [releaseId, setReleaseId] = useState<number | null>(id ? parseInt(id) : null);
    const [formData, setFormData] = useState({ title: '', genre: '' });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
    const [tracks, setTracks] = useState<any[]>([]);
    const [uploadQueue, setUploadQueue] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            apiFetch(`/releases/${id}`).then(data => {
                setReleaseId(data.id);
                setFormData({ title: data.title, genre: data.genre });
                setExistingCoverUrl(data.cover_url);
                setTracks(data.tracks || []);
                // If we have data, we might want to start at step 2 or 3 depending on completeness
                // For simplicity, let's default to step 2 if basic info exists, or step 3 if tracks exist
                if (data.tracks && data.tracks.length > 0) {
                    setStep(3);
                } else if (data.title) {
                    setStep(2);
                }
            }).catch(console.error);
        }
    }, [id]);

    const handleCreateDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let coverUrl = existingCoverUrl;
            if (coverFile) {
                const fd = new FormData();
                fd.append('file', coverFile);
                const res = await apiFetch('/upload/cover', { method: 'POST', body: fd });
                coverUrl = res.url;
            }

            // If we have an ID, we might need a textual UPDATE endpoint for title/genre later?
            // For now, if editing an existing draft, the wizard assumes step 1 is just confirmation or skipping if already done.
            // But if we want to support updating title/genre, we'd need a PUT /releases/:id endpoint which we didn't confirm exists for *editing* drafts fully.
            // But the user just asked to RESUME.
            // If resume, we probably skip creating a new draft if we already have an ID.

            if (releaseId) {
                // Optimization: Update details if changed? Current backend createDraft is POST.
                // We don't have a specific "update details" endpoint in the provided snippets (only updateStatus).
                // So we'll assume for resumption we just move to next step or we upload cover.
                // If cover was changed, we might want to save that. 
                // Let's just move to step 2 for now as "Create/Update" isn't fully separated.
                setStep(2);
                return;
            }

            const res = await apiFetch('/releases', {
                method: 'POST',
                body: JSON.stringify({ ...formData, cover_url: coverUrl })
            });
            setReleaseId(res.id);
            setStep(2);
        } catch (err) {
            alert('Failed to create/upate draft');
        }
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

    const handleSubmitRelease = async () => {
        if (!releaseId) return;
        try {
            await apiFetch(`/releases/${releaseId}/submit`, { method: 'PUT' });
            navigate('/artist');
        } catch (err) {
            console.log(err);
            // alert('Failed to submit release : ' + err); // Removed alert for cleaner UX
            console.error('Failed to submit release', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl p-8 rounded-lg shadow-lg relative">
                <button onClick={() => navigate('/artist')} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    ✕ Dashboard
                </button>

                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create New Release - Step {step}/3</h2>

                {step === 1 && (
                    <form onSubmit={handleCreateDraft} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Release Title</label>
                            <input type="text" className="w-full border p-2 rounded mt-1 dark:bg-gray-700 dark:text-white" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Genre</label>
                            <input type="text" className="w-full border p-2 rounded mt-1 dark:bg-gray-700 dark:text-white" value={formData.genre} onChange={e => setFormData({ ...formData, genre: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Cover Art</label>
                            {existingCoverUrl && (
                                <img src={getMediaUrl(existingCoverUrl)} alt="Current Cover" className="w-32 h-32 object-cover mb-2 rounded" />
                            )}
                            <input type="file" accept="image/*" className="w-full mt-1 dark:text-gray-300" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => navigate('/artist')} className="text-gray-500 hover:text-gray-700 px-4 py-2">Cancel</button>
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Next: Upload Tracks</button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <div className="space-y-4 text-gray-900 dark:text-white">
                        <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded">
                            <input type="file" multiple accept="audio/*" onChange={e => setUploadQueue(Array.from(e.target.files || []))} className="hidden" id="track-upload" />
                            <label htmlFor="track-upload" className="cursor-pointer text-indigo-500 hover:text-indigo-400">Click to select tracks</label>
                            <div className="mt-2 text-sm text-gray-500">{uploadQueue.length} files selected</div>
                        </div>

                        {uploadQueue.length > 0 && (
                            <button onClick={handleTrackUpload} disabled={isUploading} className="bg-green-600 text-white px-4 py-2 rounded">
                                {isUploading ? 'Uploading...' : 'Upload Selected Tracks'}
                            </button>
                        )}

                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Uploaded Tracks:</h3>
                            <ul className="list-disc pl-5">
                                {tracks.map(t => <li key={t.id}>{t.title}</li>)}
                            </ul>
                        </div>

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700 px-4 py-2 border rounded">Back</button>
                            <button onClick={() => setStep(3)} disabled={tracks.length === 0} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">Next: Review</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 text-gray-900 dark:text-white">
                        <h3 className="text-xl font-bold">{formData.title}</h3>
                        <p>Genre: {formData.genre}</p>
                        <div className="mt-4">
                            <h4 className="font-semibold">Tracks ({tracks.length})</h4>
                            <ul className="list-disc pl-5">
                                {tracks.map(t => <li key={t.id}>{t.title}</li>)}
                            </ul>
                        </div>

                        <p className="mt-4 text-sm text-gray-500">Upon submission, your release will be processed (simulated transcoding) and then sent for review.</p>

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-700 px-4 py-2 border rounded">Back</button>
                            <button onClick={handleSubmitRelease} className="bg-indigo-600 text-white px-6 py-2 rounded text-lg font-bold hover:bg-indigo-700">
                                Submit Release
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
