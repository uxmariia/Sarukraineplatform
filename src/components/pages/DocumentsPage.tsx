import { useState, useEffect } from 'react';
import { FileText, Download, Plus, Trash2, Calendar, Edit2, Upload } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { UserProfile } from '../../types';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
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
import { Textarea } from "../ui/textarea";

type DocumentsPageProps = {
  userProfile?: UserProfile | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

type Document = {
  id: string;
  name: string;
  url?: string;
  filePath?: string;
  fileName?: string;
  date: string;
  description?: string;
};

export default function DocumentsPage({ userProfile, showToast }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    // Only fetch documents if component is mounted
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await apiRequest('/documents');
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => {
    if (editingDocument) {
      setFormData({
        name: editingDocument.name || '',
        description: editingDocument.description || ''
      });
      setSelectedFile(null);
    } else {
      setFormData({
        name: '',
        description: ''
      });
      setSelectedFile(null);
    }
  }, [editingDocument, isModalOpen]);

  const handleDelete = async (id: string) => {
      if(!confirm('Видалити документ?')) return;
      try {
          await apiRequest(`/documents/${id}`, 'DELETE');
          setDocuments(documents.filter(d => d.id !== id));
          showToast('Документ видалено', 'success');
      } catch(e) {
          showToast('Помилка видалення', 'error');
      }
  };

  const openAddModal = () => {
      setEditingDocument(null);
      setIsModalOpen(true);
  };

  const openEditModal = (doc: Document) => {
      setEditingDocument(doc);
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name.trim()) {
          showToast('Заповніть обов\'язкові поля: Назва', 'error');
          return;
      }

      if (!editingDocument && !selectedFile) {
          showToast('Оберіть файл для завантаження', 'error');
          return;
      }

      setIsUploading(true);

      try {
          let filePath = '';
          let fileName = '';

          // Upload file first if new document
          if (!editingDocument && selectedFile) {
              // Get access token from supabase session
              const { data: { session } } = await supabase.auth.getSession();
              const accessToken = session?.access_token;

              if (!accessToken) {
                  showToast('Не вдалося отримати токен авторизації', 'error');
                  setIsUploading(false);
                  return;
              }

              const uploadFormData = new FormData();
              uploadFormData.append('file', selectedFile);

              const uploadResponse = await fetch(
                  `https://${projectId}.supabase.co/functions/v1/make-server-5f926218/documents/upload`,
                  {
                      method: 'POST',
                      headers: {
                          Authorization: `Bearer ${accessToken}`,
                      },
                      body: uploadFormData,
                  }
              );

              if (!uploadResponse.ok) {
                  const errorData = await uploadResponse.json().catch(() => ({}));
                  console.error('Upload failed:', errorData);
                  throw new Error(errorData.error || 'File upload failed');
              }

              const uploadData = await uploadResponse.json();
              filePath = uploadData.path;
              fileName = uploadData.fileName;
              console.log('File uploaded successfully:', { filePath, fileName });
          }

          if (editingDocument) {
              // Update existing document metadata only
              const updatedDoc = await apiRequest(`/documents/${editingDocument.id}`, 'PUT', formData);
              setDocuments(documents.map(d => d.id === editingDocument.id ? updatedDoc : d));
              showToast('Документ оновлено', 'success');
          } else {
              // Create new document with file path
              const documentData = { 
                  ...formData,
                  filePath,
                  fileName,
                  date: new Date().toLocaleDateString('uk-UA') 
              };
              console.log('Creating document with data:', documentData);
              const newDoc = await apiRequest('/documents', 'POST', documentData);
              console.log('Document created:', newDoc);
              setDocuments([...documents, newDoc]);
              showToast('Документ додано', 'success');
          }
          
          setIsModalOpen(false);
          setSelectedFile(null);
      } catch(e: any) {
           console.error('Upload error:', e);
           showToast(e.message || 'Помилка збереження', 'error');
      } finally {
          setIsUploading(false);
      }
  };

  const handleDownload = async (docId: string) => {
      try {
          const response = await apiRequest(`/documents/${docId}/download`);
          if (response.url) {
              window.open(response.url, '_blank');
          } else {
              showToast('Не вдалося отримати посилання', 'error');
          }
      } catch (e) {
          console.error('Download error:', e);
          showToast('Помилка завантаження', 'error');
      }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-[60px]">
      <div className="flex justify-between items-end mb-12">
        <div>
            <h1 className="text-5xl md:text-[48px] mb-2 bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
            Документи
            </h1>
            <p className="text-lg text-slate-400">Положення, регламенти та інші важливі документи</p>
        </div>
        {isAdmin && (
            <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 rounded-lg text-white flex gap-2 items-center hover:bg-indigo-500 transition-colors"><Plus size={20} /> Додати</button>
        )}
      </div>

      {documents.length === 0 ? (
           <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border-2 border-dashed border-[rgba(99,102,241,0.3)] rounded-[20px] p-[100px_40px] text-center">
                <FileText className="w-16 h-16 mx-auto mb-5 opacity-50 text-slate-500" />
                <p className="text-lg text-slate-500">Немає доступних документів</p>
           </div>
       ) : (
        <div className="grid gap-4">
            {documents.map((doc) => (
            <div
                key={doc.id}
                className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[20px] border border-[rgba(99,102,241,0.2)] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all duration-300 hover:border-[rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]"
            >
                <div className="flex items-start gap-4 flex-1">
                <FileText className="w-6 h-6 text-indigo-300 flex-shrink-0 mt-1" />
                <div className="flex-1">
                    <div className="text-xl text-white mb-1">{doc.name}</div>
                    {doc.description && (
                        <p className="text-base text-slate-400 mb-2">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} /> {doc.date}
                        </div>
                        {doc.fileName && (
                            <div className="flex items-center gap-1">
                                <FileText size={14} />
                                <span className="text-sm">{doc.fileName}</span>
                            </div>
                        )}
                    </div>
                </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                    className="flex-1 md:flex-none px-6 py-[10px] bg-transparent text-indigo-300 border border-indigo-500/30 rounded-[10px] cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap hover:bg-[rgba(99,102,241,0.1)] hover:text-indigo-200"
                    onClick={() => handleDownload(doc.id)}
                    >
                    <Download className="w-4 h-4" /> Завантажити
                    </button>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => openEditModal(doc)} 
                                className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                title="Редагувати"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(doc.id)} 
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Видалити"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
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
              {editingDocument ? 'Редагування документу' : 'Додати документ'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              {editingDocument ? 'Оновіть інформацію про документ' : 'Додайте новий документ до бази'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-200 text-base">
                  Назва документу <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Положення про змагання"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-200 text-base">
                  Опис (опціонально)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[rgba(15,23,42,0.5)] border border-[rgba(99,102,241,0.3)] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]" 
                  placeholder="Короткий опис документу"
                />
              </div>
              {!editingDocument && (
                <div className="space-y-2">
                  <Label htmlFor="file" className="text-gray-200 text-base">
                    Файл <span className="text-red-400">*</span>
                  </Label>
                  <div 
                    className="relative border-2 border-dashed border-[rgba(99,102,241,0.4)] rounded-xl p-8 text-center bg-[rgba(15,23,42,0.3)] hover:border-[rgba(99,102,241,0.6)] hover:bg-[rgba(99,102,241,0.05)] transition-all cursor-pointer"
                    onClick={() => document.getElementById('file-input')?.click()}
                    onDragEnter={() => setIsDragging(true)}
                    onDragLeave={() => setIsDragging(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                            setSelectedFile(file);
                        }
                        setIsDragging(false);
                    }}
                  >
                    <input
                      id="file-input"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                      required
                    />
                    <Upload className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
                    <p className="text-base text-slate-300 mb-1">
                      {selectedFile ? selectedFile.name : 'Завантажити файли'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'Клікніть або перетягніть файл сюди'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-3 mt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isUploading}
                className="bg-[rgba(255,255,255,0.05)] text-white border border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.5)]"
              >
                Скасувати
              </Button>
              <Button 
                type="submit"
                disabled={isUploading}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.6)]"
              >
                {isUploading ? 'Завантаження...' : (editingDocument ? 'Оновити' : 'Додати')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}