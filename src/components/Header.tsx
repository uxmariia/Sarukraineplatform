import { PageType } from '../App';
import { UserProfile } from '../types';
import { Trophy, Home, Scale, Users, FileText, Medal, BarChart3, Menu, Shield } from 'lucide-react';

type HeaderProps = {
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  onLogout: () => void;
  onToggleMobileMenu: () => void;
  onHomeClick: () => void;
};

export default function Header({
  isLoggedIn,
  userProfile,
  currentPage,
  onPageChange,
  onLogout,
  onToggleMobileMenu,
  onHomeClick,
}: HeaderProps) {
  const navItems = isLoggedIn
    ? [
        { page: 'cabinet' as PageType, Icon: Home, label: 'Кабінет' },
        ...(userProfile?.role === 'admin' ? [{ page: 'admin' as PageType, Icon: Shield, label: 'Адмін' }] : []),
        { page: 'competitions' as PageType, Icon: Trophy, label: 'Змагання' },
        ...(userProfile?.role !== 'organizer' ? [
          { page: 'judges' as PageType, Icon: Scale, label: 'Судді' },
          { page: 'teams' as PageType, Icon: Users, label: 'Команди' }
        ] : []),
        { page: 'documents' as PageType, Icon: FileText, label: 'Документи' },
        { page: 'results' as PageType, Icon: Medal, label: 'Результати' },
        { page: 'rating' as PageType, Icon: BarChart3, label: 'Рейтинг' },
      ]
    : [
        { page: 'landing' as PageType, Icon: Home, label: 'Головна' },
        { page: 'competitions' as PageType, Icon: Trophy, label: 'Змагання' },
        { page: 'judges' as PageType, Icon: Scale, label: 'Судді' },
        { page: 'teams' as PageType, Icon: Users, label: 'Команди' },
        { page: 'documents' as PageType, Icon: FileText, label: 'Документи' },
        { page: 'results' as PageType, Icon: Medal, label: 'Результати' },
      ];

  return (
    <header className="bg-[rgba(15,23,42,0.8)] backdrop-blur-[20px] border-b border-[rgba(99,102,241,0.2)] py-4 sticky top-0 z-[100]">
      <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={onHomeClick}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[10px] flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.4)]">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="text-white">SAR Ukraine</span>
        </div>

        <button
          className="md:hidden bg-none border-none text-white cursor-pointer p-2"
          onClick={onToggleMobileMenu}
        >
          <Menu className="w-6 h-6" />
        </button>

        <nav className="hidden md:flex gap-1 items-center">
          {navItems.map((item) => (
            <button
              key={item.page}
              className={`px-[18px] py-[10px] rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-2 border-none relative
                ${
                  currentPage === item.page
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]'
                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-[rgba(99,102,241,0.1)]'
                }`}
              onClick={() => onPageChange(item.page)}
            >
              <item.Icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex gap-3 items-center">
          {isLoggedIn ? (
            <button
              className="px-6 py-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-lg cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_25px_rgba(99,102,241,0.5)]"
              onClick={onLogout}
            >
              Вийти
            </button>
          ) : (
            <>
              <button
                className="px-6 py-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-lg cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_25px_rgba(99,102,241,0.5)]"
                onClick={() => onPageChange('login')}
              >
                Увійти
              </button>
              <button
                className="px-6 py-[10px] bg-[rgba(255,255,255,0.05)] text-white border-2 border-[rgba(99,102,241,0.3)] rounded-lg cursor-pointer transition-all duration-300 backdrop-blur-[10px] hover:bg-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.5)] hover:translate-y-[-2px]"
                onClick={() => onPageChange('register')}
              >
                Реєстрація
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
