import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function ReleaseWizard() {
    const [step, setStep] = useState(1);
    const [releaseId, setReleaseId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ title: '', genre: '' });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [tracks, setTracks] = useState<any[]>([]);
    const [uploadQueue, setUploadQueue] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    const handleCreateDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let coverUrl = null;
            if (coverFile) {
                const fd = new FormData();
                fd.append('file', coverFile);
                const res = await apiFetch('/upload/cover', { method: 'POST', body: fd });
                coverUrl = res.url;
            }

            const res = await apiFetch('/releases', {
                method: 'POST',
                body: JSON.stringify({ ...formData, cover_url: coverUrl })
            });
            setReleaseId(res.id);
            setStep(2);
        } catch (err) {
            alert('Failed to create draft');
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
            alert('Failed to submit release : ' + err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl p-8 rounded-lg shadow-lg">
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
                            <input type="file" accept="image/*" className="w-full mt-1 dark:text-gray-300" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
                        </div>
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Next: Upload Tracks</button>
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
                            <button disabled className="text-gray-400">Back</button>
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

                        <button onClick={handleSubmitRelease} className="w-full bg-indigo-600 text-white py-3 rounded text-lg font-bold hover:bg-indigo-700 mt-6">
                            Submit Release
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
