'use client';

import React, { useEffect, useState } from 'react';

const PurpleSnow = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prepare deterministic placeholders for SSR to prevent hydration mismatch
  // The actual particles will only render on client
  if (!mounted) return <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" />;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .snow-particle {
          position: absolute;
          background: #a855f7;
          border-radius: 50%;
          filter: blur(1px);
          opacity: 0.6;
          box-shadow: 0 0 10px #a855f7, 0 0 20px #7c3aed;
        }

        @keyframes snow-move-fast {
          0% {
            transform: translateX(-20vw) translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateX(120vw) translateY(10vh) rotate(360deg);
            opacity: 0;
          }
        }

        .snow-layer-1 { animation: snow-move-fast 2s linear infinite; }
        .snow-layer-2 { animation: snow-move-fast 3.5s linear infinite; animation-delay: -1s; }
        .snow-layer-3 { animation: snow-move-fast 5s linear infinite; animation-delay: -2.5s; }
      `}} />
      
      {[...Array(35)].map((_, i) => (
        <div
          key={`snow1-${i}`}
          className="snow-particle snow-layer-1"
          style={{
            width: Math.random() * 12 + 6 + 'px',
            height: Math.random() * 6 + 3 + 'px',
            left: Math.random() * 100 + 'vw',
            top: Math.random() * 100 + 'vh',
            animationDuration: Math.random() * 0.5 + 1 + 's',
            animationDelay: Math.random() * -3 + 's',
            boxShadow: '0 0 20px #a855f7, 0 0 40px #7c3aed',
          }}
        />
      ))}
      {[...Array(25)].map((_, i) => (
        <div
          key={`snow2-${i}`}
          className="snow-particle snow-layer-2"
          style={{
            width: Math.random() * 18 + 10 + 'px',
            height: Math.random() * 8 + 4 + 'px',
            left: Math.random() * 100 + 'vw',
            top: Math.random() * 100 + 'vh',
            animationDuration: Math.random() * 1 + 2 + 's',
            animationDelay: Math.random() * -5 + 's',
            boxShadow: '0 0 30px #a855f7, 0 0 60px #7c3aed',
            opacity: 0.6
          }}
        />
      ))}
      {[...Array(15)].map((_, i) => (
        <div
          key={`snow3-${i}`}
          className="snow-particle snow-layer-3"
          style={{
            width: Math.random() * 30 + 20 + 'px',
            height: Math.random() * 15 + 8 + 'px',
            left: Math.random() * 80 + 'vw',
            top: Math.random() * 80 + 'vh',
            animationDuration: Math.random() * 2 + 4 + 's',
            animationDelay: Math.random() * -8 + 's',
            boxShadow: '0 0 40px #a855f7, 0 0 80px #7c3aed',
            opacity: 0.4,
            filter: 'blur(4px)'
          }}
        />
      ))}
    </div>
  );
};

export default PurpleSnow;
