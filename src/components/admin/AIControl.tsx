
import React from 'react';
import { Bot, Sparkles, RefreshCw, Sliders } from 'lucide-react';

interface AIControlProps {
  aiSettings: any;
  setAiSettings: (settings: any) => void;
  showNotification: (msg: string) => void;
  language: any;
}

const AIControl: React.FC<AIControlProps> = ({ aiSettings, setAiSettings, showNotification, language }) => {
  return (
    <div className="space-y-6">
      <div className="bg-black p-6 rounded-[32px] border-2 border-yellow-400/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-yellow-400 rounded-[24px] flex items-center justify-center text-black shadow-lg">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Pro Rider Core AI Engine</h3>
            <p className="text-[10px] text-yellow-400/80 font-bold uppercase">Manage autonomous dispatch, surge logic, and speech processing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-yellow-400/10 rounded-full border border-yellow-400/20">
             <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400 animate-pulse">● Neural Network Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Autonomous Parameters
          </h4>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-black">Auto-Dispatch System</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">AI matches drivers without admin approval</p>
              </div>
              <button 
                onClick={() => setAiSettings({...aiSettings, autoDispatch: !aiSettings.autoDispatch})}
                className={`w-12 h-6 rounded-full relative transition-colors ${aiSettings.autoDispatch ? 'bg-yellow-400' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${aiSettings.autoDispatch ? 'right-0.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-black">Smart Surge Algorithm</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Dynamic pricing based on real-time demand</p>
              </div>
              <button 
                onClick={() => setAiSettings({...aiSettings, smartSurge: !aiSettings.smartSurge})}
                className={`w-12 h-6 rounded-full relative transition-colors ${aiSettings.smartSurge ? 'bg-yellow-400' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${aiSettings.smartSurge ? 'right-0.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase text-black">Voice Speech Sensitivity</p>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setAiSettings({...aiSettings, speechSensitivity: s})}
                    className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border-2 ${
                      aiSettings.speechSensitivity === s ? 'bg-black text-yellow-400 border-black' : 'bg-white text-gray-400 border-gray-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => {
              showNotification("Neural Engine Re-trained with new parameters!");
            }}
            className="w-full py-4 bg-black text-yellow-400 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
          >
            <Sparkles className="w-4 h-4" /> Sync Brain Parameters
          </button>
        </section>

        <section className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm flex flex-col">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 mb-4">AI Guide Terminal</h4>
          <div className="flex-1 overflow-hidden min-h-[350px]">
            <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] bg-neutral-900 rounded-2xl text-center p-6 border-2 border-neutral-800">
              <Bot className="w-12 h-12 text-yellow-400 mb-4" />
              <p className="text-yellow-400 font-bold uppercase tracking-wider text-[11px] mb-2">Native AI Integrated</p>
              <p className="text-gray-400 text-[10px]">The AI Guide feature has been permanently integrated into the core Gemini Chat experience.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AIControl;
