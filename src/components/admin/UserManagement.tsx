
import React from 'react';
import { Users, Plus, Search, Unlock, Lock, CheckCircle2 } from 'lucide-react';
import { updateUserInFirestore } from '../../lib/firestoreService';

interface UserManagementProps {
  setShowAddUserModal: (show: boolean) => void;
  userSearch: string;
  setUserSearch: (search: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (role: string) => void;
  filteredUsers: any[];
  setShowWalletAdjustModal: (user: any) => void;
  handleToggleBlockUser: (id: string) => void;
  onApproveDriver?: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
  setShowAddUserModal,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  filteredUsers,
  setShowWalletAdjustModal,
  handleToggleBlockUser,
  onApproveDriver
}) => {
  const handleQuickApproveDriver = async (userId: string) => {
    try {
      await updateUserInFirestore(userId, { status: 'approved', role: 'driver' });
      if (onApproveDriver) {
        onApproveDriver(userId);
      }
      alert('✓ Driver account approved and activated in Firestore!');
    } catch (e) {
      console.error(e);
      alert('Failed to approve driver account.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-gray-200">
        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Passenger & Driver Account Control
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase">Search accounts, adjust wallet balances, block or unblock users</p>
        </div>
        <button 
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-black text-yellow-400 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input 
            type="text"
            placeholder="Search user by name or phone..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-yellow-400"
          />
        </div>
        <select
          value={userRoleFilter}
          onChange={e => setUserRoleFilter(e.target.value)}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-black focus:outline-none"
        >
          <option value="all">All Roles</option>
          <option value="passenger">Passengers</option>
          <option value="driver">Drivers</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100">
          {filteredUsers.map((u, index) => (
            <div key={u.id ? `${u.id}-${index}` : `user-${index}`} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-yellow-400 flex items-center justify-center font-black uppercase text-sm shrink-0">
                  {(u.name || 'User').slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-black">{u.name || 'User'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      u.role === 'driver' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role || 'user'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      u.status === 'blocked' ? 'bg-red-100 text-red-700' : u.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {u.status || 'active'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">📞 {u.phone} | Wallet: <strong className="text-black">Rs. {u.balance}</strong></p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {u.status !== 'approved' && (
                  <button
                    onClick={() => handleQuickApproveDriver(u.id)}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider rounded-xl shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Driver
                  </button>
                )}
                <button 
                  onClick={() => setShowWalletAdjustModal(u)}
                  className="px-3 py-1.5 bg-yellow-400 text-black font-black text-[9px] uppercase tracking-wider rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  💳 Adjust Wallet
                </button>
                <button 
                  onClick={() => handleToggleBlockUser(u.id)}
                  className={`px-3 py-1.5 font-black text-[9px] uppercase tracking-wider rounded-xl transition-all ${
                    u.status === 'blocked' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  {u.status === 'blocked' ? <Unlock className="w-3.5 h-3.5 inline mr-1" /> : <Lock className="w-3.5 h-3.5 inline mr-1" />}
                  {u.status === 'blocked' ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
