import { PageType } from '../App';
import { UserProfile } from '../types';
import { Trophy, Home, Scale, Users, FileText, Medal, BarChart3, Shield } from 'lucide-react';

type MobileMenuProps = {
  isOpen: boolean;
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  onLogout: () => void;
};

export default function MobileMenu({
  isOpen,
  isLoggedIn,
  userProfile,
  currentPage,
  onPageChange,
  onLogout,
}: MobileMenuProps) {
  if (!isOpen) return null;

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
    <div className="fixed top-[73px] left-0 right-0 bg-gradient-to-b from-[rgba(15,23,42,0.98)] to-[rgba(30,41,59,0.98)] backdrop-blur-[20px] p-5 border-b border-[rgba(99,102,241,0.3)] shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-[slideDown_0.3s_ease] z-[99] md:hidden">
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.page}
            className={`w-full justify-start px-[18px] py-[14px] rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-2 border
              ${
                currentPage === item.page
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent'
                  : 'bg-[rgba(30,41,59,0.6)] border-[rgba(99,102,241,0.2)] hover:bg-[rgba(99,102,241,0.2)] hover:border-[rgba(99,102,241,0.4)] text-slate-400'
              }`}
            onClick={() => onPageChange(item.page)}
          >
            <item.Icon className="w-4 h-4" /> {item.label}
          </button>
        ))}

        {isLoggedIn ? (
          <button
            className="block w-full mt-3 px-6 py-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-lg cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
            onClick={onLogout}
          >
            Вийти
          </button>
        ) : (
          <>
            <button
              className="block w-full mt-3 px-6 py-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-lg cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
              onClick={() => onPageChange('login')}
            >
              Увійти
            </button>
            <button
              className="block w-full mt-2 px-6 py-[10px] bg-[rgba(255,255,255,0.05)] text-white border-2 border-[rgba(99,102,241,0.3)] rounded-lg cursor-pointer transition-all duration-300 backdrop-blur-[10px]"
              onClick={() => onPageChange('register')}
            >
              Реєстрація
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
