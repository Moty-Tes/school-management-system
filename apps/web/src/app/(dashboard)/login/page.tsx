'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Shield, Lock, Search
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface LoginCredentials {
  email: string;
  password: string;
  remember: boolean;
}

interface LoginResponse {
  success: boolean;
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
  };
  error?: string;
}

export default function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({ email: '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const reducedMotion = use_reducedMotion();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.post<LoginResponse>('/api/v1/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      if (data.success && data.token) {
        // Store token and navigate
        localStorage.setItem('auth_token', data.token);
        navigate('/');
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-8 sm:p-12 max-w-md w-full border border-border">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="reduced-motion:transition-none text-3xl font-extrabold text-neutral-900 mb-4 text-center">
            School Management System
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="reduced-motion:transition-none text-neutral-500 text-sm mb-8 text-center">
            Premium SaaS Education Platform
          </motion.p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="reduced-motion:transition-none bg-red-100 dark:bg-red-900 rounded-lg p-4 mb-6 text-center"
            >
              <span className="text-red-600 text-sm">{error}</span>
            </motion.div>
          )}

          <form onSubmit={e => { e.preventDefault(); handleLogin(); }} className="space-y-6">
            <div>
              <label className="block text-sm text-neutral-600 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                placeholder="Enter your email"
                className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-600 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Enter your password"
                  className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-brand-primary transition-colors`}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={credentials.remember}
                  onChange={(e) => setCredentials({ ...credentials, remember: e.target.checked })}
                  className="rounded border border-border primary bg-brand-primary px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                />
                <span className="text-sm text-neutral-500">Remember me</span>
              </div>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-500">
            <a href="/register" className="hover:text-brand-primary transition-colors">Create account</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}