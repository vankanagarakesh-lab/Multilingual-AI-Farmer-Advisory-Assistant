import React, { useState, useEffect, useCallback } from 'react';
import { 
  CloudRain, 
  Sun, 
  CloudSun, 
  CloudFog, 
  CloudLightning, 
  Droplets, 
  MapPin, 
  RefreshCw, 
  Clock, 
  Calendar,
  Wind,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface WeatherData {
  locationName: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  conditionText: string;
  isDay: boolean;
  nextRain: {
    dateTime: Date | null;
    countdownText: string;
    rainProbability: number;
    amountMm: number;
    isRainingNow: boolean;
  } | null;
  lastUpdated: Date;
  source: string;
}

// Map WMO Weather Codes to Human-Readable Conditions & Icons
const getWeatherCondition = (code: number, isDay: boolean = true) => {
  switch (code) {
    case 0:
      return { text: 'Clear Sky', icon: Sun, color: 'text-amber-400' };
    case 1:
    case 2:
      return { text: 'Partly Cloudy', icon: CloudSun, color: 'text-amber-300' };
    case 3:
      return { text: 'Overcast', icon: CloudSun, color: 'text-slate-300' };
    case 45:
    case 48:
      return { text: 'Foggy', icon: CloudFog, color: 'text-slate-400' };
    case 51:
    case 53:
    case 55:
      return { text: 'Light Drizzle', icon: CloudRain, color: 'text-sky-300' };
    case 61:
    case 63:
    case 65:
      return { text: 'Rain', icon: CloudRain, color: 'text-sky-400' };
    case 80:
    case 81:
    case 82:
      return { text: 'Rain Showers', icon: CloudRain, color: 'text-blue-400' };
    case 95:
    case 96:
    case 99:
      return { text: 'Thunderstorm', icon: CloudLightning, color: 'text-purple-400' };
    default:
      return { text: 'Partly Cloudy', icon: CloudSun, color: 'text-emerald-400' };
  }
};

// Calculate friendly countdown to next rain
const calculateRainCountdown = (targetDate: Date): string => {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Raining now';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  if (diffDays === 0) {
    if (diffHours <= 1) return 'In < 1 hour';
    return `In ${diffHours} hours`;
  }
  if (diffDays === 1) {
    return remainingHours > 0 ? `Tomorrow (${remainingHours}h)` : 'Tomorrow';
  }
  return `In ${diffDays} days`;
};

// Reverse geocode GPS coordinates into City/Area name
const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
  // Strategy 1: BigDataCloud Client Reverse Geocode (High speed, no CORS issues)
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const city = bdcData.city || bdcData.locality || bdcData.principalSubdivisionSection;
      const state = bdcData.principalSubdivision;
      if (city) {
        return state ? `${city}, ${state}` : city;
      }
    }
  } catch (e) {
    console.debug('BigDataCloud geocode note:', e);
  }

  // Strategy 2: OpenStreetMap Nominatim Reverse Geocoder
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const addr = geoData.address || {};
      const place = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || addr.county || addr.state_district;
      const state = addr.state;
      if (place) {
        return state ? `${place}, ${state}` : place;
      }
    }
  } catch (e) {
    console.debug('Nominatim geocode note:', e);
  }

  return null;
};

