/**
 * Report Found Item Page
 * Form for authenticated users to report found items
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FormInput from '../components/FormInput';
import AuthGuard from '../components/AuthGuard';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

function ReportFoundContent() {
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
        try {
          const userToken = await user.getIdToken();
          setToken(userToken);
          console.log("Firebase ID Token Generated");
        } catch (tokenError) {
          console.error("Failed to get Firebase ID Token:", tokenError);
          setError("Authentication failed: Could not get a valid user token.");
        }
      } else {
        setToken('');
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

    // Validation
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

    // Get fresh token
    const user = auth.currentUser;
    if (!user) {
      setError("User is not authenticated. Please refresh and log in.");
      return;
    }

    let freshToken;
    try {
      freshToken = await user.getIdToken(true);
      console.log('Using fresh token for API call.');
    } catch (tokenError) {
      setError('Failed to refresh authentication token. Please log out and log back in.');
      return;
    }

    try {
      setLoading(true);

      // Create FormData for multipart upload
      const uploadData = new FormData();
      uploadData.append('description', formData.description);
      uploadData.append('location', formData.location);

      // Date format validation and conversion
      const rawDate = formData.date_found;

      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawDate)) {
        setError('Invalid date/time format. Please use the calendar picker.');
        setLoading(false);
        return;
      }

      const dateToSubmit = rawDate + ':00';
      uploadData.append('date_found', dateToSubmit);
      uploadData.append('file', formData.image);

      // Upload to backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/items/found`,
        uploadData,
        {
          headers: {
            'Authorization': `Bearer ${freshToken}`,
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

        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (err) {
      console.error('Upload failed:', err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authorization failed. Please log out and log back in.');
      } else if (err.response?.data?.detail) {
        const errorDetail = err.response.data.detail;

        if (Array.isArray(errorDetail)) {
          const formattedError = errorDetail
            .map(d => `${d.loc.filter(l => typeof l === 'string').join(' > ')}: ${d.msg}`)
            .join('; ');
          setError('Validation Error: ' + formattedError);
        } else if (typeof errorDetail === 'string') {
          setError(errorDetail);
        } else if (typeof errorDetail === 'object' && errorDetail !== null) {
          setError(errorDetail.detail || JSON.stringify(errorDetail));
        } else {
          setError(err.message || 'Failed to report item.');
        }
      } else {
        setError(err.message || 'Failed to report item. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-12 flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-2">Report Found Item</h1>
            <p className="text-gray-600 mb-6">
              Help reunite lost items with their owners
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-4">
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
                  Item Image <span className="text-red-600">*</span>
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
                  <label htmlFor="image" className="cursor-pointer block">
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
                        <p className="text-gray-600">Click to upload image</p>
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
                className="w-full bg-primary hover:bg-opacity-90 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default function ReportFound() {
  return (
    <AuthGuard>
      <ReportFoundContent />
    </AuthGuard>
  );
}