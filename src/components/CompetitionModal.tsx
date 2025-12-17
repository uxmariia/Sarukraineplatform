import { useState, useEffect } from 'react';
import { Competition } from '../types';
import { X } from 'lucide-react';
import { apiRequest } from '../utils/api';

type CompetitionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comp: any) => void;
  editingComp?: Competition;
};

export default function CompetitionModal({ isOpen, onClose, onSave, editingComp }: CompetitionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    location: '',
    level: '',
    categories: '',
    description: '',
    maxParticipants: 20,
    organizerName: '',
    judges: [] as string[]
  });

  const [availableJudges, setAvailableJudges] = useState<any[]>([]);

  useEffect(() => {
    fetchJudges();
  }, []);

  const fetchJudges = async () => {
      try {
          const judges = await apiRequest('/judges');
          setAvailableJudges(judges);
      } catch (e) {
          console.error("Failed to fetch judges", e);
      }
  }

  useEffect(() => {
    if (editingComp) {
      setFormData({
        name: editingComp.name,
        startDate: editingComp.startDate || editingComp.date || '',
        endDate: editingComp.endDate || '',
        location: editingComp.location,
        level: editingComp.level,
        categories: editingComp.categories?.join(', ') || '',
        description: editingComp.description,
        maxParticipants: editingComp.maxParticipants,
        organizerName: editingComp.organizerName || '',
        judges: editingComp.judges || []
      });
    } else {
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        location: '',
        level: '',
        categories: '',
        description: '',
        maxParticipants: 20,
        organizerName: '',
        judges: []
      });
    }
  }, [editingComp, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoriesArray = formData.categories.split(',').map(s => s.trim()).filter(Boolean);
    onSave({
        ...formData,
        categories: categoriesArray,
        date: formData.startDate // Legacy support if needed
    });
  };

  const handleJudgeChange = (judgeName: string) => {
      const current = formData.judges;
      if (current.includes(judgeName)) {
          setFormData({...formData, judges: current.filter(j => j !== judgeName)});
      } else {
          setFormData({...formData, judges: [...current, judgeName]});
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-5">
      <div className="bg-[rgba(30,41,59,0.98)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.3)] rounded-[20px] max-w-[700px] w-full max-h-[90vh] overflow-y-auto p-[24px] p-[16px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-[32px]">
            {editingComp ? 'Редагувати змагання' : 'Створити змагання'}
          </h2>
          <button
            className="bg-none border-none text-slate-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center transition-all duration-300 hover:text-white"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
                <label className="block text-base text-gray-200 mb-2">Назва змагань</label>
                <input
                type="text"
                className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                />
            </div>
            <div>
                 <label className="block text-base text-gray-200 mb-2">Організатор (Назва)</label>
                 <input
                  type="text"
                  className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                  value={formData.organizerName}
                  onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                  placeholder="Наприклад: КСУ, ГО 'SAR'"
                  required
                 />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
                <label className="block text-base text-gray-200 mb-2">Дата початку</label>
                <input
                type="date"
                className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                />
            </div>
             <div>
                <label className="block text-base text-gray-200 mb-2">Дата завершення</label>
                <input
                type="date"
                className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
            </div>
          </div>

           <div className="mb-5">
                <label className="block text-base text-gray-200 mb-2">Місце проведення</label>
                <input
                type="text"
                className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                />
            </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
                <label className="block text-base text-gray-200 mb-2">Рівень (Напр: A, B, Відбір)</label>
                <input
                type="text"
                className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                required
                />
            </div>
             <div>
                <label className="block text-base text-gray-200 mb-2">Категорії (через кому)</label>
                <input
                type="text"
                className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
                value={formData.categories}
                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                placeholder="RH-FL, RH-T, etc."
                required
                />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-base text-gray-200 mb-2">Макс. учасників</label>
            <input
            type="number"
            className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] text-base"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
            required
            />
          </div>

           <div className="mb-5">
             <label className="block text-base text-gray-200 mb-2">Судді</label>
             <div className="flex flex-wrap gap-2 bg-[rgba(15,23,42,0.5)] p-3 rounded-[10px] border border-[rgba(99,102,241,0.3)]">
                 {availableJudges.map(judge => (
                     <label key={judge.id} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors text-base">
                         <input 
                            type="checkbox" 
                            checked={formData.judges.includes(judge.name)}
                            onChange={() => handleJudgeChange(judge.name)}
                            className="accent-indigo-500 w-4 h-4"
                         />
                         {judge.name}
                     </label>
                 ))}
                 {availableJudges.length === 0 && <span className="text-slate-500 text-sm">Суддів не знайдено. Додайте їх у розділі "Судді".</span>}
             </div>
           </div>

           <div className="mb-5">
            <label className="block text-base text-gray-200 mb-2">Опис</label>
            <textarea
              className="w-full px-4 py-[14px] bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] rounded-[10px] text-white transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] min-h-[100px] text-base"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(99,102,241,0.5)] text-base"
          >
            Зберегти
          </button>
        </form>
      </div>
    </div>
  );
}
