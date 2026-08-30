import math
import logging
from typing import List, Dict, Any, Optional
from app.schemas.simulator import (
    SimulationInput,
    CropSimulationResult,
    SimulationResponse,
    SimulationAIInsightRequest,
    SimulationAIInsightResponse
)
from app.ai import get_ai_provider
from app.knowledge.retrieval.knowledge_service import retrieve_agricultural_context

logger = logging.getLogger(__name__)

# Master Agronomic Database for Indian Agricultural Ecosystem
CROPS_DATABASE: Dict[str, Dict[str, Any]] = {
    "Rice": {
        "name_en": "Rice (Paddy)",
        "name_te": "వరి (వరి సాగు)",
        "category": "Cereal / Paddy",
        "water_req_mm": 1300,            # 1200 - 1400 mm
        "water_req_liters_per_acre": 5200000,
        "base_cost_per_acre": 28000,      # In INR
        "base_yield_quintal_per_acre": 24.0,
        "base_msp_per_quintal": 2300,     # MSP / Mandi Avg Price
        "drought_sensitivity": 0.95,      # Extremely sensitive to water deficit
        "rain_delay_sensitivity": 0.85,   # High nursery/transplanting delay stress
        "optimal_temp_min": 20,
        "optimal_temp_max": 34,
        "temp_sensitivity": 0.70,
        "preferred_soils": ["Clay", "Clay Loam", "Black Cotton", "Alluvial"],
        "min_water_threshold_pct": 55.0,  # Below this, rice suffers catastrophic yield failure
    },
    "Groundnut": {
        "name_en": "Groundnut (Peanut)",
        "name_te": "వేరుశనగ (పల్లీ)",
        "category": "Oilseed / Legume",
        "water_req_mm": 550,              # 500 - 600 mm
        "water_req_liters_per_acre": 2200000,
        "base_cost_per_acre": 22000,
        "base_yield_quintal_per_acre": 14.5,
        "base_msp_per_quintal": 6700,
        "drought_sensitivity": 0.40,      # Moderate drought tolerance
        "rain_delay_sensitivity": 0.45,
        "optimal_temp_min": 22,
        "optimal_temp_max": 32,
        "temp_sensitivity": 0.50,
        "preferred_soils": ["Red Loamy", "Sandy Loam", "Red Soil", "Loamy"],
        "min_water_threshold_pct": 30.0,
    },
    "Millet": {
        "name_en": "Millet (Pearl / Finger / Foxtail)",
        "name_te": "చిరుధాన్యాలు (సజ్జలు / రాగులు / కొర్రలు)",
        "category": "Nutri-Cereal / Millet",
        "water_req_mm": 350,              # 300 - 400 mm
        "water_req_liters_per_acre": 1400000,
        "base_cost_per_acre": 13500,
        "base_yield_quintal_per_acre": 13.0,
        "base_msp_per_quintal": 3200,
        "drought_sensitivity": 0.15,      # Super hardy, highly drought resilient
        "rain_delay_sensitivity": 0.20,
        "optimal_temp_min": 20,
        "optimal_temp_max": 38,
        "temp_sensitivity": 0.25,
        "preferred_soils": ["Red Soil", "Sandy Loam", "Shallow Black", "Red Loamy", "Sandy"],
        "min_water_threshold_pct": 15.0,
    },
    "Maize": {
        "name_en": "Maize (Corn)",
        "name_te": "మొక్కజొన్న",
        "category": "Cereal / Feed",
        "water_req_mm": 600,
        "water_req_liters_per_acre": 2400000,
        "base_cost_per_acre": 19500,
        "base_yield_quintal_per_acre": 26.0,
        "base_msp_per_quintal": 2225,
        "drought_sensitivity": 0.55,
        "rain_delay_sensitivity": 0.50,
        "optimal_temp_min": 21,
        "optimal_temp_max": 32,
        "temp_sensitivity": 0.45,
        "preferred_soils": ["Loamy", "Clay Loam", "Red Loamy", "Black Cotton"],
        "min_water_threshold_pct": 35.0,
    },
    "Cotton": {
        "name_en": "Cotton (Bt Cotton)",
        "name_te": "ప్రత్తి (దూది)",
        "category": "Commercial Cash Crop",
        "water_req_mm": 750,
        "water_req_liters_per_acre": 3000000,
        "base_cost_per_acre": 27000,
        "base_yield_quintal_per_acre": 11.5,
        "base_msp_per_quintal": 7120,
        "drought_sensitivity": 0.65,
        "rain_delay_sensitivity": 0.60,
        "optimal_temp_min": 22,
        "optimal_temp_max": 35,
        "temp_sensitivity": 0.60,
        "preferred_soils": ["Deep Black Cotton", "Black Soil", "Clay Loam"],
        "min_water_threshold_pct": 40.0,
    },
    "Tomato": {
        "name_en": "Tomato",
        "name_te": "టమోటా",
        "category": "Horticultural Vegetable",
        "water_req_mm": 650,
        "water_req_liters_per_acre": 2600000,
        "base_cost_per_acre": 36000,
        "base_yield_quintal_per_acre": 90.0,
        "base_msp_per_quintal": 1400,
        "drought_sensitivity": 0.75,
        "rain_delay_sensitivity": 0.70,
        "optimal_temp_min": 18,
        "optimal_temp_max": 30,
        "temp_sensitivity": 0.85,
        "preferred_soils": ["Red Loamy", "Sandy Loam", "Well Drained Clay Loam"],
        "min_water_threshold_pct": 45.0,
    },
    "Pulses": {
        "name_en": "Pulses (Red Gram / Bengal Gram)",
        "name_te": "పప్పుధాన్యాలు (కందులు / శనగలు)",
        "category": "Pulse / Legume",
        "water_req_mm": 450,
        "water_req_liters_per_acre": 1800000,
        "base_cost_per_acre": 16000,
        "base_yield_quintal_per_acre": 8.5,
        "base_msp_per_quintal": 7000,
        "drought_sensitivity": 0.30,
        "rain_delay_sensitivity": 0.35,
        "optimal_temp_min": 20,
        "optimal_temp_max": 34,
        "temp_sensitivity": 0.35,
        "preferred_soils": ["Loamy", "Red Soil", "Black Soil", "Clay Loam"],
        "min_water_threshold_pct": 25.0,
    }
}


