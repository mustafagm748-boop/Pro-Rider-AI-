import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { TrendingUp, CheckCircle, DollarSign, Calendar, Zap, BarChart2 } from 'lucide-react';

interface Props {
  language?: 'en' | 'ur' | 'de';
  theme?: 'light' | 'dark';
}

interface DailyData {
  day: string;
  dayUrdu: string;
  completed: number;
  total: number;
  completionRate: number;
  earnings: number;
}

const WEEKLY_DATA: DailyData[] = [
  { day: 'Mon', dayUrdu: 'پیر', completed: 8, total: 9, completionRate: 89, earnings: 4200 },
  { day: 'Tue', dayUrdu: 'منگل', completed: 11, total: 12, completionRate: 92, earnings: 5800 },
  { day: 'Wed', dayUrdu: 'بدھ', completed: 10, total: 11, completionRate: 91, earnings: 5100 },
  { day: 'Thu', dayUrdu: 'جمعرات', completed: 9, total: 10, completionRate: 90, earnings: 4600 },
  { day: 'Fri', dayUrdu: 'جمعہ', completed: 14, total: 14, completionRate: 100, earnings: 7900 },
  { day: 'Sat', dayUrdu: 'ہفتہ', completed: 17, total: 18, completionRate: 94, earnings: 9400 },
  { day: 'Sun', dayUrdu: 'اتوار', completed: 15, total: 16, completionRate: 94, earnings: 8200 },
];

export function DriverWeeklyAnalytics({ language = 'en' }: Props) {
  const isUrdu = language === 'ur';
  const [metricView, setMetricView] = useState<'all' | 'earnings' | 'rate'>('all');

  // Calculations
  const totalEarnings = WEEKLY_DATA.reduce((acc, curr) => acc + curr.earnings, 0);
  const totalCompleted = WEEKLY_DATA.reduce((acc, curr) => acc + curr.completed, 0);
  const totalRequested = WEEKLY_DATA.reduce((acc, curr) => acc + curr.total, 0);
  const avgCompletionRate = Math.round((totalCompleted / totalRequested) * 100);

  const formattedData = WEEKLY_DATA.map(d => ({
    ...d,
    displayDay: isUrdu ? d.dayUrdu : d.day
  }));

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="bg-neutral-900 border border-yellow-500/30 rounded-2xl p-3.5 shadow-2xl text-white text-xs space-y-1.5 min-w-[170px]">
          <p className="font-black text-yellow-400 uppercase tracking-widest text-[10px] border-b border-white/10 pb-1">
            📅 {dataItem.displayDay} ({dataItem.day})
          </p>
          <div className="flex justify-between items-center gap-4">
            <span className="text-gray-400 font-bold">{isUrdu ? 'کمائی' : 'Earnings'}:</span>
            <span className="font-black text-emerald-400">Rs. {dataItem.earnings.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-gray-400 font-bold">{isUrdu ? 'تکمیل کی شرح' : 'Completion'}:</span>
            <span className="font-black text-yellow-400">{dataItem.completionRate}%</span>
          </div>
          <div className="flex justify-between items-center gap-4 text-[10px] text-gray-400 pt-0.5 border-t border-white/5">
            <span>{isUrdu ? 'سواریوں کی تعداد' : 'Rides'}:</span>
            <span className="font-bold text-white">{dataItem.completed} / {dataItem.total}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-neutral-950 text-white rounded-[32px] p-6 border border-neutral-800 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base font-black uppercase tracking-tight text-white">
              {isUrdu ? 'ہفتہ وار کارکردگی اور آمدنی' : 'Weekly Performance & Earnings'}
            </h3>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
            {isUrdu ? 'گزشتہ 7 دنوں کی تفصیلات' : 'Last 7 Days Activity & Completion Analytics'}
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/10 gap-1">
          <button
            onClick={() => setMetricView('all')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
              metricView === 'all' ? 'bg-yellow-400 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            {isUrdu ? 'تمام' : 'Both'}
          </button>
          <button
            onClick={() => setMetricView('earnings')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
              metricView === 'earnings' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            {isUrdu ? 'آمدنی' : 'Earnings'}
          </button>
          <button
            onClick={() => setMetricView('rate')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
              metricView === 'rate' ? 'bg-yellow-400 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            {isUrdu ? 'تکمیل %' : 'Rate %'}
          </button>
        </div>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
              {isUrdu ? 'کل ہفتہ وار کمائی' : 'Weekly Revenue'}
            </span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-base font-black text-emerald-400">
            Rs. {totalEarnings.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
              {isUrdu ? 'اوسط تکمیل کی شرح' : 'Completion Rate'}
            </span>
            <CheckCircle className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <p className="text-base font-black text-yellow-400">
            {avgCompletionRate}%
          </p>
        </div>

        <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
              {isUrdu ? 'مکمل شدہ سواریاں' : 'Total Completed'}
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-base font-black text-white">
            {totalCompleted} / {totalRequested}
          </p>
        </div>

        <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
              {isUrdu ? 'بہترین دن' : 'Peak Earnings Day'}
            </span>
            <Zap className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          </div>
          <p className="text-base font-black text-orange-400">
            {isUrdu ? 'ہفتہ (Saturday)' : 'Saturday'}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="w-full h-64 relative bg-neutral-900/60 p-4 rounded-2xl border border-white/5">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis 
              dataKey="displayDay" 
              stroke="#a3a3a3" 
              fontSize={10} 
              tickLine={false} 
              axisLine={{ stroke: '#404040' }} 
            />
            
            {/* Left Y-Axis for Earnings */}
            {(metricView === 'all' || metricView === 'earnings') && (
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#10b981" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `Rs.${val/1000}k`}
              />
            )}

            {/* Right Y-Axis for Completion Rate % */}
            {(metricView === 'all' || metricView === 'rate') && (
              <YAxis 
                yAxisId="right" 
                orientation={metricView === 'rate' ? 'left' : 'right'} 
                stroke="#facc15" 
                fontSize={9} 
                domain={[70, 100]} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} 
              formatter={(value) => <span className="text-gray-300 font-bold uppercase">{value}</span>}
            />

            {(metricView === 'all' || metricView === 'earnings') && (
              <Bar 
                yAxisId="left" 
                dataKey="earnings" 
                name={isUrdu ? 'آمدنی (Rs)' : 'Daily Earnings (PKR)'} 
                fill="#10b981" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={28}
              />
            )}

            {(metricView === 'all' || metricView === 'rate') && (
              <Line 
                yAxisId={metricView === 'rate' ? 'right' : 'right'} 
                type="monotone" 
                dataKey="completionRate" 
                name={isUrdu ? 'تکمیل کی شرح (%)' : 'Completion Rate (%)'} 
                stroke="#facc15" 
                strokeWidth={3} 
                dot={{ fill: '#facc15', r: 4, strokeWidth: 2, stroke: '#000' }} 
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
