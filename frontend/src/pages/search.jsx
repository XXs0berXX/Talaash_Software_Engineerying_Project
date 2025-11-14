/**
 * Search Page
 * Search for found items with filters
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import AuthGuard from '../components/AuthGuard';

function SearchContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching items from:', `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/items/found`);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/items/found`,
        {
          params: {
            status_filter: 'all', // Changed from 'approved' to 'all' to show all items
            limit: 50,
          },
        }
      );

      console.log('Received items:', response.data);
      setItems(response.data.items || response.data || []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      console.error('Error details:', err.response?.data);
      setError(`Failed to load items: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Filter items based on search query and filters
    fetchFilteredItems();
  };

  const fetchFilteredItems = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        status_filter: 'approved',
        limit: 50,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (filters.location) {
        params.location = filters.location;
      }

      if (filters.date_from) {
        params.date_from = filters.date_from;
      }

      if (filters.date_to) {
        params.date_to = filters.date_to;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/items/found`,
        { params }
      );

      setItems(response.data.items || []);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      location: '',
      date_from: '',
      date_to: '',
    });
    fetchItems();
  };

  // Client-side filtering for better UX
  const filteredItems = items.filter((item) => {
    const matchesSearch = !searchQuery || 
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = !filters.location || 
      item.location?.toLowerCase().includes(filters.location.toLowerCase());

    const matchesDateFrom = !filters.date_from || 
      new Date(item.date_found) >= new Date(filters.date_from);

    const matchesDateTo = !filters.date_to || 
      new Date(item.date_found) <= new Date(filters.date_to);

    return matchesSearch && matchesLocation && matchesDateFrom && matchesDateTo;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Search Found Items</h1>
          <p className="text-gray-600">
            Browse through items reported by the community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch}>
            {/* Search Bar */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Items
              </label>
              <input
                type="text"
                placeholder="Search by description or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g., Library"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  name="date_from"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  name="date_to"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="btn-primary"
              >
                Search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-4">
            <p className="text-gray-600">
              Found <strong>{filteredItems.length}</strong> item(s)
            </p>
          </div>
        )}

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
        ) : filteredItems.length === 0 ? (
          // No Results
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          // Results Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
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
    </div>
  );
}

export default function Search() {
  return (
    <AuthGuard>
      <SearchContent />
    </AuthGuard>
  );
}