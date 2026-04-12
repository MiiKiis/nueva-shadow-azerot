'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, AlertTriangle, PackageOpen } from 'lucide-react';

type LocalUser = {
  id: number;
  username: string;
};

type RecruitInviteRow = {
  id: number;
  recruiter_account_id: number;
  recruiter_username: string;
  friend_name: string;
  friend_email: string;
  status: 'invited' | 'registered' | 'rewarded';
  recruited_account_id: number | null;
  recruited_username: string | null;
  starter_bags_claimed: number;
  recruit_reward_given: number;
  recruited_max_level?: number;
  level80_claimable?: boolean;
  accepted_at: string | null;
  created_at: string;
};

type RecruitStatusResponse = {
  recruiterInvites: RecruitInviteRow[];
  recruitedEntry: RecruitInviteRow | null;
};

type CharacterOption = {
  guid: number;
  name: string;
  level: number;
  online: number;
};

export default function ReclutamientoPage() {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [activeTab, setActiveTab] = useState<'invite' | 'friends' | 'help'>('invite');

  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusData, setStatusData] = useState<RecruitStatusResponse>({ recruiterInvites: [], recruitedEntry: null });
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [selectedStarterGuid, setSelectedStarterGuid] = useState<number>(0);

  const [claimingStarter, setClaimingStarter] = useState(false);
  const [claimingRewardId, setClaimingRewardId] = useState<number | null>(null);
  const [resendingInviteId, setResendingInviteId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStatus = async (accountId: number) => {
    setLoadingStatus(true);
    setError('');
    try {
      const response = await fetch(`/api/recruit/status?accountId=${accountId}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo cargar el estado de reclutamiento.');

      setStatusData({
        recruiterInvites: Array.isArray(data?.recruiterInvites) ? data.recruiterInvites : [],
        recruitedEntry: data?.recruitedEntry || null,
      });
    } catch (err: any) {
      setStatusData({ recruiterInvites: [], recruitedEntry: null });
      setError(String(err?.message || 'Error desconocido'));
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadCharacters = async (accountId: number) => {
    try {
      const response = await fetch(`/api/characters?accountId=${accountId}`, { cache: 'no-store' });
      const data = await response.json();
      const rows = Array.isArray(data?.characters) ? data.characters : [];
      const normalized: CharacterOption[] = rows
        .map((row: any) => ({
          guid: Number(row?.guid || 0),
          name: String(row?.name || ''),
          level: Number(row?.level || 0),
          online: Number(row?.online || 0),
        }))
        .filter((row: CharacterOption) => row.guid > 0 && !!row.name);

      setCharacters(normalized);
      setSelectedStarterGuid((prev) => {
        if (prev > 0 && normalized.some((char) => char.guid === prev)) return prev;
        return normalized[0]?.guid || 0;
      });
    } catch {
      setCharacters([]);
      setSelectedStarterGuid(0);
    }
  };

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(rawUser) as LocalUser;
      if (!Number.isInteger(Number(parsed?.id)) || Number(parsed.id) <= 0) {
        router.push('/');
        return;
      }
      setUser(parsed);
      const accountId = Number(parsed.id);
      loadStatus(accountId);
      loadCharacters(accountId);
    } catch {
      router.push('/');
    }
  }, [router]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSendingInvite(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/recruit/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterAccountId: user.id,
          friendName: friendName.trim(),
          friendEmail: friendEmail.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo enviar la invitacion.');

      const referralId = Number(data?.referralId || 0);
      const emailDeliveryId = String(data?.emailDeliveryId || '').trim();
      const successMessageBase = String(data?.message || 'Invitacion enviada con exito.').trim();
      const successParts = [successMessageBase];

      if (referralId > 0) {
        successParts.push(`ID de reclutamiento: ${referralId}`);
      }
      if (emailDeliveryId) {
        successParts.push(`ID de correo: ${emailDeliveryId}`);
      }

      setMessage(successParts.join(' | '));
      setFriendName('');
      setFriendEmail('');
      await loadStatus(user.id);
      setActiveTab('friends');
    } catch (err: any) {
      setError(String(err?.message || 'Error desconocido'));
    } finally {
      setSendingInvite(false);
    }
  };

  const handleClaimStarter = async () => {
    if (!user) return;
    if (!Number.isInteger(selectedStarterGuid) || selectedStarterGuid <= 0) {
      setError('Debes seleccionar un personaje para recibir el kit inicial.');
      return;
    }

    setClaimingStarter(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/recruit/claim-starter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: user.id, targetCharacterGuid: selectedStarterGuid }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo reclamar el kit inicial.');

      setMessage(data?.message || 'Kit inicial reclamado.');
      await loadStatus(user.id);
    } catch (err: any) {
      setError(String(err?.message || 'Error desconocido'));
    } finally {
      setClaimingStarter(false);
    }
  };

  const handleClaimLevel80 = async (referralId: number) => {
    if (!user) return;

    setClaimingRewardId(referralId);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/recruit/claim-level80', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: user.id, referralId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo recuperar estelas.');

      setMessage(data?.message || 'Estelas recuperadas correctamente.');
      await loadStatus(user.id);
    } catch (err: any) {
      setError(String(err?.message || 'Error desconocido'));
    } finally {
      setClaimingRewardId(null);
    }
  };

  const handleResendInvite = async (referralId: number) => {
    if (!user) return;

    setResendingInviteId(referralId);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/recruit/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: user.id, referralId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo reenviar la invitacion.');

      const resultReferralId = Number(data?.referralId || 0);
      const emailDeliveryId = String(data?.emailDeliveryId || '').trim();
      const successMessageBase = String(data?.message || 'Invitacion reenviada con exito.').trim();
      const successParts = [successMessageBase];

      if (resultReferralId > 0) {
        successParts.push(`ID de reclutamiento: ${resultReferralId}`);
      }
      if (emailDeliveryId) {
        successParts.push(`ID de correo: ${emailDeliveryId}`);
      }

      setMessage(successParts.join(' | '));
      await loadStatus(user.id);
    } catch (err: any) {
      setError(String(err?.message || 'Error desconocido'));
    } finally {
      setResendingInviteId(null);
    }
  };

  const recruitStats = useMemo(() => {
    const invites = statusData.recruiterInvites || [];
    const total = invites.length;
    const registered = invites.filter((row) => row.status === 'registered' || row.status === 'rewarded').length;
    const rewarded = invites.filter((row) => row.status === 'rewarded').length;
    return { total, registered, rewarded };
  }, [statusData.recruiterInvites]);

  const recruiterRewardRows = useMemo(() => {
    return (statusData.recruiterInvites || []).filter((row) => row.status !== 'invited');
  }, [statusData.recruiterInvites]);

  return (
    <main
      className="min-h-screen pt-28 pb-16 text-white"
      style={{
        backgroundImage: "url('/fono.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="relative rounded-[3rem] border border-cyan-500/20 bg-[#08141d]/85 p-8 sm:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden min-h-[700px]">
          {/* Background Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 blur-[120px] pointer-events-none" />

          <div className="relative">
            <p className="text-[13px] font-black uppercase tracking-[0.4em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]" style={{ fontFamily: 'var(--font-cinzel)' }}>
              Alianza de Valientes
            </p>
            <h1 className="mt-4 text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none" style={{ fontFamily: 'var(--font-cinzel-dec)' }}>
              Recluta un <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent">Amigo</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-2xl font-medium" style={{ fontFamily: 'var(--font-marcellus)' }}>
              Forja leyendas junto a tus aliados. Al alcanzar el nivel 80, ambos recibiréis estelas para vuestro viaje por Azeroth.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-md max-w-2xl">
            <button 
              type="button" 
              onClick={() => setActiveTab('invite')} 
              className={`flex-1 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'invite' 
                ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-100 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Invitaciones
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('friends')} 
              className={`flex-1 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'friends' 
                ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-100 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Mis Aliados
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('help')} 
              className={`flex-1 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'help' 
                ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-100 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Guía
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {message}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <form 
                  onSubmit={handleSendInvite} 
                  className="group relative rounded-[2rem] border border-white/10 bg-white/5 p-8 overflow-hidden transition-all hover:border-cyan-500/30 shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl -z-10 group-hover:bg-cyan-500/10 transition-colors" />
                  
                  <h3 className="text-xl font-black uppercase tracking-widest text-white mb-8 border-b border-white/5 pb-4" style={{ fontFamily: 'var(--font-cinzel)' }}>
                    Nueva Invitación
                  </h3>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-widest font-black text-cyan-400/80 ml-1">Nombre del Amigo</label>
                      <input 
                        value={friendName} 
                        onChange={(e) => setFriendName(e.target.value)} 
                        placeholder="Escribe su nombre..." 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-widest font-black text-cyan-400/80 ml-1">Dirección de Correo</label>
                      <input 
                        value={friendEmail} 
                        onChange={(e) => setFriendEmail(e.target.value)} 
                        placeholder="amigo@correo.com" 
                        type="email" 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="mt-10">
                    <button 
                      type="submit" 
                      disabled={sendingInvite || !user || recruitStats.registered >= 5} 
                      className="group/btn relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 px-8 py-5 text-sm font-black uppercase tracking-[0.2em] text-white disabled:opacity-40 transition-all shadow-[0_10px_30px_rgba(8,145,178,0.3)] hover:shadow-[0_15px_40px_rgba(8,145,178,0.45)] hover:-translate-y-1 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                      <Send className="h-5 w-5" /> 
                      {recruitStats.registered >= 5 
                        ? 'Límite alcanzado' 
                        : sendingInvite 
                          ? 'Enviando pergamino...' 
                          : 'Enviar Invitación'}
                    </button>
                    {recruitStats.registered >= 5 && (
                      <p className="mt-4 text-xs text-rose-400 font-bold italic">Has alcanzado el límite de 5 reclutados registrados.</p>
                    )}
                  </div>
                </form>

                <div className="rounded-[2rem] border border-white/5 bg-white/5 p-8 backdrop-blur-md">
                   <h4 className="text-sm font-black uppercase tracking-widest text-cyan-200 mb-4" style={{ fontFamily: 'var(--font-cinzel)' }}>Beneficios inmediatos</h4>
                   <ul className="space-y-4">
                     <li className="flex items-center gap-3 text-slate-300 text-sm italic">
                       <CheckCircle2 className="text-emerald-400 h-4 w-4 shrink-0" />
                       Tu amigo recibe 4 bolsas de 16 casillas y 300 de oro al registrarse.
                     </li>
                     <li className="flex items-center gap-3 text-slate-300 text-sm italic">
                       <CheckCircle2 className="text-emerald-400 h-4 w-4 shrink-0" />
                       Al llegar a nivel 80, recibiréis estelas  exclusivas.
                     </li>
                   </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-1 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 to-transparent">
                  <div className="rounded-[1.8rem] border border-white/5 bg-[#0a1a26] p-8 space-y-8">
                    <p className="text-[11px] uppercase tracking-widest text-cyan-400 font-black" style={{ fontFamily: 'var(--font-cinzel)' }}>Tu Fortalezas</p>
                    
                    <div className="space-y-6">
                      <div className="group relative rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Invitaciones Enviadas</p>
                        <p className="text-3xl font-black text-white mt-1 leading-none">{recruitStats.total}</p>
                        <div className="absolute top-4 right-4 text-white/10 group-hover:text-cyan-400/20 transition-colors"><Send className="h-8 w-8" /></div>
                      </div>

                      <div className="group relative rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 transition-all hover:bg-cyan-500/10">
                        <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Aliados Registrados</p>
                        <div className="flex items-end gap-2 mt-1">
                          <p className="text-3xl font-black text-white leading-none">{recruitStats.registered}</p>
                          <p className="text-sm font-bold text-cyan-400/60 pb-1">/ 5</p>
                        </div>
                        <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                            style={{ width: `${(recruitStats.registered / 5) * 100}%` }} 
                          />
                        </div>
                        <div className="absolute top-4 right-4 text-cyan-400/20"><CheckCircle2 className="h-8 w-8" /></div>
                      </div>

                      <div className="group relative rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition-all hover:bg-emerald-500/10">
                        <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Héroes Cosechados</p>
                        <p className="text-3xl font-black text-white mt-1 leading-none">{recruitStats.rewarded}</p>
                        <div className="absolute top-4 right-4 text-emerald-400/20"><PackageOpen className="h-8 w-8" /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="mt-8 space-y-12">
              <div className="space-y-6">
                <h3 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-cinzel)' }}>
                  <span className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm">⚔️</span>
                  Aliados en Campaña
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loadingStatus ? (
                    <div className="col-span-full py-12 text-center text-slate-400 italic bg-white/5 rounded-3xl border border-white/5">Cargando registros del archivo...</div>
                  ) : statusData.recruiterInvites.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 italic bg-white/5 rounded-3xl border border-white/5">Aún no has reclutado valientes para tu causa.</div>
                  ) : (
                    statusData.recruiterInvites.map((row) => (
                      <div 
                        key={row.id} 
                        className={`relative rounded-[1.5rem] border p-6 transition-all duration-300 overflow-hidden group ${
                          row.status === 'rewarded' 
                          ? 'border-emerald-500/30 bg-emerald-500/5' 
                          : row.status === 'registered'
                            ? 'border-cyan-500/30 bg-cyan-500/5'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="flex justify-between items-start relative z-10">
                          <div className="space-y-1">
                            <p className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-cinzel)' }}>{row.friend_name}</p>
                            <p className="text-xs text-slate-400 font-medium">{row.friend_email}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                            row.status === 'rewarded' 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : row.status === 'registered'
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-pulsing'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}>
                            {row.status === 'rewarded' ? 'Heroico' : row.status === 'registered' ? 'Registrado' : 'Invitado'}
                          </span>
                        </div>

                        <div className="mt-6 space-y-3 relative z-10">
                          {row.status === 'registered' && (
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Progreso</span>
                                <span className="text-cyan-400">{row.recruited_max_level || 0} / 80</span>
                              </div>
                              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]" 
                                  style={{ width: `${(Math.min(Number(row.recruited_max_level || 0), 80) / 80) * 100}%` }} 
                                />
                              </div>
                            </div>
                          )}

                          {row.status === 'rewarded' && (
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                              <CheckCircle2 className="h-4 w-4" />
                              Recompensa de nivel 80 otorgada
                            </div>
                          )}

                          {row.status === 'invited' && (
                            <div className="flex items-center justify-between gap-4">
                               <p className="text-xs text-amber-200/60 italic">Esperando registro en Azeroth...</p>
                               <button
                                onClick={() => handleResendInvite(Number(row.id))}
                                disabled={resendingInviteId === Number(row.id)}
                                className="group/resend inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-200 hover:text-amber-100 transition-colors"
                              >
                                <Send className={`h-3 w-3 ${resendingInviteId === Number(row.id) ? 'animate-bounce' : 'group-hover/resend:translate-x-1 transition-transform'}`} />
                                {resendingInviteId === Number(row.id) ? 'Enviando...' : 'Reenviar'}
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Decorative Icon in background */}
                        <div className={`absolute -bottom-4 -right-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.07] ${
                          row.status === 'rewarded' ? 'text-emerald-400' : 'text-white'
                        }`}>
                          <PackageOpen className="w-32 h-32 rotate-[-15deg]" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {recruiterRewardRows.length > 0 && (
                <div className="relative rounded-[2.5rem] border border-emerald-500/30 bg-emerald-500/5 p-8 sm:p-12 overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-emerald-400" style={{ fontFamily: 'var(--font-cinzel)' }}>Cosecha de Héroes</h3>
                    <p className="mt-2 text-slate-300 max-w-xl italic font-medium">Tus aliados ya son leyendas. Reclama las estelas que te corresponden por guiarlos en su camino.</p>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {recruiterRewardRows.map((row) => {
                        const claimed = Number(row.recruit_reward_given || 0) === 1;
                        const loading = claimingRewardId === Number(row.id);
                        const claimable = !!row.level80_claimable;

                        return (
                          <div key={`recruiter-reward-${row.id}`} className={`rounded-[1.8rem] border p-6 transition-all ${claimed ? 'border-white/5 bg-black/20 opacity-60' : 'border-emerald-500/20 bg-emerald-500/5 shadow-xl shadow-emerald-950/20'}`}>
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-cinzel)' }}>{row.friend_name}</p>
                              {claimed ? (
                                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">Reclamado</span>
                              ) : null}
                            </div>
                            
                            {!claimed && (
                              <button
                                type="button"
                                onClick={() => handleClaimLevel80(Number(row.id))}
                                disabled={loading || !claimable}
                                className={`w-full group/claim relative h-14 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all overflow-hidden ${
                                  loading
                                    ? 'bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed'
                                    : claimable
                                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] hover:shadow-emerald-500/40 active:scale-95'
                                      : 'bg-black/40 text-slate-500 border border-white/5 opacity-50 cursor-not-allowed'
                                }`}
                              >
                                {claimable && <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/claim:translate-x-[100%] transition-transform duration-1000" />}
                                <PackageOpen className={`h-5 w-5 ${claimable && !loading ? 'animate-bounce' : ''}`} />
                                {loading
                                  ? 'Invocando Recompensa...'
                                  : claimable
                                    ? 'Reclamar 2 Estelas'
                                    : `Nivel ${row.recruited_max_level || 0} / 80`}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Section (When I am the recruit) */}
              {!!statusData.recruitedEntry && (
                <div className="relative rounded-[2.5rem] border border-cyan-400/30 bg-cyan-500/5 p-8 sm:p-12 overflow-hidden shadow-2xl">
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 blur-[100px] pointer-events-none" />
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-cyan-400" style={{ fontFamily: 'var(--font-cinzel)' }}>Fuiste Reclutado</h3>
                    <p className="mt-2 text-slate-300 max-w-xl italic font-medium">Un gran honor te ha sido concedido. Reclama tu kit de bienvenida y prepárate para la gloria al alcanzar el nivel máximo.</p>

                    <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <div className="space-y-4">
                           <h4 className="text-[11px] uppercase tracking-[0.3em] font-black text-cyan-200/80 ml-1">Tu Kit de Iniciado</h4>
                           <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Selecciona tu Héroe</label>
                                <select
                                  value={selectedStarterGuid || ''}
                                  onChange={(e) => setSelectedStarterGuid(Number(e.target.value || 0))}
                                  disabled={claimingStarter || Number(statusData.recruitedEntry.starter_bags_claimed || 0) === 1 || characters.length === 0}
                                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-300/60 disabled:opacity-40 transition-all font-medium"
                                >
                                  {characters.length === 0 && <option value="">No hay personajes detectados</option>}
                                  {characters.map((char) => (
                                    <option key={char.guid} value={char.guid}>
                                      {char.name} (Nivel {char.level}){char.online === 1 ? ' - Online' : ''}
                                    </option>
                                  ))}
                                </select>
                             </div>

                             <button
                               type="button"
                               onClick={handleClaimStarter}
                               disabled={claimingStarter || Number(statusData.recruitedEntry.starter_bags_claimed || 0) === 1 || selectedStarterGuid <= 0}
                               className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                                 Number(statusData.recruitedEntry.starter_bags_claimed || 0) === 1
                                   ? 'bg-slate-800 text-slate-500 border border-white/5'
                                   : claimingStarter || selectedStarterGuid <= 0
                                     ? 'bg-black/40 text-slate-500 border border-white/5'
                                     : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/30 hover:scale-[1.01]'
                               }`}
                             >
                                <PackageOpen className={`h-5 w-5 ${!claimingStarter && Number(statusData.recruitedEntry.starter_bags_claimed || 0) === 0 ? 'animate-pulse' : ''}`} />
                                {Number(statusData.recruitedEntry.starter_bags_claimed || 0) === 1 ? 'Kit ya reclamado' : claimingStarter ? 'Invocando kit...' : 'Reclamar Kit (Bolsas + Oro)'}
                             </button>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-4">
                           <h4 className="text-[11px] uppercase tracking-[0.3em] font-black text-cyan-200/80 ml-1">Tu Recompensa Final</h4>
                           <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center text-center">
                              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                                <span className="text-2xl font-black">80</span>
                              </div>
                              <p className="text-sm text-slate-300 italic mb-6">Alcanza el nivel 80 para desbloquear 3 estelas de bonificación.</p>
                              
                              <button
                                type="button"
                                onClick={() => handleClaimLevel80(Number(statusData.recruitedEntry?.id || 0))}
                                disabled={Number(statusData.recruitedEntry.recruit_reward_given) === 1 || claimingRewardId === Number(statusData.recruitedEntry?.id || 0) || !statusData.recruitedEntry.level80_claimable}
                                className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                                  Number(statusData.recruitedEntry.recruit_reward_given) === 1
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-pulsing'
                                    : claimingRewardId === Number(statusData.recruitedEntry?.id || 0) || !statusData.recruitedEntry.level80_claimable
                                      ? 'bg-black/40 text-slate-500 border border-white/5 opacity-50'
                                      : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/20'
                                }`}
                              >
                                {Number(statusData.recruitedEntry.recruit_reward_given) === 1
                                  ? '¡Recompensa de nivel 80 obtenida!'
                                  : claimingRewardId === Number(statusData.recruitedEntry?.id || 0)
                                    ? 'Procesando...'
                                    : statusData.recruitedEntry.level80_claimable
                                      ? 'Reclamar 3 Estelas'
                                      : `Requiere Nivel 80 (${statusData.recruitedEntry.recruited_max_level || 0}/80)`}
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'help' && (
            <div className="mt-12 space-y-8">
               <h3 className="text-xl font-black uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font-cinzel)' }}>Sendero del Reclutador</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { step: '01', title: 'Invitación', desc: 'Envía una misiva mágica a través de esta página con el nombre y correo de tu aliado.' },
                   { step: '02', title: 'Registro', desc: 'Tu aliado debe seguir el enlace especial contenido en el pergamino para crear su cuenta.' },
                   { step: '03', title: 'Kit Inicial', desc: 'El reclutado recibe 4 bolsas de 20 casillas y 300 de oro al instante.' },
                   { step: '04', title: 'Nivel 80', desc: 'Cuando el reclutado llegue al nivel 80, ambos recibiréis estelas de gloria.' }
                 ].map((item, i) => (
                   <div key={i} className="group relative rounded-[2rem] border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10">
                     <span className="text-4xl font-black text-white/10 group-hover:text-cyan-500/20 transition-colors" style={{ fontFamily: 'var(--font-cinzel-dec)' }}>{item.step}</span>
                     <h4 className="mt-4 text-xs font-black uppercase tracking-widest text-cyan-300">{item.title}</h4>
                     <p className="mt-3 text-xs text-slate-400 leading-relaxed italic">{item.desc}</p>
                   </div>
                 ))}
               </div>
               <div className="flex items-center gap-4 p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                  <AlertTriangle className="text-rose-400 h-5 w-5 shrink-0" />
                  <p className="text-xs text-rose-200 font-bold tracking-wide italic">Importante: Solo puedes tener un máximo de 5 aliados registrados para evitar abusos en el reino.</p>
               </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl border border-slate-300/25 bg-slate-500/20 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-100 hover:bg-slate-500/30 min-w-[190px]">Volver al Dashboard</Link>
            <Link href="/migraciones" className="inline-flex items-center justify-center rounded-xl border border-amber-300/35 bg-amber-500/15 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-amber-100 hover:bg-amber-500/25 min-w-[190px]">Ir a Migraciones</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
