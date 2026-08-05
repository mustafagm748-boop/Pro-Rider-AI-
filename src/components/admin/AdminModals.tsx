import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Car, ShieldCheck } from 'lucide-react';

interface AdminModalsProps {
  viewingDriver: any;
  setViewingDriver: (driver: any) => void;
  onApprove: (id: string) => void;
  viewingRouteRide: any;
  setViewingRouteRide: (ride: any) => void;
  showAddUserModal: boolean;
  setShowAddUserModal: (show: boolean) => void;
  newUserForm: any;
  setNewUserForm: (form: any) => void;
  handleCreateUser: () => void;
  showWalletAdjustModal: any;
  setShowWalletAdjustModal: (user: any) => void;
  walletAdjustAmount: number;
  setWalletAdjustAmount: (amount: number) => void;
  walletAdjustReason: string;
  setWalletAdjustReason: (reason: string) => void;
  handleAdjustWalletSubmit: () => void;
  showDispatchModal: boolean;
  setShowDispatchModal: (show: boolean) => void;
  newDispatchForm: any;
  setNewDispatchForm: (form: any) => void;
  handleCreateDispatchRide: () => void;
  showBroadcastModal: boolean;
  setShowBroadcastModal: (show: boolean) => void;
  broadcastMsg: string;
  setBroadcastMsg: (msg: string) => void;
  handleBroadcastAlert: () => void;
  showAddAdminModal: boolean;
  setShowAddAdminModal: (show: boolean) => void;
  newAdminForm: any;
  setNewAdminForm: (form: any) => void;
  handleAddAdmin: () => void;
  showAdminGuideModal: boolean;
  setShowAdminGuideModal: (show: boolean) => void;
  language: string;
}

