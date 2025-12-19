'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import ProtectedRoute from '@/components/ProtectedRoute';

interface ChildStore {
  domain: string;
  adminToken: string;
}

interface Group {
  _id: string;
  name: string;
  parentStore: {
    domain: string;
    adminToken: string;
  };
  childStores: ChildStore[];
  syncType: 'sync' | 'async';
  isSyncing: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  product_type: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
  tags: string;
}

export default function SharePage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    parentDomain: '',
    parentToken: '',
    childStores: [] as ChildStore[],
    syncType: 'async' as 'sync' | 'async',
  });

  const [newChildStore, setNewChildStore] = useState({
    domain: '',
    adminToken: '',
  });

  useEffect(() => {
    fetchGroups();
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

  const handleCreateGroup = async () => {
    if (!formData.name || !formData.parentDomain || !formData.parentToken) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          parentStore: {
            domain: formData.parentDomain,
            adminToken: formData.parentToken,
          },
          childStores: formData.childStores,
          syncType: formData.syncType,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setGroups([...groups, data.group]);
        setShowCreateModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('An error occurred while creating the group');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/groups/${selectedGroup._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          parentStore: {
            domain: formData.parentDomain,
            adminToken: formData.parentToken,
          },
          childStores: formData.childStores,
          syncType: formData.syncType,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setGroups(groups.map((g) => (g._id === selectedGroup._id ? data.group : g)));
        setSelectedGroup(data.group);
        setShowEditModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      alert('An error occurred while updating the group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGroups(groups.filter((g) => g._id !== groupId));
        if (selectedGroup?._id === groupId) {
          setSelectedGroup(null);
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('An error occurred while deleting the group');
    }
  };

  const handleEditClick = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      parentDomain: group.parentStore.domain,
      parentToken: group.parentStore.adminToken,
      childStores: group.childStores,
      syncType: group.syncType,
    });
    setShowEditModal(true);
  };

  const handleShareClick = async (group: Group) => {
    setSelectedGroup(group);
    setLoading(true);
    setProducts([]);
    setSelectedProducts(new Set());

    try {
      const response = await fetch(`/api/groups/${group._id}/products`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || []);
        setShowShareModal(true);
      } else {
        alert(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleShareProducts = async () => {
    if (!selectedGroup || selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }

    setSharing(true);
    setShareStatus(null);

    try {
      const selectedProductsData = products.filter((p) =>
        selectedProducts.has(p.id)
      );

      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup._id,
          products: selectedProductsData,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setShareStatus(
          `Successfully shared ${data.uploaded} products. ${data.failed > 0 ? `${data.failed} failed.` : ''}`
        );
        setTimeout(() => {
          setShowShareModal(false);
          setSelectedProducts(new Set());
        }, 2000);
      } else {
        setShareStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Share error:', error);
      setShareStatus('An error occurred while sharing products');
    } finally {
      setSharing(false);
    }
  };

  const addChildStore = () => {
    if (!newChildStore.domain || !newChildStore.adminToken) {
      alert('Please enter both domain and admin token');
      return;
    }
    setFormData({
      ...formData,
      childStores: [...formData.childStores, newChildStore],
    });
    setNewChildStore({ domain: '', adminToken: '' });
  };

  const removeChildStore = (index: number) => {
    setFormData({
      ...formData,
      childStores: formData.childStores.filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      parentDomain: '',
      parentToken: '',
      childStores: [],
      syncType: 'async',
    });
    setNewChildStore({ domain: '', adminToken: '' });
  };

  const toggleProductSelection = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
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
          <h1 className="text-3xl font-bold text-gray-900">Share Products</h1>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Group
          </button>
        </div>

        {/* Groups List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Groups</h2>
          </div>
          {groups.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No groups found. Create a group to get started.
            </div>
          ) : (
            <div className="divide-y">
              {groups.map((group) => (
                <div
                  key={group._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {group.name}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Parent:</span>{' '}
                          {group.parentStore.domain}
                        </p>
                        <p>
                          <span className="font-medium">Child Stores:</span>{' '}
                          {group.childStores.length}
                        </p>
                        <p>
                          <span className="font-medium">Sync Type:</span>{' '}
                          {group.syncType}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShareClick(group)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                      >
                        SHARE
                      </button>
                      <button
                        onClick={() => handleEditClick(group)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Create Group"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter group name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Store Domain *
              </label>
              <input
                type="text"
                value={formData.parentDomain}
                onChange={(e) =>
                  setFormData({ ...formData, parentDomain: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://store.com or https://store.myshopify.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Store Admin Token *
              </label>
              <input
                type="password"
                value={formData.parentToken}
                onChange={(e) =>
                  setFormData({ ...formData, parentToken: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin token"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sync Type
              </label>
              <select
                value={formData.syncType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    syncType: e.target.value as 'sync' | 'async',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="async">Async</option>
                <option value="sync">Sync</option>
              </select>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Child Stores
              </label>
              <div className="space-y-2 mb-3">
                {formData.childStores.map((store, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <span className="flex-1 text-sm">{store.domain}</span>
                    <button
                      onClick={() => removeChildStore(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChildStore.domain}
                  onChange={(e) =>
                    setNewChildStore({ ...newChildStore, domain: e.target.value })
                  }
                  placeholder="Child store domain"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  value={newChildStore.adminToken}
                  onChange={(e) =>
                    setNewChildStore({
                      ...newChildStore,
                      adminToken: e.target.value,
                    })
                  }
                  placeholder="Admin token"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addChildStore}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Edit Group Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            resetForm();
          }}
          title="Edit Group"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Store Domain *
              </label>
              <input
                type="text"
                value={formData.parentDomain}
                onChange={(e) =>
                  setFormData({ ...formData, parentDomain: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Store Admin Token *
              </label>
              <input
                type="password"
                value={formData.parentToken}
                onChange={(e) =>
                  setFormData({ ...formData, parentToken: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sync Type
              </label>
              <select
                value={formData.syncType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    syncType: e.target.value as 'sync' | 'async',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="async">Async</option>
                <option value="sync">Sync</option>
              </select>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Child Stores
              </label>
              <div className="space-y-2 mb-3">
                {formData.childStores.map((store, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <span className="flex-1 text-sm">{store.domain}</span>
                    <button
                      onClick={() => removeChildStore(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChildStore.domain}
                  onChange={(e) =>
                    setNewChildStore({ ...newChildStore, domain: e.target.value })
                  }
                  placeholder="Child store domain"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  value={newChildStore.adminToken}
                  onChange={(e) =>
                    setNewChildStore({
                      ...newChildStore,
                      adminToken: e.target.value,
                    })
                  }
                  placeholder="Admin token"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addChildStore}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGroup}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Updating...' : 'Update Group'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Share Products Modal */}
        <Modal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedProducts(new Set());
          }}
          title="Share Products"
        >
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                {products.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    No products found in parent store.
                  </div>
                ) : (
                  <div className="divide-y">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 ${
                          selectedProducts.has(product.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded"
                        />
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0].src}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {product.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {product.vendor} •{' '}
                            {product.variants && product.variants.length > 0
                              ? `$${product.variants[0].price}`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {shareStatus && (
                <div
                  className={`p-3 rounded-lg ${
                    shareStatus.includes('Error')
                      ? 'bg-red-50 text-red-700'
                      : 'bg-green-50 text-green-700'
                  }`}
                >
                  {shareStatus}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedProducts(new Set());
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareProducts}
                  disabled={sharing || selectedProducts.size === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {sharing ? 'Sharing...' : `Share ${selectedProducts.size} Product(s)`}
                </button>
              </div>
            </div>
          )}
        </Modal>
        </div>
      </div>
    </ProtectedRoute>
  );
}


