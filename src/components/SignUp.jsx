import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Link, useNavigate } from 'react-router-dom';

const SignUp = () => {
  const { loading, error } = useUser(); // Use auth context for loading and error state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [signUpError, setSignUpError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { signUp } = useUser(); // We'll add a signUp method to context shortly
  const navigate = useNavigate();

  // Simple email validation regex
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!isValidEmail(email.trim())) errors.email = 'Please enter a valid email address';
    if (!password.trim()) errors.password = 'Password is required';
    else if (password.length < 8)
      errors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword)
      errors.confirmPassword = 'Passwords do not match';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignUpError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    try {
      const user = await signUp(email.trim(), password.trim(), name.trim());
      if (user) {
        setSuccessMessage('Sign-up successful! Please check your email to confirm your account.');
        // Optionally redirect to sign-in page after delay
        setTimeout(() => navigate('/signin'), 5000);
      }
    } catch (err) {
      setSignUpError(err.message || 'Failed to sign up');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-brand-violet">
          Create Account
        </h1>

        {signUpError && (
          <div
            role="alert"
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          >
            {signUpError}
          </div>
        )}
        {successMessage && (
          <div
            role="alert"
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <label htmlFor="name" className="block mb-1 font-semibold text-gray-700">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-violet mb-2 ${
              formErrors.name ? 'border-red-600' : 'border-gray-300'
            }`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={formErrors.name ? "true" : "false"}
            aria-describedby={formErrors.name ? "name-error" : undefined}
            disabled={loading}
          />
          {formErrors.name && (
            <p id="name-error" className="mb-2 text-red-600 text-sm">
              {formErrors.name}
            </p>
          )}

          {/* Email */}
          <label htmlFor="email" className="block mb-1 font-semibold text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-violet mb-2 ${
              formErrors.email ? 'border-red-600' : 'border-gray-300'
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={formErrors.email ? "true" : "false"}
            aria-describedby={formErrors.email ? "email-error" : undefined}
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
            id="password"
            name="password"
            type="password"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-violet mb-2 ${
              formErrors.password ? 'border-red-600' : 'border-gray-300'
            }`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            aria-invalid={formErrors.password ? "true" : "false"}
            aria-describedby={formErrors.password ? "password-error" : undefined}
            disabled={loading}
          />
          {formErrors.password && (
            <p id="password-error" className="mb-2 text-red-600 text-sm">
              {formErrors.password}
            </p>
          )}

          {/* Confirm Password */}
          <label htmlFor="confirmPassword" className="block mb-1 font-semibold text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-violet mb-4 ${
              formErrors.confirmPassword ? 'border-red-600' : 'border-gray-300'
            }`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            aria-invalid={formErrors.confirmPassword ? "true" : "false"}
            aria-describedby={formErrors.confirmPassword ? "confirm-password-error" : undefined}
            disabled={loading}
          />
          {formErrors.confirmPassword && (
            <p id="confirm-password-error" className="mb-4 text-red-600 text-sm">
              {formErrors.confirmPassword}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-violet hover:bg-brand-violetDark disabled:opacity-70 text-white font-semibold py-2 rounded focus:outline-none focus:ring-4 focus:ring-brand-accent transition"
            aria-busy={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/signin"
            className="text-brand-violet hover:underline font-semibold"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
