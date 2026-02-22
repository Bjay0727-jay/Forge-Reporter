/**
 * ForgeComply 360 Reporter - Login Page
 * Matching ForgeComply 360 styling with email/password, MFA, and forgot password flows
 */
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const [, { login, verifyMFA }] = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionExpired = new URLSearchParams(window.location.search).get('expired') === '1';

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);
  const [mfaSetupMessage, setMfaSetupMessage] = useState('');

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.mfa_required) {
        setMfaRequired(true);
        setMfaToken(result.mfa_token!);
      } else if (result.mfa_setup_required) {
        setMfaSetupRequired(true);
        setMfaSetupMessage(result.message || 'MFA is required for privileged accounts.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMFA(mfaToken, mfaCode);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await api('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSuccess(true);
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetMfa = () => {
    setMfaRequired(false);
    setMfaToken('');
    setMfaCode('');
    setError('');
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    setForgotSuccess(false);
    setForgotError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-lime-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Forge Cyber Defense</h1>
          <p className="text-blue-200 mt-1">Enterprise GRC Reporting Platform</p>
        </div>

        {/* NIST AC-8 System Use Notification */}
        <div className="bg-blue-950/80 border border-blue-400/30 rounded-lg p-4 mb-4 text-xs text-blue-100/80 leading-relaxed">
          <p className="font-semibold text-blue-100 mb-1 text-sm">System Use Notification</p>
          <p>This is a Forge Cyber Defense system for authorized use only. By accessing this system, you consent to monitoring and recording of all activities. Unauthorized use is prohibited and subject to criminal and civil penalties. Use of this system constitutes consent to monitoring.</p>
        </div>

        {/* MFA Setup Required */}
        {mfaSetupRequired ? (
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">MFA Setup Required</h2>
              <p className="text-sm text-gray-600 mt-2">{mfaSetupMessage}</p>
            </div>
            <p className="text-sm text-gray-500 mb-4 text-center">
              As an administrator, two-factor authentication must be enabled before you can sign in. Please contact your system owner to enable MFA on your account.
            </p>
            <button
              type="button"
              onClick={() => { setMfaSetupRequired(false); setMfaSetupMessage(''); setError(''); }}
              className="w-full py-2.5 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Back to login
            </button>
          </div>

        /* MFA Verification */
        ) : mfaRequired ? (
          <form onSubmit={handleMfaSubmit} className="bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code from your authenticator app.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/[^A-Za-z0-9-]/g, ''))}
              maxLength={9}
              placeholder="000000"
              autoFocus
              autoComplete="one-time-code"
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.3em] border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">You can also use a backup code (XXXX-XXXX).</p>

            <button
              type="submit"
              disabled={loading || mfaCode.length < 6}
              className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={resetMfa}
              className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to login
            </button>
          </form>

        /* Forgot Password */
        ) : showForgotPassword ? (
          <div className="bg-white rounded-xl shadow-2xl p-8">
            {forgotSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 mb-6">
                  If an account exists with that email, you will receive a password reset link shortly.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  The link will expire in 15 minutes. Check your spam folder if you don't see the email.
                </p>
                <button
                  type="button"
                  onClick={resetForgotPassword}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Reset Your Password</h2>
                  <p className="text-sm text-gray-500 mt-1">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                {forgotError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {forgotError}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="you@company.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={resetForgotPassword}
                  className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Back to login
                </button>
              </form>
            )}
          </div>

        /* Main Login Form */
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

            {sessionExpired && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Your session has expired due to inactivity. Please sign in again.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
              Need an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Start free trial
              </button>
            </p>
          </form>
        )}

        <p className="text-center text-xs text-blue-200/60 mt-6">
          Forge Cyber Defense - Veteran-Owned Business
        </p>
      </div>
    </div>
  );
}
