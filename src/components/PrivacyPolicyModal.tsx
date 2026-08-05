import React from 'react';
import { X, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose, language }) => {
  const isUrdu = language === 'ur';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-2xl border-2 border-yellow-400/40 relative max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-black p-6 text-white flex items-center justify-between border-b-2 border-yellow-400/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-yellow-400">
                  {isUrdu ? 'پرائیویسی پالیسی اور ڈیٹا سیفٹی' : 'Privacy Policy & Data Safety'}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold">Pro Rider AI Dispatch Network — Play Console Compliant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs text-gray-700 leading-relaxed">
            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-2xl flex items-start gap-3">
              <Lock className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-yellow-950 uppercase text-[11px] tracking-wider">
                  {isUrdu ? 'ڈیٹا کی حفاظت کی ضمانت' : 'Strict Data Privacy Guarantee'}
                </h4>
                <p className="text-[11px] text-yellow-900 mt-0.5">
                  Pro Rider AI collects essential mobility data (GPS location, phone number, vehicle details, and identity documents for drivers) strictly to facilitate safe ride-hailing and carpooling services.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-black text-sm uppercase tracking-wide flex items-center gap-2">
                <Eye className="w-4 h-4 text-yellow-500" />
                1. Data Collected & Purpose
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 font-medium">
                <li><strong>Precise Location (GPS):</strong> Used in foreground and background during active rides for driver-passenger matching, route navigation, and emergency SOS safety.</li>
                <li><strong>Identity Documents & Selfies:</strong> Driver CNIC, license, and vehicle documents are collected solely for account audit, background safety verification, and platform integrity.</li>
                <li><strong>Audio & Microphone Transcripts:</strong> Voice input used exclusively for AI voice-assisted ride booking. Audio stream is ephemeral and never sold or shared.</li>
                <li><strong>Wallet Transactions:</strong> EasyPaisa/JazzCash transaction references are logged to audit wallet balances and fare settlements.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-black text-sm uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-500" />
                2. Data Protection & Sharing Policy
              </h4>
              <p className="font-medium text-gray-600">
                We do not sell, rent, or trade your personal information to third-party advertisers. Information is only shared between assigned drivers and passengers during active ride dispatches (with phone number masking options enabled).
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-black text-sm uppercase tracking-wide flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-500" />
                3. User Rights & Account Deletion
              </h4>
              <p className="font-medium text-gray-600">
                Users can request full account data erasure, document deletion, or profile removal at any time by contacting our support line or submitting a request via the App Admin settings panel.
              </p>
            </div>

            <div className="pt-2 text-[10px] text-gray-400 font-bold border-t border-gray-100 flex justify-between items-center">
              <span>Last updated: August 2026</span>
              <span>Official Publisher: Pro Rider Mobility Systems</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3 bg-black hover:bg-neutral-800 text-yellow-400 font-black text-xs uppercase tracking-widest rounded-2xl transition-colors shadow-lg"
            >
              {isUrdu ? 'میں متفق ہوں (بند کریں)' : 'I Understand & Accept Terms'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
