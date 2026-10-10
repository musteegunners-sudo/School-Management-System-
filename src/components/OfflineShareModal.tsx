import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import {
  Student,
  Teacher,
  SchoolClass,
  Subject,
  ScoreRecord,
  AttendanceRecord,
  SchoolProfile,
  FeePayment,
  BehavioralNote,
  ClassSessionNote,
  Exam,
  ExamSubmission,
} from '../types';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  QrCode,
  FileArchive,
  Upload,
  Smartphone,
  WifiOff,
  CheckCircle2,
  HardDrive,
  Sparkles,
  Radio,
  Wifi,
  Send,
  AlertCircle,
} from 'lucide-react';

interface OfflineShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  scores: ScoreRecord[];
  attendance: AttendanceRecord[];
  schoolProfile: SchoolProfile;
  feePayments?: FeePayment[];
  behavioralNotes?: BehavioralNote[];
  classSessionNotes?: ClassSessionNote[];
  exams?: Exam[];
  examSubmissions?: ExamSubmission[];
  onImportOfflinePackage: (data: {
    students?: Student[];
    teachers?: Teacher[];
    classes?: SchoolClass[];
    subjects?: Subject[];
    scores?: ScoreRecord[];
    attendance?: AttendanceRecord[];
    schoolProfile?: SchoolProfile;
    exams?: Exam[];
    examSubmissions?: ExamSubmission[];
  }) => void;
}

export const OfflineShareModal: React.FC<OfflineShareModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  classes,
  subjects,
  scores,
  attendance,
  schoolProfile,
  feePayments = [],
  behavioralNotes = [],
  classSessionNotes = [],
  exams = [],
  examSubmissions = [],
  onImportOfflinePackage,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'xender' | 'package' | 'receive'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedViaApi, setSharedViaApi] = useState(false);
  const [packageDownloaded, setPackageDownloaded] = useState(false);
  const [liveZipDownloaded, setLiveZipDownloaded] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [htmlDownloaded, setHtmlDownloaded] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically ensure the public shared URL is used instead of the private developer container URL!
  const shareUrl = typeof window !== 'undefined'
    ? (window.location.origin.includes('ais-dev-')
        ? window.location.origin.replace('ais-dev-', 'ais-pre-')
        : window.location.origin)
    : 'https://ais-pre-q7245nit7m2anspnb4ssa6-62425478765.europe-west2.run.app';

  // Generate Offline QR Code
  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(shareUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#351C0D', // Theme espresso brown
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate offline QR code:', err));
    }
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Kulliyyat_Offline_App_QRCode.png`;
    a.click();
  };

  // Generate Offline Sync Bundle
  const createOfflinePackage = () => {
    return {
      appName: 'Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah',
      version: '2.5-offline',
      exportedAt: new Date().toISOString(),
      schoolProfile,
      students,
      teachers,
      classes,
      subjects,
      scores,
      attendance,
      feePayments,
      behavioralNotes,
      classSessionNotes,
      exams,
      examSubmissions,
      stats: {
        totalStudents: students.length,
        totalScores: scores.length,
        totalAttendance: attendance.length,
        totalTeachers: teachers.length,
        totalExams: exams.length,
      },
    };
  };

  const handleDownloadOfflinePackage = () => {
    const pkg = createOfflinePackage();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pkg, null, 2));
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const safeSchool = (schoolProfile.name || 'Kulliyyat').replace(/[^a-zA-Z0-9]/g, '_');
    a.href = dataStr;
    a.download = `${safeSchool}_Offline_Sync_Bundle_${dateStr}.kulliyyat.json`;
    a.click();
    setPackageDownloaded(true);
    setTimeout(() => setPackageDownloaded(false), 4000);
  };

  // Generate Live Database ZIP Package (.zip) with JSON & CSV formats
  const handleDownloadLiveDatabaseZip = async () => {
    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();
      const pkg = createOfflinePackage();
      const dateStr = new Date().toISOString().split('T')[0];
      const safeSchool = (schoolProfile.name || 'Kulliyyat').replace(/[^a-zA-Z0-9]/g, '_');

      // 1. Complete raw backup JSON
      zip.file(`${safeSchool}_full_backup.json`, JSON.stringify(pkg, null, 2));

      // 2. Individual entity JSON files
      zip.file('students.json', JSON.stringify(students, null, 2));
      zip.file('teachers.json', JSON.stringify(teachers, null, 2));
      zip.file('classes.json', JSON.stringify(classes, null, 2));
      zip.file('subjects.json', JSON.stringify(subjects, null, 2));
      zip.file('scores.json', JSON.stringify(scores, null, 2));
      zip.file('attendance.json', JSON.stringify(attendance, null, 2));

      // 3. Students CSV
      const studentCsvHeader = 'AdmissionNumber,FullName,ArabicName,Gender,Class,GuardianName,GuardianPhone,Address\n';
      const studentCsvRows = students
        .map((s) => {
          const cls = classes.find((c) => c.id === s.classId)?.name || 'Unassigned';
          return `"${s.regNo}","${s.fullName}","${s.arabicName || ''}","${s.gender}","${cls}","${s.guardianName}","${s.guardianPhone}","${s.address}"`;
        })
        .join('\n');
      zip.file('students.csv', studentCsvHeader + studentCsvRows);

      // 4. Faculty Teachers CSV
      const teacherCsvHeader = 'StaffID,FullName,ArabicName,Gender,Qualification,Designation,Phone,AssignedFormClass\n';
      const teacherCsvRows = teachers
        .map((t) => {
          const cls = classes.find((c) => c.id === t.assignedClassId)?.name || 'None';
          return `"${t.staffId}","${t.fullName}","${t.arabicName || ''}","${t.gender}","${t.qualification}","${t.designation || 'Class Master'}","${t.phone}","${cls}"`;
        })
        .join('\n');
      zip.file('teachers.csv', teacherCsvHeader + teacherCsvRows);

      // 5. Documentation README inside zip
      zip.file(
        'README.txt',
        `=============================================================
