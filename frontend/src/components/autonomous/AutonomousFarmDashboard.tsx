import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Sprout, 
  Droplets, 
  Cpu, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Activity, 
  Share2, 
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  SensorTelemetry, 
  AIDecisionResult, 
  FarmNotification, 
  DemoScenarioId 
} from '../../types/autonomous';
import { 
  SCENARIOS, 
  evaluateAIDecision, 
  INITIAL_NOTIFICATIONS 
} from '../../services/autonomousFarmService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import { FarmVisualization } from './FarmVisualization';
import { LiveSensorPanel } from './LiveSensorPanel';
import { AIDecisionEngine } from './AIDecisionEngine';
import { SmartMotorControl } from './SmartMotorControl';
import { FarmerNotificationPanel } from './FarmerNotificationPanel';
import { LiveDemoStepper } from './LiveDemoStepper';
import { HardwareArchitectureSection } from './HardwareArchitectureSection';

export const AutonomousFarmDashboard: React.FC = () => {
  const { farmerProfile } = useAuth();
  const { t, currentLanguage } = useLanguage();

  // Baseline telemetry state
  const [telemetry, setTelemetry] = useState<SensorTelemetry>({
    soilMoisture: 24,
    soilTemperature: 27,
    airTemperature: 32,
    airHumidity: 58,
    waterTankLevel: 82,
    sensorStatus: 'online',
    batteryVoltage: 4.18,
    signalDbm: -62,
    lastPing: new Date(),
    pumpState: false,
    flowRateLpm: 42,
    pipePressureBar: 2.8,
  });

  const [activeScenarioId, setActiveScenarioId] = useState<DemoScenarioId>('scenario_low_dry');
  const [weatherCondition, setWeatherCondition] = useState<string>('Clear & Sunny');
  const [rainForecastHours, setRainForecastHours] = useState<number | null>(null);
  const [rainProbability, setRainProbability] = useState<number>(5);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<FarmNotification[]>(INITIAL_NOTIFICATIONS);

  // Load cached weather from project weather system if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('krishi_last_weather');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.temperature) setTelemetry(prev => ({ ...prev, airTemperature: parsed.temperature }));
        if (parsed.humidity) setTelemetry(prev => ({ ...prev, airHumidity: parsed.humidity }));
        if (parsed.conditionText) setWeatherCondition(parsed.conditionText);
      }
    } catch (e) {
      // silent
    }
  }, []);

  // Compute AI Decision based on current telemetry & weather
  const [decision, setDecision] = useState<AIDecisionResult>(() => 
    evaluateAIDecision(24, null, 5, farmerProfile, currentLanguage)
  );

  const prevPumpStateRef = useRef<boolean>(telemetry.pumpState);

  // Recalculate AI decision whenever moisture, rain forecast, or profile changes
  const runDecisionCalculation = useCallback((
    moisture: number,
    rainHours: number | null,
    rainProb: number
  ) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const newDecision = evaluateAIDecision(
        moisture,
        rainHours,
        rainProb,
        farmerProfile,
        currentLanguage
      );

      setDecision(newDecision);
      setTelemetry((prev) => ({
        ...prev,
        pumpState: newDecision.motorState,
        soilMoisture: moisture,
      }));
      setIsAnalyzing(false);

      // Check if pump state transitioned to push dynamic notification
      if (prevPumpStateRef.current !== newDecision.motorState) {
        prevPumpStateRef.current = newDecision.motorState;
        
        let newNotif: FarmNotification;
        if (newDecision.motorState) {
          newNotif = {
            id: `notif-${Date.now()}`,
            timestamp: new Date(),
            type: 'motor',
            icon: '💧',
            title: 'Autonomous Irrigation Started',
            message: `Soil moisture is low (${moisture}%). KRISHI AI automatically turned motor ON to protect ${farmerProfile?.primary_crop || 'crops'}.`,
            priority: 'high',
            isNew: true,
          };
        } else {
          newNotif = {
            id: `notif-${Date.now()}`,
            timestamp: new Date(),
            type: 'ai_decision',
            icon: newDecision.decision === 'DELAY_RAIN' ? '🌧️' : '✅',
            title: newDecision.decision === 'DELAY_RAIN' ? 'Irrigation Delayed' : 'Irrigation Stopped',
            message: newDecision.reasoning,
            priority: 'medium',
            isNew: true,
          };
        }

        setNotifications((prevList) => [newNotif, ...prevList.slice(0, 15)]);
      }
    }, 280);
  }, [farmerProfile, currentLanguage]);

  // Handle manual moisture slider
  const handleMoistureChange = (newMoisture: number) => {
    setTelemetry((prev) => ({ ...prev, soilMoisture: newMoisture }));
    runDecisionCalculation(newMoisture, rainForecastHours, rainProbability);
  };

  // Handle scenario preset selection
  const handleSelectScenario = (scenarioId: DemoScenarioId) => {
    const s = SCENARIOS[scenarioId];
    if (!s) return;

    setActiveScenarioId(scenarioId);
    setWeatherCondition(s.weatherCondition);
    setRainForecastHours(s.rainForecastHours);
    setRainProbability(s.rainProbability);

    setTelemetry((prev) => ({
      ...prev,
      soilMoisture: s.soilMoisture,
      soilTemperature: s.soilTemp,
      airTemperature: s.airTemp,
      airHumidity: s.humidity,
      waterTankLevel: s.tankLevel,
    }));

    runDecisionCalculation(s.soilMoisture, s.rainForecastHours, s.rainProbability);
  };

  // Reset to default baseline
  const handleResetSimulation = () => {
    handleSelectScenario('scenario_normal');
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Step trigger update from Live Demo Stepper
  const handleTriggerStepUpdate = (stepIndex: number) => {
    if (stepIndex === 0) {
      handleSelectScenario('scenario_low_dry');
    }
  };

  // Slow ambient telemetry drift simulation (keeps values feeling alive)
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        // slight drift ±0.2°C and battery micro-adjust
        const tempDrift = (Math.random() - 0.5) * 0.2;
        const newSoilTemp = Math.round((prev.soilTemperature + tempDrift) * 10) / 10;
        return {
          ...prev,
          soilTemperature: Math.max(20, Math.min(38, newSoilTemp)),
          lastPing: new Date(),
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Title & Subtitle Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                🌾🤖💧 {t('auto_farm.title', 'Intelligent Autonomous Farm')}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                FUTURE AI & IOT HACKATHON DEMO
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800">
                {t('auto_farm.simulated_badge', 'SIMULATED IOT TELEMETRY')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {t('auto_farm.title', 'Intelligent Autonomous Farm')}
            </h1>

            <p className="text-sm md:text-base text-emerald-300/90 font-medium">
              {t('auto_farm.subtitle', 'AI + IoT Powered Smart Irrigation System')}
            </p>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Simulating closed-loop edge AI autonomy: Soil sensors continuously stream root moisture, KRISHI AI evaluates crop evapotranspiration vs satellite rain radar, and automatically toggles irrigation pumps while alerting the farmer.
            </p>
          </div>

          {/* End-to-End Flow Summary Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2 max-w-xs shrink-0 shadow-lg">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Autonomous Decision Flow:
            </span>
            <div className="font-mono text-[11px] text-slate-400 space-y-1">
              <div>📡 Soil Sensor ➔ Live Telemetry</div>
              <div>🧠 KRISHI AI Brain ➔ Rain Analysis</div>
              <div>⚡ Auto Motor Switch ➔ 📱 Farmer Alert</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Automated Live Demo Stepper & Preset Controls (Sections 5 & 6) */}
      <LiveDemoStepper
        onSelectScenario={handleSelectScenario}
        activeScenarioId={activeScenarioId}
        onReset={handleResetSimulation}
        onTriggerStepUpdate={handleTriggerStepUpdate}
      />

      {/* 3. Main 2.5D Animated Farm Visualization (Section 7) */}
      <FarmVisualization
        telemetry={telemetry}
        decision={decision}
        farmerProfile={farmerProfile}
        rainForecastHours={rainForecastHours}
        rainProbability={rainProbability}
      />

      {/* 4. Live Sensor Data Telemetry Cards (Section 1) */}
      <LiveSensorPanel telemetry={telemetry} />

      {/* 5. Two-Column Layout: AI Decision Engine & Smart Water Motor Control (Sections 2 & 3) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AIDecisionEngine
          decision={decision}
          telemetry={telemetry}
          farmerProfile={farmerProfile}
          weatherCondition={weatherCondition}
          rainForecastHours={rainForecastHours}
          rainProbability={rainProbability}
          isAnalyzing={isAnalyzing}
        />

        <SmartMotorControl
          telemetry={telemetry}
          decision={decision}
          onMoistureChange={handleMoistureChange}
        />
      </div>

      {/* 6. Farmer Notification Feed (Section 4) */}
      <FarmerNotificationPanel
        notifications={notifications}
        onClearNotifications={handleClearNotifications}
      />

      {/* 7. Realistic IoT Hardware Architecture Section (Section 8) */}
      <HardwareArchitectureSection />
    </div>
  );
};
