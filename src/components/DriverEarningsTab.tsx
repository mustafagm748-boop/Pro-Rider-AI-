import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { DollarSign, CheckCircle2, TrendingUp, Calendar, Zap, ArrowUpRight, Award, ShieldCheck } from 'lucide-react';

interface DriverEarningsTabProps {
  language?: 'en' | 'ur' | 'de';
  theme?: 'light' | 'dark';
  completedRidesCount?: number;
  totalEarningsPkr?: number;
}

interface DailyCompletionRecord {
  day: string;
  dayUrdu: string;
  dateStr: string;
  completedRides: number;
  totalRequests: number;
  completionRate: number;
  earningsPkr: number;
  peakHours: string;
}

interface WeeklySummaryRecord {
  week: string;
  weekUrdu: string;
  completedRides: number;
  completionRate: number;
  earningsPkr: number;
}

const DAILY_DATA: DailyCompletionRecord[] = [
  { day: 'Mon', dayUrdu: 'پیر', dateStr: 'Jul 25', completedRides: 8, totalRequests: 9, completionRate: 89, earningsPkr: 4200, peakHours: '8 AM - 11 AM' },
  { day: 'Tue', dayUrdu: 'منگل', dateStr: 'Jul 26', completedRides: 11, totalRequests: 12, completionRate: 92, earningsPkr: 5800, peakHours: '5 PM - 9 PM' },
  { day: 'Wed', dayUrdu: 'بدھ', dateStr: 'Jul 27', completedRides: 10, totalRequests: 11, completionRate: 91, earningsPkr: 5100, peakHours: '8 AM - 12 PM' },
  { day: 'Thu', dayUrdu: 'جمعرات', dateStr: 'Jul 28', completedRides: 9, totalRequests: 10, completionRate: 90, earningsPkr: 4600, peakHours: '6 PM - 10 PM' },
  { day: 'Fri', dayUrdu: 'جمعہ', dateStr: 'Jul 29', completedRides: 14, totalRequests: 14, completionRate: 100, earningsPkr: 7900, peakHours: '2 PM - 11 PM' },
  { day: 'Sat', dayUrdu: 'ہفتہ', dateStr: 'Jul 30', completedRides: 17, totalRequests: 18, completionRate: 94, earningsPkr: 9400, peakHours: '12 PM - 11 PM' },
  { day: 'Sun', dayUrdu: 'اتوار', dateStr: 'Jul 31', completedRides: 15, totalRequests: 16, completionRate: 94, earningsPkr: 8200, peakHours: '10 AM - 9 PM' },
];

const WEEKLY_DATA: WeeklySummaryRecord[] = [
  { week: 'Week 1', weekUrdu: 'ہفتہ 1', completedRides: 62, completionRate: 88, earningsPkr: 32500 },
  { week: 'Week 2', weekUrdu: 'ہفتہ 2', completedRides: 71, completionRate: 91, earningsPkr: 38200 },
  { week: 'Week 3', weekUrdu: 'ہفتہ 3', completedRides: 78, completionRate: 93, earningsPkr: 41800 },
  { week: 'Week 4 (Current)', weekUrdu: 'ہفتہ 4 (موجودہ)', completedRides: 84, completionRate: 93, earningsPkr: 45200 },
];

