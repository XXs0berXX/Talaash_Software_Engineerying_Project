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
          const token = await firebaseUser.getIdToken();

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
            const backendUser = response.data.user || {};

            // Ensure name is a safe string to render (avoid rendering an object)
            let safeName = 'User';

            if (typeof backendUser.name === 'string' && backendUser.name.trim() !== '') {
              safeName = backendUser.name;
            } else if (typeof backendUser.email === 'string' && backendUser.email.trim() !== '') {
              safeName = backendUser.email;
            } else if (typeof backendUser.name === 'number') {
              safeName = String(backendUser.name);
            } else if (backendUser.name && typeof backendUser.name === 'object') {
              // Convert unexpected object to JSON for safe rendering (and log it)
              console.warn('Navbar: backend returned non-string user.name:', backendUser.name);
              try {
                safeName = JSON.stringify(backendUser.name);
                // optionally truncate long strings:
                if (safeName.length > 60) safeName = safeName.slice(0, 57) + '...';
              } catch (e) {
                safeName = 'User';
              }
            }

            const safeUser = { ...backendUser, name: safeName };
            setUser(safeUser);
            setIsAdmin(safeUser.role === 'admin');
          }
        } catch (error) {
          console.log('Token verification failed:', error.message || error);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
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
      setUser(null);
      setIsAdmin(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error.message || error);
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
              {/* User Links */}
              <Link href="/upload-found">
                <span className="hover:opacity-80 cursor-pointer">Report Found</span>
              </Link>

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