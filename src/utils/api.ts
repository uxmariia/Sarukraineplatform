import { supabase } from './supabase/client';
import { supabaseUrl, publicAnonKey } from './supabase/info';

const API_URL = `${supabaseUrl}/functions/v1/make-server-5f926218`;

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/competitions', // GET /competitions - list all
  '/judges',       // GET /judges - list all
  '/teams',        // GET /teams - list all
  '/documents',    // GET /documents - list all
  '/signup',       // POST /signup
  '/rating'        // GET /rating - list rating
];

const PUBLIC_ENDPOINT_PATTERNS = [
  /^\/competitions\/[^\/]+\/results$/, // GET /competitions/:id/results
];

const isPublicEndpoint = (endpoint: string, method: string = 'GET'): boolean => {
  // Check exact matches for collection endpoints (GET only)
  if (method === 'GET' && PUBLIC_ENDPOINTS.includes(endpoint)) {
    return true;
  }
  
  // Check signup endpoint (POST)
  if (endpoint === '/signup' && method === 'POST') {
    return true;
  }
  
  // Check pattern matches (e.g., /competitions/:id/results)
  return PUBLIC_ENDPOINT_PATTERNS.some(pattern => pattern.test(endpoint));
};

export const apiRequest = async (endpoint: string, method = 'GET', body?: any, token?: string) => {
  console.log(`[apiRequest] Starting request to ${endpoint}`, { method, hasBody: !!body, hasToken: !!token });
  
  const isPublic = isPublicEndpoint(endpoint, method);
  
  if (!token && !isPublic) {
    // Try to get session token only for protected endpoints
    console.log('[apiRequest] No token provided, attempting to get session...');
    
    try {
      // First, try getSession
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[apiRequest] Error getting session:', sessionError);
      }
      
      if (session?.access_token) {
        token = session.access_token;
        console.log('[apiRequest] ✓ Got token from getSession');
      } else {
        // If no session, try refreshing
        console.log('[apiRequest] No session found, trying to refresh...');
        
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('[apiRequest] Error refreshing session:', refreshError);
            // Clear corrupted session
            await supabase.auth.signOut({ scope: 'local' });
          }
          
          if (refreshedSession?.access_token) {
            token = refreshedSession.access_token;
            console.log('[apiRequest] ✓ Got token from refreshSession');
          } else {
            console.error('[apiRequest] CRITICAL: No token available after all attempts for', endpoint);
            console.log('[apiRequest] User needs to log in again');
          }
        } catch (refreshErr) {
          console.error('[apiRequest] Refresh session threw error:', refreshErr);
          // Clear corrupted session
          await supabase.auth.signOut({ scope: 'local' });
        }
      }
    } catch (err) {
      console.error('[apiRequest] Unexpected error in session handling:', err);
      await supabase.auth.signOut({ scope: 'local' });
    }
  } else if (isPublic && !token) {
    console.log('[apiRequest] ℹ️ Public endpoint, using ANON_KEY');
  } else if (token) {
    console.log('[apiRequest] ✓ Using provided token for', endpoint);
  }

  const authValue = token || publicAnonKey;
  const isUsingAnonKey = authValue === publicAnonKey;
  
  if (!isPublic) {
    console.log('[apiRequest] Authorization type:', isUsingAnonKey ? '⚠️ ANON_KEY (no auth)' : '✓ USER_TOKEN');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authValue}`,
  };

  console.log('[apiRequest] Making request to', `${API_URL}${endpoint}`);

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log('[apiRequest] Response status:', response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('[apiRequest] ❌ Request failed:', { 
      endpoint, 
      status: response.status, 
      error,
      wasUsingAnonKey: isUsingAnonKey
    });
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  console.log('[apiRequest] ✓ Request successful for', endpoint);
  return response.json();
};