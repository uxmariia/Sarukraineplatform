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

  const handleSave = () => {
      handleSubmit(new Event('submit'));
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-[60px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
        <div>
            <h1 className="text-4xl md:text-[48px] mb-2 text-gray-900 font-semibold">
            Судді SAR
            </h1>
            <p className="text-lg text-gray-600">Сертифіковані судді з пошуково-рятувальної кінології</p>
        </div>
        {userProfile?.role === 'admin' && (
            <Button onClick={openAddModal} className="w-full sm:w-auto px-6 py-3 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-xl gap-2 h-auto text-[16px] font-bold font-normal">
                <Plus size={20} /> Додати суддю
            </Button>
        )}
      </div>

      {judges.length === 0 ? (
        <div className="bg-white shadow-sm rounded-[20px] p-[100px_40px] text-center">
            <Scale className="w-16 h-16 mx-auto mb-5 opacity-50 text-gray-400" />
            <p className="text-lg text-gray-500">Немає доданих суддів</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {judges.map(judge => (
                <div key={judge.id} className="bg-white shadow-sm rounded-2xl p-6 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h3 className="text-xl text-gray-900 mb-1 font-semibold">{judge.name}</h3>
                            <p className="text-base text-blue-600 font-medium">{judge.rank}</p>
                        </div>
                        {userProfile?.role === 'admin' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEditModal(judge)}
                                    className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none rounded-lg cursor-pointer transition-all"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(judge.id)}
                                    className="p-2 bg-red-100 text-red-700 hover:bg-red-200 border-none rounded-lg cursor-pointer transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-2 text-gray-600 text-base">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                            <span>{judge.city}</span>
                        </div>
                        {judge.phone && (
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                                <a href={`tel:${judge.phone}`} className="text-[#007AFF] hover:text-[#0066CC] no-underline">
                                    {judge.phone}
                                </a>
                            </div>
                        )}
                        {judge.email && (
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                                <a href={`mailto:${judge.email}`} className="text-[#007AFF] hover:text-[#0066CC] no-underline break-all">
                                    {judge.email}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[600px] bg-white shadow-xl text-gray-900">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">{editingJudge ? 'Редагувати суддю' : 'Додати суддю'}</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Заповніть дані судді для бази
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-gray-900 font-medium">Ім'я та прізвище</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-[#007AFF]"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rank" className="text-gray-900 font-medium">Ранг</Label>
                  <Input
                    id="rank"
                    value={formData.rank}
                    onChange={(e) => setFormData({...formData, rank: e.target.value})}
                    placeholder="Наприклад: Суддя національної категорії"
                    className="bg-white border-gray-300 text-gray-900 focus:border-[#007AFF]"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city" className="text-gray-900 font-medium">Місто</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-[#007AFF]"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-gray-900 font-medium">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+380"
                    className="bg-white border-gray-300 text-gray-900 focus:border-[#007AFF]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-900 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-[#007AFF]"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  Скасувати
                </Button>
                <Button onClick={handleSave} className="bg-[#007AFF] hover:bg-[#0066CC] text-white">
                  {editingJudge ? 'Зберегти' : 'Додати'}
                </Button>
              </DialogFooter>
            </DialogContent>
      </Dialog>
    </div>
  );
}