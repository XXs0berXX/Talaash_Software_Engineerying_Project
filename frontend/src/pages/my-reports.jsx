/**
 * My Reports Page
 * View user's reported lost and found items
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import AuthGuard from '../components/AuthGuard';
import { auth } from '../lib/firebase';

function MyReportsContent() {
  const [activeTab, setActiveTab] = useState('found'); // 'found' or 'lost'
  const [foundItems, setFoundItems] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      setError('');

      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to view your reports');
        return;
      }

      const token = await user.getIdToken();

      // Fetch found items
      const foundResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/items/found/my-items`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Fetch lost items
      const lostResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/items/lost/my-items`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setFoundItems(foundResponse.data.items || []);
      setLostItems(lostResponse.data.items || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load your reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId, type) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in to delete items');
        return;
      }

      const token = await user.getIdToken();

      await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/items/${type}/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Refresh the list
      fetchMyReports();
      alert('Item deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const currentItems = activeTab === 'found' ? foundItems : lostItems;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Reports</h1>
          <p className="text-gray-600">
            View and manage your reported items
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('found')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'found'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Found Items ({foundItems.length})
            </button>
            <button
              onClick={() => setActiveTab('lost')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'lost'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Lost Items ({lostItems.length})
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner w-12 h-12 border-4 border-primary border-t-secondary"></div>
          </div>
        ) : currentItems.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">
              {activeTab === 'found' ? '✨' : '😢'}
            </div>
            <h3 className="text-2xl font-bold mb-2">
              No {activeTab} items yet
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'found'
                ? "You haven't reported any found items yet"
                : "You haven't reported any lost items yet"}
            </p>
            <button
              onClick={() => router.push(activeTab === 'found' ? '/report-found' : '/report-lost')}
              className="btn-primary"
            >
              Report {activeTab === 'found' ? 'Found' : 'Lost'} Item
            </button>
          </div>
        ) : (
          // Items Grid
          <div>
            <div className="mb-4">
              <p className="text-gray-600">
                Showing <strong>{currentItems.length}</strong> {activeTab} item(s)
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentItems.map((item) => (
                <div key={item.id} className="relative">
                  <ItemCard
                    item={item}
                    type={activeTab}
                    showClaimButton={false}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.status || 'pending'}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteItem(item.id, activeTab)}
                    className="absolute bottom-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/report-found')}
              className="bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Report Found Item
            </button>
            <button
              onClick={() => router.push('/report-lost')}
              className="bg-secondary hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Report Lost Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyReports() {
  return (
    <AuthGuard>
      <MyReportsContent />
    </AuthGuard>
  );
}