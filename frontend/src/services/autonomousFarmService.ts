import { AIDecisionResult, DemoScenario, FarmNotification, SensorTelemetry } from '../types/autonomous';
import { FarmerProfile } from '../types';

export const SCENARIOS: Record<string, DemoScenario> = {
  scenario_normal: {
    id: 'scenario_normal',
    name: 'Scenario 1: Normal Soil Moisture (55%)',
    description: 'Soil moisture is in the healthy zone. Motor remains OFF.',
    soilMoisture: 55,
    soilTemp: 26,
    airTemp: 31,
    humidity: 62,
    tankLevel: 85,
    weatherCondition: 'Partly Cloudy',
    rainForecastHours: null,
    rainProbability: 10,
    expectedDecision: 'OPTIMAL_OFF',
    expectedMotor: false,
  },
  scenario_low_dry: {
    id: 'scenario_low_dry',
    name: 'Scenario 2: Low Soil Moisture (22%) — No Rain',
    description: 'Critical moisture deficit with dry forecast. KRISHI AI automatically starts irrigation.',
    soilMoisture: 22,
    soilTemp: 29,
    airTemp: 35,
    humidity: 42,
    tankLevel: 78,
    weatherCondition: 'Clear & Sunny',
    rainForecastHours: null,
    rainProbability: 5,
    expectedDecision: 'IRRIGATE_ON',
    expectedMotor: true,
  },
  scenario_low_rain: {
    id: 'scenario_low_rain',
    name: 'Scenario 3: Low Moisture (24%) — Rain in 3 Hours',
    description: 'Moisture is low but heavy rain is forecasted soon. KRISHI AI delays irrigation to save groundwater.',
    soilMoisture: 24,
    soilTemp: 25,
    airTemp: 28,
    humidity: 78,
    tankLevel: 70,
    weatherCondition: 'Overcast with Rain Clouds',
    rainForecastHours: 3,
    rainProbability: 85,
    expectedDecision: 'DELAY_RAIN',
    expectedMotor: false,
  },
  scenario_optimal: {
    id: 'scenario_optimal',
    name: 'Scenario 4: Optimal / Saturated (82%)',
    description: 'Soil has reached full hydration capacity. KRISHI AI stops irrigation and guards against root rot.',
    soilMoisture: 82,
    soilTemp: 24,
    airTemp: 29,
    humidity: 80,
    tankLevel: 92,
    weatherCondition: 'Clear Sky',
    rainForecastHours: null,
    rainProbability: 15,
    expectedDecision: 'EXCESS_OFF',
    expectedMotor: false,
  },
};

