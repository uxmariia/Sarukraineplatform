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
      <div className="bg-white shadow-sm rounded-3xl p-12 p-[24px]">
        <h1 className="text-4xl mb-2 text-center text-gray-900 text-[36px] font-semibold">
          Відновлення паролю
        </h1>
        <p className="text-center text-gray-600 mb-8">Введіть ваш email для отримання інструкцій</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm text-gray-900 mb-2 font-medium">Email</label>
            <input
              type="email"
              className="w-full px-4 py-[14px] bg-white border border-gray-300 rounded-[10px] text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF]"
              placeholder="your@email.com"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-4 bg-[#007AFF] hover:bg-[#0066CC] text-white border-none rounded-xl cursor-pointer transition-all duration-300"
          >
            Відправити
          </button>
        </form>

        <div className="text-center mt-6 text-gray-600">
          Згадали пароль?{' '}
          <button
            className="text-[#007AFF] no-underline cursor-pointer bg-none border-none hover:text-[#0066CC]"
            onClick={() => onPageChange('login')}
          >
            Увійти
          </button>
        </div>
      </div>
    </div>
  );
}