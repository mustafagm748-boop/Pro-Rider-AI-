
export const TAB_INSTRUCTIONS = {
  home: { ur: "ہوم اسکرین کھل گئی ہے۔ آپ یہاں سے سواری بک کر سکتے ہیں۔", en: "Home screen opened. You can book rides from here." },
  carpooling: { ur: "کار پولنگ کھل گیا۔ آپ یہاں اپنی سواری کی تفصیلات درج کر سکتے ہیں اور فعال درخواستیں دیکھ سکتے ہیں۔", en: "Car Pooling Room opened. You can now enter ride details and view active requests." },
  settings: { ur: "سیٹنگز کھل گئی ہیں۔ آپ یہاں اپنی پروفائل اور ترجیحات تبدیل کر سکتے ہیں۔", en: "Settings opened. You can manage your profile and preferences here." },
  chats: { ur: "چیٹ روم کھل گیا ہے۔ آپ یہاں ڈرائیوروں یا ایڈمن سے بات کر سکتے ہیں۔", en: "Chat room opened. You can talk to drivers or admins here." },
  status: { ur: "اسٹیٹس اسکرین کھل گئی ہے۔ آپ اپنی سواریوں کی تفصیلات دیکھ سکتے ہیں۔", en: "Status screen opened. You can view your ride details here." },
  admin: { ur: "ایڈمن پینل کھل گیا ہے۔", en: "Admin panel opened." },
};

export const INITIAL_PENDING_DRIVERS = [
  {
    id: 'drv-pending-101',
    name: 'Muhammad Tariq Khan',
    phone: '0300-5544321',
    email: 'tariq.driver@gmail.com',
    role: 'driver',
    status: 'pending',
    vehicleType: 'sedan',
    vehicleName: 'Toyota Corolla AC (2022)',
    vehicleNumber: 'LEB-8899',
    selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    idCardFrontUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
    licenseFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500',
    vehicleFrontUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500',
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'drv-pending-102',
    name: 'Usman Ali Hashmi',
    phone: '0312-9876543',
    email: 'usman.hashmi@gmail.com',
    role: 'driver',
    status: 'pending',
    vehicleType: 'mini',
    vehicleName: 'Suzuki Alto AC (2021)',
    vehicleNumber: 'RI-4521',
    selfieUrl: 'https://images.unsplash.com/photo-1500648767791-0dcc994a43e?w=300',
    idCardFrontUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
    licenseFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500',
    vehicleFrontUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500',
    createdAt: Date.now() - 3600000 * 5
  }
];

export const INITIAL_CARPOOL_MESSAGES = [];
