from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class SimulationInput(BaseModel):
    water_availability_pct: float = Field(default=80.0, ge=0.0, le=100.0, description="Available water level % (0 to 100)")
    rain_delay_days: int = Field(default=0, ge=0, le=60, description="Rain delay in days (0 to 60)")
    temp_delta_c: float = Field(default=0.0, ge=-5.0, le=5.0, description="Temperature anomaly in °C (-5 to +5)")
    market_price_delta_pct: float = Field(default=0.0, ge=-50.0, le=50.0, description="Market price change % (-50 to +50)")
    expected_rainfall: str = Field(default="Normal", description="Expected rainfall condition: Normal, Deficit, Drought, Excess")
    budget: float = Field(default=60000.0, ge=1000.0, description="Available farming budget in INR")
    farm_size_acres: float = Field(default=2.0, ge=0.1, le=1000.0, description="Land area in acres")
    soil_type: Optional[str] = Field(default="Red Loamy", description="Farmer soil type")
    location: Optional[str] = Field(default="Andhra Pradesh / Telangana", description="Farmer location")
    coordinates: Optional[Dict[str, float]] = Field(default=None, description="GPS Coordinates {lat, lon}")
    current_crop: Optional[str] = Field(default=None, description="Currently cultivated crop")
    current_crop_stage: Optional[str] = Field(default=None, description="Current crop growth stage")
    selected_crops: Optional[List[str]] = Field(default=["Rice", "Groundnut", "Millet"], description="Crops to simulate")
    language: Optional[str] = Field(default="en", description="Preferred output language ('en', 'te', etc.)")


class CropSimulationResult(BaseModel):
    crop_name: str
    crop_name_te: str
    category: str  # Cereal, Oilseed, Millet, Cash Crop, Vegetable, Pulse
    water_requirement_mm: int
    water_requirement_liters: int
    weather_suitability_pct: int
    risk_level: str  # "LOW", "MEDIUM", "HIGH"
    risk_score: int  # 0 to 100 (higher = riskier)
    estimated_cost_per_acre: float
    total_cost: float
    estimated_yield_quintals_per_acre: float
    estimated_revenue_per_acre: float
    total_revenue: float
    estimated_profit_per_acre: float
    total_profit: float
    roi_pct: float
    overall_ai_score: int  # 0 to 100
    key_factors: List[str]
    agronomic_advice: str
    water_stress_status: str  # "Sufficient", "Moderate Stress", "Severe Deficit", "Excess"
    is_best_choice: bool = False


class SimulationResponse(BaseModel):
    results: List[CropSimulationResult]
    best_recommendation: CropSimulationResult
    recommendation_summary: str
    recommendation_reasoning: str
    simulation_input: SimulationInput
    disclaimer: str = "Estimates are generated using agronomic simulation models based on input parameters and regional benchmarks. Actual crop performance may vary depending on local microclimate, pest outbreaks, and field conditions."


class SimulationAIInsightRequest(BaseModel):
    simulation_input: SimulationInput
    simulation_results: List[CropSimulationResult]
    best_crop_name: str
    language: Optional[str] = "en"


class SimulationAIInsightResponse(BaseModel):
    ai_insight: str
    strategic_advice: List[str]
    water_saving_tactics: List[str]
    market_risk_mitigation: List[str]