export const DriverEarningsTab: React.FC<DriverEarningsTabProps> = ({
  language = 'en',
  theme = 'dark',
  completedRidesCount,
  totalEarningsPkr
}) => {
  const isUrdu = language === 'ur';
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');
  const [activeMetric, setActiveMetric] = useState<'all' | 'earnings' | 'rides'>('all');

  // Compute total aggregates
  const totals = useMemo(() => {
    const totalEarnings = totalEarningsPkr ?? DAILY_DATA.reduce((sum, d) => sum + d.earningsPkr, 0);
    const totalCompleted = completedRidesCount ?? DAILY_DATA.reduce((sum, d) => sum + d.completedRides, 0);
    const totalRequests = DAILY_DATA.reduce((sum, d) => sum + d.totalRequests, 0);
    const avgRate = Math.round((totalCompleted / totalRequests) * 100);
    const avgPerRide = totalCompleted > 0 ? Math.round(totalEarnings / totalCompleted) : 0;

    return { totalEarnings, totalCompleted, totalRequests, avgRate, avgPerRide };
  }, [totalEarningsPkr, completedRidesCount]);

  const activeChartData = useMemo(() => {
    if (timeframe === 'weekly') {
      return WEEKLY_DATA.map(w => ({
        label: isUrdu ? w.weekUrdu : w.week,
        earnings: w.earningsPkr,
        rides: w.completedRides,
        completionRate: w.completionRate
      }));
    }
    return DAILY_DATA.map(d => ({
      label: isUrdu ? d.dayUrdu : d.day,
      date: d.dateStr,
      earnings: d.earningsPkr,
      rides: d.completedRides,
      completionRate: d.completionRate,
      requests: d.totalRequests
    }));
  }, [timeframe, isUrdu]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-900 border border-yellow-500/40 text-white p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 min-w-[180px]">
          <div className="border-b border-white/10 pb-1 flex justify-between items-center">
            <span className="font-black text-yellow-400 uppercase tracking-wider text-[11px]">{label}</span>
            {data.date && <span className="text-[9px] text-gray-400 font-bold">{data.date}</span>}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-emerald-400 font-bold">
              <span>{isUrdu ? 'کمائی' : 'Earnings'}:</span>
              <span>Rs. {data.earnings?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-yellow-400 font-bold">
              <span>{isUrdu ? 'مکمل سواریاں' : 'Completed Rides'}:</span>
              <span>{data.rides} {isUrdu ? 'سواریاں' : 'rides'}</span>
            </div>
            <div className="flex justify-between items-center text-sky-400 font-bold">
              <span>{isUrdu ? 'تکمیل کی شرح' : 'Completion Rate'}:</span>
              <span>{data.completionRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-neutral-950 text-white rounded-[32px] p-5 sm:p-6 border border-neutral-800 space-y-6 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-yellow-400/20 text-yellow-400 rounded-2xl border border-yellow-400/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                {isUrdu ? 'ڈرائیور کمائی اور سواریوں کی تکمیل' : 'Earnings & Ride Completion Dashboard'}
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {isUrdu ? 'روزانہ اور ہفتہ وار مکمل شدہ سواریوں کا لائن چارٹ' : 'Daily & Weekly Ride Completion Analytics'}
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe & Metric Filter Switches */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-neutral-900 p-1 rounded-2xl border border-white/10 gap-1">
            <button
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                timeframe === 'daily' ? 'bg-yellow-400 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isUrdu ? 'روزانہ (7 دن)' : 'Daily (7 Days)'}
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                timeframe === 'weekly' ? 'bg-yellow-400 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isUrdu ? 'ہفتہ وار (4 ہفتے)' : 'Weekly Trend'}
            </button>
          </div>

          <div className="flex bg-neutral-900 p-1 rounded-2xl border border-white/10 gap-1">
            <button
              onClick={() => setActiveMetric('all')}
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeMetric === 'all' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isUrdu ? 'تمام' : 'All Lines'}
            </button>
            <button
              onClick={() => setActiveMetric('earnings')}
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeMetric === 'earnings' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isUrdu ? 'کمائی' : 'Earnings'}
            </button>
            <button
              onClick={() => setActiveMetric('rides')}
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeMetric === 'rides' ? 'bg-yellow-400 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isUrdu ? 'سواریاں' : 'Rides'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
              {isUrdu ? 'کل کمائی' : 'Total Earnings'}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400">
            Rs. {totals.totalEarnings.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-[9px] text-emerald-300/80 font-bold">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            <span>+14.2% {isUrdu ? 'پچھلے ہفتے سے' : 'vs last week'}</span>
          </div>
        </div>

        <div className="bg-yellow-950/40 p-4 rounded-2xl border border-yellow-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">
              {isUrdu ? 'مکمل شدہ سواریاں' : 'Completed Rides'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-xl font-black text-yellow-400">
            {totals.totalCompleted} <span className="text-xs text-gray-400 font-medium">rides</span>
          </p>
          <div className="flex items-center gap-1 text-[9px] text-yellow-300/80 font-bold">
            <span>{totals.avgRate}% {isUrdu ? 'تکمیل کی شرح' : 'completion rate'}</span>
          </div>
        </div>

        <div className="bg-sky-950/40 p-4 rounded-2xl border border-sky-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">
              {isUrdu ? 'اوسط کرایہ فی سواری' : 'Avg Fare / Ride'}
            </span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-black text-sky-400">
            Rs. {totals.avgPerRide.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-[9px] text-sky-300/80 font-bold">
            <span>{isUrdu ? 'خودکار میٹر فی کلومیٹر' : 'Auto tariff applied'}</span>
          </div>
        </div>

        <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
              {isUrdu ? 'سب سے بہترین دن' : 'Peak Earnings Day'}
            </span>
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <p className="text-xl font-black text-amber-400">
            {isUrdu ? 'ہفتہ (Saturday)' : 'Saturday'}
          </p>
          <div className="flex items-center gap-1 text-[9px] text-amber-300/80 font-bold">
            <span>Rs. 9,400 (17 {isUrdu ? 'سواریاں' : 'rides'})</span>
          </div>
        </div>
      </div>

      {/* Main Line Chart Visualization */}
      <div className="bg-neutral-900/80 p-5 rounded-3xl border border-white/10 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {timeframe === 'daily' 
                ? (isUrdu ? 'روزانہ کی سواریاں اور کمائی کا لائن گراف' : 'Daily Ride Completion & Revenue Line Trend')
                : (isUrdu ? 'ہفتہ وار کمائی اور سواریوں کی کارکردگی' : 'Weekly Completion & Revenue Line Trend')}
            </h4>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
            ● {isUrdu ? 'لائیو ریئل ٹائم ڈیٹا' : 'Live Synced Data'}
          </span>
        </div>

        <div className="w-full h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activeChartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              
              <XAxis
                dataKey="label"
                stroke="#a3a3a3"
                fontSize={10}
                fontWeight={700}
                tickLine={false}
                axisLine={{ stroke: '#404040' }}
              />

              {/* Left Axis: Earnings PKR */}
              {(activeMetric === 'all' || activeMetric === 'earnings') && (
                <YAxis
                  yAxisId="earningsAxis"
                  orientation="left"
                  stroke="#10b981"
                  fontSize={9}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rs.${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
              )}

              {/* Right Axis: Completed Rides Count */}
              {(activeMetric === 'all' || activeMetric === 'rides') && (
                <YAxis
                  yAxisId="ridesAxis"
                  orientation={activeMetric === 'rides' ? 'left' : 'right'}
                  stroke="#facc15"
                  fontSize={9}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} r`}
                />
              )}

              <Tooltip content={<CustomTooltip />} />
              
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                formatter={(value) => <span className="text-gray-300 font-bold uppercase">{value}</span>}
              />

              {/* Line 1: Earnings (Green) */}
              {(activeMetric === 'all' || activeMetric === 'earnings') && (
                <Line
                  yAxisId="earningsAxis"
                  type="monotone"
                  dataKey="earnings"
                  name={isUrdu ? 'کمائی (روپے)' : 'Earnings (PKR)'}
                  stroke="#10b981"
                  strokeWidth={3.5}
                  dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#000000' }}
                  activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {/* Line 2: Completed Rides (Yellow) */}
              {(activeMetric === 'all' || activeMetric === 'rides') && (
                <Line
                  yAxisId="ridesAxis"
                  type="monotone"
                  dataKey="rides"
                  name={isUrdu ? 'مکمل سواریاں' : 'Completed Rides'}
                  stroke="#facc15"
                  strokeWidth={3}
                  dot={{ fill: '#facc15', r: 5, strokeWidth: 2, stroke: '#000000' }}
                  activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {/* Line 3: Completion Rate % (Sky Blue - when All selected) */}
              {activeMetric === 'all' && (
                <Line
                  yAxisId="ridesAxis"
                  type="monotone"
                  dataKey="completionRate"
                  name={isUrdu ? 'تکمیل کی شرح (%)' : 'Completion Rate (%)'}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#38bdf8', r: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Completion Breakdown List */}
      <div className="bg-neutral-900/60 rounded-3xl p-5 border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-yellow-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {isUrdu ? 'روزانہ کی سواریوں کی تفصیلات اور بریک ڈاون' : 'Daily Ride Completion & Request Breakdown'}
            </h4>
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase">
            {DAILY_DATA.length} {isUrdu ? 'دن ریکارڈڈ' : 'Days Recorded'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DAILY_DATA.map((dayItem, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3 hover:border-yellow-400/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 flex flex-col items-center justify-center font-black">
                  <span className="text-xs leading-none">{isUrdu ? dayItem.dayUrdu : dayItem.day}</span>
                  <span className="text-[8px] text-gray-400 font-mono mt-0.5">{dayItem.dateStr}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">
                      {dayItem.completedRides} / {dayItem.totalRequests} {isUrdu ? 'سواریاں مکمل' : 'Rides Completed'}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                      {dayItem.completionRate}%
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    {isUrdu ? 'پیک آورز' : 'Peak'}: <span className="text-gray-300">{dayItem.peakHours}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-emerald-400 block">
                  Rs. {dayItem.earningsPkr.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-gray-500 uppercase">
                  ~Rs. {Math.round(dayItem.earningsPkr / dayItem.completedRides)} / {isUrdu ? 'سواری' : 'ride'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverEarningsTab;
