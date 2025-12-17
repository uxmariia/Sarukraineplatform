import { PageType } from '../../App';
import { Sparkles, Shield, Trophy, Scale, Users, FileText, Medal, BarChart3, ArrowRight, Mail, MessageCircle } from 'lucide-react';

type LandingPageProps = {
  onPageChange: (page: PageType) => void;
  isLoggedIn: boolean;
};

export default function LandingPage({ onPageChange, isLoggedIn }: LandingPageProps) {
  const checkLoginForRating = () => {
    if (!isLoggedIn) {
      alert('Увійдіть, щоб переглянути рейтинг');
    } else {
      onPageChange('rating');
    }
  };

  return (
    <>
      <section className="py-[120px] px-6 md:py-[80px] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] animate-[pulse_4s_ease-in-out_infinite]" />

        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl mb-6 bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent leading-tight">
            Платформа SAR Ukraine
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-[700px] mx-auto leading-relaxed">
            Єдина платформа для спортсменів пошуково-рятувальної кінологічної служби
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              className="px-[70px] py-[16px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-[10px] shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:translate-y-[-3px] hover:shadow-[0_15px_40px_rgba(99,102,241,0.6)]"
              onClick={() => onPageChange('login')}
            >
              Вхід <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="px-10 py-4 bg-[rgba(255,255,255,0.05)] text-white border-2 border-[rgba(99,102,241,0.3)] rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-[10px] hover:bg-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.5)] hover:translate-y-[-2px]"
              onClick={() => onPageChange('register')}
            >
              Зареєструватися
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 pb-[80px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-[0px] pr-[24px] pl-[24px]">
        {[
          { Icon: Trophy, title: 'Змагання', desc: 'Переглядайте майбутні змагання та реєструйтеся онлайн', page: 'competitions' as PageType },
          { Icon: Scale, title: 'Судді', desc: 'База всіх сертифікованих суддів SAR в Україні', page: 'judges' as PageType },
          { Icon: Users, title: 'Команди', desc: 'Знайдіть команди з пошуково-рятувальної кінології', page: 'teams' as PageType },
          { Icon: FileText, title: 'Документи', desc: 'Положення, регламенти та інші важливі документи', page: 'documents' as PageType },
          { Icon: Medal, title: 'Результати', desc: 'Результати минулих змагань', page: 'results' as PageType },
          { Icon: BarChart3, title: 'Рейтинг', desc: 'Рейтинг спортсменів (для зареєстрованих)', page: 'rating' as PageType, special: true },
        ].map((feature, idx) => (
          <div
            key={idx}
            className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-[20px] p-8 transition-all duration-[400ms] cursor-pointer relative overflow-hidden group hover:translate-y-[-8px] hover:bg-[rgba(30,41,59,0.8)] hover:border-[rgba(99,102,241,0.5)] hover:shadow-[0_20px_60px_rgba(99,102,241,0.3)]"
            onClick={() => feature.special ? checkLoginForRating() : onPageChange(feature.page)}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 transform scale-x-0 origin-left transition-transform duration-400 group-hover:scale-x-100" />
            
            <div className="w-14 h-14 bg-gradient-to-br from-[rgba(99,102,241,0.2)] to-[rgba(139,92,246,0.2)] rounded-[14px] flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-[5deg] group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:shadow-[0_8px_25px_rgba(99,102,241,0.5)]">
              <feature.Icon className="w-7 h-7 text-indigo-300 group-hover:text-white" />
            </div>

            <h3 className="text-white mb-3">{feature.title}</h3>
            <p className="text-slate-400 leading-relaxed mb-6">{feature.desc}</p>

            <div className="flex items-center gap-2 text-indigo-300 transition-all duration-300 group-hover:text-indigo-200 group-hover:gap-3">
              Перейти <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </section>

      <section className="max-w-[1100px] mx-auto px-6 pb-[80px] pt-[0px] pr-[24px] pl-[24px]">
        <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-3xl p-12 md:p-[60px] relative overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_70%)]" />

          <h2 className="text-4xl md:text-[40px] mb-7 text-center bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent relative">
            Про SAR
          </h2>

          <p className="text-slate-400 leading-relaxed mb-5 text-center relative">
            Пошуково-рятувальна кінологічна служба (SAR) - це спеціалізована дисципліна, де собаки та їх провідники працюють разом для пошуку та рятування людей.
          </p>

          <p className="text-slate-400 leading-relaxed text-center relative">
            Ця платформа створена для об'єднання спортсменів SAR по всій Україні, надання доступу до актуальної інформації про змагання, суддів, команди та рейтинги. Зареєструйтеся, щоб отримати повний доступ до всіх функцій.
          </p>
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 pb-[100px]">
        <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-3xl p-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageCircle className="w-6 h-6 text-white" />
            <h3 className="text-white">Технічна підтримка</h3>
          </div>
          <p className="text-slate-400 mb-6">
            Маєте питання щодо роботи платформи? Зв'яжіться з нами:
          </p>
          <a
            href="mailto:support@sar-ukraine.com"
            className="inline-flex items-center gap-3 px-7 py-[14px] bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)] rounded-xl text-indigo-300 no-underline transition-all duration-300 hover:bg-[rgba(99,102,241,0.25)] hover:border-[rgba(99,102,241,0.5)] hover:translate-y-[-2px]"
          >
            <Mail className="w-5 h-5" /> support@sar-ukraine.com
          </a>
        </div>
      </section>
    </>
  );
}