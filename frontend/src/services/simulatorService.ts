import api from './api';
import {
  SimulationInput,
  SimulationResponse,
  CropSimulationResult,
  SimulationAIInsightRequest,
  SimulationAIInsightResponse
} from '../types';

// Master Agronomic Profiles for instant client-side calculation & offline resilience
const CLIENT_CROPS_DB: Record<string, {
  name_en: string;
  name_te: string;
  category: string;
  water_req_mm: number;
  water_req_liters_per_acre: number;
  base_cost_per_acre: number;
  base_yield_quintal_per_acre: number;
  base_msp_per_quintal: number;
  drought_sensitivity: number;
  rain_delay_sensitivity: number;
  temp_sensitivity: number;
  preferred_soils: string[];
  min_water_threshold_pct: number;
}> = {
  Rice: {
    name_en: 'Rice (Paddy)',
    name_te: 'వరి (వరి సాగు)',
    category: 'Cereal / Paddy',
    water_req_mm: 1300,
    water_req_liters_per_acre: 5200000,
    base_cost_per_acre: 28000,
    base_yield_quintal_per_acre: 24.0,
    base_msp_per_quintal: 2300,
    drought_sensitivity: 0.95,
    rain_delay_sensitivity: 0.85,
    temp_sensitivity: 0.70,
    preferred_soils: ['Clay', 'Clay Loam', 'Black Cotton', 'Alluvial'],
    min_water_threshold_pct: 55.0,
  },
  Groundnut: {
    name_en: 'Groundnut (Peanut)',
    name_te: 'వేరుశనగ (పల్లీ)',
    category: 'Oilseed / Legume',
    water_req_mm: 550,
    water_req_liters_per_acre: 2200000,
    base_cost_per_acre: 22000,
    base_yield_quintal_per_acre: 14.5,
    base_msp_per_quintal: 6700,
    drought_sensitivity: 0.40,
    rain_delay_sensitivity: 0.45,
    temp_sensitivity: 0.50,
    preferred_soils: ['Red Loamy', 'Sandy Loam', 'Red Soil', 'Loamy'],
    min_water_threshold_pct: 30.0,
  },
  Millet: {
    name_en: 'Millet (Bajra / Ragi)',
    name_te: 'చిరుధాన్యాలు (సజ్జలు / రాగులు)',
    category: 'Nutri-Cereal / Millet',
    water_req_mm: 350,
    water_req_liters_per_acre: 1400000,
    base_cost_per_acre: 13500,
    base_yield_quintal_per_acre: 13.0,
    base_msp_per_quintal: 3200,
    drought_sensitivity: 0.15,
    rain_delay_sensitivity: 0.20,
    temp_sensitivity: 0.25,
    preferred_soils: ['Red Soil', 'Sandy Loam', 'Shallow Black', 'Red Loamy', 'Sandy'],
    min_water_threshold_pct: 15.0,
  },
  Maize: {
    name_en: 'Maize (Corn)',
    name_te: 'మొక్కజొన్న',
    category: 'Cereal / Feed',
    water_req_mm: 600,
    water_req_liters_per_acre: 2400000,
    base_cost_per_acre: 19500,
    base_yield_quintal_per_acre: 26.0,
    base_msp_per_quintal: 2225,
    drought_sensitivity: 0.55,
    rain_delay_sensitivity: 0.50,
    temp_sensitivity: 0.45,
    preferred_soils: ['Loamy', 'Clay Loam', 'Red Loamy', 'Black Cotton'],
    min_water_threshold_pct: 35.0,
  },
  Cotton: {
    name_en: 'Cotton (Bt Cotton)',
    name_te: 'ప్రత్తి (దూది)',
    category: 'Commercial Cash Crop',
    water_req_mm: 750,
    water_req_liters_per_acre: 3000000,
    base_cost_per_acre: 27000,
    base_yield_quintal_per_acre: 11.5,
    base_msp_per_quintal: 7120,
    drought_sensitivity: 0.65,
    rain_delay_sensitivity: 0.60,
    temp_sensitivity: 0.60,
    preferred_soils: ['Deep Black Cotton', 'Black Soil', 'Clay Loam'],
    min_water_threshold_pct: 40.0,
  },
  Tomato: {
    name_en: 'Tomato',
    name_te: 'టమోటా',
    category: 'Horticultural Vegetable',
    water_req_mm: 650,
    water_req_liters_per_acre: 2600000,
    base_cost_per_acre: 36000,
    base_yield_quintal_per_acre: 90.0,
    base_msp_per_quintal: 1400,
    drought_sensitivity: 0.75,
    rain_delay_sensitivity: 0.70,
    temp_sensitivity: 0.85,
    preferred_soils: ['Red Loamy', 'Sandy Loam', 'Well Drained Clay Loam'],
    min_water_threshold_pct: 45.0,
  },
};

