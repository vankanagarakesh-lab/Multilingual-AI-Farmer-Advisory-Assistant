import React from 'react';
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  CloudSun, 
  Activity, 
  Wifi, 
  BatteryCharging, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { SensorTelemetry } from '../../types/autonomous';
import { useLanguage } from '../../context/LanguageContext';

interface LiveSensorPanelProps {
  telemetry: SensorTelemetry;
}

export const LiveSensorPanel: React.FC<LiveSensorPanelProps> = ({ telemetry }) => {
  const { t } = useLanguage();

  const getMoistureBadge = (moisture: number) => {
    if (moisture < 35) {
      return { text: 'Low / Dry', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    }
    if (moisture <= 75) {
      return { text: 'Optimal', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
    return { text: 'Saturated', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  };

  const moistureBadge = getMoistureBadge(telemetry.soilMoisture);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
              {t('auto_farm.live_sensor_data', 'Live Sensor Data')}
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                1. LIVE TELEMETRY
              </span>
            </h3>
            <p className="text-xs text-slate-400">Real-time IoT wireless mesh telemetry feed (ESP32 & LoRa)</p>
          </div>
        </div>

        {/* Online Status Pill */}
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-300 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{t('auto_farm.online', 'Sensor Status: Online')}</span>
        </div>
      </div>

      {/* Sensor Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* 1. SOIL MOISTURE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('auto_farm.soil_moisture', 'Soil Moisture')}
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Droplets className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-black tracking-tight ${
              telemetry.soilMoisture < 35 
                ? 'text-rose-400' 
                : telemetry.soilMoisture <= 75 
                ? 'text-emerald-400' 
                : 'text-blue-400'
            }`}>
              {telemetry.soilMoisture}%
            </span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${moistureBadge.color}`}>
              {moistureBadge.text}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                telemetry.soilMoisture < 35 
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500' 
                  : telemetry.soilMoisture <= 75 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : 'bg-gradient-to-r from-blue-500 to-sky-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, telemetry.soilMoisture))}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Critical &lt; 35%</span>
            <span>Target: 55-65%</span>
          </p>
        </div>

        {/* 2. SOIL TEMPERATURE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('auto_farm.soil_temp', 'Soil Temp')}
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100 tracking-tight">
              {telemetry.soilTemperature}°C
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Root Depth (15cm)
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(telemetry.soilTemperature / 45) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Root Microbial Zone</span>
            <span className="text-emerald-400 font-medium">Optimal</span>
          </p>
        </div>

        {/* 3. AIR TEMPERATURE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('auto_farm.air_temp', 'Air Temp')}
            </span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <CloudSun className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100 tracking-tight">
              {telemetry.airTemperature}°C
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Ambient
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${(telemetry.airTemperature / 50) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Evaporation Index: Moderate</span>
          </p>
        </div>

        {/* 4. HUMIDITY */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('auto_farm.humidity', 'Humidity')}
            </span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <Wind className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100 tracking-tight">
              {telemetry.airHumidity}%
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              RH
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${telemetry.airHumidity}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Vapor Pressure Deficit</span>
            <span className="text-teal-400">Stable</span>
          </p>
        </div>

        {/* 5. WATER TANK LEVEL */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-slate-700 transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('auto_farm.tank_level', 'Water Tank')}
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-100 tracking-tight">
              {telemetry.waterTankLevel}%
            </span>
            <span className="text-[10px] font-bold text-indigo-300 uppercase px-1.5 py-0.5 rounded bg-indigo-500/20">
              {telemetry.waterTankLevel > 20 ? 'Sufficient' : 'Refill Low'}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${telemetry.waterTankLevel}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Reservoir Storage</span>
            <span>~4,200 Liters</span>
          </p>
        </div>
      </div>

      {/* Hardware Link Diagnostics Banner */}
      <div className="flex flex-wrap items-center justify-between bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Wifi className="w-3.5 h-3.5" />
            LoRa Mesh (RSSI: {telemetry.signalDbm} dBm)
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
            Solar Battery: {telemetry.batteryVoltage}V (98%)
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Sampling: 2.0 sec cycle
          </span>
        </div>
        <div className="text-[11px] text-slate-400 italic">
          Values dynamically calibrate to live ambient farm conditions
        </div>
      </div>
    </div>
  );
};
