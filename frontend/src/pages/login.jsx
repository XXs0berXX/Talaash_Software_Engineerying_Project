/**
 * Login Page
 * User login with Firebase and backend token validation
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import FormInput from '../components/FormInput';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';

export default function Login() {
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

      // 💡 DEBUGGING LINE: Log the token to the browser console for inspection
      console.log('Firebase ID Token Generated:', token);

      // Step 2: Validate token with backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
        {
          email: formData.email,
          token: token,
        }
      );

      if (response.data.status === 'success') {
        // Store token in localStorage for future requests
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // 💥 FIX: Use window.location.replace() instead of router.push() to force 
        // a hard reload, ensuring the entire app re-initializes with the new token.
        if (response.data.user.role === 'admin') {
          window.location.replace('/admin/dashboard');
        } else {
          window.location.replace('/');
        }
      }
    } catch (err) {
      console.error('Login failed:', err);

      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.response?.data?.detail) {
        // Safely handle complex FastAPI error structures (like 422, 400, 401)
        const detail = err.response.data.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          setError(detail[0].msg || 'Validation failed');
        } else if (typeof detail === 'string') {
          setError(detail);
        } else {
          setError('An unknown backend error occurred.');
        }
      } else {
        // Handle network or other errors without a specific response object
        setError(err.message || 'Failed to login');
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
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-600 mb-6">Login to your account</p>

            {error && (
              <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FormInput
                label="IBA Email"
                type="email"
                placeholder="your@iba.edu.pk"
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
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/signup">
                  <span className="text-primary font-bold cursor-pointer hover:underline">
                    Sign up here
                  </span>
                </Link>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t text-center text-gray-600">
              <p className="text-sm">
                <Link href="/admin/login">
                  <span className="text-primary cursor-pointer hover:underline">
                    Admin login
                  </span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}