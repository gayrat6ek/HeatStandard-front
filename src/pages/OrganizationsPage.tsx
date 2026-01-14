import { useEffect, useState } from 'react';
import type { Organization, PaginatedResponse } from '../types';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2, RefreshCw, Edit } from 'lucide-react';

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Organization>>('/organizations', {
        params: { limit: 100 },
      });
      setOrganizations(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const syncOrganizations = async () => {
    setIsSyncing(true);
    try {
      await api.post('/organizations/sync');
      fetchOrganizations();
    } catch (error) {
      console.error('Failed to sync organizations:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
          <p className="text-slate-500">Manage iiko organizations</p>
        </div>
        <button
          onClick={syncOrganizations}
          disabled={isSyncing}
          className="flex items-center px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync from iiko'}
        </button>
      </div>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : organizations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">No organizations found</p>
          <button
            onClick={syncOrganizations}
            className="mt-4 text-red-500 hover:text-red-400"
          >
            Sync organizations from iiko
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-slate-900 text-lg font-semibold">{org.name}</h3>
                    <p className="text-sm text-slate-500">{org.restaurant_address || 'No address'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/organizations/${org.id}`)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                    title="Edit Organization"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      org.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {org.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Country</p>
                  <p className="text-slate-900">{org.country || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Timezone</p>
                  <p className="text-slate-900">{org.timezone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">iiko ID</p>
                  <p className="text-slate-900 font-mono text-xs">{org.iiko_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-slate-500">
        Total: {total} organizations
      </div>
    </div>
  );
}
