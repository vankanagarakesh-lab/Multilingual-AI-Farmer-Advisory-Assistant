import React from 'react';
import { 
  Zap, 
  Droplets, 
  Power, 
  Sliders, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Layers,
  Sparkles,
  Gauge
} from 'lucide-react';
import { SensorTelemetry, AIDecisionResult } from '../../types/autonomous';
import { useLanguage } from '../../context/LanguageContext';

interface SmartMotorControlProps {
  telemetry: SensorTelemetry;
  decision: AIDecisionResult;
  onMoistureChange: (newMoisture: number) => void;
  onToggleMotorManual?: () => void;
}

export const SmartMotorControl: React.FC<SmartMotorControlProps> = ({
  telemetry,
  decision,
  onMoistureChange,
}) => {
  const { t } = useLanguage();
  const isMotorOn = telemetry.pumpState;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors ${
            isMotorOn 
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-emerald-900/40' 
              : 'bg-gradient-to-tr from-slate-700 to-slate-600 shadow-slate-950'
          }`}>
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base md:text-lg tracking-tight">
                {t('auto_farm.smart_motor_control', 'Smart Water Motor Control')}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                3. PUMP SWITCH
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous solid-state relay module with automated AI triggering & manual override slider
            </p>
          </div>
        </div>

        {/* Big Visual Motor State Badge */}
        <div className={`px-4 py-2 rounded-2xl border flex items-center space-x-2.5 font-black text-sm tracking-wide transition-all duration-300 shadow-lg ${
          isMotorOn 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-emerald-950/80 animate-pulse' 
            : 'bg-rose-950/80 border-rose-600/60 text-rose-300 shadow-rose-950/60'
        }`}>
          <span className={`w-3 h-3 rounded-full ${isMotorOn ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
          <span>{isMotorOn ? '🟢 MOTOR ON' : '🔴 MOTOR OFF'}</span>
        </div>
      </div>

      {/* Main Motor Status & Interactive Control Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Industrial Motor Visual Card (5 cols) */}
        <div className={`lg:col-span-5 rounded-2xl p-5 border flex flex-col justify-between transition-all duration-500 ${
          isMotorOn 
            ? 'bg-gradient-to-b from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500/40 shadow-xl shadow-emerald-950/30'
            : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-semibold uppercase tracking-wider">3-Phase Submersible Motor</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">1.5 HP • 415V</span>
            </div>

            {/* Motor Animation Centerpiece */}
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                {/* Outer halo */}
                <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                  isMotorOn 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.4)]' 
                    : 'border-slate-700 bg-slate-800/40'
                }`}>
                  {/* Rotating fan icon */}
                  <div className={`text-4xl ${isMotorOn ? 'animate-spin' : 'opacity-40'}`}>
                    ⚙️
                  </div>
                </div>

                {/* Status Dot */}
                <div className={`absolute -bottom-1 -right-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-md ${
                  isMotorOn ? 'bg-emerald-500 text-slate-950 border-emerald-300' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isMotorOn ? 'RUNNING' : 'STOPPED'}
                </div>
              </div>
            </div>

            {/* Pumping Telemetry readouts */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Flow Rate</span>
                <p className={`text-sm font-bold ${isMotorOn ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isMotorOn ? `${telemetry.flowRateLpm} L/min` : '0 L/min'}
                </p>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Pipe Pressure</span>
                <p className={`text-sm font-bold ${isMotorOn ? 'text-sky-400' : 'text-slate-500'}`}>
                  {isMotorOn ? `${telemetry.pipePressureBar} Bar` : '0 Bar'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Relay Control: Autonomous</span>
            <span className="text-emerald-400 font-semibold">Safe Load Active</span>
          </div>
        </div>

        {/* Right Column: Interactive Soil Moisture Slider & Decision Rules (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive Moisture Slider Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('auto_farm.manual_slider', 'Interactive Soil Moisture Slider')}
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Current: {telemetry.soilMoisture}%
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Drag the slider to test how KRISHI AI immediately calculates irrigation decisions in real-time:
            </p>

            {/* Slider Input */}
            <div className="space-y-2 pt-1">
              <input
                type="range"
                min="5"
                max="95"
                value={telemetry.soilMoisture}
                onChange={(e) => onMoistureChange(parseInt(e.target.value, 10))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />

              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span className="text-rose-400">Dry (5% - 34%) → AUTO ON</span>
                <span className="text-emerald-400">Optimal (35% - 75%) → OFF</span>
                <span className="text-blue-400">Saturated (&gt; 75%) → OFF</span>
              </div>
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => onMoistureChange(20)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
              >
                Set Dry (20%)
              </button>
              <button
                type="button"
                onClick={() => onMoistureChange(55)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition"
              >
                Set Optimal (55%)
              </button>
              <button
                type="button"
                onClick={() => onMoistureChange(85)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition"
              >
                Set Saturated (85%)
              </button>
            </div>
          </div>

          {/* AI Decision Rules Reference Matrix */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between mb-2">
              <span>Autonomous Decision Rules (Hackathon Logic)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Rule 1 */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                decision.ruleTriggered === 'RULE_1'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
              }`}>
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span>Rule 1: Critical Dry + No Rain</span>
                  {decision.ruleTriggered === 'RULE_1' && <span className="text-[10px] text-emerald-400 font-extrabold">ACTIVE NOW</span>}
                </div>
                <p className="text-[11px] leading-tight">Moisture &lt; 35% & No rain forecasted soon → <strong>MOTOR ON</strong></p>
              </div>

              {/* Rule 2 */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                decision.ruleTriggered === 'RULE_2'
                  ? 'bg-sky-950/80 border-sky-500/50 text-sky-200 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
              }`}>
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span>Rule 2: Dry + Rain Soon</span>
                  {decision.ruleTriggered === 'RULE_2' && <span className="text-[10px] text-sky-400 font-extrabold">ACTIVE NOW</span>}
                </div>
                <p className="text-[11px] leading-tight">Moisture &lt; 35% BUT rain within short time → <strong>MOTOR OFF</strong> (Delayed)</p>
              </div>

              {/* Rule 3 */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                decision.ruleTriggered === 'RULE_3'
                  ? 'bg-teal-950/80 border-teal-500/50 text-teal-200 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
              }`}>
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span>Rule 3: Sufficient Moisture</span>
                  {decision.ruleTriggered === 'RULE_3' && <span className="text-[10px] text-teal-400 font-extrabold">ACTIVE NOW</span>}
                </div>
                <p className="text-[11px] leading-tight">Moisture 35% - 75% (Ideal) → <strong>MOTOR OFF</strong> (Standby)</p>
              </div>

              {/* Rule 4 */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                decision.ruleTriggered === 'RULE_4'
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-200 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
              }`}>
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span>Rule 4: Excess Saturation</span>
                  {decision.ruleTriggered === 'RULE_4' && <span className="text-[10px] text-amber-400 font-extrabold">ACTIVE NOW</span>}
                </div>
                <p className="text-[11px] leading-tight">Moisture &gt; 75% → <strong>MOTOR OFF</strong> (Excess Water Alert)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
