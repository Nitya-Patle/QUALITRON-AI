<<<<<<< HEAD
# QUALITRON AI — Advanced Quality Control & Monitoring System

## 🏗️ Project Structure
```
QUALITRON_AI/
├── backend/               ← Flask Python Backend
│   ├── app.py             ← Main entry point
│   ├── requirements.txt   ← Python packages
│   ├── .env.example       ← Environment variables template
│   ├── ai_engine/
│   │   ├── detector.py    ← YOLOv8 defect detection
│   │   └── camera_stream.py ← Live CCTV + OpenCV
│   ├── routes/
│   │   ├── auth.py        ← JWT login/register
│   │   ├── inspection.py  ← Image upload + AI
│   │   ├── dashboard.py   ← Analytics APIs
│   │   ├── reports.py     ← PDF + Excel generation
│   │   ├── camera.py      ← MJPEG streaming
│   │   └── alerts.py      ← Alert management
│   ├── models/
│   │   └── schemas.py     ← MongoDB document builders
│   ├── database/
│   │   └── db.py          ← MongoDB connection
│   └── utils/
│       ├── alerts.py      ← Email + SMS notifications
│       ├── barcode.py     ← QR/Barcode scanner
│       └── iot_sensor.py  ← MQTT IoT integration
│
└── frontend/              ← React Frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx         ← Main app + Auth context
        ├── theme.js        ← Colors + constants
        ├── index.css       ← Global styles
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── Topbar.jsx
        │   ├── KPICard.jsx
        │   └── SectionTitle.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx   ← KPIs, charts, trends
        │   ├── Inspect.jsx     ← AI image inspection
        │   ├── Camera.jsx      ← Live CCTV monitor
        │   ├── Analytics.jsx   ← Radar, predictive AI
        │   ├── Records.jsx     ← Inspection history
        │   ├── Alerts.jsx      ← Notifications
        │   ├── Reports.jsx     ← PDF/Excel download
        │   └── Settings.jsx    ← Config + RBAC
        └── utils/
            └── api.js          ← All API calls
```

## 🚀 Setup Instructions

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate        # Mac/Linux
pip install -r requirements.txt
cp .env.example .env            # Fill your values
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

### Demo Login
- Email:    admin@qualitron.ai
- Password: password123

## 🧠 Tech Stack
| Layer      | Technology                          |
|------------|-------------------------------------|
| AI Model   | YOLOv8x (ultralytics)               |
| Backend    | Flask, PyMongo, JWT, OpenCV         |
| Frontend   | React 18, Recharts, Vite            |
| Database   | MongoDB (Atlas or local)            |
| Reports    | ReportLab (PDF), openpyxl (Excel)   |
| Alerts     | SMTP email + Twilio SMS             |
| IoT        | MQTT via paho-mqtt                  |
| Camera     | OpenCV VideoCapture + MJPEG stream  |
| Auth       | JWT with role-based access (RBAC)   |

## 📦 Features
- ✅ YOLOv8 AI defect detection (image upload)
- ✅ Live CCTV monitoring with bounding boxes
- ✅ Smart dashboard — KPIs, charts, trends
- ✅ MongoDB — all inspection records stored
- ✅ PDF & Excel report generation
- ✅ Email + SMS defect alerts (Twilio)
- ✅ Barcode/QR code scanning
- ✅ IoT sensor integration (MQTT)
- ✅ Role-based auth (Admin/Manager/Employee)
- ✅ Predictive maintenance AI
- ✅ Dark mode UI
=======
# QUALITRON-AI
>>>>>>> 30b735b00cd7b2d97e9ad58ec6267fb7856a52ab