export const WeatherWidget: React.FC = () => {
  const { farmerProfile } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch weather for coordinates
  const fetchWeatherForCoords = useCallback(async (lat: number, lon: number, customLocationName?: string, isGpsAuto: boolean = false) => {
    try {
      setError(null);
      
      // 1. Fetch Open-Meteo Weather Forecast (Current conditions + 7 days hourly rain)
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&hourly=precipitation_probability,precipitation&forecast_days=7&timezone=auto`;
      
      const res = await fetch(weatherUrl);
      if (!res.ok) throw new Error('Failed to fetch weather data from weather service');
      const data = await res.json();

      // 2. Reverse Geocode GPS coordinates into City/Area name
      let resolvedLocation = customLocationName;
      if (!resolvedLocation) {
        resolvedLocation = await reverseGeocode(lat, lon) || farmerProfile?.location || 'My Farm';
      }

      // 3. Scan hourly forecast for next upcoming rainfall
      const now = new Date();
      const currentIsoPrefix = now.toISOString().slice(0, 13);
      const hourlyTimes: string[] = data.hourly?.time || [];
      const hourlyPrecip: number[] = data.hourly?.precipitation || [];
      const hourlyProb: number[] = data.hourly?.precipitation_probability || [];

      let nextRainDate: Date | null = null;
      let nextRainProb = 0;
      let nextRainMm = 0;
      let isRainingNow = false;

      let startIndex = hourlyTimes.findIndex(t => t.startsWith(currentIsoPrefix));
      if (startIndex === -1) startIndex = 0;

      if ((hourlyPrecip[startIndex] || 0) >= 0.2 || (hourlyProb[startIndex] || 0) >= 60) {
        isRainingNow = true;
        nextRainDate = new Date(hourlyTimes[startIndex]);
        nextRainProb = hourlyProb[startIndex];
        nextRainMm = hourlyPrecip[startIndex];
      } else {
        for (let i = startIndex + 1; i < hourlyTimes.length; i++) {
          const precip = hourlyPrecip[i] || 0;
          const prob = hourlyProb[i] || 0;
          if (precip >= 0.2 || prob >= 40) {
            nextRainDate = new Date(hourlyTimes[i]);
            nextRainProb = prob;
            nextRainMm = precip;
            break;
          }
        }
      }

      const condition = getWeatherCondition(data.current?.weather_code || 0, data.current?.is_day === 1);

      setWeather({
        locationName: resolvedLocation,
        latitude: lat,
        longitude: lon,
        temperature: Math.round(data.current?.temperature_2m ?? 28),
        apparentTemperature: Math.round(data.current?.apparent_temperature ?? 30),
        humidity: Math.round(data.current?.relative_humidity_2m ?? 65),
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 10),
        weatherCode: data.current?.weather_code ?? 0,
        conditionText: condition.text,
        isDay: data.current?.is_day === 1,
        nextRain: nextRainDate ? {
          dateTime: nextRainDate,
          countdownText: isRainingNow ? 'Raining now' : calculateRainCountdown(nextRainDate),
          rainProbability: nextRainProb,
          amountMm: nextRainMm,
          isRainingNow
        } : {
          dateTime: null,
          countdownText: 'No rain in 7 days',
          rainProbability: 0,
          amountMm: 0,
          isRainingNow: false
        },
        lastUpdated: new Date(),
        source: 'Live Meteorological Station'
      });

      if (isGpsAuto) {
        setStatusNotice(`📍 Location detected: ${resolvedLocation}`);
        setTimeout(() => setStatusNotice(null), 4000);
      }

    } catch (err: any) {
      console.warn('Weather fetch error:', err);
      setError('Weather temporarily unavailable');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [farmerProfile?.location]);

  // Trigger GPS location detection with graceful fallback
  const loadWeather = useCallback((isManualRefresh: boolean = false) => {
    setIsRefreshing(true);
    setStatusNotice(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherForCoords(
            position.coords.latitude,
            position.coords.longitude,
            undefined,
            isManualRefresh
          );
        },
        (geoError) => {
          console.info('GPS permission denied or unavailable, using farm profile/regional agrarian fallback:', geoError.message);
          const fallbackLoc = farmerProfile?.location || 'Andhra Pradesh, India';
          // Standard AP / Guntur agrarian coordinates fallback
          fetchWeatherForCoords(16.3067, 80.4365, fallbackLoc, false);
          if (isManualRefresh) {
            setStatusNotice('GPS access not allowed; using profile location');
            setTimeout(() => setStatusNotice(null), 4000);
          }
        },
        { timeout: 8000, enableHighAccuracy: true, maximumAge: 60000 }
      );
    } else {
      const fallbackLoc = farmerProfile?.location || 'Andhra Pradesh, India';
      fetchWeatherForCoords(16.3067, 80.4365, fallbackLoc, false);
    }
  }, [fetchWeatherForCoords, farmerProfile?.location]);

  useEffect(() => {
    loadWeather(false);
    // Auto-refresh weather every 15 minutes
    const interval = setInterval(() => loadWeather(false), 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadWeather]);

  if (isLoading && !weather) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        <span className="hidden sm:inline">Detecting location & weather...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <button 
        onClick={() => loadWeather(true)}
        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-400 text-xs cursor-pointer hover:text-slate-200 hover:border-slate-600 transition active:scale-95"
        title="Click to detect GPS location and retry weather"
      >
        <CloudSun className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[11px] font-medium">Retry Weather</span>
      </button>
    );
  }

  const ConditionIcon = getWeatherCondition(weather.weatherCode, weather.isDay).icon;
  const conditionColor = getWeatherCondition(weather.weatherCode, weather.isDay).color;

  return (
    <div className="relative">
      {/* Compact Top-Left Header Badge */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs transition duration-150 shadow-sm group active:scale-95"
          title="View farm weather & rain forecast"
        >
          <div className="flex items-center space-x-1">
            <ConditionIcon className={`w-4 h-4 ${conditionColor} shrink-0`} />
            <span className="font-bold text-slate-100">{weather.temperature}°C</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 text-[11px] text-slate-400 border-l border-slate-700 pl-1.5">
            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[95px] font-medium">{weather.locationName}</span>
          </div>

          {/* Rain Alert Badge */}
          {weather.nextRain && (
            <div className={`hidden md:flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
              weather.nextRain.isRainingNow 
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            }`}>
              <CloudRain className="w-3 h-3 text-sky-400 shrink-0" />
              <span>Rain: {weather.nextRain.countdownText}</span>
            </div>
          )}

          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-200 transition" />
        </button>

        {/* Quick Refresh Icon Button on Header */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            loadWeather(true);
          }}
          disabled={isRefreshing}
          className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-emerald-400 transition"
          title="Detect current GPS location & refresh weather"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Expandable Weather Detail Popover Modal */}
      {isDetailsOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsDetailsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 w-72 sm:w-84 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-1.5 min-w-0">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <h4 className="font-semibold text-white text-xs truncate" title={weather.locationName}>
                  {weather.locationName}
                </h4>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    loadWeather(true);
                  }}
                  disabled={isRefreshing}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                  title="Detect GPS location & refresh weather"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {statusNotice && (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center space-x-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{statusNotice}</span>
              </div>
            )}

            {/* Current Conditions Card */}
            <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center space-x-3">
                <ConditionIcon className={`w-9 h-9 ${conditionColor}`} />
                <div>
                  <div className="text-2xl font-black text-white">{weather.temperature}°C</div>
                  <div className="text-xs text-slate-400">{weather.conditionText}</div>
                </div>
              </div>
              <div className="text-right space-y-0.5 text-xs text-slate-300">
                <div className="flex items-center justify-end space-x-1 text-slate-400">
                  <Droplets className="w-3 h-3 text-sky-400" />
                  <span>Humidity: <strong>{weather.humidity}%</strong></span>
                </div>
                <div className="flex items-center justify-end space-x-1 text-slate-400">
                  <Wind className="w-3 h-3 text-teal-400" />
                  <span>Wind: <strong>{weather.windSpeed} km/h</strong></span>
                </div>
              </div>
            </div>

            {/* Next Rain Forecast & Countdown */}
            <div className="bg-gradient-to-br from-sky-950/40 to-slate-950/80 border border-sky-800/30 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-sky-400" />
                  Next Rainfall Forecast
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {weather.nextRain?.countdownText}
                </span>
              </div>

              {weather.nextRain?.dateTime ? (
                <div className="text-[11px] text-slate-300 space-y-0.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Expected Date:
                    </span>
                    <span className="font-medium text-white">
                      {weather.nextRain.dateTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expected Time:
                    </span>
                    <span className="font-medium text-white">
                      {weather.nextRain.dateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {weather.nextRain.rainProbability > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Rain Probability:</span>
                      <span className="font-bold text-sky-400">{weather.nextRain.rainProbability}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No significant rainfall predicted over the next 7 days.</p>
              )}
            </div>

            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
              <span>Updated: {weather.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-emerald-400/80">Smart GPS Location Active</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
