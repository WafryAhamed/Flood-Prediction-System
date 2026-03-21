import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

// IMPORTANT: Password validation must be done via backend API, not client-side hardcoding
// See: /api/v1/auth/login endpoint for proper credential validation
// This is a demo component - production admin access should use the standard /auth/login flow

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call backend auth endpoint for secure credential validation
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store token and mark as authenticated
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('auth_token', data?.tokens?.access_token ?? '');
        navigate('/admin', { replace: true });
      } else {
        setError('Invalid email or password.');
      }
    } catch {
      setError('Authentication service unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full mx-auto mt-20 p-6 bg-white rounded-xl shadow"
      >
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Admin Access
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
