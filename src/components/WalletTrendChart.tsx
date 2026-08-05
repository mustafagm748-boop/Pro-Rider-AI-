import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, DollarSign, Activity } from 'lucide-react';

interface WalletTrendChartProps {
  transactions: any[];
  language?: 'en' | 'ur';
}

export const WalletTrendChart: React.FC<WalletTrendChartProps> = ({ transactions, language = 'en' }) => {
  const [viewMode, setViewMode] = useState<'all' | 'spending' | 'deposits'>('all');

  // Compute past 7 days date strings and aggregated values
  const { chartData, totalDeposits, totalSpending, netBalanceChange } = useMemo(() => {
    const days: { dateStr: string; dayLabel: string; deposits: number; spending: number; net: number }[] = [];
    const today = new Date();

    // Generate last 7 days array (from 6 days ago to today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      days.push({
        dateStr: isoDate,
        dayLabel,
        deposits: 0,
        spending: 0,
        net: 0
      });
    }

    let depSum = 0;
    let spendSum = 0;

    // Aggregate transactions into days
    transactions.forEach(tx => {
      if (!tx.date) return;
      // Extract YYYY-MM-DD
      const txDateStr = tx.date.split('T')[0];
      const matchingDay = days.find(d => d.dateStr === txDateStr);

      const amt = Number(tx.amount) || 0;
      if (amt > 0) {
        depSum += amt;
        if (matchingDay) matchingDay.deposits += amt;
      } else if (amt < 0) {
        const absAmt = Math.abs(amt);
        spendSum += absAmt;
        if (matchingDay) matchingDay.spending += absAmt;
      }
    });

    // Compute net for each day
    days.forEach(d => {
      d.net = d.deposits - d.spending;
    });

    return {
      chartData: days,
      totalDeposits: depSum,
      totalSpending: spendSum,
      netBalanceChange: depSum - spendSum
    };
  }, [transactions]);

  const isUrdu = language === 'ur';

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-xl border border-gray-800 text-xs space-y-1.5 min-w-[150px]">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
          {payload.map((entry: any, index: number) => {
            const isDep = entry.dataKey === 'deposits';
            const isSpend = entry.dataKey === 'spending';
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-300">
                    {isDep ? (isUrdu ? 'جمع' : 'Deposits') : isSpend ? (isUrdu ? 'خرچ' : 'Spending') : (isUrdu ? 'خالص' : 'Net Flow')}
                  </span>
                </span>
                <span className={isDep ? 'text-green-400 font-bold' : isSpend ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                  Rs. {Math.abs(entry.value).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-xl text-yellow-800">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
              {isUrdu ? '7 دنوں کا ٹرینڈ' : '7-Day Wallet Trends'}
            </h3>
          </div>
          <p className="text-[10px] text-gray-500 font-medium pl-8 mt-0.5">
            {isUrdu ? 'گزشتہ 7 دنوں کی روزانہ کی آمدن اور اخراجات' : 'Daily spending & deposit history for the past week'}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl text-[10px] font-black self-start sm:self-auto">
          <button
            onClick={() => setViewMode('all')}
            className={`px-2.5 py-1.5 rounded-xl transition-all ${
              viewMode === 'all'
                ? 'bg-black text-yellow-400 shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            {isUrdu ? 'تمام' : 'All'}
          </button>
          <button
            onClick={() => setViewMode('deposits')}
            className={`px-2.5 py-1.5 rounded-xl transition-all ${
              viewMode === 'deposits'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-green-700'
            }`}
          >
            {isUrdu ? 'آمدن' : 'Deposits'}
          </button>
          <button
            onClick={() => setViewMode('spending')}
            className={`px-2.5 py-1.5 rounded-xl transition-all ${
              viewMode === 'spending'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-red-700'
            }`}
          >
            {isUrdu ? 'اخراجات' : 'Spending'}
          </button>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-3 gap-2 text-left">
        <div className="p-3 bg-green-50/80 rounded-2xl border border-green-100 space-y-0.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-green-700 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-green-600" />
            {isUrdu ? 'آمدن' : 'Deposits'}
          </span>
          <p className="text-xs sm:text-sm font-black text-green-950">
            Rs. {totalDeposits.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-red-50/80 rounded-2xl border border-red-100 space-y-0.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-red-700 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3 text-red-600" />
            {isUrdu ? 'اخراجات' : 'Spending'}
          </span>
          <p className="text-xs sm:text-sm font-black text-red-950">
            Rs. {totalSpending.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-100 space-y-0.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
            {netBalanceChange >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
            {isUrdu ? 'نیٹ تبدیلی' : '7D Net'}
          </span>
          <p className={`text-xs sm:text-sm font-black ${netBalanceChange >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {netBalanceChange >= 0 ? '+' : ''}Rs. {netBalanceChange.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="dayLabel"
              tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {(viewMode === 'all' || viewMode === 'deposits') && (
              <Line
                type="monotone"
                dataKey="deposits"
                name={isUrdu ? 'آمدن' : 'Deposits'}
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {(viewMode === 'all' || viewMode === 'spending') && (
              <Line
                type="monotone"
                dataKey="spending"
                name={isUrdu ? 'اخراجات' : 'Spending'}
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#dc2626', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {viewMode === 'all' && (
              <Line
                type="monotone"
                dataKey="net"
                name={isUrdu ? 'نیٹ' : 'Net Flow'}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#f59e0b' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold px-1 pt-1 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          {chartData[0]?.dayLabel} - {chartData[chartData.length - 1]?.dayLabel}
        </span>
        <span className="text-gray-500 font-semibold">
          {isUrdu ? 'ریئل ٹائم ہم آہنگی فعال ہے' : 'Real-time sync active'}
        </span>
      </div>
    </div>
  );
};

export default WalletTrendChart;
