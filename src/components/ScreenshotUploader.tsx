import React, { useState, useEffect } from 'react';
import { Camera, Upload, Trash2, Eye, Download, Check, Image as ImageIcon, Sparkles, X, Smartphone, Monitor } from 'lucide-react';

export interface ScreenshotItem {
  id: string;
  url: string;
  name: string;
  category: 'pwa_mobile' | 'pwa_desktop' | 'payment_proof' | 'app_review' | 'general';
  uploadedAt: string;
  sizeKb?: number;
}

interface ScreenshotUploaderProps {
  title?: string;
  description?: string;
  categoryDefault?: 'pwa_mobile' | 'pwa_desktop' | 'payment_proof' | 'app_review' | 'general';
  onScreenshotsUpdated?: (screenshots: ScreenshotItem[]) => void;
  className?: string;
  isUrdu?: boolean;
}

export const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({
  title = "PWA App Screenshots & Gallery",
  description = "Upload and manage app screenshots for PWA store manifests, ride receipts, or app reviews.",
  categoryDefault = "pwa_mobile",
  onScreenshotsUpdated,
  className = "",
  isUrdu = false
}) => {
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>(() => {
    try {
      const saved = localStorage.getItem('pro_rider_pwa_screenshots');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading screenshots', e);
    }
    return [
      {
        id: 'pwa-ss-1',
        url: '/logo.jpg',
        name: 'PWA Mobile Dashboard Preview.png',
        category: 'pwa_mobile',
        uploadedAt: new Date().toLocaleDateString(),
        sizeKb: 142
      }
    ];
  });

  const [activeCategory, setActiveCategory] = useState<'pwa_mobile' | 'pwa_desktop' | 'payment_proof' | 'app_review' | 'general'>(categoryDefault);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('pro_rider_pwa_screenshots', JSON.stringify(screenshots));
      if (onScreenshotsUpdated) {
        onScreenshotsUpdated(screenshots);
      }
    } catch (e) {
      console.error('Error saving screenshots', e);
    }
  }, [screenshots, onScreenshotsUpdated]);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        if (resultUrl) {
          const newItem: ScreenshotItem = {
            id: 'ss-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            url: resultUrl,
            name: file.name,
            category: activeCategory,
            uploadedAt: new Date().toLocaleDateString(),
            sizeKb: Math.round(file.size / 1024)
          };

          setScreenshots(prev => [newItem, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    });

    setTimeout(() => {
      setIsUploading(false);
    }, 600);
  };

  const handleDelete = (id: string) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
  };

  const filteredScreenshots = screenshots.filter(s => activeCategory === 'general' || s.category === activeCategory);

  return (
    <div className={`bg-gray-900 border border-yellow-500/30 text-white rounded-3xl p-5 shadow-2xl space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-yellow-400 flex items-center gap-2">
            <Camera className="w-5 h-5 text-yellow-400" />
            {isUrdu ? 'اسکرین شاٹ اپ لوڈ اور پی ڈبلیو اے مینیجر' : title}
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
            {isUrdu ? 'PWA انسٹالیشن اور ریکارڈ کے لیے اسکرین شاٹس اپ لوڈ کریں' : description}
          </p>
        </div>
        <span className="px-3 py-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
          {screenshots.length} {screenshots.length === 1 ? 'Screenshot' : 'Screenshots'} Saved
        </span>
      </div>

      {/* Category Selection Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('pwa_mobile')}
          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
            activeCategory === 'pwa_mobile'
              ? 'bg-yellow-400 text-black shadow-md'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          {isUrdu ? 'موبائل اسکرین شاٹ' : 'PWA Mobile (1080x1920)'}
        </button>

        <button
          onClick={() => setActiveCategory('pwa_desktop')}
          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
            activeCategory === 'pwa_desktop'
              ? 'bg-yellow-400 text-black shadow-md'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          {isUrdu ? 'ڈیسک ٹاپ اسکرین شاٹ' : 'PWA Desktop (1920x1080)'}
        </button>

        <button
          onClick={() => setActiveCategory('payment_proof')}
          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
            activeCategory === 'payment_proof'
              ? 'bg-yellow-400 text-black shadow-md'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          {isUrdu ? 'پیمنٹ کی رسید' : 'Payment / Receipt'}
        </button>

        <button
          onClick={() => setActiveCategory('general')}
          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
            activeCategory === 'general'
              ? 'bg-yellow-400 text-black shadow-md'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isUrdu ? 'تمام اسکرین شاٹس' : 'All Screenshots'}
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          dragOver ? 'border-yellow-400 bg-yellow-400/10 scale-[1.01]' : 'border-gray-700 bg-black/40 hover:border-yellow-500/50'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />

        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 animate-pulse">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-yellow-400">
              {isUrdu ? 'اسکرین شاٹ منتخب کریں یا ڈریگ کریں' : 'Click to Upload Screenshot or Drag & Drop'}
            </p>
            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">
              Supports PNG, JPG, WEBP (Target Category: <span className="text-white font-black">{activeCategory.toUpperCase()}</span>)
            </p>
          </div>
          {isUploading && (
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">
              Processing image...
            </p>
          )}
        </div>
      </div>

      {/* Uploaded Screenshots Grid */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
          <span>Uploaded Gallery ({filteredScreenshots.length})</span>
          <span className="text-yellow-400/80">Click thumbnail to view full resolution</span>
        </p>

        {filteredScreenshots.length === 0 ? (
          <div className="p-8 text-center bg-black/30 rounded-2xl border border-gray-800 space-y-2">
            <Camera className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-xs font-black uppercase text-gray-500">
              {isUrdu ? 'اس زمرے میں کوئی اسکرین شاٹ موجود نہیں ہے' : 'No screenshots uploaded for this category yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredScreenshots.map((item) => (
              <div
                key={item.id}
                className="group relative bg-black rounded-2xl border border-gray-800 overflow-hidden hover:border-yellow-400 transition-all shadow-md"
              >
                <div className="aspect-video w-full overflow-hidden relative bg-gray-950 flex items-center justify-center">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewImage(item.url)}
                      className="p-2 bg-yellow-400 text-black rounded-xl hover:scale-110 active:scale-95 transition-all shadow"
                      title="View Full Screenshot"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={item.url}
                      download={item.name}
                      className="p-2 bg-white text-black rounded-xl hover:scale-110 active:scale-95 transition-all shadow"
                      title="Download Screenshot"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-red-600 text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow"
                      title="Delete Screenshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-gray-900 border-t border-gray-800 space-y-1">
                  <p className="text-[10px] font-black text-white truncate">{item.name}</p>
                  <div className="flex items-center justify-between text-[8px] font-bold text-gray-400 uppercase">
                    <span className="text-yellow-400">{item.category.replace('_', ' ')}</span>
                    <span>{item.uploadedAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border-2 border-yellow-400/40 shadow-2xl bg-black flex items-center justify-center">
            <img
              src={previewImage}
              alt="Screenshot Full Preview"
              className="max-w-full max-h-[80vh] object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
