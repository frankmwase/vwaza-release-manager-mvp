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

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || response.statusText);
    }

    return response.json();
}


// Will help to dynamically construct url depending on location
export function getMediaUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const token = localStorage.getItem('token');
    return `${API_URL}${path}?token=${token}`;
}
