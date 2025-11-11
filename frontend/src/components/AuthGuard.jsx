/**
 * AuthGuard Component
 * Protects routes that require authentication
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import axios from 'axios';

export default function AuthGuard({ children, requiredRole = null }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
        setLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/verify-token`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.data.status === 'valid') {
          // Check role requirement
          if (requiredRole && response.data.user.role !== requiredRole) {
            router.push('/');
            setLoading(false);
            return;
          }

          setIsAuthorized(true);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Authorization check failed:', error);
        router.push('/login');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [requiredRole, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner w-8 h-8 border-4 border-primary border-t-secondary"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return children;
}
