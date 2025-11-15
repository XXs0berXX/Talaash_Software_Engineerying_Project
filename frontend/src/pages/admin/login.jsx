/**
 * Admin Login Page
 * Separate login for admin staff
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import FormInput from '../../components/FormInput';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Get Firebase token
      const token = await userCredential.user.getIdToken();

      // Step 2: Validate admin login with backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/login`,
        {
          email: formData.email,
          token: token,
        }
      );

      if (response.data.status === 'success') {
        // Store token and admin info
        localStorage.setItem('authToken', token);
        localStorage.setItem('admin', JSON.stringify(response.data.admin));

        // Redirect to dashboard
        router.push(response.data.redirect);
      }
    } catch (err) {
      console.error('Admin login failed:', err);

      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'Failed to login as admin');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="container-custom py-12 flex justify-center">
        <div className="w-full max-w-md">
          <div className="card">
            <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
            <p className="text-gray-600 mb-6">
              Lost & Found Staff Portal
            </p>

            {error && (
              <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FormInput
                label="Admin Email"
                type="email"
                placeholder="admin@iba.edu.pk"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />

              <FormInput
                label="Password"
                type="password"
                placeholder="••••••••"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mb-4"
              >
                {loading ? 'Logging in...' : 'Admin Login'}
              </button>
            </form>

            <div className="text-center pt-4 border-t">
              <p className="text-gray-600 text-sm mb-2">Not an admin?</p>
              <Link href="/login">
                <span className="text-primary font-bold cursor-pointer hover:underline">
                  User login
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
