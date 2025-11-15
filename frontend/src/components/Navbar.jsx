/**
 * Navbar Component
 * Navigation bar with links and authentication status
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Listen to Firebase authentication state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Attempt to get the token. This might fail if the user state is invalid.
          const token = await firebaseUser.getIdToken(true); // Forces a refresh if token is nearing expiration

          if (!token) {
              // Should theoretically not happen if firebaseUser exists, but defensive check
              setUser(null);
              setLoading(false);
              return;
          }
          
          // Verify token with backend
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/verify-token`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          
          if (response.data.status === 'valid') {
            setUser(response.data.user);
            setIsAdmin(response.data.user.role === 'admin');
          } else {
            // Handle case where backend returns status: invalid (though typically it's a 401)
             setUser(null);
          }
        } catch (error) {
          // 💡 FIX: Safely handle errors (like the 422 or AxiosErrors) without crashing the component
          console.error('Token verification failed:', error.response?.data?.detail || error.message);
          
          // If the backend verification fails, assume session is invalid and clear user state
          setUser(null);
          
          // You may also want to force sign out if the token failed backend verification:
          // signOut(auth);
        }
      } else {
        // No Firebase user signed in
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear local storage items created during login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAdmin(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <nav className="bg-primary text-white shadow-lg">
        <div className="container-custom flex justify-between items-center py-4">
          <span className="text-xl font-bold">Talash</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="container-custom flex justify-between items-center py-4">
        <Link href="/">
          <span className="text-xl font-bold cursor-pointer hover:opacity-80">
            Talash
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {/* Public Links */}
          <Link href="/">
            <span className="hover:opacity-80 cursor-pointer">Home</span>
          </Link>

          {user ? (
            <>
              {/* Admin Links */}
              {isAdmin && (
                <Link href="/admin/dashboard">
                  <span className="hover:opacity-80 cursor-pointer">Dashboard</span>
                </Link>
              )}

              {/* User Info */}
              <div className="flex items-center gap-4">
                <span className="text-sm">
                  {user.name} {isAdmin && <span className="text-secondary">(Admin)</span>}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-secondary hover:bg-opacity-90 px-4 py-2 rounded transition-all"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Auth Links */}
              <Link href="/login">
                <span className="hover:opacity-80 cursor-pointer">Login</span>
              </Link>
              <Link href="/signup">
                <span className="bg-secondary hover:bg-opacity-90 px-4 py-2 rounded transition-all cursor-pointer">
                  Sign Up
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}