/**
 * Home Page
 * Main landing page with featured items and search
 */

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ItemCard from '../components/ItemCard';
import axios from 'axios';
import Link from 'next/link';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/items/found`,
        {
          params: {
            status_filter: 'approved',
            limit: 12,
          },
        }
      );
      setItems(response.data.items);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-16">
        <div className="container-custom text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to Talash</h1>
          <p className="text-xl mb-8">Campus Lost and Found Portal</p>
          <p className="text-lg mb-8">
            Report found items or search for your lost belongings
          </p>
          <Link href="/signup">
            <button className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all">
              Get Started
            </button>
          </Link>
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

      {/* Featured Items */}
      <div className="container-custom py-16">
        <h2 className="text-3xl font-bold mb-8">Recently Found Items</h2>

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
            <p className="text-gray-600 mb-4">No items found yet</p>
            <Link href="/login">
              <button className="btn-primary">
                Sign in to report an item
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} type="found" showClaimButton={false} />
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-white py-16">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Lost something?</h2>
          <p className="text-lg mb-8">
            Report your lost item and our community will help you find it
          </p>
          <Link href="/login">
            <button className="bg-secondary hover:bg-opacity-90 text-white px-8 py-3 rounded-lg font-bold transition-all">
              Report Lost Item
            </button>
          </Link>
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