export const AdminModals: React.FC<AdminModalsProps> = ({
  viewingDriver,
  setViewingDriver,
  onApprove,
  viewingRouteRide,
  setViewingRouteRide,
  showAddUserModal,
  setShowAddUserModal,
  newUserForm,
  setNewUserForm,
  handleCreateUser,
  showWalletAdjustModal,
  setShowWalletAdjustModal,
  walletAdjustAmount,
  setWalletAdjustAmount,
  walletAdjustReason,
  setWalletAdjustReason,
  handleAdjustWalletSubmit,
  showDispatchModal,
  setShowDispatchModal,
  newDispatchForm,
  setNewDispatchForm,
  handleCreateDispatchRide,
  showBroadcastModal,
  setShowBroadcastModal,
  broadcastMsg,
  setBroadcastMsg,
  handleBroadcastAlert,
  showAddAdminModal,
  setShowAddAdminModal,
  newAdminForm,
  setNewAdminForm,
  handleAddAdmin,
  showAdminGuideModal,
  setShowAdminGuideModal,
  language,
}) => {
  return (
    <>
      {/* Driver Document Viewer Modal */}
      <AnimatePresence>
        {viewingDriver && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-md space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-black text-sm uppercase text-black">{viewingDriver.name} - Verification Docs</h3>
                <button onClick={() => setViewingDriver(null)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-black text-gray-400 text-[9px] uppercase tracking-wider mb-1">CNIC Card & License</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-2 rounded-2xl border border-gray-200 text-center space-y-1">
                      <p className="text-[9px] font-black text-gray-500 uppercase">CNIC Front</p>
                      {viewingDriver.cnicFront ? (
                        <img src={viewingDriver.cnicFront} alt="CNIC Front" className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                      ) : (
                        <div className="h-20 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center text-[10px] font-black border border-emerald-200">
                          ✓ CNIC Uploaded
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 p-2 rounded-2xl border border-gray-200 text-center space-y-1">
                      <p className="text-[9px] font-black text-gray-500 uppercase">License Front</p>
                      {viewingDriver.licenseFront ? (
                        <img src={viewingDriver.licenseFront} alt="License Front" className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                      ) : (
                        <div className="h-20 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center text-[10px] font-black border border-emerald-200">
                          ✓ License Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-black text-gray-400 text-[9px] uppercase tracking-wider mb-1">Vehicle Photo & Driver Selfie</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-2 rounded-2xl border border-gray-200 text-center space-y-1">
                      <p className="text-[9px] font-black text-gray-500 uppercase">Vehicle Photo</p>
                      {viewingDriver.vehiclePhoto ? (
                        <img src={viewingDriver.vehiclePhoto} alt="Vehicle" className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                      ) : (
                        <div className="h-20 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center text-[10px] font-black border border-emerald-200">
                          ✓ Vehicle Book Uploaded
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 p-2 rounded-2xl border border-gray-200 text-center space-y-1">
                      <p className="text-[9px] font-black text-gray-500 uppercase">Driver Selfie</p>
                      {viewingDriver.selfieUrl ? (
                        <img src={viewingDriver.selfieUrl} alt="Selfie" className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                      ) : (
                        <div className="h-20 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center text-[10px] font-black border border-emerald-200">
                          ✓ Driver Selfie Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={() => setViewingDriver(null)}
                  className="py-3 bg-gray-100 text-gray-700 font-black uppercase text-xs rounded-2xl hover:bg-gray-200"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    onApprove(viewingDriver.id);
                    setViewingDriver(null);
                  }}
                  className="py-3 bg-emerald-600 text-white font-black uppercase text-xs rounded-2xl shadow-lg hover:bg-emerald-700 transition-colors"
                >
                  ✓ Approve Driver Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS Route Tracker Modal */}
      <AnimatePresence>
        {viewingRouteRide && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-neutral-900 text-white rounded-[2.5rem] p-6 w-full max-w-md space-y-4 border border-yellow-400/30">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h3 className="font-black text-xs uppercase text-yellow-400">Live GPS Tracker - {viewingRouteRide.id}</h3>
                <button onClick={() => setViewingRouteRide(null)} className="p-1.5 bg-neutral-800 rounded-full">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-6 bg-black rounded-2xl border border-neutral-800 space-y-3 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-yellow-400 text-black flex items-center justify-center font-black animate-pulse">
                  <Car className="w-6 h-6" />
                </div>
                <p className="text-xs font-black text-white">{viewingRouteRide.pickupLocation} ➔ {viewingRouteRide.dropoffLocation}</p>
                <p className="text-[10px] font-bold text-emerald-400">GPS Status: En Route (Speed 42 km/h)</p>
              </div>

              <button 
                onClick={() => setViewingRouteRide(null)}
                className="w-full py-3 bg-yellow-400 text-black font-black uppercase text-xs rounded-xl"
              >
                Close Tracking
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-black text-xs uppercase text-black">Register New User</h3>
                <button onClick={() => setShowAddUserModal(false)}><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <input 
                  type="text" 
                  placeholder="Full Name"
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                />
                <input 
                  type="text" 
                  placeholder="Phone (0300...)"
                  value={newUserForm.phone}
                  onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                />
                <select 
                  value={newUserForm.role}
                  onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                >
                  <option value="passenger">Passenger</option>
                  <option value="driver">Driver</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Initial Wallet Balance (Rs.)"
                  value={newUserForm.balance}
                  onChange={e => setNewUserForm({ ...newUserForm, balance: Number(e.target.value) })}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                />
              </div>

              <button 
                onClick={handleCreateUser}
                className="w-full py-3 bg-black text-yellow-400 font-black uppercase text-xs rounded-xl"
              >
                Create Account
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjust Wallet Modal */}
      <AnimatePresence>
        {showWalletAdjustModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-black text-xs uppercase text-black">Adjust Wallet: {showWalletAdjustModal.name}</h3>
                <button onClick={() => setShowWalletAdjustModal(null)}><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <p className="text-[10px] text-gray-400 font-black uppercase">Current Balance: Rs. {showWalletAdjustModal.balance}</p>
                <input 
                  type="number" 
                  placeholder="Adjustment Amount (+ or -)"
                  value={walletAdjustAmount}
                  onChange={e => setWalletAdjustAmount(Number(e.target.value))}
                  className="w-full p-3 bg-gray-50 border rounded-xl font-black text-black"
                />
                <input 
                  type="text" 
                  placeholder="Reason / Note"
                  value={walletAdjustReason}
                  onChange={e => setWalletAdjustReason(e.target.value)}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                />
              </div>

              <button 
                onClick={handleAdjustWalletSubmit}
                className="w-full py-3 bg-yellow-400 text-black font-black uppercase text-xs rounded-xl shadow-md"
              >
                Apply Wallet Adjustment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dispatch Manual Ride Modal */}
      <AnimatePresence>
        {showDispatchModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-black text-xs uppercase text-black">Dispatch Manual Trip</h3>
                <button onClick={() => setShowDispatchModal(false)}><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <input 
                  type="text" 
                  placeholder="Pickup Location"
                  value={newDispatchForm.pickup}
                  onChange={e => setNewDispatchForm({ ...newDispatchForm, pickup: e.target.value })}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                />
                <input 
                  type="text" 
                  placeholder="Dropoff Location"
                  value={newDispatchForm.dropoff}
                  onChange={e => setNewDispatchForm({ ...newDispatchForm, dropoff: e.target.value })}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                />
                <input 
                  type="number" 
                  placeholder="Fare (Rs.)"
                  value={newDispatchForm.fare}
                  onChange={e => setNewDispatchForm({ ...newDispatchForm, fare: Number(e.target.value) })}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                />
              </div>

              <button 
                onClick={handleCreateDispatchRide}
                className="w-full py-3 bg-black text-yellow-400 font-black uppercase text-xs rounded-xl"
              >
                Dispatch Ride Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Broadcast Modal */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-black text-xs uppercase text-red-600">🚨 System Broadcast Alert</h3>
                <button onClick={() => setShowBroadcastModal(false)}><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <textarea 
                  rows={3}
                  placeholder="Type emergency alert message to send to all drivers and passengers..."
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-red-200 rounded-xl"
                />
              </div>

              <button 
                onClick={handleBroadcastAlert}
                className="w-full py-3 bg-red-600 text-white font-black uppercase text-xs rounded-xl shadow-md hover:bg-red-700"
              >
                Send Broadcast Alert
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Sub-Admin Modal */}
      <AnimatePresence>
        {showAddAdminModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-black text-xs uppercase text-black">Add Sub-Admin Account</h3>
                <button onClick={() => setShowAddAdminModal(false)}><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <input 
                  type="text" 
                  placeholder="Admin Name"
                  value={newAdminForm.name}
                  onChange={e => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                />
                <input 
                  type="email" 
                  placeholder="Admin Email"
                  value={newAdminForm.email}
                  onChange={e => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                />
                <select 
                  value={newAdminForm.role}
                  onChange={e => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                  className="w-full p-3 bg-gray-50 border rounded-xl"
                >
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Support Agent">Support Agent</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              <button 
                onClick={handleAddAdmin}
                className="w-full py-3 bg-black text-yellow-400 font-black uppercase text-xs rounded-xl"
              >
                Add Admin
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </>
  );
};
