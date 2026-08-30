import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  Droplets,
  CloudRain,
  Thermometer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Layers,
  MapPin,
  Wheat,
  RotateCcw,
  Zap,
  ChevronRight,
  Info,
  ShieldCheck,
  ShieldAlert,
  Flame,
  SunMedium,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';
import {
  SimulationInput,
  SimulationResponse,
  CropSimulationResult,
  SimulationAIInsightResponse
} from '../../types';
import { simulatorService, calculateClientSimulation } from '../../services/simulatorService';

interface FarmSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCrop?: string;
  isStandalonePage?: boolean;
}

export const FarmSimulatorModal: React.FC<FarmSimulatorModalProps> = ({
  isOpen,
  onClose,
  initialCrop,
  isStandalonePage = false,
}) => {
  const navigate = useNavigate();
  const { farmerProfile, user } = useAuth();
  const { currentLanguage, t } = useLanguage();

  // Parse farm acres from profile or default to 2.0
  const defaultAcres = useMemo(() => {
    if (!farmerProfile?.farm_size) return 2.0;
    const match = farmerProfile.farm_size.match(/[\d.]+/);
    return match ? parseFloat(match[0]) || 2.0 : 2.0;
  }, [farmerProfile]);

  // Read cached live weather if available
  const cachedWeather = useMemo(() => {
    try {
      const stored = localStorage.getItem('krishi_last_weather');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  // Form & Slider States
  const [waterAvailability, setWaterAvailability] = useState<number>(80);
  const [rainDelay, setRainDelay] = useState<number>(0);
  const [tempDelta, setTempDelta] = useState<number>(0);
  const [marketPriceDelta, setMarketPriceDelta] = useState<number>(0);
  const [expectedRainfall, setExpectedRainfall] = useState<string>('Normal');
  const [budget, setBudget] = useState<number>(60000);
  const [farmAcres, setFarmAcres] = useState<number>(defaultAcres);
  const [soilType, setSoilType] = useState<string>(farmerProfile?.soil_type || 'Red Loamy');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Rice', 'Groundnut', 'Millet']);
  const [activeTab, setActiveTab] = useState<'cards' | 'charts' | 'strategy'>('cards');
  const [copied, setCopied] = useState<boolean>(false);

  // AI Deep Strategic Insight State
  const [aiInsight, setAiInsight] = useState<SimulationAIInsightResponse | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState<boolean>(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Sync state if profile changes
  useEffect(() => {
    if (farmerProfile?.farm_size) {
      const match = farmerProfile.farm_size.match(/[\d.]+/);
      if (match) setFarmAcres(parseFloat(match[0]) || 2.0);
    }
    if (farmerProfile?.soil_type) {
      setSoilType(farmerProfile.soil_type);
    }
    if (farmerProfile?.primary_crop) {
      const pCrop = farmerProfile.primary_crop;
      if (!selectedCrops.includes(pCrop)) {
        setSelectedCrops(prev => [pCrop, ...prev.filter(c => c !== pCrop)].slice(0, 3));
      }
    }
  }, [farmerProfile]);

  // Current simulation payload
  const currentInput: SimulationInput = useMemo(() => {
    return {
      water_availability_pct: waterAvailability,
      rain_delay_days: rainDelay,
      temp_delta_c: tempDelta,
      market_price_delta_pct: marketPriceDelta,
      expected_rainfall: expectedRainfall,
      budget,
      farm_size_acres: farmAcres,
      soil_type: soilType,
      location: farmerProfile?.location || cachedWeather?.locationName || 'Andhra Pradesh / Telangana',
      coordinates: cachedWeather?.latitude && cachedWeather?.longitude ? {
        lat: cachedWeather.latitude,
        lon: cachedWeather.longitude
      } : undefined,
      current_crop: farmerProfile?.primary_crop || undefined,
      current_crop_stage: farmerProfile?.current_crop_stage || undefined,
      selected_crops: selectedCrops,
      language: currentLanguage,
    };
  }, [
    waterAvailability,
    rainDelay,
    tempDelta,
    marketPriceDelta,
    expectedRainfall,
    budget,
    farmAcres,
    soilType,
    farmerProfile,
    cachedWeather,
    selectedCrops,
    currentLanguage
  ]);

  // Instant 0ms reactive calculation on slider change
  const [simulation, setSimulation] = useState<SimulationResponse>(() => calculateClientSimulation(currentInput));

  // Update simulation instantly whenever sliders or inputs change
  useEffect(() => {
    const instant = calculateClientSimulation(currentInput);
    setSimulation(instant);
  }, [currentInput]);

  // Preset Scenarios
  const applyPreset = (presetName: string) => {
    setAiInsight(null);
    switch (presetName) {
      case 'drought':
        setWaterAvailability(35);
        setRainDelay(25);
        setTempDelta(2.5);
        setMarketPriceDelta(10);
        setExpectedRainfall('Drought');
        break;
      case 'monsoon_delay':
        setWaterAvailability(50);
        setRainDelay(40);
        setTempDelta(1.0);
        setMarketPriceDelta(-5);
        setExpectedRainfall('Deficit');
        break;
      case 'market_boom':
        setWaterAvailability(85);
        setRainDelay(0);
        setTempDelta(0);
        setMarketPriceDelta(35);
        setExpectedRainfall('Normal');
        break;
      case 'low_budget':
        setWaterAvailability(60);
        setRainDelay(10);
        setTempDelta(0);
        setMarketPriceDelta(0);
        setBudget(25000);
        setExpectedRainfall('Normal');
        break;
      case 'baseline':
      default:
        setWaterAvailability(80);
        setRainDelay(0);
        setTempDelta(0);
        setMarketPriceDelta(0);
        setExpectedRainfall('Normal');
        setBudget(60000);
        break;
    }
  };

  // Trigger Deep AI Insight Analysis
  const handleFetchAiInsight = async () => {
    setIsLoadingInsight(true);
    setInsightError(null);
    try {
      const res = await simulatorService.getSimulationAIInsight({
        simulation_input: currentInput,
        simulation_results: simulation.results,
        best_crop_name: simulation.best_recommendation.crop_name,
        language: currentLanguage
      });
      setAiInsight(res);
      setActiveTab('strategy');
    } catch (err: any) {
      console.error('Failed to get AI insight:', err);
      setInsightError('AI Strategy generator is currently processing. Fallback strategy displayed.');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  // Copy simulation report
  const handleCopyReport = () => {
    const best = simulation.best_recommendation;
    const text = `🌾 KRISHI VISION - AI FARM FUTURE SIMULATION REPORT\n` +
      `--------------------------------------------------\n` +
      `Farmer: ${user?.name || 'Farmer'} | Land: ${farmAcres} Acres | Soil: ${soilType}\n` +
      `Simulated Conditions:\n` +
      `• Water Availability: ${waterAvailability}%\n` +
      `• Rain Delay: ${rainDelay} Days\n` +
      `• Temp Anomaly: ${tempDelta > 0 ? `+${tempDelta}` : tempDelta}°C\n` +
      `• Market Price Shift: ${marketPriceDelta > 0 ? `+${marketPriceDelta}` : marketPriceDelta}%\n\n` +
      `🏆 BEST RECOMMENDATION: ${best.crop_name}\n` +
      `• AI Suitability Score: ${best.overall_ai_score}/100\n` +
      `• Estimated Total Profit: ₹${best.total_profit.toLocaleString()} (ROI: ${best.roi_pct}%)\n` +
      `• Risk Level: ${best.risk_level}\n` +
      `• Key Rationale: ${simulation.recommendation_reasoning}\n\n` +
      `Detailed Crop Comparison:\n` +
      simulation.results.map(r => `  - ${r.crop_name}: Profit ₹${r.total_profit.toLocaleString()} | Risk: ${r.risk_level} | AI Score: ${r.overall_ai_score}/100`).join('\n') +
      `\n\nGenerated by KRISHI AI - "Don't just grow. Simulate your future before you invest."`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Discuss in AI Chat
  const handleDiscussInChat = () => {
    const best = simulation.best_recommendation;
    const prompt = `I ran a KRISHI VISION farm simulation for ${farmAcres} acres with ${waterAvailability}% water availability, ${rainDelay} days rain delay, and ${soilType} soil. The AI simulator recommended ${best.crop_name} with estimated profit ₹${best.total_profit.toLocaleString()} (${best.risk_level} risk). Can you give me a detailed step-by-step planting schedule and fertilizer plan for this scenario?`;
    
    onClose();
    navigate('/', { state: { initialPrompt: prompt } });
  };

  if (!isOpen && !isStandalonePage) return null;

  const bestCrop = simulation.best_recommendation;

  return (
    <div className={isStandalonePage ? 'min-h-full flex-1 flex flex-col bg-slate-950 p-3 sm:p-6' : 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto'}>
      <div className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col w-full ${isStandalonePage ? 'max-w-7xl mx-auto' : 'max-w-6xl max-h-[94vh]'} overflow-hidden`}>
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-base sm:text-lg tracking-tight">
                  KRISHI VISION
                </h2>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI Farm Future Simulator
                </span>
              </div>
              <p className="text-xs text-slate-400 italic">
                &ldquo;Don&apos;t just grow. Simulate your future before you invest.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <LanguageSwitcher />

            <button
              onClick={handleCopyReport}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium border border-slate-700"
              title="Copy Simulation Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : t('sim.export', 'Export')}</span>
            </button>

            {!isStandalonePage && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Farmer Profile & Live Context Ribbon */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 text-slate-300">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <Wheat className="w-3.5 h-3.5" />
              {user?.name || 'Farmer'}&apos;s Profile:
            </span>
            <span className="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-400" />
              {farmerProfile?.location || cachedWeather?.locationName || 'Local Farm'}
            </span>
            <span className="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/60">
              📐 <strong>{farmAcres} Acres</strong>
            </span>
            <span className="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/60">
              🌱 Soil: <strong>{soilType}</strong>
            </span>
            {farmerProfile?.primary_crop && (
              <span className="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/60">
                🌾 Current: <strong>{farmerProfile.primary_crop}</strong>
              </span>
            )}
          </div>

          {cachedWeather && (
            <div className="flex items-center gap-2 text-slate-400 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800">
              <SunMedium className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Weather: <strong>{cachedWeather.temperature}°C</strong>, {cachedWeather.conditionText}</span>
              {cachedWeather.nextRainCountdown && (
                <span className="text-sky-400">• Rain: {cachedWeather.nextRainCountdown}</span>
              )}
            </div>
          )}
        </div>

        {/* Main Body: Two Column Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Real-Time Interactive Sliders & Parameter Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Quick Scenario Preset Buttons */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Quick Scenario Presets</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('drought')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800/50 text-[11px] font-medium transition text-left truncate flex items-center gap-1"
                >
                  ☀️ Drought Stress
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('monsoon_delay')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/40 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-800/50 text-[11px] font-medium transition text-left truncate flex items-center gap-1"
                >
                  🌧️ Rain Delay
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('market_boom')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-800/50 text-[11px] font-medium transition text-left truncate flex items-center gap-1"
                >
                  📈 Market Boom
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('low_budget')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-950/40 text-slate-300 hover:text-sky-300 border border-slate-800 hover:border-sky-800/50 text-[11px] font-medium transition text-left truncate flex items-center gap-1"
                >
                  🛡️ Low Budget
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('baseline')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] font-medium transition text-left truncate flex items-center gap-1 col-span-2 sm:col-span-2"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  Reset to Baseline
                </button>
              </div>
            </div>

            {/* REAL-TIME INTERACTIVE SLIDERS CONTAINER */}
            <div className="bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-slate-800/90 space-y-5 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-500" />
                  Simulate Future Conditions
                </h3>
                <span className="text-[10px] text-slate-400 bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 px-2 py-0.5 rounded-full">
                  Real-time Active
                </span>
              </div>

              {/* Slider 1: Water Availability */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Droplets className={`w-4 h-4 ${waterAvailability < 40 ? 'text-rose-400' : waterAvailability < 70 ? 'text-amber-400' : 'text-sky-400'}`} />
                    <span>💧 Available Water Level:</span>
                  </label>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg font-mono border ${
                    waterAvailability < 40
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : waterAvailability < 70
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {waterAvailability}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={waterAvailability}
                  onChange={(e) => setWaterAvailability(parseInt(e.target.value, 10))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-medium px-0.5">
                  <span>0% (Severe Drought)</span>
                  <span>50% (Limited Canal/Bore)</span>
                  <span>100% (Abundant)</span>
                </div>
              </div>

              {/* Slider 2: Rain Delay */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <CloudRain className={`w-4 h-4 ${rainDelay > 30 ? 'text-rose-400' : rainDelay > 15 ? 'text-amber-400' : 'text-sky-400'}`} />
                    <span>🌧️ Rain Delay (Monsoon Lag):</span>
                  </label>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg font-mono border ${
                    rainDelay === 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : rainDelay > 30
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {rainDelay === 0 ? 'On Time (0d)' : `+${rainDelay} Days Delay`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="2"
                  value={rainDelay}
                  onChange={(e) => setRainDelay(parseInt(e.target.value, 10))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-medium px-0.5">
                  <span>0d (Normal Sowing)</span>
                  <span>30d (Moderate Delay)</span>
                  <span>60d (Extreme Monsoon Lag)</span>
                </div>
              </div>

              {/* Slider 3: Temperature Anomaly */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Thermometer className={`w-4 h-4 ${tempDelta > 2 ? 'text-rose-400' : tempDelta < -2 ? 'text-blue-400' : 'text-emerald-400'}`} />
                    <span>🌡️ Temperature Change:</span>
                  </label>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg font-mono border ${
                    tempDelta > 2
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : tempDelta < -2
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {tempDelta > 0 ? `+${tempDelta}°C (Heatwave)` : tempDelta < 0 ? `${tempDelta}°C (Cooler)` : '0°C (Baseline)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={tempDelta}
                  onChange={(e) => setTempDelta(parseFloat(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-medium px-0.5">
                  <span>-5°C</span>
                  <span>0°C (Seasonal Avg)</span>
                  <span>+5°C (Extreme Heat)</span>
                </div>
              </div>

              {/* Slider 4: Market Price Fluctuation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    {marketPriceDelta >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                    )}
                    <span>💰 Market Price Shift:</span>
                  </label>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg font-mono border ${
                    marketPriceDelta > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : marketPriceDelta < 0
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {marketPriceDelta > 0 ? `+${marketPriceDelta}% Boom` : marketPriceDelta < 0 ? `${marketPriceDelta}% Slump` : '0% (Standard MSP)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={marketPriceDelta}
                  onChange={(e) => setMarketPriceDelta(parseInt(e.target.value, 10))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-medium px-0.5">
                  <span>-50% (Mandi Glut)</span>
                  <span>0% (MSP Target)</span>
                  <span>+50% (High Demand)</span>
                </div>
              </div>

              {/* Secondary Parameters (Rainfall Outlook, Farm Budget & Acres) */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    🌧️ Expected Rain Condition:
                  </label>
                  <select
                    value={expectedRainfall}
                    onChange={(e) => setExpectedRainfall(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Normal">Normal Monsoon</option>
                    <option value="Deficit">Deficit Rain (-25%)</option>
                    <option value="Drought">Severe Drought (-50%)</option>
                    <option value="Excess">Excess Rain (+20%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    💵 Farming Budget (₹):
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={budget}
                    onChange={(e) => setBudget(Math.max(1000, parseInt(e.target.value, 10) || 1000))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Crop Selector / Customizer */}
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Selected Crop Scenarios to Compare</span>
                <span className="text-[10px] text-emerald-400 font-mono">3 Scenarios</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Rice', 'Groundnut', 'Millet', 'Maize', 'Cotton', 'Tomato'].map((crop) => {
                  const isSelected = selectedCrops.includes(crop);
                  return (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => {
                        if (isSelected && selectedCrops.length > 3) {
                          setSelectedCrops(selectedCrops.filter(c => c !== crop));
                        } else if (!isSelected) {
                          if (selectedCrops.length >= 3) {
                            setSelectedCrops([...selectedCrops.slice(1), crop]);
                          } else {
                            setSelectedCrops([...selectedCrops, crop]);
                          }
                        }
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {crop === 'Rice' && '🌾 Rice'}
                      {crop === 'Groundnut' && '🥜 Groundnut'}
                      {crop === 'Millet' && '🥣 Millet'}
                      {crop === 'Maize' && '🌽 Maize'}
                      {crop === 'Cotton' && '☁️ Cotton'}
                      {crop === 'Tomato' && '🍅 Tomato'}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: AI Recommendation, Comparison Cards, Charts & Deep AI Insight (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 🏆 BEST RECOMMENDATION HERO CARD */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-5 sm:p-6 shadow-2xl shadow-emerald-950/50">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl shadow-inner shrink-0">
                    🏆
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                        BEST RECOMMENDATION
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                        AI Score: {bestCrop.overall_ai_score}/100
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {bestCrop.crop_name}
                    </h3>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-slate-900/80 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-800 sm:border-0">
                  <p className="text-[11px] text-slate-400">Projected Net Profit ({farmAcres} Acres)</p>
                  <p className={`text-xl sm:text-2xl font-black font-mono ${bestCrop.total_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{bestCrop.total_profit.toLocaleString()}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    bestCrop.risk_level === 'LOW'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : bestCrop.risk_level === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {bestCrop.risk_level} RISK
                  </span>
                </div>
              </div>

              {/* Dynamic Farmer-Friendly Reasoning */}
              <div className="mt-4 bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 space-y-2">
                <div className="flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {simulation.recommendation_reasoning}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>💧 Water: <strong>{bestCrop.water_requirement_mm} mm</strong></span>
                  <span>•</span>
                  <span>🌤️ Weather Fit: <strong>{bestCrop.weather_suitability_pct}%</strong></span>
                  <span>•</span>
                  <span>💰 Est. Cost: <strong>₹{bestCrop.total_cost.toLocaleString()}</strong></span>
                  <span>•</span>
                  <span>📈 ROI: <strong>{bestCrop.roi_pct}%</strong></span>
                </div>
              </div>

              {/* Action Buttons for Best Crop */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={isLoadingInsight}
                  onClick={handleFetchAiInsight}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center space-x-2 transition disabled:opacity-50"
                >
                  {isLoadingInsight ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating AI Strategy...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>💡 Get Deep AI Strategic Plan</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDiscussInChat}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Discuss in KRISHI AI Chat</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* View Mode Tabs: Cards vs Comparison Charts vs AI Strategy */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('cards')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'cards'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3-Crop Comparison Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('charts')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'charts'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Visual Comparison Charts</span>
              </button>

              {aiInsight && (
                <button
                  type="button"
                  onClick={() => setActiveTab('strategy')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'strategy'
                      ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>AI Agronomic Strategy</span>
                </button>
              )}
            </div>

            {/* TAB 1: THREE CROP COMPARISON CARDS */}
            {activeTab === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {simulation.results.map((crop) => {
                  const isWinner = crop.crop_name === bestCrop.crop_name;
                  return (
                    <div
                      key={crop.crop_name}
                      className={`relative rounded-2xl p-4 flex flex-col justify-between transition duration-200 border ${
                        isWinner
                          ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/20'
                          : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {isWinner && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-full shadow">
                          ★ Recommended
                        </span>
                      )}

                      {/* Card Header */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-white text-sm tracking-tight">
                            {crop.crop_name}
                          </h4>
                          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                            {crop.overall_ai_score}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-3">{crop.category}</p>

                        {/* Financial Metrics */}
                        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/60 space-y-1.5 mb-3">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="text-slate-400">Est. Profit:</span>
                            <span className={`font-black font-mono ${crop.total_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ₹{crop.total_profit.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-slate-400">
                            <span>Total Cost:</span>
                            <span className="font-mono text-slate-300">₹{crop.total_cost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-slate-400">
                            <span>Total Revenue:</span>
                            <span className="font-mono text-slate-300">₹{crop.total_revenue.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Agronomic Status Metrics */}
                        <div className="space-y-2 text-xs">
                          {/* Water Requirement */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Droplets className="w-3 h-3 text-sky-400" />
                                Water Req:
                              </span>
                              <span className="font-mono font-semibold text-slate-200">{crop.water_requirement_mm} mm</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${crop.water_requirement_mm > 1000 ? 'bg-rose-500' : crop.water_requirement_mm > 500 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (crop.water_requirement_mm / 1400) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Weather Suitability */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Weather Suitability:</span>
                              <span className="font-mono font-semibold text-slate-200">{crop.weather_suitability_pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${crop.weather_suitability_pct > 70 ? 'bg-emerald-500' : crop.weather_suitability_pct > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${crop.weather_suitability_pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Risk Level Badge */}
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[11px] text-slate-400">Risk Level:</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              crop.risk_level === 'LOW'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : crop.risk_level === 'MEDIUM'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}>
                              {crop.risk_level} RISK
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Advice Snippet */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 line-clamp-2 italic">
                        {crop.agronomic_advice}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: VISUAL COMPARISON CHARTS */}
            {activeTab === 'charts' && (
              <div className="space-y-4 bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Comparative Agronomic & Financial Breakdown
                </h4>

                {/* Chart 1: Expected Profit Comparison */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">💰 Projected Net Profit Comparison (Total Farm)</span>
                    <span className="text-[10px] text-slate-400 font-mono">INR (₹)</span>
                  </div>

                  {(() => {
                    const maxProfit = Math.max(1, ...simulation.results.map(r => Math.abs(r.total_profit)));
                    return (
                      <div className="space-y-2">
                        {simulation.results.map(crop => {
                          const isPos = crop.total_profit >= 0;
                          const barWidth = Math.min(100, Math.max(8, (Math.abs(crop.total_profit) / maxProfit) * 100));
                          return (
                            <div key={crop.crop_name} className="space-y-1">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-slate-300">{crop.crop_name}</span>
                                <span className={`font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  ₹{crop.total_profit.toLocaleString()}
                                </span>
                              </div>
                              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isPos ? 'bg-gradient-to-r from-emerald-600 to-teal-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'
                                  }`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Chart 2: Water Requirement vs Available Capacity */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">💧 Crop Water Needs vs Simulated Water ({waterAvailability}%)</span>
                    <span className="text-[10px] text-slate-400 font-mono">mm of water</span>
                  </div>

                  <div className="space-y-2">
                    {simulation.results.map(crop => {
                      const pct = Math.min(100, (crop.water_requirement_mm / 1400) * 100);
                      const isHighStress = waterAvailability < 50 && crop.water_requirement_mm > 700;
                      return (
                        <div key={crop.crop_name} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-300 flex items-center gap-1">
                              {crop.crop_name}
                              {isHighStress && <span className="text-[10px] text-rose-400 font-bold">(Deficit Risk)</span>}
                            </span>
                            <span className="font-mono text-slate-200">{crop.water_requirement_mm} mm</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isHighStress
                                  ? 'bg-rose-500'
                                  : crop.water_requirement_mm > 800
                                  ? 'bg-amber-500'
                                  : 'bg-sky-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 3: Risk Score Comparison */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">🛡️ Vulnerability & Risk Factor Matrix</span>
                    <span className="text-[10px] text-slate-400 font-mono">Lower is safer</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    {simulation.results.map(crop => (
                      <div key={crop.crop_name} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <p className="text-xs font-bold text-slate-300 truncate">{crop.crop_name}</p>
                        <p className={`text-lg font-black font-mono my-1 ${
                          crop.risk_level === 'LOW' ? 'text-emerald-400' : crop.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {crop.risk_score}/100
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          crop.risk_level === 'LOW'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : crop.risk_level === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {crop.risk_level} RISK
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DEEP AI STRATEGY & ADVISORY */}
            {activeTab === 'strategy' && aiInsight && (
              <div className="bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-950 p-5 rounded-2xl border border-teal-500/40 space-y-4">
                <div className="flex items-center space-x-2 text-teal-400">
                  <Sparkles className="w-5 h-5" />
                  <h4 className="font-bold text-sm text-white">
                    KRISHI AI Agronomic Strategic Advisory
                  </h4>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-teal-800/30 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                  {aiInsight.ai_insight}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <h5 className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Field Action Points
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                      {aiInsight.strategic_advice.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <h5 className="font-bold text-sky-400 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5" />
                      Water Saving Tactics
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                      {aiInsight.water_saving_tactics.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer & Transparency Footer */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-400">
              <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong>Transparency Note:</strong> Calculations utilize agro-climatic simulation models adjusted for soil type, moisture deficit, rain lag, and market volatility. Results are guidance estimates for decision support, not financial guarantees.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
