import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

// Cliente de autenticación para React con hooks
export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL, {
    adapter: BetterAuthReactAdapter(),
});
