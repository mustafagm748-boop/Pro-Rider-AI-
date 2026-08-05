
import React from 'react';
import { DollarSign, Sliders, RefreshCw } from 'lucide-react';

interface PricingControlProps {
  isUrdu: boolean;
  pricingConfig: any;
  setPricingConfig: (config: any) => void;
  vehicleFares: any;
  setVehicleFares: (fares: any) => void;
  onUpdatePricingConfig?: (config: any) => void;
  onUpdateVehicleFares?: (fares: any) => void;
  showNotification: (msg: string) => void;
}

const PricingControl: React.FC<PricingControlProps> = ({
  isUrdu,
  pricingConfig,
  setPricingConfig,
  vehicleFares,
  setVehicleFares,
  onUpdatePricingConfig,
  onUpdateVehicleFares,
  showNotification
}) => {
  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-4 rounded-3xl border border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Global Fare & Pricing Algorithms
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase">Adjust base rates, per km pricing, surge multipliers, and commission</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Pricing Config */}
        <section className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Operational Parameters</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block">Base Fare (PKR)</label>
              <input 
                type="number"
                value={pricingConfig.baseFare}
                onChange={e => setPricingConfig({...pricingConfig, baseFare: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block">Per KM Rate (PKR)</label>
              <input 
                type="number"
                value={pricingConfig.perKmRate}
                onChange={e => setPricingConfig({...pricingConfig, perKmRate: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block">Admin Commission (%)</label>
              <input 
                type="number"
                value={pricingConfig.commissionRate}
                onChange={e => setPricingConfig({...pricingConfig, commissionRate: Number(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block">Surge Multiplier</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={pricingConfig.surgeMultiplier}
                  onChange={e => setPricingConfig({...pricingConfig, surgeMultiplier: Number(e.target.value)})}
                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
                <span className="text-xs font-black text-black w-8">{pricingConfig.surgeMultiplier}x</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              if (onUpdatePricingConfig) onUpdatePricingConfig(pricingConfig);
              showNotification("Pricing Configuration Saved Successfully!");
            }}
            className="w-full py-3 bg-black text-yellow-400 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
          >
            Update Live Pricing
          </button>
        </section>

        {/* Vehicle Specific Fares */}
        <section className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Vehicle Categories</h4>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(vehicleFares).map(([key, fare]: [string, any]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <p className="text-[9px] font-black uppercase text-black">{fare.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[7px] font-black uppercase text-gray-400">Base</label>
                    <input 
                      type="number"
                      value={fare.base}
                      onChange={e => setVehicleFares({
                        ...vehicleFares,
                        [key]: { ...fare, base: Number(e.target.value) }
                      })}
                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[7px] font-black uppercase text-gray-400">Per KM</label>
                    <input 
                      type="number"
                      value={fare.perKm}
                      onChange={e => setVehicleFares({
                        ...vehicleFares,
                        [key]: { ...fare, perKm: Number(e.target.value) }
                      })}
                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-black"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              localStorage.setItem('prorider_vehicle_fares', JSON.stringify(vehicleFares));
              if (onUpdateVehicleFares) onUpdateVehicleFares(vehicleFares);
              showNotification("Vehicle Fares Synchronized!");
            }}
            className="w-full py-3 bg-yellow-400 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Sync Category Rates
          </button>
        </section>
      </div>
    </div>
  );
};

export default PricingControl;
