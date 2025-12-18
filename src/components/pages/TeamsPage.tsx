import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, MapPin, Edit2, Phone, User, Mail } from 'lucide-react';
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
  contactPerson?: string;
  phone?: string;
  description?: string;
  email?: string;
};

export default function TeamsPage({ userProfile, showToast }: TeamsPageProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    contactPerson: '',
    phone: '',
    description: '',
    email: ''
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
        contactPerson: editingTeam.contactPerson || '',
        phone: editingTeam.phone || '',
        description: editingTeam.description || '',
        email: editingTeam.email || ''
      });
    } else {
      setFormData({
        name: '',
        city: '',
        contactPerson: '',
        phone: '',
        description: '',
        email: ''
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

  const handleSave = async () => {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
        <div>
          <h1 className="text-4xl md:text-[48px] mb-2 text-gray-900 font-semibold">
            Команди
          </h1>
          <p className="text-lg text-gray-600">Реєстр команд пошуково-рятувальних собак</p>
        </div>
        {userProfile?.role === 'admin' && (
            <Button onClick={openAddModal} className="w-full sm:w-auto px-6 py-3 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-xl gap-2 h-auto text-[16px] font-bold font-normal">
                <Plus size={20} /> Додати команду
            </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="bg-white shadow-sm rounded-[20px] p-[100px_40px] text-center">
            <Users className="w-16 h-16 mx-auto mb-5 opacity-50 text-gray-400" />
            <p className="text-lg text-gray-500">Немає доданих команд</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                  <div key={team.id} className="bg-white shadow-sm rounded-2xl p-6 hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                              <h3 className="text-xl text-gray-900 mb-1 font-semibold">{team.name}</h3>
                              {team.city && <p className="text-base text-gray-600">{team.city}</p>}
                          </div>
                          {userProfile?.role === 'admin' && (
                              <div className="flex gap-2">
                                  <button
                                      onClick={() => openEditModal(team)}
                                      className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none rounded-lg cursor-pointer transition-all"
                                  >
                                      <Edit2 size={16} />
                                  </button>
                                  <button
                                      onClick={() => handleDelete(team.id)}
                                      className="p-2 bg-red-100 text-red-700 hover:bg-red-200 border-none rounded-lg cursor-pointer transition-all"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          )}
                      </div>
                      
                      {team.description && (
                          <p className="text-base text-gray-600 mb-3 leading-relaxed">{team.description}</p>
                      )}

                      <div className="space-y-2 text-gray-600 text-base">
                          {team.contactPerson && (
                              <div className="flex items-center gap-2">
                                  <Users size={16} className="text-gray-400 flex-shrink-0" />
                                  <span>{team.contactPerson}</span>
                              </div>
                          )}
                          {team.phone && (
                              <div className="flex items-center gap-2">
                                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                                  <a href={`tel:${team.phone}`} className="text-[#007AFF] hover:text-[#0066CC] no-underline">
                                      {team.phone}
                                  </a>
                              </div>
                          )}
                          {team.email && (
                              <div className="flex items-center gap-2">
                                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                                  <a href={`mailto:${team.email}`} className="text-[#007AFF] hover:text-[#0066CC] no-underline break-all">
                                      {team.email}
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
            <DialogTitle className="text-xl font-semibold">{editingTeam ? 'Редагувати команду' : 'Додати команду'}</DialogTitle>
            <DialogDescription className="text-gray-600">
              Заповніть дані команди для бази
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-gray-900 font-medium">Назва команди</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-gray-900 font-medium">Опис</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Короткий опис команди"
                className="bg-white border-gray-300 text-gray-900 focus:border-[#007AFF]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson" className="text-gray-900 font-medium">Контактна особа</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                className="bg-white border-gray-300 text-gray-900 focus:border-[#007AFF]"
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
              {editingTeam ? 'Зберегти' : 'Додати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}