import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toastError, toastSuccess, apiErrorMessage } from '../../lib/alerts';

const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const navigate   = useNavigate();
  const { login }  = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPass,  setShowPass]  = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
      toastSuccess('Logged in successfully');
      navigate('/');
    } catch (error) {
      toastError(apiErrorMessage(error, 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#F2F4F8' }}
    >
      {/* Left panel – brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12"
        style={{
          background: 'linear-gradient(160deg, #0D2F8F 0%, #081E5C 100%)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white"
            style={{ padding: '4px' }}
          >
            <img src="/logo.svg" alt="Parcela Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
          <span className="text-white font-display font-bold text-xl">Parcela</span>
        </div>

        {/* Center quote */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2
              className="font-display font-bold text-4xl leading-tight mb-4"
              style={{ color: '#ffffff' }}
            >
              Manage your store with ease.
            </h2>
            <p style={{ color: '#8BAAD6', fontSize: 15 }}>
              Complete control over users, products, orders, and analytics — all in one place.
            </p>
          </motion.div>

          {/* Stats pill */}
          <div className="flex gap-3 mt-10">
            {[
              { label: 'Active Users',  value: '2.4k' },
              { label: 'Orders Today',  value: '138'  },
              { label: 'Revenue (CVE)', value: '97k'  },
            ].map((s) => (
              <div
                key={s.label}
                className="flex-1 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <p className="font-display font-bold text-xl" style={{ color: '#fff' }}>
                  {s.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#8BAAD6' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: '#5573D4', fontSize: 12 }}>© 2026 Parcela. All rights reserved.</p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm"
              style={{ padding: '4px' }}
            >
              <img src="/logo.svg" alt="Parcela Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: '#0D1B2A' }}>
              Parcela
            </span>
          </div>

          <h1 className="font-display font-bold text-2xl mb-1" style={{ color: '#0D1B2A' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
            Sign in to your admin account
          </p>

          <div
            className="rounded-2xl p-8"
            style={{ background: '#ffffff', border: '1px solid #E2E6EF', boxShadow: '0 4px 24px rgba(13,27,42,0.06)' }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0D1B2A' }}>
                  Email
                </label>
                <div className="relative">
                  <FiMail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ width: 15, height: 15, color: '#9CA3AF' }}
                  />
                  <input
                    {...register('email')}
                    type="email"
                    className="input pl-10"
                    placeholder="admin@parcela.cv"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs mt-1.5" style={{ color: '#EF4444' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0D1B2A' }}>
                  Password
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ width: 15, height: 15, color: '#9CA3AF' }}
                  />
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: '#9CA3AF' }}
                  >
                    {showPass
                      ? <FiEyeOff style={{ width: 15, height: 15 }} />
                      : <FiEye   style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs mt-1.5" style={{ color: '#EF4444' }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="login-submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 mt-2 disabled:opacity-60"
              >
                {isLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#9CA3AF' }}>
            Only admin and vendor accounts can access this dashboard.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
