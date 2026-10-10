import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

interface GenerateCommentPayload {
  studentName: string;
  regNo?: string;
  gender?: 'Male' | 'Female';
  className?: string;
  subjectName?: string;
  termName?: string;
  sessionName?: string;
  unitAssignmentTotal?: number; // out of 48
  weeklyAverage?: number; // out of 4.0
  ca1?: number; // out of 20
  ca2?: number; // out of 20
  exam?: number; // out of 60
  total?: number; // out of 100
  grade?: string; // 'A', 'B', 'C', 'D', 'E', 'F'
  attendanceRate?: number; // percentage e.g. 92
  attendanceDaysPresent?: number;
  attendanceDaysOpened?: number;
  tone?: 'holistic' | 'encouraging' | 'high_achiever' | 'improvement' | 'islamic_values';
  teacherNotes?: string;
}

// Intelligent rule-based fallback generator in case API key is unconfigured or network is unavailable
function generateFallbackRemarks(data: GenerateCommentPayload) {
  const firstName = data.studentName.split(' ')[0] || 'The student';
  const pronoun = data.gender === 'Female' ? 'She' : data.gender === 'Male' ? 'He' : firstName;
  const possessive = data.gender === 'Female' ? 'her' : data.gender === 'Male' ? 'his' : `${firstName}'s`;
  const total = Number(data.total) || 0;
  const grade = data.grade || 'C';
  const attRate = data.attendanceRate !== undefined ? Number(data.attendanceRate) : 85;

  let conciseRemark = '';
  let detailedRemark = '';
  let islamicCharacterRemark = '';
  let summaryAssessment = '';
  const keyStrengths: string[] = [];
  const areasForImprovement: string[] = [];

  if (total >= 70 || grade === 'A') {
    summaryAssessment = 'Distinction with High Commendation';
    conciseRemark = `Outstanding academic performance! ${firstName} demonstrates exceptional mastery and disciplined commitment to studies.`;
    detailedRemark = `${firstName} has shown remarkable diligence throughout the term, maintaining strong weekly unit assignment submissions (${data.unitAssignmentTotal || 40}/48) and achieving an excellent terminal score of ${total}%. ${pronoun} attended ${attRate}% of school sessions with exemplary punctuality.`;
    islamicCharacterRemark = `A shining example of good character (Adab) and academic excellence. May Allah continue to grant ${firstName} beneficial knowledge, wisdom, and steadfastness in good deeds.`;
    keyStrengths.push('Exceptional mastery of curriculum concepts', 'Consistent high scores in weekly continuous assignments');
    if (attRate >= 85) keyStrengths.push('Excellent attendance and punctuality');
    areasForImprovement.push('Maintain this high standard and mentor peers in study circles');
  } else if (total >= 60 || grade === 'B') {
    summaryAssessment = 'Very Good with Steady Diligence';
    conciseRemark = `A dedicated and capable student. ${firstName} consistently completes assignments and exhibits commendable progress.`;
    detailedRemark = `${firstName} has achieved a solid total score of ${total}% with commendable engagement in weekly lessons. With an attendance rate of ${attRate}%, ${possessive} consistent presence has supported steady academic development.`;
    islamicCharacterRemark = `${firstName} exhibits polite conduct and respect for teachers. We pray Allah blesses ${possessive} efforts and guides ${firstName} toward even greater heights next term.`;
    keyStrengths.push('Solid grasp of foundational subject topics', 'Active participation in weekly lessons');
    if (attRate >= 75) keyStrengths.push('Consistent school attendance');
    areasForImprovement.push('Aim for distinction by practicing advanced questions during revisions');
  } else if (total >= 50 || grade === 'C') {
    summaryAssessment = 'Good Effort with Room for Growth';
    conciseRemark = `Shows good potential and enthusiasm. Regular revision will help ${firstName} achieve higher grades.`;
    detailedRemark = `${firstName} completed the term with an overall mark of ${total}%. While understanding is satisfactory, greater consistency in completing weekly unit assignments and focused exam preparation will elevate ${possessive} standing. Attendance stood at ${attRate}%.`;
    islamicCharacterRemark = `Demonstrates respectful conduct in class. Continued patience (Sabr) and perseverance in studies will unlock ${possessive} full potential, insha'Allah.`;
    keyStrengths.push('Satisfactory class participation', 'Willingness to learn and improve');
    areasForImprovement.push('More consistent revision of weekly unit topics', 'Enhanced focus on terminal examination preparation');
  } else if (total >= 45 || grade === 'D') {
    summaryAssessment = 'Fair Performance / Needs Extra Effort';
    conciseRemark = `Satisfactory effort, but requires closer revision and active participation in class.`;
    detailedRemark = `${firstName} attained a pass grade of ${total}%. ${pronoun} needs to dedicate more hours to independent study and ensure all weekly assignments are submitted punctually. Attendance recorded was ${attRate}%.`;
    islamicCharacterRemark = `Encouraged to strengthen discipline and seek assistance whenever topics feel challenging. Consistent prayer and study habits will yield better outcomes.`;
    keyStrengths.push('Passes foundational requirements');
    areasForImprovement.push('Needs systematic daily revision', 'Timely completion of homework and unit assignments');
  } else {
    summaryAssessment = 'Needs Urgent Attention and Support';
    conciseRemark = `Performance requires urgent intervention. Dedicated home revision and remedial support are strongly recommended.`;
    detailedRemark = `${firstName} scored ${total}% this term. ${pronoun} struggled with key subject concepts and would benefit immensely from extra tutoring and stricter adherence to study schedules. Regular attendance (${attRate}%) must be improved.`;
    islamicCharacterRemark = `We encourage ${firstName} to renew determination and seek guidance from teachers. With concerted effort and parental partnership, improvement is certainly achievable.`;
    keyStrengths.push('Shows room for substantial turnaround with guided mentoring');
    areasForImprovement.push('Requires close monitoring by parents and teachers', 'Mandatory participation in remedial study classes');
  }

  const attendanceAppraisal =
    attRate >= 90
      ? `Exemplary attendance record (${attRate}% present), demonstrating high commitment.`
      : attRate >= 75
      ? `Good regular attendance (${attRate}% present) throughout the 12-week academic term.`
      : `Attendance is below recommended threshold (${attRate}% present); regular presence is vital for academic progress.`;

  return {
    conciseRemark,
    detailedRemark,
    islamicCharacterRemark,
    summaryAssessment,
    keyStrengths,
    areasForImprovement,
    attendanceAppraisal,
  };
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Kulliyyat School Information System',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      time: new Date().toISOString(),
    });
  });

  // Lazy initialize Gemini client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    if (!aiClient) {
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // Teacher Comment Generator API route
  app.post('/api/generate-comment', async (req: Request, res: Response) => {
    const payload: GenerateCommentPayload = req.body;

    if (!payload || !payload.studentName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: studentName is required.',
      });
    }

    const fallbackData = generateFallbackRemarks(payload);
    const gemini = getGeminiClient();

    if (!gemini) {
      // API Key is not set yet in environment: return smart rule-based comments seamlessly
      return res.json({
        success: true,
        aiPowered: false,
        source: 'rule_engine',
        message: 'Personalized remark generated from academic metrics engine. (Gemini API key can be attached in AI Studio Secrets panel).',
        ...fallbackData,
      });
    }

    try {
      const tone = payload.tone || 'holistic';
      const prompt = `You are a distinguished senior Islamic school educator and Form Master at "Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah" (College for Practising Islamic Teachings).
Your role is to write thoughtful, personalized, professional, and constructive report card remarks for a student based on their academic marks and attendance record.

Student Details:
- Student Full Name: ${payload.studentName}
- Registration Number: ${payload.regNo || 'N/A'}
- Gender: ${payload.gender || 'Not specified'}
- Class / Level: ${payload.className || 'General Class'}
- Subject: ${payload.subjectName || 'All Subjects / General'}
- Academic Session & Term: ${payload.termName || 'Current Term'} (${payload.sessionName || 'Academic Session'})

Grades & Assessment Metrics:
- 12-Week Unit Assignment Total: ${payload.unitAssignmentTotal ?? 0} / 48 (Weekly Unit Avg: ${payload.weeklyAverage ?? '0.0'} / 4.0)
- Continuous Assessment 1 (CA 1): ${payload.ca1 ?? 0} / 20
- Continuous Assessment 2 (CA 2): ${payload.ca2 ?? 0} / 20
- Terminal Examination: ${payload.exam ?? 0} / 60
- Overall Score: ${payload.total ?? 0} / 100
- Final Letter Grade: ${payload.grade || 'N/A'}

Attendance Details:
- Attendance Percentage: ${payload.attendanceRate !== undefined ? `${payload.attendanceRate}%` : 'Not recorded'}
- Days Present: ${payload.attendanceDaysPresent ?? 'N/A'} of ${payload.attendanceDaysOpened ?? 'N/A'} school days opened

Requested Evaluation Tone / Focus: "${tone}"
${payload.teacherNotes ? `Teacher's Specific Classroom Notes: "${payload.teacherNotes}"` : ''}

Instructions:
1. Write 3 distinct, high-quality remarks:
   - "conciseRemark": 1-2 crisp, professional sentences suitable for official report card stamp spaces.
   - "detailedRemark": 2-3 sentences evaluating assignment consistency, terminal exam results, and attendance dedication.
   - "islamicCharacterRemark": Warm Islamic encouragement highlighting Adab (manners), Istiqamah (consistency), and a brief prayer for Barakah and continued success.
2. Provide a 3-5 word "summaryAssessment" (e.g., "Distinction with Exemplary Attendance", "Good Effort with Growing Focus").
3. Provide 2-3 "keyStrengths" and 1-2 "areasForImprovement" specific to the scores and attendance provided.
4. Provide a 1-sentence "attendanceAppraisal".
5. Return ONLY a valid JSON object without markdown formatting.

Format example:
{
  "conciseRemark": "...",
  "detailedRemark": "...",
  "islamicCharacterRemark": "...",
  "summaryAssessment": "...",
  "keyStrengths": ["...", "..."],
  "areasForImprovement": ["..."],
  "attendanceAppraisal": "..."
}`;

      const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      // Clean potential markdown wrap ```json ... ```
      const cleanedText = responseText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

      try {
        const parsed = JSON.parse(cleanedText);
        return res.json({
          success: true,
          aiPowered: true,
          source: 'gemini-3.8-flash',
          conciseRemark: parsed.conciseRemark || fallbackData.conciseRemark,
          detailedRemark: parsed.detailedRemark || fallbackData.detailedRemark,
          islamicCharacterRemark: parsed.islamicCharacterRemark || fallbackData.islamicCharacterRemark,
          summaryAssessment: parsed.summaryAssessment || fallbackData.summaryAssessment,
          keyStrengths: Array.isArray(parsed.keyStrengths) && parsed.keyStrengths.length > 0 ? parsed.keyStrengths : fallbackData.keyStrengths,
          areasForImprovement: Array.isArray(parsed.areasForImprovement) && parsed.areasForImprovement.length > 0 ? parsed.areasForImprovement : fallbackData.areasForImprovement,
          attendanceAppraisal: parsed.attendanceAppraisal || fallbackData.attendanceAppraisal,
        });
      } catch (parseErr) {
        console.warn('Failed to parse Gemini JSON output, using raw text as detailed remark:', parseErr);
        return res.json({
          success: true,
          aiPowered: true,
          source: 'gemini-3.8-flash',
          conciseRemark: responseText.slice(0, 160),
          detailedRemark: responseText,
          islamicCharacterRemark: fallbackData.islamicCharacterRemark,
          summaryAssessment: fallbackData.summaryAssessment,
          keyStrengths: fallbackData.keyStrengths,
          areasForImprovement: fallbackData.areasForImprovement,
          attendanceAppraisal: fallbackData.attendanceAppraisal,
        });
      }
    } catch (apiError: any) {
      console.error('Gemini API call error:', apiError);
      // Seamlessly fall back to context-rich rule engine so teacher experience is never halted
      return res.json({
        success: true,
        aiPowered: false,
        source: 'rule_engine_fallback',
        warning: apiError?.message || 'Gemini service temporarily unreachable; generated via academic rule engine.',
        ...fallbackData,
      });
    }
  });

  // 1-Click Complete System ZIP Download Endpoint
  app.get('/api/download-zip', (req: Request, res: Response) => {
    try {
      const publicZipPath = path.join(process.cwd(), 'public', 'kulliyyat-tatbiq-complete-system.zip');
      const rootZipPath = path.join(process.cwd(), 'kulliyyat-tatbiq-complete-system.zip');

      // If neither exists or is older than 5 minutes, regenerate using python3
      if (!fs.existsSync(publicZipPath) && !fs.existsSync(rootZipPath)) {
        try {
          execSync('python3 scripts/generate_zip.py', { cwd: process.cwd() });
        } catch (scriptErr) {
          console.warn('Auto-generation of zip script notice:', scriptErr);
        }
      }

      const targetPath = fs.existsSync(publicZipPath) ? publicZipPath : rootZipPath;

      if (fs.existsSync(targetPath)) {
        res.setHeader('Content-Disposition', 'attachment; filename="kulliyyat-tatbiq-complete-system.zip"');
        res.setHeader('Content-Type', 'application/zip');
        return res.sendFile(targetPath);
      } else {
        return res.status(404).json({
          error: 'ZIP file archive could not be generated. Please contact administrator.',
        });
      }
    } catch (err: any) {
      console.error('Error serving project zip:', err);
      return res.status(500).json({ error: err?.message || 'Server error downloading ZIP' });
    }
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kulliyyat Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
