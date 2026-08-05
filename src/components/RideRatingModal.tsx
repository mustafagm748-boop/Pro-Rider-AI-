import React, { useState } from 'react';
import { X, Star, ThumbsUp, Heart, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Ride, Language } from '../types';

interface Props {
  ride: Ride;
  userRole: 'passenger' | 'driver' | 'admin';
  onClose: () => void;
  onSubmitRating: (rideId: string, rating: number, comment: string, ratedRole: 'driver' | 'passenger') => void;
  language?: Language;
}

export default function RideRatingModal({ ride, userRole, onClose, onSubmitRating, language = 'en' }: Props) {
  const isUrdu = language === 'ur';
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customComment, setCustomComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isPassengerRating = userRole === 'passenger';
  const targetName = isPassengerRating 
    ? (ride.driverName || 'Captain') 
    : (ride.passengerName || 'Passenger');

  const feedbackTags = isPassengerRating
    ? [
        isUrdu ? 'وقت کا پابند' : 'Punctual',
        isUrdu ? 'محفوظ ڈرائیونگ' : 'Safe Driving',
        isUrdu ? 'صاف گاڑی' : 'Clean Vehicle',
        isUrdu ? 'شائستہ اخلاق' : 'Polite & Friendly',
        isUrdu ? 'بہترین سروس' : 'Great AC & Comfort'
      ]
    : [
        isUrdu ? 'وقت پر آمد' : 'Punctual at Pickup',
        isUrdu ? 'شائستہ رویہ' : 'Respectful Passenger',
        isUrdu ? 'فوری ادائیگی' : 'Prompt Payment',
        isUrdu ? 'بہترین رابطہ' : 'Easy Communication'
      ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    const fullComment = [...selectedTags, customComment].filter(Boolean).join(' • ');
    onSubmitRating(ride.id, rating, fullComment, isPassengerRating ? 'driver' : 'passenger');
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-400 flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-black text-white p-5 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 text-yellow-400 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-black mx-auto mb-2 font-black text-xl">
            ⭐
          </div>
          <h3 className="text-base font-black uppercase tracking-wide text-white">
            {isUrdu ? 'سواری کا جائزہ اور درجہ بندی' : 'Rate & Review Trip'}
          </h3>
          <p className="text-[11px] text-yellow-400 font-bold mt-0.5">
            {isPassengerRating
              ? (isUrdu ? `${targetName} کی ڈرائیونگ کا تجربہ بتائیں` : `How was your trip with ${targetName}?`)
              : (isUrdu ? `${targetName} کے ساتھ سفر کی درجہ بندی کریں` : `Rate your passenger ${targetName}`)}
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-base font-black uppercase text-black">
              {isUrdu ? 'شکریہ! آپ کا جائزہ جمع ہو گیا' : 'Thank You! Rating Submitted'}
            </h4>
            <p className="text-xs text-gray-500 font-bold">
              {isUrdu ? 'آپ کے فیڈ بیک سے پرو رائڈر کمیونٹی اور بہتر ہوتی ہے۔' : 'Your feedback helps improve ProRider community safety.'}
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Ride Summary */}
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 space-y-1">
              <p className="flex justify-between text-black font-black">
                <span>📍 {ride.pickupLocation} ➔ {ride.dropoffLocation}</span>
                <span className="text-yellow-600">Rs. {ride.fare}</span>
              </p>
            </div>

            {/* Star Rating Buttons */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform active:scale-125"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-black uppercase text-amber-600">
                {rating === 5 && (isUrdu ? 'بہترین • Outstanding!' : 'Outstanding! ⭐⭐⭐⭐⭐')}
                {rating === 4 && (isUrdu ? 'بہت اچھا • Very Good' : 'Very Good')}
                {rating === 3 && (isUrdu ? 'مناسب • Average' : 'Average')}
                {rating === 2 && (isUrdu ? 'خراب • Poor' : 'Needs Improvement')}
                {rating === 1 && (isUrdu ? 'بہت خراب • Terribly Bad' : 'Unsatisfactory')}
              </span>
            </div>

            {/* Quick Feedback Tags */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                {isUrdu ? 'فوری ٹیگز منتخب کریں:' : 'Select feedback tags:'}
              </label>
              <div className="flex flex-wrap gap-2">
                {feedbackTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                        active
                          ? 'bg-black text-yellow-400 border border-black shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Input */}
            <div>
              <textarea
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                placeholder={
                  isUrdu ? 'مزید تفصیلی رائے لکھیں (اختیاری)...' : 'Add custom review comments (optional)...'
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-yellow-400 focus:bg-white transition-all text-black h-20 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full py-3.5 bg-black hover:bg-neutral-800 text-yellow-400 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{isUrdu ? 'درجہ بندی مکمل کریں' : 'Submit Rating & Review'}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
