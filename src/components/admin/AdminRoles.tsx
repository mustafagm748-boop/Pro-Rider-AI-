import React from 'react';
import { Shield, Plus } from 'lucide-react';

interface AdminRolesProps {
  adminsList: any[];
  setShowAddAdminModal: (show: boolean) => void;
}

export const AdminRoles: React.FC<AdminRolesProps> = ({
  adminsList,
  setShowAddAdminModal,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            Admin Account Management & Roles
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase">Assign super admin, dispatcher, or support permissions</p>
        </div>
        <button 
          onClick={() => setShowAddAdminModal(true)}
          className="px-4 py-2 bg-black text-yellow-400 font-black text-[10px] uppercase rounded-xl"
        >
          + Add Sub-Admin
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 divide-y divide-gray-100">
        {adminsList.map(adm => (
          <div key={adm.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-black">{adm.name}</p>
              <p className="text-[10px] text-gray-500 font-bold">{adm.email} | Role: <span className="text-yellow-600">{adm.role}</span></p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase rounded-full">
              {adm.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
