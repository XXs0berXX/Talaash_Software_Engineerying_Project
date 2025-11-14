/**
 * Landing Page - For Non-Authenticated Users
 * Simple page with Login/Signup focus
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';

export default function Home() {
  const { isAuthenticated, loading: loadingAuth } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loadingAuth && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loadingAuth, router]);

  // Show loading while checking auth
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner w-12 h-12 border-4 border-primary border-t-secondary"></div>
      </div>
    );
  }

  // Don't render landing page if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white min-h-screen flex items-center">
        <div className="container-custom text-center">
          <h1 className="text-6xl font-bold mb-6">Welcome to Talash</h1>
          <p className="text-2xl mb-4">Campus Lost and Found Portal</p>
          <p className="text-lg mb-12 max-w-2xl mx-auto">
            Connect with your campus community to find lost items and help others recover their belongings
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mb-16">
            <Link href="/signup">
              <button className="bg-white text-primary px-10 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg">
                Get Started
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-primary transition-all">
                Login
              </button>
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-xl font-bold mb-2">Search Items</h3>
              <p className="text-sm">Browse through found items on campus</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-4xl mb-3">📢</div>
              <h3 className="text-xl font-bold mb-2">Report Lost/Found</h3>
              <p className="text-sm">Help the community by reporting items</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="text-xl font-bold mb-2">Connect & Reunite</h3>
              <p className="text-sm">Reunite lost items with their owners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-8">
        <div className="container-custom text-center">
          <p className="mb-2">&copy; 2024 Talash - Campus Lost and Found</p>
          <p className="text-sm text-gray-400">IBA University</p>
        </div>
      </footer>
    </div>
  );
}