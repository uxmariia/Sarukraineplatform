import { supabase } from './supabase/client';
import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-5f926218`;

export const apiRequest = async (endpoint: string, method = 'GET', body?: any, token?: string) => {
  console.log(`[apiRequest] Starting request to ${endpoint}`, { method, hasBody: !!body, hasToken: !!token });
  
  if (!token) {
    // Try to get session token, with retry logic for race conditions
    let retries = 3;
    let session = null;
    
    while (retries > 0 && !session) {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[apiRequest] Error getting session:', error);
      }
      
      session = data.session;
      
      if (!session && retries > 1) {
        console.warn(`[apiRequest] No session found, retrying... (${retries - 1} retries left)`);
        // Wait a bit for session to be ready
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      retries--;
    }
    
    token = session?.access_token;
    
    if (!token) {
      console.error('[apiRequest] CRITICAL: No token available after all retries for', endpoint);
      console.log('[apiRequest] Session state:', session ? 'Session exists but no token' : 'No session');
    } else {
      console.log('[apiRequest] ✓ Got token from session for', endpoint);
      console.log('[apiRequest] Token preview:', token.substring(0, 30) + '...');
      console.log('[apiRequest] Token length:', token.length);
    }
  } else {
    console.log('[apiRequest] ✓ Using provided token for', endpoint);
  }

  const authValue = token || publicAnonKey;
  const isUsingAnonKey = authValue === publicAnonKey;
  
  console.log('[apiRequest] Authorization type:', isUsingAnonKey ? '⚠️ ANON_KEY (no auth)' : '✓ USER_TOKEN');

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
    // If 401, unexpected logout might have happened
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