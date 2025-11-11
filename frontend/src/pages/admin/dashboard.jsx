/**
 * Admin Dashboard Page
 * Admin control panel for managing found items
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import ItemCard from '../../components/ItemCard';
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

      // Fetch pending items
      const itemsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/items/pending`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          params: {
            limit: 20,
          },
        }
      );

      setItems(itemsResponse.data.items);
      setError('');
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
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
        // Remove from pending list
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container-custom py-12">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Statistics Section */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card text-center">
              <h3 className="text-3xl font-bold text-primary">
                {stats.pending_items}
              </h3>
              <p className="text-gray-600 mt-2">Pending Items</p>
            </div>
            <div className="card text-center">
              <h3 className="text-3xl font-bold text-success">
                {stats.approved_items}
              </h3>
              <p className="text-gray-600 mt-2">Approved Items</p>
            </div>
            <div className="card text-center">
              <h3 className="text-3xl font-bold text-primary">
                {stats.total_items}
              </h3>
              <p className="text-gray-600 mt-2">Total Items</p>
            </div>
          </div>
        )}

        {/* Pending Items Section */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Pending Review</h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="spinner w-8 h-8 border-4 border-primary border-t-secondary"></div>
            </div>
          ) : error ? (
            <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-lg text-center">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <p className="text-gray-600">No pending items</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 flex gap-4"
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
                    <h3 className="font-bold text-lg mb-1">
                      {item.description}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📍 {item.location}
                    </p>
                    <p className="text-sm text-gray-600">
                      📅 {new Date(item.date_found).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="bg-success text-white px-4 py-2 rounded hover:bg-opacity-90 transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="bg-danger text-white px-4 py-2 rounded hover:bg-opacity-90 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
