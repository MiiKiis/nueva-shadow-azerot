'use client';

import { Flame } from 'lucide-react';

export default function NewsPage() {
  return (
    <main 
      className="min-h-screen pt-32 pb-20 text-white selection:bg-purple-600/30 font-sans relative overflow-hidden"
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

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <Flame className="w-8 h-8 text-purple-500 animate-pulse" />
          <h1 className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">NOTICIAS</h1>
        </div>

        <div className="space-y-12">
          {[1, 2, 3].map((i) => (
            <section key={i} className="p-8 bg-black/40 border border-purple-900/30 rounded-sm backdrop-blur-md group hover:border-purple-600/40 transition-all shadow-[0_0_40px_rgba(105,55,180,0.2)]">
              <div className="text-purple-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">8 de Marzo, 2026</div>
              <h2 className="text-2xl font-black italic text-gray-100 group-hover:text-purple-500 transition-colors mb-4">Título de la Noticia {i}</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed font-light">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
              </div>
              <div className="mt-8">
                <button className="text-xs font-black uppercase tracking-widest text-purple-500 hover:text-purple-400 flex items-center gap-2 group/btn">
                  Leer más <span className="text-purple-800 group-hover/btn:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
