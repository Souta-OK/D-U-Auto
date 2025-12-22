import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    throw new Error('Unauthorized');
  }
  return user;
}