def normalize_crop_key(crop_name: str) -> str:
    """Matches user/profile crop name to master DB key."""
    c_lower = crop_name.lower().strip()
    if "rice" in c_lower or "paddy" in c_lower or "వరి" in c_lower:
        return "Rice"
    if "groundnut" in c_lower or "peanut" in c_lower or "వేరుశనగ" in c_lower or "పల్లీ" in c_lower:
        return "Groundnut"
    if "millet" in c_lower or "ragi" in c_lower or "bajra" in c_lower or "jowar" in c_lower or "చిరుధాన్యాలు" in c_lower:
        return "Millet"
    if "maize" in c_lower or "corn" in c_lower or "మొక్కజొన్న" in c_lower:
        return "Maize"
    if "cotton" in c_lower or "ప్రత్తి" in c_lower:
        return "Cotton"
    if "tomato" in c_lower or "టమోటా" in c_lower:
        return "Tomato"
    if "pulse" in c_lower or "gram" in c_lower or "dal" in c_lower or "కందులు" in c_lower:
        return "Pulses"
    return "Rice"


def calculate_soil_compatibility(crop_pref_soils: List[str], farmer_soil: Optional[str]) -> float:
    """Returns a multiplier between 0.85 and 1.10 based on soil alignment."""
    if not farmer_soil:
        return 1.0
    
    fs_lower = farmer_soil.lower()
    for pref in crop_pref_soils:
        if pref.lower() in fs_lower or fs_lower in pref.lower():
            return 1.08  # 8% boost for ideal soil
    
    # Partial match
    if "loam" in fs_lower:
        return 1.02
    if "sand" in fs_lower and ("Millet" in crop_pref_soils or "Groundnut" in crop_pref_soils):
        return 1.05
    if "clay" in fs_lower and "Rice" in crop_pref_soils:
        return 1.08
    if "black" in fs_lower and ("Cotton" in crop_pref_soils or "Rice" in crop_pref_soils):
        return 1.08
        
    return 0.94  # Slight sub-optimal drag


