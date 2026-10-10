import React, { useState, useEffect } from 'react';
import {
  Student,
  Teacher,
  SchoolClass,
  Subject,
  ScoreRecord,
  AttendanceRecord,
  SchoolProfile,
  AcademicSession,
  Term,
  AuditLog,
  BehavioralNote,
  ClassSessionNote,
} from '../types';
import {
  Database,
  Cloud,
  CloudCheck,
  RefreshCw,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  Search,
  Shield,
  Clock,
  Server,
  Activity,
  Layers,
  Check,
  HardDrive,
  Bookmark,
  FileText,
} from 'lucide-react';
import {
  testCloudConnection,
  pushAllToCloud,
  fetchAllFromCloud,
  logAuditEvent,
  CloudStatus,
} from '../services/firebaseService';

interface AdminCentralDatabaseViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  scores: ScoreRecord[];
  attendance: AttendanceRecord[];
  schoolProfile: SchoolProfile;
  currentSession: AcademicSession;
  currentTerm: Term;
  auditLogs: AuditLog[];
  behavioralNotes?: BehavioralNote[];
  classSessionNotes?: ClassSessionNote[];
  onDataRestored: (payload: {
    students?: Student[];
    teachers?: Teacher[];
    classes?: SchoolClass[];
    subjects?: Subject[];
    scores?: ScoreRecord[];
    attendance?: AttendanceRecord[];
    schoolProfile?: SchoolProfile;
    behavioralNotes?: BehavioralNote[];
    classSessionNotes?: ClassSessionNote[];
  }) => void;
  onAddAuditLog: (log: AuditLog) => void;
}

type DatabaseTab = 'overview' | 'students' | 'teachers' | 'scores' | 'classes' | 'audit';

