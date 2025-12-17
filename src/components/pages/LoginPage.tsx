import { useState } from 'react';
import { PageType, Toast } from '../../App';
import { supabase } from '../../utils/supabase/client';

type LoginPageProps = {
  onLogin: () => void;
  onPageChange: (page: PageType) => void;
  showToast?: (message: string, type: Toast['type']) => void;
};

export default function LoginPage({ onLogin, onPageChange, showToast }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('[LoginPage] Attempting login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('[LoginPage] Login error:', error);
        showToast?.(error.message, 'error');
    } else {
        console.log('[LoginPage] ✓ Login successful!', {
          userId: data.user?.id,
          email: data.user?.email,
          hasSession: !!data.session,
          hasAccessToken: !!data.session?.access_token,
          tokenLength: data.session?.access_token?.length
        });
        
        // Verify session is stored
        setTimeout(async () => {
          const { data: checkData } = await supabase.auth.getSession();
          console.log('[LoginPage] Session check after login:', {
            hasSession: !!checkData.session,
            userId: checkData.session?.user?.id
          });
        }, 100);
        
        showToast?.('Успішний вхід', 'success');
        onLogin();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-[480px] mx-auto px-6 py-[60px]">
      <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-3xl p-12 p-[24px]">
        <h1 className="text-4xl mb-2 text-center bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
          Вхід
        </h1>
        <p className="text-center text-slate-400 mb-8">Увійдіть до свого облікового запису</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm text-gray-200 mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm text-gray-200 mb-2">Пароль</label>
            <input
              type="password"
              className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="text-right mt-2">
            <button
              type="button"
              className="text-indigo-300 no-underline text-sm cursor-pointer bg-none border-none hover:text-indigo-200"
              onClick={() => onPageChange('forgot-password')}
            >
              Забули пароль?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 mt-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>

        <div className="text-center mt-6 text-slate-400">
          Немає облікового запису?{' '}
          <button
            className="text-indigo-300 no-underline cursor-pointer bg-none border-none hover:text-indigo-200"
            onClick={() => onPageChange('register')}
          >
            Зареєструватися
          </button>
        </div>
      </div>
    </div>
  );
}