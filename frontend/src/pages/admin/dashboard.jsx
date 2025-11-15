/**
 * Admin Dashboard Page
 * Admin control panel for managing found items with tabs
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import AuthGuard from '../../components/AuthGuard';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

function AdminDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'all'
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userToken = await user.getIdToken();
        setToken(userToken);
        await fetchDashboardData(userToken);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (token) {
      fetchItems(activeTab);
    }
  }, [activeTab, token]);

  const fetchDashboardData = async (authToken) => {
    try {
      setLoading(true);

      // Fetch statistics
      const dashResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      setStats(dashResponse.data.statistics);

      // Fetch pending items initially
      await fetchItems('pending', authToken);
      
      setError('');
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (status, authToken = token) => {
    try {
      setLoading(true);
      
      let endpoint = '';
      if (status === 'pending') {
        endpoint = '/api/admin/items/pending';
      } else if (status === 'approved') {
        endpoint = '/api/admin/items/approved';
      } else {
        endpoint = '/api/admin/items/all';
      }

      const itemsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          params: {
            limit: 50,
          },
        }
      );

      setItems(itemsResponse.data.items);
      setError('');
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (itemId) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/items/${itemId}/approve`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === 'success') {
        // Remove from list
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        // Refresh stats
        await fetchDashboardData(token);
      }
    } catch (err) {
      console.error('Failed to approve item:', err);
      alert('Failed to approve item');
    }
  };

  const handleReject = async (itemId) => {
    if (!confirm('Are you sure you want to reject this item?')) {
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/items/${itemId}/reject`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === 'success') {
        // Remove from list
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        // Refresh stats
        await fetchDashboardData(token);
      }
    } catch (err) {
      console.error('Failed to reject item:', err);
      alert('Failed to reject item');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'pending') {
      return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">Pending</span>;
    } else if (status === 'approved') {
      return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Approved</span>;
    } else if (status === 'rejected') {
      return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">Rejected</span>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Statistics Section */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h3 className="text-3xl font-bold text-blue-600">
                {stats.pending_items}
              </h3>
              <p className="text-gray-600 mt-2">Pending Items</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h3 className="text-3xl font-bold text-green-600">
                {stats.approved_items}
              </h3>
              <p className="text-gray-600 mt-2">Approved Items</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h3 className="text-3xl font-bold text-blue-600">
                {stats.total_items}
              </h3>
              <p className="text-gray-600 mt-2">Total Items</p>
            </div>
          </div>
        )}

        {/* Tabs Section */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending ({stats?.pending_items || 0})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'approved'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Approved ({stats?.approved_items || 0})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Items ({stats?.total_items || 0})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-600">
                  {activeTab === 'pending' && 'No pending items'}
                  {activeTab === 'approved' && 'No approved items'}
                  {activeTab === 'all' && 'No items found'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow"
                  >
                    {/* Item Image */}
                    {item.image_url && (
                      <img
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${item.image_url}`}
                        alt={item.description}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}

                    {/* Item Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg">
                          {item.description}
                        </h3>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        📍 {item.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(item.date_found || item.created_at).toLocaleDateString()}
                      </p>
                      {item.category && (
                        <p className="text-sm text-gray-600 mt-1">
                          🏷️ {item.category}
                        </p>
                      )}
                    </div>

                    {/* Actions - Only show for pending items */}
                    {item.status === 'pending' && (
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboardContent />
    </AuthGuard>
  );
}