export const AdminCentralDatabaseView: React.FC<AdminCentralDatabaseViewProps> = ({
  students,
  teachers,
  classes,
  subjects,
  scores,
  attendance,
  schoolProfile,
  currentSession,
  currentTerm,
  auditLogs,
  behavioralNotes = [],
  classSessionNotes = [],
  onDataRestored,
  onAddAuditLog,
}) => {
  const [activeTab, setActiveTab] = useState<DatabaseTab>('overview');
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>({
    isConnected: false,
    projectId: '',
    databaseId: '',
    lastSynced: null,
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditFilter, setAuditFilter] = useState<'all' | 'academic' | 'cloud_system'>('all');
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBannerNotice({ type, message });
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Check cloud connection on mount
  useEffect(() => {
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setIsTesting(true);
    try {
      const res = await testCloudConnection();
      setCloudStatus(res);
    } catch (err: any) {
      setCloudStatus({
        isConnected: false,
        projectId: '',
        databaseId: '',
        lastSynced: null,
        error: err?.message || 'Connection check failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Push all to Firestore cloud
  const handlePushAllToCloud = async () => {
    setIsSyncing(true);
    try {
      await pushAllToCloud({
        students,
        teachers,
        classes,
        subjects,
        scores,
        attendance,
        schoolProfile,
        behavioralNotes,
        classSessionNotes,
      });

      const nowStr = new Date().toISOString();
      setCloudStatus((prev) => ({
        ...prev,
        isConnected: true,
        lastSynced: nowStr,
      }));

      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        action: 'CENTRAL_CLOUD_SYNC',
        details: `Administrator pushed entire database (${students.length} students, ${teachers.length} teachers, ${scores.length} scores, ${classSessionNotes.length} session notes, ${behavioralNotes.length} behavioral observations) to Firestore.`,
        timestamp: nowStr,
        actor: 'Admin',
      };
      onAddAuditLog(newLog);

      showBanner('success', 'Centralized Database synchronized to Firebase Firestore successfully!');
    } catch (err: any) {
      showBanner('error', `Cloud synchronization error: ${err?.message || 'Check network connection'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull all from Firestore cloud
  const handlePullFromCloud = async () => {
    setIsPulling(true);
    try {
      const cloudData = await fetchAllFromCloud();
      if (!cloudData) {
        showBanner('error', 'No response received from centralized Firestore database.');
        return;
      }

      onDataRestored({
        students: cloudData.students?.length ? cloudData.students : undefined,
        teachers: cloudData.teachers?.length ? cloudData.teachers : undefined,
        classes: cloudData.classes?.length ? cloudData.classes : undefined,
        subjects: cloudData.subjects?.length ? cloudData.subjects : undefined,
        scores: cloudData.scores?.length ? cloudData.scores : undefined,
        attendance: cloudData.attendance?.length ? cloudData.attendance : undefined,
        schoolProfile: cloudData.schoolProfile,
        behavioralNotes: cloudData.behavioralNotes?.length ? cloudData.behavioralNotes : undefined,
        classSessionNotes: cloudData.classSessionNotes?.length ? cloudData.classSessionNotes : undefined,
      });

      const nowStr = new Date().toISOString();
      setCloudStatus((prev) => ({
        ...prev,
        isConnected: true,
        lastSynced: nowStr,
      }));

      showBanner('success', `Central database pulled! Loaded ${cloudData.students?.length || 0} students, ${cloudData.teachers?.length || 0} teachers, and ${cloudData.classSessionNotes?.length || 0} session logs.`);
    } catch (err: any) {
      showBanner('error', `Could not pull from cloud database: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsPulling(false);
    }
  };

  // Export database JSON
  const handleExportJson = () => {
    const backupObj = {
      version: '2.0.0-centralized',
      schoolName: schoolProfile.name,
      exportedAt: new Date().toISOString(),
      schoolProfile,
      students,
      teachers,
      classes,
      subjects,
      scores,
      attendance,
      behavioralNotes,
      classSessionNotes,
      auditLogs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `Kulliyyat_Central_Database_Backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showBanner('success', 'Centralized database exported successfully.');
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.students || json.teachers || json.scores) {
          onDataRestored({
            students: json.students,
            teachers: json.teachers,
            classes: json.classes,
            subjects: json.subjects,
            scores: json.scores,
            attendance: json.attendance,
            behavioralNotes: json.behavioralNotes,
            classSessionNotes: json.classSessionNotes,
          });

          showBanner('success', 'Database JSON backup successfully restored!');
        } else {
          showBanner('error', 'Invalid database file format.');
        }
      } catch (err) {
        showBanner('error', 'Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-700" />
            <span>Admin Central Database Console</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Cloud Firestore Enabled
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized institutional data repository for Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah. All students, faculty teachers, classes, and marks stored in one secure database.
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={runHealthCheck}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all disabled:opacity-50"
            title="Ping Firestore database connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-600' : ''}`} />
            Check Connection
          </button>

          <button
            onClick={handlePullFromCloud}
            disabled={isPulling}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 shadow-2xs transition-all disabled:opacity-50"
          >
            <Cloud className={`w-4 h-4 ${isPulling ? 'animate-bounce text-emerald-700' : 'text-emerald-700'}`} />
            {isPulling ? 'Pulling Data...' : 'Pull from Cloud'}
          </button>

          <button
            id="btn-sync-cloud-database"
            onClick={handlePushAllToCloud}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            <Upload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All to Cloud Database'}
          </button>
        </div>
      </div>

      {/* Banner Feedback */}
      {bannerNotice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border animate-fade-in ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {bannerNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{bannerNotice.message}</span>
        </div>
      )}

      {/* Cloud Status & Infrastructure Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ring-4 ${
              cloudStatus.isConnected
                ? 'bg-emerald-500 ring-emerald-100'
                : 'bg-amber-500 ring-amber-100'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">
                {cloudStatus.isConnected ? 'Central Database Connected (Live Firestore)' : 'Connecting to Firestore...'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700">
                {cloudStatus.projectId || 'gen-lang-client-0589561651'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
              <span>Database: <strong className="font-mono text-emerald-900">ai-studio-kulliyyattabqatt</strong></span>
              <span>•</span>
              <span>
                Last Synced:{' '}
                {cloudStatus.lastSynced
                  ? new Date(cloudStatus.lastSynced).toLocaleTimeString()
                  : 'Pending first sync'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Backup JSON
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Restore JSON
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* Aggregate Database Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-600">Students</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{students.length}</div>
          <span className="text-[10px] text-slate-400">Total enrolled</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-600">Teachers</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{teachers.length}</div>
          <span className="text-[10px] text-blue-700">Wired to reports</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-600">Classes</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{classes.length}</div>
          <span className="text-[10px] text-slate-400">Nursery to Thanawi</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-600">Subjects</span>
            <BookOpen className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{subjects.length}</div>
          <span className="text-[10px] text-slate-400">Curriculum</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-600">Score Records</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{scores.length}</div>
          <span className="text-[10px] text-slate-400">12-Wk & Terminal</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-600">Audit Events</span>
            <Activity className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{auditLogs.length}</div>
          <span className="text-[10px] text-slate-400">Tracked actions</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'overview' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Overview
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'students' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Students Register ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'teachers' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Faculty Teachers ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'scores' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Grades & Scores ({scores.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'classes' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Classes & Form Allocation
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'audit' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail
          </button>
        </div>

        {/* Global Search inside database tab */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Tab Content Display */}

      {/* 1. System Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-700" />
              Centralized Institution Schema
            </h3>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                The school information architecture operates on a <strong>single centralized relational model</strong> synchronized directly to Google Cloud Firestore:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>
                  <strong>Teachers Collection</strong>: Stores staff profile, qualifications, and form class assignments. Form teacher names dynamically resolve on all student terminal reports and continuous assessments.
                </li>
                <li>
                  <strong>Students Collection</strong>: Tracks admission registration numbers, academic year sessions, demographic records, and guardian contacts.
                </li>
                <li>
                  <strong>Assessment Scores Collection</strong>: Consolidates the 12-week unit assignments (0-4 pts/week, 48 total), Continuous Assessment tests (CA1, CA2), terminal exam marks (60 pts), and automated grade scales.
                </li>
                <li>
                  <strong>Classes & Arm Allocation</strong>: Links student cohorts to form teachers with automated signature generation.
                </li>
              </ul>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              Database Security & Administrative Controls
            </h3>
            <div className="text-xs text-slate-600 space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Firestore Security Rules</span>
                  <span className="text-[11px] text-slate-500">Active rules deployed to project</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Deployed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Academic Session</span>
                  <span className="text-[11px] text-slate-500">{currentSession.name} • {currentTerm.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  Current
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Institution Principal / Mudir</span>
                  <span className="text-[11px] text-slate-500">{schoolProfile.mudirName}</span>
                </div>
                <span className="text-xs font-arabic text-emerald-800" dir="rtl">
                  {schoolProfile.arabicMotto}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Students Register Table */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between">
            <span>Enrolled Students Registry ({students.length})</span>
            <span className="text-slate-400">Central Database View</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Reg Number</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Academic Year</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Guardian</th>
                  <th className="py-2.5 px-3">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No students registered in central database.
                    </td>
                  </tr>
                ) : (
                  students
                    .filter((s) => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.regNo.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((student, idx) => {
                      const cls = classes.find((c) => c.id === student.classId);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-900">{student.regNo}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{student.fullName}</td>
                          <td className="py-2 px-3 text-slate-700">{cls?.name || student.classId}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono">{student.academicYear || '2026/2027'}</td>
                          <td className="py-2 px-3 text-slate-600">{student.gender}</td>
                          <td className="py-2 px-3 text-slate-600">{student.guardianName || '—'}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono">{student.guardianPhone || '—'}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Teachers Table */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between">
            <span>Registered Faculty & Form Teachers ({teachers.length})</span>
            <span className="text-emerald-700 font-medium">Dynamically linked to student report cards</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Staff ID</th>
                  <th className="py-2.5 px-3">Teacher Name</th>
                  <th className="py-2.5 px-3">Assigned Class (Form Teacher)</th>
                  <th className="py-2.5 px-3">Qualification</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No teachers registered in central database.
                    </td>
                  </tr>
                ) : (
                  teachers
                    .filter((t) => t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || t.staffId.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((teacher, idx) => {
                      const assignedCls = classes.find((c) => c.id === teacher.assignedClassId);
                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-900">{teacher.staffId}</td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-900">{teacher.fullName}</span>
                            {teacher.arabicName && (
                              <span className="text-emerald-800 font-arabic ml-1.5" dir="rtl">
                                ({teacher.arabicName})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {assignedCls ? (
                              <span className="font-bold text-emerald-900 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                                {assignedCls.name} ({assignedCls.section})
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{teacher.qualification}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono">{teacher.phone}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                teacher.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {teacher.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Grades and Assessment Scores Table */}
      {activeTab === 'scores' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between">
            <span>Assessment Score Records ({scores.length})</span>
            <span className="text-slate-400">Central Grade Records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px] text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-2 text-center">Unit /48</th>
                  <th className="py-2.5 px-2 text-center">CA1 (20)</th>
                  <th className="py-2.5 px-2 text-center">CA2 (20)</th>
                  <th className="py-2.5 px-2 text-center">Exam (60)</th>
                  <th className="py-2.5 px-2 text-center">Total (100)</th>
                  <th className="py-2.5 px-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scores.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No score records entered in central database yet.
                    </td>
                  </tr>
                ) : (
                  scores
                    .slice(0, 50)
                    .map((sc, idx) => {
                      const st = students.find((s) => s.id === sc.studentId);
                      const sb = subjects.find((s) => s.id === sc.subjectId);
                      return (
                        <tr key={sc.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{st?.fullName || sc.studentId}</td>
                          <td className="py-2 px-3 text-slate-700">{sb?.name || sc.subjectId}</td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-emerald-950 bg-emerald-50/40">
                            {sc.unitAssignmentTotal ?? (sc.weeklyAssignments ? sc.weeklyAssignments.reduce((a, b) => a + b, 0) : '—')}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-700">{sc.ca1}</td>
                          <td className="py-2 px-2 text-center text-slate-700">{sc.ca2}</td>
                          <td className="py-2 px-2 text-center text-slate-700">{sc.exam}</td>
                          <td className="py-2 px-2 text-center font-bold font-mono text-slate-900">{sc.total}</td>
                          <td className="py-2 px-2 text-center font-bold text-emerald-800">{sc.grade}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Classes & Form Allocation */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => {
            const classStudents = students.filter((s) => s.classId === cls.id);
            const assignedTeacher = teachers.find(
              (t) => t.assignedClassId === cls.id || t.id === cls.assignedTeacherId
            );

            return (
              <div key={cls.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{cls.name}</h4>
                    <span className="text-xs text-slate-500">Section: {cls.section} • {cls.category}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {classStudents.length} Students
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block font-medium">Assigned Form Teacher</span>
                    <span className="font-bold text-slate-900">
                      {assignedTeacher ? assignedTeacher.fullName : cls.classTeacher}
                    </span>
                    {assignedTeacher?.staffId && (
                      <span className="text-[10px] text-emerald-700 block font-mono">
                        {assignedTeacher.staffId} • {assignedTeacher.phone}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 rounded bg-white border border-emerald-200">
                    Auto-wired to Reports
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Audit Trail */}
      {activeTab === 'audit' && (() => {
        const academicAuditCount = auditLogs.filter((log) =>
          log.action.includes('TEACHER') || log.action.includes('SESSION') || log.action.includes('ACADEMIC')
        ).length;

        const filteredAuditLogs = auditLogs.filter((log) => {
          const isAcademic =
            log.action.includes('TEACHER') ||
            log.action.includes('SESSION') ||
            log.action.includes('ACADEMIC');
          if (auditFilter === 'academic' && !isAcademic) return false;
          if (auditFilter === 'cloud_system' && isAcademic) return false;
          if (auditSearchQuery.trim()) {
            const q = auditSearchQuery.toLowerCase();
            const matchAction = log.action.toLowerCase().includes(q);
            const matchDetails = log.details.toLowerCase().includes(q);
            const matchActor = log.actor.toLowerCase().includes(q);
            return matchAction || matchDetails || matchActor;
          }
          return true;
        });

        return (
          <div className="space-y-4">
            {/* Audit Toolbar & Filter Controls */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="input-audit-search"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  placeholder="Search audit trail by action, teacher, topic, class or details..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  onClick={() => setAuditFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    auditFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Logs ({auditLogs.length})
                </button>
                <button
                  onClick={() => setAuditFilter('academic')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    auditFilter === 'academic'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Academic Session Logs ({academicAuditCount})</span>
                </button>
                <button
                  onClick={() => setAuditFilter('cloud_system')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    auditFilter === 'cloud_system'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>System & Cloud Syncs ({auditLogs.length - academicAuditCount})</span>
                </button>
              </div>
            </div>

            {/* Audit Logs List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span>Institutional Audit Trail & Activity Log</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    Showing {filteredAuditLogs.length} of {auditLogs.length}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-normal">
                  Immutable chronological records of pedagogical activity & data operations
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {filteredAuditLogs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No matching audit events found.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {auditSearchQuery ? 'Try clearing your search terms.' : 'Events will be logged as teachers and administrators work.'}
                    </p>
                  </div>
                ) : (
                  filteredAuditLogs.map((log) => {
                    const isAcademicLog =
                      log.action.includes('TEACHER') ||
                      log.action.includes('SESSION') ||
                      log.action.includes('ACADEMIC');

                    return (
                      <div
                        key={log.id}
                        className={`p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors ${
                          isAcademicLog ? 'hover:bg-amber-50/40 bg-amber-50/10' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {isAcademicLog ? (
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-900 text-[11px] px-2 py-0.5 rounded-md bg-amber-100/80 border border-amber-300">
                                <Bookmark className="w-3 h-3 text-amber-700" />
                                {log.action}
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-emerald-900 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                                {log.action}
                              </span>
                            )}

                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <span className="text-slate-400 font-normal">by</span>
                              <span>{log.actor}</span>
                            </span>

                            {log.classId && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                Class: {classes.find((c) => c.id === log.classId)?.name || log.classId}
                              </span>
                            )}
                            {log.subjectId && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                Subject: {subjects.find((s) => s.id === log.subjectId)?.name || log.subjectId}
                              </span>
                            )}
                          </div>

                          <p className="text-slate-700 text-xs leading-relaxed break-words">
                            {log.details}
                          </p>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono shrink-0 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-300" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
