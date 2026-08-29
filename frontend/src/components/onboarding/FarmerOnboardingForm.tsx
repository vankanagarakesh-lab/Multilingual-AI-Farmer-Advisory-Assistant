import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  User, 
  MapPin, 
  Wheat, 
  Maximize2, 
  Globe, 
  ArrowRight, 
  Loader2, 
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FarmerOnboardingForm: React.FC = () => {
  const { onboardFarmer, isLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('Telugu');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name / దయచేసి మీ పేరు నమోదు చేయండి');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onboardFarmer({
        name: name.trim(),
        age: age ? parseInt(age, 10) : undefined,
        location: location.trim() || 'Andhra Pradesh',
        farm_size: farmSize.trim() || '2 Acres',
        primary_crop: primaryCrop.trim() || 'Crop Management',
        preferred_language: preferredLanguage
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Onboarding submission failed:', err);
      const detail = err?.response?.data?.detail || err?.message || 'Failed to save farmer profile. Please try again.';
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto text-slate-100">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-xl w-full relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto py-8">
        {/* Top Branding Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl shadow-emerald-950/60 mb-2">
            <Sprout className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <span>KRISHI AI</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              రైతు సేవ
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Welcome to KRISHI AI! Please enter your agricultural details below to get tailored crop advisory, soil management, and weather insights.
          </p>
        </div>

        {/* Main Information Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200">
                Farmer Information Form / రైతు సమాచార పత్రం
              </h2>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>No Password Needed</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs shadow-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Farmer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Farmer Name / రైతు పేరు <span className="text-emerald-400">*</span></span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar / రమేష్ కుమార్"
                className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 2. Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Age / వయస్సు</span>
                </label>
                <input
                  type="number"
                  min={15}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* 3. Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Location / గ్రామం / జిల్లా</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Guntur, Andhra Pradesh"
                  className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 4. Number of Acres of Land */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Acres of Land / భూమి విస్తీర్ణం</span>
                </label>
                <input
                  type="text"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  placeholder="e.g. 3 Acres / 3 ఎకరాలు"
                  className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* 5. Main Crop / Crop Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Wheat className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Main Crop / ప్రధాన పంట</span>
                </label>
                <input
                  type="text"
                  value={primaryCrop}
                  onChange={(e) => setPrimaryCrop(e.target.value)}
                  placeholder="e.g. Cotton, Chilli, Paddy, Tomato"
                  className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            {/* 6. Preferred Language Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preferred Language / మాట్లాడే భాష</span>
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              >
                <option value="Telugu">తెలుగు (Telugu - Recommended)</option>
                <option value="English">English</option>
                <option value="Hindi">हिंदी (Hindi)</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
                <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                <option value="Marathi">मराठी (Marathi)</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="
                  w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm
                  shadow-xl shadow-emerald-950 flex items-center justify-center space-x-2 transition
                  disabled:opacity-50 active:scale-[0.98]
                "
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting Up Your Farm Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Start KRISHI AI / చాట్ ప్రారంభించండి</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="pt-2 text-center text-[11px] text-slate-500">
            🔒 Your details and conversations are saved uniquely for this device.
          </div>
        </div>
      </div>
    </div>
  );
};
