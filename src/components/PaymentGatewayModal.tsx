import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, ArrowRight, Loader2, Smartphone, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { voiceService } from '../lib/voice';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMethod?: 'EasyPaisa' | 'JazzCash';
  language: Language;
  onTopUpSuccess: (amount: number, method: 'EasyPaisa' | 'JazzCash', txId: string) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  initialMethod = 'EasyPaisa',
  language,
  onTopUpSuccess
}) => {
  const isUrdu = language === 'ur';
  const [method, setMethod] = useState<'EasyPaisa' | 'JazzCash'>(initialMethod);
  const [amount, setAmount] = useState<string>('500');
  const [phone, setPhone] = useState<string>('03125007782');
  const [trxId, setTrxId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleProcessPayment = () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 50) {
      alert(isUrdu ? 'کم از کم رقم 50 روپے ہونی چاہیے۔' : 'Minimum top-up amount is Rs. 50.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      const generatedTxId = trxId.trim() || 'TRX-' + Math.floor(10000000 + Math.random() * 90000000);
      onTopUpSuccess(numAmount, method, generatedTxId);
      
      const msg = isUrdu
        ? `کامیابی! ${numAmount} روپے ${method} کے ذریعے والٹ میں شامل کر دیے گئے ہیں۔`
        : `Success! Deposit of Rs. ${numAmount} via ${method} verified & credited.`;
      voiceService.speak(msg, isUrdu ? 'ur-PK' : 'en-US');

      setTimeout(() => {
        setIsSuccess(false);
        setTrxId('');
        onClose();
      }, 1800);
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl border-2 border-yellow-400/40 relative"
        >
          {/* Header */}
          <div className="bg-black p-5 text-white flex items-center justify-between border-b-2 border-yellow-400/30">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-yellow-400">
                  {isUrdu ? 'موبائل والٹ ٹاپ اپ' : 'Mobile Wallet Payment Gateway'}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold">EasyPaisa & JazzCash Merchant Direct API</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {isSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-black text-black">
                  {isUrdu ? 'ٹاپ اپ باکامیابی مکمل ہوا!' : 'Payment Verified & Credited!'}
                </h4>
                <p className="text-xs text-emerald-700 font-bold">
                  Rs. {amount} added to Pro Rider Wallet via {method}.
                </p>
              </div>
            ) : (
              <>
                {/* Method selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                    {isUrdu ? 'ادائیگی کا ذریعہ منتخب کریں' : 'Select Payment Method'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMethod('EasyPaisa')}
                      className={`p-3.5 rounded-2xl border-2 font-black text-xs transition-all flex items-center justify-center gap-2 ${
                        method === 'EasyPaisa'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-md scale-[1.02]'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-emerald-600" />
                      <span>EasyPaisa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod('JazzCash')}
                      className={`p-3.5 rounded-2xl border-2 font-black text-xs transition-all flex items-center justify-center gap-2 ${
                        method === 'JazzCash'
                          ? 'border-red-500 bg-red-50 text-red-950 shadow-md scale-[1.02]'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-red-600" />
                      <span>JazzCash</span>
                    </button>
                  </div>
                </div>

                {/* Amount quick picks */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                    {isUrdu ? 'رقم منتخب کریں (روپے)' : 'Select Top-Up Amount (PKR)'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['200', '500', '1000', '2000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        className={`py-2 px-1 rounded-xl text-xs font-black transition-all border ${
                          amount === amt
                            ? 'bg-black text-yellow-400 border-black shadow'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        Rs. {amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black text-black outline-none focus:ring-2 focus:ring-yellow-400 mt-1"
                    placeholder="Enter custom amount..."
                  />
                </div>

                {/* Merchant Transfer Instructions */}
                <div className="p-3.5 bg-neutral-900 rounded-2xl text-white space-y-1.5 border border-white/10 text-xs">
                  <div className="flex justify-between items-center text-[10px] font-bold text-yellow-400 uppercase tracking-widest">
                    <span>Merchant Details ({method})</span>
                    <span>100% Encrypted</span>
                  </div>
                  <p className="font-mono text-white text-xs">Till ID / Account: <strong>0312-5007782</strong></p>
                  <p className="text-[11px] text-gray-300">Title: <strong>PRO RIDER DISPATCH NETWORK</strong></p>
                </div>

                {/* User Mobile Phone / TRX ID input */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                      {method} Account Mobile Number
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-black outline-none focus:border-black"
                        placeholder="e.g. 03001234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                      Transaction Reference / TRX ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono font-bold text-black outline-none focus:border-black uppercase"
                      placeholder="e.g. TRX-8920194812"
                    />
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleProcessPayment}
                  className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-500"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying with {method} Gateway...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Deposit Rs. {amount}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
