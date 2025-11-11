/**
 * Upload Found Item Page
 * Form for authenticated users to report found items
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import FormInput from '../components/FormInput';
import AuthGuard from '../components/AuthGuard';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

function UploadFoundItemContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    date_found: '',
    image: null,
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userToken = await user.getIdToken();
        setToken(userToken);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must not exceed 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, GIF, and WebP images are allowed');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    if (!formData.date_found) {
      setError('Date found is required');
      return;
    }

    if (!formData.image) {
      setError('Image is required');
      return;
    }

    try {
      setLoading(true);

      // Create FormData for multipart upload
      const uploadData = new FormData();
      uploadData.append('description', formData.description);
      uploadData.append('location', formData.location);
      uploadData.append(
        'date_found',
        new Date(formData.date_found).toISOString()
      );
      uploadData.append('file', formData.image);

      // Upload to backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/items/found`,
        uploadData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 201) {
        setSuccess('Item reported successfully! Thank you for helping find lost items.');
        setFormData({
          description: '',
          location: '',
          date_found: '',
          image: null,
        });

        // Reset file input
        const fileInput = document.getElementById('image');
        if (fileInput) fileInput.value = '';

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'Failed to upload item');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container-custom py-12 flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="card">
            <h1 className="text-3xl font-bold mb-2">Report Found Item</h1>
            <p className="text-gray-600 mb-6">
              Help reunite lost items with their owners
            </p>

            {error && (
              <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-success bg-opacity-10 text-success p-4 rounded-lg mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FormInput
                label="Item Description"
                type="text"
                placeholder="e.g., Blue backpack with laptop inside"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={loading}
              />

              <FormInput
                label="Location Found"
                type="text"
                placeholder="e.g., Main Library 2nd Floor"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                disabled={loading}
              />

              <FormInput
                label="Date & Time Found"
                type="datetime-local"
                name="date_found"
                value={formData.date_found}
                onChange={handleChange}
                required
                disabled={loading}
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Image <span className="text-danger">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <label
                    htmlFor="image"
                    className="cursor-pointer block"
                  >
                    {formData.image ? (
                      <div>
                        <p className="font-semibold text-primary">
                          {formData.image.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Click to change image
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600">
                          📸 Click to upload image
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Max 5MB • JPG, PNG, GIF, WebP
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Uploading...' : 'Report Item'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-bold mb-2">Tips for better results:</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Provide a clear, detailed description</li>
                <li>✓ Include distinguishing features or markings</li>
                <li>✓ Upload a clear, well-lit image</li>
                <li>✓ Specify the exact location where found</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UploadFoundItem() {
  return (
    <AuthGuard>
      <UploadFoundItemContent />
    </AuthGuard>
  );
}
