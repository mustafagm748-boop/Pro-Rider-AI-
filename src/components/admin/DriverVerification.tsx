import React, { useState, useEffect } from 'react';
import { DriverProfile } from '../../types';
import { ShieldCheck, Check, X, Eye, FileText, User, Car, Phone, AlertCircle, ZoomIn } from 'lucide-react';

interface DriverVerificationProps {
  pendingDrivers: DriverProfile[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  isUrdu?: boolean;
}

export const DriverVerification: React.FC<DriverVerificationProps> = ({
  pendingDrivers,
  onApprove,
  onReject,
  isUrdu = false
}) => {
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(pendingDrivers[0] || null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!selectedDriver && pendingDrivers.length > 0) {
      setSelectedDriver(pendingDrivers[0]);
    } else if (selectedDriver && !pendingDrivers.some(d => d.id === selectedDriver.id)) {
      setSelectedDriver(pendingDrivers[0] || null);
    }
  }, [pendingDrivers, selectedDriver]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-black text-white p-6 rounded-[32px] border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              {isUrdu ? 'ڈرائیور کی تصدیق اور دستاویزات کا معائنہ' : 'Driver Application & Verification System'}
            </h3>
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">
              {isUrdu ? 'شناختی کارڈ، لائسنس اور گاڑی کی لائیو تصدیق کریں' : 'Inspect CNIC, Driving License, Vehicle RC & Selfie verification before approval'}
            </p>
          </div>
        </div>
        <div className="px-4 py-2 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-center">
          <span className="text-[9px] font-black uppercase text-indigo-300 block">Pending Approvals</span>
          <span className="text-xl font-black text-yellow-400">{pendingDrivers.length} Applicants</span>
        </div>
      </div>

