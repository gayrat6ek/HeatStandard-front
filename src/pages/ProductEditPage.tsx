import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, Trash2 } from 'lucide-react';
import api from '../services/api';
import type { Product, Group, PaginatedResponse } from '../types';

export const ProductEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Groups hierarchy state
  const [rootGroups, setRootGroups] = useState<Group[]>([]);
  const [childGroups, setChildGroups] = useState<Group[]>([]);
  const [selectedRootGroupId, setSelectedRootGroupId] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const [formData, setFormData] = useState({
    name_ru: '',
    name_uz: '',
    name_en: '',
    description_ru: '',
    description_uz: '',
    description_en: '',
    price: 0,
    is_active: true,
    images: [] as string[],
    group_id: '' as string | null,
  });

  // Fetch root groups on mount
  useEffect(() => {
    const fetchRootGroups = async () => {
      try {
        const response = await api.get<PaginatedResponse<Group>>('/groups', {
          params: { parent_id: 'null', limit: 100 }
        });
        setRootGroups(response.data.items);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      }
    };
    fetchRootGroups();
  }, []);

  // Fetch child groups when root group is selected
  useEffect(() => {
    const fetchChildGroups = async () => {
      if (!selectedRootGroupId) {
        setChildGroups([]);
        return;
      }
      
      setIsLoadingGroups(true);
      try {
        const response = await api.get<PaginatedResponse<Group>>('/groups', {
          params: { parent_id: selectedRootGroupId, limit: 100 }
        });
        setChildGroups(response.data.items);
      } catch (error) {
        console.error('Failed to fetch child groups:', error);
        setChildGroups([]);
      } finally {
        setIsLoadingGroups(false);
      }
    };
    fetchChildGroups();
  }, [selectedRootGroupId]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get<Product>(`/products/${id}`);
        const product = response.data;
        setFormData({
          name_ru: product.name_ru || '',
          name_uz: product.name_uz || '',
          name_en: product.name_en || '',
          description_ru: product.description_ru || '',
          description_uz: product.description_uz || '',
          description_en: product.description_en || '',
          price: product.price || 0,
          is_active: product.is_active,
          images: product.images || [],
          group_id: product.group_id || '',
        });

        // If product has a group, try to find its parent
        if (product.group_id && rootGroups.length > 0) {
          // First check if it's a root group
          const isRootGroup = rootGroups.find(g => g.id === product.group_id);
          if (isRootGroup) {
            setSelectedRootGroupId(product.group_id);
          } else {
            // It might be a child group, find its parent
            try {
              const groupRes = await api.get<Group>(`/groups/${product.group_id}`);
              if (groupRes.data.parent_group_id) {
                setSelectedRootGroupId(groupRes.data.parent_group_id);
              }
            } catch (e) {
              console.error('Failed to fetch group details');
            }
          }
        }
      } catch (err) {
        setError('Failed to load product');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, rootGroups]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    setIsUploading(true);
    try {
      const response = await api.post('/files/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, response.data.url]
      }));
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await api.put(`/products/${id}`, formData);
      navigate('/products');
    } catch (err) {
      setError('Failed to update product');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/products')}
        className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад к товарам
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Редактирование товара</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 space-y-2">
              <label className="text-sm font-medium text-slate-700">Product Images</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-red-400 hover:bg-slate-100 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500">Upload Image</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Name (RU)</label>
              <input
                type="text"
                value={formData.name_ru}
                onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Name (UZ)</label>
              <input
                type="text"
                value={formData.name_uz}
                onChange={(e) => setFormData({ ...formData, name_uz: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Name (EN)</label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description (RU)</label>
              <textarea
                value={formData.description_ru}
                onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description (UZ)</label>
              <textarea
                value={formData.description_uz}
                onChange={(e) => setFormData({ ...formData, description_uz: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description (EN)</label>
              <textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Цена ($)</label>
              <input
                type="number"
                step="any"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                min="0"
                required
              />
            </div>

            {/* Parent Group Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Parent Group</label>
              <select
                value={selectedRootGroupId}
                onChange={(e) => {
                  setSelectedRootGroupId(e.target.value);
                  // If selecting a root group, set it as the group_id initially
                  // User can then select a child if available
                  setFormData(prev => ({ ...prev, group_id: e.target.value || null }));
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">No Group</option>
                {rootGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name_ru}
                  </option>
                ))}
              </select>
            </div>

            {/* Child Group Selection (if parent has children) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Child Group {isLoadingGroups && <Loader2 className="inline w-4 h-4 animate-spin ml-2" />}
              </label>
              <select
                value={formData.group_id || ''}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value || null })}
                disabled={!selectedRootGroupId || isLoadingGroups}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                <option value={selectedRootGroupId}>
                  {!selectedRootGroupId ? 'Select a Parent Group first' : '-- Use Parent Group --'}
                </option>
                {childGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name_ru}
                  </option>
                ))}
              </select>
              {selectedRootGroupId && childGroups.length === 0 && !isLoadingGroups && (
                <p className="text-xs text-slate-500">Нет дочерних групп</p>
              )}
            </div>
            
            <div className="space-y-2 flex items-center pt-8">
               <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-400 text-red-500 focus:ring-red-500 focus:ring-offset-white bg-white"
                />
                <span className="text-slate-900 font-medium">Активный статус</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center px-6 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium rounded-lg transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
