'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import ProtectedRoute from '@/components/ProtectedRoute';

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

export default function ScrapePage() {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadDomain, setUploadDomain] = useState('');
  const [uploadToken, setUploadToken] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const productsPerPage = viewMode === 'card' ? 12 : 20;

  useEffect(() => {
    // Filter products based on search query
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.product_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.tags?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, products]);

  const handleScrape = async () => {
    if (!domain.trim()) {
      alert('Please enter a domain');
      return;
    }

    setLoading(true);
    setProducts([]);
    setSelectedProducts(new Set());

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (response.ok) {
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } else {
        alert(data.error || 'Failed to scrape products');
      }
    } catch (error) {
      console.error('Scrape error:', error);
      alert('An error occurred while scraping products');
    } finally {
      setLoading(false);
    }
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

  const handleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const handleUpload = async () => {
    if (!uploadDomain.trim() || !uploadToken.trim()) {
      alert('Please enter both domain and admin token');
      return;
    }

    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const selectedProductsData = products.filter((p) =>
        selectedProducts.has(p.id)
      );

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: uploadDomain,
          adminToken: uploadToken,
          products: selectedProductsData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus(
          `Successfully uploaded ${data.uploaded} products. ${data.failed > 0 ? `${data.failed} failed.` : ''}`
        );
        setTimeout(() => {
          setUploadModalOpen(false);
          setUploadDomain('');
          setUploadToken('');
          setSelectedProducts(new Set());
        }, 2000);
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('An error occurred while uploading products');
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Scrape Products</h1>
          <div></div>
        </div>

        {/* Domain Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter store domain (e.g., https://wearelively.com or https://lyangyi.myshopify.com)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScrape()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleScrape}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Scraping...' : 'Confirm'}
            </button>
          </div>
        </div>

        {/* Controls */}
        {products.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewMode === 'card'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  List
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Selection Info */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {selectedProducts.size} selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
                >
                  {selectedProducts.size === paginatedProducts.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  disabled={selectedProducts.size === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  Upload Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Display */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Scraping products...</p>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No products found. Enter a domain and click Confirm to scrape products.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedProducts.has(product.id)
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <div className="relative">
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0].src}
                          alt={product.images[0].alt || product.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      {selectedProducts.has(product.id) && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.vendor}
                      </p>
                      {product.variants && product.variants.length > 0 && (
                        <p className="text-lg font-bold text-blue-600">
                          ${product.variants[0].price}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-12">
                        <input
                          type="checkbox"
                          checked={
                            selectedProducts.size === paginatedProducts.length &&
                            paginatedProducts.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`border-t hover:bg-gray-50 cursor-pointer ${
                          selectedProducts.has(product.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.images && product.images.length > 0 && (
                              <img
                                src={product.images[0].src}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <span className="font-medium text-gray-900">
                              {product.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {product.vendor}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {product.product_type}
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-600">
                          {product.variants && product.variants.length > 0
                            ? `$${product.variants[0].price}`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Upload Modal */}
        <Modal
          isOpen={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setUploadStatus(null);
          }}
          title="Upload Products"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Domain
              </label>
              <input
                type="text"
                placeholder="https://yourstore.com or https://store.myshopify.com"
                value={uploadDomain}
                onChange={(e) => setUploadDomain(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Token
              </label>
              <input
                type="password"
                placeholder="Enter admin API token"
                value={uploadToken}
                onChange={(e) => setUploadToken(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {uploadStatus && (
              <div
                className={`p-3 rounded-lg ${
                  uploadStatus.includes('Error')
                    ? 'bg-red-50 text-red-700'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {uploadStatus}
              </div>
            )}
            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setUploadStatus(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {uploading ? 'Uploading...' : 'Confirm'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
    </ProtectedRoute>
  );
}


