import { useState, useEffect } from 'react';
import { Scale, Plus, Trash2, Edit2, Phone, Mail, MapPin } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { UserProfile } from '../../types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type JudgesPageProps = {
  userProfile?: UserProfile | null;
  showToast?: (msg: string, type: any) => void;
};

type Judge = {
  id: string;
  name: string;
  rank: string;
  city: string;
  phone?: string;
  email?: string;
};

export default function JudgesPage({ userProfile, showToast }: JudgesPageProps) {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rank: '',
    city: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    apiRequest('/judges').then(setJudges).catch(console.error);
  }, []);

  useEffect(() => {
    if (editingJudge) {
      setFormData({
        name: editingJudge.name || '',
        rank: editingJudge.rank || '',
        city: editingJudge.city || '',
        phone: editingJudge.phone || '',
        email: editingJudge.email || ''
      });
    } else {
      setFormData({
        name: '',
        rank: '',
        city: '',
        phone: '',
        email: ''
      });
    }
  }, [editingJudge, isModalOpen]);

  const handleDelete = async (id: string) => {
      if(!confirm('Видалити суддю?')) return;
      try {
          await apiRequest(`/judges/${id}`, 'DELETE');
          setJudges(judges.filter(j => j.id !== id));
          showToast?.('Суддю видалено', 'success');
      } catch(e) {
          showToast?.('Помилка видалення', 'error');
      }
  };

  const openAddModal = () => {
      setEditingJudge(null);
      setIsModalOpen(true);
  };

  const openEditModal = (judge: Judge) => {
      setEditingJudge(judge);
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name.trim() || !formData.rank.trim() || !formData.city.trim()) {
          showToast?.('Заповніть обов\'язкові поля: ПІБ, Ранг, Місто', 'error');
          return;
      }

      try {
          if (editingJudge) {
              // Update existing judge
              const updatedJudge = await apiRequest(`/judges/${editingJudge.id}`, 'PUT', formData);
              setJudges(judges.map(j => j.id === editingJudge.id ? updatedJudge : j));
              showToast?.('Суддю оновлено', 'success');
          } else {
              // Create new judge
              const newJudge = await apiRequest('/judges', 'POST', formData);
              setJudges([...judges, newJudge]);
              showToast?.('Суддю додано', 'success');
          }
          setIsModalOpen(false);
      } catch(e) {
           showToast?.('Помилка збереження', 'error');
      }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-[60px]">
       <div className="flex justify-between items-end mb-12">
        <div>
            <h1 className="text-5xl md:text-[48px] mb-2 bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
            Судді SAR
            </h1>
            <p className="text-lg text-slate-400">Сертифіковані судді з пошуково-рятувальної кінології в Україні</p>
        </div>
        {isAdmin && (
            <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 rounded-lg text-white flex gap-2 items-center hover:bg-indigo-500 transition-colors"><Plus size={20} /> Додати</button>
        )}
       </div>

       {judges.length === 0 ? (
           <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border-2 border-dashed border-[rgba(99,102,241,0.3)] rounded-[20px] p-[100px_40px] text-center">
                <Scale className="w-16 h-16 mx-auto mb-5 opacity-50 text-slate-500" />
                <p className="text-lg text-slate-500">Немає доступних даних про суддів</p>
           </div>
       ) : (
            <div className="grid gap-6">
                {judges.map(judge => (
                    <div key={judge.id} className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-2xl p-6 hover:border-indigo-500/50 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-2xl text-white mb-3">{judge.name}</h3>
                                <div className="flex flex-wrap gap-3 mb-4">
                                    <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm border border-indigo-500/30">
                                        {judge.rank}
                                    </span>
                                    <span className="flex items-center gap-2 text-slate-400">
                                        <MapPin size={16} className="text-indigo-400" />
                                        {judge.city}
                                    </span>
                                </div>
                                {(judge.phone || judge.email) && (
                                    <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-700/50">
                                        {judge.phone && (
                                            <a href={`tel:${judge.phone}`} className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors w-fit">
                                                <Phone size={16} className="text-indigo-400" />
                                                <span className="text-base">{judge.phone}</span>
                                            </a>
                                        )}
                                        {judge.email && (
                                            <a href={`mailto:${judge.email}`} className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors w-fit">
                                                <Mail size={16} className="text-indigo-400" />
                                                <span className="text-base">{judge.email}</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openEditModal(judge)} 
                                        className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                        title="Редагувати"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(judge.id)} 
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Видалити"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}</div>
       )}
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[600px] bg-[rgba(30,41,59,0.98)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.3)] text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
                        {editingJudge ? 'Редагування судді' : 'Додати суддю'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-400">
                        {editingJudge ? 'Оновіть інформацію про суддю' : 'Додайте нову суддю'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-5 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-200 text-base">
                                ПІБ судді <span className="text-red-400">*</span>
                            </Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                className="w-full bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="Іванов Іван Іванович"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rank" className="text-gray-200 text-base">
                                Ранг <span className="text-red-400">*</span>
                            </Label>
                            <Input 
                                id="rank" 
                                value={formData.rank} 
                                onChange={(e) => setFormData({ ...formData, rank: e.target.value })} 
                                className="w-full bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="КСУ 1, FCI 2, тощо"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-gray-200 text-base">
                                Місто <span className="text-red-400">*</span>
                            </Label>
                            <Input 
                                id="city" 
                                value={formData.city} 
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                                className="w-full bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="Київ"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-gray-200 text-base">
                                Телефон
                            </Label>
                            <Input 
                                id="phone" 
                                type="tel"
                                value={formData.phone} 
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                                className="w-full bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="+380 XX XXX XX XX"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-200 text-base">
                                Email
                            </Label>
                            <Input 
                                id="email" 
                                type="email"
                                value={formData.email} 
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                                className="w-full bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="email@example.com"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-3 mt-6">
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="bg-[rgba(255,255,255,0.05)] text-white border border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.5)]"
                        >
                            Скасувати
                        </Button>
                        <Button 
                            type="submit"
                            className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.6)]"
                        >
                            {editingJudge ? 'Оновити' : 'Додати'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}