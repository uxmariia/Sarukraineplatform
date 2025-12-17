import { PageType } from '../../App';

type ForgotPasswordPageProps = {
  onPageChange: (page: PageType) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

export default function ForgotPasswordPage({ onPageChange, showToast }: ForgotPasswordPageProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Інструкції відправлено на ваш email', 'success');
    setTimeout(() => onPageChange('login'), 1500);
  };

  return (
    <div className="max-w-[480px] mx-auto px-6 py-[60px]">
      <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-3xl p-12 p-[24px]">
        <h1 className="text-4xl mb-2 text-center bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent text-[36px]">
          Відновлення паролю
        </h1>
        <p className="text-center text-slate-400 mb-8">Введіть ваш email для отримання інструкцій</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm text-gray-200 mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
              placeholder="your@email.com"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(99,102,241,0.5)]"
          >
            Відправити
          </button>
        </form>

        <div className="text-center mt-6 text-slate-400">
          Згадали пароль?{' '}
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
