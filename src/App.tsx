import { useState, useEffect } from 'react';
import Header from './components/Header';
import MobileMenu from './components/MobileMenu';
import LandingPage from './components/pages/LandingPage';
import CabinetPage from './components/pages/CabinetPage';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage';
import CompetitionsPage from './components/pages/CompetitionsPage';
import JudgesPage from './components/pages/JudgesPage';
import TeamsPage from './components/pages/TeamsPage';
import DocumentsPage from './components/pages/DocumentsPage';
import ResultsPage from './components/pages/ResultsPage';
import RatingPage from './components/pages/RatingPage';
import AdminPage from './components/pages/AdminPage';
import ManageCompetitionPage from './components/pages/ManageCompetitionPage';
import ToastContainer from './components/ToastContainer';
import { supabase } from './utils/supabase/client';
import { apiRequest } from './utils/api';
import { UserProfile } from './types';

export type PageType = 'landing' | 'cabinet' | 'login' | 'register' | 'forgot-password' | 'competitions' | 'judges' | 'teams' | 'documents' | 'results' | 'rating' | 'admin' | 'manage-competition';

export type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    console.log('[App] Initializing auth state...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[App] Error getting initial session:', error);
      }
      
      console.log('[App] Initial session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        email: session?.user?.email,
        tokenLength: session?.access_token?.length,
        tokenPreview: session?.access_token ? session.access_token.substring(0, 30) + '...' : 'N/A'
      });
      
      setIsLoggedIn(!!session);
      
      if (session?.access_token) {
        console.log('[App] ✓ Found valid session, fetching profile...');
        fetchProfile(session.access_token);
      } else {
        console.log('[App] No active session - user needs to login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[App] Auth state changed:', { 
        event, 
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      });
      
      setIsLoggedIn(!!session);
      
      if (session?.access_token) {
        console.log('[App] ✓ Session available, fetching profile...');
        fetchProfile(session.access_token);
      } else {
        console.log('[App] Session cleared');
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (token?: string) => {
    console.log('fetchProfile called with token:', !!token);
    
    try {
      // Always get fresh session if no token provided
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('No session available for profile fetch');
          return;
        }
        token = session.access_token;
      }
      
      const profile = await apiRequest('/profile', 'GET', undefined, token);
      setUserProfile(profile);
      console.log('Profile fetched successfully:', profile);
    } catch (e: any) {
      console.error('Profile fetch error:', e);
      // Only log and handle if it's truly an auth error (not just initial load without session)
      if (e.message && (e.message.includes('401') || e.message.includes('Unauthorized'))) {
          console.error('Profile fetch failed - unauthorized. Verifying session...');
          
          // Double check session before signing out
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
              console.error('No valid session found, signing out');
              await supabase.auth.signOut();
              setIsLoggedIn(false);
              setUserProfile(null);
          } else {
              console.log('Session still valid, retrying profile fetch...');
              // Retry once with fresh token
              setTimeout(() => fetchProfile(session.access_token), 1000);
          }
      } else if (e.message && e.message.includes('503')) {
          // Server is temporarily unavailable (likely restarting), retry after delay
          console.warn('Server temporarily unavailable (503), retrying in 2 seconds...');
          setTimeout(() => fetchProfile(token), 2000);
      } else {
          console.error('Profile fetch failed with unknown error:', e);
      }
    }
  };

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showPage = (page: PageType, param?: string) => {
    if ((page === 'cabinet' || page === 'rating' || page === 'admin') && !isLoggedIn) {
      showToast('Увійдіть, щоб переглянути цю сторінку', 'info');
      setCurrentPage('login');
      return;
    }
    if (page === 'admin' && userProfile?.role !== 'admin') {
      showToast('Доступ заборонно', 'error');
      return;
    }
    if (page === 'manage-competition' && param) {
        setSelectedCompetitionId(param);
    }
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = async () => {
     setCurrentPage('cabinet');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    showToast('Ви вийшли з системи', 'info');
    setCurrentPage('landing');
  };

  const goToHome = () => {
    setCurrentPage(isLoggedIn ? 'cabinet' : 'landing');
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-gray-200">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f1629]">
        <div className="absolute inset-0 animate-[rotate_30s_linear_infinite]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_50%)]" />
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="relative z-10">
        <Header
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
          currentPage={currentPage}
          onPageChange={showPage}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onHomeClick={goToHome}
        />

        <MobileMenu
          isOpen={mobileMenuOpen}
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
          currentPage={currentPage}
          onPageChange={showPage}
          onLogout={handleLogout}
        />

        {currentPage === 'landing' && <LandingPage onPageChange={showPage} isLoggedIn={isLoggedIn} />}
        {currentPage === 'cabinet' && (
             <CabinetPage 
                userProfile={userProfile} 
                setUserProfile={setUserProfile}
                onPageChange={showPage} 
                showToast={showToast} 
             />
        )}
        {currentPage === 'login' && <LoginPage onLogin={handleLogin} onPageChange={showPage} showToast={showToast} />}
        {currentPage === 'register' && <RegisterPage onPageChange={showPage} showToast={showToast} />}
        {currentPage === 'forgot-password' && <ForgotPasswordPage onPageChange={showPage} showToast={showToast} />}
        {currentPage === 'competitions' && <CompetitionsPage isLoggedIn={isLoggedIn} userProfile={userProfile} showToast={showToast} onPageChange={showPage} />}
        {currentPage === 'judges' && <JudgesPage userProfile={userProfile} showToast={showToast} />}
        {currentPage === 'teams' && <TeamsPage userProfile={userProfile} showToast={showToast} />}
        {currentPage === 'documents' && <DocumentsPage userProfile={userProfile} showToast={showToast} />}
        {currentPage === 'results' && <ResultsPage showToast={showToast} />}
        {currentPage === 'rating' && <RatingPage />}
        {currentPage === 'admin' && <AdminPage userProfile={userProfile} showToast={showToast} />}
        {currentPage === 'manage-competition' && selectedCompetitionId && (
            <ManageCompetitionPage 
                competitionId={selectedCompetitionId} 
                onBack={() => showPage('competitions')} 
                showToast={showToast} 
            />
        )}
      </div>
    </div>
  );
}