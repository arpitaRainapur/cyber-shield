import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, ensureDemoUsersSeeded, initDatabaseSchemaAndSeed } from './server/db.ts';
import { analyzeScamText } from './server/scamAnalyzer.ts';
import { SIMULATION_SCENARIOS } from './server/scenarios.ts';
import {
  decryptSensitive,
  encryptSensitive,
  generateConsentCode,
  hashPassword,
  sanitizeText,
  SessionPayload,
  signSessionToken,
  validateEmail,
  validatePasswordStrength,
  verifyPassword,
  verifySessionToken,
} from './server/security.ts';

dotenv.config();

interface AuthRequest extends Request {
  auth?: SessionPayload;
}

const SESSION_COOKIE = 'cybershield_session';

function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  });
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.auth = session;
  next();
}

function requireRole(role: 'senior' | 'caregiver') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (req.auth.role !== role) {
      res.status(403).json({ error: `Access restricted to ${role} accounts.` });
      return;
    }
    next();
  };
}

async function startServer() {
  initDatabaseSchemaAndSeed();
  await ensureDemoUsersSeeded();

  const app = express();
  app.set('trust proxy', 1);

  // Security headers compatible with iframe preview
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please wait a few minutes and try again.' },
  });

  const checkerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 80,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Rate limit reached for scam checks. Please try again shortly.' },
  });

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'cybershield-api' });
  });

  // Auth: Register
  app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
      const fullName = sanitizeText(req.body?.fullName, 100);
      const email = sanitizeText(req.body?.email, 180).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      const role = req.body?.role === 'caregiver' ? 'caregiver' : 'senior';
      const preferredLanguage = ['en', 'hi', 'mr'].includes(req.body?.preferredLanguage)
        ? (req.body.preferredLanguage as 'en' | 'hi' | 'mr')
        : 'en';

      if (fullName.length < 2) {
        res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
        return;
      }
      if (!validateEmail(email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      const pwCheck = validatePasswordStrength(password);
      if (!pwCheck.valid) {
        res.status(400).json({ error: pwCheck.errors[0], details: pwCheck.errors });
        return;
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      const passwordHash = await hashPassword(password);
      const createUserTx = db.transaction(() => {
        const info = db
          .prepare('INSERT INTO users (full_name, email, password_hash, preferred_language) VALUES (?, ?, ?, ?)')
          .run(fullName, email, passwordHash, preferredLanguage);
        const userId = Number(info.lastInsertRowid);
        db.prepare('INSERT INTO user_roles (user_id, role_name) VALUES (?, ?)').run(userId, role);
        return userId;
      });

      const userId = createUserTx();
      const token = signSessionToken({ userId, role });
      setSessionCookie(res, token);

      res.status(201).json({
        user: {
          id: userId,
          fullName,
          email,
          role,
          preferredLanguage,
          recoveryNote: '',
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Could not complete registration. Please try again.' });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
      const email = sanitizeText(req.body?.email, 180).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!validateEmail(email) || !password) {
        res.status(400).json({ error: 'Please enter a valid email and password.' });
        return;
      }

      const userRow = db
        .prepare(
          `SELECT u.id, u.full_name, u.email, u.password_hash, u.preferred_language, u.encrypted_recovery_note, r.role_name
           FROM users u
           JOIN user_roles r ON r.user_id = u.id
           WHERE u.email = ?
           LIMIT 1`
        )
        .get(email) as
        | {
            id: number;
            full_name: string;
            email: string;
            password_hash: string;
            preferred_language: 'en' | 'hi' | 'mr';
            encrypted_recovery_note: string;
            role_name: 'senior' | 'caregiver';
          }
        | undefined;

      if (!userRow) {
        res.status(401).json({ error: 'Incorrect email or password.' });
        return;
      }

      const ok = await verifyPassword(userRow.password_hash, password);
      if (!ok) {
        res.status(401).json({ error: 'Incorrect email or password.' });
        return;
      }

      const token = signSessionToken({ userId: userRow.id, role: userRow.role_name });
      setSessionCookie(res, token);

      res.json({
        user: {
          id: userRow.id,
          fullName: userRow.full_name,
          email: userRow.email,
          role: userRow.role_name,
          preferredLanguage: userRow.preferred_language,
          recoveryNote: decryptSensitive(userRow.encrypted_recovery_note || ''),
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Sign in failed. Please try again.' });
    }
  });

  // Auth: Logout
  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  // Auth: Current session user
  app.get('/api/auth/me', (req: AuthRequest, res) => {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    const session = verifySessionToken(token);
    if (!session) {
      res.json({ user: null });
      return;
    }

    const userRow = db
      .prepare(
        `SELECT u.id, u.full_name, u.email, u.preferred_language, u.encrypted_recovery_note, r.role_name
         FROM users u
         JOIN user_roles r ON r.user_id = u.id
         WHERE u.id = ?
         LIMIT 1`
      )
      .get(session.userId) as
      | {
          id: number;
          full_name: string;
          email: string;
          preferred_language: 'en' | 'hi' | 'mr';
          encrypted_recovery_note: string;
          role_name: 'senior' | 'caregiver';
        }
      | undefined;

    if (!userRow) {
      res.clearCookie(SESSION_COOKIE, { path: '/' });
      res.json({ user: null });
      return;
    }

    res.json({
      user: {
        id: userRow.id,
        fullName: userRow.full_name,
        email: userRow.email,
        role: userRow.role_name,
        preferredLanguage: userRow.preferred_language,
        recoveryNote: decryptSensitive(userRow.encrypted_recovery_note || ''),
      },
    });
  });

  // User Language Preference
  app.patch('/api/user/language', requireAuth, (req: AuthRequest, res) => {
    const lang = req.body?.language;
    if (!['en', 'hi', 'mr'].includes(lang)) {
      res.status(400).json({ error: 'Unsupported language selection.' });
      return;
    }
    db.prepare('UPDATE users SET preferred_language = ? WHERE id = ?').run(lang, req.auth!.userId);
    res.json({ preferredLanguage: lang });
  });

  // Encrypted Trusted Family Contact Note (non-financial safety note only)
  app.patch('/api/user/recovery-note', requireAuth, (req: AuthRequest, res) => {
    const note = sanitizeText(req.body?.recoveryNote, 300);
    const encrypted = note ? encryptSensitive(note) : '';
    db.prepare('UPDATE users SET encrypted_recovery_note = ? WHERE id = ?').run(encrypted, req.auth!.userId);
    res.json({ recoveryNote: note });
  });

  // Tutorials: List all + user progress & latest quiz score
  app.get('/api/tutorials', (req: AuthRequest, res) => {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    const session = verifySessionToken(token);

    const rows = db
      .prepare('SELECT * FROM tutorials ORDER BY order_index ASC')
      .all() as Array<Record<string, unknown>>;

    const progressMap = new Map<number, { completed: boolean; voiceListened: boolean; completedAt: string | null }>();
    const quizMap = new Map<number, { score: number; totalQuestions: number; takenAt: string }>();

    if (session) {
      const progressRows = db
        .prepare('SELECT tutorial_id, completed, voice_listened, completed_at FROM learning_progress WHERE user_id = ?')
        .all(session.userId) as Array<{
        tutorial_id: number;
        completed: number;
        voice_listened: number;
        completed_at: string | null;
      }>;
      for (const p of progressRows) {
        progressMap.set(p.tutorial_id, {
          completed: Boolean(p.completed),
          voiceListened: Boolean(p.voice_listened),
          completedAt: p.completed_at,
        });
      }

      const quizRows = db
        .prepare(
          'SELECT tutorial_id, score, total_questions, taken_at FROM quiz_results WHERE user_id = ? ORDER BY id ASC'
        )
        .all(session.userId) as Array<{
        tutorial_id: number;
        score: number;
        total_questions: number;
        taken_at: string;
      }>;
      for (const q of quizRows) {
        quizMap.set(q.tutorial_id, {
          score: q.score,
          totalQuestions: q.total_questions,
          takenAt: q.taken_at,
        });
      }
    }

    const tutorials = rows.map((row) => {
      const id = Number(row.id);
      const prog = progressMap.get(id) ?? { completed: false, voiceListened: false, completedAt: null };
      const quiz = quizMap.get(id) ?? null;
      return {
        id,
        slug: row.slug,
        category: row.category,
        orderIndex: row.order_index,
        imageUrl: row.image_url,
        title: {
          en: row.title_en,
          hi: row.title_hi,
          mr: row.title_mr,
        },
        summary: {
          en: row.summary_en,
          hi: row.summary_hi,
          mr: row.summary_mr,
        },
        script: {
          en: row.script_en,
          hi: row.script_hi,
          mr: row.script_mr,
        },
        tips: JSON.parse(String(row.tips_json)),
        quiz: JSON.parse(String(row.quiz_json)),
        progress: prog,
        latestQuizResult: quiz,
      };
    });

    res.json({ tutorials });
  });

  // Tutorials: Update voice/completion progress
  app.post('/api/tutorials/:id/progress', requireAuth, (req: AuthRequest, res) => {
    const tutorialId = Number(req.params.id);
    if (!Number.isInteger(tutorialId) || tutorialId <= 0) {
      res.status(400).json({ error: 'Invalid tutorial identifier.' });
      return;
    }

    const tutorial = db.prepare('SELECT id FROM tutorials WHERE id = ?').get(tutorialId);
    if (!tutorial) {
      res.status(404).json({ error: 'Tutorial not found.' });
      return;
    }

    const completed = req.body?.completed ? 1 : 0;
    const voiceListened = req.body?.voiceListened ? 1 : 0;

    db.prepare(
      `INSERT INTO learning_progress (user_id, tutorial_id, completed, voice_listened, completed_at)
       VALUES (?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)
       ON CONFLICT(user_id, tutorial_id) DO UPDATE SET
         completed = MAX(learning_progress.completed, excluded.completed),
         voice_listened = MAX(learning_progress.voice_listened, excluded.voice_listened),
         completed_at = COALESCE(learning_progress.completed_at, excluded.completed_at)`
    ).run(req.auth!.userId, tutorialId, completed, voiceListened, completed);

    res.json({ ok: true });
  });

  // Tutorials: Submit mini-quiz
  app.post('/api/tutorials/:id/quiz', requireAuth, (req: AuthRequest, res) => {
    const tutorialId = Number(req.params.id);
    const answers = req.body?.answers as Record<string, number> | undefined;

    const tutorialRow = db.prepare('SELECT id, quiz_json FROM tutorials WHERE id = ?').get(tutorialId) as
      | { id: number; quiz_json: string }
      | undefined;

    if (!tutorialRow) {
      res.status(404).json({ error: 'Tutorial not found.' });
      return;
    }

    const questions = JSON.parse(tutorialRow.quiz_json) as Array<{ id: string; correctIndex: number }>;
    let score = 0;
    for (const q of questions) {
      if (answers && answers[q.id] === q.correctIndex) {
        score += 1;
      }
    }

    db.prepare('INSERT INTO quiz_results (user_id, tutorial_id, score, total_questions) VALUES (?, ?, ?, ?)').run(
      req.auth!.userId,
      tutorialId,
      score,
      questions.length
    );

    db.prepare(
      `INSERT INTO learning_progress (user_id, tutorial_id, completed, voice_listened, completed_at)
       VALUES (?, ?, 1, 0, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, tutorial_id) DO UPDATE SET
         completed = 1,
         completed_at = COALESCE(learning_progress.completed_at, CURRENT_TIMESTAMP)`
    ).run(req.auth!.userId, tutorialId);

    res.json({ score, totalQuestions: questions.length });
  });

  // Simulator: Get scenarios & user's latest results
  app.get('/api/simulations', (req: AuthRequest, res) => {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    const session = verifySessionToken(token);

    const latestByScenario: Record<string, { selectedOptionId: string; isCorrect: boolean; attemptedAt: string }> = {};
    let totalAttempts = 0;
    let correctAttempts = 0;

    if (session) {
      const rows = db
        .prepare(
          'SELECT scenario_id, selected_option_id, is_correct, attempted_at FROM simulation_results WHERE user_id = ? ORDER BY id ASC'
        )
        .all(session.userId) as Array<{
        scenario_id: string;
        selected_option_id: string;
        is_correct: number;
        attempted_at: string;
      }>;

      for (const r of rows) {
        latestByScenario[r.scenario_id] = {
          selectedOptionId: r.selected_option_id,
          isCorrect: Boolean(r.is_correct),
          attemptedAt: r.attempted_at,
        };
        totalAttempts += 1;
        if (r.is_correct) correctAttempts += 1;
      }
    }

    res.json({
      scenarios: SIMULATION_SCENARIOS,
      userAttempts: latestByScenario,
      stats: {
        totalAttempts,
        correctAttempts,
        completedUniqueScenarios: Object.keys(latestByScenario).length,
      },
    });
  });

  // Simulator: Record attempt
  app.post('/api/simulations/attempt', requireAuth, (req: AuthRequest, res) => {
    const scenarioId = sanitizeText(req.body?.scenarioId, 64);
    const selectedOptionId = sanitizeText(req.body?.selectedOptionId, 64);

    const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) {
      res.status(404).json({ error: 'Simulation scenario not found.' });
      return;
    }

    const validOption = scenario.options.some((o) => o.id === selectedOptionId);
    if (!validOption) {
      res.status(400).json({ error: 'Invalid option selected.' });
      return;
    }

    const isCorrect = selectedOptionId === scenario.correctOptionId;
    db.prepare(
      'INSERT INTO simulation_results (user_id, scenario_id, selected_option_id, is_correct) VALUES (?, ?, ?, ?)'
    ).run(req.auth!.userId, scenarioId, selectedOptionId, isCorrect ? 1 : 0);

    res.json({
      isCorrect,
      correctOptionId: scenario.correctOptionId,
      explanation: scenario.explanation,
      warningSigns: scenario.warningSigns,
      recommendedAction: scenario.recommendedAction,
    });
  });

  // AI Scam & Link Checker
  app.post('/api/scam-check', checkerLimiter, (req: AuthRequest, res) => {
    const content = sanitizeText(req.body?.content, 3000);
    const inputType = ['sms', 'whatsapp', 'email', 'url', 'message'].includes(req.body?.inputType)
      ? String(req.body.inputType)
      : 'message';
    const saveToHistory = req.body?.saveToHistory === true;

    if (content.length < 4) {
      res.status(400).json({ error: 'Please paste a message or URL (at least 4 characters) to check.' });
      return;
    }

    const analysis = analyzeScamText(content, inputType);

    let saved = false;
    if (saveToHistory) {
      const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
      const session = verifySessionToken(token);
      if (session) {
        const excerpt = content.length > 140 ? `${content.slice(0, 140)}...` : content;
        db.prepare(
          `INSERT INTO scam_check_history (user_id, input_type, content_excerpt, risk_level, risk_score, matched_patterns_json)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          session.userId,
          inputType,
          excerpt,
          analysis.riskLevel,
          analysis.riskScore,
          JSON.stringify(analysis.suspiciousTerms)
        );
        saved = true;
      }
    }

    res.json({ analysis, savedToHistory: saved });
  });

  // Opted-in Scam Check History
  app.get('/api/scam-check/history', requireAuth, (req: AuthRequest, res) => {
    const rows = db
      .prepare(
        `SELECT id, input_type, content_excerpt, risk_level, risk_score, matched_patterns_json, created_at
         FROM scam_check_history
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 20`
      )
      .all(req.auth!.userId) as Array<{
      id: number;
      input_type: string;
      content_excerpt: string;
      risk_level: 'Low' | 'Medium' | 'High';
      risk_score: number;
      matched_patterns_json: string;
      created_at: string;
    }>;

    res.json({
      history: rows.map((r) => ({
        id: r.id,
        inputType: r.input_type,
        contentExcerpt: r.content_excerpt,
        riskLevel: r.risk_level,
        riskScore: r.risk_score,
        matchedPatterns: JSON.parse(r.matched_patterns_json),
        createdAt: r.created_at,
      })),
    });
  });

  app.delete('/api/scam-check/history', requireAuth, (req: AuthRequest, res) => {
    db.prepare('DELETE FROM scam_check_history WHERE user_id = ?').run(req.auth!.userId);
    res.json({ ok: true });
  });

  // Consent Management (Senior Citizens)
  app.get('/api/consent', requireAuth, requireRole('senior'), (req: AuthRequest, res) => {
    const rows = db
      .prepare(
        `SELECT c.id, c.caregiver_email, c.status, c.consent_code, c.updated_at, u.full_name AS caregiver_name
         FROM caregiver_consent c
         LEFT JOIN users u ON u.id = c.caregiver_user_id
         WHERE c.senior_user_id = ?
         ORDER BY c.updated_at DESC`
      )
      .all(req.auth!.userId) as Array<{
      id: number;
      caregiver_email: string;
      status: 'pending' | 'granted' | 'revoked';
      consent_code: string;
      updated_at: string;
      caregiver_name: string | null;
    }>;

    res.json({ consents: rows });
  });

  app.post('/api/consent/invite', requireAuth, requireRole('senior'), (req: AuthRequest, res) => {
    const caregiverEmail = sanitizeText(req.body?.caregiverEmail, 180).toLowerCase();
    if (!validateEmail(caregiverEmail)) {
      res.status(400).json({ error: 'Please enter a valid caregiver email address.' });
      return;
    }

    const caregiverUser = db
      .prepare(
        `SELECT u.id FROM users u
         JOIN user_roles r ON r.user_id = u.id
         WHERE u.email = ? AND r.role_name = 'caregiver'`
      )
      .get(caregiverEmail) as { id: number } | undefined;

    const code = generateConsentCode();
    const existing = db
      .prepare('SELECT id FROM caregiver_consent WHERE senior_user_id = ? AND caregiver_email = ?')
      .get(req.auth!.userId, caregiverEmail) as { id: number } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE caregiver_consent
         SET status = ?, consent_code = ?, caregiver_user_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(caregiverUser ? 'granted' : 'pending', code, caregiverUser?.id ?? null, existing.id);
    } else {
      db.prepare(
        `INSERT INTO caregiver_consent (senior_user_id, caregiver_user_id, caregiver_email, status, consent_code)
         VALUES (?, ?, ?, ?, ?)`
      ).run(req.auth!.userId, caregiverUser?.id ?? null, caregiverEmail, caregiverUser ? 'granted' : 'pending', code);
    }

    res.status(201).json({
      consentCode: code,
      status: caregiverUser ? 'granted' : 'pending',
      caregiverEmail,
    });
  });

  app.post('/api/consent/revoke', requireAuth, requireRole('senior'), (req: AuthRequest, res) => {
    const consentId = Number(req.body?.consentId);
    if (!Number.isInteger(consentId) || consentId <= 0) {
      res.status(400).json({ error: 'Invalid consent record.' });
      return;
    }

    const result = db
      .prepare(
        `UPDATE caregiver_consent
         SET status = 'revoked', updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND senior_user_id = ?`
      )
      .run(consentId, req.auth!.userId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Consent record not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // Caregiver Linking via Senior's Explicit Consent Code
  app.post('/api/consent/link', requireAuth, requireRole('caregiver'), (req: AuthRequest, res) => {
    const seniorEmail = sanitizeText(req.body?.seniorEmail, 180).toLowerCase();
    const consentCode = sanitizeText(req.body?.consentCode, 16).toUpperCase();

    if (!validateEmail(seniorEmail) || consentCode.length < 4) {
      res.status(400).json({ error: 'Please enter the senior citizen email and the 6-character consent code.' });
      return;
    }

    const caregiverUser = db.prepare('SELECT email FROM users WHERE id = ?').get(req.auth!.userId) as
      | { email: string }
      | undefined;

    const seniorUser = db
      .prepare(
        `SELECT u.id FROM users u
         JOIN user_roles r ON r.user_id = u.id
         WHERE u.email = ? AND r.role_name = 'senior'`
      )
      .get(seniorEmail) as { id: number } | undefined;

    if (!seniorUser || !caregiverUser) {
      res.status(404).json({ error: 'No matching senior citizen consent request found.' });
      return;
    }

    const record = db
      .prepare(
        `SELECT id, caregiver_email, status FROM caregiver_consent
         WHERE senior_user_id = ? AND consent_code = ? AND status != 'revoked'`
      )
      .get(seniorUser.id, consentCode) as { id: number; caregiver_email: string; status: string } | undefined;

    if (!record || record.caregiver_email.toLowerCase() !== caregiverUser.email.toLowerCase()) {
      res.status(403).json({
        error: 'Consent code does not match an active authorization for your caregiver email.',
      });
      return;
    }

    db.prepare(
      `UPDATE caregiver_consent
       SET caregiver_user_id = ?, status = 'granted', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(req.auth!.userId, record.id);

    res.json({ ok: true });
  });

  // Caregiver Dashboard: View ONLY explicitly consented seniors (no passwords, OTPs, financial data, or scam text)
  app.get('/api/caregiver/seniors', requireAuth, requireRole('caregiver'), (req: AuthRequest, res) => {
    const caregiverUser = db.prepare('SELECT email FROM users WHERE id = ?').get(req.auth!.userId) as
      | { email: string }
      | undefined;

    if (!caregiverUser) {
      res.status(404).json({ error: 'Caregiver account not found.' });
      return;
    }

    const consentedSeniors = db
      .prepare(
        `SELECT c.id AS consent_id, c.updated_at AS consent_updated_at,
                u.id AS senior_id, u.full_name, u.email, u.preferred_language
         FROM caregiver_consent c
         JOIN users u ON u.id = c.senior_user_id
         WHERE (c.caregiver_user_id = ? OR LOWER(c.caregiver_email) = LOWER(?))
           AND c.status = 'granted'`
      )
      .all(req.auth!.userId, caregiverUser.email) as Array<{
      consent_id: number;
      consent_updated_at: string;
      senior_id: number;
      full_name: string;
      email: string;
      preferred_language: string;
    }>;

    const totalTutorialsRow = db.prepare('SELECT COUNT(*) AS count FROM tutorials').get() as { count: number };
    const totalTutorials = totalTutorialsRow.count;

    const summaries = consentedSeniors.map((senior) => {
      const completedTutorials = db
        .prepare(
          `SELECT t.id, t.slug, t.title_en, t.title_hi, t.title_mr, lp.completed_at, lp.voice_listened
           FROM learning_progress lp
           JOIN tutorials t ON t.id = lp.tutorial_id
           WHERE lp.user_id = ? AND lp.completed = 1
           ORDER BY t.order_index ASC`
        )
        .all(senior.senior_id) as Array<{
        id: number;
        slug: string;
        title_en: string;
        title_hi: string;
        title_mr: string;
        completed_at: string;
        voice_listened: number;
      }>;

      const quizResults = db
        .prepare(
          `SELECT q.id, q.score, q.total_questions, q.taken_at, t.title_en, t.title_hi, t.title_mr
           FROM quiz_results q
           JOIN tutorials t ON t.id = q.tutorial_id
           WHERE q.user_id = ?
           ORDER BY q.taken_at DESC
           LIMIT 10`
        )
        .all(senior.senior_id) as Array<{
        id: number;
        score: number;
        total_questions: number;
        taken_at: string;
        title_en: string;
        title_hi: string;
        title_mr: string;
      }>;

      const simRows = db
        .prepare(
          `SELECT scenario_id, is_correct, attempted_at
           FROM simulation_results
           WHERE user_id = ?
           ORDER BY attempted_at DESC`
        )
        .all(senior.senior_id) as Array<{
        scenario_id: string;
        is_correct: number;
        attempted_at: string;
      }>;

      const simCorrect = simRows.filter((s) => s.is_correct === 1).length;
      const uniqueCompletedSims = new Set(simRows.filter((s) => s.is_correct === 1).map((s) => s.scenario_id)).size;

      // Combine educational milestones into an activity timeline
      const activities = [
        ...completedTutorials.map((t) => ({
          type: 'tutorial' as const,
          label: t.title_en,
          labelHi: t.title_hi,
          labelMr: t.title_mr,
          detail: t.voice_listened ? 'Completed with voice guide' : 'Completed lesson',
          timestamp: t.completed_at,
        })),
        ...quizResults.map((q) => ({
          type: 'quiz' as const,
          label: q.title_en,
          labelHi: q.title_hi,
          labelMr: q.title_mr,
          detail: `Quiz score: ${q.score}/${q.total_questions}`,
          timestamp: q.taken_at,
        })),
        ...simRows.slice(0, 6).map((s) => ({
          type: 'simulation' as const,
          label: s.scenario_id.replace('sim-', '').toUpperCase(),
          labelHi: s.scenario_id.replace('sim-', '').toUpperCase(),
          labelMr: s.scenario_id.replace('sim-', '').toUpperCase(),
          detail: s.is_correct ? 'Safe action selected' : 'Practiced scenario (needs review)',
          timestamp: s.attempted_at,
        })),
      ].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

      return {
        consentId: senior.consent_id,
        consentGrantedAt: senior.consent_updated_at,
        seniorId: senior.senior_id,
        fullName: senior.full_name,
        email: senior.email,
        preferredLanguage: senior.preferred_language,
        tutorialsCompletedCount: completedTutorials.length,
        totalTutorials,
        completedTutorials,
        quizResults,
        simulationSummary: {
          totalAttempts: simRows.length,
          correctAttempts: simCorrect,
          uniqueScenariosMastered: uniqueCompletedSims,
          totalScenarios: SIMULATION_SCENARIOS.length,
        },
        recentActivities: activities.slice(0, 8),
      };
    });

    res.json({ seniors: summaries });
  });

  // Vite / Static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`CyberShield server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CyberShield server:', err);
  process.exit(1);
});
