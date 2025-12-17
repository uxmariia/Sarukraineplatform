import { useState } from 'react';
import { PageType, Toast } from '../../App';
import { supabase } from '../../utils/supabase/client';
import { apiRequest } from '../../utils/api';

type RegisterPageProps = {
  onRegister?: () => void;
  onPageChange: (page: PageType) => void;
  showToast?: (message: string, type: Toast['type']) => void;
};

export default function RegisterPage({ onPageChange, showToast }: RegisterPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
        showToast?.('Паролі не співпадають', 'error');
        return;
    }

    setLoading(true);
    
    console.log('[RegisterPage] Creating user via server:', email);
    
    try {
        // Use server endpoint to create user with auto-confirm
        const result = await apiRequest('/signup', 'POST', {
            email,
            password,
            name
        });

        console.log('[RegisterPage] ✓ User created:', result);
        showToast?.('Реєстрація успішна! Тепер увійдіть в систему.', 'success');
        
        // Auto-login after signup
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (!loginError) {
            console.log('[RegisterPage] ✓ Auto-login successful');
            onPageChange('cabinet');
        } else {
            console.warn('[RegisterPage] Auto-login failed:', loginError);
            onPageChange('login');
        }
    } catch (error: any) {
        console.error('[RegisterPage] Registration error:', error);
        showToast?.(error.message || 'Помилка реєстрації', 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-[480px] mx-auto px-6 py-[60px]">
      <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-3xl p-12 p-[24px]">
        <h1 className="text-4xl mb-2 text-center bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
          Реєстрація
        </h1>
        <p className="text-center text-slate-400 mb-8">Створіть новий обліковий запис</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm text-gray-200 mb-2">Ім'я та Прізвище</label>
            <input
              type="text"
              className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
              placeholder="Іван Петренко"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

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

          <div className="mb-5">
            <label className="block text-sm text-gray-200 mb-2">Підтвердження паролю</label>
            <input
              type="password"
              className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(99,102,241,0.5)] disabled:opacity-50"
          >
            {loading ? 'Реєстрація...' : 'Зареєструватися'}
          </button>
        </form>

        <div className="text-center mt-6 text-slate-400">
          Вже є обліковий запис?{' '}
          <button
            className="text-indigo-300 no-underline cursor-pointer bg-none border-none hover:text-indigo-200"
            onClick={() => onPageChange('login')}
          >
            Увійти
          </button>
        </div>
      </div>
    </div>
  );
}