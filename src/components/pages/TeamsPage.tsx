import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, MapPin, Edit2, Phone, User } from 'lucide-react';
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

type TeamsPageProps = {
  userProfile?: UserProfile | null;
  showToast?: (msg: string, type: any) => void;
};

type Team = {
  id: string;
  name: string;
  city: string;
  contactName?: string;
  contactPhone?: string;
};

export default function TeamsPage({ userProfile, showToast }: TeamsPageProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    contactName: '',
    contactPhone: ''
  });

  useEffect(() => {
    apiRequest('/teams').then((data) => {
      // Міграція старих даних: якщо є contact, але немає contactName/contactPhone
      const migratedTeams = data.map((team: any) => {
        if (team.contact && !team.contactName && !team.contactPhone) {
          return {
            ...team,
            contactName: team.contact,
            contactPhone: ''
          };
        }
        return team;
      });
      setTeams(migratedTeams);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (editingTeam) {
      setFormData({
        name: editingTeam.name || '',
        city: editingTeam.city || '',
        contactName: editingTeam.contactName || '',
        contactPhone: editingTeam.contactPhone || ''
      });
    } else {
      setFormData({
        name: '',
        city: '',
        contactName: '',
        contactPhone: ''
      });
    }
  }, [editingTeam, isModalOpen]);

  const handleDelete = async (id: string) => {
      if(!confirm('Видалити команду?')) return;
      try {
          await apiRequest(`/teams/${id}`, 'DELETE');
          setTeams(teams.filter(t => t.id !== id));
          showToast?.('Команду видалено', 'success');
      } catch(e) {
          showToast?.('Помилка видалення', 'error');
      }
  };

  const openAddModal = () => {
      setEditingTeam(null);
      setIsModalOpen(true);
  };

  const openEditModal = (team: Team) => {
      setEditingTeam(team);
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name.trim() || !formData.city.trim()) {
          showToast?.('Заповніть обов\'язкові поля: Назва, Місто', 'error');
          return;
      }

      try {
          if (editingTeam) {
              // Update existing team
              const updatedTeam = await apiRequest(`/teams/${editingTeam.id}`, 'PUT', formData);
              setTeams(teams.map(t => t.id === editingTeam.id ? updatedTeam : t));
              showToast?.('Команду оновлено', 'success');
          } else {
              // Create new team
              const newTeam = await apiRequest('/teams', 'POST', formData);
              setTeams([...teams, newTeam]);
              showToast?.('Команду додано', 'success');
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
            Команди
            </h1>
            <p className="text-lg text-slate-400">Знайдіть команди з пошуково-рятувальної кінології</p>
        </div>
        {isAdmin && (
            <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 rounded-lg text-white flex gap-2 items-center hover:bg-indigo-500 transition-colors"><Plus size={20} /> Додати</button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border-2 border-dashed border-[rgba(99,102,241,0.3)] rounded-[20px] p-[100px_40px] text-center">
            <Users className="w-16 h-16 mx-auto mb-5 opacity-50 text-slate-500" />
            <p className="text-lg text-slate-500">Немає доступних даних про команди</p>
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                  <div key={team.id} className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-2xl p-6 hover:border-indigo-500/50 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                      <div className="flex justify-between items-start mb-4">
                          <h3 className="text-2xl text-white">{team.name}</h3>
                          {isAdmin && (
                              <div className="flex gap-2">
                                  <button 
                                      onClick={() => openEditModal(team)} 
                                      className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                      title="Редагувати"
                                  >
                                      <Edit2 size={18} />
                                  </button>
                                  <button 
                                      onClick={() => handleDelete(team.id)} 
                                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                      title="Видалити"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          )}
                      </div>
                      <div className="space-y-3">
                          <p className="flex items-center gap-2 text-slate-400">
                              <MapPin size={16} className="text-indigo-400" />
                              <span className="text-base">{team.city}</span>
                          </p>
                          {team.contactName && (
                              <p className="flex items-center gap-2 text-slate-400">
                                  <User size={16} className="text-indigo-400" />
                                  <span className="text-base">{team.contactName}</span>
                              </p>
                          )}
                          {team.contactPhone && (
                              <a 
                                  href={`tel:${team.contactPhone}`}
                                  className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors w-fit"
                              >
                                  <Phone size={16} className="text-indigo-400" />
                                  <span className="text-base">{team.contactPhone}</span>
                              </a>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      )}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[rgba(30,41,59,0.98)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.3)] text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
              {editingTeam ? 'Редагування команди' : 'Додати команду'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              {editingTeam ? 'Оновіть інформацію про команду' : 'Додайте нову команду'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-200 text-base">
                  Назва команди <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Назва команди"
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
                <Label htmlFor="contactName" className="text-gray-200 text-base">
                  Контактна особа (ім'я)
                </Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Іванов Іван"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-gray-200 text-base">
                  Телефон контактної особи
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="+380 XX XXX XX XX"
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
                {editingTeam ? 'Оновити' : 'Додати'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}