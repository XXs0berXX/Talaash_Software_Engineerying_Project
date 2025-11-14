/**
 * Dashboard Page - For Authenticated Users
 * Full-featured dashboard with all options
 */

import React, { useState, useEffect } from 'react';
import ItemCard from '../components/ItemCard';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AuthGuard from '../components/AuthGuard';

function DashboardContent() {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoadingItems(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/items/found`,
        {
          params: {
            status_filter: 'all', // Changed to 'all' to show pending items too
            limit: 12,
          },
        }
      );
      
      console.log('Dashboard - Received response:', response.data);
      
      // Handle different response formats
      const itemsData = response.data.items || response.data || [];
      console.log('Dashboard - Items to display:', itemsData);
      
      setItems(itemsData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to load items');
    } finally {
      setLoadingItems(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Quick Actions */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="text-lg mb-8">Welcome back! What would you like to do today?</p>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/search">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg hover:bg-opacity-20 transition-all cursor-pointer border border-white border-opacity-20">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="text-xl font-bold mb-1">Search Items</h3>
                <p className="text-sm opacity-90">Find your lost belongings</p>
              </div>
            </Link>

            <Link href="/report-lost">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg hover:bg-opacity-20 transition-all cursor-pointer border border-white border-opacity-20">
                <div className="text-3xl mb-2">😢</div>
                <h3 className="text-xl font-bold mb-1">Report Lost</h3>
                <p className="text-sm opacity-90">Report a lost item</p>
              </div>
            </Link>

            <Link href="/report-found">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg hover:bg-opacity-20 transition-all cursor-pointer border border-white border-opacity-20">
                <div className="text-3xl mb-2">✨</div>
                <h3 className="text-xl font-bold mb-1">Report Found</h3>
                <p className="text-sm opacity-90">Help someone find their item</p>
              </div>
            </Link>

            <Link href="/my-reports">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg hover:bg-opacity-20 transition-all cursor-pointer border border-white border-opacity-20">
                <div className="text-3xl mb-2">📋</div>
                <h3 className="text-xl font-bold mb-1">My Reports</h3>
                <p className="text-sm opacity-90">View your submissions</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white py-12 border-b">
        <div className="container-custom">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-primary">
                {items.length}+
              </h3>
              <p className="text-gray-600 mt-2">Items Found</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary">100+</h3>
              <p className="text-gray-600 mt-2">Items Returned</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary">50+</h3>
              <p className="text-gray-600 mt-2">Happy Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Found Items */}
      <div className="container-custom py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Recently Found Items</h2>
          <Link href="/search">
            <button className="text-primary hover:underline font-semibold">
              View All →
            </button>
          </Link>
        </div>

        {loadingItems ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner w-8 h-8 border-4 border-primary border-t-secondary"></div>
          </div>
        ) : error ? (
          <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-lg text-center">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-600 mb-4">No items found yet</p>
            <Link href="/report-found">
              <button className="btn-primary">
                Be the first to report an item
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                type="found" 
                showClaimButton={true} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-primary text-white py-12">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8 text-center">Tips for Success</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">📸 Clear Photos</h3>
              <p className="text-sm">Take clear, well-lit photos when reporting items</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">📍 Exact Location</h3>
              <p className="text-sm">Provide specific location details to help others</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">⚡ Act Quickly</h3>
              <p className="text-sm">Report items as soon as possible for better results</p>
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

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}