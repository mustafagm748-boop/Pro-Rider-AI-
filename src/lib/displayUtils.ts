
export const getVehicleTypeDisplay = (vType?: string) => {
  if (!vType) return 'MINI CAR';
  const norm = vType.toLowerCase();
  if (norm === 'mini') return 'MINI CAR';
  if (norm === 'sedan') return 'SEDAN AC';
  if (norm === 'comfortable') return 'COMFORT CAR';
  if (norm === 'premium') return 'PREMIUM LUXURY';
  if (norm === 'bike') return 'BIKE';
  if (norm === 'rickshaw') return 'AUTO RICKSHAW';
  if (norm === 'seven_seater') return '7-SEATER MPV';
  if (norm === 'seven_seater_ocean') return '7-SEATER OCEAN';
  if (norm === 'hiace_15') return '15-SEATER HIACE/CABIN';
  if (norm === 'loading_cargo') return 'LOADING CARGO PICKUP';
  return vType.toUpperCase();
};

export const getServiceTypeDisplay = (sType?: string) => {
  if (!sType) return 'CITY RIDES';
  const norm = sType.toLowerCase();
  if (norm === 'city' || norm === 'ct') return 'CITY RIDES';
  if (norm === 'intercity') return 'INTERCITY';
  if (norm === 'sharing') return 'CARPOOL SHARING';
  if (norm === 'delivery') return 'PARCEL DELIVERY';
  return sType.toUpperCase();
};
