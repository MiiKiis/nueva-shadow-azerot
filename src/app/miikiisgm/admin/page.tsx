'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Trash2, PlusCircle, ArrowLeft, Package, Lock, Eye, EyeOff } from 'lucide-react';
import Script from 'next/script';

type ShopItem = {
  id: number;
  name: string;
  item_id: number;
  price: number;
  currency: 'vp' | 'dp';
  quality: string;
  category: string;
  tier: number;
  class_mask: number;
  image: string;
  soap_item_count: number;
};

type NewItem = {
  name: string;
  itemId: string;
  price: string;
  currency: 'vp' | 'dp';
  category: 'pve' | 'pvp' | 'misc';
  quality: 'comun' | 'poco_comun' | 'raro' | 'epico' | 'legendario';
  tier: string;
  classMask: string;
  image: string;
  soapCount: string;
};

const QUALITY_COLORS: Record<string, string> = {
  comun: '#ffffff',
  poco_comun: '#1eff00',
  raro: '#0070dd',
  epico: '#a335ee',
  legendario: '#ff8000',
};
const QUALITY_LABELS: Record<string, string> = {
  comun: 'Común',
  poco_comun: 'Poco Común',
  raro: 'Raro',
  epico: 'Épico',
  legendario: 'Legendario',
};
const CLASS_OPTIONS = [
  { mask: 0,    name: 'Todas las clases' },
  { mask: 1,    name: 'Guerrero'         },
  { mask: 2,    name: 'Paladin'          },
  { mask: 4,    name: 'Cazador'          },
  { mask: 8,    name: 'Picaro'           },
  { mask: 16,   name: 'Sacerdote'        },
  { mask: 32,   name: 'Caballero Muerte' },
  { mask: 64,   name: 'Shaman'          },
  { mask: 128,  name: 'Mago'            },
  { mask: 256,  name: 'Brujo'           },
  { mask: 1024, name: 'Druida'          },
];

const EMPTY_ITEM: NewItem = {
  name: '', itemId: '', price: '', currency: 'vp',
  category: 'misc', quality: 'comun', tier: '0',
  classMask: '0', image: '', soapCount: '1',
};

