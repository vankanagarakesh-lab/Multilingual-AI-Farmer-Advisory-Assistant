# 🌾 KRISHI AI — Multilingual AI Farmer Advisory & Farm Future Simulator

<div align="center">

![Krishi Vision AI Simulator Banner](screenshots/06_krishi_vision_simulator.png)

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch_Vision-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**An end-to-end Agronomic Decision Intelligence & Future Simulation platform designed for Indian farmers. Combining deep learning leaf pathology, real-time microclimate telemetry, localized Indian language LLMs, and predictive "What-If" farm future simulations.**

[🌟 Key Highlights](#-flagship-feature--krishi-vision-ai-farm-future-simulator) • [📸 Output Gallery](#-output--application-screenshots) • [🏛️ System Architecture](#️-system-architecture) • [🚀 Quick Start](#-quick-start-guide) • [📡 API Reference](#-api-endpoints-overview)

</div>

---

## 🏆 For Hackathon Judges & Technical Evaluators

> *"Don't just grow. Simulate your future before you invest."*

### Why KRISHI AI Stands Out:
1. **Predictive AI Simulation (KRISHI VISION)**: Solves the greatest vulnerability in agriculture — climate & market uncertainty — by enabling farmers to run instant **"What-If" simulations** (drought stress, monsoon delays, market price crashes, extreme heat) before sowing a single seed.
2. **True Indian Language Inclusivity**: Native voice recognition (STT), multi-script generation (Telugu, Hindi, English, Kannada, Tamil, etc.), and multilingual Text-to-Speech (TTS) audio narration for low-literacy rural accessibility.
3. **Edge Deep Learning Vision**: High-precision `MobileNetV2` neural classifier diagnosing 38 plant disease classes with instant organic & chemical cure protocols.
4. **Hyperlocal Weather & Agronomic Context**: Automated GPS reverse-geocoding, live rain prediction countdowns, and soil-matched crop intelligence.

---

## 🌟 Flagship Feature — KRISHI VISION (AI Farm Future Simulator)

![Krishi Vision Simulator](screenshots/06_krishi_vision_simulator.png)

### 🔮 What is KRISHI VISION?
Smallholder farmers often risk their entire annual savings on seed selection without knowing how erratic rainfall, delayed monsoons, or market gluts will impact their harvest. **KRISHI VISION** is a real-time Agronomic Simulation & Financial Forecasting Engine that models multi-variable agricultural futures in sub-second latency.

### 🎛️ Interactive Simulation Parameters:
- **💧 Available Water Level (0% to 100%)**: Models severe drought, canal water scarcity, or high-water abundance against crop evapotranspiration (ETc) requirements.
- **🌧️ Rain Delay / Monsoon Lag (0 to 60 Days)**: Computes yield attenuation curves based on delayed sowing windows.
- **🌡️ Temperature Anomaly (-5°C to +5°C)**: Analyzes thermal stress thresholds, pollen sterility, and heat wave vulnerabilities.
- **📈 Market Price / Mandi Shift (-50% to +50%)**: Stresses crop profitability against MSP baselines, bumper harvest price drops, or high-demand surges.
- **💰 Budget & Acreage Optimization**: Enforces capital investment limits and calculates precise input expenditure vs expected returns.

### 📊 Comprehensive Multi-Crop Analytics:
| Metric | Description | Formula / Agronomic Logic |
| :--- | :--- | :--- |
| **Overall AI Score** | 0–100 composite ranking score | $\text{Score} = f(\text{Profitability}, \text{Water Fit}, \text{Climate Suitability}, \text{Soil Compatibility}, \text{Risk Penalty})$ |
| **Projected Net Profit** | Estimated bottom-line return in INR (₹) | $\text{Net Profit} = (\text{Yield} \times \text{Market Price}) - \text{Total Cultivation Cost}$ |
| **ROI (%)** | Return on farming investment | $\text{ROI} = \left(\frac{\text{Net Profit}}{\text{Total Input Cost}}\right) \times 100$ |
| **Risk Index** | Dynamic LOW / MEDIUM / HIGH badge | Based on standard deviation of market volatility and water stress vulnerability |
| **Water Stress Status** | Real-time hydration rating | Compares crop water requirement (mm) against available irrigation level |

---

## 📸 Output & Application Screenshots

### 1. 🔮 KRISHI VISION — AI Farm Future Simulator (Flagship)
Interactive scenario sliders, 3-crop financial comparison, AI Score ranking (e.g. Groundnut 96/100, ₹1,38,106 profit), and localized Telugu agronomic summary.

![Krishi Vision AI Simulator](screenshots/06_krishi_vision_simulator.png)

---

### 2. 🌾 Interactive Agronomic Dashboard
Live smart weather telemetry (Kurabalakota, 26°C, live rainfall tracking), farmer crop context summary, and multilingual quick prompts (English, Telugu, Hindi, Mixed).

![Dashboard Home](screenshots/01_dashboard_home.png)

---

### 3. 👨‍🌾 Farmer Agricultural Profile & Context Engine
Personalized crop management tracking farmer details, acreage, soil classification, primary crop, growth stage, and preferred advisory dialect.

![Farmer Profile](screenshots/02_farmer_profile.png)

---

### 4. 🔬 Deep Learning Leaf Disease Diagnosis
MobileNetV2 neural vision model detecting plant leaf pathology, confidence score, organic treatments, chemical remedies, and preventative tips.

![Plant Disease Detection](screenshots/03_plant_disease_detection.png)

---

### 5. 🗣️ Multilingual Indian Language Generative Chat
Natural language multi-turn agrarian advisory answering complex farming questions with integrated Voice-to-Text and Text-to-Speech audio playback.

![Multilingual Hindi Chat](screenshots/04_multilingual_chat_hindi.png)

---

### 6. 💧 Water-Efficient Crop Advisory & Climate Resilience
Tailored crop recommendations specifically optimized for low rainfall, dryland, and drought-resilient farming conditions.

![Crop Advisory Recommendation](screenshots/05_crop_advisory_recommendation.png)

---

## 🏛️ System Architecture

```
                                  👨‍🌾 FARMER / USER
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
      [ 📷 Leaf Image Scan ]   [ 🎙️ Voice / Text Query ]   [ 🎛️ KRISHI VISION Sim ]
                 │                       │                       │
                 ▼                       ▼                       ▼
       MobileNetV2 Classifier    Multi-Script NLP Engine    Agronomic Simulator Engine
     (38 Leaf Disease Classes)  (Telugu, Hindi, EN, etc.)   (Water, Temp, MSP, Yield)
                 │                       │                       │
                 ▼                       ▼                       ▼
      Plant Pathology Engine     RAG Vector Knowledge Base   Financial & Risk Modeler
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         ▼
                           KRISHI AI ORCHESTRATION LAYER
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     🌟 Rich Interactive UI Output                   🔊 Multilingual Neural TTS
   • Profit & ROI Breakdown                        • Native Voice Playback
   • AI Score (0-100) & Risk Level                 • Regional Audio Dialects
   • Organic / Chemical Remedies
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **UI Experience & Audio** | Web Speech API, Canvas/SVG Micro-charts, Glassmorphic Theme |
| **Backend & Microservices**| FastAPI (Python 3.11+), Uvicorn, SQLAlchemy, SQLite, Pydantic v2 |
| **Computer Vision Engine** | PyTorch, Torchvision, MobileNetV2 (38 PlantVillage Classes), PIL, NumPy |
| **Generative AI & LLM** | Ollama (`llama3.2`), HuggingFace LoRA Adapters (`Qwen2.5-7B`), Agricultural RAG |
| **Simulation & Analytics** | Parametric Agronomic Simulation Engine, Microclimate Attenuation Models |
| **Weather & Geocoding** | Open-Meteo API, BigDataCloud Client Geocoding, OpenStreetMap Nominatim |

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Python 3.11+** installed
2. **Node.js 18+** and **npm**
3. **Git**

---

### 1. Clone the Repository
```bash
git clone https://github.com/vankanagarakesh-lab/Multilingual-AI-Farmer-Advisory-Assistant.git
cd Multilingual-AI-Farmer-Advisory-Assistant
```

---

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
API interactive documentation available at: `http://localhost:8000/docs`

---

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend application available at: `http://localhost:5173`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/simulator/simulate` | **KRISHI VISION**: Instant multi-crop financial, risk, and yield future simulation |
| `POST` | `/api/simulator/ai-insight` | **KRISHI VISION**: Generates strategic deep AI advisory for simulated scenarios |
| `GET` | `/api/simulator/crops` | Returns supported simulation crops and agronomic baselines |
| `POST` | `/api/chat/message` | Send multi-turn query & image for RAG + Vision AI advisory |
| `POST` | `/api/chat/detect-disease` | Direct leaf image deep learning disease classification |
| `POST` | `/api/voice/transcribe` | Audio Speech-to-Text transcription (Whisper / SpeechRecognition) |
| `POST` | `/api/voice/synthesize` | Multilingual Text-to-Speech audio generator (gTTS) |
| `GET` | `/api/farmer/profile` | Retrieve personalized farmer crop and soil context |
| `PUT` | `/api/farmer/profile` | Update farmer agricultural profile |
| `GET` | `/api/health` | Backend and AI vision engine health status check |

---

## 👨‍💻 Project Information

- **Developer**: Rakesh Vankanagara
- **Repository**: [Multilingual-AI-Farmer-Advisory-Assistant](https://github.com/vankanagarakesh-lab/Multilingual-AI-Farmer-Advisory-Assistant)
- **License**: [MIT License](LICENSE)

<div align="center">
🌾 <i>Empowering Indian Farmers with Predictive AI, Computer Vision, and Multilingual Intelligence.</i>
</div>