export const evaluateAIDecision = (
  moisture: number,
  rainHours: number | null,
  rainProb: number,
  profile?: FarmerProfile | null,
  language: string = 'en'
): AIDecisionResult => {
  const crop = profile?.primary_crop || 'Paddy / General Crop';
  const soilType = profile?.soil_type || 'Loamy Soil';
  const stage = profile?.current_crop_stage || 'Growth Stage';

  // Rule 4: Excess Saturation (> 75%)
  if (moisture > 75) {
    let reasoning = `Soil moisture is at ${moisture}%, exceeding field capacity for ${crop} in ${soilType}. Water motor is locked OFF to prevent root suffocation, fungal outbreaks, and nutrient leaching.`;
    if (language === 'te') {
      reasoning = `నేల తేమ ${moisture}% వద్ద ఉంది, ఇది ${crop} పంటకు గరిష్ట స్థాయిని మించింది. వేరు కుళ్లు తెగులు రాకుండా నీటి మోటార్ ఆఫ్ చేయబడింది.`;
    } else if (language === 'hi') {
      reasoning = `मिट्टी की नमी ${moisture}% है, जो ${crop} फसल के लिए बहुत अधिक है। जड़ों के सड़ने और फंगस से बचाव के लिए मोटर बंद कर दी गई है।`;
    }

    return {
      decision: 'EXCESS_OFF',
      motorState: false,
      title: '⚠️ Excess Moisture Alert — Motor Locked OFF',
      reasoning,
      ruleTriggered: 'RULE_4',
      recommendation: 'Ensure proper drainage furrows. No irrigation needed.',
      confidenceScore: 98,
      timestamp: new Date(),
    };
  }

  // Rule 2: Low Moisture (< 35%) BUT Rain expected soon (within 5 hours and prob >= 50%)
  const isRainImminent = (rainHours !== null && rainHours <= 5) || rainProb >= 60;
  if (moisture < 35 && isRainImminent) {
    const hoursText = rainHours !== null ? `in ${rainHours} hours` : 'soon';
    let reasoning = `🌧️ Rain is expected ${hoursText} (${rainProb}% probability). Although soil moisture is low (${moisture}%), KRISHI AI has decided to delay irrigation to save water and let nature replenish ${crop} (${stage}).`;
    if (language === 'te') {
      reasoning = `🌧️ ${rainHours ? `${rainHours} గంటల్లో` : 'త్వరలో'} వర్షం కురిసే అవకాశం ఉంది (${rainProb}% సంభావ్యత). నేల తేమ (${moisture}%) తగ్గినప్పటికీ, నీటిని ఆదా చేయడానికి కృషి AI మోటార్ ఆన్ చేయకుండా వేచి ఉండాలని నిర్ణయించింది.`;
    } else if (language === 'hi') {
      reasoning = `🌧️ अगले ${rainHours ? `${rainHours} घंटों` : 'कुछ समय'} में बारिश की संभावना है (${rainProb}%)। मिट्टी की नमी (${moisture}%) कम होने के बावजूद, भूजल और बिजली बचाने के लिए सिंचाई टाल दी गई है।`;
    }

    return {
      decision: 'DELAY_RAIN',
      motorState: false,
      title: '🌧️ Irrigation Delayed — Rain Forecast Detected',
      reasoning,
      ruleTriggered: 'RULE_2',
      estimatedWaterSavedLiters: 1450,
      recommendation: 'Natural precipitation will satisfy crop water demand. Holding motor in standby.',
      confidenceScore: 96,
      timestamp: new Date(),
    };
  }

  // Rule 1: Low Moisture (< 35%) AND No significant rain expected soon
  if (moisture < 35) {
    let reasoning = `💧 Soil moisture is low (${moisture}% < 35% critical threshold) and no rainfall is forecasted. KRISHI AI automatically initiated irrigation to protect ${crop} at ${stage}.`;
    if (language === 'te') {
      reasoning = `💧 నేల తేమ తగ్గింది (${moisture}%). రాబోయే సమయంలో వర్షం పడే అవకాశం లేకపోవడంతో, ${crop} పంట రక్షణ కోసం కృషి AI స్వయంచాలకంగా నీటి మోటార్‌ను ప్రారంభించింది.`;
    } else if (language === 'hi') {
      reasoning = `💧 मिट्टी की नमी गिरकर ${moisture}% हो गई है और बारिश की कोई संभावना नहीं है। ${crop} फसल को सूखने से बचाने के लिए कृषि AI ने स्वचालित रूप से मोटर चालू कर दी है।`;
    }

    return {
      decision: 'IRRIGATE_ON',
      motorState: true,
      title: '💧 Critical Low Moisture — Irrigation Started Automatically',
      reasoning,
      ruleTriggered: 'RULE_1',
      recommendation: 'Targeting 55% optimal root-zone saturation. Pumping at 42 L/min.',
      confidenceScore: 99,
      timestamp: new Date(),
    };
  }

  // Rule 3: Optimal / Sufficient Moisture (35% - 75%)
  let reasoning = `✅ Soil moisture is at an optimal ${moisture}% for ${crop} in ${soilType}. Crop transpiration and root absorption are balanced. Irrigation motor is OFF.`;
  if (language === 'te') {
    reasoning = `✅ నేల తేమ ${moisture}% వద్ద అనుకూలంగా ఉంది. ${crop} పంటకు సరిపడా నీరు ఉండటం వల్ల మోటార్ ఆఫ్ చేయబడింది.`;
  } else if (language === 'hi') {
    reasoning = `✅ मिट्टी की नमी ${moisture}% पर आदर्श है। ${crop} फसल के लिए पानी पर्याप्त है, इसलिए मोटर बंद रखी गई है।`;
  }

  return {
    decision: 'OPTIMAL_OFF',
    motorState: false,
    title: '✅ Optimal Soil Moisture — Irrigation Stopped',
    reasoning,
    ruleTriggered: 'RULE_3',
    recommendation: 'Soil is in prime condition. Telemetry continuously monitored.',
    confidenceScore: 97,
    timestamp: new Date(),
  };
};

export const INITIAL_NOTIFICATIONS: FarmNotification[] = [
  {
    id: 'n-1',
    timestamp: new Date(Date.now() - 35 * 60 * 1000),
    type: 'moisture',
    icon: '💧',
    title: 'Soil Telemetry Check',
    message: 'Soil moisture dropped to 24%. KRISHI AI analyzed farm conditions.',
    priority: 'medium',
  },
  {
    id: 'n-2',
    timestamp: new Date(Date.now() - 34 * 60 * 1000),
    type: 'ai_decision',
    icon: '🤖',
    title: 'Autonomous Irrigation Start',
    message: 'No significant rainfall expected soon. Irrigation started automatically.',
    priority: 'high',
  },
  {
    id: 'n-3',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    type: 'weather',
    icon: '🌧️',
    title: 'Rain Forecast Update',
    message: 'Rain detected in weather forecast. Irrigation stopped to save water.',
    priority: 'medium',
  },
  {
    id: 'n-4',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    type: 'system',
    icon: '✅',
    title: 'Optimal Moisture Target Met',
    message: 'Optimal soil moisture reached (56%). Motor safely turned OFF.',
    priority: 'low',
  },
];
