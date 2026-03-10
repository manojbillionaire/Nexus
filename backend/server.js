const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/nexusjustice';
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(e => console.error('MongoDB error:', e.message));

// ─── Schemas ─────────────────────────────────────────────────────────────────
const AdvocateSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, phone: String,
  password: String, state: String, district: String, courtName: String,
  plan: { type: String, default: 'Starter' },
  affiliateCode: String,
  status: { type: String, default: 'pending_approval' },
  role: { type: String, default: 'advocate' },
  joinedAt: { type: Date, default: Date.now },
  activeCases: { type: Number, default: 0 },
  monthlyRevenue: { type: Number, default: 0 },
  affiliateLink: String,
  notifications: [{
    message: { type: String },
    type:    { type: String },
    read:    { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    link:    { type: String },
  }],
});

const AffiliateSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, phone: String,
  password: String, code: String,
  state: String, district: String,
  role: { type: String, default: 'affiliate' },
  joined: { type: Date, default: Date.now },
  subscribers: [{ advocateId: String, name: String, plan: String, joinDate: Date, paid: Boolean, lastPayDate: Date }],
  paymentHistory: [{ month: String, amount: Number, paidOn: Date, txId: String, status: String }],
  totalEarned: { type: Number, default: 0 },
});

const BroadcastSchema = new mongoose.Schema({
  message: String, tier: String,
  sentBy: String, sentAt: { type: Date, default: Date.now },
});

const Advocate = mongoose.model('Advocate', AdvocateSchema);
const Affiliate = mongoose.model('Affiliate', AffiliateSchema);
const Broadcast = mongoose.model('Broadcast', BroadcastSchema);
// ─── Incoming Call Schema ─────────────────────────────────────────────────────
const IncomingCallSchema = new mongoose.Schema({
  advocateId:  { type: String, required: true },
  caller:      { type: String, default: 'Unknown' },
  phone:       { type: String, default: '' },
  duration:    { type: String, default: '' },
  summary:     { type: String, default: '' },
  transcript:  { type: String, default: '' },
  status:      { type: String, default: 'incoming' }, // incoming | active | ended | missed
  source:      { type: String, default: 'webhook' },
  receivedAt:  { type: Date, default: Date.now },
  endedAt:     { type: Date },
});
const IncomingCall = mongoose.model('IncomingCall', IncomingCallSchema);

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'nexusjustice_secret_2026';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
async function seedData() {
  try {
    const adminExists = await Advocate.findOne({ email: 'admin@nexusjustice.in' });
    if (!adminExists) {
      const hashed = await bcrypt.hash('admin1234', 10);
      await Advocate.create({
        name: 'Agency Admin', email: 'admin@nexusjustice.in',
        phone: '+91 9000000000', password: hashed, barCouncilNo: 'ADMIN',
        role: 'agency', status: 'active', plan: 'Elite',
      });
    }
    const demoExists = await Advocate.findOne({ email: 'sanjay@nexusjustice.in' });
    if (!demoExists) {
      const hashed = await bcrypt.hash('demo1234', 10);
      const affCode = 'AFF-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      await Advocate.create({
        name: 'Adv. Sanjay Menon', email: 'sanjay@nexusjustice.in',
        phone: '+91 9876543210', password: hashed,
        barCouncilNo: 'KL/1234/2010', specialisation: 'Property Law',
        plan: 'Pro', status: 'active', role: 'advocate',
        affiliateCode: affCode,
        affiliateLink: `https://nexusjustice.in/signup?ref=${affCode}`,
        notifications: [
          { message: 'Welcome to Nexus Justice v3.1! Your account is active.', type: 'general', read: false, createdAt: new Date() },
          { message: 'Your affiliate link is ready to share and earn commissions!', type: 'affiliate', read: false, createdAt: new Date(), link: `https://nexusjustice.in/signup?ref=${affCode}` },
        ],
      });
    }
    const affExists = await Affiliate.findOne({ email: 'sarah@lawpartner.in' });
    if (!affExists) {
      const hashed = await bcrypt.hash('demo1234', 10);
      await Affiliate.create({
        name: 'Sarah Jenkins', email: 'sarah@lawpartner.in',
        phone: '+91 9876541001', password: hashed,
        code: 'SJ-NEXUS-24', state: 'Kerala', district: 'Ernakulam',
        totalEarned: 699.60,
        paymentHistory: [
          { month: 'Feb 2026', amount: 349.80, paidOn: new Date('2026-02-04'), txId: 'TXN-2402-001', status: 'paid' },
          { month: 'Jan 2026', amount: 249.90, paidOn: new Date('2026-01-04'), txId: 'TXN-2401-001', status: 'paid' },
        ],
      });
    }
    console.log('✅ Seed data ready');
  } catch (e) { console.error('Seed error:', e.message); }
}

