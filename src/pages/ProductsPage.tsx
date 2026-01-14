import { useEffect, useState } from 'react';
import type { Product, Group, PaginatedResponse } from '../types';
import api from '../services/api';
import { Search, Loader2, Edit, Image as ImageIcon, RefreshCw, ChevronRight, ChevronDown, FolderOpen, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GroupNode extends Group {
  children?: GroupNode[];
  products?: Product[];
  isExpanded: boolean;
  isLoading: boolean;
  isLoaded: boolean;
}

// Format price with $ and smart decimals
const formatPrice = (amount: number): string => {
  if (amount === Math.floor(amount)) {
    return `$${amount.toLocaleString()}`;
  }
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const [rootGroups, setRootGroups] = useState<GroupNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setIsSearchMode(debouncedSearch.length > 0);
    if (debouncedSearch) {
      searchProducts(debouncedSearch);
    }
  }, [debouncedSearch]);

  const searchProducts = async (query: string) => {
    setSearchLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Product>>('/products', {
        params: { search: query, limit: 100 }
      });
      setFilteredProducts(response.data.items);
    } catch (error) {
      console.error('Failed to search products:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchRootGroups = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Group>>('/groups', {
        params: { parent_id: 'null', limit: 100 }
      });

      const groups: GroupNode[] = response.data.items.map((g: Group) => ({
        ...g,
        isExpanded: false,
        isLoading: false,
        isLoaded: false
      }));

      setRootGroups(groups);
    } catch (error) {
      console.error('Failed to fetch root groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupContent = async (groupId: string): Promise<{ children: GroupNode[], products: Product[] }> => {
    const [childrenRes, productsRes] = await Promise.all([
      api.get<PaginatedResponse<Group>>('/groups', {
        params: { parent_id: groupId, limit: 100 }
      }),
      api.get<PaginatedResponse<Product>>('/products', {
        params: { group_id: groupId, limit: 100 }
      })
    ]);

    const children: GroupNode[] = childrenRes.data.items.map((g: Group) => ({
      ...g,
      isExpanded: false,
      isLoading: false,
      isLoaded: false
    }));

    return { children, products: productsRes.data.items };
  };

  useEffect(() => {
    fetchRootGroups();
  }, []);

  const syncProducts = async () => {
    setIsSyncing(true);
    try {
      await api.post('/products/sync');
      await fetchRootGroups();
    } catch (error) {
      console.error('Failed to sync products:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleGroup = async (groupId: string) => {
    const updateGroupInTree = (
      groups: GroupNode[],
      targetId: string,
      updater: (g: GroupNode) => GroupNode
    ): GroupNode[] => {
      return groups.map(group => {
        if (group.id === targetId) {
          return updater(group);
        }
        if (group.children && group.children.length > 0) {
          return { ...group, children: updateGroupInTree(group.children, targetId, updater) };
        }
        return group;
      });
    };

    const findGroup = (groups: GroupNode[], targetId: string): GroupNode | null => {
      for (const g of groups) {
        if (g.id === targetId) return g;
        if (g.children) {
          const found = findGroup(g.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const targetGroup = findGroup(rootGroups, groupId);
    if (!targetGroup) return;

    if (targetGroup.isLoaded) {
      setRootGroups(prev => updateGroupInTree(prev, groupId, g => ({
        ...g,
        isExpanded: !g.isExpanded
      })));
      return;
    }

    setRootGroups(prev => updateGroupInTree(prev, groupId, g => ({
      ...g,
      isLoading: true
    })));

    try {
      const { children, products } = await loadGroupContent(groupId);

      setRootGroups(prev => updateGroupInTree(prev, groupId, g => ({
        ...g,
        children,
        products,
        isExpanded: true,
        isLoading: false,
        isLoaded: true
      })));
    } catch (error) {
      console.error('Failed to load group content:', error);
      setRootGroups(prev => updateGroupInTree(prev, groupId, g => ({
        ...g,
        isLoading: false
      })));
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/products/${id}`);
  };

  const renderProduct = (product: Product, indent: number = 0) => (
    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-3" style={{ paddingLeft: `${24 + indent * 24}px` }}>
        <div className="flex items-center gap-3">
          <Package className="w-4 h-4 text-slate-400" />
          <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name_ru}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-3">
        <div className="font-medium text-slate-900">{product.name_ru}</div>
        <div className="text-sm text-slate-500">{product.name_en}</div>
      </td>
      <td className="px-6 py-3 text-slate-600 font-semibold">
        {formatPrice(product.price || 0)}
      </td>
      <td className="px-6 py-3">
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            product.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {product.is_active ? 'Активен' : 'Неактивен'}
        </span>
      </td>
      <td className="px-6 py-3 text-right">
        <button
          onClick={() => handleEdit(product.id)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
          title="Редактировать"
        >
          <Edit className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );

  const renderGroup = (group: GroupNode, indent: number = 0): React.ReactNode => {
    return (
      <>
        <tr 
          key={group.id} 
          className="bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
          onClick={() => toggleGroup(group.id)}
        >
          <td colSpan={5} className="px-6 py-3" style={{ paddingLeft: `${24 + indent * 24}px` }}>
            <div className="flex items-center gap-2">
              {group.isLoading ? (
                <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
              ) : group.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              <FolderOpen className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-slate-700">{group.name_ru}</span>
              {group.isLoaded && (
                <span className="text-sm text-slate-400 ml-2">
                  ({group.children?.length || 0} подгрупп, {group.products?.length || 0} товаров)
                </span>
              )}
            </div>
          </td>
        </tr>
        {group.isExpanded && group.isLoaded && (
          <>
            {group.children?.map(child => renderGroup(child, indent + 1))}
            {group.products?.map(product => renderProduct(product, indent + 1))}
          </>
        )}
      </>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Товары</h1>
          <p className="text-slate-500">Управление товарами из iiko (нажмите на группу для раскрытия)</p>
        </div>
        <button
          onClick={syncProducts}
          disabled={isSyncing}
          className="flex items-center px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Синхронизация...' : 'Синхронизировать с iiko'}
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск товаров..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Изображение</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Название</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Цена</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Статус</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                  </td>
                </tr>
              ) : isSearchMode ? (
                searchLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Товары не найдены по запросу "{debouncedSearch}"
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => renderProduct(product))
                )
              ) : rootGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Группы не найдены. Нажмите "Синхронизировать с iiko" для загрузки.
                  </td>
                </tr>
              ) : (
                rootGroups.map((group) => renderGroup(group))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      {!isSearchMode && !isLoading && (
        <div className="mt-6 text-center text-sm text-slate-500">
          {rootGroups.length} корневых групп (нажмите для раскрытия)
        </div>
      )}
    </div>
  );
}
