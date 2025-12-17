import { useState, useEffect } from 'react';
import { Dog, UserProfile } from '../../types';
import { PageType } from '../../App';
import DogModal from '../DogModal';
import { ClipboardList, ArrowRight, Plus, Mail, MessageCircle, Calendar, MapPin, Trophy, Paperclip } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { supabase } from '../../utils/supabase/client';

type CabinetPageProps = {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  onPageChange: (page: PageType) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

export default function CabinetPage({ userProfile, setUserProfile, onPageChange, showToast }: CabinetPageProps) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'registrations' | 'dogs' | 'profile'>('registrations');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDogId, setEditingDogId] = useState<string | null>(null);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
      name: '',
      phone: '',
      city: '',
      club: '',
      team: ''
  });

  useEffect(() => {
    // Don't fetch data if user profile is not loaded yet
    if (!userProfile) return;
    
    fetchDogs();
    fetchRegistrations();
    fetchTeams();
    setProfileForm({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        city: userProfile.city || '',
        club: userProfile.club || '',
        team: userProfile.team || ''
    });
  }, [userProfile]);

  const fetchDogs = async () => {
    try {
        const data = await apiRequest('/dogs');
        setDogs(data);
    } catch (e) {
        console.error(e);
    }
  };

  const fetchRegistrations = async () => {
    try {
        const data = await apiRequest('/profile/registrations');
        setRegistrations(data);
    } catch (e) {
        console.error(e);
    }
  };

  const fetchTeams = async () => {
    try {
        const data = await apiRequest('/teams');
        setTeams(data || []);
    } catch (e) {
        console.error(e);
        setTeams([]);
    }
  };

  const openDogModal = (dogId?: string) => {
    setEditingDogId(dogId || null);
    setModalOpen(true);
  };

  const closeDogModal = () => {
    setModalOpen(false);
    setEditingDogId(null);
  };

  const saveDog = async (dogData: Omit<Dog, 'id'>) => {
    try {
        if (editingDogId) {
          const updated = await apiRequest(`/dogs/${editingDogId}`, 'PUT', dogData);
          setDogs(dogs.map(d => d.id === editingDogId ? updated : d));
          showToast('Собаку оновлено!', 'success');
        } else {
          const newDog = await apiRequest('/dogs', 'POST', dogData);
          setDogs([...dogs, newDog]);
          showToast('Собаку додано!', 'success');
        }
        closeDogModal();
    } catch (e) {
        showToast('Помилка збереження', 'error');
    }
  };

  const deleteDog = async (dogId: string) => {
    if (confirm('Ви впевнені, що хочете видалити цю собаку?')) {
      try {
          await apiRequest(`/dogs/${dogId}`, 'DELETE');
          setDogs(dogs.filter(d => d.id !== dogId));
          showToast('Собаку видалено', 'success');
      } catch (e) {
          showToast('Помилка видалення', 'error');
      }
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const updated = await apiRequest('/profile', 'POST', profileForm);
        setUserProfile(updated);
        showToast('Профіль успішно оновлено!', 'success');
    } catch (e) {
        showToast('Помилка оновлення профілю', 'error');
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const password = (form.elements.namedItem('new_password') as HTMLInputElement).value;
    const confirm = (form.elements.namedItem('confirm_password') as HTMLInputElement).value;
    
    if (password !== confirm) {
        showToast('Паролі не співпадають', 'error');
        return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        showToast(error.message, 'error');
    } else {
        showToast('Пароль успішно змінено!', 'success');
        form.reset();
    }
  };

  // Determine visible tabs based on role
  const tabs = [
    ...(userProfile?.role === 'user' ? [
        { id: 'registrations', label: 'Мої реєстрації' },
        { id: 'dogs', label: 'Мої собаки' }
    ] : []),
    { id: 'profile', label: 'Мій профіль' },
  ];

  // Set default active section if current one is hidden
  useEffect(() => {
    if ((userProfile?.role === 'organizer' || userProfile?.role === 'admin') && (activeSection === 'registrations' || activeSection === 'dogs')) {
        setActiveSection('profile');
    }
  }, [userProfile, activeSection]);

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-6 py-[60px]">
        <div className="mb-12 text-left">
          <h1 className="text-5xl md:text-[48px] mb-2 bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
            Мій кабінет
          </h1>
          <p className="text-lg text-slate-400">Керування вашим профілем та даними</p>
        </div>

        <div className="flex gap-3 mb-8 flex-wrap border-b-2 border-[rgba(99,102,241,0.2)] pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-6 py-3 bg-transparent border-none border-b-[3px] cursor-pointer transition-all duration-300 mb-[-2px] text-base ${
                activeSection === tab.id
                  ? 'text-white border-b-indigo-500'
                  : 'text-slate-400 border-b-transparent hover:text-white'
              }`}
              onClick={() => setActiveSection(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSection === 'registrations' && (
          registrations.length === 0 ? (
          <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border-2 border-dashed border-[rgba(99,102,241,0.3)] rounded-[20px] p-[100px_40px] text-center">
            <ClipboardList className="w-16 h-16 mx-auto mb-5 opacity-50 text-slate-500" />
            <p className="text-lg text-slate-500 mb-6">Ви ще не реєструвалися на жодні змагання</p>
            <button
              className="mt-5 px-10 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-2 mx-auto shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:translate-y-[-3px] hover:shadow-[0_15px_40px_rgba(99,102,241,0.6)] text-base"
              onClick={() => onPageChange('competitions')}
            >
              Дивитись актуальні змагання <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          ) : (
            <div className="grid gap-4">
                {registrations.map((reg, idx) => (
                    <div key={idx} className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-center transition-all hover:border-[rgba(99,102,241,0.5)]">
                        <div className="flex-1">
                            <h3 className="text-xl text-white font-bold mb-2 font-normal text-[24px]">{reg.competitionName}</h3>
                            <div className="text-slate-400 text-base flex flex-wrap gap-4 mb-3">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(reg.startDate).toLocaleDateString('uk-UA')}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    {reg.location}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-base">
                                <span className="bg-slate-800/50 px-3 py-1 rounded-lg text-slate-300 border border-slate-700/50 flex items-center gap-1.5">
                                    <ClipboardList className="w-4 h-4" />
                                    {reg.dogName}
                                </span>
                                {(reg.class || reg.className || reg.participationClass) && (
                                    <span className="bg-purple-500/20 px-3 py-1 rounded-lg text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                                        Клас: {reg.class || reg.className || reg.participationClass}
                                    </span>
                                )}
                                {reg.category && (
                                    <span className="bg-indigo-500/20 px-3 py-1 rounded-lg text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                                        <Trophy className="w-4 h-4" />
                                        {reg.category}
                                    </span>
                                )}
                                {reg.documents && reg.documents.length > 0 && (
                                    <span className="bg-green-500/10 px-3 py-1 rounded-lg text-green-400 border border-green-500/20 flex items-center gap-1.5">
                                        <Paperclip className="w-4 h-4" />
                                        Документи: {reg.documents.length}
                                    </span>
                                )}
                            </div>
                            {reg.status === 'rejected' && reg.notes && (
                                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-base text-red-300">
                                    <strong>Причина відмови:</strong> {reg.notes}
                                </div>
                            )}
                        </div>
                        <div className="w-full md:w-auto text-center md:text-right">
                            <span className={`inline-block px-4 py-2 rounded-xl text-base font-medium border ${
                                reg.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                reg.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}>
                                {reg.status === 'confirmed' ? 'Підтверджено' : 
                                 reg.status === 'rejected' ? 'Відхилено' : 'Очікує підтвердження'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
          )
        )}

        {activeSection === 'dogs' && (
          <>
            <button
              className="mb-6 px-7 py-[14px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-[10px] cursor-pointer transition-all duration-300 inline-flex items-center gap-2 hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] text-base"
              onClick={() => openDogModal()}
            >
              <Plus className="w-4 h-4" /> Додати собаку
            </button>

            {dogs.length === 0 ? (
              <p className="text-slate-400 text-center py-10 text-base">Ви ще не додали жодної собаки</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dogs.map(dog => (
                  <div
                    key={dog.id}
                    className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-2xl p-6 transition-all duration-300 hover:border-[rgba(99,102,241,0.5)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)]"
                  >
                    <h3 className="text-white mb-4 text-xl">{dog.name}</h3>
                    <div className="text-base text-slate-400 leading-relaxed mb-4">
                      <p className="my-2"><strong>Дата народження:</strong> {new Date(dog.birth).toLocaleDateString('uk-UA')}</p>
                      <p className="my-2"><strong>Стать:</strong> {dog.gender === 'male' ? 'Кобель' : 'Сука'}</p>
                      <p className="my-2"><strong>Родовід:</strong> {dog.pedigree}</p>
                      <p className="my-2"><strong>Чіп/клеймо:</strong> {dog.chip}</p>
                      {dog.workbook && <p className="my-2"><strong>Робоча книжка:</strong> {dog.workbook}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-[10px] py-[10px] border-none rounded-lg cursor-pointer transition-all duration-300 bg-[rgba(99,102,241,0.15)] text-indigo-300 hover:bg-[rgba(99,102,241,0.25)] text-base"
                        onClick={() => openDogModal(dog.id)}
                      >
                        Редагувати
                      </button>
                      <button
                        className="flex-1 px-[10px] py-[10px] border-none rounded-lg cursor-pointer transition-all duration-300 bg-[rgba(239,68,68,0.15)] text-red-300 hover:bg-[rgba(239,68,68,0.25)] text-base"
                        onClick={() => deleteDog(dog.id)}
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeSection === 'profile' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-2xl p-8 p-[24px]">
                <h3 className="text-white mb-6 text-xl">Особисті дані</h3>
                <form onSubmit={saveProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-base text-gray-200 mb-2">Ім'я і прізвище</label>
                      <input
                        type="text"
                        className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                        value={profileForm.name}
                        onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-base text-gray-200 mb-2">Телефон</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                        placeholder="+380"
                        value={profileForm.phone}
                        onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                        <label className="block text-base text-gray-200 mb-2">Місто</label>
                        <input
                            type="text"
                            className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                            placeholder="Київ"
                            value={profileForm.city}
                            onChange={e => setProfileForm({...profileForm, city: e.target.value})}
                        />
                    </div>
                    <div>
                      <label className="block text-base text-gray-200 mb-2">Команда</label>
                      <select
                         className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base cursor-pointer"
                         value={profileForm.team}
                         onChange={e => setProfileForm({...profileForm, team: e.target.value})}
                      >
                        <option value="" className="bg-slate-900">Оберіть команду</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.name} className="bg-slate-900">
                            {team.name}
                          </option>
                        ))}
                        <option value="Команди немає в списку" className="bg-slate-900">Команди немає в списку</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-5">
                     <label className="block text-base text-gray-200 mb-2">Кінологічний клуб КСУ</label>
                      <input
                        type="text"
                        className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                        placeholder="Назва клубу"
                        value={profileForm.club}
                        onChange={e => setProfileForm({...profileForm, club: e.target.value})}
                      />
                  </div>
                  <div className="mb-5">
                    <label className="block text-base text-gray-200 mb-2">Email (не можна змінити)</label>
                    <input
                      type="email"
                      className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 opacity-60 cursor-not-allowed text-base"
                      value={userProfile?.email || ''}
                      disabled
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 mt-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(99,102,241,0.5)] text-base"
                  >
                    Зберегти зміни
                  </button>
                </form>
              </div>

              <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-2xl p-8 p-[24px]">
                <h3 className="text-white mb-6 text-xl">Зміна пароля</h3>
                <form onSubmit={changePassword}>
                  <div className="mb-5">
                    <label className="block text-base text-gray-200 mb-2">Новий пароль</label>
                    <input
                      name="new_password"
                      type="password"
                      className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                      required
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block text-base text-gray-200 mb-2">Підтвердження нового пароля</label>
                    <input
                      name="confirm_password"
                      type="password"
                      className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 mt-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(99,102,241,0.5)] text-base"
                  >
                    Змінити пароль
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-8">
              <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-3xl p-12 text-center px-[24px] py-[48px]">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                  <h3 className="text-white text-xl">Технічна підтримка</h3>
                </div>
                <p className="text-slate-400 mb-6 text-base">
                  Маєте питання щодо роботи платформи? Зв'яжіться з нами:
                </p>
                <a
                  href="mailto:support@sar-ukraine.com"
                  className="inline-flex items-center gap-3 px-7 py-[14px] bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)] rounded-xl text-indigo-300 no-underline transition-all duration-300 hover:bg-[rgba(99,102,241,0.25)] hover:border-[rgba(99,102,241,0.5)] hover:translate-y-[-2px] text-base"
                >
                  <Mail className="w-5 h-5" /> support@sar-ukraine.com
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      <DogModal
        isOpen={modalOpen}
        onClose={closeDogModal}
        onSave={saveDog}
        editingDog={editingDogId ? dogs.find(d => d.id === editingDogId) : undefined}
      />
    </>
  );
}