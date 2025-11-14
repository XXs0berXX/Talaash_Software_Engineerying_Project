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

      // Step 2: Send to backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
        {
          email: formData.email,
          token: token,
        }
      );

      if (response.data.status === 'success') {
        // Store token and user data
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect based on role
        if (response.data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
        console.error('Login failed:', err);

        // Normalize various error shapes into a string for rendering
        let message = 'Failed to login. Please try again.';

        if (err.code === 'auth/user-not-found') {
          message = 'No account found with this email. Please sign up first.';
        } else if (err.code === 'auth/wrong-password') {
          message = 'Incorrect password';
        } else if (err.code === 'auth/invalid-email') {
          message = 'Invalid email address';
        } else if (err.response?.data) {
          const resp = err.response.data;
          console.error('Backend response:', resp);
          if (typeof resp === 'string') message = resp;
          else if (typeof resp.detail === 'string') message = resp.detail;
          else if (resp.message) message = resp.message;
          else message = JSON.stringify(resp);
        } else if (err.message) {
          message = err.message;
        }

        setError(String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

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
          </div>
        </div>
      </div>
    </div>
  );
}