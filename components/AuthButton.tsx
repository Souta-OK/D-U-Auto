'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="px-4 py-2 text-gray-600">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-700 text-sm">
        {session.user?.email}
      </span>
      <button
        onClick={() => {
          signOut({ callbackUrl: '/login' });
        }}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
      >
        Sign Out
      </button>
    </div>
  );
}




