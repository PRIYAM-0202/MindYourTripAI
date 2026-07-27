import { useState } from 'react';
import {
  Compass,
  Mail,
  Lock,
  Phone,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { TravelBackground } from '@/components/TravelBackground';
import { useAuth } from '@/lib/auth';
import { Link, useRouter } from '@/lib/router';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'signup' | 'forgot' | 'otp';

export function Auth() {
  const { signIn, signUp } = useAuth();
  const { navigate } = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', otp: '', remember: true });
  const [otpSent, setOtpSent] = useState(false);

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(form.email, form.password, form.remember);
        if (error) toast(error, 'error');
        else {
          toast('Welcome back!', 'success');
          navigate('/dashboard');
        }
      } else if (mode === 'signup') {
        if (form.password.length < 6) {
          toast('Password must be at least 6 characters', 'error');
          setLoading(false);
          return;
        }
        const { error } = await signUp(form.email, form.password, form.name);
        if (error) toast(error, 'error');
        else {
          toast('Account created — welcome to MindYourTrip AI', 'success');
          navigate('/dashboard');
        }
      } else if (mode === 'forgot') {
        toast('Password reset link sent to your email', 'success');
        setMode('login');
      } else if (mode === 'otp') {
        if (!otpSent) {
          setOtpSent(true);
          toast('OTP sent to your phone (demo mode)', 'info');
        } else {
          toast('Phone verified — please complete sign in with email', 'success');
          setMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <TravelBackground variant="full" />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-11 h-11 rounded-xl ai-gradient flex items-center justify-center shadow-glow">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div className="leading-tight text-left">
            <div className="font-display text-lg font-bold text-white">MindYourTrip AI</div>
            <div className="text-[10px] text-ai-300 font-medium tracking-wide">AI-ASSISTED TRAVEL</div>
          </div>
        </Link>

        <div className="glass-strong rounded-3xl p-7 shadow-glow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 ai-gradient" />

          {/* Mode tabs */}
          {mode !== 'forgot' && mode !== 'otp' && (
            <div className="flex gap-1 p-1 rounded-xl bg-ink-900/60 mb-6">
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                    mode === m ? 'ai-gradient text-white shadow-glow-soft' : 'text-slate-400 hover:text-white',
                  )}
                >
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          )}

          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-white">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Start your journey'}
              {mode === 'forgot' && 'Reset password'}
              {mode === 'otp' && 'Phone verification'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {mode === 'login' && 'Sign in to your travel workspace'}
              {mode === 'signup' && 'Create your free account'}
              {mode === 'forgot' && 'We\'ll send a reset link to your email'}
              {mode === 'otp' && (otpSent ? 'Enter the code we sent you' : 'Enter your phone number')}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <Field icon={UserIcon} label="Full name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Priyam Sharma"
                  className="input-field pl-11"
                />
              </Field>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <Field icon={Mail} label="Email">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-11"
                />
              </Field>
            )}

            {mode === 'otp' && (
              <Field icon={Phone} label="Phone number">
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={otpSent}
                  className="input-field pl-11"
                />
              </Field>
            )}

            {otpSent && (
              <Field icon={ShieldCheck} label="OTP code">
                <input
                  required
                  value={form.otp}
                  onChange={(e) => set('otp', e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="input-field pl-11 tracking-[0.5em] text-center"
                />
              </Field>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <Field icon={Lock} label="Password">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </Field>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => set('remember', e.target.checked)}
                    className="w-4 h-4 rounded accent-ai-500"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-ai-300 hover:text-ai-200"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send reset link'}
                  {mode === 'otp' && (otpSent ? 'Verify & continue' : 'Send OTP')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="divider" />
                <span className="text-xs text-slate-500">or continue with</span>
                <div className="divider" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => toast('Google sign-in requires additional setup', 'info')}
                  className="btn-ghost py-2.5 text-sm"
                >
                  <GoogleIcon /> Google
                </button>
                <button
                  onClick={() => setMode('otp')}
                  className="btn-ghost py-2.5 text-sm"
                >
                  <Phone className="w-4 h-4" /> Phone OTP
                </button>
              </div>
            </>
          )}

          {/* Back link */}
          {(mode === 'forgot' || mode === 'otp') && (
            <button
              onClick={() => {
                setMode('login');
                setOtpSent(false);
              }}
              className="mt-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </button>
          )}

          {/* Feature bullets */}
          {mode === 'signup' && (
            <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
              {[
                'AI-assisted trip planning & budgeting',
                'Smart, fair expense splitting',
                'Group chat, board & documents in one place',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                  <Check className="w-3.5 h-3.5 text-glow-teal" /> {f}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-5 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-ai-400" /> AI assists. Humans decide.
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-text mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        {children}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
