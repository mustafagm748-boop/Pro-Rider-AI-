import React from 'react';
import { Trophy, DollarSign, Star, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  totalRides: number;
  dailyEarnings: number;
  rating: number;
  language?: 'en' | 'ur';
  compact?: boolean;
}

export function DriverStatsWidget({ totalRides, dailyEarnings, rating, language = 'en', compact = false }: Props) {
  const isUrdu = language === 'ur';

  const stats = [
    {
      label: isUrdu ? 'کل سواریاں' : 'Total Rides',
      value: totalRides,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/50',
    },
    {
      label: isUrdu ? 'آج کی آمدنی' : 'Daily Earnings',
      value: `Rs. ${Math.floor(Number(dailyEarnings) || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50/50',
    },
    {
      label: isUrdu ? 'ریٹنگ' : 'Customer Rating',
      value: Number(rating).toFixed(1),
      icon: Star,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50/50',
    }
  ];

  if (compact) {
    return (
      <>
        {stats.map((stat, index) => (
          <div key={stat.label} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <div className={`w-10 h-10 rounded-2xl ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-4 p-5 rounded-[28px] bg-white border border-gray-100 shadow-sm group hover:shadow-md transition-all"
        >
          <div className={`w-12 h-12 rounded-2xl ${stat.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
              {stat.label}
            </p>
            <p className="text-xl font-bold text-gray-900 tracking-tight">
              {stat.value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