// ─── AI Orchestration (DeepSeek primary, Gemini fallback) ─────────────────────
// ─── AI Orchestration (Sarvam primary, DeepSeek/Gemini fallback) ──────────────
async function callAI(prompt, systemPrompt = '', options = {}) {
  const { language = 'en' } = options;

  const sarvamKey   = (process.env.SARVAM_API_KEY   || '').replace(/\s/g, '');
  const deepseekKey = (process.env.DEEPSEEK_API_KEY || '').replace(/\s/g, '');
  const geminiKey   = (process.env.GEMINI_API_KEY   || '').replace(/\s/g, '');

  const messages = [
    { role: 'system', content: systemPrompt || 'You are Nexus, a legal AI assistant for Indian advocates. Answer clearly and accurately.' },
    { role: 'user',   content: prompt }
  ];

  // 1️⃣ Sarvam first
  if (sarvamKey) {
    try {
      const res = await axios.post('https://api.sarvam.ai/v2/chat/completions', {
        model: 'sarvam-30b',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }, { headers: { 'api-subscription-key': sarvamKey }, timeout: 20000 });
      return { text: res.data.choices[0].message.content, model: 'sarvam' };
    } catch (e) { console.log('Sarvam LLM failed, trying DeepSeek:', e.message); }
  }

  // 2️⃣ DeepSeek fallback
  if (deepseekKey) {
    try {
      const res = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: 'deepseek-chat',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }, { headers: { Authorization: `Bearer ${deepseekKey}` }, timeout: 15000 });
      return { text: res.data.choices[0].message.content, model: 'deepseek' };
    } catch (e) { console.log('DeepSeek failed, trying Gemini:', e.message); }
  }

  // 3️⃣ Gemini fallback
  if (geminiKey) {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { contents: [{ parts: [{ text: (systemPrompt ? systemPrompt + '\n\n' : '') + prompt }] }] },
        { timeout: 20000 }
      );
      return { text: res.data.candidates[0].content.parts[0].text, model: 'gemini' };
    } catch (e) { console.log('Gemini failed:', e.message); }
  }

  return { text: 'AI service temporarily unavailable. Please try again.', model: 'none' };
}

// ─── Sarvam AI (TTS / Translation) ──────────────────────────────────────────
async function callSarvam(text, targetLang = 'hi-IN', action = 'translate') {
  if (!process.env.SARVAM_API_KEY) return { success: false, error: 'No Sarvam key' };
  try {
    if (action === 'translate') {
      const res = await axios.post('https://api.sarvam.ai/translate', {
        input: text, source_language_code: 'en-IN',
        target_language_code: targetLang, speaker_gender: 'Female',
        mode: 'formal', enable_preprocessing: true,
      }, { headers: { 'api-subscription-key': process.env.SARVAM_API_KEY }, timeout: 10000 });
      return { success: true, translated: res.data.translated_text };
    } else if (action === 'tts') {
      const res = await axios.post('https://api.sarvam.ai/text-to-speech', {
        inputs: [text], target_language_code: targetLang,
        speaker: 'meera', pitch: 0, pace: 1.0, loudness: 1.5,
        speech_sample_rate: 8000, enable_preprocessing: true, model: 'bulbul:v1',
      }, { headers: { 'api-subscription-key': process.env.SARVAM_API_KEY }, timeout: 15000 });
      return { success: true, audio: res.data.audios[0] };
    }
  } catch (e) { return { success: false, error: e.message }; }
}

