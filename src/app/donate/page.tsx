'use client';

import { Sparkles, CreditCard, Gift, TrendingUp, X, Shield, ShoppingCart, CheckCircle2, AlertTriangle, Search, Users, Heart, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

const DONATIONS = [
  { amount: 1, points: 1, bonus: 0, badge: null, highlight: false, plan: 'Inicial' },
  { amount: 5, points: 5, bonus: 0, badge: null, highlight: false, plan: 'Base' },
  { amount: 10, points: 10, bonus: 0, badge: 'RECOMENDADO', highlight: true, plan: 'Recomendado' },
  { amount: 20, points: 21, bonus: 5, badge: null, highlight: false, plan: 'Miikii Coins' },
  { amount: 30, points: 33, bonus: 10, badge: null, highlight: false, plan: 'Miikii Coins' },
  { amount: 50, points: 57, bonus: 14, badge: 'MEJOR VALOR', highlight: true, plan: 'Miikii Coins' },
].map(item => ({
  ...item,
  valuePerPoint: (item.amount / item.points).toFixed(2)
}));

const MAX_CREDITS_PER_DOLLAR = Math.max(...DONATIONS.map(item => item.points / item.amount));

const SHOP_CATEGORIES = [
  { id: 'all', label: 'TODOS' },
  { id: 'pve', label: 'PvE'   },
  { id: 'pvp', label: 'PvP'   },
  { id: 'transmog', label: 'TRANSFIGURACION' },
  { id: 'profesiones', label: 'PROFESIONES' },
  { id: 'monturas', label: 'MONTURAS' },
  { id: 'consumibles', label: 'CONSUMIBLES' },
  { id: 'tabardos', label: 'TABARDOS' },
];

const PROFESSIONS = [
  'all',
  'herboristeria',
  'mineria',
  'alquimia',
  'ingenieria',
  'sastreria',
  'herreria',
  'encantamiento',
  'inscripcion',
  'peleteria',
  'joyeria',
  'cocina',
  'primeros auxilios',
];

const CLASS_COLORS: Record<number, string> = {
  1: '#C79C6E', 2: '#F58CBA', 3: '#ABD473', 4: '#FFF569',
  5: '#FFFFFF', 6: '#C41F3B', 7: '#0070DE', 8: '#69CCF0',
  9: '#9482C9', 11: '#FF7D0A',
};
const CLASS_NAMES: Record<number, string> = {
  1: 'Guerrero', 2: 'Paladin', 3: 'Cazador', 4: 'Picaro',
  5: 'Sacerdote', 6: 'Cab. Muerte', 7: 'Shaman', 8: 'Mago',
  9: 'Brujo', 11: 'Druida',
};

const WOW_CLASSES = [
  { mask: 0,    name: 'Todos',                 abbr: 'ALL', color: '#9ca3af' },
  { mask: 1,    name: 'Guerrero',              abbr: 'GUE', color: '#C79C6E' },
  { mask: 2,    name: 'Paladin',               abbr: 'PAL', color: '#F58CBA' },
  { mask: 4,    name: 'Cazador',               abbr: 'CAZ', color: '#ABD473' },
  { mask: 8,    name: 'Picaro',                abbr: 'PIC', color: '#FFF569' },
  { mask: 16,   name: 'Sacerdote',             abbr: 'SAC', color: '#FFFFFF' },
  { mask: 32,   name: 'Cab. de la Muerte',     abbr: 'DK',  color: '#C41F3B' },
  { mask: 64,   name: 'Shaman',                abbr: 'SHA', color: '#0070DE' },
  { mask: 128,  name: 'Mago',                  abbr: 'MAG', color: '#69CCF0' },
  { mask: 256,  name: 'Brujo',                 abbr: 'BRU', color: '#9482C9' },
  { mask: 1024, name: 'Druida',                abbr: 'DRU', color: '#FF7D0A' },
];

type CharacterOption = {
  guid: number;
  name: string;
  class?: number;
  level?: number;
  race?: number;
};

type ShopItem = {
  id: number;
  item_id: number;
  image: string;
  name: string;
  price: number;
  currency: string;
  quality: string;
  category?: string;
  tier?: number;
  class_mask?: number;
  transmog_type?: string;
  transmog_level?: number;
  profession?: string;
  faction?: string;
};

export default function DonatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'donate' | 'rewards'>('donate');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<(typeof DONATIONS)[number] | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopCategory, setShopCategory] = useState<string>('all');
  const [shopTier, setShopTier] = useState<number>(0);
  const [shopClassFilter, setShopClassFilter] = useState<number>(0);
  const [transmogTypeFilter, setTransmogTypeFilter] = useState<'all' | 'arma' | 'armadura'>('all');
  const [transmogLevelFilter, setTransmogLevelFilter] = useState<0 | 60 | 70>(0);
  const [professionFilter, setProfessionFilter] = useState<string>('all');
  const [mountFactionFilter, setMountFactionFilter] = useState<'all' | 'horda' | 'alianza'>('all');
  const [tier9FactionFilter, setTier9FactionFilter] = useState<'all' | 'horda' | 'alianza'>('all');
  const [selectedCharacterGuid, setSelectedCharacterGuid] = useState<string>('');
  const [deliveryMode, setDeliveryMode] = useState<'self' | 'gift'>('self');
  const [giftSearch, setGiftSearch] = useState<string>('');
  const [giftCharacter, setGiftCharacter] = useState<CharacterOption | null>(null);
  const [giftPin, setGiftPin] = useState<string>('');
  const [giftSearching, setGiftSearching] = useState(false);
  const [giftSearchError, setGiftSearchError] = useState<string>('');
  const [giftResults, setGiftResults] = useState<CharacterOption[]>([]);
  const [purchaseMessage, setPurchaseMessage] = useState<string>('');
  const [purchaseError, setPurchaseError] = useState<string>('');
  const [purchasingItemId, setPurchasingItemId] = useState<number | null>(null);
  const [creatingCryptoInvoice, setCreatingCryptoInvoice] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setIsLoggedIn(true);
    setCheckingAuth(false);

    const loadCharacters = async () => {
      try {
        const response = await fetch(`/api/characters?accountId=${parsedUser.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'No se pudieron cargar los personajes');
        }

        const loadedCharacters = data.characters || [];
        setCharacters(loadedCharacters);
        if (loadedCharacters[0]?.guid) {
          setSelectedCharacterGuid(String(loadedCharacters[0].guid));
        }
      } catch (error) {
        console.error('Error loading characters for store:', error);
      }
    };

    const loadShopItems = async () => {
      try {
        const response = await fetch('/api/shop/items', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'No se pudieron cargar los items');
        }

        if (Array.isArray(data.items)) {
          setShopItems(data.items);
        } else {
          setShopItems([]);
        }
      } catch (error) {
        console.error('Error loading shop items:', error);
        setShopItems([]);
      }
    };

    loadCharacters();
    loadShopItems();
  }, [router]);

  const handlePurchase = async (itemId: number) => {
    if (!user) {
      setPurchaseError('Debes iniciar sesion para comprar.');
      return;
    }

    const isGift = deliveryMode === 'gift';
    const targetGuid = isGift ? giftCharacter?.guid : Number(selectedCharacterGuid);

    if (!targetGuid) {
      setPurchaseError(isGift ? 'Busca y selecciona un personaje destino.' : 'Selecciona un personaje para recibir la compra.');
      return;
    }

    if (isGift && !/^\d{4}$/.test(giftPin.trim())) {
      setPurchaseError('Debes ingresar tu PIN de 4 digitos para regalar.');
      return;
    }

    setPurchasingItemId(itemId);
    setPurchaseMessage('');
    setPurchaseError('');

    try {
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          itemId,
          characterGuid: targetGuid,
          isGift,
          pin: isGift ? giftPin.trim() : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.details || 'No se pudo completar la compra');
      }

      setPurchaseMessage(data.message || (isGift ? 'Regalo enviado con exito' : 'Compra realizada con exito'));
      if (isGift) {
        setGiftPin('');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al procesar la compra';
      setPurchaseError(message);
    } finally {
      setPurchasingItemId(null);
    }
  };

  const searchGiftCharacter = async () => {
    const query = giftSearch.trim();
    if (query.length < 2) {
      setGiftSearchError('Escribe al menos 2 letras.');
      return;
    }
    setGiftSearching(true);
    setGiftSearchError('');
    setGiftResults([]);
    setGiftCharacter(null);
    try {
      const res = await fetch(`/api/characters/search?name=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error buscando personaje');
      const results: CharacterOption[] = data.characters || [];
      if (results.length === 0) setGiftSearchError('Sin resultados. Verifica el nombre exacto.');
      else setGiftResults(results);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al buscar';
      setGiftSearchError(message);
    } finally {
      setGiftSearching(false);
    }
  };

  const handleCryptomusCheckout = async () => {
    if (!selectedDonation || creatingCryptoInvoice) return;

    setCreatingCryptoInvoice(true);

    try {
      const response = await fetch('/api/payments/cryptomus/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedDonation.amount,
          currency: 'USD',
          userId: user?.id || 0,
          donationPoints: selectedDonation.points,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo iniciar el pago con Cryptomus');
      }

      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al iniciar el pago crypto';
      alert(message);
    } finally {
      setCreatingCryptoInvoice(false);
    }
  };

  const filteredShopItems = shopItems.filter(item => {
    const itemCategory = (item.category || 'transmog') === 'misc' ? 'transmog' : (item.category || 'transmog');

    if (shopCategory !== 'all' && itemCategory !== shopCategory) return false;

    if (shopCategory === 'pve' && shopTier !== 0 && (item.tier ?? 0) !== shopTier) return false;

    if (shopCategory === 'pve' && shopTier === 9 && tier9FactionFilter !== 'all') {
      if ((item.faction || 'horda') !== tier9FactionFilter) return false;
    }

    if (shopCategory === 'transmog') {
      if (transmogTypeFilter !== 'all' && (item.transmog_type || 'arma') !== transmogTypeFilter) return false;
      if (transmogLevelFilter !== 0 && (item.transmog_level ?? 70) !== transmogLevelFilter) return false;
    }

    if (shopCategory === 'profesiones' && professionFilter !== 'all') {
      if ((item.profession || '').toLowerCase() !== professionFilter.toLowerCase()) return false;
    }

    if (shopCategory === 'monturas' && mountFactionFilter !== 'all') {
      if ((item.faction || 'horda') !== mountFactionFilter) return false;
    }

    if (shopClassFilter !== 0) {
      const mask = item.class_mask ?? 0;
      if (mask !== 0 && !(mask & shopClassFilter)) return false;
    }

    return true;
  });

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="w-12 h-12 border-4 border-purple-900 border-t-purple-600 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main 
      className="min-h-screen pt-32 pb-20 text-white selection:bg-purple-600/30 font-sans relative overflow-x-hidden"
      style={{
        backgroundImage: "url('/fono.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Script id="wowhead-config-donate" strategy="afterInteractive">
        {`window.$WowheadPower = { colorlinks: true, iconizelinks: false, renamelinks: true, locale: 'es' };`}
      </Script>
      <Script src="https://wow.zamimg.com/widgets/power.js" strategy="afterInteractive" />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50 z-0" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Tab Buttons */}
        <div className="flex gap-4 mb-12 justify-center">
          {isLoggedIn && (
            <button
              onClick={() => setActiveTab('donate')}
              className={`px-8 py-3 font-bold uppercase tracking-wider text-sm transition-all border-2 rounded-sm ${
                activeTab === 'donate'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 border-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                  : 'bg-transparent border-purple-900/50 text-gray-400 hover:border-purple-600 hover:text-purple-400'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              DONACIONES
            </button>
          )}
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-8 py-3 font-bold uppercase tracking-wider text-sm transition-all border-2 rounded-sm ${
              activeTab === 'rewards'
                ? 'bg-gradient-to-r from-purple-700 to-purple-600 border-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                : 'bg-transparent border-purple-900/50 text-gray-400 hover:border-purple-600 hover:text-purple-400'
            }`}
          >
            <Gift className="w-4 h-4 inline mr-2" />
            RECOMPENSAS
          </button>
        </div>

        {/* Not Logged In Message */}
        {!isLoggedIn && activeTab === 'donate' && (
          <div className="text-center mb-12 p-8 bg-purple-900/30 border border-purple-600/50 rounded-lg">
            <h2 className="text-2xl font-black text-white mb-4">Inicia sesión para donar</h2>
            <p className="text-gray-400 mb-6">Necesitas estar conectado con tu cuenta para acceder a la sección de donaciones.</p>
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all">
              🔐 Iniciar sesión
            </button>
          </div>
        )}

        {/* DONACIONES TAB */}
        {isLoggedIn && activeTab === 'donate' && (
          <div className="text-center">
            <div className="flex flex-col items-center gap-2 mb-6">
              <CreditCard className="w-12 h-12 text-purple-500 animate-pulse bg-purple-950/20 p-3 rounded-full border border-purple-900/40" />
              <h1 className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] uppercase">Apoya al Servidor</h1>
              <p className="text-base text-gray-400 mt-2 leading-relaxed font-light max-w-xl">Tus donaciones mantienen los servidores estables sin lag</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-6xl mx-auto">
          {DONATIONS.map((item, i) => {
            const isInsta80Pack = item.amount === 10;

            return (
            <div key={i} className="relative group transition-all duration-300">
              <div className="relative p-6 rounded-lg backdrop-blur-md transition-all duration-300 h-full flex flex-col overflow-hidden bg-black/70 border border-purple-900/30 hover:border-purple-500/45 shadow-2xl shadow-black/60 border-b-4 border-b-purple-900 hover:border-b-purple-600 hover:bg-black/65 hover:scale-[1.02]">
                {item.highlight && (
                  <div className="pointer-events-none absolute inset-0 opacity-90">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-600/30 blur-md" />
                  </div>
                )}

                <h2 className="font-black italic uppercase tracking-tighter mb-3 text-center text-3xl text-purple-600 group-hover:text-purple-500">
                  ${item.amount}
                </h2>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/75 text-center font-black mb-3">{item.plan}</p>
                
                {/* COIN GRANDE Y CENTRADA */}
                <div className="flex justify-center mb-4">
                  {isInsta80Pack ? (
                    <div className="relative h-[112px] w-[112px] rounded-full border border-cyan-300/45 bg-gradient-to-b from-cyan-300/20 via-cyan-500/10 to-black/30 shadow-[0_0_30px_rgba(34,211,238,0.5)] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/0" />
                      <Image
                        src="/shadow-azeroth.png"
                        alt="Pack Insta-80"
                        fill
                        className="object-cover opacity-65"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Zap className="w-6 h-6 text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                        <span className="mt-1 text-[10px] font-black tracking-[0.22em] text-cyan-100">INSTA-80</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative transition-transform group-hover:scale-125 h-[110px] w-[110px] rounded-full border border-white/10 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-white/0" />
                      <div className="absolute inset-0 blur-xl bg-purple-600/40 rounded-full" />
                      <Image 
                        src="/coin.png" 
                        alt="Coin" 
                        width={110}
                        height={110}
                        className="relative drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                      />
                    </div>
                  )}
                </div>

                {/* PUNTOS Y INFO */}
                <div className="text-center mb-5">
                  <div className="font-black mb-1 text-2xl text-white">
                    {item.points.toLocaleString()}
                  </div>
                  <div className="text-white/70 font-semibold text-xs mb-2">CREDITOS</div>
                  <div className="bg-purple-900/40 rounded-lg p-2">
                    <span className="text-xs text-white/80 font-bold">
                      ${item.valuePerPoint}/credito
                    </span>
                  </div>
                </div>
                
                {item.bonus > 0 && (
                  <div className="font-bold uppercase mb-4 text-center transition-colors py-1.5 rounded border border-cyan-300/35 bg-cyan-400/10 text-cyan-200 text-xs">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{item.bonus}% BONUS
                    </div>
                  </div>
                )}

                {item.highlight && (
                  <div className="bg-purple-900/40 border border-amber-300/40 rounded-lg p-2.5 mb-4 text-xs text-white/80">
                    <div className="font-bold text-amber-300 text-[11px] mb-0.5">💰 Mejor valor</div>
                    <div className="text-[10px] text-white/70">Máximos puntos</div>
                  </div>
                )}
                
                <button 
                  onClick={() => {
                    setSelectedDonation(item);
                    setShowCheckout(true);
                  }}
                  className="w-full py-3 font-black text-xs uppercase tracking-widest rounded transition-all border-b-4 mt-auto group/btn hover:-translate-y-0.5 bg-purple-700 hover:bg-purple-600 text-white shadow-[0_10px_30px_rgba(168,85,247,0.3)] border-b-purple-900 hover:border-purple-600">
                  <span className="inline-block transition-transform group-hover/btn:translate-x-1 text-[11px]">
                    🛒 COMPRAR
                  </span>
                </button>
              </div>
            </div>
          );
          })}
        </div>

            {/* Comparison Table */}
            <div className="mt-12 max-w-xl mx-auto">
              <h3 className="text-xl font-black text-white mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Comparativa
              </h3>
              <div className="bg-black/40 border border-purple-900/30 rounded overflow-hidden backdrop-blur-md text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-900/30 bg-purple-950/30">
                      <th className="px-3 py-1.5 text-left text-purple-400 font-bold">Paquete</th>
                      <th className="px-3 py-1.5 text-right text-purple-400 font-bold">Creditos/$</th>
                      <th className="px-3 py-1.5 text-right text-purple-400 font-bold">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DONATIONS.map((item, i) => (
                      <tr key={i} className={`border-b border-purple-900/20 transition-colors ${
                        item.highlight ? 'bg-purple-900/30 hover:bg-purple-900/50' : 'hover:bg-purple-950/20'
                      }`}>
                        <td className="px-3 py-2 text-white font-bold">
                          ${item.amount}
                          {item.badge && <span className="ml-1 text-[9px] text-yellow-400">{item.badge}</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`font-bold ${item.highlight ? 'text-yellow-400' : 'text-green-400'}`}>
                            {(item.points / item.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <div className="w-16 bg-gray-800 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all ${item.highlight ? 'bg-yellow-500' : 'bg-purple-500'}`}
                                style={{width: `${((item.points / item.amount) / MAX_CREDITS_PER_DOLLAR) * 100}%`}}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RECOMPENSAS TAB */}
        {activeTab === 'rewards' && (
          <div>
            <div className="flex flex-col items-center gap-2 mb-8 text-center">
              <Gift className="w-12 h-12 text-[#d4af37] animate-pulse bg-[#d4af37]/10 p-3 rounded-full border border-[#d4af37]/30" />
              <h1 className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(212,175,55,0.35)] uppercase">Arsenal de Recompensas</h1>
              <p className="text-base text-gray-400 mt-2 leading-relaxed font-light max-w-2xl">Canjea tus puntos por equipo, reliquias y consumibles del reino.</p>
            </div>

            <div className="max-w-6xl mx-auto mb-8 rounded-2xl border border-[#d4af37]/20 bg-black/45 backdrop-blur-md p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              {/* ── Header row ── */}
              <div className="px-6 py-4 bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37]/5 to-transparent border-b border-[#d4af37]/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/80 font-black">Destino de entrega</p>
                    <p className="text-white font-black text-sm leading-none mt-0.5">¿Quién recibe el item?</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-bold">Cuenta activa</p>
                  <p className="text-white font-black text-sm">{user?.username || 'Invitado'}</p>
                </div>
              </div>

              <div className="p-5">
                {/* ── Mode toggle full-width pill ── */}
                <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#0d0d18] border border-white/[0.07] mb-6">
                  <button
                    onClick={() => { setDeliveryMode('self'); setGiftCharacter(null); setGiftResults([]); setGiftSearchError(''); }}
                    className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
                      deliveryMode === 'self'
                        ? 'bg-[#d4af37] text-black shadow-[0_4px_24px_rgba(212,175,55,0.5)]'
                        : 'text-gray-400 hover:text-[#d4af37]'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    Mis personajes
                  </button>
                  <button
                    onClick={() => { setDeliveryMode('gift'); setGiftPin(''); }}
                    className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
                      deliveryMode === 'gift'
                        ? 'bg-rose-600 text-white shadow-[0_4px_24px_rgba(225,29,72,0.5)]'
                        : 'text-gray-400 hover:text-rose-400'
                    }`}
                  >
                    <Heart className="w-4 h-4 shrink-0" />
                    🎁 Regalar a otro
                  </button>
                </div>

                {/* ── OWN CHARACTERS GRID ── */}
                {deliveryMode === 'self' && (
                  <div>
                    {characters.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                        <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-300 text-sm font-semibold">Sin personajes disponibles</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {characters.map(char => {
                          const clsColor = CLASS_COLORS[char.class ?? 0] ?? '#9ca3af';
                          const clsName  = CLASS_NAMES[char.class ?? 0]  ?? 'Desconocido';
                          const isSelected = selectedCharacterGuid === String(char.guid);
                          return (
                            <button
                              key={char.guid}
                              onClick={() => setSelectedCharacterGuid(String(char.guid))}
                              className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left overflow-hidden ${
                                isSelected
                                  ? 'bg-[#0e0e1c] border-transparent'
                                  : 'bg-[#0a0a16] border-white/[0.08] hover:border-white/20 hover:bg-[#0f0f1e]'
                              }`}
                              style={isSelected ? { boxShadow: `0 0 0 2px ${clsColor}, 0 8px 30px rgba(0,0,0,0.6)` } : {}}
                            >
                              {/* Colored top stripe */}
                              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ backgroundColor: clsColor, opacity: isSelected ? 1 : 0.4 }} />
                              {isSelected && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-black shadow-md" style={{ backgroundColor: clsColor }}>✓</div>
                              )}
                              {/* Class badge */}
                              <span className="mt-1 mb-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ background: `${clsColor}25`, color: clsColor }}>
                                {clsName}
                              </span>
                              <span className="font-black text-white text-base leading-tight">{char.name}</span>
                              <span className="text-gray-300 text-xs font-semibold mt-1">Nivel {char.level ?? '?'}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── GIFT MODE ── */}
                {deliveryMode === 'gift' && (
                  <div>
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-950/50 border border-rose-500/25 mb-5">
                      <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-rose-100 text-sm leading-relaxed font-medium">
                        Los puntos se descuentan de <span className="font-black text-white">tu cuenta</span>. El item se entrega al personaje que elijas.
                      </p>
                    </div>

                    <p className="text-xs uppercase tracking-[0.25em] text-gray-400 font-black mb-2">Nombre del personaje destino</p>
                    <div className="flex gap-3 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={giftSearch}
                          onChange={e => setGiftSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && searchGiftCharacter()}
                          placeholder="Escribe el nombre exacto..."
                          className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#0d0d18] border border-white/10 text-white placeholder-gray-600 outline-none focus:border-rose-500/60 focus:bg-[#110d18] font-semibold transition-all text-sm"
                        />
                      </div>
                      <button
                        onClick={searchGiftCharacter}
                        disabled={giftSearching}
                        className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(225,29,72,0.35)] flex items-center gap-2"
                      >
                        {giftSearching
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <><Search className="w-4 h-4" /> Buscar</>}
                      </button>
                    </div>

                    {giftSearchError && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-950/60 border border-rose-500/30 mb-4">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <p className="text-rose-200 text-sm font-semibold">{giftSearchError}</p>
                      </div>
                    )}

                    {giftResults.length > 0 && !giftCharacter && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-black mb-2">Selecciona un personaje</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                          {giftResults.map(char => {
                            const clsColor = CLASS_COLORS[char.class ?? 0] ?? '#9ca3af';
                            return (
                              <button
                                key={char.guid}
                                onClick={() => { setGiftCharacter(char); setGiftResults([]); }}
                                className="flex flex-col items-start p-3.5 rounded-xl bg-[#0a0a16] border border-white/[0.08] hover:bg-rose-950/50 hover:border-rose-500/50 transition-all text-left group"
                              >
                                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mb-1.5" style={{ background: `${clsColor}25`, color: clsColor }}>
                                  {CLASS_NAMES[char.class ?? 0] ?? 'Clase ?'}
                                </span>
                                <span className="font-black text-white text-sm group-hover:text-rose-100 transition-colors">{char.name}</span>
                                <span className="text-gray-400 text-xs font-semibold mt-0.5">Nivel {char.level ?? '?'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {giftCharacter && (() => {
                      const clsColor = CLASS_COLORS[giftCharacter.class ?? 0] ?? '#9ca3af';
                      const clsName  = CLASS_NAMES[giftCharacter.class ?? 0]  ?? 'Desconocido';
                      return (
                        <div className="flex items-center gap-4 px-5 py-4 rounded-xl border-2" style={{ borderColor: `${clsColor}80`, background: `${clsColor}0f` }}>
                          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-black text-xl" style={{ background: `${clsColor}22`, color: clsColor }}>
                            {giftCharacter.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-base leading-tight">{giftCharacter.name}</p>
                            <p className="text-sm font-semibold mt-0.5" style={{ color: clsColor }}>
                              {clsName}<span className="text-gray-300 font-normal"> · Nivel {giftCharacter.level ?? '?'}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg text-white" style={{ background: `${clsColor}33` }}>✓ Listo</span>
                            <button onClick={() => { setGiftCharacter(null); setGiftSearch(''); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {giftCharacter && (
                      <div className="mt-5">
                        <label className="block text-[10px] uppercase tracking-[0.25em] text-gray-400 font-black mb-2">
                          PIN de seguridad para regalar
                        </label>
                        <input
                          type="password"
                          value={giftPin}
                          onChange={e => setGiftPin(e.target.value)}
                          inputMode="numeric"
                          pattern="[0-9]{4}"
                          maxLength={4}
                          placeholder="Ingresa tu PIN de 4 digitos"
                          className="w-full max-w-sm px-4 py-3 rounded-xl bg-[#0d0d18] border border-white/10 text-white placeholder-gray-600 outline-none focus:border-rose-500/60 focus:bg-[#110d18] font-semibold transition-all text-sm"
                        />
                        <p className="mt-2 text-xs text-gray-500 font-semibold">Se solicita tu PIN para autorizar regalos a otros personajes.</p>
                      </div>
                    )}
                  </div>
                )}

                {purchaseMessage && (
                  <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/60 px-4 py-3 text-emerald-100 flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{purchaseMessage}</span>
                  </div>
                )}

                {purchaseError && (
                  <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-950/60 px-4 py-3 text-rose-100 flex items-center gap-3 text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span className="font-semibold">{purchaseError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Shop Navigation ────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto mb-6 px-4">
              {/* Category tabs */}
              <div className="flex gap-3 mb-4 flex-wrap">
                {SHOP_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setShopCategory(cat.id);
                      setShopTier(0);
                      setTransmogTypeFilter('all');
                      setTransmogLevelFilter(0);
                      setProfessionFilter('all');
                      setMountFactionFilter('all');
                      setTier9FactionFilter('all');
                    }}
                    className={`px-7 py-3 rounded-xl font-black text-base tracking-widest uppercase transition-all border-2 ${
                      shopCategory === cat.id
                        ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.6)]'
                        : 'bg-black/50 text-gray-300 border-purple-900/40 hover:border-[#d4af37]/60 hover:text-[#d4af37]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Tier sub-tabs — solo visibles en PvE */}
              {shopCategory === 'pve' && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  <button
                    onClick={() => setShopTier(0)}
                    className={`px-6 py-2.5 rounded-lg font-black text-sm tracking-wider uppercase whitespace-nowrap transition-all border-2 shrink-0 ${
                      shopTier === 0
                        ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                        : 'bg-black/50 text-gray-300 border-purple-900/40 hover:border-purple-500 hover:text-white'
                    }`}
                  >
                    TODOS
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(t => (
                    <button
                      key={t}
                      onClick={() => setShopTier(t)}
                      className={`px-6 py-2.5 rounded-lg font-black text-sm tracking-wider uppercase whitespace-nowrap transition-all border-2 shrink-0 ${
                        shopTier === t
                          ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                          : 'bg-black/50 text-gray-300 border-purple-900/40 hover:border-purple-500 hover:text-white'
                      }`}
                    >
                      Tier {t}
                    </button>
                  ))}
                </div>
              )}

              {shopCategory === 'pve' && shopTier === 9 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'Todas las facciones' },
                    { id: 'horda', label: 'Horda' },
                    { id: 'alianza', label: 'Alianza' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setTier9FactionFilter(f.id as 'all' | 'horda' | 'alianza')}
                      className={`px-6 py-2.5 rounded-lg font-black text-sm tracking-wider uppercase whitespace-nowrap transition-all border-2 shrink-0 ${
                        tier9FactionFilter === f.id
                          ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_12px_rgba(225,29,72,0.5)]'
                          : 'bg-black/50 text-gray-300 border-rose-900/40 hover:border-rose-500 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {shopCategory === 'transmog' && (
                <>
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                    {[
                      { id: 'all', label: 'Todo tipo' },
                      { id: 'arma', label: 'Armas' },
                      { id: 'armadura', label: 'Armaduras' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTransmogTypeFilter(t.id as 'all' | 'arma' | 'armadura')}
                        className={`px-6 py-2.5 rounded-lg font-black text-sm tracking-wider uppercase whitespace-nowrap transition-all border-2 shrink-0 ${
                          transmogTypeFilter === t.id
                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(8,145,178,0.55)]'
                            : 'bg-black/50 text-gray-300 border-cyan-900/40 hover:border-cyan-500 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {[
                      { id: 0, label: 'Todo nivel' },
                      { id: 60, label: 'Nivel 60' },
                      { id: 70, label: 'Nivel 70' },
                    ].map(l => (
                      <button
                        key={l.id}
                        onClick={() => setTransmogLevelFilter(l.id as 0 | 60 | 70)}
                        className={`px-6 py-2.5 rounded-lg font-black text-sm tracking-wider uppercase whitespace-nowrap transition-all border-2 shrink-0 ${
                          transmogLevelFilter === l.id
                            ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_12px_rgba(14,116,144,0.55)]'
                            : 'bg-black/50 text-gray-300 border-cyan-900/40 hover:border-cyan-500 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {shopCategory === 'profesiones' && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {PROFESSIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => setProfessionFilter(p)}
                      className={`px-5 py-2.5 rounded-lg font-black text-sm tracking-wider uppercase whitespace-nowrap transition-all border-2 shrink-0 ${
                        professionFilter === p
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.55)]'
                          : 'bg-black/50 text-gray-300 border-emerald-900/40 hover:border-emerald-500 hover:text-white'
                      }`}
                    >
                      {p === 'all' ? 'Todas' : p}
                    </button>
                  ))}
                </div>
              )}

              {shopCategory === 'monturas' && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'horda', label: 'Horda' },
                    { id: 'alianza', label: 'Alianza' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setMountFactionFilter(f.id as 'all' | 'horda' | 'alianza')}
                      className={`px-6 py-2.5 rounded-lg font-black text-sm tracking-wider uppercase whitespace-nowrap transition-all border-2 shrink-0 ${
                        mountFactionFilter === f.id
                          ? 'bg-red-700 text-white border-red-400 shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                          : 'bg-black/50 text-gray-300 border-red-900/40 hover:border-red-500 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Filtro por clase */}
              {['all', 'pve', 'pvp', 'transmog'].includes(shopCategory) && (
                <div className="flex gap-2.5 flex-wrap pb-1">
                  {WOW_CLASSES.map(cls => (
                    <button
                      key={cls.mask}
                      onClick={() => setShopClassFilter(cls.mask)}
                      title={cls.name}
                      className={`px-4 sm:px-5 py-2.5 rounded-lg font-black text-sm sm:text-[13px] tracking-wider uppercase transition-all border-2 shrink-0 whitespace-nowrap ${
                        shopClassFilter === cls.mask
                          ? 'border-transparent text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                          : 'bg-black/50 border-purple-900/40 hover:border-white/30 hover:bg-black/70'
                      }`}
                      style={
                        shopClassFilter === cls.mask
                          ? { backgroundColor: cls.color, borderColor: cls.color }
                          : { color: cls.color }
                      }
                    >
                      <span className="sm:hidden">{cls.abbr}</span>
                      <span className="hidden sm:inline">{cls.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-400 mt-3 pl-0.5 font-semibold">
                {filteredShopItems.length} item{filteredShopItems.length !== 1 ? 's' : ''} encontrados
              </p>
            </div>

            {filteredShopItems.length === 0 ? (
              <div className="max-w-6xl mx-auto p-8 rounded-2xl border border-[#d4af37]/20 bg-black/45 text-center">
                <Gift className="w-10 h-10 text-[#d4af37]/70 mx-auto mb-3" />
                <p className="text-white font-black text-lg">Sin items cargados</p>
                <p className="text-gray-400 mt-2">Aun no hay recompensas publicadas. Puedes cargarlas desde el panel de administracion.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4 max-w-6xl mx-auto">
                {filteredShopItems.map((item) => (
                <div key={item.id} className="group bg-[#09090c]/85 border border-purple-900/30 rounded-2xl p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-md hover:border-[#d4af37]/35 transition-all">
                  <div className="relative flex items-center gap-4">
                    <a
                      href={`https://es.wowhead.com/wotlk/item=${item.item_id}`}
                      data-wh-icon-size="large"
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                    >
                      <img
                        src={`/icons/${item.image}.png`}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl border-2 border-[#d4af37]/40 bg-black/60 object-cover group-hover:border-[#d4af37] transition-colors"
                      />
                    </a>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-purple-400 font-black mb-1">{item.quality}</p>
                      <h3 className="text-white font-black text-lg leading-tight truncate">{item.name}</h3>
                      <p className="text-[#d4af37] font-mono text-sm mt-1">{item.price.toLocaleString()} {item.currency.toUpperCase()}</p>
                    </div>

                    <div className="pointer-events-none absolute left-16 -top-3 z-30 hidden lg:block opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                      <div className="w-72 rounded-xl border border-[#d4af37]/30 bg-[#07070d]/95 backdrop-blur-md p-3 shadow-[0_18px_35px_rgba(0,0,0,0.55)]">
                        <div className="flex items-start gap-3">
                          <img
                            src={`/icons/${item.image}.png`}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg border border-[#d4af37]/40 bg-black/70 object-cover"
                          />
                          <div className="min-w-0 text-left">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-purple-300 font-black">{item.quality}</p>
                            <p className="text-sm font-black text-white leading-tight mt-1 break-words">{item.name}</p>
                            <p className="text-[#d4af37] font-mono text-xs mt-1">{item.price.toLocaleString()} {item.currency.toUpperCase()}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-gray-400 leading-relaxed text-left">Previsualizacion rapida del item. Haz click en el icono para abrir la ficha completa.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-xs text-gray-400 leading-relaxed">
                    Enlace rapido a base de datos pública del item. Compra directa al personaje seleccionado arriba.
                  </div>

                  <button
                    onClick={() => handlePurchase(item.id)}
                    disabled={purchasingItemId === item.id || !selectedCharacterGuid}
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b1d8c] to-[#7a2bc2] hover:from-[#6b22a4] hover:to-[#8f37db] text-white py-3.5 rounded-xl transition font-black text-base border border-purple-400/20 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_12px_30px_rgba(91,29,140,0.35)]"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {purchasingItemId === item.id ? 'Procesando...' : (deliveryMode === 'gift' ? 'Regalar ahora' : 'Comprar ahora')}
                  </button>
                </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && selectedDonation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900/80 to-black/80 border-2 border-purple-600 rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 p-2 hover:bg-purple-700/50 rounded-lg transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-white mb-4">Selecciona tu Método de Pago</h2>
              <div className="flex justify-center items-center gap-4 bg-purple-900/30 rounded-lg p-4">
                <Image 
                  src="/coin.png" 
                  alt="Coin" 
                  width={60}
                  height={60}
                  className="drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                />
                <div className="text-left">
                  <div className="text-purple-200 font-semibold">Cantidad: ${selectedDonation.amount}</div>
                  <div className="text-yellow-400 font-black text-xl">{selectedDonation.points.toLocaleString()} Creditos</div>
                  <div className="text-gray-400 text-sm">{selectedDonation.plan}{selectedDonation.bonus > 0 ? ` • +${selectedDonation.bonus}% bonus` : ''}</div>
                </div>
              </div>
            </div>

            {/* Payment Methods Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* PayPal */}
              <button
                onClick={() => window.open('https://paypal.com', '_blank')}
                className="p-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg border-2 border-blue-400 transition-all hover:scale-105"
              >
                <div className="text-4xl mb-2">💳</div>
                <div className="font-black text-lg">PayPal</div>
                <div className="text-xs text-blue-200 mt-1">Pago Seguro</div>
              </button>

              {/* Tarjeta de Crédito */}
              <button
                onClick={() => alert('Procesando pago con tarjeta...')}
                className="p-6 bg-red-600 hover:bg-red-500 text-white rounded-lg border-2 border-red-400 transition-all hover:scale-105"
              >
                <div className="text-4xl mb-2">🏦</div>
                <div className="font-black text-lg">Tarjeta</div>
                <div className="text-xs text-red-200 mt-1">Crédito/Débito</div>
              </button>

              {/* Criptomoneda */}
              <button
                onClick={handleCryptomusCheckout}
                disabled={creatingCryptoInvoice}
                className="p-6 bg-orange-600 hover:bg-orange-500 text-white rounded-lg border-2 border-orange-400 transition-all hover:scale-105"
              >
                <div className="text-4xl mb-2">₿</div>
                <div className="font-black text-lg">Cripto</div>
                <div className="text-xs text-orange-200 mt-1">{creatingCryptoInvoice ? 'Generando factura...' : 'Pagar con Cryptomus'}</div>
              </button>

              {/* Código QR */}
              <button
                onClick={() => alert('Mostrando código QR para pagar...')}
                className="p-6 bg-green-600 hover:bg-green-500 text-white rounded-lg border-2 border-green-400 transition-all hover:scale-105"
              >
                <div className="text-4xl mb-2">📱</div>
                <div className="font-black text-lg">QR</div>
                <div className="text-xs text-green-200 mt-1">Escanea</div>
              </button>
            </div>

            {/* Info Text */}
            <div className="bg-purple-900/30 border border-purple-600/50 rounded-lg p-4 text-center text-gray-300 text-sm">
              <p>Todos los pagos son procesados de forma segura. Una vez completado, recibirás tus puntos inmediatamente.</p>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowCheckout(false)}
              className="w-full mt-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
