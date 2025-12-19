'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Group {
  _id: string;
  name: string;
  parentStore: {
    domain: string;
    adminToken: string;
  };
  childStores: Array<{
    domain: string;
    adminToken: string;
  }>;
  syncType: 'sync' | 'async';
  isSyncing: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SyncPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingGroups, setSyncingGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGroups();
    // Poll for groups every 5 seconds to update sync status
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/groups');
      const data = await response.json();
      if (response.ok) {
        setGroups(data.groups || []);
      } else {
        if (response.status === 401) {
          router.replace('/login');
        } else {
          console.error('Error fetching groups:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToggle = async (group: Group) => {
    const action = group.isSyncing ? 'unsync' : 'sync';
    setSyncingGroups(new Set([...syncingGroups, group._id]));

    try {
      const response = await fetch(`/api/groups/${group._id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (response.ok) {
        // Update the group in the list
        setGroups(
          groups.map((g) =>
            g._id === group._id ? { ...g, isSyncing: action === 'sync' } : g
          )
        );

        // If starting sync, initiate the sync process
        if (action === 'sync') {
          startSyncProcess(group._id);
        }
      } else {
        alert(data.error || 'Failed to toggle sync');
      }
    } catch (error) {
      console.error('Error toggling sync:', error);
      alert('An error occurred while toggling sync');
    } finally {
      setSyncingGroups((prev) => {
        const next = new Set(prev);
        next.delete(group._id);
        return next;
      });
    }
  };

  const startSyncProcess = async (groupId: string) => {
    // This would typically be handled by a background job or webhook
    // For now, we'll set up a polling mechanism
    // In production, you'd want to use a proper job queue or webhook system
    console.log(`Starting sync process for group ${groupId}`);
    
    // The actual sync logic would monitor product changes and sync them
    // This is a placeholder - in production, you'd want to:
    // 1. Set up webhooks to listen for product changes
    // 2. Use a job queue to process sync operations
    // 3. Handle conflicts and errors gracefully
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Group Sync</h1>
          <div></div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> When sync is enabled, any changes to products
            or product attributes in one store will be automatically
            synchronized across all stores in the group, including the parent
            store. Sync will continue until you click the Unsync button.
          </p>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">No groups found.</p>
            <button
              onClick={() => router.push('/share')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create a Group
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {group.name}
                      </h2>
                      {group.isSyncing && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                          Syncing
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium text-gray-700 mb-1">
                          Parent Store:
                        </p>
                        <p className="text-gray-600">{group.parentStore.domain}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-1">
                          Child Stores:
                        </p>
                        <p className="text-gray-600">
                          {group.childStores.length} store(s)
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-1">
                          Sync Type:
                        </p>
                        <p className="text-gray-600 capitalize">{group.syncType}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-1">
                          Status:
                        </p>
                        <p className="text-gray-600">
                          {group.isSyncing ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    {group.childStores.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="font-medium text-gray-700 mb-2 text-sm">
                          Child Stores:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.childStores.map((store, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {store.domain}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleSyncToggle(group)}
                      disabled={syncingGroups.has(group._id)}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        group.isSyncing
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]`}
                    >
                      {syncingGroups.has(group._id) ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Processing...
                        </span>
                      ) : group.isSyncing ? (
                        'Unsync'
                      ) : (
                        'Sync'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}