// ─── Serper.dev Web Search ────────────────────────────────────────────────────
async function webSearch(query) {
  if (!process.env.SERPER_API_KEY) return { success: false, results: [] };
  try {
    const res = await axios.post('https://google.serper.dev/search', { q: query, num: 5 },
      { headers: { 'X-API-KEY': process.env.SERPER_API_KEY }, timeout: 8000 });
    return { success: true, results: res.data.organic || [] };
  } catch (e) { return { success: false, results: [], error: e.message }; }
}

// ─── Routes: Auth ─────────────────────────────────────────────────────────────

// Agency HQ Admin Signup (invite-code protected)
app.post('/api/auth/agency-signup', async (req, res) => {
  try {
    const { name, email, phone, password, orgName, inviteCode } = req.body;
    // Invite code required to create agency admin (set via env or hardcoded default)
    const INVITE = process.env.AGENCY_INVITE_CODE || 'NEXUS-HQ-2026';
    if (inviteCode !== INVITE) return res.status(403).json({ error: 'Invalid invite code. Contact Nexus Justice team.' });
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields.' });
    const exists = await Advocate.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const admin = await Advocate.create({
      name, email, phone: phone || '',
      password: hashed, barCouncilNo: 'ADMIN',
      specialisation: orgName || 'Agency Administrator',
      role: 'agency', status: 'active', plan: 'Elite',
      notifications: [{ message: `Welcome ${name}! Your Agency HQ admin account is active.`, type: 'general', read: false, createdAt: new Date() }],
    });
    const token = jwt.sign({ id: admin._id, role: 'agency', email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, token, user: { id: admin._id, name, email, role: 'agency', plan: 'Elite', status: 'active' } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Advocate Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password, barCouncilNo, specialisation, affiliateCode } = req.body;
    if (!name || !email || !password || !barCouncilNo) return res.status(400).json({ error: 'Missing fields' });
    const exists = await Advocate.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const myAffCode = 'AFF-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const myAffLink = `${process.env.APP_URL || 'https://nexusjustice.in'}/signup?ref=${myAffCode}`;

    const advocate = await Advocate.create({
      name, email, phone, password: hashed, barCouncilNo,
      specialisation, affiliateCode,
      affiliateCode: myAffCode,
      affiliateLink: myAffLink,
      status:  'active',
      notifications: [
        { message:  `Welcome ${name}! Your Nexus Justice account is active. You can sign in now.`, type: 'general', read: false, createdAt: new Date() }, 
        { message: `Your affiliate link is ready: ${myAffLink} — Paste it on social media to earn commissions!`, type: 'affiliate', read: false, createdAt: new Date(), link: myAffLink },
        { message: `Check your commission here → Affiliate Portal`, type: 'affiliate_portal', read: false, createdAt: new Date() },
      ],
    });

    // If referred by affiliate, update affiliate record
    if (affiliateCode) {
      const aff = await Affiliate.findOne({ code: affiliateCode });
      if (aff) {
        aff.subscribers.push({ advocateId: advocate._id, name, plan: 'Starter', joinDate: new Date(), paid: false });
        await aff.save();
      }
    }

    // Notify Agency HQ (broadcast)
    await Broadcast.create({ message: `New advocate signup: ${name} (${email}) — account activated.`, tier: 'admin', sentBy: 'system' });

    res.json({ ok: true, user: { id: advocate._id, name, email, status: 'active' } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Login (Advocate + Agency + Affiliate)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check advocates first
    let user = await Advocate.findOne({ email });
    if (user) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
      const token = jwt.sign({ id: user._id, role: user.role, email }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ ok: true, token, user: { id: user._id, name: user.name, email, role: user.role, plan: user.plan, status: user.status, affiliateCode: user.affiliateCode, affiliateLink: user.affiliateLink } });
    }
    // Check affiliates
    let aff = await Affiliate.findOne({ email });
    if (aff) {
      const valid = await bcrypt.compare(password, aff.password);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
      const token = jwt.sign({ id: aff._id, role: 'affiliate', email }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ ok: true, token, user: { id: aff._id, name: aff.name, email, role: 'affiliate', code: aff.code, totalEarned: aff.totalEarned } });
    }
    return res.status(401).json({ error: 'Invalid email or password.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await Advocate.findOne({ email });
  if (!user) return res.status(404).json({ error: 'No account with this email.' });
  res.json({ ok: true, message: 'Reset link sent (email service not configured in dev mode).' });
});

// ─── Routes: Advocate ─────────────────────────────────────────────────────────
app.get('/api/advocate/me', authMiddleware, async (req, res) => {
  const user = await Advocate.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

app.get('/api/advocate/notifications', authMiddleware, async (req, res) => {
  const user = await Advocate.findById(req.user.id);
  res.json(user?.notifications || []);
});

app.put('/api/advocate/notifications/:notifId/read', authMiddleware, async (req, res) => {
  const user = await Advocate.findById(req.user.id);
  const notif = user.notifications.id(req.params.notifId);
  if (notif) { notif.read = true; await user.save(); }
  res.json({ ok: true });
});

// ─── Routes: Agency HQ ───────────────────────────────────────────────────────
app.get('/api/agency/advocates', authMiddleware, async (req, res) => {
  if (!['agency', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const advocates = await Advocate.find({ role: 'advocate' }).select('-password').sort({ joinedAt: -1 });
  res.json(advocates);
});

app.get('/api/agency/pending', authMiddleware, async (req, res) => {
  if (!['agency', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const pending = await Advocate.find({ status: 'pending_approval' }).select('-password');
  res.json(pending);
});

app.post('/api/agency/approve/:id', authMiddleware, async (req, res) => {
  if (!['agency', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const advocate = await Advocate.findByIdAndUpdate(req.params.id,
    { status: 'active', $push: { notifications: { message: '🎉 Your account has been approved! Welcome to Nexus Justice.', type: 'approval', read: false, createdAt: new Date() } } },
    { new: true });
  res.json({ ok: true, advocate });
});

app.post('/api/agency/reject/:id', authMiddleware, async (req, res) => {
  if (!['agency', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  await Advocate.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

app.post('/api/agency/broadcast', authMiddleware, async (req, res) => {
  if (!['agency', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { message, tier } = req.body;
  const broadcast = await Broadcast.create({ message, tier: tier || 'All', sentBy: req.user.email });
  // Push to all advocates
  const filter = tier && tier !== 'All' ? { plan: tier } : {};
  await Advocate.updateMany(filter, { $push: { notifications: { message, type: 'broadcast', read: false, createdAt: new Date() } } });
  res.json({ ok: true, broadcast });
});

app.get('/api/agency/broadcasts', authMiddleware, async (req, res) => {
  const broadcasts = await Broadcast.find().sort({ sentAt: -1 }).limit(50);
  res.json(broadcasts);
});

app.get('/api/agency/affiliates', authMiddleware, async (req, res) => {
  if (!['agency', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const affiliates = await Affiliate.find().select('-password').sort({ joined: -1 });
  res.json(affiliates);
});

// Generate affiliate link for existing affiliate (from Agency HQ)
app.post('/api/agency/affiliates/:id/generate-link', authMiddleware, async (req, res) => {
  if (!['agency', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const aff = await Affiliate.findById(req.params.id);
  if (!aff) return res.status(404).json({ error: 'Affiliate not found' });
  const link = `${process.env.APP_URL || 'https://nexusjustice.in'}/signup?ref=${aff.code}`;
  res.json({ ok: true, link, code: aff.code, affiliateName: aff.name });
});

// Create new affiliate directly from Agency HQ
app.post('/api/agency/affiliates/create', authMiddleware, async (req, res) => {
  if (!['agency', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const { name, email, phone, password, state, district } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields.' });
    const exists = await Affiliate.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const code = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,3) + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const aff = await Affiliate.create({ name, email, phone, password: hashed, code, state: state||'', district: district||'', joined: new Date() });
    const link = `${process.env.APP_URL || 'https://nexusjustice.in'}/signup?ref=${code}`;
    res.json({ ok: true, aff: { ...aff.toObject(), password: undefined }, link });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update affiliate payment / commission
app.post('/api/agency/affiliates/:id/pay', authMiddleware, async (req, res) => {
  if (!['agency', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { amount, month } = req.body;
  const txId = 'TXN-' + Date.now();
  const aff = await Affiliate.findByIdAndUpdate(req.params.id, {
    $inc: { totalEarned: amount },
    $push: { paymentHistory: { month, amount, paidOn: new Date(), txId, status: 'paid' } }
  }, { new: true });
  res.json({ ok: true, aff });
});

app.get('/api/agency/stats', authMiddleware, async (req, res) => {
  if (!['agency', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const [totalAdvocates, pending, affiliates, broadcasts] = await Promise.all([
    Advocate.countDocuments({ role: 'advocate' }),
    Advocate.countDocuments({ status: 'pending_approval' }),
    Affiliate.countDocuments(),
    Broadcast.countDocuments(),
  ]);
  const activeCasesAgg = await Advocate.aggregate([{ $group: { _id: null, total: { $sum: '$activeCases' } } }]);
  res.json({ totalAdvocates, pending, affiliates, broadcasts, totalCases: activeCasesAgg[0]?.total || 0 });
});

// ─── Routes: Affiliate ────────────────────────────────────────────────────────
app.get('/api/affiliate/me', authMiddleware, async (req, res) => {
  const aff = await Affiliate.findById(req.user.id).select('-password');
  res.json(aff);
});

app.get('/api/affiliate/dashboard', authMiddleware, async (req, res) => {
  const aff = await Affiliate.findById(req.user.id);
  const advocates = await Advocate.find({ affiliateCode: aff.code }).select('name email plan status joinedAt');
  const PLAN_FEE = { Starter: 0, Pro: 999, Elite: 2499 };
  const COMMISSION_RATE = 0.10;
  const earned = advocates.filter(a => a.status === 'active').reduce((s, a) => s + (PLAN_FEE[a.plan] || 0) * COMMISSION_RATE, 0);
  res.json({ aff, subscribers: advocates, earned, paymentHistory: aff.paymentHistory });
});

// ─── Routes: AI ──────────────────────────────────────────────────────────────
app.post('/api/ai/consult', authMiddleware, async (req, res) => {
  try {
    const { message, history = [], language = 'en' } = req.body;
    const systemPrompt = `You are a highly skilled Indian legal AI assistant for advocates. 
    Provide precise legal advice citing relevant Indian laws (IPC, CPC, Evidence Act, etc.).
    Be concise, professional, and actionable. Format responses clearly.`;
    const fullPrompt = history.map(h => `${h.role}: ${h.text}`).join('\n') + `\nUser: ${message}`;
    const result = await callAI(fullPrompt, systemPrompt, { language });
    res.json({ ok: true, reply: result.text, model: result.model });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/draft', authMiddleware, async (req, res) => {
  try {
    const { instruction, currentDraft = '', pageNum = 1 } = req.body;
    const systemPrompt = `You are an expert Indian legal drafting assistant. 
    Help draft professional legal documents following proper Indian court formats.
    Current draft context provided. Respond with specific, actionable drafting help.`;
    const result = await callAI(`Current draft (Page ${pageNum}):\n${currentDraft}\n\nInstruction: ${instruction}`, systemPrompt);
    res.json({ ok: true, reply: result.text, model: result.model });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.body;
    const searchResults = await webSearch(query + ' Indian law legal');
    if (searchResults.success && searchResults.results.length > 0) {
      const context = searchResults.results.slice(0, 3).map(r => `${r.title}: ${r.snippet}`).join('\n');
      const aiResult = await callAI(`Based on these search results about: "${query}"\n\n${context}\n\nProvide a concise legal summary.`);
      res.json({ ok: true, results: searchResults.results, summary: aiResult.text, model: aiResult.model });
    } else {
      const aiResult = await callAI(`Provide information about: ${query} (Indian legal context)`);
      res.json({ ok: true, results: [], summary: aiResult.text, model: aiResult.model });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Sarvam AI: TTS + Translation ────────────────────────────────────────────
app.post('/api/sarvam/translate', authMiddleware, async (req, res) => {
  const { text, targetLang } = req.body;
  const result = await callSarvam(text, targetLang, 'translate');
  if (!result.success) {
    // Fallback: use Gemini to translate
    const aiResult = await callAI(`Translate the following to ${targetLang}: "${text}". Return only the translation.`);
    return res.json({ ok: true, translated: aiResult.text, fallback: true });
  }
  res.json({ ok: true, translated: result.translated });
});

app.post('/api/sarvam/tts', authMiddleware, async (req, res) => {
  const { text, lang } = req.body;
  const result = await callSarvam(text, lang, 'tts');
  if (!result.success) return res.json({ ok: false, error: result.error });
  res.json({ ok: true, audio: result.audio });
});
// ─── SSE: Real-time call push ─────────────────────────────────────────────────
const sseClients = new Map();

app.get('/api/calls/stream', authMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  const advocateId = req.user.id;
  sseClients.set(advocateId, res);
  const hb = setInterval(() => res.write(': heartbeat\n\n'), 25000);
  req.on('close', () => { clearInterval(hb); sseClients.delete(advocateId); });
});

function pushCallEvent(advocateId, event, data) {
  const client = sseClients.get(String(advocateId));
  if (client) client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─── Webhook: Receive forwarded call (no auth — called by phone provider) ─────
app.post('/api/webhook/call', async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET || 'nexus_webhook_2026';
  const provided = req.query.key || req.headers['x-webhook-key'] || req.body.webhookKey;
  if (provided !== secret) return res.status(401).json({ error: 'Invalid webhook key' });
  try {
    const { advocateId, advocatePhone, caller = 'Unknown Caller', phone = '', status = 'incoming', duration = '', transcript = '' } = req.body;
    let advId = advocateId;
    if (!advId && advocatePhone) {
      const adv = await Advocate.findOne({ phone: advocatePhone });
      if (adv) advId = String(adv._id);
    }
    if (!advId) return res.status(400).json({ error: 'advocateId or advocatePhone required' });
    let call;
    if (status === 'incoming' || status === 'active') {
      call = await IncomingCall.create({ advocateId: advId, caller, phone, status, source: 'webhook' });
    } else {
      call = await IncomingCall.findOne({ advocateId: advId, phone, status: { $in: ['incoming', 'active'] } }).sort({ receivedAt: -1 });
      if (call) {
        call.status = status; call.duration = duration; call.endedAt = new Date();
        if (transcript) call.transcript = transcript;
        if (transcript && !call.summary) {
          try { const ai = await callAI(`Summarise this call in 1-2 sentences for an advocate's log:\n\n${transcript.slice(0, 1500)}`); call.summary = ai.text; } catch {}
        }
        await call.save();
      } else {
        call = await IncomingCall.create({ advocateId: advId, caller, phone, status, duration, transcript, source: 'webhook', endedAt: new Date() });
      }
    }
    pushCallEvent(advId, 'call', { ...call.toObject() });
    res.json({ ok: true, callId: call._id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Routes: Calls ────────────────────────────────────────────────────────────
app.get('/api/calls', authMiddleware, async (req, res) => {
  const calls = await IncomingCall.find({ advocateId: req.user.id }).sort({ receivedAt: -1 }).limit(50);
  res.json({ ok: true, calls });
});

app.post('/api/calls', authMiddleware, async (req, res) => {
  const { caller, phone, duration, summary, status = 'ended' } = req.body;
  const call = await IncomingCall.create({ advocateId: req.user.id, caller, phone, duration, summary, status, source: 'manual', endedAt: new Date() });
  res.json({ ok: true, call });
});

app.post('/api/calls/:id/summarise', authMiddleware, async (req, res) => {
  const call = await IncomingCall.findOne({ _id: req.params.id, advocateId: req.user.id });
  if (!call) return res.status(404).json({ error: 'Call not found' });
  const { transcript } = req.body;
  if (transcript) call.transcript = transcript;
  if (!call.transcript) return res.status(400).json({ error: 'No transcript' });
  const ai = await callAI(`Summarise this call transcript in 1-2 sentences:\n\n${call.transcript.slice(0, 2000)}`);
  call.summary = ai.text; await call.save();
  res.json({ ok: true, summary: call.summary, call });
});

app.delete('/api/calls/:id', authMiddleware, async (req, res) => {
  await IncomingCall.deleteOne({ _id: req.params.id, advocateId: req.user.id });
  res.json({ ok: true });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '3.1', timestamp: new Date().toISOString() }));

// ─── Serve React Frontend ─────────────────────────────────────────────────────
const DIST = path.join(__dirname, 'frontend/dist');
app.use(express.static(DIST));
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});
// ─── Start ───
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Nexus Justice SaaS running on port ${PORT}`);
  await seedData();
});