export default function AdminShopPage() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [accessChecking, setAccessChecking] = useState(false);
  const [storedUsername, setStoredUsername] = useState('');

  // Password gate
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [items, setItems] = useState<ShopItem[]>([]);
  const [newItem, setNewItem] = useState<NewItem>(EMPTY_ITEM);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');

  const getStoredUser = () => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { id?: number; username?: string };
    } catch {
      return null;
    }
  };

  const fetchItems = async () => {
    const user = getStoredUser();
    if (!user?.id) {
      router.push('/');
      return;
    }

    setFetchLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/shop?userId=${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo cargar la tienda');
      }

      setItems(Array.isArray(data.items) ? data.items : []);
      setIsAllowed(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error cargando la tienda';
      setError(message);
    } finally {
      setFetchLoading(false);
      setAccessChecking(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user?.id) {
      router.push('/');
      return;
    }
    setStoredUsername(user.username || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getStoredUser();
    if (!user?.username) {
      router.push('/');
      return;
    }
    if (!passwordInput) {
      setPasswordError('Introduce tu contraseña.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Contraseña incorrecta.');
        return;
      }
      // Password verified — now check gmlevel
      setPasswordVerified(true);
      setAccessChecking(true);
      setFetchLoading(true);
      await fetchItems();
    } catch {
      setPasswordError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = getStoredUser();
    if (!user?.id) {
      router.push('/');
      return;
    }

    if (!newItem.name.trim() || !newItem.itemId || !newItem.price) {
      setError('Rellena todos los campos obligatorios: nombre, Item ID y precio.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newItem.name.trim(),
          itemId: Number(newItem.itemId),
          price: Number(newItem.price),
          currency: newItem.currency,
          category: newItem.category,
          quality: newItem.quality,
          tier: Number(newItem.tier),
          classMask: Number(newItem.classMask),
          image: newItem.image.trim() || `inv_misc_questionmark`,
          soapCount: Number(newItem.soapCount) || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar item');
      }

      setNewItem(EMPTY_ITEM);
      await fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de conexion al agregar item';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const user = getStoredUser();
    if (!user?.id) {
      router.push('/');
      return;
    }

    const confirmed = window.confirm('Seguro que quieres retirar este item de Shadow Azeroth?');
    if (!confirmed) return;

    setError('');

    try {
      const res = await fetch(`/api/admin/shop?id=${id}&userId=${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo eliminar');
      }

      await fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error eliminando item';
      setError(message);
    }
  };

  // --- Password gate screen ---
  if (!passwordVerified) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 15%, rgba(34,211,238,0.10), transparent 32%), radial-gradient(circle at 82% 8%, rgba(147,51,234,0.18), transparent 28%), linear-gradient(180deg, #020205 0%, #070715 50%, #0b1020 100%)',
        }}
      >
        <div className="w-full max-w-sm">
          <div className="rounded-3xl border border-cyan-100/10 bg-[#060a13]/75 backdrop-blur-xl p-8 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col items-center mb-7">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-cyan-700 flex items-center justify-center shadow-[0_8px_24px_rgba(91,33,182,0.6)] mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Acceso GM</h1>
              <p className="text-gray-400 text-sm mt-1 text-center">
                Confirma tu identidad para continuar
              </p>
              {storedUsername && (
                <span className="mt-3 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-900/20 text-cyan-300 text-xs font-semibold">
                  {storedUsername}
                </span>
              )}
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña de tu cuenta"
                  autoComplete="current-password"
                  className="w-full bg-[#03060d]/80 border border-purple-500/30 rounded-2xl px-4 py-3.5 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-300/60"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {passwordError && (
                <p className="text-rose-300 text-sm px-1">{passwordError}</p>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
                className={`w-full py-3.5 rounded-2xl font-black text-base transition-all inline-flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(91,33,182,0.45)] ${
                  passwordLoading
                    ? 'bg-purple-700/70 animate-pulse cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-700 via-purple-600 to-cyan-700 hover:from-purple-600 hover:to-cyan-600'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                {passwordLoading ? 'VERIFICANDO...' : 'ENTRAR AL PANEL'}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // --- Loading spinner after password verified ---
  if (accessChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#04040a]">
        <div className="w-14 h-14 rounded-full border-4 border-purple-900 border-t-cyan-300 animate-spin" />
      </main>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return (
    <div className="min-h-screen text-white pt-28 pb-12 px-6 relative overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(circle at 18% 15%, rgba(34,211,238,0.12), transparent 32%), radial-gradient(circle at 82% 8%, rgba(147,51,234,0.2), transparent 28%), linear-gradient(180deg, #020205 0%, #070715 45%, #0b1020 100%)',
      }}
    >
      <Script id="wowhead-config-admin" strategy="afterInteractive">
        {`window.$WowheadPower = { colorlinks: true, iconizelinks: false, renamelinks: true, locale: 'es' };`}
      </Script>
      <Script src="https://wow.zamimg.com/widgets/power.js" strategy="afterInteractive" />

      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 10px)',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-10 flex items-center justify-between gap-4 rounded-3xl border border-cyan-200/10 bg-[#070b14]/55 backdrop-blur-xl px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              CONTROL GM <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">SHADOW AZEROTH</span>
            </h1>
            <p className="text-gray-300 mt-2 text-sm sm:text-base">
              Gestion de la tabla shop_items con acceso protegido para administradores.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-cyan-300/25 bg-[#080f1f]/70 text-cyan-100 hover:text-white hover:border-cyan-200/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/35 bg-rose-950/35 px-5 py-4 text-rose-200 text-sm">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <form
            onSubmit={handleAdd}
            className="xl:col-span-2 rounded-3xl border border-cyan-100/10 bg-[#060a13]/60 backdrop-blur-xl p-6 h-fit xl:sticky xl:top-24 shadow-[0_16px_45px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-2 mb-6">
              <PlusCircle className="w-5 h-5 text-cyan-300" />
              <h2 className="text-xl font-extrabold">Añadir Item a la Tienda</h2>
            </div>

            <div className="space-y-3">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Nombre del Item *</label>
                <input
                  type="text"
                  placeholder="ej: Espada del Caos"
                  className="w-full bg-[#03060d]/80 border border-purple-500/25 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-300/60"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  required
                />
              </div>

              {/* Item ID */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Item ID de WoW *</label>
                <input
                  type="number"
                  min={1}
                  placeholder="ej: 49426"
                  className="w-full bg-[#03060d]/80 border border-purple-500/25 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-300/60"
                  value={newItem.itemId}
                  onChange={(e) => setNewItem({ ...newItem, itemId: e.target.value })}
                  required
                />
              </div>

              {/* Precio + Moneda */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Precio *</label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    type="number"
                    min={1}
                    placeholder="ej: 5000"
                    className="bg-[#03060d]/80 border border-purple-500/25 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-300/60"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    required
                  />
                  <select
                    className="bg-[#0a1324] border border-purple-500/30 rounded-2xl px-4 py-3 text-cyan-200 font-bold outline-none cursor-pointer"
                    value={newItem.currency}
                    onChange={(e) => setNewItem({ ...newItem, currency: e.target.value as 'vp' | 'dp' })}
                  >
                    <option value="vp">VP</option>
                    <option value="dp">DP</option>
                  </select>
                </div>
              </div>

              {/* Categoría + Tier */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Categoría</label>
                  <select
                    className="w-full bg-[#0a1324] border border-purple-500/30 rounded-2xl px-4 py-3 text-white font-semibold outline-none cursor-pointer"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as 'pve'|'pvp'|'misc' })}
                  >
                    <option value="misc">MISC</option>
                    <option value="pve">PvE</option>
                    <option value="pvp">PvP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Tier (0-9)</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    placeholder="0"
                    className="w-full bg-[#03060d]/80 border border-purple-500/25 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                    value={newItem.tier}
                    onChange={(e) => setNewItem({ ...newItem, tier: e.target.value })}
                  />
                </div>
              </div>

              {/* Calidad */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Calidad</label>
                <select
                  className="w-full bg-[#0a1324] border border-purple-500/30 rounded-2xl px-4 py-3 font-semibold outline-none cursor-pointer"
                  style={{ color: QUALITY_COLORS[newItem.quality] }}
                  value={newItem.quality}
                  onChange={(e) => setNewItem({ ...newItem, quality: e.target.value as NewItem['quality'] })}
                >
                  {Object.entries(QUALITY_LABELS).map(([val, label]) => (
                    <option key={val} value={val} style={{ color: QUALITY_COLORS[val] }}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Clase */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Restricción de Clase</label>
                <select
                  className="w-full bg-[#0a1324] border border-purple-500/30 rounded-2xl px-4 py-3 text-white font-semibold outline-none cursor-pointer"
                  value={newItem.classMask}
                  onChange={(e) => setNewItem({ ...newItem, classMask: e.target.value })}
                >
                  {CLASS_OPTIONS.map(cls => (
                    <option key={cls.mask} value={cls.mask}>{cls.name}</option>
                  ))}
                </select>
              </div>

              {/* Imagen + Cantidad SOAP */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Icono (imagen)</label>
                  <input
                    type="text"
                    placeholder="inv_misc_questionmark"
                    className="w-full bg-[#03060d]/80 border border-purple-500/25 rounded-2xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                    value={newItem.image}
                    onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    max={255}
                    placeholder="1"
                    className="w-full bg-[#03060d]/80 border border-purple-500/25 rounded-2xl px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                    value={newItem.soapCount}
                    onChange={(e) => setNewItem({ ...newItem, soapCount: e.target.value })}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className={`w-full py-3.5 rounded-2xl font-black text-base transition-all shadow-[0_10px_30px_rgba(91,33,182,0.5)] inline-flex items-center justify-center gap-2 mt-2 ${
                  loading
                    ? 'bg-purple-700/70 animate-pulse cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-700 via-purple-600 to-cyan-700 hover:from-purple-600 hover:to-cyan-600'
                }`}
              >
                <PlusCircle className="w-5 h-5" />
                {loading ? 'GUARDANDO...' : 'AÑADIR A TIENDA'}
              </button>
            </div>
          </form>

          <div className="xl:col-span-3 rounded-3xl border border-cyan-100/10 bg-[#060a13]/60 backdrop-blur-xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-extrabold">Items en Tienda</h2>
                <p className="text-xs text-gray-400 mt-1">Puedes eliminar cualquier item guardado con el boton rojo de cada tarjeta.</p>
              </div>
              <span className="text-sm text-gray-400 bg-[#0a1324] rounded-full px-3 py-1 border border-purple-500/20">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {fetchLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl border border-purple-500/20 bg-[#0b1324]/60 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center text-gray-400 py-14 flex flex-col items-center gap-3">
                    <Package className="w-12 h-12 text-gray-600" />
                    <p>La tienda está vacía. Añade el primer item con el formulario.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-purple-500/20 bg-[#050a14]/85 px-4 py-4 hover:border-cyan-300/40 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={`https://es.wowhead.com/wotlk/item=${item.item_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0"
                          >
                            <img
                              src={`/icons/${item.image || 'inv_misc_questionmark'}.png`}
                              alt={item.name}
                              className="w-9 h-9 rounded-lg border border-cyan-300/30 bg-black/50 object-cover"
                            />
                          </a>
                          <a
                            href={`https://es.wowhead.com/wotlk/item=${item.item_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-white truncate hover:underline"
                            style={{ color: QUALITY_COLORS[item.quality] || '#fff' }}>
                            {item.name}
                          </a>
                          <span className="text-xs px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-300 uppercase font-semibold">
                            {item.category}{item.tier > 0 ? ` T${item.tier}` : ''}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full border border-cyan-500/30 text-cyan-300 font-mono">
                            #{item.item_id}
                          </span>
                          <span className="px-2 py-1 rounded-full border border-purple-500/35 text-purple-200 font-semibold uppercase">
                            {item.price.toLocaleString()} {item.currency}
                          </span>
                          {item.class_mask > 0 && (
                            <span className="px-2 py-1 rounded-full border border-amber-500/30 text-amber-300">
                              Clase: {item.class_mask}
                            </span>
                          )}
                          {item.soap_item_count > 1 && (
                            <span className="px-2 py-1 rounded-full border border-emerald-500/30 text-emerald-300">
                              x{item.soap_item_count}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-400/35 bg-rose-950/35 text-rose-200 hover:bg-rose-900/55 hover:text-white hover:border-rose-300/60 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar item
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
