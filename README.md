# CreditWise AI – Credit Scoring & Creditworthiness Prediction System

A premium, AI-powered credit scoring web application built as a single self-contained HTML file.

---

## 🚀 How to Run

### Option 1 — Open Directly (Recommended)
Simply open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).

```
double-click → index.html
```

### Option 2 — Local Server
```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# Then open: http://localhost:8080
```

---

## 📁 Project Structure

```
creditwise_ai/
├── index.html        ← Complete application (single file)
└── README.md         ← This file
```

---

## 🎯 Features

| Feature | Description |
|---|---|
| **AI Credit Scoring** | Claude Sonnet AI analyzes financial profiles in real-time |
| **5 Pages** | Home, Predict, Analytics, Models, History |
| **Rule-based Fallback** | Works offline if API is unavailable |
| **Dark Mode** | Full dark/light theme toggle |
| **Try Demo** | One-click demo with pre-filled data and instant prediction |
| **Prediction History** | Session-based history with CSV export |
| **4 Analytics Charts** | Bar, Radar, Histogram, Doughnut via Chart.js |
| **Mobile Responsive** | Full hamburger menu and responsive layouts |
| **Multi-Model Comparison** | Random Forest, Decision Tree, Logistic Regression |

---

## 🤖 AI Integration

The app calls the Anthropic Claude API (`claude-sonnet-4-6`) for real-time predictions.

- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-6`
- **Fallback:** If the API is unavailable, a rule-based scoring algorithm runs locally

The API key is injected by the Claude.ai environment. To use this standalone:
1. Add `"x-api-key": "YOUR_KEY"` to the fetch headers in `index.html`
2. Also add `"anthropic-version": "2023-06-01"` header

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary Blue | `#2563EB` |
| Dark Navy | `#0F172A` |
| Teal Accent | `#14B8A6` |
| Success Green | `#22C55E` |
| Danger Red | `#EF4444` |
| Warning Amber | `#F59E0B` |

---

## 📱 Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## ⚠️ Disclaimer

For educational and demonstration purposes only.
Not intended for use in actual financial decision-making.

---

© 2026 CreditWise AI
