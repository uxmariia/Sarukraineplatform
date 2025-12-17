import { useState, useEffect } from 'react';
import { Trophy, Plus, Calendar, MapPin, Users, Edit, Trash2, Settings, AlertTriangle, Upload, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { Competition, UserProfile, Dog } from '../../types';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';
import CompetitionModal from '../CompetitionModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type CompetitionsPageProps = {
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  showToast: (msg: string, type: any) => void;
};

export default function CompetitionsPage({ isLoggedIn, userProfile, showToast, onPageChange }: CompetitionsPageProps & { onPageChange: (page: any, param?: string) => void }) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [selectedCompForEdit, setSelectedCompForEdit] = useState<Competition | undefined>(undefined);
  const [userDogs, setUserDogs] = useState<Dog[]>([]);
  const [selectedDogId, setSelectedDogId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [registerFiles, setRegisterFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [compToDelete, setCompToDelete] = useState<string | null>(null);

  const isOrganizer = userProfile?.role === 'organizer' || userProfile?.role === 'admin';

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const data = await apiRequest('/competitions');
      setCompetitions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      if (selectedCompForEdit) {
         const updatedComp = await apiRequest(`/competitions/${selectedCompForEdit.id}`, 'PUT', data);
         setCompetitions(competitions.map(c => c.id === updatedComp.id ? updatedComp : c));
         showToast('Змагання оновлено!', 'success');
      } else {
         const newComp = await apiRequest('/competitions', 'POST', data);
         setCompetitions([...competitions, newComp]);
         showToast('Змагання створено!', 'success');
      }
      setIsModalOpen(false);
      setSelectedCompForEdit(undefined);
    } catch (e) {
      showToast('Помилка збереження', 'error');
    }
  };

  const handleDeleteClick = (id: string) => {
      setCompToDelete(id);
      setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
      if (!compToDelete) return;
      try {
          await apiRequest(`/competitions/${compToDelete}`, 'DELETE');
          setCompetitions(competitions.filter(c => c.id !== compToDelete));
          showToast('Змагання видалено', 'success');
      } catch (e) {
          showToast('Помилка видалення', 'error');
      } finally {
          setDeleteConfirmOpen(false);
          setCompToDelete(null);
      }
  };

  const openRegister = async (compId: string) => {
      if (!isLoggedIn) {
          showToast('Спочатку увійдіть', 'info');
          return;
      }
      if (userProfile?.role === 'organizer') return;

      setSelectedCompId(compId);
      try {
          const dogs = await apiRequest('/dogs');
          setUserDogs(dogs);
          if (dogs.length === 0) {
              showToast('Додайте собаку в кабінеті перед реєстрацією', 'info');
          } else {
              setRegisterModalOpen(true);
              setSelectedDogId(dogs[0].id);
              setSelectedCategory('');
              setRegisterFiles([]);
          }
      } catch (e) {
          showToast('Помилка отримання даних', 'error');
      }
  };

  const handleRegister = async () => {
      if (!selectedCategory) {
          showToast('Оберіть клас участі', 'error');
          return;
      }

      setUploading(true);
      try {
          const uploadedDocs: string[] = [];
          
          if (registerFiles.length > 0) {
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;

              for (const file of registerFiles) {
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5f926218/upload`, {
                      method: 'POST',
                      headers: {
                          'Authorization': `Bearer ${token || publicAnonKey}`
                      },
                      body: formData
                  });
                  
                  if (!response.ok) {
                      throw new Error('Не вдалося завантажити документи');
                  }
                  
                  const data = await response.json();
                  uploadedDocs.push(data.path);
              }
          }

          await apiRequest(`/competitions/${selectedCompId}/register`, 'POST', { 
              dogId: selectedDogId,
              category: selectedCategory,
              documents: uploadedDocs
          });
          
          showToast('Ви успішно зареєструвалися!', 'success');
          setRegisterModalOpen(false);
          fetchCompetitions();
      } catch (e: any) {
          showToast(e.message || 'Помилка реєстрації', 'error');
      } finally {
          setUploading(false);
      }
  };
  
  const formatDate = (dateString?: string, endDateString?: string) => {
      if (!dateString) return 'Дата не визначена';
      const start = new Date(dateString).toLocaleDateString('uk-UA');
      if (endDateString) {
          const end = new Date(endDateString).toLocaleDateString('uk-UA');
          return `${start} - ${end}`;
      }
      return start;
  };

  const openEdit = (comp: Competition) => {
      setSelectedCompForEdit(comp);
      setIsModalOpen(true);
  };

  const openManage = (comp: Competition) => {
      onPageChange('manage-competition', comp.id);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-[60px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
        <div>
            <h1 className="text-5xl md:text-[48px] mb-2 bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
            Змагання
            </h1>
            <p className="text-lg text-slate-400">Майбутні змагання з пошуково-рятувальної кінології</p>
        </div>
        {isOrganizer && (
            <button 
                onClick={() => {
                    setSelectedCompForEdit(undefined);
                    setIsModalOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:translate-y-[-3px] hover:shadow-[0_15px_40px_rgba(99,102,241,0.6)]"
            >
                <Plus size={20} /> Створити змагання
            </button>
        )}
      </div>

      {competitions.length === 0 ? (
        <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border-2 border-dashed border-[rgba(99,102,241,0.3)] rounded-[20px] p-10 sm:p-16 md:p-[100px_40px] text-center">
            <Trophy className="w-16 h-16 mx-auto mb-5 opacity-50 text-slate-500" />
            <p className="text-lg text-slate-500">Немає запланованих змагань</p>
        </div>
      ) : (
        <div className="grid gap-6">
            {competitions.map(comp => (
                <div key={comp.id} className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-[rgba(99,102,241,0.5)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)] flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-2">
                             <h3 className="text-2xl text-white font-bold font-normal">{comp.name}</h3>
                             {comp.organizerName && <Badge variant="outline" className="text-slate-400 border-slate-700 text-[16px]">{comp.organizerName}</Badge>}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-slate-300 text-base mb-4">
                            <span className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                <Calendar size={18} className="text-indigo-400" /> 
                                {formatDate(comp.startDate || comp.date, comp.endDate)}
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                <MapPin size={18} className="text-indigo-400" /> {comp.location}
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                <Users size={18} className="text-indigo-400" /> {comp.participants?.length || 0} / {comp.maxParticipants}
                            </span>
                        </div>

                        <div className="mb-4">
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-base">{comp.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                             <Badge className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border-none px-3 py-1 text-sm font-normal text-[16px]">
                                 Рівень: {comp.level}
                             </Badge>
                             {comp.categories && comp.categories.map((cat, idx) => (
                                 <Badge key={idx} variant="outline" className="border-indigo-500/30 text-indigo-200 text-sm font-normal text-[16px] text-[15px]">
                                     {cat}
                                 </Badge>
                             ))}
                        </div>
                        
                        {comp.judges && comp.judges.length > 0 && (
                            <div className="text-base text-slate-400 mt-3">
                                <span className="font-semibold text-slate-300">Судді:</span> {comp.judges.join(', ')}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 justify-end md:w-[220px] border-t md:border-t-0 md:border-l border-slate-700/50 pt-4 md:pt-0 md:pl-6">
                         {isOrganizer && (comp.organizerId === userProfile?.id || userProfile?.role === 'admin') ? (
                             <>
                                <Button 
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11 text-base shadow-lg shadow-indigo-900/20"
                                    onClick={() => openManage(comp)}
                                >
                                    <Settings size={18} /> Керувати
                                </Button>
                                <Button 
                                    variant="outline"
                                    className="w-full bg-transparent border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 hover:text-white gap-2 h-11 text-base"
                                    onClick={() => openEdit(comp)}
                                >
                                    <Edit size={18} /> Редагувати
                                </Button>
                                <Button 
                                    variant="destructive"
                                    className="w-full gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 h-11 text-base"
                                    onClick={() => handleDeleteClick(comp.id)}
                                >
                                    <Trash2 size={18} /> Видалити
                                </Button>
                             </>
                         ) : (
                             <>
                                {comp.status === 'open' ? (
                                    userProfile?.role !== 'organizer' ? (
                                     <button 
                                        onClick={() => openRegister(comp.id)}
                                        className="w-full py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl font-medium cursor-pointer transition-all duration-300 shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(99,102,241,0.6)] text-base"
                                     >
                                        Зареєструватися
                                     </button>
                                    ) : null
                                 ) : (
                                     <div className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl text-center border border-slate-700 font-medium text-base">
                                         Реєстрація закрита
                                     </div>
                                 )}
                             </>
                         )}
                    </div>
                </div>
            ))}
        </div>
      )}

      <CompetitionModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedCompForEdit(undefined); }}
        onSave={handleCreate}
        editingComp={selectedCompForEdit}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[rgba(30,41,59,0.95)] backdrop-blur-[20px] border-[rgba(99,102,241,0.2)] text-white">
            <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400 text-xl">
                <AlertTriangle className="w-6 h-6" />
                Видалити змагання?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-base">
                Ця дія незворотна. Це змагання та всі реєстрації будуть видалені назавжди.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-slate-600 text-slate-300 hover:bg-[rgba(99,102,241,0.1)] hover:text-white">Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700 border-none">Видалити</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>

      {/* Registration Modal */}
      {registerModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
            <div className="bg-[rgba(30,41,59,0.98)] backdrop-blur-[20px] p-5 sm:p-8 rounded-2xl max-w-md w-full border border-[rgba(99,102,241,0.3)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl text-white font-bold text-[24px] font-normal">Реєстрація на змагання</h3>
                    <button 
                        onClick={() => setRegisterModalOpen(false)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="mb-5">
                    <label className="block text-base text-slate-300 mb-2">Собака</label>
                    <select 
                        className="w-full p-3 bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-base"
                        value={selectedDogId}
                        onChange={(e) => setSelectedDogId(e.target.value)}
                    >
                        {userDogs.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.breed || d.pedigree})</option>
                        ))}
                    </select>
                </div>

                <div className="mb-5">
                    <label className="block text-base text-slate-300 mb-2">Клас / Категорія</label>
                    <select 
                        className="w-full p-3 bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-xl text-white focus:outline-none focus:border-indigo-500 text-base"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">Оберіть клас</option>
                        {competitions.find(c => c.id === selectedCompId)?.categories?.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-6 sm:mb-8">
                    <label className="block text-base text-slate-300 mb-2">Документи (квитанція, робоча книжка)</label>
                    <div className="relative">
                        <input 
                            type="file" 
                            multiple
                            onChange={(e) => e.target.files && setRegisterFiles(Array.from(e.target.files))}
                            className="hidden"
                            id="file-upload"
                        />
                        <label 
                            htmlFor="file-upload"
                            className={`flex items-center justify-center gap-2 w-full p-4 bg-[rgba(15,23,42,0.5)] border-2 border-dashed rounded-xl cursor-pointer transition-all ${registerFiles.length > 0 ? 'border-indigo-500 text-indigo-400' : 'border-slate-700 text-slate-400 hover:border-indigo-500/50 hover:text-slate-300'} text-base`}
                        >
                            <Upload size={20} />
                            {registerFiles.length > 0 ? `${registerFiles.length} файлів обрано` : 'Завантажити файли'}
                        </label>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={handleRegister}
                        disabled={uploading}
                        className="flex-1 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl font-medium transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-base shadow-[0_4px_14px_rgba(99,102,241,0.4)]"
                    >
                        {uploading ? 'Обробка...' : 'Підтвердити'}
                    </button>
                    <button 
                        onClick={() => setRegisterModalOpen(false)}
                        disabled={uploading}
                        className="flex-1 py-3 bg-transparent border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors text-base"
                    >
                        Скасувати
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
}