import React, { useState } from 'react';
import { 
  Radio, 
  Cpu, 
  Server, 
  Sparkles, 
  Zap, 
  Droplets, 
  ArrowRight, 
  ArrowDown, 
  Info, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  Code
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const HardwareArchitectureSection: React.FC = () => {
  const { t } = useLanguage();
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  const hardwareNodes = [
    {
      id: 1,
      title: 'Soil Moisture Sensor',
      tech: 'Capacitive v1.2 / RS485 Probe',
      icon: <Radio className="w-5 h-5 text-sky-400" />,
      desc: 'Corrosion-resistant capacitive sensor measuring volumetric water content & soil temp at 15cm root-depth.',
      spec: 'Analog 0-3.3V / Modbus RS485 • ±2% accuracy',
      pin: 'ADC Pin GPIO34 (ESP32)',
    },
    {
      id: 2,
      title: 'ESP32 / IoT Controller',
      tech: 'Dual-Core Tensilica Xtensa 240MHz',
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      desc: 'Edge microcontroller with LoRaWAN (868/915 MHz) & WiFi telemetry publishing every 10 seconds.',
      spec: 'MQTT Client over TLS 1.3 • Solar LiFePO4 battery',
      pin: 'UART2 (LoRa) & GPIO26 (Relay Out)',
    },
    {
      id: 3,
      title: 'KRISHI AI Backend',
      tech: 'FastAPI + MQTT + WebSockets',
      icon: <Server className="w-5 h-5 text-indigo-400" />,
      desc: 'High-throughput telemetry ingestion pipeline synchronizing sensor events with live weather services.',
      spec: 'Open-Meteo Satellite Radar + PostGIS soil maps',
      pin: 'REST API /api/v1/telemetry & WSS stream',
    },
    {
      id: 4,
      title: 'AI Decision Engine',
      tech: 'Multi-Variable Agronomic Model',
      icon: <Sparkles className="w-5 h-5 text-teal-400" />,
      desc: 'Deep decision engine computing evapotranspiration deficit against upcoming rainfall radar probabilities.',
      spec: 'Sub-second rule evaluation • RAG Knowledge integration',
      pin: 'Autonomous Closed-Loop Control',
    },
    {
      id: 5,
      title: 'Relay Module',
      tech: '5V Optocoupler Solid-State Relay',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      desc: 'Optically isolated switching circuit with optical flyback diode safety protection against inductive surges.',
      spec: 'AC 250V / 10A • 30A Inrush Contactor',
      pin: 'Control Signal: Active High (3.3V / 5V)',
    },
    {
      id: 6,
      title: 'Water Motor / Pump',
      tech: '3-Phase Submersible Agricultural Pump',
      icon: <Droplets className="w-5 h-5 text-blue-400" />,
      desc: 'High-efficiency 1.5 HP - 5 HP irrigation pump feeding drip emitters, sprinklers, or flood gates.',
      spec: 'Flow: 45-200 L/min • Head: 35 Meters',
      pin: 'Single / Three-Phase Power Line',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-indigo-900/40">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base md:text-lg tracking-tight">
                {t('auto_farm.hardware_arch', 'FUTURE REAL HARDWARE INTEGRATION')}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                8. SYSTEM ARCHITECTURE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Complete hardware-to-cloud topology blueprint for physical field deployment
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4" />
          <span>Production-Ready ESP32 Schematic</span>
        </div>
      </div>

      {/* Mandatory Hackathon Simulation Disclaimer Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-teal-950/60 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-lg flex items-start space-x-3.5">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            Hackathon Demonstration Note
          </h4>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            “Current version is a software simulation for hackathon demonstration. The architecture is designed for future integration with real ESP32 sensors, relay modules and water pumps.”
          </p>
        </div>
      </div>

      {/* 6-Node Architecture Flow Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 relative">
        {hardwareNodes.map((node, index) => {
          const isSelected = selectedNode === node.id;

          return (
            <div key={node.id} className="relative flex flex-col justify-between">
              {/* Node Card */}
              <button
                type="button"
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
                className={`w-full h-full p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-slate-800 border-indigo-500 shadow-xl shadow-indigo-950/50 ring-1 ring-indigo-400'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-slate-700 shadow-sm">
                      {node.icon}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      0{node.id}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-100 group-hover:text-white leading-tight mb-1">
                    {node.title}
                  </h5>
                  <p className="text-[10px] font-semibold text-emerald-400/90 mb-2">
                    {node.tech}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {node.desc}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500">
                    <span className="truncate">{node.pin}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Arrow indicator between nodes on larger screens */}
              {index < hardwareNodes.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-400 pointer-events-none">
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Node Specification Drawer */}
      {selectedNode !== null && (
        <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 animate-in fade-in duration-200">
          {(() => {
            const node = hardwareNodes.find((n) => n.id === selectedNode);
            if (!node) return null;
            return (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-bold text-white text-sm">{node.title} Specification</h5>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {node.tech}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{node.desc}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                    <strong>Electrical:</strong> {node.spec}
                  </div>
                  <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-emerald-400 font-mono">
                    <strong>Pinout:</strong> {node.pin}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