/**
 * Calculates instant local client simulation for 0ms reactive slider response.
 */
export const calculateClientSimulation = (input: SimulationInput): SimulationResponse => {
  const waterPct = input.water_availability_pct;
  const rainDelay = input.rain_delay_days;
  const tempDelta = input.temp_delta_c;
  const marketDelta = input.market_price_delta_pct;
  const expectedRain = (input.expected_rainfall || 'Normal').toLowerCase();
  const acres = Math.max(0.5, input.farm_size_acres || 2.0);

  let rainConditionFactor = 1.0;
  if (expectedRain.includes('drought')) rainConditionFactor = 0.65;
  else if (expectedRain.includes('deficit')) rainConditionFactor = 0.82;
  else if (expectedRain.includes('excess')) rainConditionFactor = 1.05;

  const effectiveWaterPct = Math.min(100.0, waterPct * rainConditionFactor);

  const targetKeys = input.selected_crops && input.selected_crops.length >= 3
    ? input.selected_crops
    : ['Rice', 'Groundnut', 'Millet'];

  const results: CropSimulationResult[] = targetKeys.map((key) => {
    const cropKey = Object.keys(CLIENT_CROPS_DB).find(
      k => k.toLowerCase() === key.toLowerCase() || CLIENT_CROPS_DB[k].name_en.toLowerCase().includes(key.toLowerCase())
    ) || 'Rice';

    const info = CLIENT_CROPS_DB[cropKey] || CLIENT_CROPS_DB.Rice;

    // 1. Water impact
    let waterYieldFactor = 1.0;
    let waterStress = 'Sufficient';
    if (effectiveWaterPct >= 85.0) {
      waterYieldFactor = 1.0 + (effectiveWaterPct - 85.0) * 0.002;
      waterStress = 'Sufficient';
    } else if (effectiveWaterPct >= info.min_water_threshold_pct) {
      const deficitRatio = (85.0 - effectiveWaterPct) / (85.0 - info.min_water_threshold_pct);
      waterYieldFactor = 1.0 - (deficitRatio * info.drought_sensitivity * 0.65);
      waterStress = 'Moderate Stress';
    } else {
      const belowRatio = (info.min_water_threshold_pct - effectiveWaterPct) / Math.max(1.0, info.min_water_threshold_pct);
      waterYieldFactor = Math.max(0.12, (1.0 - info.drought_sensitivity * 0.65) - (belowRatio * 0.55));
      waterStress = 'Severe Deficit';
    }

    if (effectiveWaterPct > 95.0 && (cropKey === 'Millet' || cropKey === 'Groundnut')) {
      waterYieldFactor *= 0.92;
      waterStress = 'Excess Moisture Risk';
    }

    // 2. Rain delay
    const delayFactor = Math.max(0.50, 1.0 - (rainDelay / 60.0) * info.rain_delay_sensitivity * 0.50);

    // 3. Temp factor
    let tempFactor = 1.0;
    if (Math.abs(tempDelta) <= 1.0) {
      tempFactor = 1.0;
    } else if (tempDelta > 1.0) {
      tempFactor = Math.max(0.60, 1.0 - ((tempDelta - 1.0) / 4.0) * info.temp_sensitivity * 0.35);
    } else {
      tempFactor = Math.max(0.85, 1.0 - (Math.abs(tempDelta) - 1.0) * 0.03);
    }

    // 4. Soil factor
    let soilFactor = 1.0;
    const farmerSoil = (input.soil_type || '').toLowerCase();
    if (farmerSoil) {
      const isPref = info.preferred_soils.some(s => farmerSoil.includes(s.toLowerCase()) || s.toLowerCase().includes(farmerSoil));
      soilFactor = isPref ? 1.08 : 0.96;
    }

    const combinedYieldFactor = Math.max(0.10, waterYieldFactor * delayFactor * tempFactor * soilFactor);
    const simulatedYield = Math.round(info.base_yield_quintal_per_acre * combinedYieldFactor * 100) / 100;

    // 5. Cost
    let costSurge = 1.0;
    if (effectiveWaterPct < 60.0) costSurge += (60.0 - effectiveWaterPct) * 0.004;
    if (rainDelay > 20) costSurge += (rainDelay - 20) * 0.003;
    const costPerAcre = Math.round(info.base_cost_per_acre * costSurge);
    const totalCost = Math.round(costPerAcre * acres);

    // 6. Revenue & Profit
    const pricePerQuintal = info.base_msp_per_quintal * (1.0 + marketDelta / 100.0);
    const revPerAcre = Math.round(simulatedYield * pricePerQuintal);
    const totalRevenue = Math.round(revPerAcre * acres);
    const profitPerAcre = revPerAcre - costPerAcre;
    const totalProfit = totalRevenue - totalCost;
    const roiPct = Math.round((profitPerAcre / Math.max(1, costPerAcre)) * 1000) / 10;

    // 7. Suitability & Risk
    const suitabilityScore = Math.min(99, Math.max(5, Math.round(
      (waterYieldFactor * 0.50 + delayFactor * 0.25 + tempFactor * 0.25) * 100
    )));

    let riskPoints = 15;
    if (effectiveWaterPct < info.min_water_threshold_pct + 15) riskPoints += Math.round(info.drought_sensitivity * 45);
    if (rainDelay > 25) riskPoints += Math.round(info.rain_delay_sensitivity * 25);
    if (marketDelta < -15) riskPoints += Math.round(Math.abs(marketDelta) * 0.6);
    if (profitPerAcre < 5000) riskPoints += 30;
    if (totalCost > (input.budget || 60000)) riskPoints += 20;

    riskPoints = Math.max(10, Math.min(95, riskPoints));
    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = riskPoints < 38 ? 'LOW' : riskPoints < 68 ? 'MEDIUM' : 'HIGH';

    // 8. Overall AI score
    const profitNormalized = Math.max(0, Math.min(100, (profitPerAcre / 55000) * 100));
    const riskInversion = 100 - riskPoints;
    let rawAiScore = profitNormalized * 0.35 + suitabilityScore * 0.30 + riskInversion * 0.25 + 10;
    if (profitPerAcre <= 0) rawAiScore = Math.min(35, rawAiScore * 0.5);
    const overallAiScore = Math.min(98, Math.max(10, Math.round(rawAiScore)));

    const factors: string[] = [];
    if (waterStress === 'Sufficient') factors.push('💧 Ample moisture for optimal yield');
    else if (waterStress === 'Moderate Stress') factors.push('⚠️ Requires micro-irrigation / AWD');
    else if (waterStress === 'Severe Deficit') factors.push('🚨 High drought stress: Heavy yield drop');

    if (rainDelay > 20) factors.push(`⏳ ${rainDelay}d rain delay disrupts sowing`);
    else factors.push('⏱️ Favorable sowing window');

    if (marketDelta > 10) factors.push(`📈 Market boom (+${marketDelta}%)`);
    else if (marketDelta < -10) factors.push(`📉 Market slump (${marketDelta}%)`);

    let advice = 'Maintain balanced soil nutrition and weed control.';
    if (cropKey === 'Rice') {
      advice = effectiveWaterPct < 60
        ? 'Critical water deficit for rice. Switch to AWD or consider shifting to drought-hardy Groundnut/Millet.'
        : 'Favorable paddy moisture. Maintain shallow standing water during tillering.';
    } else if (cropKey === 'Groundnut') {
      advice = effectiveWaterPct < 40
        ? 'Apply life-saving sprinkler irrigation at flowering & pegging stages.'
        : 'High profit stability and moderate water requirements. Apply gypsum at 45 days.';
    } else if (cropKey === 'Millet') {
      advice = 'Extremely drought resilient. Guaranteed minimal input cost and high resilience against rain delay.';
    }

    return {
      crop_name: info.name_en,
      crop_name_te: info.name_te,
      category: info.category,
      water_requirement_mm: info.water_req_mm,
      water_requirement_liters: info.water_req_liters_per_acre,
      weather_suitability_pct: suitabilityScore,
      risk_level: riskLevel,
      risk_score: riskPoints,
      estimated_cost_per_acre: costPerAcre,
      total_cost: totalCost,
      estimated_yield_quintals_per_acre: simulatedYield,
      estimated_revenue_per_acre: revPerAcre,
      total_revenue: totalRevenue,
      estimated_profit_per_acre: profitPerAcre,
      total_profit: totalProfit,
      roi_pct: roiPct,
      overall_ai_score: overallAiScore,
      key_factors: factors,
      agronomic_advice: advice,
      water_stress_status: waterStress,
      is_best_choice: false,
    };
  });

  results.sort((a, b) => b.overall_ai_score - a.overall_ai_score);
  const best = results[0];
  best.is_best_choice = true;

  const isTelugu = (input.language || '').toLowerCase().includes('te');
  let reasoning = '';
  if (isTelugu) {
    if (waterPct < 55) {
      reasoning = `${best.crop_name_te} ఉత్తమ ఎంపిక. మీ ప్రాంతంలో నీటి లభ్యత (${waterPct}%) పరిమితంగా ఉన్నందున ఇది తక్కువ నీటితో అధిక నికర లాభం (₹${best.total_profit.toLocaleString()}) మరియు తక్కువ రిస్క్ అందిస్తుంది.`;
    } else if (rainDelay > 25) {
      reasoning = `${best.crop_name_te} సిఫార్సు చేయబడింది. వర్షాలు ${rainDelay} రోజులు ఆలస్యమైనప్పటికీ, ఈ పంట ఆలస్య విత్తుకోవడానికి తట్టుకుని స్థిరమైన దిగుబడిని ఇస్తుంది.`;
    } else {
      reasoning = `${best.crop_name_te} అత్యుత్తమ రాబడిని (AI స్కోర్: ${best.overall_ai_score}/100) ప్రస్తుత మార్కెట్ మరియు నేల పరిస్థితులలో అందిస్తుంది.`;
    }
  } else {
    if (waterPct < 55) {
      reasoning = `${best.crop_name} is the best option because your area has limited water availability (${waterPct}%) and the current simulated conditions favor drought-resilient crops with superior profit (₹${best.total_profit.toLocaleString()}).`;
    } else if (rainDelay > 25) {
      reasoning = `${best.crop_name} is recommended as it strongly withstands the ${rainDelay}-day rain delay with minimal pest and yield penalty compared to moisture-dependent cereals.`;
    } else if (marketDelta > 15) {
      reasoning = `${best.crop_name} maximizes returns on the simulated market price boom (+${marketDelta}%), projecting ₹${best.total_profit.toLocaleString()} total profit.`;
    } else {
      reasoning = `${best.crop_name} delivers the highest composite AI suitability score (${best.overall_ai_score}/100) for your farm soil, water capacity, and budget.`;
    }
  }

  return {
    results,
    best_recommendation: best,
    recommendation_summary: `🏆 ${isTelugu ? 'అత్యుత్తమ ఎంపిక' : 'Best Recommendation'}: ${best.crop_name} (₹${best.total_profit.toLocaleString()} ${isTelugu ? 'లాభం' : 'Profit'} • ${best.risk_level} Risk)`,
    recommendation_reasoning: reasoning,
    simulation_input: input,
    disclaimer: 'Results are AI estimates and agronomic models based on regional agro-climatic benchmarks, not guaranteed returns.',
  };
};

