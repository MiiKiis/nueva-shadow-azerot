'use client';

import { Swords, Flame, Sparkles } from 'lucide-react';

export default function AddonsPage() {
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
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <div className="inline-flex flex-col items-center gap-3 mb-16">
          <Sparkles className="w-12 h-12 text-purple-500 animate-pulse" />
          <h1 className="text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] uppercase">Addons Recomendados</h1>
           <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mt-4 italic">Descarga los addons esenciales para tu experiencia en Shadow Azeroth 3.3.5a Blizzlike.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { name: 'QuestHelper Plus', desc: 'Guía completa para todas tus misiones en Azeroth.' },
            { name: 'Deadly Boss Mods', desc: 'Información crítica para enfrentamientos de raid.' },
            { name: 'Recount Shadow Azeroth', desc: 'Analiza tu desempeño en combate.' },
            { name: 'Auctionator', desc: 'Mejora tu experiencia comercial en el mercado.' },
            { name: 'GearScore LITE', desc: 'Evalúa equipamiento y progresión rápidamente.' },
            { name: 'Omen Threat Meter', desc: 'Control de amenaza en encuentros coordinados.' },
          ].map((addon, i) => (
            <div key={i} className="p-10 bg-black/50 border border-purple-900/40 rounded-sm backdrop-blur-md group hover:border-purple-600/60 hover:-translate-y-1 transition-all shadow-[0_0_50px_rgba(168,85,247,0.1)] border-t-4 border-t-purple-800">
              <Swords className="w-10 h-10 text-purple-500 mb-6 mx-auto group-hover:rotate-12 transition-transform" />
              <h2 className="text-xl font-black italic text-gray-100 group-hover:text-purple-400 transition-colors mb-4 uppercase tracking-tighter">{addon.name}</h2>
              <p className="text-gray-400 mb-8 italic text-sm">{addon.desc}</p>
              <button className="w-full py-4 bg-purple-700 hover:bg-purple-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-sm transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] border-b-4 border-purple-950">
                DESCARGAR
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
