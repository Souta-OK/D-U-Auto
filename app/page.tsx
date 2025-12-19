import Link from 'next/link';
import AuthButton from '@/components/AuthButton';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      {/* Sign Out Button - Top Right */}
      <div className="absolute top-4 right-4">
        <AuthButton />
      </div>
      
      <div className="text-center space-y-8 p-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Shopify Product Manager
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Manage and sync products across multiple Shopify stores
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link
            href="/scrape"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">
              Scrape Products
            </h2>
            <p className="text-gray-600">
              Scrape products from stores and upload to your store
            </p>
          </Link>
          <Link
            href="/share"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">
              Share Products
            </h2>
            <p className="text-gray-600">
              Create groups and share products to multiple stores
            </p>
          </Link>
          <Link
            href="/sync"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">
              Group Sync
            </h2>
            <p className="text-gray-600">
              Sync product changes across all stores in a group
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}


