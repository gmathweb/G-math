import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<LoginForm>();

  // If already authenticated, redirect
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה בהתחברות';
      setServerError(msg);
      setFocus('email');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 50%, #81C784 100%)',
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm" dir="rtl">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--g-green)]/10 mb-4">
            <span className="text-3xl font-bold text-[var(--g-green)]">G</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--tp)]">G-math</h1>
          <p className="text-sm text-[var(--ts)] mt-1">פאנל ניהול</p>
        </div>

        {/* Server error */}
        {serverError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-[var(--tp)] mb-1.5">
              אימייל
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors
                ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-[var(--bd)] focus:border-[var(--g-green)]'}
              `}
              placeholder="admin@g-math.co.il"
              {...register('email', {
                required: 'נא להזין אימייל',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'כתובת אימייל לא תקינה',
                },
              })}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--tp)] mb-1.5">
              סיסמה
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors
                ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-[var(--bd)] focus:border-[var(--g-green)]'}
              `}
              placeholder="••••••••"
              {...register('password', {
                required: 'נא להזין סיסמה',
                minLength: { value: 4, message: 'סיסמה חייבת להכיל לפחות 4 תווים' },
              })}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-[var(--g-green)] text-white font-semibold text-sm
              hover:bg-[#43A047] active:bg-[#388E3C] transition-colors
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            כניסה למערכת
          </button>
        </form>
      </div>
    </div>
  );
}
