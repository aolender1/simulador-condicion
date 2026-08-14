import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

// Cliente de autenticación para React con hooks
export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL, {
    adapter: BetterAuthReactAdapter(),
});

// Obtiene el token de sesión actual (usado para verificar acceso en el servidor)
export const getSessionToken = async () => {
    try {
        const res = await authClient.getSession();
        return res?.data?.session?.token || null;
    } catch {
        return null;
    }
};

// Headers para llamadas autenticadas a la API (el servidor valida el token)
export const getAuthHeaders = async () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = await getSessionToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};
