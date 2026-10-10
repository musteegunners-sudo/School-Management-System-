# Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah
## كلية تطبيق التعاليم الإسلامية (College for Practising Islamic Teachings)
**Campus:** Kasuwan Magani Campus  
**Lead Administrator:** Principal Abubakar Alhassan (Mudir)  
**Admissions Registrar:** Malama Fatima Umar (School Secretary)

---

## 🌟 Overview
Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah is a full-stack Islamic college management system designed for robust bilingual (English & Arabic) administration, real-time student evaluation, continuous assessments, computer-based testing (CBT), bursary finances, official report cards, and centralized cloud synchronization with Google Cloud Firestore.

---

## 🏛️ Statutory Administrative Mandates

### 1. Student Registration & Admissions (Secretary Only)
* **Official Officer:** Malama Fatima Umar (School Secretary & Admissions Registrar).
* **Exclusive Powers:**
  * Enrolling new students with English & Arabic names, admission numbers (e.g., `KUL-2026-0001`), gender, date of birth, and guardian contacts.
  * Capturing and uploading live student passport photographs.
  * Generating student 6-digit portal access PINs and auto-forwarding credentials via SMS / WhatsApp.
  * Printing official college Admission Confirmation Letters with bilingual Arabic crest and Mudir endorsement.
  * Broadcasting circular notices and announcements to students and parents.

### 2. Faculty Teacher Registration & Designation (Principal Only)
* **Executive Authority:** Principal Abubakar Alhassan (Super User / Mudir).
* **Exclusive Powers:**
  * Registering faculty members with Staff IDs (e.g., `TCH-2026-001`), mobile phone numbers, and qualifications.
  * **Class Teacher Designation:** Appointing the official Form Master for classes, which automatically wires their name and signature to terminal report cards.
  * **Curriculum Subject Allocations:** Assigning subjects taught across Islamic Studies, Arabic, Sciences, and Arts.
  * **Executive Titles & Designations:** Conferring official appointments (*Form Master*, *HOD Islamic Studies & Shari'ah*, *Senior Arabic Language Specialist*, *Sciences & ICT Tutor*).

---

## 👥 Default Demo Credentials & Roles

| Role | Name | Identifier / Phone | Default Password / PIN | Mandate & Features |
| :--- | :--- | :--- | :--- | :--- |
| **Principal (Mudir)** | Principal Abubakar Alhassan | `musteegunners@gmail.com` or `admin` | `admin123` or `2026` | Faculty Registration, Designations, System Setup, Report Authorization |
| **School Secretary** | Malama Fatima Umar | `SEC-2026-001` or `secretary` | `sec2026` | Student Registration & Admissions, Credentials Dispatch, Circular Notices |
| **Faculty Teacher** | Mustapha Danmari | `08130366258` | `2026` | Form Class I'dadi 1, Weekly Unit Assessment Grading, Attendance, CBT Authoring |
| **School Bursar** | Mallam Usman Bello | `ACC-2026-001` or `bursar` | `acc2026` | School Fees, Bank & Cash Receipts, Expense Vouchers, Fee Waivers |
| **Enrolled Student** | Zuhriyya Nura | `KUL-2026-0001` | `2026` | Student Portal, CBT Exam Center, Terminal Result Sheets, Class Circulars |

---

## 🚀 Quick Start & Installation

### Requirements
- **Node.js** v18+ or v20+
- **npm** or **bun** / **yarn**

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The server runs on `http://localhost:3000` with full Express backend and Vite hot middleware.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 📂 Project Architecture

```
├── index.html                 # App HTML shell, PWA metadata, Arabic typography
├── package.json               # Full-stack dependencies & scripts
├── server.ts                  # Express backend proxy, Gemini AI generator, ZIP download
├── tsconfig.json              # TypeScript compilation rules
├── vite.config.ts             # Vite SPA & PWA configuration
├── firestore.rules            # Firestore Cloud security rules
├── firebase-blueprint.json    # Firestore schema & collections definitions
├── public/                    # Static assets, PWA icons, offline packages, project ZIP
└── src/
    ├── App.tsx                # Top navigation, role switching, tab routing
    ├── types.ts               # Core TypeScript definitions (Student, Teacher, Score, etc.)
    ├── components/
    │   ├── SecretaryDashboardView.tsx   # Secretary Admissions & Registration Desk
    │   ├── TeacherRegistrationView.tsx  # Principal's Faculty Registration & Designation
    │   ├── StudentRegistrationView.tsx  # Student Directory & Registration Enforcement
    │   ├── StudentDashboardView.tsx      # Enrolled Student Academic Portal
    │   ├── ExamCenterStudentView.tsx     # Student CBT Objective Examination Portal
    │   ├── ExamCenterTeacherView.tsx     # Faculty CBT Examination Authoring & Marking
    │   ├── GradeEntryView.tsx            # Continuous Assessment (CA1, CA2, Exam) Grading
    │   ├── AttendanceView.tsx            # 12-week unit attendance tracking
    │   ├── PositionsRankingView.tsx      # Automated 1st to Nth standing & GPA statistics
    │   ├── AccountantDashboardView.tsx   # Bursary, tuition fee collection & vouchers
    │   ├── DatabaseBackupView.tsx        # Central Cloud Sync & Offline ZIP backups
    │   ├── OfflineShareModal.tsx         # Bluetooth, QR Code, & Complete ZIP download
    │   └── LoginView.tsx                 # 1-Click Multi-Role Authentication Switcher
    ├── context/
    │   └── ArabicKeyboardContext.tsx    # Virtual Arabic floating keyboard
    ├── data/
    │   └── seedData.ts                  # Pioneer students, classes, subjects, exams
    ├── services/
    │   └── firebaseService.ts           # Centralized Cloud Firestore synchronization
    └── utils/
        └── storage.ts                   # Resilient local storage with cloud fallback
```

---

## 🔒 Offline & Security Features
- **PWA Ready**: Works offline on smartphones, tablets, and desktop browsers without internet access.
- **Local & Cloud Sync**: Data seamlessly caches locally in IndexedDB / LocalStorage and synchronizes with Google Cloud Firestore when connected.
- **Offline Sharing Center**: Allows transferring the app and school data between devices using QR codes, Bluetooth, and downloadable ZIP archives.
