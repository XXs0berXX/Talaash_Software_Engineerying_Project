/**
 * Signup Page
 * User registration with Firebase and backend
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import FormInput from '../components/FormInput';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import axios from 'axios';

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!formData.email.endsWith('@iba.edu.pk')) {
      setError('Only @iba.edu.pk email addresses are allowed');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      // Get Firebase token
      const token = await userCredential.user.getIdToken();

      // Step 2: Create user record in backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signup`,
        {
          name: formData.name,
          email: formData.email,
        }
      );

      if (response.status === 201) {
        // Success - redirect to login or home
        router.push('/login');
      }
    } catch (err) {
      console.error('Signup failed:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'Failed to create account');
      }
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
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-gray-600 mb-6">Join Talash today</p>

            {error && (
              <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FormInput
                label="Full Name"
                type="text"
                placeholder="John Doe"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />

              <FormInput
                label="IBA Email"
                type="email"
                placeholder="john@iba.edu.pk"
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

              <FormInput
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mb-4"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login">
                  <span className="text-primary font-bold cursor-pointer hover:underline">
                    Login here
                  </span>
                </Link>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
              <p className="mb-2">
                <strong>Note:</strong> Only @iba.edu.pk email addresses are allowed to register.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