def simulate_crop_scenario(
    crop_key: str,
    crop_info: Dict[str, Any],
    sim_input: SimulationInput
) -> CropSimulationResult:
    """
    Simulates agronomic, financial, and risk outcomes for a specific crop under given parameters.
    """
    water_pct = sim_input.water_availability_pct
    rain_delay = sim_input.rain_delay_days
    temp_delta = sim_input.temp_delta_c
    market_delta_pct = sim_input.market_price_delta_pct
    expected_rain = sim_input.expected_rainfall.lower()
    acres = max(0.5, sim_input.farm_size_acres)

    # 1. Rainfall condition adjustment factor
    rain_condition_factor = 1.0
    if "drought" in expected_rain:
        rain_condition_factor = 0.65
    elif "deficit" in expected_rain:
        rain_condition_factor = 0.82
    elif "excess" in expected_rain:
        rain_condition_factor = 1.05
    elif "normal" in expected_rain:
        rain_condition_factor = 1.0

    effective_water_pct = min(100.0, water_pct * rain_condition_factor)

    # 2. Water Availability & Yield Impact
    # If effective water is below crop's minimum threshold, yield collapses exponentially
    min_thresh = crop_info["min_water_threshold_pct"]
    drought_sens = crop_info["drought_sensitivity"]

    if effective_water_pct >= 85.0:
        water_yield_factor = 1.0 + (effective_water_pct - 85.0) * 0.002
        water_stress = "Sufficient"
    elif effective_water_pct >= min_thresh:
        # Linear or smooth curve decay
        deficit_ratio = (85.0 - effective_water_pct) / (85.0 - min_thresh)
        water_yield_factor = 1.0 - (deficit_ratio * drought_sens * 0.65)
        water_stress = "Moderate Stress"
    else:
        # Severe deficit below threshold
        below_ratio = (min_thresh - effective_water_pct) / max(1.0, min_thresh)
        water_yield_factor = max(0.12, (1.0 - drought_sens * 0.65) - (below_ratio * 0.55))
        water_stress = "Severe Deficit"

    # Excess water penalty for dry crops (like groundnut or millet rotting in excess water)
    if effective_water_pct > 95.0 and crop_key in ["Millet", "Groundnut", "Pulses"]:
        water_yield_factor *= 0.92
        water_stress = "Excess Moisture Risk"

    # 3. Rain Delay Impact
    # Delay in monsoon leads to delayed sowing, pest pressure, shorter grain filling
    delay_sens = crop_info["rain_delay_sensitivity"]
    delay_factor = max(0.50, 1.0 - (rain_delay / 60.0) * delay_sens * 0.50)

    # 4. Temperature Anomaly Impact
    # Extreme heat (> +2C) damages pollen viability and boosts evapotranspiration
    temp_sens = crop_info["temp_sensitivity"]
    if abs(temp_delta) <= 1.0:
        temp_factor = 1.0
    elif temp_delta > 1.0:
        temp_factor = max(0.60, 1.0 - ((temp_delta - 1.0) / 4.0) * temp_sens * 0.35)
    else: # cooler than normal
        temp_factor = max(0.85, 1.0 - (abs(temp_delta) - 1.0) * 0.03)

    # 5. Soil Compatibility Factor
    soil_factor = calculate_soil_compatibility(crop_info["preferred_soils"], sim_input.soil_type)

    # Overall Combined Yield Multiplier
    combined_yield_factor = max(0.10, water_yield_factor * delay_factor * temp_factor * soil_factor)
    simulated_yield_per_acre = round(crop_info["base_yield_quintal_per_acre"] * combined_yield_factor, 2)

    # 6. Cost Calculation
    # Drought/delayed rain increases irrigation diesel/electricity costs and weed/pest control costs
    cost_surge = 1.0
    if effective_water_pct < 60.0:
        cost_surge += (60.0 - effective_water_pct) * 0.004  # Up to 20% extra irrigation pumping cost
    if rain_delay > 20:
        cost_surge += (rain_delay - 20) * 0.003  # Extra pest management & re-weeding
    
    cost_per_acre = round(crop_info["base_cost_per_acre"] * cost_surge, 2)
    total_cost = round(cost_per_acre * acres, 2)

    # 7. Revenue and Market Price Fluctuation
    adjusted_price_per_quintal = crop_info["base_msp_per_quintal"] * (1.0 + market_delta_pct / 100.0)
    rev_per_acre = round(simulated_yield_per_acre * adjusted_price_per_quintal, 2)
    total_revenue = round(rev_per_acre * acres, 2)

    # 8. Net Profit & ROI
    profit_per_acre = round(rev_per_acre - cost_per_acre, 2)
    total_profit = round(total_revenue - total_cost, 2)
    roi_pct = round((profit_per_acre / max(1.0, cost_per_acre)) * 100.0, 1)

    # 9. Weather Suitability Calculation (0 to 100%)
    suitability_score = int(round(
        (water_yield_factor * 0.50 + delay_factor * 0.25 + temp_factor * 0.25) * 100.0
    ))
    suitability_score = max(5, min(99, suitability_score))

    # 10. Risk Assessment
    # Risk is driven by: water sensitivity + market downside + rain delay vulnerability + profit negativity
    risk_points = 0
    if effective_water_pct < crop_info["min_water_threshold_pct"] + 15:
        risk_points += int(drought_sens * 45)
    if rain_delay > 25:
        risk_points += int(delay_sens * 25)
    if market_delta_pct < -15:
        risk_points += int(abs(market_delta_pct) * 0.6)
    if profit_per_acre < 5000:
        risk_points += 30
    if total_cost > sim_input.budget:
        risk_points += 20

    risk_points = max(10, min(95, risk_points))

    if risk_points < 38:
        risk_level = "LOW"
    elif risk_points < 68:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    # 11. Overall AI Composite Score (0 to 100)
    # 35% Profitability, 30% Weather Suitability, 25% Risk Inversion, 10% Soil Compatibility
    profit_normalized = max(0.0, min(100.0, (profit_per_acre / 55000.0) * 100.0))
    risk_inversion = 100.0 - risk_points
    soil_normalized = (soil_factor / 1.10) * 100.0

    raw_ai_score = (
        profit_normalized * 0.35 +
        suitability_score * 0.30 +
        risk_inversion * 0.25 +
        soil_normalized * 0.10
    )
    # Hard penalties if unprofitable
    if profit_per_acre <= 0:
        raw_ai_score = min(35.0, raw_ai_score * 0.5)

    overall_ai_score = int(round(max(10, min(98, raw_ai_score))))

    # 12. Key Factors & Dynamic Agronomic Advice
    factors = []
    if water_stress == "Sufficient":
        factors.append("💧 Ample moisture for optimal growth")
    elif water_stress == "Moderate Stress":
        factors.append("⚠️ Requires micro-irrigation or alternate wetting")
    elif water_stress == "Severe Deficit":
        factors.append("🚨 High drought stress: Severe yield loss expected")
    elif "Excess" in water_stress:
        factors.append("🌧️ Excess water caution: Risk of root rot")

    if rain_delay > 20:
        factors.append(f"⏳ {rain_delay}-day rain delay disrupts sowing window")
    else:
        factors.append("⏱️ Timely sowing window intact")

    if market_delta_pct > 10:
        factors.append(f"📈 Favorable market price boom (+{market_delta_pct}%)")
    elif market_delta_pct < -10:
        factors.append(f"📉 Market price slump ({market_delta_pct}%) squeezes margin")

    if soil_factor > 1.04:
        factors.append(f"🌱 Excellent compatibility with {sim_input.soil_type or 'farm soil'}")

    # Advice string
    if crop_key == "Rice":
        if effective_water_pct < 60:
            advice = "Critical water deficit. Switch to Alternate Wetting & Drying (AWD) or consider shifting acreage to low-water Groundnut/Millet."
        elif rain_delay > 25:
            advice = "Delayed monsoon. Use short-duration rice varieties (110-120 days) or direct-seeded rice (DSR) to avoid cold weather at flowering."
        else:
            advice = "Favorable paddy conditions. Maintain 2-5cm standing water during tillering and panicle emergence."
    elif crop_key == "Groundnut":
        if effective_water_pct < 40:
            advice = "Apply life-saving sprinkler irrigation during pegging and pod development stages."
        elif effective_water_pct > 90:
            advice = "Ensure good field drainage to prevent fungal collar rot and leaf spot disease."
        else:
            advice = "Highly balanced risk-to-profit profile. Ensure gypsum application at 45 days for optimal kernel filling."
    elif crop_key == "Millet":
        if effective_water_pct < 40:
            advice = "Excellent choice under drought conditions. Minimal irrigation needed; highly resilient root system."
        else:
            advice = "Very low input cost and guaranteed harvest even under irregular rainfalls. High nutritional market demand."
    else:
        advice = f"Monitor crop growth stages closely. Optimize fertilizer application based on current moisture levels."

    return CropSimulationResult(
        crop_name=crop_info["name_en"],
        crop_name_te=crop_info["name_te"],
        category=crop_info["category"],
        water_requirement_mm=crop_info["water_req_mm"],
        water_requirement_liters=crop_info["water_req_liters_per_acre"],
        weather_suitability_pct=suitability_score,
        risk_level=risk_level,
        risk_score=risk_points,
        estimated_cost_per_acre=cost_per_acre,
        total_cost=total_cost,
        estimated_yield_quintals_per_acre=simulated_yield_per_acre,
        estimated_revenue_per_acre=rev_per_acre,
        total_revenue=total_revenue,
        estimated_profit_per_acre=profit_per_acre,
        total_profit=total_profit,
        roi_pct=roi_pct,
        overall_ai_score=overall_ai_score,
        key_factors=factors,
        agronomic_advice=advice,
        water_stress_status=water_stress,
        is_best_choice=False
    )


