# 🛠️ IT Helpdesk & Ticket Management System

> A modern, full-stack IT service management platform featuring AI-assisted ticket extraction from raw messages, engineer assignment and field dispatching, live geolocation tracking, interactive analytics, and comprehensive export capabilities.

---

## 🌟 Key Features

### ⚡ 1. Rapid AI-Powered Message Parser
- **Instant NLP Parsing**: Converts unstructured WhatsApp messages, chat logs, or customer emails into structured tickets using server-side Gemini AI.
- **Smart Model & Hardware Normalization**: Automatically recognizes hardware models (Dell OptiPlex, Acer Veriton, Brother Printers, Cisco Switches) and categorizes them accurately (`AIO`, `Printer`, `Switch`, etc.).
- **Auto-Fill & Fallback**: Automatically extracts user names, contact numbers, branch locations, issue descriptions, and serial numbers.

### 📋 2. Comprehensive Ticket Management
- **Full Lifecycle Tracking**: Track tickets from creation through `Open`, `Hold`, and `Closed` states.
- **Milestone & SLA Metrics**: Captures First Visit Date, Hold Date, and Close Date with automated **Resolution Days** calculations.
- **Multi-Format Export & Reporting**:
  - Export to Microsoft Excel (`.xlsx`) with formatted column layouts.
  - Export to CSV.
  - One-click formatted clipboard copy for spreadsheet pasting.
  - Print-ready and printable ticket summary views.
- **Bulk Batch Import**: Paste raw tabular data or TSV from Excel directly into the system for instant bulk ticket generation.

### 👥 3. Dedicated Engineer Portal & Field View
- **Mobile-Responsive Engineer Interface**: Tailored view for field engineers to inspect assigned tickets, update work notes, log actions taken, and mark resolutions on the go.
- **Audit Trails & Remarks**: Structured logging for action taken, parts required, and closing engineer remarks.

### 📍 4. Interactive Geolocation & Attendance
- **Live Location Mapping**: Leaflet-powered maps displaying service locations and branch offices.
- **Engineer Attendance Manager**: Daily check-in/check-out with browser geolocation verification for field staff.

### 📊 5. Administrative Analytics & SLA Dashboard
- **Real-Time KPIs**: Open tickets, closed counts, hold statuses, and average resolution turnaround times.
- **Workload Distribution**: Visual charts representing ticket volume across engineers, branch locations, and equipment categories.

---

## 🏗️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion |
| **Mapping & Visuals** | Leaflet, OpenStreetMap |
| **Spreadsheets & Data** | SheetJS (`xlsx`) |
| **Backend Server** | Node.js, Express, `tsx`, `esbuild` |
| **AI Integration** | `@google/genai` (Google Gemini Flash Models) |
| **Deployment / CI** | GitHub Actions, GitHub Pages, Cloud Run |

---

## 📁 Project Structure

```text
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automated GitHub Pages CI/CD workflow
├── data/                     # Local persistence & ticket data storage
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx       # KPI metrics & visual analytics
│   │   ├── AttendanceManager.tsx    # Geolocation-enabled staff attendance
│   │   ├── CreateTicketForm.tsx     # AI parser & manual ticket form
│   │   ├── EngineerDashboardView.tsx# Field engineer task management
│   │   ├── EngineersManager.tsx     # Staff & team administration
│   │   ├── LocationMap.tsx          # Leaflet map component
│   │   ├── TicketsTable.tsx         # Main interactive data table & exports
│   │   └── Toast.tsx                # Notification system
│   ├── utils/
│   │   └── modelNormalization.ts    # Hardware model & category rules
│   ├── App.tsx                      # Root navigation & layout controller
│   ├── db-service.ts                # Data access & database service layer
│   ├── main.tsx                     # React client entry point
│   └── types.ts                     # TypeScript definitions & schemas
├── server.ts                 # Full-stack Express backend & AI endpoints
├── package.json              # Project dependencies & scripts
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite build configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 20.x or 22.x+
- **npm** or **bun** / **yarn**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Create a `.env` file based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build & Production

To build the client application and bundled backend server:

```bash
npm run build
```

To run the production server:

```bash
npm start
```

---

## 🚢 Continuous Deployment (GitHub Pages)

The repository includes a ready-to-use GitHub Actions workflow in `.github/workflows/deploy.yml`:

1. In your GitHub repository, go to **Settings** $\rightarrow$ **Pages**.
2. Set the **Source** to **GitHub Actions**.
3. Push to your `main` or `master` branch to trigger automated deployment.

---

## 📄 License

This project is licensed under the MIT License.
