'use client';

import { useEffect, useMemo, useState } from 'react';
import { animate, motion } from 'framer-motion';
import { Users, Sword } from 'lucide-react';

type ApiStatsResponse = {
  stats: {
    totalAccounts: number;
    totalCharacters: number;
    updatedAt: string;
  };
};

type CountUpProps = {
  value: number;
};

function CountUp({ value }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (latest: number) => {
        setDisplayValue(Math.floor(latest));
      },
    });

    return () => controls.stop();
  }, [value]);

  return <span>{displayValue.toLocaleString('es-ES')}</span>;
}

export default function StatCards() {
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const response = await fetch('/api/stats/global', { cache: 'no-store' });
        const data: ApiStatsResponse = await response.json();

        if (!cancelled && data?.stats) {
          setTotalAccounts(Number(data.stats.totalAccounts || 0));
          setTotalCharacters(Number(data.stats.totalCharacters || 0));
        }
      } catch {
        if (!cancelled) {
          setTotalAccounts(0);
          setTotalCharacters(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(
    () => [
      {
        label: 'Cuentas Totales',
        value: totalAccounts,
        icon: Users,
        iconColor: 'text-cyan-300',
      },
      {
        label: 'Personajes Totales',
        value: totalCharacters,
        icon: Sword,
        iconColor: 'text-amber-300',
      },
    ],
    [totalAccounts, totalCharacters]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, delay: index * 0.12 }}
          className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-left"
        >
          <div className="flex items-center justify-start gap-2 mb-1">
            <card.icon className={`w-4 h-4 ${card.iconColor}`} />
            <p className="text-[11px] uppercase tracking-wide text-slate-300 text-left">{card.label}</p>
          </div>
          <p className="text-white font-black text-lg sm:text-xl text-left leading-none">
            {loading ? '...' : <CountUp value={card.value} />}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