def run_farm_simulation(sim_input: SimulationInput) -> SimulationResponse:
    """
    Executes real-time multi-scenario simulation across target crops.
    """
    selected = sim_input.selected_crops or ["Rice", "Groundnut", "Millet"]
    
    # Normalize crop names and ensure at least 3 distinct scenarios
    normalized_keys = []
    for c in selected:
        k = normalize_crop_key(c)
        if k not in normalized_keys and k in CROPS_DATABASE:
            normalized_keys.append(k)

    # If fewer than 3, fill defaults (Rice, Groundnut, Millet)
    for fallback in ["Rice", "Groundnut", "Millet", "Maize", "Cotton"]:
        if len(normalized_keys) >= 3:
            break
        if fallback not in normalized_keys:
            normalized_keys.append(fallback)

    results: List[CropSimulationResult] = []
    for k in normalized_keys:
        crop_info = CROPS_DATABASE[k]
        res = simulate_crop_scenario(k, crop_info, sim_input)
        results.append(res)

    # Determine Best Recommendation based on composite AI score and risk mitigation
    results.sort(key=lambda x: x.overall_ai_score, reverse=True)
    best = results[0]
    best.is_best_choice = True

    # Generate transparent farmer-friendly reasoning summary
    lang = (sim_input.language or "en").lower()
    water_val = sim_input.water_availability_pct
    rain_del = sim_input.rain_delay_days
    temp_d = sim_input.temp_delta_c
    mkt_d = sim_input.market_price_delta_pct

    if "te" in lang:
        # Telugu reasoning
        if water_val < 55:
            reasoning = f"{best.crop_name_te} ఉత్తమ ఎంపిక. ఎందుకంటే మీ ప్రాంతంలో నీటి లభ్యత పరిమితంగా ({water_val:.0f}%) ఉంది మరియు వాతావరణం కరువు పరిస్థితులను సూచిస్తుంది. ఇది తక్కువ పెట్టుబడితో అధిక లాభాన్ని ({best.total_profit:,.0f} ₹) అందిస్తుంది."
        elif rain_del > 25:
            reasoning = f"{best.crop_name_te} అనుకూలమైనది. వర్షాలు {rain_del} రోజులు ఆలస్యమైనప్పటికీ, ఈ పంట ఆలస్య విత్తనానికి తట్టుకుని స్థిరమైన దిగుబడిని ఇస్తుంది."
        else:
            reasoning = f"{best.crop_name_te} అత్యుత్తమ సిఫార్సు. ప్రస్తుత నీటి లభ్యత ({water_val:.0f}%), నేల స్వభావం ({sim_input.soil_type or 'సాధారణ నేల'}) మరియు మార్కెట్ పరిస్థితుల్లో గరిష్ట రాబడి (AI స్కోర్: {best.overall_ai_score}/100) సాధిస్తుంది."
        summary = f"🏆 అత్యుత్తమ ఎంపిక: {best.crop_name_te} (అంచనా లాభం: ₹{best.total_profit:,.0f} | రిస్క్: {best.risk_level})"
    else:
        # English reasoning
        if water_val < 55:
            reasoning = f"{best.crop_name} is your best investment option because your farm has limited water availability ({water_val:.0f}%) and dry weather risks. It delivers higher resilience, low water dependency, and solid net profit (₹{best.total_profit:,.0f})."
        elif rain_del > 25:
            reasoning = f"{best.crop_name} is highly recommended because of the simulated {rain_del}-day monsoon delay. It tolerates delayed sowing windows with lower pest vulnerability than high-risk water-intensive crops."
        elif mkt_d > 15:
            reasoning = f"{best.crop_name} capitalizes most effectively on favorable market prices (+{mkt_d:.0f}%), generating an estimated ₹{best.total_profit:,.0f} total profit across your {sim_input.farm_size_acres} acres."
        else:
            reasoning = f"{best.crop_name} achieves the highest overall AI score ({best.overall_ai_score}/100) considering your {sim_input.soil_type or 'farm'} soil, water capacity ({water_val:.0f}%), and budget constraints with {best.risk_level} risk."
        summary = f"🏆 Best Recommendation: {best.crop_name} (Estimated Profit: ₹{best.total_profit:,.0f} | Risk: {best.risk_level})"

    return SimulationResponse(
        results=results,
        best_recommendation=best,
        recommendation_summary=summary,
        recommendation_reasoning=reasoning,
        simulation_input=sim_input
    )


