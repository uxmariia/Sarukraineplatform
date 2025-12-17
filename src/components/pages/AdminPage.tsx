import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { UserProfile, UserRole } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2, Shield, User, Users } from 'lucide-react';
import { toast } from "sonner";

interface AdminPageProps {
  userProfile: UserProfile | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminPage({ userProfile, showToast }: AdminPageProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
      showToast('Не вдалося завантажити список користувачів', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdating(userId);
      await apiRequest(`/admin/users/${userId}/role`, 'PUT', { role: newRole });
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      showToast('Роль користувача оновлено', 'success');
    } catch (error) {
      console.error('Failed to update role', error);
      showToast('Не вдалося оновити роль', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'organizer':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const translateRole = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Адміністратор';
      case 'organizer':
        return 'Організатор';
      case 'user':
        return 'Користувач';
      default:
        return role;
    }
  };

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen pt-24 px-6 flex justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Доступ заборонено</h1>
          <p className="text-slate-400">У вас немає прав для перегляду цієї сторінки.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[60px] px-[24px] pb-[48px] max-w-[1400px] mx-auto pr-[24px] pl-[24px] py-[60px]">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-normal text-[40px]">Адміністрування</h1>
          <p className="text-slate-400 text-[18px]">Керування користувачами та ролями</p>
        </div>
      </div>

      <Card className="bg-[#131b31] border-[rgba(99,102,241,0.2)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-indigo-400" />
            Список користувачів
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-indigo-500/20 hover:bg-transparent">
                  <TableHead className="text-slate-400">Користувач</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Поточна роль</TableHead>
                  <TableHead className="text-slate-400">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-b border-indigo-500/10 hover:bg-indigo-500/5">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                          <User className="w-4 h-4" />
                        </div>
                        {user.name || 'Без імені'}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`${getRoleBadgeColor(user.role)} border-none text-white`}>
                        {translateRole(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        disabled={updating === user.id || user.id === userProfile.id}
                        value={user.role}
                        onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-[140px] bg-[#0a0e27] border-indigo-500/30 text-slate-200">
                          <SelectValue placeholder="Оберіть роль" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1f3a] border-indigo-500/30 text-slate-200">
                          <SelectItem value="user">Користувач</SelectItem>
                          <SelectItem value="organizer">Організатор</SelectItem>
                          <SelectItem value="admin">Адміністратор</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}