
import React from 'react';
import { Wallet, BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface WalletAdminProps {
  walletBalance: number;
  walletTransactions: any[];
  showNotification?: (msg: string) => void;
}

const WalletAdmin: React.FC<WalletAdminProps> = ({ walletBalance, walletTransactions, showNotification }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-black rounded-[24px] flex items-center justify-center text-yellow-400 shadow-lg">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total System Liquidity</p>
            <h3 className="text-3xl font-black text-black tracking-tighter">Rs. {walletBalance.toLocaleString()}</h3>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center">
            <span className="text-[8px] font-black uppercase text-emerald-600">Daily Revenue</span>
            <span className="text-sm font-black text-emerald-700">+Rs. 12,450</span>
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center">
            <span className="text-[8px] font-black uppercase text-blue-600">Active Drivers</span>
            <span className="text-sm font-black text-blue-700">142</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Recent Transactions
            </h4>
            <BarChart3 className="w-4 h-4 text-gray-300" />
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {walletTransactions.length === 0 ? (
              <div className="p-12 text-center opacity-30">
                <BarChart3 className="w-10 h-10 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">No transaction history</p>
              </div>
            ) : (
              walletTransactions.map((tx, index) => (
                <div key={tx.id ? `${tx.id}-${index}` : `tx-${index}`} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.amount >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {tx.amount >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-black uppercase tracking-tight">{tx.method || 'System Adjustment'}</p>
                      <p className="text-[9px] text-gray-400 font-bold">{tx.date} | {tx.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${
                      tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {tx.amount >= 0 ? '+' : ''}Rs. {Math.abs(tx.amount).toLocaleString()}
                    </p>
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-gray-200 rounded-full text-gray-500">
                      {tx.status || 'completed'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-4">
           <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Financial Insights
           </h4>
           <div className="p-5 bg-black rounded-[28px] text-white space-y-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Pending Driver Payouts</p>
                <p className="text-xl font-black text-yellow-400">Rs. 45,200</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Commission Today</p>
                  <p className="text-sm font-black text-white">Rs. 8,400</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">System Bonus Cost</p>
                  <p className="text-sm font-black text-white">Rs. 1,200</p>
                </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default WalletAdmin;
