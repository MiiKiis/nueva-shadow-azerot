'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Shield, Radio, Copy, Check, X, Sparkles } from 'lucide-react';
import StatCards from '@/components/StatCards';
import Image from 'next/image';

import ParallaxImage from '@/components/ParallaxImage';
import PurpleSnow from '@/components/PurpleSnow';

// reCAPTCHA v3 site key (set in .env.local)
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';


  export default function Home() {
      // Username validation utility
      function isValidForumUsername(username: string) {
        return /^[a-zA-Z0-9]{3,16}$/.test(username);
      }

      // Username validation state for UI feedback
      const [usernameForValidation, setUsernameForValidation] = useState('');
      const usernameIsValid = isValidForumUsername(usernameForValidation);

    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const lkImageRef = useRef<HTMLDivElement>(null);
    const illidanImageRef = useRef<HTMLDivElement>(null);
    const [isLogin, setIsLogin] = useState(true);
    const [isRecover, setIsRecover] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Handle input changes for form fields
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'username') setUsernameForValidation(value);
    };
    const [faction, setFaction] = useState<'horde' | 'alliance' | null>(null);
    const [formData, setFormData] = useState({
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      pin: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [recaptchaReady, setRecaptchaReady] = useState(false);
    const [copied, setCopied] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [inviteToken, setInviteToken] = useState('');

    // Si ya hay sesión iniciada, siempre enviar al dashboard
    useEffect(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = String(params.get('ref') || '').trim();
        const forceRegister = params.get('register') === '1';
        if (token || forceRegister) {
          if (token) setInviteToken(token);
          setIsLogin(false);
          setIsRecover(false);
          setShowModal(true);
        }
      } catch {
        // ignore URL parse issues
      }

      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setCheckingSession(false);
          return;
        }

        const parsed = JSON.parse(storedUser);
        if (parsed?.id && parsed?.username) {
          router.replace('/dashboard');
          return;
        }
      } catch {
        // Ignorar errores de parsing y continuar al home
      }
      setCheckingSession(false);
    }, [router]);

    // ── Load reCAPTCHA v3 script ──────────────────────────────
    useEffect(() => {
      if (!RECAPTCHA_SITE_KEY) return;
      // Don't load twice
      if (document.getElementById('recaptcha-v3-script')) {
        setRecaptchaReady(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'recaptcha-v3-script';
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.onload = () => setRecaptchaReady(true);
      document.head.appendChild(script);
    }, []);

    // ── Character parallax effect ────────────────────────────
    useEffect(() => {
      const lkTarget = lkImageRef.current;
      const illidanTarget = illidanImageRef.current;
      if (!lkTarget && !illidanTarget) return;

      let ticking = false;
      const handleScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const offset = Math.min(Math.max(scrollY * 0.12, -30), 30);
          
          if (lkTarget) lkTarget.style.transform = `translateY(${offset}px)`;
          if (illidanTarget) illidanTarget.style.transform = `translateY(${offset * -0.5}px)`; // Different speed or direction
          
          ticking = false;
        });
      };

      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ── Get reCAPTCHA token ──────────────────────────────────
    const getRecaptchaToken = useCallback(async (): Promise<string> => {
      if (!RECAPTCHA_SITE_KEY) return '';
      try {
        const grecaptcha = (window as any).grecaptcha;
        if (!grecaptcha) {
          console.error('reCAPTCHA: grecaptcha not loaded');
          return '';
        }
        // Wait for grecaptcha to be ready
        return new Promise<string>((resolve) => {
          grecaptcha.ready(async () => {
            try {
              const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'register' });
              console.log('reCAPTCHA token obtained:', token ? 'yes' : 'no');
              resolve(token || '');
            } catch (err) {
              console.error('reCAPTCHA execute error:', err);
              resolve('');
            }
          });
        });
      } catch (err) {
        console.error('reCAPTCHA error:', err);
        return '';
      }
    }, [recaptchaReady]);

    // ── Handle Password Recovery Submit ──────────────────────
    const handleRecoverSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');
      setLoading(true);

      if (!formData.email.trim() || !formData.pin.trim() || !formData.username.trim()) {
        setError('El nombre de cuenta, correo electrónico y PIN son requeridos');
        setLoading(false);
        return;
      }
      
      if (!/^[0-9]{4}$/.test(formData.pin.trim())) {
        setError('Debes ingresar un PIN de 4 digitos válido');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/recover-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, pin: formData.pin, username: formData.username }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || data.message || 'Error al recuperar contraseña');
        }
        setError('');
        setSuccessMsg('¡Contraseña recuperada exitosamente! Revisa tu correo electrónico con tu nueva contraseña provisional.');
        setFormData({ ...formData, pin: '' });
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error inesperado');
      } finally {
        setLoading(false);
      }
    };

    // Validación y submit de login/registro
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');
      setLoading(true);

      if (!isLogin && !formData.email.trim()) {
        setError('El correo electronico es requerido');
        setLoading(false);
        return;
      }

      if (!isLogin && !isValidForumUsername(formData.username)) {
        setError('El usuario debe tener 3-16 caracteres y solo letras o numeros (sin espacios ni simbolos).');
        setLoading(false);
        return;
      }

      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }

      if (!isLogin && !/^[0-9]{4}$/.test(formData.pin.trim())) {
        setError('Debes ingresar un PIN de 4 digitos');
        setLoading(false);
        return;
      }

      if (!isLogin && !faction) {
        setError('Debes seleccionar una facción');
        setLoading(false);
        return;
      }

      try {
        const endpoint = isLogin ? '/api/login' : '/api/register';

        // Get reCAPTCHA token for registration
        let recaptchaToken = '';
        if (!isLogin && RECAPTCHA_SITE_KEY) {
          recaptchaToken = await getRecaptchaToken();
          if (!recaptchaToken) {
            setError('Error al verificar reCAPTCHA. Recarga la página.');
            setLoading(false);
            return;
          }
        }

        const body = isLogin
          ? { username: formData.username, password: formData.password }
          : {
              email: formData.email,
              username: formData.username,
              password: formData.password,
              pin: formData.pin,
              recaptchaToken,
              faction: faction || 'horde',
              inviteToken: inviteToken || undefined,
            };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || 'Error en la autenticación');
        }

        if (!isLogin) {
          // Guardar facción elegida para la nueva cuenta
          localStorage.setItem('pending_faction', faction || 'horde');
          setError('');
          setFormData({ email: '', username: '', password: '', confirmPassword: '', pin: '' });
          setIsLogin(true);
          setError('Cuenta creada! Ahora inicia sesión');
        } else {
          // Al iniciar sesión, intentar recuperar la facción guardada
          const savedFaction = localStorage.getItem(`faction_${data.user?.username?.toLowerCase()}`) ||
                               localStorage.getItem('pending_faction') ||
                               'horde';
          localStorage.removeItem('pending_faction');
          localStorage.setItem(
            `faction_${data.user?.username?.toLowerCase()}`,
            savedFaction
          );
          localStorage.setItem('user', JSON.stringify({
            id: data.user?.id,
            username: data.user?.username,
            faction: savedFaction,
          }));
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        }
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

  if (checkingSession) {
    return null;
  }

  return (
    <>
      <PurpleSnow />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes lightning-border {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(168,85,247,0.2), inset 0 0 10px rgba(168,85,247,0.1); }
          50% { box-shadow: 0 0 30px rgba(168,85,247,0.6), inset 0 0 20px rgba(168,85,247,0.3); }
        }
      `}} />
      <main className="relative min-h-screen overflow-x-hidden pt-28 sm:pt-32 pb-14 text-slate-100 flex flex-col justify-center">
        {/* Top-Right Glass Buttons */}
        <div className="absolute top-[90px] lg:top-[120px] right-4 sm:right-6 lg:right-10 z-[60] flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button 
            onClick={() => { setIsLogin(true); setIsRecover(false); setShowModal(true); }}
            className="group relative h-10 sm:h-12 px-5 sm:px-6 rounded-[1rem] flex items-center justify-center gap-2 overflow-hidden border border-purple-400/40 bg-[#0f0418]/60 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all hover:scale-105 active:scale-95 hover:border-purple-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-500/20 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <LogIn className="w-5 h-5 text-purple-300" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">Iniciar Sesión</span>
          </button>

          <button 
            onClick={() => { setIsLogin(false); setIsRecover(false); setShowModal(true); }}
            className="group relative h-10 sm:h-12 px-5 sm:px-6 rounded-[1rem] flex items-center justify-center gap-2 overflow-hidden border border-cyan-400/40 bg-[#071321]/60 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all hover:scale-105 active:scale-95 hover:border-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/0 via-cyan-500/20 to-cyan-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-5 h-5 text-cyan-300" />
            <span className="hidden sm:inline text-xs sm:text-sm font-black uppercase tracking-widest text-white">Crear Cuenta</span>
            <span className="sm:hidden text-xs sm:text-sm font-black uppercase tracking-widest text-white">Registro</span>
          </button>
        </div>


      <section className="max-w-5xl mx-auto px-4 sm:px-6 relative z-50 flex flex-col items-center text-center">
        <div className="pt-4 sm:pt-8 lg:pt-14 flex flex-col items-center w-full">
          <h1 className="text-5xl sm:text-6xl xl:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]" style={{ fontFamily: 'var(--font-cinzel-dec)' }}>
            <span className="bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent">ÚNETE A LA LUCHA</span>
            <span className="block bg-gradient-to-b from-purple-400 to-indigo-500 bg-clip-text text-transparent mt-2">POR AZEROTH</span>
          </h1>
          <p className="mt-6 max-w-xl text-2xl text-cyan-100/90 leading-snug drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] italic font-medium" style={{ fontFamily: 'var(--font-marcellus)' }}>
            Forja tu destino en IronBlood
          </p>
          <div className="mt-8 max-w-xl space-y-4 text-xl text-slate-100 leading-snug drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] flex flex-col items-center" style={{ fontFamily: 'var(--font-marcellus)' }}>
            <div className="group flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 px-8 py-3 rounded-2xl transition-all hover:bg-white/10 hover:border-amber-500/30">
              <span className="text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">⚡ Rates Leveo:</span> 
              <span className="text-2xl font-black">x8</span>
            </div>
            
            <div className="group flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 px-8 py-3 rounded-2xl transition-all hover:bg-white/10 hover:border-emerald-500/30">
              <span className="text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">🛠️ Profesiones:</span> 
              <span className="text-2xl font-black">x2 <small className="text-sm italic opacity-70 ml-1">(Temporal)</small></span>
            </div>

            <div className="group flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 px-8 py-3 rounded-2xl transition-all hover:bg-white/10 hover:border-purple-500/30">
              <span className="text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">💎 Drop:</span> 
              <span className="text-lg font-bold">Mítico x1 / <span className="opacity-70">grises x3</span></span>
            </div>

            <p className="mt-6 font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 pt-6 border-t border-white/20 tracking-wider uppercase drop-shadow-sm" style={{ fontFamily: 'var(--font-cinzel-dec)' }}>
              ¡Regístrate ahora y crea tu legado!
            </p>
          </div>
            <div className="mt-10 rounded-2xl border border-cyan-200/35 bg-gradient-to-r from-cyan-950/80 via-slate-900/85 to-indigo-950/80 backdrop-blur-sm p-4 sm:p-5 max-w-2xl shadow-[0_14px_35px_rgba(0,0,0,0.45)]">
              <h3 className="text-xl font-black uppercase tracking-wide text-white mb-6 border-b border-white/10 pb-2">Realmlist</h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-300 shrink-0" />
                  <div className="group relative flex items-center">
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("set realmlist wow.shadowazeroth.com");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/50"
                      title="Copiar realmlist"
                    >
                      <p className="text-[14px] sm:text-[15px] uppercase tracking-wide text-slate-300 font-bold">
                        wow.shadowazeroth.com
                      </p>
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                    {copied && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-md whitespace-nowrap shadow-lg backdrop-blur-sm border border-emerald-500/30">
                        Copiado!
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-300" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-300">Estado</p>
                    <p className="text-emerald-300 font-black">Online</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <StatCards />
              </div>
            </div>
          </div>


      </section>

      {/* Large Illidan image on the left side */}
      <div 
        ref={illidanImageRef}
        className="pointer-events-none absolute -left-40 bottom-0 hidden xl:flex items-end justify-start w-[50vw] max-w-[42rem] 2xl:max-w-[55rem] 3xl:max-w-[70rem] h-[111vh] overflow-hidden z-10 transition-transform duration-300 ease-out"
        style={{ willChange: 'transform' }}
      >
        <div className="relative h-full w-full">
          <Image 
            src="/illidan.svg" 
            alt="Illidan" 
            fill 
            className="object-contain object-bottom drop-shadow-[0_0_80px_rgba(74,222,128,0.45)]" 
            priority
          />
          {/* Subtle bottom fade to blend */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0a10] via-[#0a0a10]/60 to-transparent z-30" />
        </div>
      </div>

      {/* Large LK image on the right side */}
      <div 
        ref={lkImageRef} 
        className="pointer-events-none absolute -right-40 bottom-0 hidden xl:flex items-end justify-end w-[50vw] max-w-[42rem] 2xl:max-w-[55rem] 3xl:max-w-[70rem] h-[108vh] overflow-hidden z-10 transition-transform duration-300 ease-out" 
        style={{ willChange: 'transform' }}
      >
        <div className="relative h-full w-full">
          <Image 
            src="/lk.svg" 
            alt="LK" 
            fill 
            className="object-contain object-bottom drop-shadow-[0_0_80px_rgba(34,211,238,0.45)]" 
            priority
          />
          {/* Subtle bottom fade to blend */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0a10] via-[#0a0a10]/60 to-transparent z-30" />
        </div>
      </div>

      {/* Glassmorphism Lightning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          
          <div className="relative w-full max-w-lg rounded-[2rem] border border-purple-500/30 bg-[#0b0312]/85 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_80px_rgba(147,51,234,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Lightning Thunder Border Effect */}
            <div 
              className="absolute inset-0 pointer-events-none rounded-[2rem] border-[2px] border-transparent"
              style={{
                backgroundImage: 'linear-gradient(#0b0312, #0b0312), linear-gradient(135deg, transparent 30%, rgba(168,85,247,0.8) 50%, transparent 70%)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'content-box, border-box',
                backgroundSize: '300% 300%',
                animation: 'lightning-border 3s infinite linear'
              }}
            />

            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white z-20 bg-black/20 p-2 rounded-full backdrop-blur-sm border border-white/5 transition-all hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 max-h-[85vh] overflow-y-auto no-scrollbar pb-2 px-1">


            <h2 className="text-center text-3xl font-black uppercase tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mb-6">
              {isRecover ? 'Recuperar Cuenta' : isLogin ? 'Iniciar sesión ahora' : 'Crear cuenta ahora'}
            </h2>

            {!isLogin && !!inviteToken && (
              <div className="mb-4 rounded-2xl border border-cyan-400/40 bg-cyan-900/25 px-4 py-3 text-xs font-bold uppercase tracking-wider text-cyan-200">
                Registro vinculado a Recluta un Amigo
              </div>
            )}

            <form ref={formRef} onSubmit={isRecover ? handleRecoverSubmit : handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-rose-400/40 bg-rose-900/30 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-900/30 px-4 py-3 text-sm text-emerald-200">
                  {successMsg}
                </div>
              )}

              {(isRecover || !isLogin) && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full h-12 rounded-xl px-4 bg-[#741f31] border border-red-100/35 text-white placeholder:text-red-100/70 focus:outline-none focus:border-red-200/70 focus:ring-2 focus:ring-red-300/30"
                    placeholder="Correo electronico"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-full h-12 rounded-xl px-4 bg-[#741f31] border border-red-100/35 text-white placeholder:text-red-100/70 caret-red-100 focus:outline-none focus:border-red-200/70 focus:ring-2 focus:ring-red-300/30"
                  placeholder="Nombre para la cuenta"
                />
                {!isLogin && !isRecover && (
                  <p className={`mt-2 text-xs font-semibold ${
                    usernameForValidation.length === 0
                      ? 'text-slate-400'
                      : usernameIsValid
                        ? 'text-emerald-300'
                        : 'text-amber-300'
                  }`}>
                    {usernameForValidation.length === 0
                      ? 'Usa 3-16 caracteres: solo letras y números.'
                      : usernameIsValid
                        ? 'Nombre válido para crear cuenta.'
                        : 'Formato inválido: no se permiten espacios, guiones, tildes ni símbolos.'}
                  </p>
                )}
              </div>

              {!isRecover && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full h-12 rounded-xl px-4 bg-[#741f31] border border-red-100/35 text-white placeholder:text-red-100/70 focus:outline-none focus:border-red-200/70 focus:ring-2 focus:ring-red-300/30"
                    placeholder="Tu contraseña"
                  />
                </div>
              )}

              {!isRecover && !isLogin && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full h-12 rounded-xl px-4 bg-[#741f31] border border-red-100/35 text-white placeholder:text-red-100/70 focus:outline-none focus:border-red-200/70 focus:ring-2 focus:ring-red-300/30"
                    placeholder="Repite tu contraseña"
                  />
                </div>
              )}

              {(isRecover || !isLogin) && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                    PIN de seguridad (4 digitos)
                  </label>
                  <input
                    type="password"
                    name="pin"
                    value={formData.pin}
                    onChange={handleChange}
                    required
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    className="w-full h-12 rounded-xl px-4 bg-[#741f31] border border-red-100/35 text-white placeholder:text-red-100/70 focus:outline-none focus:border-red-200/70 focus:ring-2 focus:ring-red-300/30"
                    placeholder="1234"
                  />
                  {!isRecover && (
                    <p className="mt-2 text-xs text-slate-400">Este PIN se usara como capa extra de seguridad de tu cuenta.</p>
                  )}
                </div>
              )}

              <p className="text-center text-xs text-slate-400 pt-4 border-t border-white/10 flex flex-col gap-2">
                {!isRecover ? (
                  <span>
                    {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-cyan-300 hover:text-cyan-200 font-bold underline decoration-cyan-300/40 underline-offset-2"
                    >
                      {isLogin ? 'Crea una aquí' : 'Inicia sesión aquí'}
                    </button>
                  </span>
                ) : (
                  <span>
                    ¿Recordaste tu contraseña?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRecover(false)}
                      className="text-cyan-300 hover:text-cyan-200 font-bold underline decoration-cyan-300/40 underline-offset-2"
                    >
                      Inicia sesión aquí
                    </button>
                  </span>
                )}
                
                {(isLogin && !isRecover) && (
                  <button
                    type="button"
                    onClick={() => setIsRecover(true)}
                    className="text-amber-300 hover:text-amber-200 font-semibold"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </p>
            </form>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {isLogin ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => formRef.current?.requestSubmit()}
                  className={`h-12 min-w-[220px] w-full sm:col-span-2 px-6 rounded-xl inline-flex items-center justify-center gap-2 text-base font-black uppercase tracking-wide transition-all border border-red-200/40 bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-[0_10px_26px_rgba(190,24,93,0.45)] hover:from-red-600 hover:to-rose-600 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'CARGANDO...' : isRecover ? 'RECUPERAR CUENTA' : 'INICIAR SESIÓN AHORA'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setFaction('horde');
                      setTimeout(() => formRef.current?.requestSubmit(), 0);
                    }}
                    className={`h-16 sm:h-20 w-full flex-1 px-4 sm:px-6 rounded-2xl sm:rounded-[2rem] inline-flex items-center justify-center gap-3 sm:gap-4 text-base sm:text-xl font-black uppercase tracking-widest transition-all bg-gradient-to-br from-red-800 via-red-600 to-red-900 hover:from-red-700 hover:to-red-500 text-white border-2 sm:border-4 border-red-400 shadow-[0_10px_30px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 ${
                      faction === 'horde' ? 'ring-4 sm:ring-8 ring-red-400/30' : ''
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span>{loading && faction === 'horde' ? '...' : 'ÚNETE A LA HORDA'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setFaction('alliance');
                      setTimeout(() => formRef.current?.requestSubmit(), 0);
                    }}
                    className={`h-16 sm:h-20 w-full flex-1 px-4 sm:px-6 rounded-2xl sm:rounded-[2rem] inline-flex items-center justify-center gap-3 sm:gap-4 text-base sm:text-xl font-black uppercase tracking-widest transition-all bg-gradient-to-br from-blue-800 via-blue-600 to-blue-900 hover:from-blue-700 hover:to-blue-500 text-white border-2 sm:border-4 border-blue-400 shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95 ${
                      faction === 'alliance' ? 'ring-4 sm:ring-8 ring-blue-400/30' : ''
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span>{loading && faction === 'alliance' ? '...' : 'ÚNETE A LA ALIANZA'}</span>
                  </button>
                </>
              )}
            </div>

            <div className="mt-7 pt-6 border-t border-white/10 space-y-3 text-sm">
              <div className="flex items-start gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 mt-2 rounded-full bg-cyan-300 shrink-0" />
                <p>Acceso a tu personaje y estadísticas.</p>
              </div>
              <div className="flex items-start gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 mt-2 rounded-full bg-purple-300 shrink-0" />
                <p>Participa en el foro de la comunidad.</p>
              </div>
              <div className="flex items-start gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 mt-2 rounded-full bg-cyan-300 shrink-0" />
                <p>Apoya el servidor con donaciones.</p>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </main>
  </>
  );
}