      {pendingDrivers.length === 0 ? (
        <div className="bg-white p-12 rounded-[32px] border border-gray-200 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto opacity-80" />
          <h4 className="text-base font-black uppercase text-black">
            {isUrdu ? 'تمام ڈرائیورز کی تصدیق مکمل ہو چکی ہے' : 'All Driver Applications Reviewed'}
          </h4>
          <p className="text-xs text-gray-500 font-bold max-w-sm mx-auto">
            {isUrdu ? 'نیا فارم جمع کرائے جانے پر ڈرائیور یہاں ظاہر ہوں گے۔' : 'There are no pending driver verification requests at the moment. All documents are up to date.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver List Column */}
          <div className="bg-white p-5 rounded-[32px] border border-gray-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Applications List</h4>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {pendingDrivers.map((d, idx) => (
                <button
                  key={d.id ? `${d.id}-${idx}` : `drv-${idx}`}
                  onClick={() => setSelectedDriver(d)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    selectedDriver?.id === d.id
                      ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-400'
                      : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center font-bold text-gray-700">
                      {d.selfieUrl ? (
                        <img src={d.selfieUrl} alt={d.name} className="w-full h-full object-cover" />
                      ) : (
                        d.name?.charAt(0) || 'D'
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-black leading-tight">{d.name}</p>
                      <p className="text-[10px] font-bold text-gray-500">{d.phone}</p>
                      <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-md mt-1 inline-block">
                        {d.vehicleType || 'sedan'}
                      </span>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-indigo-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Selected Driver Verification Card */}
          {selectedDriver && (
            <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 overflow-hidden border-2 border-indigo-500 shadow-md flex items-center justify-center">
                    {selectedDriver.selfieUrl ? (
                      <img src={selectedDriver.selfieUrl} alt={selectedDriver.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-black">{selectedDriver.name}</h3>
                    <p className="text-xs text-gray-500 font-bold flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-indigo-500" />
                      {selectedDriver.phone}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Verification Pending
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onApprove(selectedDriver.id);
                      setSelectedDriver(null);
                    }}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Driver</span>
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Uploaded Verification Documents (Click image to inspect detail)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CNIC Document */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-gray-500">1. National Identity Card (CNIC)</span>
                      {(selectedDriver as any).idCardFrontUrl && (
                        <button
                          onClick={() => setViewingImage({ url: (selectedDriver as any).idCardFrontUrl, title: 'National CNIC Card - ' + selectedDriver.name })}
                          className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <ZoomIn className="w-3 h-3" /> Zoom
                        </button>
                      )}
                    </div>
                    <div 
                      onClick={() => (selectedDriver as any).idCardFrontUrl && setViewingImage({ url: (selectedDriver as any).idCardFrontUrl, title: 'National CNIC Card - ' + selectedDriver.name })}
                      className="h-36 bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center border border-gray-300 relative group cursor-pointer"
                    >
                      {(selectedDriver as any).idCardFrontUrl ? (
                        <>
                          <img src={(selectedDriver as any).idCardFrontUrl} alt="CNIC" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                          <span className="text-[9px] font-bold text-gray-500 uppercase">CNIC Document Verified in Database</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* License Document */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-gray-500">2. Driving License</span>
                      {(selectedDriver as any).licenseFrontUrl && (
                        <button
                          onClick={() => setViewingImage({ url: (selectedDriver as any).licenseFrontUrl, title: 'Driving License - ' + selectedDriver.name })}
                          className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <ZoomIn className="w-3 h-3" /> Zoom
                        </button>
                      )}
                    </div>
                    <div 
                      onClick={() => (selectedDriver as any).licenseFrontUrl && setViewingImage({ url: (selectedDriver as any).licenseFrontUrl, title: 'Driving License - ' + selectedDriver.name })}
                      className="h-36 bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center border border-gray-300 relative group cursor-pointer"
                    >
                      {(selectedDriver as any).licenseFrontUrl ? (
                        <>
                          <img src={(selectedDriver as any).licenseFrontUrl} alt="License" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Driving License Valid</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Photo */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-gray-500">3. Vehicle Registration & Photo</span>
                      {(selectedDriver as any).vehicleFrontUrl && (
                        <button
                          onClick={() => setViewingImage({ url: (selectedDriver as any).vehicleFrontUrl, title: 'Vehicle Inspection Photo - ' + selectedDriver.name })}
                          className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <ZoomIn className="w-3 h-3" /> Zoom
                        </button>
                      )}
                    </div>
                    <div 
                      onClick={() => (selectedDriver as any).vehicleFrontUrl && setViewingImage({ url: (selectedDriver as any).vehicleFrontUrl, title: 'Vehicle Inspection Photo - ' + selectedDriver.name })}
                      className="h-40 bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center border border-gray-300 relative group cursor-pointer"
                    >
                      {(selectedDriver as any).vehicleFrontUrl ? (
                        <>
                          <img src={(selectedDriver as any).vehicleFrontUrl} alt="Vehicle" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <Car className="w-10 h-10 text-gray-400 mx-auto mb-1" />
                          <span className="text-[10px] font-bold text-gray-600 uppercase block">Vehicle Class: {selectedDriver.vehicleType || 'sedan'}</span>
                          <span className="text-[9px] font-semibold text-gray-400">Reg No: PK-8890 (Inspection Approved)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedDriver && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-[32px] max-w-md w-full space-y-4">
            <h3 className="text-base font-black uppercase text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Reject Application for {selectedDriver.name}
            </h3>
            <p className="text-xs text-gray-500 font-bold">Please specify the reason for rejection so the driver receives an update:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. CNIC photo is blurry, or Driving License expired..."
              className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-red-500 h-24"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-black text-xs uppercase rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReject(selectedDriver.id, rejectReason || 'Incomplete verification documents');
                  setShowRejectModal(false);
                  setSelectedDriver(null);
                  setRejectReason('');
                }}
                className="flex-1 py-3 bg-red-600 text-white font-black text-xs uppercase rounded-xl shadow-lg"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Image Inspection Zoom Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-3xl flex items-center justify-between pb-3 text-white">
            <h4 className="text-sm font-black uppercase text-yellow-400">{viewingImage.title}</h4>
            <button
              onClick={() => setViewingImage(null)}
              className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full cursor-pointer transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="max-w-3xl max-h-[80vh] w-full bg-black rounded-3xl overflow-hidden border border-gray-700 shadow-2xl flex items-center justify-center">
            <img src={viewingImage.url} alt={viewingImage.title} className="max-w-full max-h-[75vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
