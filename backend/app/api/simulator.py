from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.session import get_db
from app.schemas.simulator import (
    SimulationInput,
    SimulationResponse,
    SimulationAIInsightRequest,
    SimulationAIInsightResponse
)
from app.services.simulator_service import (
    run_farm_simulation,
    generate_ai_simulation_insight,
    CROPS_DATABASE
)
from app.services.farmer_service import get_farmer_profile
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/simulator", tags=["Krishi Vision Farm Simulator"])


@router.get("/crops")
def get_available_simulation_crops():
    """
    Returns list of supported crops with agronomic baselines and names.
    """
    crops_summary = []
    for key, data in CROPS_DATABASE.items():
        crops_summary.append({
            "key": key,
            "name": data["name_en"],
            "name_te": data["name_te"],
            "category": data["category"],
            "water_requirement_mm": data["water_req_mm"],
            "base_cost_per_acre": data["base_cost_per_acre"],
            "base_yield_quintal_per_acre": data["base_yield_quintal_per_acre"],
            "base_msp_per_quintal": data["base_msp_per_quintal"],
            "preferred_soils": data["preferred_soils"]
        })
    return {"status": "success", "crops": crops_summary}


@router.post("/simulate", response_model=SimulationResponse)
def simulate_farm_future(
    payload: SimulationInput,
    db: Session = Depends(get_db)
):
    """
    Simulates multi-crop agronomic, financial, and risk outcomes based on interactive parameters.
    Works synchronously and instantly for real-time slider responsiveness.
    """
    return run_farm_simulation(payload)


@router.post("/ai-insight", response_model=SimulationAIInsightResponse)
async def get_simulation_ai_insight(
    payload: SimulationAIInsightRequest
):
    """
    Generates tailored AI agricultural advisory using LLM / RAG knowledge base.
    """
    return await generate_ai_simulation_insight(payload)
