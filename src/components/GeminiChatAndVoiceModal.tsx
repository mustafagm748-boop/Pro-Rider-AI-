import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, Volume2, Send, X, Bot, MapPin, ExternalLink, Zap, Brain, MessageSquare, Compass, Radio, RefreshCw, ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { voiceService } from '../lib/voice';

interface GeminiChatAndVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialMode?: 'chat' | 'voice' | 'guide';
  userRole?: 'passenger' | 'driver' | 'admin';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: { title: string; url: string }[];
  modelType?: 'general' | 'fast' | 'complex';
  timestamp: Date;
}

export function GeminiChatAndVoiceModal({
  isOpen,
  onClose,
  language = 'en',
  initialMode = 'chat',
  userRole = 'passenger'
}: GeminiChatAndVoiceModalProps) {
  const isUrdu = language === 'ur';

  // Mode: 'chat', 'live_voice', or 'guide'
  const [activeTab, setActiveTab] = useState<'chat' | 'live_voice' | 'guide'>(
    initialMode === 'voice' ? 'live_voice' : initialMode === 'guide' ? 'guide' : 'chat'
  );

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    let content = '';
    if (userRole === 'driver') {
      content = isUrdu
        ? 'السلام علیکم کپتان! میں آپ کا پرو رائڈر ڈرائیور اسسٹنٹ ہوں۔ میں آپ کی کمائی، روٹس، ڈیمانڈ ہیٹ میپ، اور والٹ پے آؤٹ میں رہنمائی کر سکتا ہوں۔ آپ کو کیا معلومات چاہیے؟'
        : 'Hello Captain! I am your Pro Rider Driver Partner Assistant. I can help you with demand heatmaps, ride acceptance, earnings (85% share), and JazzCash/EasyPaisa payouts. How can I assist you today?';
    } else if (userRole === 'admin') {
      content = isUrdu
        ? 'السلام علیکم ایڈمن! میں آپ کا کنٹرول روم اسسٹنٹ ہوں۔ میں ڈرائیور ویریفکیشن، زیر التوا سواریوں اور والٹ پے آؤٹ میں آپ کی مدد کر سکتا ہوں۔'
        : 'Greetings Admin! I am your Platform Co-pilot. I can assist you with driver document audits, pending ride approvals, and system analytics.';
    } else {
      content = isUrdu
        ? 'السلام علیکم! میں آپ کا مسافر اسسٹنٹ ہوں۔ میں کرایوں کے تخمینے، فوری بکنگ اور محفوظ سفر میں آپ کی مدد کر سکتا ہوں۔'
        : 'Hello! I am your Passenger Assistant. I can assist with fare estimates, instant bookings, and safety in Islamabad & Rawalpindi.';
    }

    setMessages([
      {
        id: 'welcome-1',
        role: 'model',
        content,
        modelType: 'general',
        timestamp: new Date()
      }
    ]);
  }, [isOpen, userRole, language]);
  const [inputMessage, setInputMessage] = useState('');
  const [modelType, setModelType] = useState<'general' | 'fast' | 'complex'>('complex');
  const [useThinking, setUseThinking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Voice API State
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingAudioRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      disconnectLiveVoice();
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnectLiveVoice();
    };
  }, []);

  // Handle Chat Form Submit
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          modelType,
          useThinking: modelType === 'complex' ? useThinking : false,
          userRole
        })
      });

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      const data = await response.json();

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply || (isUrdu ? 'تھوڑی دیر میں دوبارہ کوشش کریں۔' : 'No response generated.'),
        sources: data.sources || [],
        modelType,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: isUrdu
            ? 'کنکشن میں عارضی مسئلہ ہے۔ برائے مہربانی اپنا انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔'
            : 'Temporary connection issue. Please check your network and try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action Prompts
  const handleQuickPrompt = (promptText: string) => {
    setInputMessage(promptText);
  };

  // --- Gemini Live API (gemini-3.1-flash-live-preview) WebSocket Logic ---
  const connectLiveVoice = async () => {
    try {
      voiceService.stop();
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
      setVoiceTranscript(prev => [...prev, isUrdu ? 'لایو وائس کنکشن قائم کیا جا رہا ہے...' : 'Connecting to Gemini 3.1 Live API...']);

      // Setup Web Audio Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx({ sampleRate: 16000 });

      // Request Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      mediaStreamRef.current = stream;

      // Establish WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?role=${userRole}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsListening(true);
        setVoiceTranscript(prev => [...prev, isUrdu ? '✅ کنکشن قائم ہو گیا! اب آپ بات کر سکتے ہیں۔' : '✅ Live Voice Connected! Start speaking now.']);
        startAudioProcessing(stream, ws);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.interrupted) {
            audioQueueRef.current = [];
            setIsSpeaking(false);
          }

          if (data.text) {
            setVoiceTranscript(prev => [...prev, `AI: ${data.text}`]);
          }

          if (data.audio) {
            setIsSpeaking(true);
            playAudioChunk(data.audio);
          }
        } catch (e) {
          console.error("WS Message decode error:", e);
        }
      };

      ws.onerror = (err) => {
        console.warn("Live Voice WebSocket connection notice:", err);
        setVoiceTranscript(prev => [...prev, isUrdu ? '⚠️ کنکشن میں تاخیر یا مسئلہ ہے۔ دوبارہ کوشش کریں۔' : '⚠️ Temporary connection issue. Please retry.']);
        disconnectLiveVoice();
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
      };

    } catch (err: any) {
      console.warn("Mic/Live Voice Access notice:", err);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || String(err).toLowerCase().includes('denied') || String(err).toLowerCase().includes('permission');
      const micErrMsg = isDenied
        ? (isUrdu 
            ? '⚠️ مائیکروفون کی اجازت نہیں ملی۔ برائے مہربانی براؤزر سیٹنگز میں مائیکروفون آن کریں یا ٹیکسٹ چیٹ استعمال کریں۔' 
            : '⚠️ Microphone permission denied. Please allow microphone access in your browser settings or use text chat.')
        : (isUrdu 
            ? '⚠️ مائیکروفون یا لائیو وائس دستیاب نہیں ہے۔' 
            : '⚠️ Microphone or Live Voice unavailable.');
      setVoiceTranscript(prev => [...prev, micErrMsg]);
      disconnectLiveVoice();
    }
  };

  const startAudioProcessing = (stream: MediaStream, ws: WebSocket) => {
    if (!audioCtxRef.current) return;
    const source = audioCtxRef.current.createMediaStreamSource(stream);
    const processor = audioCtxRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Convert Float32Array to 16-bit PCM Int16Array
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Convert Int16Array to Base64
      let binary = '';
      const bytes = new Uint8Array(pcm16.buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Pcm = btoa(binary);

      ws.send(JSON.stringify({ audio: base64Pcm }));
    };

    source.connect(processor);
    processor.connect(audioCtxRef.current.destination);
  };

  const playAudioChunk = (base64Audio: string) => {
    try {
      const binaryStr = atob(base64Audio);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const int16Data = new Int16Array(bytes.buffer);

      if (!audioCtxRef.current) return;
      const audioCtx = audioCtxRef.current;
      const buffer = audioCtx.createBuffer(1, int16Data.length, 24000);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < int16Data.length; i++) {
        channelData[i] = int16Data[i] / 32768.0;
      }

      audioQueueRef.current.push(buffer);
      if (!isPlayingAudioRef.current) {
        processAudioQueue();
      }
    } catch (e) {
      console.error("Audio playback chunk error:", e);
    }
  };

  const processAudioQueue = () => {
    if (audioQueueRef.current.length === 0 || !audioCtxRef.current) {
      isPlayingAudioRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingAudioRef.current = true;
    setIsSpeaking(true);
    const buffer = audioQueueRef.current.shift()!;
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);
    source.onended = () => {
      processAudioQueue();
    };
    source.start();
  };

  const disconnectLiveVoice = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-2xl bg-neutral-950 text-white rounded-3xl border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${isUrdu ? 'rtl font-urdu' : ''}`}
        >
          {/* Header Bar */}
          <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black flex items-center justify-center shadow-lg font-black shrink-0">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-tight flex items-center gap-2">
                  <span>{isUrdu ? 'پرو رائڈر جیمنائ اے آئی اسسٹنٹ' : 'Pro Rider Gemini AI Concierge'}</span>
                  <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded text-[9px] font-black uppercase">
                    3.1 Pro High Thinking
                  </span>
                </h3>
                <p className="text-[10px] text-gray-400">
                  {isUrdu ? 'گوگل میپس نیویگیشن، لائو وائس چیٹ اور راستوں کی AI رہنمائی' : 'Maps Grounding, Live Voice API, and Intelligent Route Optimization'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Tabs (Chatbot vs Live Voice vs Interactive Guide) */}
          <div className="flex bg-black p-2 border-b border-neutral-800 gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                setActiveTab('chat');
                disconnectLiveVoice();
              }}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${activeTab === 'chat' ? 'bg-yellow-400 text-black shadow-md' : 'text-gray-400 hover:text-white bg-neutral-900'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'اے آئی چیٹ' : 'AI Chat'}</span>
            </button>
            <button
              onClick={() => setActiveTab('live_voice')}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${activeTab === 'live_voice' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white bg-neutral-900'}`}
            >
              <Radio className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <span>🎙️ {isUrdu ? 'لائیو وائس ٹاک' : 'Live Voice'}</span>
            </button>

          </div>

          {/* TAB 1: Gemini Chatbot */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-[380px] max-h-[520px] overflow-hidden">
              {/* Model & Thinking Mode Selector */}
              <div className="px-4 py-2 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 mr-1">Model:</span>
                  <button
                    onClick={() => setModelType('general')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${modelType === 'general' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}
                  >
                    <Compass className="w-3 h-3" />
                    <span>General (Maps)</span>
                  </button>
                  <button
                    onClick={() => setModelType('fast')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${modelType === 'fast' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Fast Lite</span>
                  </button>
                  <button
                    onClick={() => setModelType('complex')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${modelType === 'complex' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}
                  >
                    <Brain className="w-3 h-3" />
                    <span>Complex Pro</span>
                  </button>
                </div>

                {modelType === 'complex' && (
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-yellow-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useThinking}
                      onChange={(e) => setUseThinking(e.target.checked)}
                      className="accent-yellow-400 rounded"
                    />
                    <span>High Thinking Mode</span>
                  </label>
                )}
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 border text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-yellow-400 text-black border-yellow-500 font-bold ml-8'
                          : 'bg-neutral-900 text-gray-200 border-neutral-800 mr-8 shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-1 opacity-75 text-[9px] font-black uppercase">
                        <span>{m.role === 'user' ? (isUrdu ? 'آپ' : 'You') : (isUrdu ? 'پرو رائڈر اے آئی' : 'Pro Rider AI')}</span>
                        <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <p className="whitespace-pre-wrap">{m.content}</p>

                      {/* Google Maps Grounding Sources */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="pt-2 border-t border-neutral-800 space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {isUrdu ? 'گوگل میپس کی تصدیق شدہ معلومات' : 'Google Maps Grounded Info'}:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {m.sources.map((src, i) => (
                              <a
                                key={i}
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded text-[9px] font-bold border border-neutral-700"
                              >
                                <span>{src.title || 'Location details'}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-yellow-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-neutral-900 border border-neutral-800 text-yellow-400 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>{isUrdu ? 'اے آئی جیمنائ جواب تیار کر رہا ہے...' : 'Gemini AI is analyzing and generating response...'}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-4 py-2 bg-neutral-900/40 border-t border-neutral-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider shrink-0">Quick:</span>
                {userRole === 'driver' ? (
                  <>
                    <button
                      onClick={() => handleQuickPrompt(isUrdu ? 'اسلام آباد بلیو ایریا میں ڈیمانڈ ہیٹ میپ اور سرج کی صورتحال کیا ہے؟' : 'What is the current demand heatmap and surge status in Blue Area Islamabad?')}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 hover:border-yellow-400 text-gray-300 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                    >
                      🔥 Demand Heatmap
                    </button>
                    <button
                      onClick={() => handleQuickPrompt(isUrdu ? 'ڈرائیور کا والٹ پے آؤٹ JazzCash یا EasyPaisa میں کیسے منتقل ہوتا ہے؟' : 'How do I withdraw driver wallet earnings to JazzCash or EasyPaisa?')}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 hover:border-yellow-400 text-gray-300 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                    >
                      💳 JazzCash Payout
                    </button>
                    <button
                      onClick={() => handleQuickPrompt(isUrdu ? 'پرو رائڈر پر ڈرائیور کی کمائی اور 15 فیصد فیس کا حساب سمجھائیں' : 'Explain driver 85% earnings share and 15% platform fee')}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 hover:border-yellow-400 text-gray-300 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                    >
                      💰 Earnings Share
                    </button>
                  </>
                ) : userRole === 'admin' ? (
                  <>
                    <button
                      onClick={() => handleQuickPrompt(isUrdu ? 'زیر التوا ڈرائیورز کی شناختی دستاویزات اور لائسنس چیک کا طریقہ' : 'How to audit pending driver CNIC and license documents?')}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 hover:border-yellow-400 text-gray-300 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                    >
                      📑 Driver Approvals
                    </button>
                    <button
                      onClick={() => handleQuickPrompt(isUrdu ? 'سسٹم کے بنیادی کرائے اور کلومیٹر ریٹس تبدیل کرنے کا طریقہ' : 'How to configure base fares and per-km pricing multipliers?')}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 hover:border-yellow-400 text-gray-300 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                    >
                      ⚙️ Fare Configuration
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleQuickPrompt(isUrdu ? 'ایف 8 سے صدر راولپنڈی کا کرایہ اور وقت بتائیں' : 'Estimate fare and duration from Centaurus F-8 to Saddar Rawalpindi')}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 hover:border-yellow-400 text-gray-300 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                    >
                      📍 F-8 to Saddar Fare
                    </button>
                    <button
                      onClick={() => handleQuickPrompt(isUrdu ? 'اسلام آباد بلیو ایریا میں رش اور سرج ملٹی پلائر کیا ہے؟' : 'What is the current surge multiplier in Blue Area Islamabad?')}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 hover:border-yellow-400 text-gray-300 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                    >
                      🔥 Blue Area Surge
                    </button>
                    <button
                      onClick={() => handleQuickPrompt(isUrdu ? 'کارپولنگ (Carpooling) میں سیٹ بک کرنے کا طریقہ بتائیں' : 'How does seat carpooling booking work in Twin Cities?')}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 hover:border-yellow-400 text-gray-300 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                    >
                      🚗 Carpooling Help
                    </button>
                  </>
                )}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isUrdu ? 'یہاں اپنا سوال ٹائپ کریں (مثال: اسلام آباد ایئرپورٹ کے ریٹس)...' : 'Type your question or destination (e.g. Islamabad Airport fare)...'}
                  className="flex-1 bg-black border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-yellow-400"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black rounded-xl transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Live Voice API (gemini-3.1-flash-live-preview) */}
          {activeTab === 'live_voice' && (
            <div className="p-6 flex flex-col items-center justify-center space-y-6 min-h-[400px]">
              {/* Animated Live Voice Equalizer Node */}
              <div className="relative flex items-center justify-center my-4">
                {isConnected && (
                  <div className={`absolute w-44 h-44 rounded-full border-2 ${isSpeaking ? 'border-yellow-400 animate-ping' : 'border-red-500/40 animate-pulse'}`} />
                )}
                
                <button
                  onClick={isConnected ? disconnectLiveVoice : connectLiveVoice}
                  className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-all transform active:scale-95 ${
                    isConnected
                      ? isSpeaking
                        ? 'bg-yellow-400 text-black border-4 border-white shadow-yellow-400/40'
                        : 'bg-red-600 text-white border-4 border-red-400 shadow-red-600/40'
                      : 'bg-neutral-800 text-gray-400 hover:text-white border-2 border-neutral-700'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Mic className={`w-8 h-8 ${isSpeaking ? 'animate-bounce' : ''}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {isSpeaking ? 'Speaking' : 'Listening'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-8 h-8 text-yellow-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">
                        Start Live
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Banner */}
              <div className="text-center space-y-1">
                <h4 className="text-base font-black text-white uppercase tracking-tight">
                  {isConnected
                    ? isSpeaking
                      ? (isUrdu ? 'اے آئی جواب دے رہا ہے...' : 'Gemini AI Speaking...')
                      : (isUrdu ? 'آپ کی آواز سنی جا رہی ہے...' : 'Listening to your voice...')
                    : (isUrdu ? 'لائیو وائس کال شروع کرنے کے لیے بٹن دبائیں' : 'Tap button to start real-time Gemini voice conversation')}
                </h4>
                <p className="text-xs text-gray-400">
                  {isUrdu ? 'ماڈل gemini-3.1-flash-live-preview استعمال ہو رہا ہے' : 'Powered by gemini-3.1-flash-live-preview WebSocket Live API'}
                </p>
              </div>

              {/* Real-time Voice Transcript Box */}
              <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-2 text-xs custom-scrollbar">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  <span>{isUrdu ? 'لائیو وائس لاگ' : 'Live Transcript Stream'}</span>
                  <span className="text-yellow-400">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
                {voiceTranscript.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-2">
                    {isUrdu ? 'بات چیت کا لاگ یہاں ظاہر ہوگا...' : 'Voice interaction transcript will appear here...'}
                  </p>
                ) : (
                  voiceTranscript.map((t, idx) => (
                    <p key={idx} className="text-gray-300 leading-relaxed font-mono text-[11px]">
                      {t}
                    </p>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              {isConnected && (
                <button
                  onClick={disconnectLiveVoice}
                  className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-red-400 font-black rounded-xl text-xs uppercase tracking-wider border border-neutral-700 flex items-center gap-2"
                >
                  <MicOff className="w-4 h-4" />
                  <span>{isUrdu ? 'وائس کال ختم کریں' : 'Disconnect Voice Session'}</span>
                </button>
              )}
            </div>
          )}


        </motion.div>
      </div>
    </AnimatePresence>
  );
}
