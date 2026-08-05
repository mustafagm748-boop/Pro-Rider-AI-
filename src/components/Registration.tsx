import React, { useState } from 'react';
import { UserRole, Language } from '../types';
import { Upload, User, Phone, Camera, ArrowRight, ShieldCheck, Mail, Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../lib/i18n';
import { googleSignIn } from '../lib/firebase';
import { safeLocalStorage } from '../lib/storageUtils';
import { voiceService } from '../lib/voice';

interface Props {
  onRegister: (data: any) => void;
  language: Language;
  onAdminPrompt?: () => void;
}

interface DocUploadProps {
  label: string;
  name: string;
  value: string;
  onFileChange: (name: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DocUpload: React.FC<DocUploadProps> = ({ label, name, value, onFileChange }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">{label}</label>
    <div className="relative h-24 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center bg-gray-50 hover:border-yellow-400 transition-all overflow-hidden">
      <input type="file" onChange={(e) => onFileChange(name, e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
      {value ? (
        <img src={value || null} className="w-full h-full object-cover" />
      ) : (
        <Upload className="w-4 h-4 text-gray-300" />
      )}
    </div>
  </div>
);

export default function Registration({ onRegister, language, onAdminPrompt }: Props) {
  const t = translations[language];
  const [role, setRole] = useState<UserRole>('passenger');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'google' | 'email'>('otp');
  const [step, setStep] = useState(1);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [logoClickCount, setLogoClickCount] = useState(0);

  // OTP state (555777 default as requested)
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberedUser, setRememberedUser] = useState<any>(() => {
    const saved = safeLocalStorage.getItem('pro_rider_remembered_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Common user details
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    country: 'Pakistan',
    
    // Document URLs
    idCardFrontUrl: '',
    idCardBackUrl: '',
    licenseFrontUrl: '',
    licenseBackUrl: '',
    vehicleFrontUrl: '',
    vehicleBackUrl: '',
    vehicleBookFrontUrl: '',
    vehicleBookBackUrl: '',
    selfieUrl: '',
    
    serviceType: 'city',
    vehicleType: 'mini',
    vehicle: '',
    vehicleNumber: ''
  });

  const ADMIN_NUMBERS = ['03125007782', '03145654722'];

  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        const name = result.user.displayName || (role === 'driver' ? 'Verified Driver' : 'Verified Passenger');
        const userEmail = result.user.email || '';
        const selfieUrl = result.user.photoURL || '';
        const userPhone = phone || result.user.phoneNumber || '';
        
        const isAdmin = ADMIN_NUMBERS.includes(userPhone);

        onRegister({
          name,
          phone: userPhone,
          email: userEmail,
          selfieUrl,
          country: 'Pakistan',
          role: isAdmin ? 'admin' : role,
          status: isAdmin ? 'approved' : (role === 'driver' ? 'pending' : 'approved'),
          isVerified: !!selfieUrl,
          language,
          theme: 'light',
          urduVoiceMode: 'formal',
          createdAt: Date.now(),
          googleUid: result.user.uid
        });
        voiceService.speak("Logged in successfully!");
      }
    } catch (err) {
      console.error("Google Sign-in failed:", err);
      voiceService.speak("Google sign-in failed. Please try again.");
    }
  };

  const handleSendOtp = () => {
    if (!phone || phone.length < 7) {
      alert(language === 'ur' ? "برائے مہربانی درست فون نمبر درج کریں۔" : "Please enter a valid phone number.");
      return;
    }
    setOtpSent(true);
    voiceService.speak(language === 'ur' ? "او ٹی پی کوڈ بھیج دیا گیا ہے۔" : "OTP code sent successfully.");
  };

  const handleOtpLogin = () => {
    if (!phone || phone.length < 7) {
      alert(language === 'ur' ? "برائے مہربانی درست فون نمبر درج کریں۔" : "Please enter a valid phone number.");
      return;
    }
    if (!otpCode || otpCode.length !== 6) {
      alert(language === 'ur' ? "برائے مہربانی 6 ہندسوں کا OTP درج کریں۔" : "Please enter 6-digit OTP code.");
      return;
    }

    if (otpCode !== '555777') {
      alert(language === 'ur' ? "غلط او ٹی پی کوڈ۔" : "Incorrect OTP code.");
      return;
    }

    const isAdmin = ADMIN_NUMBERS.includes(phone);
    const userName = formData.name || (isAdmin ? 'Pro Admin' : (role === 'driver' ? 'Pro Rider Driver' : 'Pro Rider Passenger'));

    if (isAdmin) {
      onRegister({
        name: userName,
        phone,
        email: formData.email,
        password,
        role: 'admin',
        status: 'approved',
        isVerified: true,
        language,
        theme: 'light',
        createdAt: Date.now(),
      });
      voiceService.speak("Admin login successful!");
      return;
    }

    if (role === 'passenger') {
      onRegister({
        name: userName,
        phone,
        email: formData.email,
        password, 
        country: 'Pakistan',
        role: 'passenger',
        status: 'approved',
        isVerified: !!formData.selfieUrl,
        language,
        theme: 'light',
        urduVoiceMode: 'formal',
        createdAt: Date.now(),
      });
      safeLocalStorage.setItem('pro_rider_remembered_user', JSON.stringify({
        name: userName,
        phone,
        email: formData.email,
        role: 'passenger',
        password
      }));
      voiceService.speak(language === 'ur' ? "مسافر لاگ ان کامیاب!" : "Passenger login successful!");
    } else {
      setStep(2);
    }
  };

  const handleEmailLogin = () => {
    if (!email || !email.includes('@')) {
      alert(language === 'ur' ? "برائے مہربانی درست ای میل درج کریں۔" : "Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 4) {
      alert(language === 'ur' ? "برائے مہربانی پاسورڈ درج کریں۔" : "Please enter a valid password.");
      return;
    }

    const isAdmin = ADMIN_NUMBERS.includes(phone);
    const userName = formData.name || (isAdmin ? 'Pro Admin' : email.split('@')[0]);

    if (isAdmin) {
      onRegister({
        name: userName,
        phone,
        email,
        password,
        role: 'admin',
        status: 'approved',
        isVerified: true,
        language,
        theme: 'light',
        createdAt: Date.now(),
      });
      voiceService.speak("Admin login successful!");
      return;
    }

    if (role === 'passenger') {
      onRegister({
        name: userName,
        phone: phone || '',
        email,
        password, 
        country: 'Pakistan',
        role: 'passenger',
        status: 'approved',
        isVerified: !!formData.selfieUrl,
        language,
        theme: 'light',
        urduVoiceMode: 'formal',
        createdAt: Date.now(),
      });
      safeLocalStorage.setItem('pro_rider_remembered_user', JSON.stringify({
        name: userName,
        phone: phone || '',
        email,
        role: 'passenger',
        password
      }));
      voiceService.speak(language === 'ur' ? "ای میل سے لاگ ان کامیاب!" : "Email login successful!");
    } else {
      setStep(2);
    }
  };

  const handleFileChange = (name: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [name]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteDriverRegistration = () => {
    const finalName = formData.name || (googleUser?.displayName) || (role === 'driver' ? 'New Driver' : 'New Passenger');
    const finalPhone = phone || formData.phone;
    if (!finalPhone) {
      alert(language === 'ur' ? "برائے مہربانی فون نمبر درج کریں۔" : "Please provide a phone number.");
      return;
    }

    // Validation for documents
    if (!formData.selfieUrl || !formData.idCardFrontUrl || !formData.licenseFrontUrl) {
      alert(language === 'ur' ? "برائے مہربانی تمام ضروری دستاویزات اور سیلفی اپ لوڈ کریں۔" : "Please upload all required documents and your selfie.");
      return;
    }

    const driverData = { 
      ...formData, 
      name: finalName,
      phone: finalPhone,
      email: email || formData.email,
      password, 
      role: 'driver', 
      status: 'pending', 
      isVerified: true,
      language, 
      theme: 'light', 
      urduVoiceMode: 'formal',
      createdAt: Date.now(), 
      googleUid: googleUser?.uid || 'gen-' + Date.now() 
    };
    onRegister(driverData);
    
    safeLocalStorage.setItem('pro_rider_remembered_user', JSON.stringify({
      name: finalName,
      phone: finalPhone,
      email: driverData.email,
      role: 'driver',
      password
    }));
    
    const msg = language === 'ur' 
      ? "آپ کی دستاویزات جمع ہو گئی ہیں۔ اکاؤنٹ کی منظوری میں 24 گھنٹے لگ سکتے ہیں۔" 
      : "Your documents have been submitted. Account approval may take up to 24 hours.";
    voiceService.speak(msg);
    alert(msg);
  };

  const handleLogoClick = () => {
    const next = logoClickCount + 1;
    if (next >= 5) {
      setLogoClickCount(0);
      if (onAdminPrompt) onAdminPrompt();
    } else {
      setLogoClickCount(next);
    }
  };

  return (
    <div className={`max-w-md mx-auto h-full bg-white flex flex-col ${language === 'ur' ? 'font-urdu rtl' : ''}`}>
      {/* Header */}
      <div className="bg-black p-6 pt-10 pb-6 flex items-center justify-between shadow-lg border-b-2 border-yellow-500/20 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-tighter">Pro Rider</h2>
          <p className="text-yellow-200 text-[10px] font-bold uppercase tracking-[0.2em]">Official Mobility App</p>
        </div>
        <button 
          onClick={handleLogoClick}
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400 shadow-xl flex items-center justify-center bg-black active:scale-90 transition-transform"
          title="Pro Rider App"
        >
          <img 
            src="/logo.jpg" 
            alt="Pro Rider Logo" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo.png';
            }}
          />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
        {rememberedUser && step === 1 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-50 p-6 rounded-[32px] border-2 border-yellow-400/20 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center text-yellow-400 font-bold text-xl shadow-lg border-2 border-yellow-400/20">
                {rememberedUser.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Welcome Back</p>
                <h3 className="text-xl font-bold text-black tracking-tight">{rememberedUser.name}</h3>
                <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-tight">{rememberedUser.role} Account</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Enter Password to Login</p>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-yellow-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all text-sm font-bold text-black"
                  placeholder="Your Password"
                />
              </div>
              <button
                onClick={() => {
                  if (password === rememberedUser.password) {
                    onRegister({ ...rememberedUser, status: 'approved' });
                    voiceService.speak("Welcome back!");
                  } else {
                    alert(language === 'ur' ? "غلط پاسورڈ" : "Incorrect password");
                  }
                }}
                className="w-full py-4 bg-black text-yellow-400 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Unlock Account</span>
              </button>
              <button 
                onClick={() => {
                   setRememberedUser(null);
                   safeLocalStorage.removeItem('pro_rider_remembered_user');
                }}
                className="w-full py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-all"
              >
                Not you? Use another account
              </button>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Top Two Options Only: Login Passenger vs Login Driver */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Select Login Role</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('passenger');
                    }}
                    className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      role === 'passenger' ? 'border-yellow-400 bg-black text-yellow-400 shadow-xl scale-[1.02]' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase tracking-wider">Login Passenger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('driver');
                    }}
                    className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      role === 'driver' ? 'border-yellow-400 bg-black text-yellow-400 shadow-xl scale-[1.02]' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <ShieldCheck className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase tracking-wider">Login Driver</span>
                  </button>
                </div>
              </div>

              {/* Login Method Tabs: OTP, Google, Email */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Login Method</p>
                <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('otp')}
                    className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                      loginMethod === 'otp' ? 'bg-black text-yellow-400 shadow-md' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    📱 Phone OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('google')}
                    className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                      loginMethod === 'google' ? 'bg-black text-yellow-400 shadow-md' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    🌐 Google
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                      loginMethod === 'email' ? 'bg-black text-yellow-400 shadow-md' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    ✉️ Email
                  </button>
                </div>
              </div>

              {/* Form Content Based on Selected Login Method */}
              <div className="space-y-4 pt-1">
                {/* Name Field (Optional/Required) */}
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-yellow-600" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all text-xs font-bold text-black"
                    placeholder="Full Name (e.g., Ali Ahmed)"
                  />
                </div>

                {/* OTP LOGIN FORM */}
                {loginMethod === 'otp' && (
                  <div className="space-y-3">
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-yellow-600" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-11 pr-24 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all text-xs font-bold text-black"
                        placeholder="Phone Number (e.g. 03125007782)"
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-yellow-400 rounded-xl text-[9px] font-bold uppercase tracking-wider hover:bg-neutral-800"
                      >
                        {otpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                        <span>Set Access Password (Required for later)</span>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-yellow-600" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all text-xs font-bold text-black"
                          placeholder="Create access password..."
                        />
                      </div>
                    </div>

                    {/* Minimized 6-digit OTP Input */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                        <span>Enter 6-Digit OTP</span>
                        <span className="text-yellow-600/0 font-bold">Verification Secure</span>
                      </div>
                      <div className="relative group">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-yellow-600" />
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all text-xs font-bold tracking-[0.3em] text-black"
                          placeholder="******"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOtpLogin}
                      className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{role === 'passenger' ? 'Login Passenger with OTP' : 'Continue Driver Verification'}</span>
                    </button>
                  </div>
                )}

                {/* GOOGLE LOGIN FORM */}
                {loginMethod === 'google' && (
                  <div className="space-y-4 pt-2">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full py-4 border-2 border-gray-200 bg-white hover:border-yellow-400 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
                      <span className="text-xs font-bold uppercase tracking-wider text-black">
                        Continue with Google ({role === 'passenger' ? 'Passenger' : 'Driver'})
                      </span>
                    </button>
                    <p className="text-[9px] text-gray-400 font-bold text-center uppercase tracking-wider">
                      Instant secure OAuth login via Google Account
                    </p>
                  </div>
                )}

                {/* EMAIL LOGIN FORM */}
                {loginMethod === 'email' && (
                  <div className="space-y-3">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-yellow-600" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all text-xs font-bold text-black"
                        placeholder="Email Address"
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-yellow-600" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all text-xs font-bold text-black"
                        placeholder="Password"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleEmailLogin}
                      className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{role === 'passenger' ? 'Login Passenger with Email' : 'Continue Driver Verification'}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* STEP 2: DRIVER DOCUMENT VERIFICATION STEP */
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="text-xs font-bold uppercase text-gray-500 hover:text-black flex items-center gap-1"
                >
                  ← Back to Login
                </button>
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">Driver Document Audit</h3>
              </div>

              {/* Driver Selfie */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center">
                  Driver Portrait Photo (Required)
                </label>
                <div className="relative w-28 h-28 mx-auto border-4 border-dashed border-gray-200 rounded-full flex items-center justify-center hover:border-yellow-400 transition-all overflow-hidden bg-gray-50">
                  <input type="file" onChange={(e) => handleFileChange('selfieUrl', e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  {formData.selfieUrl ? (
                    <img src={formData.selfieUrl || null} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-300" />
                  )}
                </div>
              </div>

              {/* Document Upload Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <DocUpload label="CNIC ID Card (Front)" name="idCardFrontUrl" value={formData.idCardFrontUrl} onFileChange={handleFileChange} />
                  <DocUpload label="CNIC ID Card (Back)" name="idCardBackUrl" value={formData.idCardBackUrl} onFileChange={handleFileChange} />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <DocUpload label="License (Front)" name="licenseFrontUrl" value={formData.licenseFrontUrl} onFileChange={handleFileChange} />
                  <DocUpload label="License (Back)" name="licenseBackUrl" value={formData.licenseBackUrl} onFileChange={handleFileChange} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DocUpload label="Vehicle (Front)" name="vehicleFrontUrl" value={formData.vehicleFrontUrl} onFileChange={handleFileChange} />
                  <DocUpload label="Vehicle (Back)" name="vehicleBackUrl" value={formData.vehicleBackUrl} onFileChange={handleFileChange} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DocUpload label="Vehicle Book (Front)" name="vehicleBookFrontUrl" value={formData.vehicleBookFrontUrl} onFileChange={handleFileChange} />
                  <DocUpload label="Vehicle Book (Back)" name="vehicleBookBackUrl" value={formData.vehicleBookBackUrl} onFileChange={handleFileChange} />
                </div>
              </div>

              {/* Vehicle Name & Plate Number */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      {language === 'ur' ? 'گاڑی / سواری کا نام' : 'Vehicle Model / Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'ur' ? 'مثلاً: Toyota Corolla 2022' : 'e.g. Toyota Corolla 2022'}
                      value={formData.vehicle || ''}
                      onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:border-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      {language === 'ur' ? 'گاڑی کا نمبر پلیٹ' : 'Vehicle Plate Number'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'ur' ? 'مثلاً: ICT-LEB-2024' : 'e.g. ICT-LEB-2024'}
                      value={formData.vehicleNumber || ''}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase focus:border-black outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Service & Vehicle Type */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Vehicle Type</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 custom-scrollbar">
                  {[
                    { id: 'bike', label: 'Bike' },
                    { id: 'rickshaw', label: 'Rickshaw' },
                    { id: 'mini', label: 'Mini Car' },
                    { id: 'sedan', label: 'Sedan AC' },
                    { id: 'comfortable', label: 'Comfort' },
                    { id: 'seven_seater', label: '7-Seater MPV' },
                    { id: 'hiace_15', label: '15-Seater HiAce' },
                    { id: 'loading_cargo', label: 'Loading Pickup' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, vehicleType: v.id as any })}
                      className={`py-2 px-2.5 rounded-xl text-[9px] font-bold uppercase border text-left transition-all ${
                        formData.vehicleType === v.id ? 'border-black bg-black text-yellow-400' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteDriverRegistration}
                className="w-full py-5 bg-black text-yellow-400 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-neutral-900"
              >
                <span>Submit Driver Verification & Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