export const simulatorService = {
  /**
   * Run simulation via Backend API with seamless instant fallback to client-side engine.
   */
  simulateFarm: async (input: SimulationInput): Promise<SimulationResponse> => {
    try {
      const res = await api.post<SimulationResponse>('/api/simulator/simulate', input);
      return res.data;
    } catch (err) {
      console.warn('Backend simulator API note, using fast client agronomic engine:', err);
      return calculateClientSimulation(input);
    }
  },

  /**
   * Get Deep AI Strategic Insight using LLM + RAG.
   */
  getSimulationAIInsight: async (payload: SimulationAIInsightRequest): Promise<SimulationAIInsightResponse> => {
    try {
      const res = await api.post<SimulationAIInsightResponse>('/api/simulator/ai-insight', payload);
      return res.data;
    } catch (err) {
      console.warn('AI insight API note, generating local strategy:', err);
      const isTe = (payload.language || '').includes('te');
      return {
        ai_insight: isTe
          ? `${payload.best_crop_name} సాగుకు ప్రణాళిక: 1. విత్తన శుద్ధి తప్పనిసరిగా చేయండి. 2. బిందు సేద్యం (డ్రిప్) ద్వారా నీటిని 35% పొదుపు చేయండి. 3. స్థానిక e-NAM లేదా FPO ద్వారా గిట్టుబాటు ధరకు విక్రయించండి.`
          : `Strategic Plan for ${payload.best_crop_name}:\n1. Seed Inoculation: Use bio-priming to strengthen root establishment against early moisture stress.\n2. Micro-Irrigation: Apply drip or alternate furrow irrigation to save up to 35% water.\n3. Direct FPO Linkage: Pre-book sale contracts to mitigate spot market volatility.`,
        strategic_advice: [
          'Pre-treat seeds with bio-fertilizers (Rhizobium / PSB)',
          'Adopt precision furrow or drip irrigation to reduce diesel/electricity bills',
          'Deploy yellow sticky and pheromone traps early in the vegetative phase'
        ],
        water_saving_tactics: [
          'Organic mulching using crop residue to retain soil moisture during heat spikes',
          'Irrigate in cooler evening hours to slash evaporative loss',
          'Construct field percolation trenches to harvest sudden downpours'
        ],
        market_risk_mitigation: [
          'Register on e-NAM digital mandis for multi-trader bidding',
          'Store harvest in WDRA accredited warehouses with warehouse receipt loans',
          'Form farmer clusters to procure bulk inputs at wholesale discounts'
        ]
      };
    }
  },

  /**
   * Fetch available crops.
   */
  getAvailableCrops: async () => {
    try {
      const res = await api.get('/api/simulator/crops');
      return res.data.crops;
    } catch (err) {
      return Object.entries(CLIENT_CROPS_DB).map(([key, data]) => ({
        key,
        name: data.name_en,
        name_te: data.name_te,
        category: data.category,
        water_requirement_mm: data.water_req_mm,
        base_cost_per_acre: data.base_cost_per_acre,
        base_yield_quintal_per_acre: data.base_yield_quintal_per_acre,
        base_msp_per_quintal: data.base_msp_per_quintal,
        preferred_soils: data.preferred_soils
      }));
    }
  }
};
