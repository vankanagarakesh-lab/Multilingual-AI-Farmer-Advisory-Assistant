import React, { useState } from 'react';
import { 
  Wifi, 
  Cpu, 
  Droplets, 
  Activity, 
  Zap, 
  Gauge, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Layers,
  Thermometer
} from 'lucide-react';
import { SensorTelemetry, AIDecisionResult } from '../../types/autonomous';
import { FarmerProfile } from '../../types';

interface FarmVisualizationProps {
  telemetry: SensorTelemetry;
  decision: AIDecisionResult;
  farmerProfile?: FarmerProfile | null;
  rainForecastHours: number | null;
  rainProbability: number;
}

export const FarmVisualization: React.FC<FarmVisualizationProps> = ({
  telemetry,
  decision,
  farmerProfile,
  rainForecastHours,
  rainProbability,
}) => {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const isMotorOn = telemetry.pumpState;
  const cropName = farmerProfile?.primary_crop || 'Tomato & Cotton';
  const soilType = farmerProfile?.soil_type || 'Black Clay Loam';

  // Moisture color calculation
  const getMoistureColor = (m: number) => {
    if (m < 35) return { bg: '#ef4444', text: 'text-rose-400', label: 'CRITICAL DRY' };
    if (m <= 75) return { bg: '#10b981', text: 'text-emerald-400', label: 'OPTIMAL HYDRATED' };
    return { bg: '#3b82f6', text: 'text-blue-400', label: 'SATURATED' };
  };

  const moistureInfo = getMoistureColor(telemetry.soilMoisture);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background ambient lighting */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-1000 ${
        isMotorOn ? 'bg-emerald-500' : 'bg-cyan-500'
      }`} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl bg-teal-500/10 pointer-events-none" />

      {/* Header bar of Visualization */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 relative z-10 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <span className="text-xl">🌾</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-100 text-base md:text-lg tracking-tight">
                Live Autonomous Farm Simulation
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                SIMULATED TWIN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 2.5D visual telemetry mapping crop root-zone & autonomous irrigation circuits
            </p>
          </div>
        </div>

        {/* Live system state tag */}
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            isMotorOn 
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-950'
              : 'bg-slate-800/80 text-slate-300 border-slate-700'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isMotorOn ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{isMotorOn ? '💧 PUMP RUNNING (42 L/min)' : '🔴 STANDBY / NO WATERING'}</span>
          </div>
        </div>
      </div>

      {/* Main SVG Interactive Farm Graphic */}
      <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden shadow-inner aspect-[16/9] min-h-[320px] max-h-[460px] flex items-center justify-center">
        <svg
          viewBox="0 0 1000 560"
          className="w-full h-full object-contain select-none"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#09101f" />
              <stop offset="60%" stopColor="#0f1f38" />
              <stop offset="100%" stopColor="#1e3a5f" />
            </linearGradient>

            <linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2c1810" />
              <stop offset="35%" stopColor="#1f100a" />
              <stop offset="100%" stopColor="#120804" />
            </linearGradient>

            <linearGradient id="waterPipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <linearGradient id="neuralGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            {/* Pattern for soil moisture */}
            <pattern id="moistureMoistPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="1.5" fill="#38bdf8" opacity="0.4" />
              <circle cx="15" cy="15" r="1.5" fill="#38bdf8" opacity="0.4" />
            </pattern>
          </defs>

          {/* Sky background */}
          <rect x="0" y="0" width="1000" height="340" fill="url(#skyGrad)" />

          {/* Distant farm mountains & horizon */}
          <path d="M0,300 Q200,240 450,290 T900,260 L1000,280 L1000,340 L0,340 Z" fill="#0b1b2d" opacity="0.8" />
          <path d="M0,320 Q300,270 600,310 T1000,300 L1000,340 L0,340 Z" fill="#0f293b" opacity="0.9" />

          {/* Sun or Rain Clouds */}
          {rainForecastHours !== null && rainForecastHours <= 5 ? (
            /* Rain cloud grouping */
            <g transform="translate(180, 50)">
              <ellipse cx="60" cy="40" rx="50" ry="25" fill="#334155" />
              <ellipse cx="100" cy="30" rx="45" ry="30" fill="#475569" />
              <ellipse cx="140" cy="40" rx="40" ry="22" fill="#334155" />
              {/* Rain prediction text */}
              <text x="100" y="85" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                🌧️ Rain in {rainForecastHours}h ({rainProbability}%)
              </text>
            </g>
          ) : (
            /* Clear warm sun with rays */
            <g transform="translate(140, 55)">
              <circle cx="50" cy="50" r="32" fill="#f59e0b" opacity="0.2" className="animate-pulse" />
              <circle cx="50" cy="50" r="22" fill="#fbbf24" />
              <circle cx="50" cy="50" r="15" fill="#fef08a" />
              <text x="50" y="90" fill="#fef08a" fontSize="10" fontWeight="bold" textAnchor="middle">
                ☀️ 31°C Clear Skies
              </text>
            </g>
          )}

          {/* Soil Layer */}
          <rect x="0" y="340" width="1000" height="220" fill="url(#soilGrad)" />
          {/* Top grass/field line */}
          <rect x="0" y="338" width="1000" height="6" fill="#15803d" />

          {/* Root-zone moisture hydration highlight layer */}
          <rect
            x="280"
            y="350"
            width="440"
            height="150"
            rx="12"
            fill={telemetry.soilMoisture < 35 ? '#ef4444' : telemetry.soilMoisture <= 75 ? '#065f46' : '#1e3a8a'}
            opacity={telemetry.soilMoisture < 35 ? '0.15' : '0.35'}
            className="transition-colors duration-700"
          />

          {/* Crop Field Rows (Crops growing in soil) */}
          <g transform="translate(300, 210)">
            {/* Crop 1 */}
            <g transform="translate(0, 0)">
              <path d="M40,130 Q35,70 40,30 Q45,70 40,130" stroke="#16a34a" strokeWidth="6" fill="none" />
              <ellipse cx="25" cy="60" rx="14" ry="7" fill="#22c55e" transform="rotate(-30 25 60)" />
              <ellipse cx="55" cy="50" rx="14" ry="7" fill="#22c55e" transform="rotate(30 55 50)" />
              <ellipse cx="28" cy="35" rx="12" ry="6" fill="#4ade80" transform="rotate(-20 28 35)" />
              <ellipse cx="52" cy="30" rx="12" ry="6" fill="#4ade80" transform="rotate(20 52 30)" />
              <circle cx="40" cy="18" r="8" fill="#f97316" />
              <text x="40" y="150" fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle">{cropName}</text>
            </g>

            {/* Crop 2 */}
            <g transform="translate(100, 0)">
              <path d="M40,130 Q35,70 40,25 Q45,70 40,130" stroke="#16a34a" strokeWidth="6" fill="none" />
              <ellipse cx="22" cy="55" rx="15" ry="8" fill="#22c55e" transform="rotate(-35 22 55)" />
              <ellipse cx="58" cy="45" rx="15" ry="8" fill="#22c55e" transform="rotate(35 58 45)" />
              <ellipse cx="25" cy="30" rx="12" ry="6" fill="#4ade80" transform="rotate(-20 25 30)" />
              <circle cx="40" cy="14" r="9" fill="#ef4444" />
            </g>

            {/* Crop 3 */}
            <g transform="translate(200, 0)">
              <path d="M40,130 Q42,70 40,30 Q38,70 40,130" stroke="#16a34a" strokeWidth="6" fill="none" />
              <ellipse cx="22" cy="65" rx="14" ry="7" fill="#22c55e" transform="rotate(-30 22 65)" />
              <ellipse cx="58" cy="55" rx="14" ry="7" fill="#22c55e" transform="rotate(30 58 55)" />
              <ellipse cx="54" cy="35" rx="12" ry="6" fill="#4ade80" transform="rotate(25 54 35)" />
              <circle cx="40" cy="20" r="8" fill="#f97316" />
            </g>

            {/* Crop 4 */}
            <g transform="translate(300, 0)">
              <path d="M40,130 Q37,70 40,28 Q43,70 40,130" stroke="#16a34a" strokeWidth="6" fill="none" />
              <ellipse cx="22" cy="55" rx="14" ry="7" fill="#22c55e" transform="rotate(-30 22 55)" />
              <ellipse cx="58" cy="48" rx="14" ry="7" fill="#22c55e" transform="rotate(30 58 48)" />
              <circle cx="40" cy="18" r="9" fill="#ef4444" />
            </g>
          </g>

          {/* Plant Roots under soil */}
          <g stroke="#854d0e" strokeWidth="2" fill="none" opacity="0.8">
            <path d="M340,340 Q335,370 320,400 M340,340 Q345,380 355,410 M340,340 L340,420" />
            <path d="M440,340 Q435,370 420,400 M440,340 Q445,380 455,410 M440,340 L440,425" />
            <path d="M540,340 Q535,370 520,400 M540,340 Q545,380 555,410 M540,340 L540,415" />
            <path d="M640,340 Q635,370 620,400 M640,340 Q645,380 655,410 M640,340 L640,420" />
          </g>

          {/* 1. EMBEDDED SOIL SENSOR PROBE */}
          <g
            transform="translate(480, 330)"
            className="cursor-pointer group"
            onClick={() => setActiveHotspot('sensor')}
          >
            {/* Sensor probe blade */}
            <rect x="0" y="10" width="14" height="95" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <line x1="7" y1="20" x2="7" y2="90" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
            
            {/* Sensor Top Electronics Housing */}
            <rect x="-8" y="-15" width="30" height="26" rx="5" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
            <circle cx="7" cy="-2" r="4" fill="#10b981" className="animate-pulse" />

            {/* Wireless signal waves emitting from sensor to gateway */}
            <circle cx="7" cy="-15" r="10" stroke="#38bdf8" strokeWidth="1.5" fill="none" className="animate-radio-wave" opacity="0.7" />
            <circle cx="7" cy="-15" r="20" stroke="#38bdf8" strokeWidth="1" fill="none" className="animate-radio-wave" opacity="0.4" />

            {/* Live moisture tag attached to probe */}
            <rect x="26" y="25" width="115" height="38" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            <text x="35" y="42" fill="#94a3b8" fontSize="9" fontWeight="bold">SOIL MOISTURE</text>
            <text x="35" y="56" fill={moistureInfo.bg} fontSize="14" fontWeight="black">{telemetry.soilMoisture}%</text>
            <text x="75" y="56" fill="#64748b" fontSize="9">({telemetry.soilTemperature}°C)</text>
          </g>

          {/* 2. KRISHI AI BRAIN / EDGE GATEWAY (Top Center/Right) */}
          <g
            transform="translate(740, 110)"
            className="cursor-pointer group"
            onClick={() => setActiveHotspot('brain')}
          >
            {/* Hub body */}
            <rect x="0" y="0" width="220" height="135" rx="16" fill="#090d16" stroke="#10b981" strokeWidth="2" className="shadow-2xl" />
            
            {/* Inner glowing circuitry */}
            <rect x="10" y="10" width="200" height="115" rx="12" fill="#0c1322" stroke="#1e293b" strokeWidth="1" />
            
            {/* AI Brain Icon with pulse */}
            <circle cx="42" cy="40" r="22" fill="#064e3b" stroke="#10b981" strokeWidth="2" className="animate-brain-pulse" />
            <text x="42" y="46" fill="#ecfdf5" fontSize="18" textAnchor="middle">🧠</text>

            {/* Header text */}
            <text x="75" y="34" fill="#ffffff" fontSize="13" fontWeight="bold">KRISHI AI Engine</text>
            <text x="75" y="48" fill="#10b981" fontSize="10" fontWeight="semibold">Autonomous Edge Node</text>

            {/* Decision state readout inside Hub */}
            <rect x="20" y="70" width="180" height="42" rx="8" fill="#090d16" stroke={isMotorOn ? '#10b981' : '#38bdf8'} strokeWidth="1" />
            <text x="30" y="86" fill="#94a3b8" fontSize="9">DECISION OUTPUT:</text>
            <text x="30" y="102" fill={isMotorOn ? '#34d399' : '#38bdf8'} fontSize="11" fontWeight="bold">
              {decision.decision === 'IRRIGATE_ON' && '💧 AUTO IRRIGATE ON'}
              {decision.decision === 'DELAY_RAIN' && '🌧️ DELAY (RAIN FORECAST)'}
              {decision.decision === 'OPTIMAL_OFF' && '✅ OPTIMAL (MOTOR OFF)'}
              {decision.decision === 'EXCESS_OFF' && '⚠️ EXCESS MOISTURE LOCK'}
            </text>

            {/* Signal transmission link lines from Hub to Soil Sensor */}
            <path
              d="M0,70 Q-150,160 -250,220"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
              opacity="0.6"
              className="animate-water-flow"
            />
          </g>

          {/* 3. WATER TANK & MOTOR PUMP (Left Side) */}
          <g
            transform="translate(40, 240)"
            className="cursor-pointer group"
            onClick={() => setActiveHotspot('motor')}
          >
            {/* Water Tank */}
            <rect x="0" y="20" width="75" height="110" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            {/* Water inside tank */}
            <rect
              x="3"
              y={23 + (104 * (1 - telemetry.waterTankLevel / 100))}
              width="69"
              height={104 * (telemetry.waterTankLevel / 100)}
              rx="6"
              fill="#0284c7"
              opacity="0.75"
            />
            <text x="37" y="75" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
              {telemetry.waterTankLevel}%
            </text>
            <text x="37" y="90" fill="#bae6fd" fontSize="8" textAnchor="middle">WATER TANK</text>

            {/* Water Motor / Pump Unit */}
            <rect x="95" y="60" width="70" height="70" rx="10" fill="#1e293b" stroke={isMotorOn ? '#10b981' : '#ef4444'} strokeWidth="3" />
            
            {/* Rotating pump impeller blades */}
            <g transform="translate(130, 95)">
              <circle cx="0" cy="0" r="22" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
              <path
                d="M-15,0 L15,0 M0,-15 L0,15 M-10,-10 L10,10 M-10,10 L10,-10"
                stroke={isMotorOn ? '#10b981' : '#64748b'}
                strokeWidth="3"
                className={isMotorOn ? 'animate-spin' : ''}
              />
              <circle cx="0" cy="0" r="5" fill="#f8fafc" />
            </g>

            {/* Motor status badge */}
            <rect x="92" y="38" width="76" height="18" rx="5" fill="#0f172a" stroke="#334155" />
            <text x="130" y="50" fill={isMotorOn ? '#34d399' : '#f87171'} fontSize="9" fontWeight="black" textAnchor="middle">
              {isMotorOn ? '🟢 MOTOR ON' : '🔴 MOTOR OFF'}
            </text>
          </g>

          {/* 4. MAIN WATER PIPELINE & SPRINKLERS */}
          {/* Main pipe coming from pump */}
          <path
            d="M205,335 L280,335 L700,335"
            stroke={isMotorOn ? 'url(#waterPipeGrad)' : '#334155'}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            className={isMotorOn ? 'animate-water-flow' : ''}
          />

          {/* Sprinkler / Drip Risers */}
          {[340, 440, 540, 640].map((x, i) => (
            <g key={i} transform={`translate(${x}, 315)`}>
              {/* Vertical riser pipe */}
              <line x1="0" y1="20" x2="0" y2="0" stroke={isMotorOn ? '#38bdf8' : '#475569'} strokeWidth="4" />
              {/* Sprinkler Nozzle */}
              <polygon points="-5,0 5,0 0,-7" fill={isMotorOn ? '#38bdf8' : '#64748b'} />

              {/* Water Spray Droplets when Motor is ON */}
              {isMotorOn && (
                <g className="animate-pulse">
                  {/* Left spray arc */}
                  <path d="M0,-7 Q-18,-25 -32,-15" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 3" fill="none" className="animate-spray-1" />
                  {/* Center spray */}
                  <path d="M0,-7 Q0,-32 8,-20" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="2 2" fill="none" className="animate-spray-2" />
                  {/* Right spray arc */}
                  <path d="M0,-7 Q18,-25 32,-15" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 3" fill="none" className="animate-spray-3" />
                  
                  {/* Fine Mist particles */}
                  <circle cx="-20" cy="-18" r="2.5" fill="#e0f2fe" opacity="0.8" />
                  <circle cx="22" cy="-16" r="2.5" fill="#e0f2fe" opacity="0.8" />
                  <circle cx="0" cy="-28" r="2" fill="#bae6fd" opacity="0.9" />
                </g>
              )}
            </g>
          ))}

          {/* Relay Control Wire from AI Hub to Motor */}
          <path
            d="M740,180 Q400,160 165,300"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
            opacity="0.8"
          />
          <rect x="420" y="210" width="130" height="22" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
          <text x="485" y="224" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">
            ⚡ RELAY SIGNAL: {isMotorOn ? 'HIGH (1)' : 'LOW (0)'}
          </text>
        </svg>

        {/* Floating Interactive Tooltip / Hotspot Modal */}
        {activeHotspot && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  {activeHotspot === 'sensor' && '📡 Capacitive Soil Moisture Sensor Node'}
                  {activeHotspot === 'brain' && '🧠 KRISHI AI Autonomous Decision Hub'}
                  {activeHotspot === 'motor' && '⚡ High-Efficiency Irrigation Pump & Relay'}
                </h4>
                <button
                  onClick={() => setActiveHotspot(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {activeHotspot === 'sensor' && (
                <div className="text-xs text-slate-300 space-y-2">
                  <p><strong>Hardware Spec:</strong> Industrial RS485 / Capacitive v1.2 Soil Probe</p>
                  <p><strong>Depth Placement:</strong> 15cm root-zone layer</p>
                  <p><strong>Current Telemetry:</strong> Moisture: {telemetry.soilMoisture}% | Soil Temp: {telemetry.soilTemperature}°C</p>
                  <p><strong>Battery & Link:</strong> {telemetry.batteryVoltage}V | RSSI: {telemetry.signalDbm} dBm (LoRaWAN)</p>
                </div>
              )}

              {activeHotspot === 'brain' && (
                <div className="text-xs text-slate-300 space-y-2">
                  <p><strong>Agronomic Model:</strong> Multi-Variable Evapotranspiration + Rain Buffer Engine</p>
                  <p><strong>Current Status:</strong> {decision.title}</p>
                  <p><strong>Reasoning:</strong> {decision.reasoning}</p>
                </div>
              )}

              {activeHotspot === 'motor' && (
                <div className="text-xs text-slate-300 space-y-2">
                  <p><strong>Pump Rating:</strong> 1.5 HP Submersible Water Pump</p>
                  <p><strong>Flow Output:</strong> {telemetry.flowRateLpm} Liters / Minute</p>
                  <p><strong>Line Pressure:</strong> {telemetry.pipePressureBar} Bar</p>
                  <p><strong>Status:</strong> {isMotorOn ? '🟢 Running - Actively irrigating crop field' : '🔴 Standby - Solenoid closed'}</p>
                </div>
              )}

              <button
                onClick={() => setActiveHotspot(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Visual Legends */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px]">
        <div className="flex items-center space-x-2 text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">Active Irrigation Zone</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
          <span className="w-3 h-3 rounded-full bg-sky-400 shrink-0" />
          <span className="truncate">LoRa Sensor Pulse</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
          <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
          <span className="truncate">Optocoupled Relay Line</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
          <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
          <span className="truncate">Root Hydration Layer</span>
        </div>
      </div>
    </div>
  );
};
