import { useEffect, useState } from 'react';
import type { Group, PaginatedResponse } from '../types';
import api from '../services/api';
import { Search, Loader2, FolderOpen, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';

interface GroupNode extends Group {
  children?: GroupNode[];
  isExpanded: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  childCount?: number;
}

export default function GroupsPage() {
  const [rootGroups, setRootGroups] = useState<GroupNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch only root groups on initial load
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

  useEffect(() => {
    fetchRootGroups();
  }, []);

  const syncGroups = async () => {
    setIsSyncing(true);
    try {
      await api.post('/products/sync');
      await fetchRootGroups();
    } catch (error) {
      console.error('Failed to sync groups:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle group expansion - lazy load children if not already loaded
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

    // If already loaded, just toggle
    if (targetGroup.isLoaded) {
      setRootGroups(prev => updateGroupInTree(prev, groupId, g => ({
        ...g,
        isExpanded: !g.isExpanded
      })));
      return;
    }

    // Set loading state
    setRootGroups(prev => updateGroupInTree(prev, groupId, g => ({
      ...g,
      isLoading: true
    })));

    try {
      // Load children
      const response = await api.get<PaginatedResponse<Group>>('/groups', {
        params: { parent_id: groupId, limit: 100 }
      });

      const children: GroupNode[] = response.data.items.map((g: Group) => ({
        ...g,
        isExpanded: false,
        isLoading: false,
        isLoaded: false
      }));

      setRootGroups(prev => updateGroupInTree(prev, groupId, g => ({
        ...g,
        children,
        childCount: children.length,
        isExpanded: true,
        isLoading: false,
        isLoaded: true
      })));
    } catch (error) {
      console.error('Failed to load group children:', error);
      setRootGroups(prev => updateGroupInTree(prev, groupId, g => ({
        ...g,
        isLoading: false
      })));
    }
  };

  // Simple search filter on root groups by name
  const filterGroups = (groups: GroupNode[], query: string): GroupNode[] => {
    if (!query) return groups;
    return groups.filter(g => 
      g.name_ru.toLowerCase().includes(query.toLowerCase()) ||
      g.name_en.toLowerCase().includes(query.toLowerCase())
    );
  };

  const displayGroups = debouncedSearch ? filterGroups(rootGroups, debouncedSearch) : rootGroups;

  const renderGroup = (group: GroupNode, indent: number = 0): React.ReactNode => {
    return (
      <>
        <tr 
          key={group.id} 
          className="hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100"
          onClick={() => toggleGroup(group.id)}
        >
          <td className="px-6 py-4" style={{ paddingLeft: `${24 + indent * 24}px` }}>
            <div className="flex items-center gap-3">
              {group.isLoading ? (
                <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
              ) : group.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              <FolderOpen className="w-5 h-5 text-amber-500" />
              <div>
                <div className="font-medium text-slate-900">{group.name_ru}</div>
                <div className="text-sm text-slate-500">{group.name_en}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 text-slate-600">
            {group.isLoaded ? `${group.childCount || 0} subgroups` : '-'}
          </td>
          <td className="px-6 py-4 text-slate-600">
            {group.active_products_count ?? 0} products
          </td>
          <td className="px-6 py-4">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                group.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {group.is_active ? 'Active' : 'Inactive'}
            </span>
          </td>
        </tr>
        {group.isExpanded && group.isLoaded && group.children?.map(child => renderGroup(child, indent + 1))}
      </>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Groups</h1>
          <p className="text-slate-500">Product groups synced from iiko (click to expand)</p>
        </div>
        <button
          onClick={syncGroups}
          disabled={isSyncing}
          className="flex items-center px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync from iiko'}
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search root groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Group Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Subgroups</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Products</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                  </td>
                </tr>
              ) : displayGroups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    {debouncedSearch ? `No groups found for "${debouncedSearch}"` : 'No groups found. Click "Sync from iiko" to fetch data.'}
                  </td>
                </tr>
              ) : (
                displayGroups.map((group) => renderGroup(group))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="mt-6 text-center text-sm text-slate-500">
          {rootGroups.length} root groups (click to expand and load children)
        </div>
      )}
    </div>
  );
}
