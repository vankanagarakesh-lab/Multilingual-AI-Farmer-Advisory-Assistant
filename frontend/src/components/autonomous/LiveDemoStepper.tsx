import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Radio, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Droplets, 
  CloudRain, 
  Bell, 
  Cpu, 
  Wheat,
  Activity,
  Flame
} from 'lucide-react';
import { DemoScenarioId } from '../../types/autonomous';
import { useLanguage } from '../../context/LanguageContext';

interface LiveDemoStepperProps {
  onSelectScenario: (scenarioId: DemoScenarioId) => void;
  activeScenarioId: DemoScenarioId;
  onReset: () => void;
  onTriggerStepUpdate: (stepIndex: number) => void;
}

interface StepItem {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge: string;
  targetScenario?: DemoScenarioId;
}

export const LiveDemoStepper: React.FC<LiveDemoStepperProps> = ({
  onSelectScenario,
  activeScenarioId,
  onReset,
  onTriggerStepUpdate,
}) => {
  const { t } = useLanguage();
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const steps: StepItem[] = [
    {
      number: 1,
      title: 'Step 1: Reading soil sensor...',
      subtitle: 'Capturing root-zone moisture (22%) and soil temp (29°C) from RS485 probe',
      icon: <Radio className="w-4 h-4 text-sky-400" />,
      badge: 'TELEMETRY INGESTION',
      targetScenario: 'scenario_low_dry',
    },
    {
      number: 2,
      title: 'Step 2: Checking farmer profile...',
      subtitle: 'Extracting crop type (Tomato/Cotton), black soil water-holding index, and flowering stage',
      icon: <Wheat className="w-4 h-4 text-amber-400" />,
      badge: 'AGRONOMIC CONTEXT',
    },
    {
      number: 3,
      title: 'Step 3: Checking weather conditions...',
      subtitle: 'Evaluating ambient temperature (35°C), humidity (42%), and evapotranspiration rate',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      badge: 'MICROCLIMATE ANALYSIS',
    },
    {
      number: 4,
      title: 'Step 4: Checking rain prediction...',
      subtitle: 'Scanning Open-Meteo satellite radar: 0% rain probability in next 24 hours',
      icon: <CloudRain className="w-4 h-4 text-blue-400" />,
      badge: 'RADAR FORECAST',
    },
    {
      number: 5,
      title: 'Step 5: KRISHI AI is making a decision...',
      subtitle: 'Moisture deficit identified with zero rain buffer. Autonomous decision: ACTIVATE IRRIGATION',
      icon: <Cpu className="w-4 h-4 text-teal-400" />,
      badge: 'AI NEURAL REASONING',
    },
    {
      number: 6,
      title: 'Step 6: Irrigation started automatically...',
      subtitle: 'Relay tripped to HIGH (1). 1.5HP submersible pump flowing 42 L/min through drip network',
      icon: <Droplets className="w-4 h-4 text-emerald-400" />,
      badge: 'MOTOR ACTUATION',
      targetScenario: 'scenario_low_dry',
    },
    {
      number: 7,
      title: 'Step 7: Farmer notification sent.',
      subtitle: 'SMS alert & App push notification delivered to farmer’s registered mobile phone',
      icon: <Bell className="w-4 h-4 text-indigo-400" />,
      badge: 'FARMER ALERT PUSHED',
    },
  ];

  // Auto-play demo step progression
  useEffect(() => {
    if (isPlayingDemo) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlayingDemo(false);
            return prev;
          }
          const next = prev + 1;
          onTriggerStepUpdate(next);
          if (steps[next].targetScenario) {
            onSelectScenario(steps[next].targetScenario!);
          }
          return next;
        });
      }, 3200);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlayingDemo, steps.length]);

  const handleStartLiveDemo = () => {
    setCurrentStepIndex(0);
    setIsPlayingDemo(true);
    onTriggerStepUpdate(0);
    onSelectScenario('scenario_low_dry');
  };

  const handlePauseDemo = () => {
    setIsPlayingDemo(false);
  };

  const handleStepClick = (index: number) => {
    setCurrentStepIndex(index);
    setIsPlayingDemo(false);
    onTriggerStepUpdate(index);
    if (steps[index].targetScenario) {
      onSelectScenario(steps[index].targetScenario!);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-5">
      {/* Header with Live Presentation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
            <Flame className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base md:text-lg tracking-tight">
                Live AI Hackathon Demonstration Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                5 & 6. DEMO CONTROLS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              One-click automated walkthrough demonstrating end-to-end sensor-to-motor AI autonomy
            </p>
          </div>
        </div>

        {/* Action Buttons: ▶ Start Live Demo & Reset */}
        <div className="flex items-center space-x-2">
          {!isPlayingDemo ? (
            <button
              type="button"
              onClick={handleStartLiveDemo}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/80 border border-emerald-400/40 transition duration-150 active:scale-95 animate-pulse hover:animate-none"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>▶ Start Live AI Demo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePauseDemo}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-amber-950 transition duration-150 active:scale-95"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause Demo ({currentStepIndex + 1}/7)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Quick Preset Scenarios (Section 5) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
          <span>Preset Simulation Scenarios (Instant Switch)</span>
          <span className="text-[11px] text-slate-400 font-normal">Click any scenario to test AI behavior</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Scenario 1 */}
          <button
            type="button"
            onClick={() => onSelectScenario('scenario_normal')}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
              activeScenarioId === 'scenario_normal'
                ? 'bg-slate-800/90 border-teal-500 shadow-lg shadow-teal-950/40'
                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-100">Scenario 1: Normal Moisture</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">55%</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">Stable root water. Motor stays OFF.</p>
            <span className="text-[10px] font-black uppercase text-teal-400">🔴 MOTOR OFF</span>
          </button>

          {/* Scenario 2 */}
          <button
            type="button"
            onClick={() => onSelectScenario('scenario_low_dry')}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
              activeScenarioId === 'scenario_low_dry'
                ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-950/60'
                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-100">Scenario 2: Low Moisture — Dry</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">22%</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">No rain predicted. Auto start pump.</p>
            <span className="text-[10px] font-black uppercase text-emerald-400">🟢 MOTOR AUTO ON</span>
          </button>

          {/* Scenario 3 */}
          <button
            type="button"
            onClick={() => onSelectScenario('scenario_low_rain')}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
              activeScenarioId === 'scenario_low_rain'
                ? 'bg-sky-950/60 border-sky-500 shadow-lg shadow-sky-950/60'
                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-100">Scenario 3: Low Moisture + Rain</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">24%</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">Rain in 3 hours. Delay irrigation.</p>
            <span className="text-[10px] font-black uppercase text-sky-400">🌧️ MOTOR OFF (DELAY)</span>
          </button>

          {/* Scenario 4 */}
          <button
            type="button"
            onClick={() => onSelectScenario('scenario_optimal')}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
              activeScenarioId === 'scenario_optimal'
                ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-950/60'
                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-100">Scenario 4: Optimal / Saturated</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">82%</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">Target reached. Protect from rot.</p>
            <span className="text-[10px] font-black uppercase text-blue-400">🔴 MOTOR OFF (TARGET)</span>
          </button>
        </div>
      </div>

      {/* 7-Step Hackathon Live Stepper Timeline (Section 6) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
          <div className="flex items-center space-x-2">
            <span>7-Step Autonomous Decision Process</span>
            {isPlayingDemo && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">
            Active: Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 rounded-full"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Steps Grid / Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => handleStepClick(idx)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-emerald-950/90 border-emerald-500 shadow-xl shadow-emerald-950/80 scale-[1.02] ring-1 ring-emerald-400'
                    : isCompleted
                    ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                    : 'bg-slate-950/50 border-slate-800/80 opacity-50 hover:opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                      isCurrent
                        ? 'bg-emerald-400 text-slate-950'
                        : isCompleted
                        ? 'bg-slate-700 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isCompleted ? '✓' : step.number}
                    </span>
                    <span className="p-1 rounded-md bg-slate-950 border border-slate-800">
                      {step.icon}
                    </span>
                  </div>
                  <h5 className={`text-xs font-bold leading-tight mb-1 ${
                    isCurrent ? 'text-white' : 'text-slate-300'
                  }`}>
                    {step.title}
                  </h5>
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {step.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
