export type SoilType = 'black' | 'red' | 'alluvial' | 'sandy' | 'clay' | 'loamy';

export interface SensorTelemetry {
  soilMoisture: number; // 0 - 100%
  soilTemperature: number; // in °C
  airTemperature: number; // in °C
  airHumidity: number; // in %
  waterTankLevel: number; // 0 - 100%
  sensorStatus: 'online' | 'offline' | 'calibrating';
  batteryVoltage: number; // e.g. 4.15 V
  signalDbm: number; // e.g. -64 dBm
  lastPing: Date;
  pumpState: boolean;
  flowRateLpm: number; // e.g. 42 L/min
  pipePressureBar: number; // e.g. 2.8 Bar
}

export type DecisionType = 'IRRIGATE_ON' | 'DELAY_RAIN' | 'OPTIMAL_OFF' | 'EXCESS_OFF';

export interface AIDecisionResult {
  decision: DecisionType;
  motorState: boolean;
  title: string;
  reasoning: string;
  ruleTriggered: 'RULE_1' | 'RULE_2' | 'RULE_3' | 'RULE_4';
  estimatedWaterSavedLiters?: number;
  recommendation: string;
  confidenceScore: number;
  timestamp: Date;
}

export interface FarmNotification {
  id: string;
  timestamp: Date;
  type: 'moisture' | 'ai_decision' | 'weather' | 'motor' | 'system';
  icon: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  isNew?: boolean;
}

export type DemoScenarioId = 'scenario_normal' | 'scenario_low_dry' | 'scenario_low_rain' | 'scenario_optimal';

export interface DemoScenario {
  id: DemoScenarioId;
  name: string;
  description: string;
  soilMoisture: number;
  soilTemp: number;
  airTemp: number;
  humidity: number;
  tankLevel: number;
  weatherCondition: string;
  rainForecastHours: number | null; // null = no rain in 7 days
  rainProbability: number;
  expectedDecision: DecisionType;
  expectedMotor: boolean;
}

export interface DemoStep {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  badge: string;
  durationMs: number;
}
