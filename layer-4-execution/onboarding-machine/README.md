# 🏥 AI Client Onboarding Machine (v7.6 Resilient)

A production-grade, 3-flow autonomous engine for agency client onboarding, follow-ups, and weekly check-ins.

## 🗺️ Architecture Overview

```mermaid
graph TD
    Trigger[📋 New Client Form] --> Parse[🔧 Parse Client Details]
    Parse --> DB[📥 Read Service DB]
    DB --> Gemini[🤖 Gemini: Planner]
    Gemini --> FanOut{Parallel Fan-Out}
    
    FanOut --> CRM[📊 Log Client Summary]
    FanOut --> Tasks[📊 Expand Deliverables]
    FanOut --> EmailEngine[📧 Build HTML Email]
    
    CRM --> SafeMode1{🛡️ Safe Mode?}
    SafeMode1 -- No --> Send1[📧 Send Onboarding Email]
    
    subgraph Flow_B[Flow B: Follow-Up]
        TriggerB[⏰ Daily 10 AM] --> FetchB[📥 Fetch Summary]
        FetchB --> GeminiB[🤖 Gemini: Follow-Up]
        GeminiB --> SafeMode2{🛡️ Safe Mode?}
        SafeMode2 -- No --> Send2[📧 Send Reminder]
    end
    
    subgraph Flow_C[Flow C: Check-In]
        TriggerC[⏰ Weekly Monday] --> FetchC[📥 Fetch Active]
        FetchC --> GeminiC[🤖 Gemini: Check-In]
        GeminiC --> SafeMode3{🛡️ Safe Mode?}
        SafeMode3 -- No --> Send3[📧 Send Check-In]
    end
    
    Error[Error Trigger] --> Drain[Execute: Unified Log-Drain]
```

## 🛡️ Enterprise Resiliency Features
- **Global SAFE_MODE Gating:** All destructive actions (Emails, CRM writes) are protected by a global environment flag to allow safe testing.
- **Unified Log-Drain Integration:** Pipes all node failures directly to the centralized `Log-Drain` (ID: `FEK7PNwR6I3XZygD`) for real-time Telegram alerts.
- **Fan-Out Reliability:** Parallel branches ensure that a failure in the CRM update does not block the client email delivery.
- **SMTP Cache Protection:** Automated `pinData` wiping during deployment ensures fresh SMTP executions and prevents silent item-collapsing.

## 💰 ROI Metrics
| Process | Manual | Automated | Improvement |
|:---|:---|:---|:---|
| Onboarding | ~6 Hours | ~30 Seconds | **720x Speed Increase** |
| Follow-Ups | ~15 Min/Day | 0 Min | **100% Autonomous** |
| Weekly Check-Ins | ~10 Min/Client | 0 Min | **100% Autonomous** |

## 🛠️ Setup & Deployment
1. Import `AI_Client_Onboarding_Machine.json`.
2. Configure `deploy_config.py` with your Sheet IDs and Credentials.
3. Run `deploy_handler.py` to push the configuration to n8n.
4. Ensure `SAFE_MODE=true` in your n8n environment for initial testing.
