# 🌾 KRISHI AI — Multilingual AI Farmer Advisory Assistant

<div align="center">

![Krishi AI Banner](screenshots/01_dashboard_home.png)

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch_Vision-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**An intelligent, multilingual agricultural decision-support advisory system powered by deep learning computer vision, location-aware meteorological forecasting, and Indian language generative intelligence.**

</div>

---

## 📸 Output & Application Screenshots

### 1. Interactive Agronomic Dashboard
Real-time smart weather telemetry (Kurabalakota, 26°C, live rainfall tracking), farmer crop context summary, and multilingual quick prompts (English, Telugu, Hindi, Mixed).

![Dashboard Home](screenshots/01_dashboard_home.png)

---

### 2. Farmer Agricultural Profile Context
Customized crop management tracking farmer details, acreage, soil type, primary crop, current stage, and preferred advisory language.

![Farmer Profile](screenshots/02_farmer_profile.png)

---

### 3. AI Plant Disease Detection & Diagnosis
MobileNetV2 deep learning vision model diagnosing plant leaf health, confidence score, possible causes, treatment remedies, and prevention tips.

![Plant Disease Detection](screenshots/03_plant_disease_detection.png)

---

### 4. Multilingual Generative Intelligence (Hindi & Indian Languages)
Natural language conversation answering multi-turn agrarian questions with audio voice read-aloud support.

![Multilingual Hindi Chat](screenshots/04_multilingual_chat_hindi.png)

---

### 5. Water-Efficient Crop Advisory & Decision Support
Tailored crop recommendations for low rainfall and drought-resilient farming.

![Crop Advisory Recommendation](screenshots/05_crop_advisory_recommendation.png)

---

## 🌟 Core Features

### 📍 1. Smart Location & Live Weather Intelligence
- **GPS Auto-Detection**: Automatically detects device geolocation upon clicking the refresh badge.
- **Dual-Tier Reverse Geocoding**: Translates GPS coordinates into City/Town/District and State names.
- **Microclimate Telemetry**: Real-time temperature (°C), apparent temperature, humidity (%), wind speed (km/h), and upcoming 7-day hourly rain forecast countdown.
- **Graceful Fallback**: Preserves offline regional agrarian defaults if location permissions are unavailable.

### 🔬 2. Deep Learning Plant Leaf Disease Detection
- **Computer Vision Model**: Integrated `MobileNetV2` neural vision classifier trained on 38 PlantVillage leaf disease classes across major crops (Tomato, Potato, Corn/Maize, Pepper/Chilli, Apple, Grape, Citrus, Strawberry, Peach, Cherry, Soybean, Blueberry).
- **Validation Guardrails**: Automatically detects blurry, corrupt, low-detail, or non-plant images and requests a clearer leaf photo.
- **Structured Agronomic Guidance**: Returns Plant Name, Identified Disease, Confidence Level (%), Causes, Treatment/Remedies (organic & chemical), and Prevention Tips.

### 🌐 3. Multilingual AI Assistant (Telugu, Hindi, English & More)
- **Automatic Language Detection**: Multi-script regex engine supporting Telugu (`te`), Hindi (`hi`), Kannada (`kn`), Tamil (`ta`), Bengali (`bn`), Marathi (`mr`), Gujarati (`gu`), Malayalam (`ml`), Punjabi (`pa`), and English (`en`).
- **Voice Intelligence (STT & TTS)**: Live browser speech recognition + backend Whisper speech-to-text and multilingual Text-to-Speech audio playback.

### 📚 4. Agricultural Knowledge Base (RAG)
- **Vector Search Engine**: Semantic retrieval over curated agricultural documents, IPM guidelines, and crop stage advisory.
- **Transparent Citations**: Verifiable agricultural knowledge sources linked on each response.

---

## 🏛️ System Architecture

```
                                FARMER / USER
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
          [ Camera / Leaf Image ]               [ Voice / Text Query ]
                   │                                     │
                   ▼                                     ▼
        MobileNetV2 Vision Engine             Multi-Script Language Engine
       (38 Plant Disease Classes)             (Telugu, Hindi, English, etc.)
                   │                                     │
                   ▼                                     ▼
        Plant Disease Knowledge Base          RAG Agricultural Vector Store
                   │                                     │
                   └──────────────────┬──────────────────┘
                                      ▼
                        KRISHI AI ORCHESTRATION LAYER
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
          Structured UI Advisory               Text-to-Speech (TTS)
        (Causes, Remedies, Prevention)           (Telugu / Hindi / EN)
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Web Speech API |
| **Backend** | FastAPI (Python 3.11+), Uvicorn, SQLAlchemy, SQLite, Pydantic |
| **Computer Vision** | PyTorch, Torchvision, MobileNetV2, PIL (Pillow), NumPy |
| **Generative AI & LLM** | Ollama (`llama3.2`) / HuggingFace LoRA Adapters (`Qwen2.5`) |
| **Speech & Audio** | gTTS, SpeechRecognition, pydub, Web Audio API |
| **Weather & Geocoding** | Open-Meteo API, BigDataCloud Client Geocoding, OpenStreetMap Nominatim |

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Python 3.11+** installed
2. **Node.js 18+** and **npm**
3. **Ollama** (optional, for local LLM inference)

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
# On Windows:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API interactive documentation available at: `http://localhost:8000/docs`

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
| `POST` | `/api/chat/message` | Send chat message & image for RAG + Vision AI advisory |
| `POST` | `/api/chat/detect-disease` | Direct leaf image deep learning disease detection |
| `POST` | `/api/voice/transcribe` | Audio Speech-to-Text conversion |
| `POST` | `/api/voice/synthesize` | Multilingual Text-to-Speech audio generator |
| `GET` | `/api/farmer/profile` | Retrieve customized farmer crop context |
| `PUT` | `/api/farmer/profile` | Update farmer agricultural profile |
| `GET` | `/api/conversations` | Fetch conversation sessions history |
| `GET` | `/api/knowledge/status` | Vector knowledge base status |
| `GET` | `/api/health` | Backend and AI engine health check |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
