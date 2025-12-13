export const API_URL = 'http://localhost:3000';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    // If sending FormData, remove Content-Type to let browser set boundary
    if (options.body instanceof FormData) {
        delete (headers as any)['Content-Type'];
    }

    // If no body is provided, do not send Content-Type: application/json
    // This prevents Fastify from throwing 'FST_ERR_CTP_EMPTY_JSON_BODY'
    if (!options.body) {
        delete (headers as any)['Content-Type'];
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: 'Request failed' };
            }

            const message = errorData.message || response.statusText;

            // Dispatch global error event for the Toast system
            window.dispatchEvent(new CustomEvent('vwaza-toast', {
                detail: { message, type: 'error' }
            }));

            throw new Error(message);
        }

        if (response.status === 204) return;
        return response.json();

    } catch (err: any) {
        // Handle network errors (where fetch throws)
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
            window.dispatchEvent(new CustomEvent('vwaza-toast', {
                detail: { message: 'Network connection error', type: 'error' }
            }));
        }
        throw err;
    }
}


// Will help to dynamically construct url depending on location
export function getMediaUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const token = localStorage.getItem('token');
    return `${API_URL}${path}?token=${token}`;
}
