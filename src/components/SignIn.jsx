import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const SignIn = () => {
  const { signIn, loading, error } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Simple email validation regex
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!isValidEmail(email.trim())) errors.email = 'Please enter a valid email address';
    if (!password.trim()) errors.password = 'Password is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await signIn(email.trim(), password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-brand-violet">
          Sign In
        </h1>

        {error && (
          <div
            role="alert"
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <label htmlFor="email" className="block mb-1 font-semibold text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-violet mb-2 ${
              formErrors.email ? 'border-red-600' : 'border-gray-300'
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            aria-invalid={formErrors.email ? 'true' : 'false'}
            aria-describedby={formErrors.email ? 'email-error' : undefined}
            disabled={loading}
          />
          {formErrors.email && (
            <p id="email-error" className="mb-2 text-red-600 text-sm">
              {formErrors.email}
            </p>
          )}

          {/* Password */}
          <label htmlFor="password" className="block mb-1 font-semibold text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-violet mb-4 ${
              formErrors.password ? 'border-red-600' : 'border-gray-300'
            }`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={formErrors.password ? 'true' : 'false'}
            aria-describedby={formErrors.password ? 'password-error' : undefined}
            disabled={loading}
          />
          {formErrors.password && (
            <p id="password-error" className="mb-4 text-red-600 text-sm">
              {formErrors.password}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-violet hover:bg-brand-violetDark disabled:opacity-70 text-white font-semibold py-2 rounded focus:outline-none focus:ring-4 focus:ring-brand-accent transition"
            aria-busy={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* SIGN UP LINK - Add this */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-brand-violet hover:underline font-semibold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