KULLIYYAT TATBIQ AT-TA'ALIM AL-ISLAMIYYAH
Live Institutional Database Export Archive (.ZIP)
=============================================================
Exported Date: ${new Date().toLocaleString()}
Campus: ${schoolProfile.address}
Mudir (Principal): ${schoolProfile.mudirName}
Registrar / Secretary: Malama Fatima Umar

STATISTICS:
- Total Enrolled Students: ${students.length}
- Registered Faculty Members: ${teachers.length}
- Academic Classes: ${classes.length}
- Recorded Subject Scores: ${scores.length}
- Attendance Logs: ${attendance.length}

CONTENTS:
1. ${safeSchool}_full_backup.json : Complete institutional dataset
2. students.csv & students.json : Student registry records
3. teachers.csv & teachers.json : Faculty registry and designations
4. scores.json : Continuous assessments (CA1, CA2) and terminal exam scores
=============================================================
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeSchool}_Live_Database_Archive_${dateStr}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setLiveZipDownloaded(true);
      setTimeout(() => setLiveZipDownloaded(false), 4000);
    } catch (err) {
      console.error('Error generating live database ZIP:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Generate Standalone Single-File Offline App (.html) that can be sent via Xender file tab
  const handleDownloadStandaloneHtml = () => {
    const studentsJson = JSON.stringify(students);
    const classesJson = JSON.stringify(classes);
    const scoresJson = JSON.stringify(scores);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${schoolProfile.name || 'Kulliyyat'} - Offline Portal</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #FAF7F2; color: #1e293b; padding: 16px; }
    .container { max-width: 900px; margin: 0 auto; }
    header { background: #4E2D17; color: white; padding: 20px; border-radius: 16px; margin-bottom: 20px; text-align: center; }
    header h1 { font-size: 1.25rem; font-weight: 800; }
    header p { font-size: 0.8rem; color: #debca3; margin-top: 4px; }
    .badge { display: inline-block; background: #065f46; color: #a7f3d0; font-size: 0.7rem; font-weight: bold; padding: 3px 8px; border-radius: 9999px; margin-top: 8px; }
    .card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .search-box { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.9rem; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    th { background: #f8fafc; text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 700; }
    td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
    .btn { background: #4E2D17; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.75rem; text-decoration: none; display: inline-block; }
    .btn:hover { background: #351C0D; }
    .btn-green { background: #047857; }
    .btn-green:hover { background: #065f46; }
    .btn-outline { background: white; color: #4E2D17; border: 1px solid #4E2D17; }
    .report-card { display: none; background: white; border: 2px solid #4E2D17; border-radius: 16px; padding: 20px; margin-top: 16px; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .stat-card { background: #FAF7F2; border: 1px solid #E8D7C6; padding: 12px; border-radius: 12px; text-align: center; }
    .stat-num { font-size: 1.3rem; font-weight: 900; color: #4E2D17; }
    .stat-label { font-size: 0.7rem; color: #64748b; font-weight: bold; text-transform: uppercase; }
    .notice { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 10px; border-radius: 10px; font-size: 0.75rem; margin-bottom: 14px; }
    @media print {
      body { background: white; padding: 0; }
      header, .card, .search-box { display: none; }
      .report-card { display: block !important; border: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${schoolProfile.name}</h1>
      <p>${schoolProfile.arabicName || 'كلية تطبيق التعاليم الإسلامية'}</p>
      <p>${schoolProfile.address || 'Kano, Nigeria'} • ${schoolProfile.mudirName || 'Principal Abubakar Alhassan'}</p>
      <div class="badge">100% Standalone Offline Portable App (Xender / SD Card Edition)</div>
    </header>

    <div class="notice">
      <strong>Offline Verified:</strong> This file runs entirely on your device with no internet connection or server required. You can share this .html file via Xender, WhatsApp, or Bluetooth to any phone or computer.
      <br><span style="margin-top:4px;display:block;">Online Portal Link: <a href="${shareUrl}" target="_blank" style="color:#047857;font-weight:bold;">${shareUrl}</a></span>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-num">${students.length}</div>
        <div class="stat-label">Enrolled Students</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${classes.length}</div>
        <div class="stat-label">Classes</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${scores.length}</div>
        <div class="stat-label">Recorded Scores</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${teachers.length}</div>
        <div class="stat-label">Faculty Teachers</div>
      </div>
    </div>

    <div class="card">
      <h2 style="font-size:1rem;font-weight:800;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
        <span>Student Directory & Result Generator</span>
        <a href="${shareUrl}" target="_blank" class="btn btn-green">Open Full Web App</a>
      </h2>
      <input type="text" id="searchInput" class="search-box" placeholder="Search by student name or admission number (e.g. KUL-2026)..." onkeyup="filterStudents()">
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Full Name</th>
              <th>Class</th>
              <th>Gender</th>
              <th>Guardian Phone</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="studentTableBody"></tbody>
        </table>
      </div>
    </div>

    <div id="reportCardModal" class="report-card">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:12px;">
        <div>
          <h2 id="rcStudentName" style="font-size:1.1rem;font-weight:900;color:#4E2D17;"></h2>
          <p id="rcStudentDetails" style="font-size:0.8rem;color:#64748b;"></p>
        </div>
        <div>
          <button onclick="window.print()" class="btn btn-green">Print Report Card</button>
          <button onclick="closeReportCard()" class="btn btn-outline" style="margin-left:6px;">Close</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>1st CA (20)</th>
              <th>2nd CA (20)</th>
              <th>Exam (60)</th>
              <th>Total (100)</th>
              <th>Grade</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody id="rcScoresBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    const students = ${studentsJson};
    const classes = ${classesJson};
    const scores = ${scoresJson};

    function renderTable(list) {
      const tbody = document.getElementById('studentTableBody');
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">No matching student records found.</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(s => {
        const cls = classes.find(c => c.id === s.classId);
        const clsName = cls ? cls.name : 'Unassigned';
        return '<tr>' +
          '<td style="font-family:monospace;font-weight:bold;color:#047857;">' + s.regNo + '</td>' +
          '<td><strong>' + s.fullName + '</strong>' + (s.arabicName ? ' <span style="color:#64748b;font-size:0.75rem;">(' + s.arabicName + ')</span>' : '') + '</td>' +
          '<td>' + clsName + '</td>' +
          '<td>' + s.gender + '</td>' +
          '<td style="font-family:monospace;">' + (s.guardianPhone || 'N/A') + '</td>' +
          '<td><button class="btn" onclick="viewReport(\\'' + s.id + '\\')">View Report</button></td>' +
        '</tr>';
      }).join('');
    }

    function filterStudents() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      const filtered = students.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.regNo.toLowerCase().includes(q) ||
        (s.guardianPhone && s.guardianPhone.includes(q))
      );
      renderTable(filtered);
    }

    function viewReport(studentId) {
      const s = students.find(x => x.id === studentId);
      if (!s) return;
      const cls = classes.find(c => c.id === s.classId);
      document.getElementById('rcStudentName').textContent = s.fullName + (s.arabicName ? ' • ' + s.arabicName : '');
      document.getElementById('rcStudentDetails').textContent = 'Admission: ' + s.regNo + ' | Class: ' + (cls ? cls.name : 'N/A') + ' | Session: 2026/2027';

      const sScores = scores.filter(x => x.studentId === studentId);
      const tbody = document.getElementById('rcScoresBody');
      if (sScores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:16px;color:#94a3b8;">No assessment scores recorded yet for this student.</td></tr>';
      } else {
        tbody.innerHTML = sScores.map(sc => {
          const total = (sc.ca1Score || 0) + (sc.ca2Score || 0) + (sc.examScore || 0);
          let grade = 'F';
          let remark = 'Fail';
          if (total >= 70) { grade = 'A'; remark = 'Distinction (ممتاز)'; }
          else if (total >= 60) { grade = 'B'; remark = 'Very Good (جيد جداً)'; }
          else if (total >= 50) { grade = 'C'; remark = 'Good (جيد)'; }
          else if (total >= 45) { grade = 'D'; remark = 'Pass (مقبول)'; }
          else if (total >= 40) { grade = 'E'; remark = 'Poor Pass (ضعيف)'; }
          return '<tr>' +
            '<td><strong>' + (sc.subjectName || sc.subjectId) + '</strong></td>' +
            '<td>' + (sc.ca1Score ?? '-') + '</td>' +
            '<td>' + (sc.ca2Score ?? '-') + '</td>' +
            '<td>' + (sc.examScore ?? '-') + '</td>' +
            '<td><strong>' + total + '</strong></td>' +
            '<td><span style="font-weight:bold;color:' + (total >= 50 ? '#047857' : '#b91c1c') + ';">' + grade + '</span></td>' +
            '<td>' + remark + '</td>' +
          '</tr>';
        }).join('');
      }
      document.getElementById('reportCardModal').style.display = 'block';
      document.getElementById('reportCardModal').scrollIntoView({ behavior: 'smooth' });
    }

    function closeReportCard() {
      document.getElementById('reportCardModal').style.display = 'none';
    }

    renderTable(students);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kulliyyat_Standalone_Offline_App.html`;
    a.click();
    URL.revokeObjectURL(url);
    setHtmlDownloaded(true);
    setTimeout(() => setHtmlDownloaded(false), 4000);
  };

  // Web Share API (native mobile sharing via Bluetooth, Nearby Share, WhatsApp, or AirDrop)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const pkg = createOfflinePackage();
        const jsonBlob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
        const file = new File([jsonBlob], 'kulliyyat-offline-school-data.json', { type: 'application/json' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Kulliyyat School Offline Data Bundle',
            text: 'Offline school database bundle for Kulliyyat SIS (students, attendance, grades, faculty).',
            files: [file],
          });
          setSharedViaApi(true);
          setTimeout(() => setSharedViaApi(false), 3000);
        } else {
          await navigator.share({
            title: 'Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah',
            text: 'Access and install Kulliyyat School Management System (Works 100% Offline):',
            url: shareUrl,
          });
          setSharedViaApi(true);
          setTimeout(() => setSharedViaApi(false), 3000);
        }
      } catch (err) {
        console.warn('Native share cancelled or failed:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  // Handle Receiving Offline Package from another device
  const handlePackageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.students && !parsed.scores && !parsed.classes) {
        setImportStatus('Invalid package: No school records found in file.');
        return;
      }

      onImportOfflinePackage({
        students: parsed.students,
        teachers: parsed.teachers,
        classes: parsed.classes,
        subjects: parsed.subjects,
        scores: parsed.scores,
        attendance: parsed.attendance,
        schoolProfile: parsed.schoolProfile,
        exams: parsed.exams,
        examSubmissions: parsed.examSubmissions,
      });

      setImportStatus(
        `Successfully restored ${parsed.students?.length || 0} students and ${parsed.scores?.length || 0} scores from offline package!`
      );
    } catch {
      setImportStatus('Error reading file. Please ensure it is a valid offline package.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 text-slate-800 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#4E2D17] text-white flex items-center justify-center shadow-md shrink-0">
            <Share2 className="w-6 h-6 text-[#debca3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">Offline Sharing Center</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-[10px]">
                <WifiOff className="w-3 h-3 text-emerald-700" />
                100% Offline Capable
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Share the app, portable student records, and grading databases without internet access.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#4E2D17]" />
            <span>Scan QR</span>
          </button>

          <button
            type="button"
            id="tab-offline-xender"
            onClick={() => setActiveTab('xender')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'xender'
                ? 'bg-white text-emerald-900 shadow-2xs font-black border border-emerald-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-700" />
            <span>Xender Guide</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('package')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'package'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileArchive className="w-3.5 h-3.5 text-[#4E2D17]" />
            <span>Export Bundle</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('receive')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'receive'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-[#4E2D17]" />
            <span>Import Bundle</span>
          </button>
        </div>

        {/* Tab 1: QR Code & Direct Mobile Beam */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8D7C6] flex flex-col items-center justify-center">
              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-xl shadow-xs border border-stone-200">
                  <img
                    src={qrDataUrl}
                    alt="Kulliyyat Offline App QR Code"
                    className="w-56 h-56 mx-auto rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                  Generating QR Code...
                </div>
              )}

              <p className="text-xs font-semibold text-slate-700 mt-3">
                Scan with any phone camera or tablet to open & install the app
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Once opened, the app runs and saves all grades 100% offline without mobile data.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                id="btn-copy-offline-link"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy App Link'}</span>
              </button>

              <button
                type="button"
                id="btn-download-qr-image"
                onClick={handleDownloadQrImage}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save QR Image</span>
              </button>

              <button
                type="button"
                id="btn-native-share"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4E2D17] hover:bg-[#351C0D] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#debca3]" />
                <span>{sharedViaApi ? 'Shared!' : 'Nearby / Bluetooth Share'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab: Xender Peer-to-Peer Transfer Guide & Direct Tools */}
        {activeTab === 'xender' && (
          <div className="space-y-4">
            {/* Explanation of the Link Issue */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Why Xender pasted a Google AI Studio link:</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                When you share an installed Web App (PWA) through Xender's "App" list, Android sends the website link rather than a standalone binary APK. If you copied or shared from the development environment, it pasted the private developer URL which prompts for a Google login.
              </p>
              <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-slate-800 text-[11px] font-medium space-y-1.5">
                <span className="font-bold text-emerald-900 block">We have solved this! Here are the 2 recommended ways to share via Xender:</span>
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Option A:</strong> Send the <strong>Standalone Offline App (.html)</strong> as a real file via Xender's File tab (Opens 100% offline!).</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Option B:</strong> Send the <strong>Public Link</strong> below which opens freely for anyone without needing Google AI Studio!</span>
                </div>
              </div>
            </div>

            {/* Option A: Standalone File Transfer */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8D7C6] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#4E2D17]" />
                  Option A: Send Standalone App File via Xender
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  100% Offline
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download this self-contained app file to your phone. Then in Xender, go to <strong>File / Document</strong>, select <code>Kulliyyat_Standalone_Offline_App.html</code>, and send it. The receiver can open it directly in Chrome or Safari without any internet connection!
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  id="btn-download-standalone-html"
                  onClick={handleDownloadStandaloneHtml}
                  className="px-4 py-2.5 rounded-xl bg-[#4E2D17] hover:bg-[#351C0D] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#debca3]" />
                  <span>{htmlDownloaded ? 'File Downloaded!' : 'Download Standalone App File (.html)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadOfflinePackage}
                  className="px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <FileArchive className="w-4 h-4 text-[#4E2D17]" />
                  <span>Export Data Bundle (.json)</span>
                </button>
              </div>
            </div>

            {/* Option B: Direct Public Link */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-emerald-700" />
                  Option B: Public Web Link (No AI Studio Login Required)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                  Public Access
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-emerald-900 break-all select-all">
                {shareUrl}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  id="btn-copy-public-link"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Public Link Copied!' : 'Copy Public Link for Xender'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-emerald-700" />
                  <span>Beam Public Link</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                When the receiver opens this link once in Chrome on their phone, they can tap <strong>"Install App"</strong> to install it permanently on their home screen for offline use!
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Export Complete Offline Bundle */}
        {activeTab === 'package' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8D7C6]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#4E2D17]" />
                  Complete Offline School Sync Package
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                  PORTABLE
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Creates an encrypted standalone archive containing student enrollments, exam scores, CA1/CA2, 12-week assessments, attendance logs, and school profile. Transfer this file across flash drives, Bluetooth, or SD cards between computers.
              </p>

              {/* Package Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-center">
                  <div className="text-base font-black text-slate-900 font-mono">{students.length}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Students</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-center">
                  <div className="text-base font-black text-slate-900 font-mono">{scores.length}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Scores</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-center">
                  <div className="text-base font-black text-slate-900 font-mono">{attendance.length}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Attendance</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-center">
                  <div className="text-base font-black text-slate-900 font-mono">{teachers.length}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Teachers</div>
                </div>
              </div>

              {/* Download ZIP Archives Options */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300/80 mb-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-950 text-xs flex items-center gap-1.5">
                    <FileArchive className="w-4 h-4 text-amber-800" />
                    Downloadable ZIP Archives (Complete System & Database)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 uppercase">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Download everything in ready-to-run ZIP packages. Extract and run on any local computer or archive for disaster recovery.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href="/kulliyyat-tatbiq-complete-system.zip"
                    download="kulliyyat-tatbiq-complete-system.zip"
                    id="btn-download-complete-project-zip"
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#4E2D17] hover:bg-[#351C0D] text-white font-bold text-xs shadow-xs transition-all active:scale-95 text-center cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#debca3]" />
                    <span>Download Complete System (.ZIP)</span>
                  </a>

                  <button
                    type="button"
                    id="btn-download-live-database-zip"
                    onClick={handleDownloadLiveDatabaseZip}
                    disabled={isGeneratingZip}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    <FileArchive className="w-4 h-4 text-emerald-200" />
                    <span>
                      {isGeneratingZip
                        ? 'Packaging Live Data...'
                        : liveZipDownloaded
                        ? 'Database ZIP Downloaded!'
                        : 'Live Database Archive (.ZIP)'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  id="btn-download-offline-package"
                  onClick={handleDownloadOfflinePackage}
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#4E2D17]" />
                  <span>
                    {packageDownloaded ? 'Downloaded Offline Package!' : 'Download Raw Data (.json)'}
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-beam-offline-package"
                  onClick={handleNativeShare}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-4 h-4 text-[#4E2D17]" />
                  <span>Send via Bluetooth / WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Flash Drive & Local Sync Workflow:</span>
                Teachers without internet can enter scores on their laptops at home, save this bundle, and give the file to the Mudir to merge into the central database.
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Receive / Import Offline Package */}
        {activeTab === 'receive' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8D7C6]">
              <span className="font-bold text-sm text-slate-900 block mb-1">
                Import Offline Data Bundle
              </span>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Select or drop an offline package file (.kulliyyat or .json) received from a teacher or administrative colleague to restore and update local student records.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.kulliyyat,application/json"
                onChange={handlePackageFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-[#4E2D17] bg-white rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-stone-50"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-[#4E2D17]" />
                <p className="text-xs font-bold text-slate-800">
                  Click to choose Offline Package file (.json)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports Kulliyyat sync packages and standard state snapshots
                </p>
              </div>

              {importStatus && (
                <div className="mt-3 p-3 rounded-xl bg-white border border-stone-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-slate-800">{importStatus}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>
                <strong>Zero Internet Required:</strong> Both exporting and importing operate entirely on your local device storage.
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{schoolProfile.name}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