async def generate_ai_simulation_insight(payload: SimulationAIInsightRequest) -> SimulationAIInsightResponse:
    """
    Invokes the AI provider + Agricultural Knowledge Base to produce in-depth agronomic strategic advice.
    """
    sim_input = payload.simulation_input
    best_crop = payload.best_crop_name
    lang = (payload.language or "en").lower()

    # Retrieve relevant RAG agricultural context
    rag_context, _ = retrieve_agricultural_context(
        query=f"crop management irrigation strategy for {best_crop} under drought weather and rain delay",
        target_crop=best_crop,
        target_category="farm_management"
    )

    prompt = f"""
You are KRISHI AI, an elite Agricultural Economist and Senior Agronomist.
A farmer has run a future farm simulation with these parameters:
- Farm Size: {sim_input.farm_size_acres} Acres
- Soil Type: {sim_input.soil_type or 'Local Loamy Soil'}
- Location: {sim_input.location or 'Andhra Pradesh / Telangana'}
- Simulated Water Availability: {sim_input.water_availability_pct}%
- Rain Delay: {sim_input.rain_delay_days} days
- Temperature Shift: {sim_input.temp_delta_c}°C
- Market Price Shift: {sim_input.market_price_delta_pct}%
- Expected Rainfall: {sim_input.expected_rainfall}
- Budget: ₹{sim_input.budget:,.0f}

SIMULATION OUTCOME:
- Recommended Crop: {best_crop}

AGRONOMIC KNOWLEDGE REFERENCE:
{rag_context or "Use certified ICAR / State Agricultural University package of practices."}

TASK:
Provide a concise, practical, 3-point strategic advisory for the farmer in {'Telugu' if 'te' in lang else 'English'}.
Focus on:
1. Soil & sowing timing adjustments
2. Water conservation / micro-irrigation tactics (AWD, drip, sprinkler)
3. Market price & risk hedging tips

Keep it crisp, bulleted, farmer-friendly, and actionable. Do not use complex jargon.
"""

    try:
        provider = get_ai_provider()
        ai_resp = await provider.generate_response(
            messages=[{"role": "user", "content": prompt}],
            system_prompt="You are KRISHI AI, India's most trusted AI Agricultural Decision Assistant.",
            max_new_tokens=400
        )
        insight_text = ai_resp.strip()
    except Exception as e:
        logger.warning("AI provider call failed for simulation insight, using agronomic fallback: %s", e)
        if "te" in lang:
            insight_text = (
                f"{best_crop} సాగుకు ప్రణాళిక:\n"
                f"1. విత్తన శుద్ధి మరియు సరైన సమయంలో విత్తుకోవడం ద్వారా పురుగుల ఉధృతిని తగ్గించండి.\n"
                f"2. నీటి పొదుపు కోసం డ్రిప్ లేదా స్ప్రింక్లర్ పద్ధతులను ఉపయోగించండి.\n"
                f"3. మార్కెట్ ధర హెచ్చుతగ్గుల నుండి రక్షణ కోసం స్థానిక ఈ-నామ్ (e-NAM) కేంద్రాలలో నమోదు చేసుకోండి."
            )
        else:
            insight_text = (
                f"Key Strategic Plan for {best_crop}:\n"
                f"1. Timely Seed Treatment: Use bio-fungicides (Trichoderma) to prevent seedling blight caused by delayed monsoon sowing.\n"
                f"2. Micro-Irrigation Adoption: Implement drip or sprinkler irrigation to boost water-use efficiency by 35-40%.\n"
                f"3. Market Risk Protection: Register on the e-NAM platform or local FPO to lock in competitive mandi prices."
            )

    strategic_advice = [
        f"Optimize basal fertilization with organic compost before planting {best_crop}",
        f"Adopt Alternate Wetting & Drying or Drip lines to reduce irrigation cost by 30%",
        f"Monitor pest thresholds using pheromone traps to prevent unexpected pesticide expenses"
    ]
    water_saving_tactics = [
        "Construct farm ponds (Kalyani) for emergency rainwater harvesting",
        "Apply organic mulching (paddy straw/dry leaves) to retain soil moisture during heatwaves",
        "Irrigate strictly during early morning or evening hours to minimize evaporation losses"
    ]
    market_risk_mitigation = [
        "Connect with local Farmer Producer Organizations (FPOs) for collective bargaining",
        "Utilize WDRA registered warehouses for post-harvest storage if market prices slump",
        "Explore direct contract farming agreements before sowing to guarantee minimum buyback rate"
    ]

    return SimulationAIInsightResponse(
        ai_insight=insight_text,
        strategic_advice=strategic_advice,
        water_saving_tactics=water_saving_tactics,
        market_risk_mitigation=market_risk_mitigation
    )
