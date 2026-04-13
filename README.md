# 🧠 DoseWise

**An Autonomous AI Agent for Medication Management & Elder Care**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2+-61dafb.svg)](https://reactjs.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Latest-orange.svg)](https://github.com/langchain-ai/langgraph)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-blueviolet?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)

---

## 🚀 Overview

**DoseWise** is an **Agentic AI System** designed to autonomously manage daily medication routines, specifically tailored for the elderly and those with chronic conditions. 

Unlike traditional Reminder Apps (which are reactive), DoseWise is **Proactive**. It functions as a digital caretaker that **Observes** the patient's state, **Reasons** about health risks and inventory, **Plans** interventions, and **Acts** autonomously to ensure adherence and safety.

key Differentiator: **It doesn't just nag you to take a pill; it understands *why* you need it and manages everything around it.**

---

## 🏗️ System Architecture & Technical Implementation

At the core of DoseWise is a **Stateful Cognitive Architecture** powered by **LangGraph**. The system does not run on simple if-then rules but uses a continuous control loop that mimics human decision-making.

### The Agentic Loop (Observe-Reason-Plan-Act)

The backend (`backend/app/agent`) implements a graph-based state machine:

1.  **🔍 Observer Node**:
    - Continuously ingests real-time data: Current time, Medication schedules, Pill inventory, and Vitals.
    - Serves as the system's "eyes," aggregating context into a unified state.

2.  **🧠 Reasoning Node**:
    - Uses **Google Gemini** (LLM) to analyze the observed state.
    - Determines semantic context: "Is the patient late explicitly or just busy?", "Is the inventory critically low given the dosage frequency?"
    - **Risk Assessment**: Uses `risk_assessor.py` to calculate health risks based on vitals trends.

3.  **🗺️ Planner Node**:
    - Formulates a sequence of actions.
    - Example Plan: *Notify User -> If no response in 15 mins -> Escalate to Caregiver -> Check Inventory.*
    - Adapts plans dynamically if the user's state changes (e.g., they take the pill mid-calculation).

4.  **⚡ Action Node**:
    - Executes the plan:
        - triggers Push Notifications (via Frontend).
        - Initiates Reorder capability (`backend/app/reorder`).
        - Logs health data (`backend/app/health`).

### 🧠 Intelligence Layer
Located in `backend/app/intelligence`, this module separates DoseWise from basic apps:
-   **Trend Analysis**: `trend_analyzer.py` uses statistical methods to detect drifts in blood pressure or weight over time.
-   **LLM Explainer**: `llm_explainer.py` translates complex medical data into natural language summaries for caregivers.
-   **Historical Analysis**: `historical_analyzer.py` looks at past adherence to predict future compliance probabilities.

---

## ✨ Key Features

### Agnetic Medication Management
-   **Context-Aware Reminders**: Doesn't just buzz; provides pill images, dosage context, and food instructions.
-   **Missed Dose Protocols**: Automatically calculates the window of forgiveness for a missed dose and advises accordingly.

### Intelligent Inventory & Supply Chain
-   **Auto-Decrement**: Inventory updates in real-time as doses are marked taken.
-   **Smart Reordering**: Predicts run-out dates and proactively suggests reordering from integrated pharmacy APIs.

### Comprehensive Health Monitoring
-   **Vitals Tracking**: Logs Blood Pressure, Sugar, Heart Rate, and Weight.
-   **Anomaly Detection**: Alerts caregivers if vitals deviate from the patient's personalized baseline.

### Caregiver & Doctor Dashboard
-   **React-based Frontend**: A comprehensive dashboard showing adherence rates, inventory health, and vital trends.
-   **Peace of Mind**: Caregivers can see *exactly* what the agent is doing and why.

---

## 🛠️ Technical Stack

-   **Backend**: Python, FastAPI, Uvicorn (Async capabilities)
-   **AI & Logic**: LangGraph (State management), LangChain, Google Gemini Pro (LLM)
-   **Data Processing**: Pandas (Trend analysis), Pydantic (Data validation)
-   **Frontend**: React.js, Tailwind CSS (Responsive Design)
-   **Storage**: JSON-based State Store (for portability & demo speed)

---

## 💡 Importance & Impact

For recruiters and engineers: This project demonstrates the shift from **Generative AI (Chatbots)** to **Agentic AI (Systems that DO things)**.

1.  **State Management**: Handling complex, multi-turn state across long time horizons.
2.  **Reliability**: Building guardrails around LLMs to ensure they don't hallucinate medication advice.
3.  **Real-world Integration**: Connecting abstract reasoning (LLM) to concrete APIs (Notifications, Inventory).

---
**Made with ❤️ for better elderly care**