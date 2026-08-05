import React, { useState, useEffect, useMemo } from 'react';
import { Star, Phone, Clock, User, Sparkles, MessageSquare, ShieldCheck, Trash2, BarChart3, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface CallFeedbacksAdminProps {
  isUrdu: boolean;
  showNotification: (msg: string) => void;
}

export const CallFeedbacksAdmin: React.FC<CallFeedbacksAdminProps> = ({ isUrdu, showNotification }) => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    const loadFeedbacks = () => {
      try {
        const saved = localStorage.getItem('prorider_call_feedbacks');
        if (saved) {
          setFeedbacks(JSON.parse(saved));
        } else {
          // Default mock feedbacks for testing/demonstration if empty
          setFeedbacks([
            {
              id: 'fb-1',
              rideId: 'PR-8921',
              callerName: 'Tariq Mehmood',
              callerRole: 'driver',
              duration: 142,
              rating: 5,
              comment: 'Crystal clear voice connection over internet. Very smooth!',
              timestamp: Date.now() - 3600000 * 2
            },
            {
              id: 'fb-2',
              rideId: 'PR-4412',
              callerName: 'Azeem Khan',
              callerRole: 'passenger',
              duration: 85,
              rating: 5,
              comment: 'Direct driver call connected instantly without any support hotline delay.',
              timestamp: Date.now() - 3600000 * 5
            },
            {
              id: 'fb-3',
              rideId: 'PR-1092',
              callerName: 'Muhammad Ali',
              callerRole: 'driver',
              duration: 60,
              rating: 4,
              comment: 'Good connection quality.',
              timestamp: Date.now() - 3600000 * 24
            },
            {
              id: 'fb-4',
              rideId: 'PR-3310',
              callerName: 'Zainab Bibi',
              callerRole: 'passenger',
              duration: 110,
              rating: 5,
              comment: 'Audio was crystal clear and very easy to talk.',
              timestamp: Date.now() - 3600000 * 30
            },
            {
              id: 'fb-5',
              rideId: 'PR-7741',
              callerName: 'Bilal Ahmed',
              callerRole: 'driver',
              duration: 45,
              rating: 3,
              comment: 'Minor echo initially but resolved.',
              timestamp: Date.now() - 3600000 * 48
            }
          ]);
        }
      } catch (e) {
        setFeedbacks([]);
      }
    };
    loadFeedbacks();
  }, []);

  const handleDeleteFeedback = (id: string) => {
    const updated = feedbacks.filter(f => f.id !== id);
    setFeedbacks(updated);
    localStorage.setItem('prorider_call_feedbacks', JSON.stringify(updated));
    showNotification(isUrdu ? 'ریٹنگ ہٹا دی گئی ہے' : 'Call feedback removed');
  };

  const handleClearAll = () => {
    if (window.confirm(isUrdu ? 'کیا آپ تمام کال ریٹنگز کو حذف کرنا چاہتے ہیں؟' : 'Clear all call feedbacks?')) {
      setFeedbacks([]);
      localStorage.setItem('prorider_call_feedbacks', JSON.stringify([]));
      showNotification(isUrdu ? 'تمام ریٹنگز صاف کر دی گئی ہیں' : 'All call feedbacks cleared');
    }
  };

  const avgRating = feedbacks.length > 0 
    ? (feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 5), 0) / feedbacks.length).toFixed(1)
    : '5.0';

  const avgDurationSeconds = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((acc, f) => acc + (Number(f.duration) || 60), 0) / feedbacks.length)
    : 90;

  // Aggregate distribution data for Recharts
  const ratingDistribution = useMemo(() => {
    const counts = { '1 Star': 0, '2 Stars': 0, '3 Stars': 0, '4 Stars': 0, '5 Stars': 0 };
    feedbacks.forEach(f => {
      const r = Number(f.rating) || 5;
      if (r === 1) counts['1 Star']++;
      else if (r === 2) counts['2 Stars']++;
      else if (r === 3) counts['3 Stars']++;
      else if (r === 4) counts['4 Stars']++;
      else if (r === 5) counts['5 Stars']++;
    });
    return [
      { name: '1 ★', count: counts['1 Star'], fill: '#ef4444' },
      { name: '2 ★', count: counts['2 Stars'], fill: '#f97316' },
      { name: '3 ★', count: counts['3 Stars'], fill: '#eab308' },
      { name: '4 ★', count: counts['4 Stars'], fill: '#84cc16' },
      { name: '5 ★', count: counts['5 Stars'], fill: '#10b981' },
    ];
  }, [feedbacks]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-yellow-400/20 text-yellow-600 rounded-2xl">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight">
                {isUrdu ? 'لائیو کال ریٹنگز اور فیڈ بیک' : 'Call Ratings & Quality Feedback'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isUrdu ? 'صارفین اور ڈرائیورز کی جانب سے لائیو نیٹ ورک کال کے بعد کی ریٹنگز' : 'Post-call quality ratings and feedback submitted by drivers and passengers'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center min-w-[110px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isUrdu ? 'اوسط ریٹنگ' : 'Avg Rating'}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-xl font-black text-black">{avgRating}</span>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center min-w-[110px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isUrdu ? 'اوسط دورانیہ' : 'Avg Duration'}</p>
            <p className="text-xl font-black text-black mt-1">{formatDuration(avgDurationSeconds)}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center min-w-[110px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isUrdu ? 'کل کالز' : 'Total Calls'}</p>
            <p className="text-xl font-black text-black mt-1">{feedbacks.length}</p>
          </div>
          {feedbacks.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all cursor-pointer"
              title="Clear All Feedback"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Recharts Analytics Widget */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="text-sm font-black text-black uppercase tracking-tight">
                {isUrdu ? 'کال کے معیار اور ریٹنگ کی تقسیم' : 'Call Quality Rating Distribution & Performance'}
              </h4>
              <p className="text-[11px] text-gray-500">
                {isUrdu ? 'صارفین کی جانب سے دی گئی 1 سے 5 ستاروں کی درجہ بندی کا تجزیہ' : 'Aggregated star rating breakdown across all live network voice calls'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
            ● Recharts Analytic Engine
          </span>
        </div>

        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratingDistribution} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight={700} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis stroke="#64748b" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                formatter={(value: any) => [`${value} feedbacks`, 'Count']}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feedback List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feedbacks.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-gray-200 rounded-3xl">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-800">{isUrdu ? 'کوئی کال ریٹنگ موجود نہیں' : 'No Call Ratings Yet'}</h4>
            <p className="text-xs text-gray-500 mt-1">{isUrdu ? 'جب صارفین لائیو کال ختم کریں گے تو ریٹنگز یہاں ظاہر ہوں گی' : 'Call ratings will appear here after users complete and rate their live calls.'}</p>
          </div>
        ) : (
          feedbacks.map((fb) => (
            <div key={fb.id} className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-yellow-400/60 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-black text-yellow-400 flex items-center justify-center font-bold text-sm">
                      {fb.callerName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-black uppercase tracking-tight">{fb.callerName}</h4>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {fb.callerRole === 'driver' ? (isUrdu ? 'ڈرائیور' : 'Driver') : (isUrdu ? 'مسافر' : 'Passenger')} • {fb.rideId || 'PR-LIVE'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteFeedback(fb.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`w-4 h-4 ${s <= (fb.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                  <span className="text-xs font-black text-black ml-1.5">{fb.rating}.0 / 5.0</span>
                </div>

                {/* Comment */}
                {fb.comment && (
                  <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 p-3 rounded-2xl italic">
                    "{fb.comment}"
                  </p>
                )}
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(fb.duration || 60)}
                </span>
                <span>{new Date(fb.timestamp || Date.now()).toLocaleDateString()} {new Date(fb.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
