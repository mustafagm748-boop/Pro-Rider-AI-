import React, { useState } from 'react';
import { MessageSquare, CircleDashed, Settings, Shield, Home, Bell, Car, Sparkles, RefreshCw, MoreVertical, ArrowLeft, Radio, Phone, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, Theme, UserProfile, Ride } from '../types';
import { translations } from '../lib/i18n';
import StatusBar from './StatusBar';
import { ProRiderLogo } from './ProRiderLogo';
import { GeminiChatAndVoiceModal } from './GeminiChatAndVoiceModal';
import { LiveDirectCallModal } from './LiveDirectCallModal';
import { PullToRefresh } from './PullToRefresh';

interface Props {
  children: React.ReactNode;
  user?: UserProfile;
  activeRide?: Ride | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSettingsClick?: () => void;
  onMessagesClick?: () => void;
  onStatusClick?: () => void;
  onLogout?: () => void;
  onLogoClick?: () => void;
  onNotificationClick?: () => void;
  notificationsCount?: number;
  language: Language;
  theme: Theme;
  isAdmin?: boolean;
  globalStatus: string;
  onStatusChange?: (status: string) => void;
  hideNavigation?: boolean;
}

export default function MainLayout({ 
  children, 
  user,
  activeRide,
  activeTab, 
  onTabChange, 
  onSettingsClick, 
  onMessagesClick, 
  onStatusClick,
  onLogout,
  onLogoClick,
  onNotificationClick,
  notificationsCount = 0,
  language, 
  theme, 
  isAdmin,
  globalStatus,
  onStatusChange,
  hideNavigation = false
}: Props) {
  const t = translations[language];
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [geminiMode, setGeminiMode] = useState<'chat' | 'voice'>('chat');
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const getThemeBarClasses = () => {
    switch (theme) {
      case 'blue':
        return { barBg: 'bg-blue-900 text-white border-blue-500/40', accent: 'text-blue-400', badge: 'bg-blue-500 text-white', activeBg: 'bg-blue-600 text-white' };
      case 'red':
        return { barBg: 'bg-red-900 text-white border-red-500/40', accent: 'text-red-400', badge: 'bg-red-500 text-white', activeBg: 'bg-red-600 text-white' };
      case 'green':
        return { barBg: 'bg-emerald-900 text-white border-emerald-500/40', accent: 'text-emerald-400', badge: 'bg-emerald-500 text-white', activeBg: 'bg-emerald-600 text-white' };
      case 'purple':
        return { barBg: 'bg-purple-900 text-white border-purple-500/40', accent: 'text-purple-400', badge: 'bg-purple-500 text-white', activeBg: 'bg-purple-600 text-white' };
      case 'dark':
        return { barBg: 'bg-neutral-900 text-white border-neutral-700', accent: 'text-yellow-400', badge: 'bg-yellow-400 text-black', activeBg: 'bg-yellow-400 text-black' };
      case 'gold':
      case 'light':
      default:
        return { barBg: 'bg-black text-white border-yellow-400/40', accent: 'text-yellow-400', badge: 'bg-yellow-400 text-black', activeBg: 'bg-yellow-400 text-black' };
    }
  };
  const themeClasses = getThemeBarClasses();

  const handleRefresh = async () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className={`flex flex-col h-full w-full max-w-md mx-auto overflow-hidden relative sm:border-x ${theme === 'dark' ? 'border-neutral-800 bg-[#0c0c0c] text-white' : 'border-gray-100 bg-[#f8f9fa] text-gray-900'} ${language === 'ur' ? 'rtl font-urdu' : ''}`}>
      <StatusBar 
        status={globalStatus} 
        isAdmin={isAdmin || false} 
        onStatusChange={onStatusChange} 
      />

      {/* Main Top Header */}
      {!hideNavigation && (
        <div className={`px-3 py-2.5 flex items-center justify-between z-40 shadow-md border-b shrink-0 relative ${themeClasses.barBg}`}>
          <div className="flex items-center gap-2 cursor-pointer select-none active:opacity-80 transition-opacity" onClick={onLogoClick}>
            <div className="relative">
              <ProRiderLogo size="sm" />
              {isAdmin && (
                <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black z-10 ${themeClasses.badge}`} title="Admin Mode">
                  <Shield className="w-2 h-2" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-base font-bold uppercase tracking-tight flex items-center leading-none mb-0.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${themeClasses.badge}`}>PRO</span>
                <span className={`ml-1 ${themeClasses.accent}`}>RIDER</span>
              </h1>
              <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 leading-none">Official App</p>
            </div>
          </div>

          {/* Top Header Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsLiveCallOpen(true)} 
              className="px-3 py-1.5 bg-yellow-400 text-black hover:bg-yellow-300 rounded-2xl transition-all shadow-md flex items-center gap-1.5 active:scale-95 text-xs font-black animate-pulse" 
              title={language === 'ur' ? 'کپتان و مسافر براہ راست کال' : 'Live Direct Call'}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-black tracking-wide">{language === 'ur' ? 'کال' : 'Live Call'}</span>
            </button>

            {/* Clean 3-Dots Menu Button */}
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)} 
                className="p-2 bg-neutral-900 hover:bg-neutral-800 text-yellow-400 rounded-2xl transition-all relative active:scale-95 border border-yellow-400/30 flex items-center justify-center shadow-md" 
                title="Menu Options"
              >
                <MoreVertical className="w-5 h-5" />
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>

              {/* 3-Dots Dropdown Overlay Menu */}
              <AnimatePresence>
                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowMoreMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className="absolute right-0 top-12 z-[110] bg-neutral-900 text-white rounded-2xl p-2 shadow-2xl border border-yellow-400/40 w-52 space-y-1"
                    >
                      {/* AI Voice Assistant */}
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setGeminiMode('voice');
                          setIsGeminiOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-left text-xs font-bold transition-all text-yellow-400"
                      >
                        <div className="p-1.5 rounded-lg bg-yellow-400/20 text-yellow-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span>{language === 'ur' ? 'اے آئی وائس اسسٹنٹ' : 'AI Voice Assistant'}</span>
                      </button>

                      {/* Notifications */}
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          if (onNotificationClick) onNotificationClick();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-left text-xs font-bold transition-all text-gray-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-white/10 text-yellow-400">
                            <Bell className="w-4 h-4" />
                          </div>
                          <span>{language === 'ur' ? 'نوٹیفیکیشنز' : 'Notifications'}</span>
                        </div>
                        {notificationsCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full">
                            {notificationsCount}
                          </span>
                        )}
                      </button>

                      {/* Refresh App */}
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleRefresh();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-left text-xs font-bold transition-all text-gray-200"
                      >
                        <div className="p-1.5 rounded-lg bg-white/10 text-yellow-400">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <span>{language === 'ur' ? 'ایپ ریفریش' : 'Refresh App'}</span>
                      </button>

                      {/* Install App Button */}
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          if ((window as any).deferredPwaPrompt) {
                            (window as any).deferredPwaPrompt.prompt();
                          } else {
                            alert(language === 'ur'
                              ? 'ایپ انسٹال کرنے کے لیے کروم براؤزر کے مینو میں جاکر "Add to Home Screen" یا "Install App" پر کلک کریں۔'
                              : 'To install the application, open browser options and tap "Add to Home Screen" or "Install App".');
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-yellow-400/20 text-yellow-400 text-left text-xs font-bold transition-all"
                      >
                        <div className="p-1.5 rounded-lg bg-yellow-400/20 text-yellow-400">
                          <Car className="w-4 h-4" />
                        </div>
                        <span>{language === 'ur' ? 'ایپ انسٹال کریں (Install)' : 'Install App'}</span>
                      </button>

                      {/* Settings */}
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          if (onSettingsClick) onSettingsClick();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-left text-xs font-bold transition-all text-gray-200"
                      >
                        <div className="p-1.5 rounded-lg bg-white/10 text-yellow-400">
                          <Settings className="w-4 h-4" />
                        </div>
                        <span>{language === 'ur' ? 'سیٹنگز' : 'Settings'}</span>
                      </button>

                      {/* Go Back / Exit */}
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          if (onLogout) {
                            onLogout();
                          } else {
                            onTabChange('home');
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-500/20 text-red-400 text-left text-xs font-bold transition-all border-t border-white/10 mt-1 pt-2"
                      >
                        <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                          <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span>{language === 'ur' ? 'واپس جائیں / لاگ آؤٹ' : 'Go Back / Exit'}</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Global Gemini Chat & Live Voice Modal */}
      <GeminiChatAndVoiceModal
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
        language={language}
        initialMode={geminiMode}
        userRole={(user?.role as any) || (isAdmin ? 'admin' : 'passenger')}
      />

      {/* Direct Walkie-Talkie & Voice Call Modal */}
      <LiveDirectCallModal
        isOpen={isLiveCallOpen}
        onClose={() => setIsLiveCallOpen(false)}
        user={user}
        activeRide={activeRide}
        language={language}
      />

      {/* Dynamic Content */}
      <div className={`flex-1 overflow-hidden relative ${theme === 'dark' ? 'bg-[#0c0c0c]' : 'bg-white'}`}>
        <PullToRefresh onRefresh={handleRefresh}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </PullToRefresh>
      </div>

      {/* Bottom Navigation */}
      {!hideNavigation && (
        <div className={`pb-3 pt-2 px-2 flex items-center justify-around z-40 border-t shadow-2xl shrink-0 ${themeClasses.barBg}`}>
          <NavButton 
            active={activeTab === 'home'} 
            onClick={() => onTabChange('home')} 
            icon={<Home className="w-4 h-4" />} 
            label={language === 'ur' ? 'ہوم' : 'Home'}
            themeClasses={themeClasses}
          />
          <NavButton 
            active={activeTab === 'chats'} 
            onClick={() => onTabChange('chats')} 
            icon={isAdmin ? <Radio className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />} 
            label={isAdmin ? (language === 'ur' ? 'کنٹرول روم' : 'Control Room') : (language === 'ur' ? 'چیٹس' : 'Chats')}
            themeClasses={themeClasses}
          />
          <NavButton 
            active={activeTab === 'carpooling'} 
            onClick={() => onTabChange('carpooling')} 
            icon={<Car className="w-4 h-4" />} 
            label={language === 'ur' ? 'کار پولنگ' : 'Car Pooling'}
            themeClasses={themeClasses}
          />
          <NavButton 
            active={activeTab === 'status'} 
            onClick={() => onTabChange('status')} 
            icon={<CircleDashed className="w-4 h-4" />} 
            label={language === 'ur' ? 'اسٹیٹس' : 'Status'}
            themeClasses={themeClasses}
          />
          {isAdmin && (
            <NavButton 
              active={activeTab === 'admin'} 
              onClick={() => onTabChange('admin')} 
              icon={<Shield className="w-4 h-4" />} 
              label={language === 'ur' ? 'ایڈمن' : 'Admin'}
              themeClasses={themeClasses}
            />
          )}
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label, themeClasses }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, themeClasses: any }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 active:scale-95 ${active ? 'opacity-100' : 'opacity-60 hover:opacity-90'}`}
    >
      <div className={`w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200 ${
        active 
          ? `${themeClasses.activeBg} font-black shadow-md scale-105` 
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}>
        {icon}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-wider ${active ? themeClasses.accent : 'text-gray-400'}`}>
        {label}
      </span>
    </button>
  );
}
