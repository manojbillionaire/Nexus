import { useState, useRef, useEffect, useCallback } from "react";


// ─────────────────────────────────────────────
//  SHARED IN-MEMORY USER STORE
//  In production replace with real API calls
// ─────────────────────────────────────────────
const USER_STORE = {
  advocates: [
    {
      id: 'adv-001', role: 'advocate',
      name: 'Adv. Sanjay Menon', email: 'sanjay@nexusjustice.in',
      password: 'demo1234', phone: '+91 9876543210',
      barCouncilNo: 'KL/1234/2010', specialisation: 'Property Law',
      plan: 'Pro', affiliateCode: 'AFF-001',
      joinedAt: '2026-01-15', status: 'active',
      activeCases: 5, monthlyRevenue: 12480,
    }
  ],
  pendingSignups: [],

  register(data) {
    const exists = this.advocates.find(a => a.email === data.email);
    if (exists) return { ok: false, error: 'Email already registered.' };
    const newAdv = {
      id: `adv-${Date.now()}`, role: 'advocate',
      name: data.name, email: data.email,
      password: data.password, phone: data.phone,
      barCouncilNo: data.barCouncilNo, specialisation: data.specialisation || '',
      plan: 'Starter', affiliateCode: data.affiliateCode || '',
      joinedAt: new Date().toISOString().slice(0, 10),
      status: 'pending_approval',
      activeCases: 0, monthlyRevenue: 0,
    };
    this.advocates.push(newAdv);
    this.pendingSignups.push(newAdv);
    return { ok: true, user: newAdv };
  },

  login(email, password) {
    const user = this.advocates.find(a => a.email === email && a.password === password);
    if (!user) return { ok: false, error: 'Invalid email or password.' };
    return { ok: true, user };
  },

  resetPassword(email) {
    const user = this.advocates.find(a => a.email === email);
    if (!user) return { ok: false, error: 'No account found with this email.' };
    return { ok: true };
  },

  getAllAdvocates() { return this.advocates; },
  getPending() { return this.pendingSignups; },
  approveAdvocate(id) {
    const a = this.advocates.find(x => x.id === id);
    if (a) { a.status = 'active'; }
    this.pendingSignups = this.pendingSignups.filter(x => x.id !== id);
  },
  rejectAdvocate(id) {
    this.advocates = this.advocates.filter(x => x.id !== id);
    this.pendingSignups = this.pendingSignups.filter(x => x.id !== id);
  },
};

// ─────────────────────────────────────────────
//  ICON
// ─────────────────────────────────────────────
const Icon = ({ path, size = 20, strokeWidth = 2, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color || 'currentColor'} strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);

// ─────────────────────────────────────────────
//  AUTH SCREENS
// ─────────────────────────────────────────────

function AuthShell({ children, title, sub }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#020617', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif", padding: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes authFadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes authGlow{0%,100%{opacity:.3}50%{opacity:.7}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .auth-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px 16px;color:#e2e8f0;font-size:13px;outline:none;box-sizing:border-box;transition:border .2s}
        .auth-input:focus{border-color:rgba(99,102,241,.5);background:rgba(99,102,241,.04)}
        .auth-input::placeholder{color:#334155}
        .auth-btn{width:100%;padding:14px;background:#6366f1;border:none;border-radius:13px;color:#fff;font-size:13px;font-weight:900;cursor:pointer;letter-spacing:0.05em;transition:all .2s}
        .auth-btn:hover{background:#4f46e5;transform:translateY(-1px);box-shadow:0 8px 30px rgba(99,102,241,.4)}
        .auth-btn:disabled{background:rgba(99,102,241,.3);cursor:default;transform:none;box-shadow:none}
        .auth-link{background:none;border:none;color:#6366f1;cursor:pointer;font-size:12px;font-weight:700;text-decoration:underline;padding:0}
        .auth-link:hover{color:#818cf8}
        .field-label{font-size:10px;font-weight:900;color:#475569;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;display:block}
        .error-box{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);borderRadius:10px;padding:10px 14px;color:#f87171;font-size:12px;border-radius:10px;margin-bottom:14px}
        .success-box{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:10px 14px;color:#10b981;font-size:12px;margin-bottom:14px}
      `}</style>

      {/* Background glows */}
      <div style={{ position:'absolute', top:'10%', left:'15%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)', animation:'authGlow 4s ease infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'5%', right:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,158,11,.08) 0%,transparent 70%)', animation:'authGlow 5s ease infinite .5s', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:460, animation:'authFadeUp .5s ease forwards' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:56, height:56, background:'#f59e0b', borderRadius:16, display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:14, boxShadow:'0 8px 32px rgba(245,158,11,.35)' }}>
            <span style={{ fontSize:28, fontWeight:900, color:'#000', fontStyle:'italic' }}>T</span>
          </div>
          <div style={{ fontSize:10, color:'#475569', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:4 }}>Nexus Justice v3.1</div>
          <h1 style={{ fontSize:28, fontWeight:900, color:'#e2e8f0', margin:0, letterSpacing:'-0.02em' }}>{title}</h1>
          {sub && <p style={{ fontSize:13, color:'#475569', margin:'8px 0 0' }}>{sub}</p>}
        </div>

        <div style={{ background:'#0a0f1d', borderRadius:24, padding:32, border:'1px solid rgba(255,255,255,.06)', boxShadow:'0 40px 80px rgba(0,0,0,.6)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── SIGN IN ──
function SignIn({ onSignIn, onGoSignUp, onGoForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const res = USER_STORE.login(email, password);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    onSignIn(res.user);
  };

  return (
    <AuthShell title="Welcome Back" sub="Sign in to your Advocate Portal">
      {error && <div className="error-box">⚠ {error}</div>}
      <div style={{ marginBottom:16 }}>
        <label className="field-label">Email Address</label>
        <input className="auth-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
      </div>
      <div style={{ marginBottom:8 }}>
        <label className="field-label">Password</label>
        <div style={{ position:'relative' }}>
          <input className="auth-input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={{ paddingRight:44 }} />
          <button onClick={() => setShowPass(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:14 }}>{showPass ? '🙈' : '👁'}</button>
        </div>
      </div>
      <div style={{ textAlign:'right', marginBottom:22 }}>
        <button className="auth-link" onClick={onGoForgot}>Forgot password?</button>
      </div>
      <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', verticalAlign:'middle', marginRight:8 }} /> : null}
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#475569' }}>
        Don't have an account? <button className="auth-link" onClick={onGoSignUp}>Create account</button>
      </div>
      {/* Demo hint */}
      <div style={{ marginTop:20, padding:'10px 14px', background:'rgba(99,102,241,.06)', border:'1px solid rgba(99,102,241,.12)', borderRadius:10 }}>
        <div style={{ fontSize:9, color:'#6366f1', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:4 }}>Demo Credentials</div>
        <div style={{ fontSize:11, color:'#475569' }}>Email: <span style={{ color:'#94a3b8', fontWeight:700 }}>sanjay@nexusjustice.in</span></div>
        <div style={{ fontSize:11, color:'#475569' }}>Password: <span style={{ color:'#94a3b8', fontWeight:700 }}>demo1234</span></div>
      </div>
    </AuthShell>
  );
}

// ── SIGN UP ──
function SignUp({ onSignUp, onGoSignIn }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', confirmPassword:'', barCouncilNo:'', specialisation:'', affiliateCode:'' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.includes('@')) return 'Enter a valid email.';
    if (!/^\+?\d{8,15}$/.test(form.phone.replace(/\s/,''))) return 'Enter a valid phone number.';
    return null;
  };
  const validateStep2 = () => {
    if (!form.barCouncilNo.trim()) return 'Bar Council number is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1(); if (err) { setError(err); return; }
    setError(''); setStep(2);
  };

  const handleSubmit = async () => {
    const err = validateStep2(); if (err) { setError(err); return; }
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const res = USER_STORE.register(form);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    onSignUp(res.user);
  };

  const SPECIALISATIONS = ['Property Law','Criminal Law','Family Law','Corporate Law','Labour Law','Railway Law','Cooperative Law','Constitutional Law','Tax Law','Other'];

  return (
    <AuthShell title="Create Account" sub="Join Nexus Justice as an Advocate">
      {/* Step indicator */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
        {[1,2].map(s => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background: step >= s ? '#6366f1' : 'rgba(255,255,255,.06)', border: `2px solid ${step >= s ? '#818cf8' : 'rgba(255,255,255,.08)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color: step >= s ? '#fff' : '#334155', transition:'all .3s' }}>{s}</div>
            <span style={{ fontSize:10, color: step >= s ? '#818cf8' : '#334155', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>{s === 1 ? 'Personal' : 'Professional'}</span>
            {s < 2 && <div style={{ width:32, height:1, background: step > s ? '#6366f1' : 'rgba(255,255,255,.08)' }} />}
          </div>
        ))}
      </div>

      {error && <div className="error-box">⚠ {error}</div>}

      {step === 1 && (
        <>
          <div style={{ marginBottom:14 }}>
            <label className="field-label">Full Name</label>
            <input className="auth-input" placeholder="Adv. Your Full Name" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="field-label">Email Address</label>
            <input className="auth-input" type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div style={{ marginBottom:22 }}>
            <label className="field-label">Phone Number</label>
            <input className="auth-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <button className="auth-btn" onClick={handleNext}>Continue →</button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ marginBottom:14 }}>
            <label className="field-label">Bar Council Enrolment No.</label>
            <input className="auth-input" placeholder="KL/1234/2010" value={form.barCouncilNo} onChange={e => set('barCouncilNo', e.target.value)} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="field-label">Specialisation</label>
            <select value={form.specialisation} onChange={e => set('specialisation', e.target.value)} style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'13px 16px', color: form.specialisation ? '#e2e8f0' : '#334155', fontSize:13, outline:'none', boxSizing:'border-box' }}>
              <option value="">Select specialisation…</option>
              {SPECIALISATIONS.map(s => <option key={s} value={s} style={{ background:'#0a0f1d' }}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="field-label">Affiliate / Referral Code <span style={{ color:'#334155', fontWeight:400, textTransform:'none' }}>(optional)</span></label>
            <input className="auth-input" placeholder="e.g. AFF-001" value={form.affiliateCode} onChange={e => set('affiliateCode', e.target.value)} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="field-label">Password</label>
            <div style={{ position:'relative' }}>
              <input className="auth-input" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingRight:44 }} />
              <button onClick={() => setShowPass(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:14 }}>{showPass ? '🙈' : '👁'}</button>
            </div>
            {/* Password strength */}
            {form.password.length > 0 && (
              <div style={{ display:'flex', gap:3, marginTop:6 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background: form.password.length >= i*2 ? i<=1?'#ef4444':i<=2?'#f59e0b':i<=3?'#6366f1':'#10b981' : 'rgba(255,255,255,.06)', transition:'background .3s' }} />)}
              </div>
            )}
          </div>
          <div style={{ marginBottom:22 }}>
            <label className="field-label">Confirm Password</label>
            <input className="auth-input" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setStep(1); setError(''); }} style={{ padding:'13px 20px', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:13, color:'#94a3b8', fontSize:13, fontWeight:700, cursor:'pointer' }}>← Back</button>
            <button className="auth-btn" onClick={handleSubmit} disabled={loading} style={{ flex:1 }}>
              {loading ? <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', verticalAlign:'middle', marginRight:8 }} /> : null}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </div>
        </>
      )}

      <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#475569' }}>
        Already have an account? <button className="auth-link" onClick={onGoSignIn}>Sign in</button>
      </div>
    </AuthShell>
  );
}

// ── SIGN UP SUCCESS ──
function SignUpSuccess({ user, onGoSignIn }) {
  return (
    <AuthShell title="Application Submitted!" sub="">
      <div style={{ textAlign:'center', padding:'10px 0 20px' }}>
        <div style={{ width:64, height:64, background:'rgba(16,185,129,.1)', border:'2px solid rgba(16,185,129,.3)', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:30, marginBottom:16 }}>✓</div>
        <p style={{ color:'#94a3b8', fontSize:13, lineHeight:1.7, margin:'0 0 20px' }}>
          Your account has been submitted for approval.<br/>
          The <strong style={{ color:'#e2e8f0' }}>Agency HQ</strong> will review and activate your account shortly.
        </p>
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:18, textAlign:'left', marginBottom:24 }}>
          {[['Name', user.name], ['Email', user.email], ['Bar Council No.', user.barCouncilNo], ['Plan', user.plan], ['Status', 'Pending Approval']].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
              <span style={{ fontSize:11, color:'#475569', fontWeight:700 }}>{k}</span>
              <span style={{ fontSize:11, color: k==='Status'?'#f59e0b':'#94a3b8', fontWeight: k==='Status'?900:400 }}>{v}</span>
            </div>
          ))}
        </div>
        <button className="auth-btn" onClick={onGoSignIn}>Go to Sign In</button>
      </div>
    </AuthShell>
  );
}

// ── FORGOT PASSWORD ──
function ForgotPassword({ onGoSignIn }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const res = USER_STORE.resetPassword(email);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setSent(true);
  };

  return (
    <AuthShell title="Reset Password" sub="We'll send a reset link to your email">
      {sent ? (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📧</div>
          <div className="success-box" style={{ textAlign:'left' }}>Reset link sent to <strong>{email}</strong>. Check your inbox and follow the instructions.</div>
          <p style={{ fontSize:12, color:'#475569', marginBottom:20 }}>Didn't receive it? Check your spam folder or contact <span style={{ color:'#6366f1' }}>support@nexusjustice.in</span></p>
          <button className="auth-btn" onClick={onGoSignIn}>Back to Sign In</button>
        </div>
      ) : (
        <>
          {error && <div className="error-box">⚠ {error}</div>}
          <div style={{ marginBottom:22 }}>
            <label className="field-label">Registered Email Address</label>
            <input className="auth-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', verticalAlign:'middle', marginRight:8 }} /> : null}
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
          <div style={{ textAlign:'center', marginTop:18 }}>
            <button className="auth-link" onClick={onGoSignIn}>← Back to Sign In</button>
          </div>
        </>
      )}
    </AuthShell>
  );
}

// ─────────────────────────────────────────────
//  AGENCY HQ PORTAL  (receives all advocate data)
// ─────────────────────────────────────────────
function AgencyHQPortal({ onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [advocates, setAdvocates] = useState(USER_STORE.getAllAdvocates());
  const [pending, setPending] = useState(USER_STORE.getPending());
  const [searchQ, setSearchQ] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasts, setBroadcasts] = useState([
    { id:1, message:'System maintenance on 10 March 2026, 2–4 AM IST.', date:'2026-03-05', tier:'All' },
    { id:2, message:'New AI legal engine update deployed — check Release Notes.', date:'2026-03-01', tier:'Pro' },
  ]);

  const refresh = () => { setAdvocates([...USER_STORE.getAllAdvocates()]); setPending([...USER_STORE.getPending()]); };

  const approve = (id) => { USER_STORE.approveAdvocate(id); refresh(); };
  const reject  = (id) => { USER_STORE.rejectAdvocate(id);  refresh(); };

  const filtered = advocates.filter(a =>
    !searchQ || a.name.toLowerCase().includes(searchQ.toLowerCase()) || a.email.toLowerCase().includes(searchQ.toLowerCase())
  );

  const S = {
    page: { display:'flex', height:'100vh', background:'#020617', color:'#e2e8f0', fontFamily:"'Inter',system-ui,sans-serif", overflow:'hidden', fontSize:14 },
    sidebar: { width:220, background:'#070b14', borderRight:'1px solid rgba(255,255,255,.05)', display:'flex', flexDirection:'column', padding:'20px 0', flexShrink:0 },
    main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
    header: { height:54, background:'#0a0f1d', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', padding:'0 24px', justifyContent:'space-between', flexShrink:0 },
    content: { flex:1, overflowY:'auto', padding:24 },
    card: { background:'#0a0f1d', borderRadius:20, padding:22, border:'1px solid rgba(255,255,255,.05)' },
    navBtn: (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'10px 18px', margin:'2px 10px', borderRadius:12, background:active?'rgba(245,158,11,.08)':'transparent', border:active?'1px solid rgba(245,158,11,.15)':'1px solid transparent', color:active?'#f59e0b':'#475569', fontSize:12, fontWeight:700, cursor:'pointer', textAlign:'left' }),
  };

  const NAVS = [
    ['dashboard','Dashboard',"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"],
    ['advocates','Advocates',"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"],
    ['pending','Pending'+(pending.length>0?` (${pending.length})`:''),"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"],
    ['broadcasts','Broadcasts',"M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"],
  ];

  return (
    <div style={S.page}>
      <style>{`::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(245,158,11,.3);border-radius:4px}button:focus{outline:none}input{color:#e2e8f0;outline:none}input::placeholder{color:#475569}`}</style>
      <div style={S.sidebar}>
        <div style={{ padding:'0 18px 20px', borderBottom:'1px solid rgba(255,255,255,.05)', marginBottom:10 }}>
          <div style={{ width:44, height:44, background:'#f59e0b', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <span style={{ fontSize:22, fontWeight:900, color:'#000', fontStyle:'italic' }}>T</span>
          </div>
          <div style={{ fontSize:8, color:'#f59e0b', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase' }}>Agency HQ</div>
          <div style={{ fontSize:14, fontWeight:900, color:'#e2e8f0' }}>Admin Portal</div>
        </div>
        {NAVS.map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)} style={S.navBtn(tab===id)}>
            <Icon path={icon} size={15} strokeWidth={2} />
            <span>{label}</span>
            {id==='pending'&&pending.length>0&&<span style={{ marginLeft:'auto', background:'#ef4444', color:'#fff', borderRadius:10, fontSize:9, fontWeight:900, padding:'2px 7px' }}>{pending.length}</span>}
          </button>
        ))}
        <div style={{ marginTop:'auto', padding:'16px 18px', borderTop:'1px solid rgba(255,255,255,.05)' }}>
          <button onClick={onLogout} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', width:'100%', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:11, color:'#f87171', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={14} /> Sign Out
          </button>
        </div>
      </div>

      <div style={S.main}>
        <header style={S.header}>
          <div style={{ fontSize:13, fontWeight:900, color:'#e2e8f0' }}>Nexus Justice <span style={{ color:'#f59e0b' }}>Agency HQ</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {pending.length > 0 && <div style={{ padding:'4px 12px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:20, fontSize:10, color:'#f87171', fontWeight:900 }}>{pending.length} Pending Approval</div>}
            <div style={{ padding:'4px 12px', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.15)', borderRadius:20, fontSize:10, color:'#f59e0b', fontWeight:900 }}>{advocates.length} Advocates</div>
          </div>
        </header>

        <div style={S.content}>

          {/* DASHBOARD */}
          {tab==='dashboard' && (
            <div>
              <h2 style={{ fontSize:28, fontWeight:900, fontStyle:'italic', margin:'0 0 20px', letterSpacing:'-0.02em' }}>Dashboard <span style={{ color:'#475569', fontStyle:'normal', fontSize:18 }}>Overview</span></h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
                {[
                  ['Total Advocates', advocates.length, '#6366f1', "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"],
                  ['Active', advocates.filter(a=>a.status==='active').length, '#10b981', "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"],
                  ['Pending Approval', pending.length, '#f59e0b', "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"],
                  ['Total Cases', advocates.reduce((s,a)=>s+a.activeCases,0), '#8b5cf6', "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"],
                ].map(([label, val, color, icon]) => (
                  <div key={label} style={{ ...S.card, display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:`rgba(${color==='#6366f1'?'99,102,241':color==='#10b981'?'16,185,129':color==='#f59e0b'?'245,158,11':'139,92,246'},.1)`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>
                      <Icon path={icon} size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div style={{ fontSize:26, fontWeight:900, color }}>{val}</div>
                      <div style={{ fontSize:10, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Recent signups */}
              <div style={S.card}>
                <div style={{ fontSize:10, color:'#f59e0b', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:14 }}>Recent Advocate Registrations</div>
                {advocates.slice(-5).reverse().map(a => (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#818cf8', fontWeight:900, fontSize:14, flexShrink:0 }}>{a.name[0]}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{a.name}</div>
                      <div style={{ fontSize:11, color:'#475569' }}>{a.email} · {a.specialisation || 'General'}</div>
                    </div>
                    <span style={{ fontSize:9, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', padding:'3px 10px', borderRadius:20, background:a.status==='active'?'rgba(16,185,129,.1)':'rgba(245,158,11,.1)', color:a.status==='active'?'#10b981':'#f59e0b' }}>{a.status==='active'?'Active':'Pending'}</span>
                    <div style={{ fontSize:11, color:'#334155' }}>{a.joinedAt}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADVOCATES LIST */}
          {tab==='advocates' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:0 }}>All Advocates</h2>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search by name or email…" style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:11, padding:'9px 16px', fontSize:12, width:240 }} />
              </div>
              <div style={S.card}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                      {['Name','Email','Phone','Bar Council No.','Plan','Status','Joined','Cases'].map(h=>(
                        <th key={h} style={{ paddingBottom:10, paddingLeft:12, textAlign:'left', fontSize:9, fontWeight:900, color:'#475569', textTransform:'uppercase', letterSpacing:'0.15em', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a=>(
                      <tr key={a.id} style={{ borderBottom:'1px solid rgba(255,255,255,.03)' }}>
                        <td style={{ padding:'12px', fontWeight:700, fontSize:13 }}>{a.name}</td>
                        <td style={{ padding:'12px', color:'#64748b', fontSize:12 }}>{a.email}</td>
                        <td style={{ padding:'12px', color:'#64748b', fontSize:12 }}>{a.phone}</td>
                        <td style={{ padding:'12px', color:'#818cf8', fontSize:12, fontWeight:700 }}>{a.barCouncilNo}</td>
                        <td style={{ padding:'12px' }}><span style={{ fontSize:10, fontWeight:900, color: a.plan==='Pro'?'#6366f1':a.plan==='Elite'?'#f59e0b':'#475569', background:'rgba(255,255,255,.04)', padding:'3px 9px', borderRadius:20 }}>{a.plan}</span></td>
                        <td style={{ padding:'12px' }}><span style={{ fontSize:10, fontWeight:900, textTransform:'uppercase', color:a.status==='active'?'#10b981':'#f59e0b', background:a.status==='active'?'rgba(16,185,129,.1)':'rgba(245,158,11,.1)', padding:'3px 9px', borderRadius:20 }}>{a.status==='active'?'Active':'Pending'}</span></td>
                        <td style={{ padding:'12px', color:'#475569', fontSize:12 }}>{a.joinedAt}</td>
                        <td style={{ padding:'12px', fontWeight:900, color:'#6366f1', fontSize:14 }}>{a.activeCases}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length===0 && <div style={{ textAlign:'center', padding:40, color:'#334155', fontSize:13 }}>No advocates found.</div>}
              </div>
            </div>
          )}

          {/* PENDING APPROVALS */}
          {tab==='pending' && (
            <div>
              <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:'0 0 18px' }}>Pending <span style={{ color:'#475569', fontStyle:'normal' }}>Approvals</span></h2>
              {pending.length === 0 ? (
                <div style={{ ...S.card, textAlign:'center', padding:48, color:'#334155' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>✓</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>All caught up! No pending approvals.</div>
                </div>
              ) : pending.map(a => (
                <div key={a.id} style={{ ...S.card, marginBottom:12, display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f59e0b', fontWeight:900, fontSize:18, flexShrink:0 }}>{a.name[0]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{a.name}</div>
                    <div style={{ fontSize:11, color:'#64748b', display:'flex', gap:16, flexWrap:'wrap' }}>
                      <span>{a.email}</span>
                      <span>{a.phone}</span>
                      <span>Bar: <strong style={{ color:'#818cf8' }}>{a.barCouncilNo}</strong></span>
                      <span>Spec: {a.specialisation||'—'}</span>
                      {a.affiliateCode && <span>Ref: <strong style={{ color:'#f59e0b' }}>{a.affiliateCode}</strong></span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>approve(a.id)} style={{ padding:'9px 20px', background:'#10b981', border:'none', borderRadius:10, color:'#fff', fontSize:11, fontWeight:900, cursor:'pointer' }}>✓ Approve</button>
                    <button onClick={()=>reject(a.id)}  style={{ padding:'9px 20px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, color:'#f87171', fontSize:11, fontWeight:900, cursor:'pointer' }}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BROADCASTS */}
          {tab==='broadcasts' && (
            <div>
              <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:'0 0 18px' }}>Broadcasts</h2>
              <div style={{ ...S.card, marginBottom:18 }}>
                <div style={{ fontSize:10, color:'#f59e0b', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>Send Announcement</div>
                <textarea value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} placeholder="Type your announcement to all advocates…" rows={3} style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'12px 14px', color:'#e2e8f0', fontSize:13, resize:'none', boxSizing:'border-box', outline:'none', marginBottom:12 }} />
                <button onClick={()=>{ if(!broadcastMsg.trim())return; setBroadcasts(b=>[{id:Date.now(),message:broadcastMsg.trim(),date:new Date().toISOString().slice(0,10),tier:'All'},...b]); setBroadcastMsg(''); }} style={{ padding:'10px 24px', background:'#f59e0b', border:'none', borderRadius:11, color:'#000', fontSize:11, fontWeight:900, cursor:'pointer' }}>Send to All Advocates</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {broadcasts.map(b=>(
                  <div key={b.id} style={{ ...S.card, display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, color:'#e2e8f0', lineHeight:1.5 }}>{b.message}</p>
                      <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>{b.date} · Tier: {b.tier}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  AFFILIATE PORTAL  (sees own referral data)
// ─────────────────────────────────────────────
function AffiliatePortal({ user, onLogout }) {
  const myReferrals = USER_STORE.getAllAdvocates().filter(a => a.affiliateCode === (user.affiliateCode||'AFF-001') && a.id !== user.id);
  const COMMISSION = 0.20;
  const PLAN_PRICE = { Starter:299, Pro:599, Elite:999 };

  const S = {
    page: { display:'flex', height:'100vh', background:'#020617', color:'#e2e8f0', fontFamily:"'Inter',system-ui,sans-serif", overflow:'hidden', fontSize:14 },
    card: { background:'#0a0f1d', borderRadius:20, padding:22, border:'1px solid rgba(255,255,255,.05)' },
  };

  const earned = myReferrals.filter(r=>r.status==='active').reduce((s,r)=>{
    return s + (PLAN_PRICE[r.plan]||299) * COMMISSION;
  }, 0);

  return (
    <div style={S.page}>
      <style>{`::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(16,185,129,.3);border-radius:4px}button:focus{outline:none}`}</style>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ height:54, background:'#0a0f1d', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', padding:'0 24px', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, background:'#f59e0b', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:18, fontWeight:900, color:'#000', fontStyle:'italic' }}>T</span>
            </div>
            <div>
              <div style={{ fontSize:8, color:'#10b981', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase' }}>Affiliate Portal</div>
              <div style={{ fontSize:13, fontWeight:900, color:'#e2e8f0' }}>{user.name}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:10, color:'#f87171', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={13}/> Sign Out
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:24 }}>
          <h2 style={{ fontSize:28, fontWeight:900, fontStyle:'italic', margin:'0 0 20px', letterSpacing:'-0.02em' }}>Affiliate <span style={{ color:'#475569', fontStyle:'normal' }}>Dashboard</span></h2>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
            {[
              ['Referral Code', user.affiliateCode||'AFF-001', '#f59e0b'],
              ['Total Referrals', myReferrals.length, '#6366f1'],
              ['Active Referrals', myReferrals.filter(r=>r.status==='active').length, '#10b981'],
              ['Commission Earned', `₹${earned.toFixed(2)}`, '#8b5cf6'],
            ].map(([label,val,color])=>(
              <div key={label} style={{ ...S.card }}>
                <div style={{ fontSize:9, color:'#475569', fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:24, fontWeight:900, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Referral link */}
          <div style={{ ...S.card, marginBottom:20, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:'#f59e0b', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:4 }}>Your Referral Link</div>
              <div style={{ fontSize:13, color:'#94a3b8', fontFamily:'monospace' }}>https://nexusjustice.in/signup?ref={user.affiliateCode||'AFF-001'}</div>
            </div>
            <button style={{ padding:'9px 18px', background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', borderRadius:11, color:'#f59e0b', fontSize:11, fontWeight:900, cursor:'pointer' }}>Copy Link</button>
          </div>

          {/* Referrals table */}
          <div style={S.card}>
            <div style={{ fontSize:10, color:'#10b981', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:14 }}>Referred Advocates</div>
            {myReferrals.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:'#334155', fontSize:13 }}>No referrals yet. Share your link to earn commissions!</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                    {['Name','Email','Plan','Status','Joined','Commission'].map(h=>(
                      <th key={h} style={{ paddingBottom:10, paddingLeft:12, textAlign:'left', fontSize:9, fontWeight:900, color:'#475569', textTransform:'uppercase', letterSpacing:'0.12em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myReferrals.map(r=>(
                    <tr key={r.id} style={{ borderBottom:'1px solid rgba(255,255,255,.03)' }}>
                      <td style={{ padding:'11px 12px', fontWeight:700, fontSize:13 }}>{r.name}</td>
                      <td style={{ padding:'11px 12px', color:'#64748b', fontSize:12 }}>{r.email}</td>
                      <td style={{ padding:'11px 12px' }}><span style={{ fontSize:10, fontWeight:900, color:'#818cf8', background:'rgba(99,102,241,.1)', padding:'3px 9px', borderRadius:20 }}>{r.plan}</span></td>
                      <td style={{ padding:'11px 12px' }}><span style={{ fontSize:10, fontWeight:900, color:r.status==='active'?'#10b981':'#f59e0b' }}>{r.status==='active'?'Active':'Pending'}</span></td>
                      <td style={{ padding:'11px 12px', color:'#475569', fontSize:12 }}>{r.joinedAt}</td>
                      <td style={{ padding:'11px 12px', fontWeight:900, color:'#10b981', fontSize:13 }}>{r.status==='active'?`₹${((PLAN_PRICE[r.plan]||299)*COMMISSION).toFixed(2)}`:'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  ROOT APP — Auth Router
// ─────────────────────────────────────────────
export default function NexusApp() {
  const [screen, setScreen] = useState('signin'); // signin|signup|forgot|signup_success|portal|agency|affiliate
  const [currentUser, setCurrentUser] = useState(null);
  const [signedUpUser, setSignedUpUser] = useState(null);
  const [AdvocatePortalComp, setAdvocatePortalComp] = useState(null);

  // Lazy-load the advocate portal
  useEffect(() => {
    if (screen === 'portal') {
      import('./advocate-portal/AdvocatePortal.jsx').then(m => setAdvocatePortalComp(() => m.default)).catch(() => {});
    }
  }, [screen]);

  const handleSignIn = (user) => {
    setCurrentUser(user);
    if (user.role === 'agency') setScreen('agency');
    else if (user.role === 'affiliate') setScreen('affiliate');
    else setScreen('portal');
  };

  const handleSignUp = (user) => { setSignedUpUser(user); setScreen('signup_success'); };
  const handleLogout = () => { setCurrentUser(null); setScreen('signin'); };

  if (screen === 'signin')        return <SignIn onSignIn={handleSignIn} onGoSignUp={()=>setScreen('signup')} onGoForgot={()=>setScreen('forgot')} />;
  if (screen === 'signup')        return <SignUp onSignUp={handleSignUp} onGoSignIn={()=>setScreen('signin')} />;
  if (screen === 'signup_success') return <SignUpSuccess user={signedUpUser} onGoSignIn={()=>setScreen('signin')} />;
  if (screen === 'forgot')        return <ForgotPassword onGoSignIn={()=>setScreen('signin')} />;
  if (screen === 'agency')        return <AgencyHQPortal onLogout={handleLogout} />;
  if (screen === 'affiliate')     return <AffiliatePortal user={currentUser} onLogout={handleLogout} />;

  // Advocate Portal — inline import fallback (for single-file preview)
  if (screen === 'portal')        return <AdvocatePortalFull user={currentUser} onLogout={handleLogout} />;

  return null;
}

// ── Inline fallback that imports the real portal ──
// When used in Claude preview, embed the portal inline
function AdvocatePortalFull({ user, onLogout }) {
  // For the preview we inline the portal component.
  // The actual portal JSX is in AdvocatePortal.jsx
  return (
    <div style={{ position:'relative', height:'100vh', overflow:'hidden' }}>
      {/* Logout bar */}
      <div style={{ position:'absolute', top:0, right:0, zIndex:9999, padding:'8px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ fontSize:11, color:'#6366f1', fontWeight:700 }}>Signed in as <strong style={{ color:'#e2e8f0' }}>{user?.name}</strong></div>
        <button onClick={onLogout} style={{ padding:'5px 12px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:9, color:'#f87171', fontSize:10, fontWeight:700, cursor:'pointer' }}>Sign Out</button>
      </div>
      {/* Render the portal — it manages its own layout */}
      <AdvocatePortalInner />
    </div>
  );
}

const Icon = ({ path, size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);

const CLIENTS = [
  { slNo: 1, name: 'Sreedharan K.', phone: '+91 9876543210', courtName: 'District Court, Aluva', caseNumber: 'OS 145/2025', oppAdvocateName: 'Ramesh Menon', nextPostingDate: '2026-03-15', purposeOfPosting: 'Filing Written Statement' },
  { slNo: 2, name: 'Elena Rodriguez', phone: '+1 555-0199', courtName: 'High Court', caseNumber: 'WP(C) 204/2026', oppAdvocateName: 'Sarah Jenkins', nextPostingDate: '2026-03-20', purposeOfPosting: 'Hearing' },
  { slNo: 3, name: 'Marcus Thorne', phone: '+1 555-0188', courtName: 'Magistrate Court', caseNumber: 'CC 55/2026', oppAdvocateName: 'David Clark', nextPostingDate: '2026-04-05', purposeOfPosting: 'Evidence' },
  { slNo: 4, name: 'Sarah Jenkins', phone: '+1 555-0177', courtName: 'Family Court', caseNumber: 'OP 89/2025', oppAdvocateName: 'Priya Sharma', nextPostingDate: '2026-03-10', purposeOfPosting: 'Counseling' },
  { slNo: 5, name: 'Orbital Tech Corp', phone: '+1 555-0166', courtName: 'Commercial Court', caseNumber: 'CS 12/2026', oppAdvocateName: 'Michael Chang', nextPostingDate: '2026-04-12', purposeOfPosting: 'Framing of Issues' },
];

const VOICE_RECORDS = [
  { id: 'H01', client: 'Sreedharan K.', date: '16/02/2026', duration: '3m 4s', summary: 'Property boundary dispute in Aluva. Neighbor encroaching via new fence. Needs interim injunction.' },
  { id: 'H02', client: 'Elena Rodriguez', date: '15/02/2026', duration: '12m 15s', summary: 'IP theft consultation. Competitor launched identical product. Cease & desist draft requested.' },
  { id: 'H03', client: 'Marcus Thorne', date: '10/02/2026', duration: '8m 42s', summary: 'Real estate fraud follow-up. New evidence documents provided. Court strategy scheduled.' },
];

const NOTIFICATIONS = [
  { id: 1, message: "Welcome to Nexus Justice v3.1. Your affiliate link is ready.", date: "2026-02-27", read: false, type: 'general' },
  { id: 2, message: "John Doe (555-0192) joined under you — congratulations!", date: "2026-02-27", read: false, type: 'payment' },
];

const DEMO_AI_REPLIES = [
  "Based on the consultation history, Section 6 of the Specific Relief Act, 1963 applies — recovery of possession of immovable property. I recommend filing an interim injunction under Order XXXIX Rules 1 & 2 of CPC to restrain further encroachment. Shall I draft the petition?",
  "Under the Consumer Protection Act 2019, you may approach the District Consumer Disputes Redressal Commission for claims up to ₹1 crore. The process is straightforward — no lawyer is mandatory. Would you like guidance on documentation?",
  "For IPR infringement, Section 51 of the Copyright Act or Section 29 of the Trade Marks Act, 1999 may apply. I recommend a Cease & Desist notice first, followed by a civil suit for injunction and damages. I can draft the notice now.",
];
let demoIdx = 0;

const LAW_CATEGORIES = [
  { id: 'railway', label: 'Railway Law', color: '#f59e0b' },
  { id: 'cooperative', label: 'Cooperative Law', color: '#10b981' },
  { id: 'property', label: 'Property Law', color: '#6366f1' },
  { id: 'criminal', label: 'Criminal Law', color: '#ef4444' },
  { id: 'labour', label: 'Labour Law', color: '#8b5cf6' },
];

const getCatRgb = (color) => {
  const map = { '#f59e0b': '245,158,11', '#10b981': '16,185,129', '#6366f1': '99,102,241', '#ef4444': '239,68,68', '#8b5cf6': '139,92,246' };
  return map[color] || '99,102,241';
};

function AdvocatePortalInner() {
  const [view, setView] = useState("command");

  const [clients, setClients] = useState(CLIENTS);
  const [addingClient, setAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [supportMsgs, setSupportMsgs] = useState([{ id: 1, role: 'ai', text: 'Hello. I am the Nexus Support AI. Please describe any issues you are facing with the platform.' }]);
  const [supportInput, setSupportInput] = useState("");
  const [consoleInput, setConsoleInput] = useState("");
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  const tabBarRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const checkScroll = useCallback(() => {
    const el = tabBarRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    const el = tabBarRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => { el.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll); };
  }, [view, checkScroll]);
  const scrollTabs = (dir) => { tabBarRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' }); };

  const [kbDocs, setKbDocs] = useState([
    { id: 1, category: 'railway', name: 'Railways Act, 1989.pdf', size: '2.4 MB', date: '2026-01-12', pages: 184 },
    { id: 2, category: 'railway', name: 'Railway Claims Tribunal Rules.pdf', size: '840 KB', date: '2026-01-15', pages: 62 },
    { id: 3, category: 'cooperative', name: 'Kerala Co-operative Societies Act.pdf', size: '1.1 MB', date: '2025-11-20', pages: 96 },
    { id: 4, category: 'property', name: 'Transfer of Property Act, 1882.pdf', size: '960 KB', date: '2025-10-05', pages: 78 },
  ]);
  const [kbFilter, setKbFilter] = useState('all');
  const [kbSearch, setKbSearch] = useState('');
  const [kbUploading, setKbUploading] = useState(false);
  const [kbUploadCat, setKbUploadCat] = useState('railway');
  const [kbUploadName, setKbUploadName] = useState('');
  const [kbDragOver, setKbDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const handleKbUpload = (fileName) => {
    if (!fileName.trim()) return;
    const name = fileName.endsWith('.pdf') ? fileName : fileName + '.pdf';
    setKbDocs(d => [...d, { id: Date.now(), category: kbUploadCat, name, size: `${(Math.random() * 2 + 0.3).toFixed(1)} MB`, date: new Date().toISOString().slice(0, 10), pages: Math.floor(Math.random() * 200 + 20) }]);
    setKbUploadName(''); setKbUploading(false);
  };

  const [tempInstructions, setTempInstructions] = useState([
    { id: 1, text: 'If Raju calls, tell him to meet me tomorrow at 10 AM.', active: true, created: '2026-03-06 09:00' },
    { id: 2, text: 'If my clerk calls, tell him to bring A4 size paper.', active: true, created: '2026-03-06 10:30' },
  ]);
  const [newInstruction, setNewInstruction] = useState('');
  const [instrAiInput, setInstrAiInput] = useState('');
  const [instrAiMsgs, setInstrAiMsgs] = useState([
    { role: 'ai', text: "Hello! I have your temporary instructions loaded. I'll follow them automatically. You can also chat with me here — I'll apply your current active instructions when responding." }
  ]);
  const [instrAiLoading, setInstrAiLoading] = useState(false);
  const activeInstructions = tempInstructions.filter(i => i.active);

  const sendInstrAi = async () => {
    if (!instrAiInput.trim() || instrAiLoading) return;
    const text = instrAiInput.trim(); setInstrAiInput('');
    setInstrAiMsgs(m => [...m, { role: 'user', text }]);
    setInstrAiLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const lower = text.toLowerCase();
    let reply = '';
    const rajuInstr = tempInstructions.find(i => i.active && i.text.toLowerCase().includes('raju'));
    const clerkInstr = tempInstructions.find(i => i.active && i.text.toLowerCase().includes('clerk'));
    if (lower.includes('raju')) {
      reply = rajuInstr ? `Per your temporary instruction: "${rajuInstr.text}" — I'll inform Raju accordingly. Is there anything else you'd like me to note?` : "No active instruction found for Raju. Would you like to add one?";
    } else if (lower.includes('clerk')) {
      reply = clerkInstr ? `Per your temporary instruction: "${clerkInstr.text}" — Message noted for your clerk. Shall I add any other details?` : "No active instruction found for your clerk.";
    } else {
      reply = `I have ${activeInstructions.length} active instruction${activeInstructions.length !== 1 ? 's' : ''} loaded. ${activeInstructions.length > 0 ? "I'll apply them when relevant. " : ''}For legal queries, please use the Consult module. How else can I help?`;
    }
    setInstrAiMsgs(m => [...m, { role: 'ai', text: reply }]);
    setInstrAiLoading(false);
  };

  // ── Writing Desk state ──
  const MAX_PAGES = 20;
  const CHARS_PER_PAGE = 1800;

  const PAGE1 = `IN THE COURT OF THE DISTRICT JUDGE, ERNAKULAM\n\nO.S. No. 145 of 2025\n\nBETWEEN:\n\nSreedharan K., S/o Krishnan Nair,\nHouse No. 42, near St. George Church, Aluva,\nErnakulam District — 683 101.\n                                                    ... PLAINTIFF\n\nAND\n\nRajan P., S/o Parameswaran Nair,\nHouse No. 43, near St. George Church, Aluva,\nErnakulam District — 683 101.\n                                                    ... DEFENDANT\n\nPLAINT UNDER ORDER VII RULE 1 OF THE CODE OF CIVIL PROCEDURE, 1908`;
  const PAGE2 = `FACTS OF THE CASE:\n\n1. The Plaintiff is the absolute owner in possession of the land bearing Survey Number 101/2 of Aluva Village, measuring 10 Cents, bounded on the North by Survey No. 101/1, on the South by the public road, on the East by Survey No. 102, and on the West by Survey No. 100.\n\n2. The Plaintiff has been in continuous, uninterrupted and peaceful possession of the said property for over 30 years by virtue of a registered Sale Deed dated 15.03.1994 executed by the previous owner.\n\n3. The Defendant, without any right or authority, has illegally encroached upon the Plaintiff's property by constructing a fence along the eastern boundary, thereby reducing the Plaintiff's land area by approximately 2 Cents.\n\n4. The Plaintiff submits that the Defendant's act constitutes illegal encroachment and trespass, causing irreparable loss and damage to the Plaintiff.`;
  const PAGE3 = `CAUSE OF ACTION:\n\n5. The cause of action for this suit arose on 01.01.2026 when the Defendant commenced construction of the illegal fence, and continues to subsist till date.\n\n6. This Hon'ble Court has jurisdiction to try and decide this suit as the suit property is situated within the territorial limits of this Court, and the cause of action arose within the jurisdiction of this Court.\n\nVALUATION:\n\n7. The suit is valued at ₹1,00,000/- for the purpose of court fees and jurisdiction under the Kerala Court Fees and Suits Valuation Act, 1959.\n\nPRAYER:\n\nThe Plaintiff humbly prays that this Hon'ble Court may be pleased to:\n\n(a) Pass a decree for permanent injunction restraining the Defendant;\n(b) Direct removal of the illegal fence erected by the Defendant;\n(c) Award costs of this suit to the Plaintiff;\n(d) Grant any other relief as deemed fit.\n\n                    Sd/-\n              Advocate for Plaintiff`;

  const [draftPages, setDraftPages] = useState([PAGE1, PAGE2, PAGE3]);
  const [currentPage, setCurrentPage] = useState(1);
  const [draftSuggestions, setDraftSuggestions] = useState([
    { id: 1, type: 'add', text: 'Add valuation clause: "The suit is valued at ₹1,00,000/- for the purpose of court fees and jurisdiction."', status: 'pending', line: 'Page 3 — Valuation' },
    { id: 2, type: 'delete', text: 'Remove vague phrase "approximately 2 Cents" — use exact survey measurement from the title deed instead.', status: 'pending', line: 'Page 2 — Para 3' },
    { id: 3, type: 'add', text: 'Add interim injunction prayer under Order XXXIX Rules 1 & 2 CPC as sub-clause (d).', status: 'pending', line: 'Page 3 — Prayer' },
    { id: 4, type: 'edit', text: 'Strengthen paragraph 4 — cite Section 6 of the Specific Relief Act, 1963 for recovery of possession.', status: 'pending', line: 'Page 2 — Para 4' },
  ]);
  const [deskChatHistory, setDeskChatHistory] = useState([
    { role: 'ai', text: "Welcome to the Writing Desk. I've loaded your 3-page draft plaint for OS 145/2025 (up to 20 pages supported — ask me to add more pages anytime).\n\nI've flagged 4 suggestions. You can also:\n• Ask me to read the draft aloud\n• Use voice input to give drafting instructions\n• Navigate pages using the page bar" }
  ]);
  const [deskInput, setDeskInput] = useState('');
  const [deskLoading, setDeskLoading] = useState(false);
  const [deskView, setDeskView] = useState('split');
  const [draftEditMode, setDraftEditMode] = useState(false);
  const [modelDraftDragOver, setModelDraftDragOver] = useState(false);
  const [modelDraftName, setModelDraftName] = useState('');
  const [showModelUpload, setShowModelUpload] = useState(false);
  const [uploadedModels, setUploadedModels] = useState([
    { id: 1, name: 'Model Plaint — Property Encroachment.pdf', date: '2026-01-10' },
    { id: 2, name: 'Model Petition — Interim Injunction.pdf', date: '2026-02-03' },
  ]);
  const modelFileRef = useRef(null);
  const deskChatRef = useRef(null);
  const draftTextRef = useRef(null);

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakPageNum, setSpeakPageNum] = useState(null);
  const speechSynthRef = useRef(null);

  // Voice input state
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => { deskChatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }); }, [deskChatHistory]);

  // ── TTS: Read page aloud ──
  const readPageAloud = (pageIdx) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = draftPages[pageIdx] || '';
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.92; utt.pitch = 1; utt.lang = 'en-IN';
    utt.onstart = () => { setIsSpeaking(true); setSpeakPageNum(pageIdx + 1); };
    utt.onend = () => { setIsSpeaking(false); setSpeakPageNum(null); };
    utt.onerror = () => { setIsSpeaking(false); setSpeakPageNum(null); };
    speechSynthRef.current = utt;
    window.speechSynthesis.speak(utt);
  };
  const stopSpeaking = () => { window.speechSynthesis?.cancel(); setIsSpeaking(false); setSpeakPageNum(null); };

  // ── Voice input ──
  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setDeskInput(d => d + '[Voice not supported in this browser]'); return; }
    const rec = new SR();
    rec.lang = 'en-IN'; rec.continuous = false; rec.interimResults = true;
    rec.onstart = () => setVoiceListening(true);
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setVoiceTranscript(t);
      if (e.results[e.results.length - 1].isFinal) setDeskInput(d => (d + ' ' + t).trim());
    };
    rec.onend = () => { setVoiceListening(false); setVoiceTranscript(''); };
    rec.onerror = () => { setVoiceListening(false); setVoiceTranscript(''); };
    recognitionRef.current = rec;
    rec.start();
  };
  const stopVoiceInput = () => { recognitionRef.current?.stop(); setVoiceListening(false); setVoiceTranscript(''); };

  // ── Page management ──
  const addNewPage = () => {
    if (draftPages.length >= MAX_PAGES) return;
    setDraftPages(p => [...p, `PAGE ${p.length + 1}\n\n[Continue drafting here…]`]);
    setCurrentPage(draftPages.length + 1);
  };
  const updatePage = (idx, val) => setDraftPages(p => p.map((pg, i) => i === idx ? val : pg));
  const deletePage = (idx) => {
    if (draftPages.length <= 1) return;
    setDraftPages(p => p.filter((_, i) => i !== idx));
    setCurrentPage(c => Math.min(c, draftPages.length - 1));
  };

  const DESK_AI_REPLIES = [
    (q) => {
      const l = q.toLowerCase();
      if (l.includes('read') || l.includes('aloud') || l.includes('speak')) {
        const pgMatch = l.match(/page\s*(\d+)/);
        const pg = pgMatch ? parseInt(pgMatch[1]) - 1 : currentPage - 1;
        setTimeout(() => readPageAloud(pg), 300);
        return `Reading Page ${pg + 1} aloud now. Click the stop button or say "stop" to pause.`;
      }
      if (l.includes('stop') || l.includes('pause')) { stopSpeaking(); return "Reading stopped."; }
      if (l.includes('add page') || l.includes('new page')) {
        if (draftPages.length >= MAX_PAGES) return `You've reached the 20-page limit. To continue, please start a new draft session.`;
        setTimeout(addNewPage, 300);
        return `Added Page ${draftPages.length + 1}. You can now draft the next section there.`;
      }
      if (l.includes('valuation')) return "Add this to Page 3 after paragraph 7:\n\n\"The suit is valued at ₹1,00,000/- for court fees under the Kerala Court Fees and Suits Valuation Act, 1959. Court fee stamp of ₹[amount] has been affixed.\"\n\nShall I insert this directly?";
      if (l.includes('injunction')) return "For interim injunction (Order XXXIX Rules 1 & 2 CPC), establish:\n\n1. Prima facie case\n2. Balance of convenience favours plaintiff\n3. Irreparable injury if not granted\n\nI recommend a separate I.A. petition. Want me to draft Page 4 as the IA?";
      if (l.includes('prayer') || l.includes('relief')) return "Strengthen the prayer on Page 3 by adding:\n\n(d) Grant ad-interim ex-parte injunction pending disposal;\n(e) Award exemplary damages of ₹50,000/-;\n(f) Grant any other relief as deemed fit.\n\nAccept this update?";
      return `I've reviewed Page ${currentPage} of ${draftPages.length}. Key observations:\n\n• Cause of action is clearly stated\n• Consider adding verification clause on final page\n• Section 6, Specific Relief Act applies to para 4\n\nWhat section would you like me to strengthen?`;
    }
  ];

  const sendDeskChat = async (overrideText) => {
    const text = (overrideText || deskInput).trim();
    if (!text || deskLoading) return;
    setDeskInput('');
    setDeskChatHistory(h => [...h, { role: 'user', text }]);
    setDeskLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const reply = DESK_AI_REPLIES[0](text);
    setDeskChatHistory(h => [...h, { role: 'ai', text: reply }]);
    if (!text.toLowerCase().includes('read') && !text.toLowerCase().includes('stop') && !text.toLowerCase().includes('add page')) {
      setDraftSuggestions(s => [...s, {
        id: Date.now(), type: 'edit',
        text: `AI response to: "${text.slice(0, 55)}${text.length > 55 ? '…' : ''}"`,
        status: 'pending', line: `Page ${currentPage}`
      }]);
    }
    setDeskLoading(false);
  };

  const applySuggestion = (id) => setDraftSuggestions(s => s.map(x => x.id === id ? { ...x, status: 'accepted' } : x));
  const rejectSuggestion = (id) => setDraftSuggestions(s => s.map(x => x.id === id ? { ...x, status: 'rejected' } : x));

  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState('idle');
  const canvasRef = useRef(null);
  const scanTimer = useRef(null);
  const chatRef = useRef(null);
  const supportRef = useRef(null);
  const instrAiRef = useRef(null);

  useEffect(() => { chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }); }, [chatHistory]);
  useEffect(() => { supportRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }); }, [supportMsgs]);
  useEffect(() => { instrAiRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }); }, [instrAiMsgs]);

  const drawFakeDoc = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    c.width = 420; c.height = 320;
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, 420, 320);
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20;
    ctx.fillStyle = '#f8f6f0'; ctx.beginPath(); ctx.roundRect(60, 30, 300, 260, 4); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#e8e4dc'; ctx.lineWidth = 0.5;
    for (let y = 70; y < 270; y += 16) { ctx.beginPath(); ctx.moveTo(75, y); ctx.lineTo(345, y); ctx.stroke(); }
    ctx.fillStyle = '#1e293b'; ctx.fillRect(60, 30, 300, 22);
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px monospace'; ctx.fillText('LEGAL DOCUMENT — CONFIDENTIAL', 75, 45);
    [{ y: 72, w: 240, b: true }, { y: 88, w: 180 }, { y: 104, w: 260 }, { y: 136, w: 280 }, { y: 152, w: 255 }, { y: 168, w: 270 }, { y: 200, w: 290 }, { y: 216, w: 265 }, { y: 232, w: 240 }, { y: 248, w: 280 }, { y: 264, w: 160 }].forEach(l => {
      if (!l.w) return;
      ctx.fillStyle = l.b ? '#1e293b' : '#374151'; ctx.fillRect(75, l.y - 10, l.w, l.b ? 8 : 6);
      if (!l.b) { ctx.fillStyle = '#f8f6f0'; for (let x = 75; x < 75 + l.w; x += Math.random() * 18 + 8) ctx.fillRect(x, l.y - 10, 3, 6); }
    });
    ctx.strokeStyle = 'rgba(220,38,38,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(310, 240, 40, 24, -0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(220,38,38,0.35)'; ctx.font = 'bold 7px sans-serif';
    ctx.fillText('COURT', 292, 236); ctx.fillText('CERTIFIED', 289, 246);
    const vg = ctx.createRadialGradient(210, 160, 80, 210, 160, 220);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, 420, 320);
  };

  const startScan = () => { setScanPhase('live'); setScanProgress(0); setTimeout(drawFakeDoc, 80); };
  const captureScan = () => {
    setScanPhase('processing'); setScanProgress(0); let p = 0;
    scanTimer.current = setInterval(() => {
      p += Math.random() * 9 + 3;
      if (p >= 100) { p = 100; clearInterval(scanTimer.current); setTimeout(() => setScanPhase('done'), 400); }
      setScanProgress(Math.min(Math.round(p), 100));
    }, 110);
  };
  const stopScan = () => { clearInterval(scanTimer.current); setScanPhase('idle'); setScanProgress(0); };

  const sendConsult = async () => {
    if (!consoleInput.trim() || consoleLoading) return;
    const text = consoleInput.trim(); setConsoleInput('');
    setChatHistory(h => [...h, { role: 'user', text, id: Date.now() }]);
    setConsoleLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setChatHistory(h => [...h, { role: 'ai', text: DEMO_AI_REPLIES[demoIdx++ % DEMO_AI_REPLIES.length], id: Date.now() }]);
    setConsoleLoading(false);
  };

  const sendSupport = async () => {
    if (!supportInput.trim() || supportLoading) return;
    const text = supportInput.trim(); setSupportInput('');
    setSupportMsgs(m => [...m, { id: Date.now(), role: 'user', text }]);
    setSupportLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setSupportMsgs(m => [...m, { id: Date.now() + 1, role: 'ai', text: "I've reviewed your report. This appears to be a session sync issue. Please try clearing your browser cache and refreshing. If it persists, I'll escalate to the admin team within 24 hours." }]);
    setSupportLoading(false);
  };

  const unread = notifications.filter(n => !n.read).length;

  const sideNav = [
    { id: 'command', label: 'Command', icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
    { id: 'feed', label: 'Feed', icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
    { id: 'consult', label: 'Consult', icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" },
    { id: 'clients', label: 'Clients', icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: 'knowledge-base', label: 'Knowledge', icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { id: 'temp-instructions', label: 'Instructions', icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    { id: 'notifications', label: 'Notif.', icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
    { id: 'support', label: 'Support', icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: 'reading-room', label: 'Read', icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: 'doc-converter', label: 'Convert', icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
    { id: 'writing-desk', label: 'Writing', icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
  ];

  const S = {
    page: { display: 'flex', height: '100vh', background: '#020617', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', fontSize: 14 },
    sidebar: { width: 72, background: '#070b14', borderRight: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 8, flexShrink: 0, overflowY: 'auto' },
    sideBtn: (active) => ({ width: 44, height: 44, borderRadius: 12, background: active ? 'rgba(245,158,11,.1)' : 'transparent', border: active ? '1px solid rgba(245,158,11,.25)' : '1px solid transparent', color: active ? '#f59e0b' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all .2s', flexShrink: 0 }),
    header: { height: 56, background: '#0a0f1d', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 },
    card: { background: '#0a0f1d', borderRadius: 24, padding: 28, border: '1px solid rgba(255,255,255,.05)' },
  };

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse2{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes scanLine{0%,100%{top:0%}50%{top:95%}}
        @keyframes waveBar{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}
        .fade-up{animation:fadeUp .35s ease forwards}
        .spin{animation:spin 1s linear infinite}
        .pulse-a{animation:pulse2 2s ease-in-out infinite}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(99,102,241,.4);border-radius:4px}
        input,textarea,select{color:#e2e8f0;outline:none}
        input::placeholder,textarea::placeholder{color:#475569}
        .tab-scroll::-webkit-scrollbar{display:none}
        button:focus{outline:none}
        .kb-drop{border:2px dashed rgba(99,102,241,.3);border-radius:20px;transition:all .2s}
        .kb-drop.over{border-color:#6366f1;background:rgba(99,102,241,.05)}
        .instr-card{transition:all .2s}
        .instr-card:hover{border-color:rgba(245,158,11,.2)!important}
        .tab-arrow-btn{width:28px;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(7,11,20,0.95);border:none;cursor:pointer;flex-shrink:0;transition:all .15s}
        .tab-arrow-btn:hover{background:#0a0f1d}
        .tab-arrow-btn:disabled{opacity:0.2;cursor:default}
        .suggestion-card{transition:all .25s;cursor:default}
        .suggestion-card:hover{transform:translateY(-1px)}
        .draft-textarea{font-family:'Courier New',monospace;line-height:1.9;resize:none;width:100%;height:100%;background:transparent;border:none;color:#cbd5e1;font-size:12.5px;padding:0;box-sizing:border-box}
        .draft-textarea:focus{outline:none}
        .model-drop{border:2px dashed rgba(245,158,11,.25);border-radius:16px;transition:all .2s;cursor:pointer}
        .model-drop:hover,.model-drop.over{border-color:#f59e0b;background:rgba(245,158,11,.04)}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
      `}</style>

      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={{ width: 44, height: 44, background: '#f59e0b', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 12, boxShadow: '0 4px 20px rgba(245,158,11,.3)', flexShrink: 0 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#000', fontStyle: 'italic' }}>T</span>
        </div>
        {sideNav.map(item => (
          <button key={item.id} onClick={() => setView(item.id)} title={item.label} style={S.sideBtn(view === item.id)}>
            <Icon path={item.icon} size={18} />
            {view === item.id && <div style={{ position: 'absolute', left: 0, width: 3, height: 22, background: '#f59e0b', borderRadius: '0 3px 3px 0' }} />}
            {item.id === 'notifications' && unread > 0 && <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />}
            {item.id === 'temp-instructions' && activeInstructions.length > 0 && (
              <div style={{ position: 'absolute', top: 4, right: 4, background: '#f59e0b', color: '#000', borderRadius: 10, fontSize: 8, fontWeight: 900, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeInstructions.length}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {activeInstructions.length > 0 && (
              <button onClick={() => setView('temp-instructions')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 20, cursor: 'pointer' }}>
                <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={12} strokeWidth={2} />
                <span style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{activeInstructions.length} Active Instr.</span>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Nexus Justice <span style={{ color: '#6366f1' }}>v3.1</span></span>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.1)' }} />
            <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,.05)', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pulse-a" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: '#6366f1', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Ready</span>
            </div>
          </div>
        </header>

        {/* Tab bar */}
        <div style={{ background: '#070b14', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0, display: 'flex', alignItems: 'center', position: 'relative' }}>
          <button className="tab-arrow-btn" disabled={!canScrollLeft} onClick={() => scrollTabs(-1)} style={{ color: canScrollLeft ? '#94a3b8' : '#1e293b', borderRight: '1px solid rgba(255,255,255,.05)', zIndex: 2 }}>
            <Icon path="M15 19l-7-7 7-7" size={14} strokeWidth={2.5} />
          </button>
          <div ref={tabBarRef} className="tab-scroll" style={{ flex: 1, display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 4px' }}>
            {sideNav.map(item => (
              <button key={item.id} onClick={() => setView(item.id)}
                style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: view === item.id ? '2px solid #6366f1' : '2px solid transparent', color: view === item.id ? '#6366f1' : '#475569', fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color .2s', flexShrink: 0, position: 'relative' }}>
                {item.label}
                {item.id === 'notifications' && unread > 0 && <span style={{ position: 'absolute', top: 8, right: 6, width: 5, height: 5, borderRadius: '50%', background: '#ef4444' }} />}
                {item.id === 'temp-instructions' && activeInstructions.length > 0 && <span style={{ position: 'absolute', top: 6, right: 4, background: '#f59e0b', color: '#000', borderRadius: 8, fontSize: 8, fontWeight: 900, padding: '1px 4px' }}>{activeInstructions.length}</span>}
              </button>
            ))}
          </div>
          <button className="tab-arrow-btn" disabled={!canScrollRight} onClick={() => scrollTabs(1)} style={{ color: canScrollRight ? '#94a3b8' : '#1e293b', borderLeft: '1px solid rgba(255,255,255,.05)', zIndex: 2 }}>
            <Icon path="M9 5l7 7-7 7" size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#020617' }}>

          {/* COMMAND */}
          {view === 'command' && (
            <div style={{ height: '100%', display: 'flex', gap: 24, padding: 24, overflow: 'hidden' }}>
              <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
                <div style={S.card}>
                  <div style={{ color: '#f59e0b', fontSize: 9, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 6 }}>Voice Node Alpha</div>
                  <h3 style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', marginBottom: 16 }}>Command<span style={{ color: '#475569' }}>Center</span></h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40, marginBottom: 16 }}>
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} style={{ flex: 1, borderRadius: 2, background: `rgba(245,158,11,${0.2 + Math.random() * 0.6})`, height: `${20 + Math.random() * 70}%`, animation: `waveBar ${0.4 + Math.random() * 0.5}s ease-in-out infinite alternate`, animationDelay: `${i * 0.06}s` }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button style={{ flex: 1, padding: '9px 0', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 10, color: '#f59e0b', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>● REC</button>
                    <button style={{ flex: 1, padding: '9px 0', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, color: '#64748b', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>■ STOP</button>
                  </div>
                  <div style={{ fontSize: 9, color: '#334155', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Next: Sreedharan K. — 2:30 PM</div>
                </div>
                <div style={{ ...S.card, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 9, color: '#475569', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Voice History</div>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {VOICE_RECORDS.map(r => (
                      <div key={r.id} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{r.client}</span>
                          <span style={{ fontSize: 10, color: '#475569' }}>{r.duration}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{r.summary}</div>
                        <div style={{ fontSize: 9, color: '#334155', marginTop: 4, fontWeight: 700 }}>{r.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
                <div style={{ ...S.card, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>Nexus AI Legal Engine</div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', marginBottom: 14 }}>Consultation<span style={{ color: '#475569', fontStyle: 'normal' }}> Console</span></h3>
                  <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                    {chatHistory.length === 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: .4 }}>
                        <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={40} strokeWidth={1.5} />
                        <p style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>Begin legal consultation</p>
                      </div>
                    )}
                    {chatHistory.map(msg => (
                      <div key={msg.id} className="fade-up" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '80%', padding: '11px 15px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.role === 'user' ? 'rgba(99,102,241,.15)' : 'rgba(255,255,255,.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,.25)' : 'rgba(255,255,255,.06)'}`, fontSize: 13, lineHeight: 1.6, color: msg.role === 'user' ? '#c7d2fe' : '#cbd5e1' }}>{msg.text}</div>
                      </div>
                    ))}
                    {consoleLoading && <div style={{ display: 'flex', gap: 5, padding: '11px 15px', width: 'fit-content', background: 'rgba(255,255,255,.04)', borderRadius: '18px 18px 18px 4px' }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569', animation: 'pulse2 1.2s infinite', animationDelay: `${i * 0.2}s` }} />)}
                    </div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={consoleInput} onChange={e => setConsoleInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendConsult(); }} placeholder="Ask about case strategy, legal sections…" style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '11px 15px', fontSize: 13 }} />
                    <button onClick={sendConsult} style={{ padding: '11px 20px', background: '#6366f1', border: 'none', borderRadius: 12, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Send</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FEED */}
          {view === 'feed' && (
            <div style={{ height: '100%', overflowY: 'auto', padding: 24, display: 'flex', gap: 20 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={S.card}>
                  <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16 }}>Upcoming Hearings</div>
                  {clients.slice(0, 3).map(c => (
                    <div key={c.slNo} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>{c.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#475569' }}>{c.caseNumber} · {c.courtName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>{c.nextPostingDate}</div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{c.purposeOfPosting}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={{ fontSize: 9, color: '#10b981', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16 }}>Recent Consultations</div>
                  {VOICE_RECORDS.map(r => (
                    <div key={r.id} style={{ padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{r.client}</span>
                        <span style={{ fontSize: 10, color: '#475569' }}>{r.date} · {r.duration}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{r.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={S.card}>
                  <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12 }}>Quick Stats</div>
                  {[['Active Cases', clients.length, '#6366f1'], ['Upcoming (7d)', 2, '#f59e0b'], ['AI Consultations', 12, '#10b981'], ['KB Documents', kbDocs.length, '#8b5cf6']].map(([label, val, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CONSULT */}
          {view === 'consult' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, overflow: 'hidden' }}>
              {activeInstructions.length > 0 && (
                <div style={{ background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 12, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={14} strokeWidth={2} />
                  <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{activeInstructions.length} temporary instruction{activeInstructions.length > 1 ? 's' : ''} active — AI will follow them automatically.</span>
                </div>
              )}
              <div style={{ ...S.card, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>Nexus AI Legal Engine</div>
                    <h3 style={{ fontSize: 26, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', margin: 0 }}>Legal<span style={{ color: '#475569', fontStyle: 'normal' }}> Consultant</span></h3>
                  </div>
                  <div style={{ padding: '6px 12px', background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 20, fontSize: 10, color: '#818cf8', fontWeight: 700 }}>IPC · CPC · Evidence Act</div>
                </div>
                <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {chatHistory.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, textAlign: 'center' }}>
                      <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                        <Icon path="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" size={32} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Ask anything legal</p>
                        <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>I'll use your knowledge base and active instructions.</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {['Draft interim injunction', 'Find relevant IPC sections', 'Explain CPC Order XXXIX'].map(s => (
                          <button key={s} onClick={() => setConsoleInput(s)} style={{ padding: '7px 14px', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 20, color: '#818cf8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatHistory.map(msg => (
                    <div key={msg.id} className="fade-up" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '78%', padding: '13px 17px', borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: msg.role === 'user' ? 'rgba(99,102,241,.15)' : 'rgba(255,255,255,.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.07)'}`, fontSize: 13, lineHeight: 1.7, color: msg.role === 'user' ? '#c7d2fe' : '#cbd5e1' }}>{msg.text}</div>
                    </div>
                  ))}
                  {consoleLoading && <div style={{ display: 'flex', gap: 6, padding: '13px 17px', width: 'fit-content', background: 'rgba(255,255,255,.04)', borderRadius: '20px 20px 20px 4px' }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#475569', animation: 'pulse2 1.2s infinite', animationDelay: `${i * 0.2}s` }} />)}
                  </div>}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={consoleInput} onChange={e => setConsoleInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendConsult(); }} placeholder="Ask about case strategy, legal sections, petition drafts…" style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '13px 18px', fontSize: 13 }} />
                  <button onClick={sendConsult} style={{ padding: '13px 22px', background: '#6366f1', border: 'none', borderRadius: 14, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Send</button>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTS */}
          {view === 'clients' && (
            <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>Case Management</div>
                  <h2 style={{ fontSize: 32, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', margin: 0 }}>Client<span style={{ color: '#475569', fontStyle: 'normal' }}> Registry</span></h2>
                </div>
                <button onClick={() => setAddingClient(true)} style={{ padding: '11px 22px', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 14, color: '#f59e0b', fontSize: 11, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>+ Add Client</button>
              </div>
              {addingClient && (
                <div style={{ ...S.card, marginBottom: 18 }} className="fade-up">
                  <div style={{ fontSize: 9, color: '#10b981', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 14 }}>New Client</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    {[['name', 'Client Name'], ['phone', 'Phone'], ['caseNumber', 'Case No.'], ['courtName', 'Court'], ['oppAdvocateName', 'Opp. Advocate'], ['nextPostingDate', 'Next Date'], ['purposeOfPosting', 'Purpose']].map(([field, label]) => (
                      <input key={field} placeholder={label} value={newClient[field] || ''} onChange={e => setNewClient(p => ({ ...p, [field]: e.target.value }))}
                        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '9px 13px', fontSize: 12, gridColumn: ['purposeOfPosting', 'courtName'].includes(field) ? 'span 2' : 'auto' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { if (newClient.name) { setClients(c => [...c, { ...newClient, slNo: c.length + 1 }]); setNewClient({}); setAddingClient(false); } }} style={{ padding: '9px 22px', background: '#10b981', border: 'none', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => { setAddingClient(false); setNewClient({}); }} style={{ padding: '9px 22px', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#94a3b8', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
              <div style={{ ...S.card, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                      {['#', 'Client', 'Phone', 'Court', 'Case No.', 'Next Date', 'Purpose', 'Action'].map(h => (
                        <th key={h} style={{ paddingBottom: 11, paddingLeft: 13, textAlign: 'left', fontSize: 9, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.slNo} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                        <td style={{ padding: '13px', color: '#334155', fontSize: 12, fontWeight: 700 }}>{c.slNo}</td>
                        <td style={{ padding: '13px' }}><div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div></td>
                        <td style={{ padding: '13px', color: '#64748b', fontSize: 12 }}>{c.phone}</td>
                        <td style={{ padding: '13px', color: '#64748b', fontSize: 12 }}>{c.courtName}</td>
                        <td style={{ padding: '13px' }}><span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,.1)', padding: '3px 10px', borderRadius: 6 }}>{c.caseNumber}</span></td>
                        <td style={{ padding: '13px', color: '#10b981', fontSize: 12, fontWeight: 700 }}>{c.nextPostingDate}</td>
                        <td style={{ padding: '13px', color: '#64748b', fontSize: 12 }}>{c.purposeOfPosting}</td>
                        <td style={{ padding: '13px' }}><button onClick={() => setClients(cl => cl.filter(x => x.slNo !== c.slNo))} style={{ padding: '4px 12px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 7, color: '#f87171', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KNOWLEDGE BASE */}
          {view === 'knowledge-base' && (
            <div style={{ height: '100%', overflowY: 'auto', padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>Local Knowledge Engine</div>
                  <h2 style={{ fontSize: 36, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', margin: 0 }}>Law <span style={{ color: '#475569', fontStyle: 'normal' }}>Knowledge Base</span></h2>
                  <p style={{ fontSize: 12, color: '#475569', marginTop: 6, marginBottom: 0 }}>Upload your specialist law documents — AI will reference them during consultations.</p>
                </div>
                <button onClick={() => setKbUploading(true)} style={{ padding: '12px 22px', background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.3)', borderRadius: 14, color: '#a78bfa', fontSize: 11, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon path="M12 4v16m8-8H4" size={14} strokeWidth={2.5} /> Upload Law
                </button>
              </div>
              {kbUploading && (
                <div style={{ ...S.card, marginBottom: 20, border: '1px solid rgba(139,92,246,.25)' }} className="fade-up">
                  <div style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 14 }}>Add Law Document</div>
                  <div className={`kb-drop${kbDragOver ? ' over' : ''}`} onDragOver={e => { e.preventDefault(); setKbDragOver(true); }} onDragLeave={() => setKbDragOver(false)} onDrop={e => { e.preventDefault(); setKbDragOver(false); const f = e.dataTransfer.files[0]; if (f) setKbUploadName(f.name.replace(/\.pdf$/i, '')); }} style={{ padding: '28px 20px', textAlign: 'center', marginBottom: 16, cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) setKbUploadName(f.name.replace(/\.pdf$/i, '')); }} />
                    <Icon path="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={32} strokeWidth={1.5} />
                    <p style={{ color: '#6366f1', fontSize: 13, fontWeight: 700, margin: '8px 0 4px' }}>Drag & drop PDF here</p>
                    <p style={{ color: '#334155', fontSize: 11, margin: 0 }}>or click to browse</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <input placeholder="Document name" value={kbUploadName} onChange={e => setKbUploadName(e.target.value)} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '10px 14px', fontSize: 12, gridColumn: 'span 2' }} />
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: 9, color: '#475569', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>Law Category</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {LAW_CATEGORIES.map(cat => (
                          <button key={cat.id} onClick={() => setKbUploadCat(cat.id)} style={{ padding: '6px 14px', borderRadius: 20, background: kbUploadCat === cat.id ? `rgba(${getCatRgb(cat.color)},.15)` : 'rgba(255,255,255,.04)', border: `1px solid ${kbUploadCat === cat.id ? cat.color + '40' : 'rgba(255,255,255,.08)'}`, color: kbUploadCat === cat.id ? cat.color : '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{cat.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleKbUpload(kbUploadName)} disabled={!kbUploadName.trim()} style={{ padding: '10px 24px', background: kbUploadName.trim() ? '#8b5cf6' : 'rgba(139,92,246,.3)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 900, cursor: kbUploadName.trim() ? 'pointer' : 'default' }}>Add to Knowledge Base</button>
                    <button onClick={() => { setKbUploading(false); setKbUploadName(''); }} style={{ padding: '10px 22px', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#94a3b8', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button onClick={() => setKbFilter('all')} style={{ padding: '6px 16px', borderRadius: 20, background: kbFilter === 'all' ? 'rgba(255,255,255,.1)' : 'transparent', border: `1px solid ${kbFilter === 'all' ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.07)'}`, color: kbFilter === 'all' ? '#e2e8f0' : '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>All ({kbDocs.length})</button>
                {LAW_CATEGORIES.map(cat => {
                  const count = kbDocs.filter(d => d.category === cat.id).length;
                  if (count === 0) return null;
                  return <button key={cat.id} onClick={() => setKbFilter(cat.id)} style={{ padding: '6px 16px', borderRadius: 20, background: kbFilter === cat.id ? `rgba(${getCatRgb(cat.color)},.15)` : 'transparent', border: `1px solid ${kbFilter === cat.id ? cat.color + '40' : 'rgba(255,255,255,.07)'}`, color: kbFilter === cat.id ? cat.color : '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{cat.label} ({count})</button>;
                })}
              </div>
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input value={kbSearch} onChange={e => setKbSearch(e.target.value)} placeholder="Search documents…" style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '11px 14px 11px 40px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {kbDocs.filter(d => (kbFilter === 'all' || d.category === kbFilter) && (!kbSearch || d.name.toLowerCase().includes(kbSearch.toLowerCase()))).map(doc => {
                  const cat = LAW_CATEGORIES.find(c => c.id === doc.category) || LAW_CATEGORIES[0];
                  return (
                    <div key={doc.id} style={{ background: '#0a0f1d', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', gap: 14, transition: 'all .2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + '30'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.05)'; e.currentTarget.style.transform = 'none'; }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(${getCatRgb(cat.color)},.1)`, border: `1px solid ${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color, flexShrink: 0 }}>
                          <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={22} strokeWidth={1.5} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                          <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: cat.color, background: `rgba(${getCatRgb(cat.color)},.1)`, padding: '2px 8px', borderRadius: 20 }}>{cat.label}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        {[['Pages', doc.pages], ['Size', doc.size], ['Added', doc.date]].map(([l, v]) => (
                          <div key={l}>
                            <div style={{ fontSize: 9, color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{l}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 9, color: '#64748b', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Preview</button>
                        <button style={{ flex: 1, padding: '8px 0', background: `rgba(${getCatRgb(cat.color)},.08)`, border: `1px solid ${cat.color}20`, borderRadius: 9, color: cat.color, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Use in AI</button>
                        <button onClick={() => setKbDocs(d => d.filter(x => x.id !== doc.id))} style={{ padding: '8px 12px', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 9, color: '#f87171', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TEMP INSTRUCTIONS */}
          {view === 'temp-instructions' && (
            <div style={{ height: '100%', display: 'flex', gap: 20, padding: 24, overflow: 'hidden' }}>
              <div style={{ width: 420, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0, overflow: 'hidden' }}>
                <div>
                  <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>Contextual AI Memory</div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', margin: 0 }}>Temp <span style={{ color: '#475569', fontStyle: 'normal' }}>Instructions</span></h2>
                  <p style={{ fontSize: 12, color: '#475569', marginTop: 6, marginBottom: 0 }}>Tell the AI what to say or do when specific people call or situations arise.</p>
                </div>
                <div style={{ ...S.card, border: '1px solid rgba(245,158,11,.15)' }}>
                  <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12 }}>+ New Instruction</div>
                  <textarea value={newInstruction} onChange={e => setNewInstruction(e.target.value)} placeholder={`Examples:\n"If Raju calls, tell him to meet me tomorrow"\n"If my clerk calls, ask him to bring A4 paper"`} rows={4} style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '12px 14px', fontSize: 12, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />
                  <button onClick={() => { if (!newInstruction.trim()) return; setTempInstructions(t => [...t, { id: Date.now(), text: newInstruction.trim(), active: true, created: new Date().toLocaleString() }]); setNewInstruction(''); }} disabled={!newInstruction.trim()} style={{ width: '100%', padding: '11px 0', background: newInstruction.trim() ? '#f59e0b' : 'rgba(245,158,11,.15)', border: 'none', borderRadius: 12, color: newInstruction.trim() ? '#000' : '#64748b', fontSize: 11, fontWeight: 900, cursor: newInstruction.trim() ? 'pointer' : 'default', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Save Instruction</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tempInstructions.map(instr => (
                    <div key={instr.id} className="instr-card fade-up" style={{ background: '#0a0f1d', borderRadius: 16, padding: '16px 18px', border: `1px solid ${instr.active ? 'rgba(245,158,11,.15)' : 'rgba(255,255,255,.04)'}`, opacity: instr.active ? 1 : 0.5 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6, color: instr.active ? '#e2e8f0' : '#64748b' }}>{instr.text}</p>
                          <div style={{ fontSize: 9, color: '#334155', fontWeight: 700, letterSpacing: '0.1em' }}>Added {instr.created}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => setTempInstructions(t => t.map(x => x.id === instr.id ? { ...x, active: !x.active } : x))} style={{ width: 44, height: 24, borderRadius: 12, background: instr.active ? '#10b981' : 'rgba(255,255,255,.08)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all .2s', flexShrink: 0 }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: instr.active ? 22 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.4)' }} />
                          </button>
                          <span style={{ fontSize: 9, fontWeight: 900, color: instr.active ? '#10b981' : '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{instr.active ? 'Active' : 'Paused'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.04)' }}>
                        <button onClick={() => setTempInstructions(t => t.filter(x => x.id !== instr.id))} style={{ padding: '6px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 8, color: '#f87171', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: instr.active ? '#10b981' : '#475569' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: instr.active ? '#10b981' : '#475569', display: 'inline-block' }} />
                          {instr.active ? 'AI will follow this' : 'Not currently active'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ ...S.card, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(99,102,241,.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>
                      <Icon path="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' }}>Instruction-Aware AI</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Test your instructions live</div>
                    </div>
                    {activeInstructions.length > 0 && <div style={{ marginLeft: 'auto', padding: '4px 12px', background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.15)', borderRadius: 20, fontSize: 9, color: '#10b981', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{activeInstructions.length} active</div>}
                  </div>
                  {activeInstructions.length > 0 && (
                    <div style={{ background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.1)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, flexShrink: 0 }}>
                      <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>AI Currently Knows:</div>
                      {activeInstructions.map(i => (
                        <div key={i.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                          <span style={{ color: '#f59e0b', fontSize: 11, flexShrink: 0, marginTop: 1 }}>→</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{i.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div ref={instrAiRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                    {instrAiMsgs.map((msg, idx) => (
                      <div key={idx} className="fade-up" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                        {msg.role === 'ai' && <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 9, fontWeight: 900, flexShrink: 0 }}>AI</div>}
                        <div style={{ maxWidth: '80%', padding: '11px 15px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px', background: msg.role === 'user' ? 'rgba(99,102,241,.14)' : 'rgba(255,255,255,.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,.25)' : 'rgba(255,255,255,.06)'}`, fontSize: 13, lineHeight: 1.6, color: msg.role === 'user' ? '#c7d2fe' : '#cbd5e1' }}>{msg.text}</div>
                      </div>
                    ))}
                    {instrAiLoading && <div style={{ display: 'flex', gap: 5, padding: '11px 15px', width: 'fit-content', background: 'rgba(255,255,255,.04)', borderRadius: '4px 18px 18px 18px' }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569', animation: 'pulse2 1.2s infinite', animationDelay: `${i * 0.2}s` }} />)}
                    </div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={instrAiInput} onChange={e => setInstrAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendInstrAi(); }} placeholder={`Try: "Raju is calling" or "My clerk called"…`} style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '11px 15px', fontSize: 13 }} />
                    <button onClick={sendInstrAi} style={{ padding: '11px 20px', background: '#6366f1', border: 'none', borderRadius: 12, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Send</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {view === 'notifications' && (
            <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>Updates & Alerts</div>
                <h2 style={{ fontSize: 32, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', margin: 0 }}>Notifications</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.map(n => (
                  <div key={n.id} className="fade-up" style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, borderColor: n.read ? 'rgba(255,255,255,.05)' : 'rgba(99,102,241,.2)' }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: n.read ? '#334155' : n.type === 'payment' ? '#10b981' : '#6366f1', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: n.read ? 400 : 600, color: n.read ? '#64748b' : '#e2e8f0' }}>{n.message}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 10, color: '#334155' }}>{n.date}</p>
                    </div>
                    {!n.read && <button onClick={() => setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{ padding: '5px 13px', background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 9, color: '#818cf8', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Mark Read</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUPPORT */}
          {view === 'support' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, paddingBottom: 100, overflow: 'hidden' }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>Nexus Support System</div>
                <h2 style={{ fontSize: 26, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', margin: 0 }}>Help<span style={{ color: '#475569', fontStyle: 'normal' }}> Desk</span></h2>
              </div>
              <div ref={supportRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {supportMsgs.map((msg, idx) => (
                  <div key={idx} className="fade-up" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
                    {msg.role === 'ai' && <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: 10, fontWeight: 900, flexShrink: 0 }}>AI</div>}
                    <div style={{ maxWidth: '76%', padding: '11px 15px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px', background: msg.role === 'user' ? 'rgba(99,102,241,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.06)'}`, fontSize: 13, lineHeight: 1.6, color: '#cbd5e1' }}>{msg.text}</div>
                  </div>
                ))}
                {supportLoading && <div style={{ display: 'flex', gap: 5, padding: '11px 15px', width: 'fit-content', background: 'rgba(255,255,255,.04)', borderRadius: '4px 18px 18px 18px' }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569', animation: 'pulse2 1.2s infinite', animationDelay: `${i * 0.2}s` }} />)}
                </div>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={supportInput} onChange={e => setSupportInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendSupport(); }} placeholder="Describe your issue…" style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 13, padding: '11px 15px', fontSize: 13 }} />
                <button onClick={sendSupport} style={{ padding: '11px 20px', background: '#f59e0b', border: 'none', borderRadius: 13, color: '#000', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Send</button>
              </div>
            </div>
          )}

          {/* READING ROOM */}
          {view === 'reading-room' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#070b14', overflow: 'hidden' }}>
              <div style={{ padding: '18px 26px', borderBottom: '1px solid rgba(255,255,255,.05)', background: '#0a0f1d', flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: '#10b981', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>Camera OCR — Text-to-Speech</div>
                <h3 style={{ fontSize: 26, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', margin: 0 }}>Reading<span style={{ color: '#475569', fontStyle: 'normal' }}> Room</span></h3>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 18, padding: 18, paddingBottom: 100, overflowY: 'auto', overflowX: 'hidden' }}>
                <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#0a0f1d', borderRadius: 22, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, background: '#050810', position: 'relative', minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {scanPhase === 'idle' && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: .3 }}>
                        <Icon path="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" size={44} strokeWidth={1} />
                        <p style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Camera off</p>
                      </div>}
                      {(scanPhase === 'live' || scanPhase === 'processing' || scanPhase === 'done') && <>
                        <canvas ref={canvasRef} width={420} height={320} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: scanPhase === 'processing' ? 'brightness(0.45)' : 'none' }} />
                        {scanPhase === 'live' && <>
                          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#10b981,#6ee7b7,#10b981,transparent)', boxShadow: '0 0 18px 6px rgba(16,185,129,.5)', animation: 'scanLine 2s ease-in-out infinite' }} />
                          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)', borderRadius: 8, padding: '4px 10px', border: '1px solid rgba(239,68,68,.3)' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse2 1s infinite' }} />
                            <span style={{ fontSize: 9, fontWeight: 900, color: '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Live</span>
                          </div>
                        </>}
                        {scanPhase === 'processing' && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 }}>
                          <div style={{ fontSize: 9, fontWeight: 900, color: '#10b981', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Processing… {scanProgress}%</div>
                          <div style={{ width: '78%', height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 4 }}>
                            <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#10b981,#6ee7b7)', width: `${scanProgress}%`, transition: 'width .12s' }} />
                          </div>
                        </div>}
                      </>}
                    </div>
                    <div style={{ padding: 14, display: 'flex', gap: 9, borderTop: '1px solid rgba(255,255,255,.05)' }}>
                      {scanPhase === 'idle' && <button onClick={startScan} style={{ flex: 1, padding: '9px 0', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 11, color: '#10b981', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>▶ Start Camera</button>}
                      {scanPhase === 'live' && <><button onClick={captureScan} style={{ flex: 2, padding: '9px 0', background: '#10b981', border: 'none', borderRadius: 11, color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>⚡ Capture</button>
                        <button onClick={stopScan} style={{ flex: 1, padding: '9px 0', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 11, color: '#f87171', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>■ Stop</button></>}
                      {scanPhase === 'done' && <button onClick={stopScan} style={{ flex: 1, padding: '9px 0', background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 11, color: '#818cf8', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>↺ Rescan</button>}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
                  <div style={{ ...S.card, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ fontSize: 9, color: '#10b981', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12 }}>Scanned Text</div>
                    <div style={{ flex: 1, overflowY: 'auto', fontSize: 13, color: '#94a3b8', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {scanPhase === 'done' ? "IN THE COURT OF THE DISTRICT JUDGE, ERNAKULAM\nO.S. No. 145 of 2025\n\nPlaintiff: Sreedharan K., House No. 42, near St. George Church, Aluva.\n\nVersus\n\nDefendant: Rajan P., House No. 43, near St. George Church, Aluva.\n\nPLAINT under Order VII Rule 1 of the Code of Civil Procedure, 1908.\n\n1. The Plaintiff is the absolute owner in possession of the land bearing Survey Number 101/2 of Aluva Village measuring 10 Cents.\n\n2. The Defendant has illegally encroached upon the Plaintiff's property by constructing a fence along the eastern boundary.\n\n3. The Plaintiff has suffered damages and requests an interim injunction." : <span style={{ color: '#334155', fontStyle: 'italic' }}>Scanned document text will appear here…</span>}
                    </div>
                    {scanPhase === 'done' && <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.05)' }}>
                      <button style={{ flex: 1, padding: '9px 0', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 11, color: '#10b981', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>▶ Read Aloud</button>
                      <button style={{ flex: 1, padding: '9px 0', background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 11, color: '#818cf8', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>↓ Export PDF</button>
                    </div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOC CONVERTER */}
          {view === 'doc-converter' && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 22, padding: 48 }}>
              <div style={{ width: 76, height: 76, borderRadius: 22, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                <Icon path="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" size={34} strokeWidth={1.5} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>Camera OCR Engine</div>
                <h3 style={{ fontSize: 38, fontWeight: 900, fontStyle: 'italic', margin: '0 0 10px' }}>Document<span style={{ color: '#475569', fontStyle: 'normal' }}> Converter</span></h3>
                <p style={{ color: '#475569', fontSize: 13, maxWidth: 300, lineHeight: 1.6, margin: '0 auto 22px' }}>Camera-based legal document scanner. Capture and export as PDF or Word.</p>
              </div>
              <button style={{ padding: '15px 40px', background: '#6366f1', border: 'none', borderRadius: 15, color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' }}>Open Legal Scanner</button>
              <p style={{ fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Requires camera permission</p>
            </div>
          )}

          {/* ══ WRITING DESK ══ */}
          {view === 'writing-desk' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* ── Toolbar ── */}
              <div style={{ background: '#070b14', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                <div style={{ marginRight: 2 }}>
                  <div style={{ fontSize: 8, color: '#f59e0b', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' }}>AI Drafting Studio</div>
                  <div style={{ fontSize: 14, fontWeight: 900, fontStyle: 'italic', color: '#e2e8f0', lineHeight: 1.1 }}>Writing <span style={{ color: '#475569', fontStyle: 'normal' }}>Desk</span></div>
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.07)' }} />
                {/* View toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,.04)', borderRadius: 9, padding: 3, gap: 2 }}>
                  {[['split','Split'],['draft','Draft'],['chat','AI Chat']].map(([v,l]) => (
                    <button key={v} onClick={() => setDeskView(v)} style={{ padding: '4px 11px', borderRadius: 7, background: deskView===v ? '#1e293b' : 'transparent', border: deskView===v ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent', color: deskView===v ? '#e2e8f0' : '#475569', fontSize: 9, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</button>
                  ))}
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.07)' }} />
                {/* Suggestions summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {[['pending','#f59e0b','Pending'],['accepted','#10b981','OK'],['rejected','#ef4444','Out']].map(([st,col,lbl]) => {
                    const n = draftSuggestions.filter(s=>s.status===st).length;
                    return n > 0 ? (
                      <div key={st} style={{ display:'flex',alignItems:'center',gap:4,padding:'3px 8px',background:`rgba(${col==='#f59e0b'?'245,158,11':col==='#10b981'?'16,185,129':'239,68,68'},.08)`,border:`1px solid ${col}22`,borderRadius:20 }}>
                        <span style={{ width:5,height:5,borderRadius:'50%',background:col,display:'inline-block' }}/>
                        <span style={{ fontSize:8,fontWeight:900,color:col,letterSpacing:'0.1em',textTransform:'uppercase' }}>{n} {lbl}</span>
                      </div>
                    ) : null;
                  })}
                </div>
                {/* TTS status */}
                {isSpeaking && (
                  <div style={{ display:'flex',alignItems:'center',gap:6,padding:'4px 10px',background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.2)',borderRadius:20 }}>
                    <span className="pulse-a" style={{ width:6,height:6,borderRadius:'50%',background:'#10b981',display:'inline-block' }}/>
                    <span style={{ fontSize:9,fontWeight:900,color:'#10b981',textTransform:'uppercase',letterSpacing:'0.1em' }}>Reading P.{speakPageNum}</span>
                    <button onClick={stopSpeaking} style={{ background:'none',border:'none',color:'#10b981',cursor:'pointer',fontSize:11,padding:0,marginLeft:2 }}>■</button>
                  </div>
                )}
                {/* Voice listening badge */}
                {voiceListening && (
                  <div style={{ display:'flex',alignItems:'center',gap:6,padding:'4px 10px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:20 }}>
                    <span className="pulse-a" style={{ width:6,height:6,borderRadius:'50%',background:'#ef4444',display:'inline-block' }}/>
                    <span style={{ fontSize:9,fontWeight:900,color:'#ef4444',textTransform:'uppercase',letterSpacing:'0.1em' }}>Listening…</span>
                    {voiceTranscript && <span style={{ fontSize:9,color:'#94a3b8',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{voiceTranscript}</span>}
                  </div>
                )}
                <div style={{ marginLeft:'auto',display:'flex',gap:7,alignItems:'center' }}>
                  <button onClick={() => setShowModelUpload(v=>!v)} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:9,color:'#f59e0b',fontSize:9,fontWeight:900,cursor:'pointer' }}>
                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" size={12} strokeWidth={2}/> Model
                  </button>
                  <button style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)',borderRadius:9,color:'#818cf8',fontSize:9,fontWeight:900,cursor:'pointer' }}>
                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={12} strokeWidth={2}/> Export
                  </button>
                </div>
              </div>

              {/* ── Page navigator bar ── */}
              <div style={{ background:'#050810',borderBottom:'1px solid rgba(255,255,255,.05)',padding:'7px 16px',display:'flex',alignItems:'center',gap:6,flexShrink:0,overflowX:'auto' }} className="tab-scroll">
                <span style={{ fontSize:8,fontWeight:900,color:'#334155',textTransform:'uppercase',letterSpacing:'0.2em',marginRight:4,whiteSpace:'nowrap' }}>Pages</span>
                {draftPages.map((pg, i) => (
                  <button key={i} onClick={() => setCurrentPage(i+1)} style={{
                    minWidth:32,height:28,borderRadius:7,
                    background: currentPage===i+1 ? '#6366f1' : 'rgba(255,255,255,.04)',
                    border: currentPage===i+1 ? '1px solid #818cf8' : '1px solid rgba(255,255,255,.06)',
                    color: currentPage===i+1 ? '#fff' : '#475569',
                    fontSize:10,fontWeight:900,cursor:'pointer',transition:'all .15s',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:4,padding:'0 8px',
                    boxShadow: currentPage===i+1 ? '0 0 12px rgba(99,102,241,.4)' : 'none'
                  }}>
                    {i+1}
                    {isSpeaking && speakPageNum===i+1 && <span style={{ width:4,height:4,borderRadius:'50%',background:'#10b981',display:'inline-block',animation:'pulse2 .8s infinite' }}/>}
                  </button>
                ))}
                {draftPages.length < MAX_PAGES ? (
                  <button onClick={addNewPage} style={{ minWidth:32,height:28,borderRadius:7,background:'rgba(16,185,129,.06)',border:'1px dashed rgba(16,185,129,.2)',color:'#10b981',fontSize:14,fontWeight:900,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 8px' }}>+</button>
                ) : (
                  <span style={{ fontSize:8,color:'#ef4444',fontWeight:700,padding:'0 8px',whiteSpace:'nowrap' }}>20-page limit reached</span>
                )}
                <span style={{ marginLeft:'auto',fontSize:8,color:'#334155',fontWeight:700,whiteSpace:'nowrap' }}>{draftPages.length}/{MAX_PAGES} pages · {draftPages.reduce((a,p)=>a+p.length,0)} chars</span>
                {/* Read aloud current page button */}
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : readPageAloud(currentPage-1)}
                  style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:isSpeaking?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)',border:`1px solid ${isSpeaking?'rgba(16,185,129,.3)':'rgba(255,255,255,.07)'}`,borderRadius:9,color:isSpeaking?'#10b981':'#64748b',fontSize:9,fontWeight:900,cursor:'pointer',whiteSpace:'nowrap' }}>
                  <Icon path={isSpeaking?"M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z":"M15.536 8.464a5 5 0 010 7.072M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13"} size={12} strokeWidth={2}/>
                  {isSpeaking ? 'Stop' : 'Read P.'+(currentPage)}
                </button>
              </div>

              {/* ── Model draft upload panel ── */}
              {showModelUpload && (
                <div style={{ background:'#070b14',borderBottom:'1px solid rgba(255,255,255,.06)',padding:'12px 16px',flexShrink:0,animation:'slideIn .2s ease' }}>
                  <div style={{ display:'flex',gap:14,alignItems:'flex-start' }}>
                    <div className={`model-drop${modelDraftDragOver?' over':''}`}
                      style={{ flex:1,padding:'13px 18px',display:'flex',alignItems:'center',gap:12 }}
                      onDragOver={e=>{e.preventDefault();setModelDraftDragOver(true);}}
                      onDragLeave={()=>setModelDraftDragOver(false)}
                      onDrop={e=>{e.preventDefault();setModelDraftDragOver(false);const f=e.dataTransfer.files[0];if(f){setModelDraftName(f.name);setUploadedModels(m=>[...m,{id:Date.now(),name:f.name,date:new Date().toISOString().slice(0,10)}]);}}}
                      onClick={()=>modelFileRef.current?.click()}>
                      <input ref={modelFileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){setModelDraftName(f.name);setUploadedModels(m=>[...m,{id:Date.now(),name:f.name,date:new Date().toISOString().slice(0,10)}]);}}}/>
                      <div style={{width:34,height:34,borderRadius:9,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#f59e0b',flexShrink:0}}>
                        <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={18} strokeWidth={1.5}/>
                      </div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:'#e2e8f0',marginBottom:2}}>Upload Model Draft</div>
                        <div style={{fontSize:10,color:'#475569'}}>Drop PDF/DOC/TXT — AI uses it as drafting reference</div>
                      </div>
                      <div style={{marginLeft:'auto',padding:'5px 12px',background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.2)',borderRadius:7,color:'#f59e0b',fontSize:9,fontWeight:900,whiteSpace:'nowrap'}}>Browse</div>
                    </div>
                    {uploadedModels.length > 0 && (
                      <div style={{width:260,flexShrink:0}}>
                        <div style={{fontSize:8,color:'#475569',fontWeight:900,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:6}}>Loaded ({uploadedModels.length})</div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {uploadedModels.map(m=>(
                            <div key={m.id} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 9px',background:'rgba(255,255,255,.03)',borderRadius:8,border:'1px solid rgba(255,255,255,.05)'}}>
                              <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={12} strokeWidth={1.5} style={{color:'#f59e0b',flexShrink:0}}/>
                              <span style={{fontSize:10,color:'#94a3b8',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.name}</span>
                              <span style={{fontSize:8,color:'#334155',flexShrink:0}}>{m.date}</span>
                              <button onClick={()=>setUploadedModels(ms=>ms.filter(x=>x.id!==m.id))} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',padding:2,flexShrink:0}}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 3-panel body ── */}
              <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

                {/* LEFT: Draft Viewer */}
                {(deskView==='split' || deskView==='draft') && (
                  <div style={{ flex: deskView==='draft'?1:'0 0 52%', display:'flex', flexDirection:'column', borderRight:deskView==='split'?'1px solid rgba(255,255,255,.05)':'none', overflow:'hidden' }}>

                    {/* Page header */}
                    <div style={{ padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', gap:8, flexShrink:0, background:'#0a0f1d', flexWrap:'wrap' }}>
                      <div style={{ width:7,height:7,borderRadius:'50%',background:'#10b981' }}/>
                      <span style={{ fontSize:9,fontWeight:900,color:'#6366f1',letterSpacing:'0.15em',textTransform:'uppercase' }}>Page {currentPage} of {draftPages.length}</span>
                      <span style={{ fontSize:8,color:'#334155',fontWeight:700 }}>{(draftPages[currentPage-1]||'').length} chars</span>
                      <div style={{ display:'flex',gap:4 }}>
                        <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} style={{ padding:'3px 8px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',borderRadius:6,color:currentPage===1?'#1e293b':'#64748b',fontSize:10,cursor:currentPage===1?'default':'pointer' }}>‹</button>
                        <button onClick={()=>setCurrentPage(p=>Math.min(draftPages.length,p+1))} disabled={currentPage===draftPages.length} style={{ padding:'3px 8px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',borderRadius:6,color:currentPage===draftPages.length?'#1e293b':'#64748b',fontSize:10,cursor:currentPage===draftPages.length?'default':'pointer' }}>›</button>
                      </div>
                      <button onClick={()=>isSpeaking?stopSpeaking():readPageAloud(currentPage-1)} style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 9px',background:isSpeaking&&speakPageNum===currentPage?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)',border:`1px solid ${isSpeaking&&speakPageNum===currentPage?'rgba(16,185,129,.3)':'rgba(255,255,255,.06)'}`,borderRadius:7,color:isSpeaking&&speakPageNum===currentPage?'#10b981':'#475569',fontSize:9,fontWeight:700,cursor:'pointer' }}>
                        <Icon path={isSpeaking&&speakPageNum===currentPage?"M10 9v6m4-6v6":"M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"} size={11} strokeWidth={2}/>
                        {isSpeaking&&speakPageNum===currentPage?'Stop':'Read'}
                      </button>
                      <button onClick={()=>setDraftEditMode(true)} style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 10px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:7,color:'#f59e0b',fontSize:9,fontWeight:900,cursor:'pointer' }}>
                        ✎ Edit Page
                      </button>
                      {draftPages.length>1 && <button onClick={()=>deletePage(currentPage-1)} style={{ padding:'4px 9px',background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.12)',borderRadius:7,color:'#f87171',fontSize:9,fontWeight:700,cursor:'pointer' }}>Del</button>}
                      <div style={{ display:'flex',gap:5,marginLeft:'auto' }}>
                        {['#ef4444','#f59e0b','#10b981'].map((c,k)=><div key={k} style={{width:9,height:9,borderRadius:'50%',background:c,opacity:.55}}/>)}
                      </div>
                    </div>

                    {/* ── SCROLLABLE DRAFT DOCUMENT ── */}
                    <div style={{ flex:1, overflowY:'scroll', background:'#0d1117', padding:'28px 32px 60px' }}>
                      {draftSuggestions.filter(s=>s.status==='accepted').length > 0 && (
                        <div style={{ background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.15)',borderRadius:9,padding:'6px 14px',marginBottom:20,display:'flex',alignItems:'center',gap:7 }}>
                          <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={13} strokeWidth={2} style={{color:'#10b981'}}/>
                          <span style={{fontSize:10,color:'#10b981',fontWeight:600}}>{draftSuggestions.filter(s=>s.status==='accepted').length} suggestion(s) accepted</span>
                        </div>
                      )}
                      {/* Render every line as a <p> — fully scrollable, no textarea traps */}
                      {(draftPages[currentPage-1]||'').split('\n').map((line, i) => (
                        <p key={i} style={{
                          margin: line.trim()==='' ? '0 0 8px' : '0 0 4px',
                          fontFamily:"'Courier New',monospace",
                          fontSize: 12.5,
                          lineHeight: 1.85,
                          color: line.trim()==='' ? 'transparent' : line===line.toUpperCase()&&line.trim().length>2 ? '#e2e8f0' : '#cbd5e1',
                          fontWeight: line===line.toUpperCase()&&line.trim().length>2 ? 700 : 400,
                          letterSpacing: line===line.toUpperCase()&&line.trim().length>2 ? '0.02em' : 'normal',
                          borderBottom: line===line.toUpperCase()&&line.trim().length>2&&i>0 ? '1px solid rgba(255,255,255,.06)' : 'none',
                          paddingBottom: line===line.toUpperCase()&&line.trim().length>2&&i>0 ? 8 : 0,
                          paddingTop: line===line.toUpperCase()&&line.trim().length>2&&i>0 ? 14 : 0,
                          minHeight: line.trim()==='' ? 10 : 'auto',
                          whiteSpace:'pre-wrap',
                          wordBreak:'break-word',
                          userSelect:'text',
                        }}>{line||'\u00A0'}</p>
                      ))}
                      {/* Page end marker */}
                      <div style={{ marginTop:32, paddingTop:16, borderTop:'1px dashed rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                        <span style={{ fontSize:9, color:'#1e293b', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase' }}>— Page {currentPage} End —</span>
                      </div>
                    </div>

                  </div>
                )}

                {/* ── EDIT MODAL overlay ── */}
                {draftEditMode && (
                  <div style={{ position:'absolute', inset:0, zIndex:200, background:'rgba(2,6,23,.92)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
                    <div style={{ width:'100%', maxWidth:740, height:'80vh', background:'#0a0f1d', borderRadius:20, border:'1px solid rgba(245,158,11,.2)', display:'flex', flexDirection:'column', boxShadow:'0 40px 100px rgba(0,0,0,.8)' }}>
                      <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                        <span style={{ fontSize:10,fontWeight:900,color:'#f59e0b',letterSpacing:'0.15em',textTransform:'uppercase' }}>✎ Edit — Page {currentPage}</span>
                        <span style={{ fontSize:9,color:'#334155',fontWeight:700 }}>{(draftPages[currentPage-1]||'').length} chars</span>
                        <div style={{ marginLeft:'auto',display:'flex',gap:8 }}>
                          <button onClick={()=>setDraftEditMode(false)} style={{ padding:'7px 20px',background:'#6366f1',border:'none',borderRadius:9,color:'#fff',fontSize:10,fontWeight:900,cursor:'pointer' }}>✓ Done</button>
                        </div>
                      </div>
                      <textarea
                        autoFocus
                        value={draftPages[currentPage-1]||''}
                        onChange={e=>updatePage(currentPage-1,e.target.value)}
                        style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#cbd5e1', fontFamily:"'Courier New',monospace", fontSize:12.5, lineHeight:1.9, padding:'20px 24px', resize:'none', overflowY:'auto' }}
                        spellCheck={false}
                        placeholder="Edit this page…"
                      />
                    </div>
                  </div>
                )}

                {/* RIGHT: Suggestions + AI Chat */}
                {(deskView==='split' || deskView==='chat') && (
                  <div style={{ flex: deskView==='chat'?1:'0 0 48%', display:'flex',flexDirection:'column',overflow:'hidden' }}>

                    {/* Suggestions panel (split only) */}
                    {deskView==='split' && (
                      <div style={{ flexShrink:0,maxHeight:'42%',display:'flex',flexDirection:'column',borderBottom:'1px solid rgba(255,255,255,.05)',overflow:'hidden' }}>
                        <div style={{ padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,.04)',display:'flex',alignItems:'center',gap:7,background:'#0a0f1d',flexShrink:0 }}>
                          <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={13} strokeWidth={2} style={{color:'#f59e0b'}}/>
                          <span style={{fontSize:9,fontWeight:900,color:'#94a3b8',letterSpacing:'0.15em',textTransform:'uppercase'}}>AI Suggestions</span>
                          <span style={{marginLeft:'auto',fontSize:8,color:'#475569',fontWeight:700}}>{draftSuggestions.filter(s=>s.status==='pending').length} pending</span>
                        </div>
                        <div style={{ flex:1,overflowY:'auto',padding:'8px 12px',display:'flex',flexDirection:'column',gap:7 }}>
                          {draftSuggestions.map(s=>(
                            <div key={s.id} className="suggestion-card" style={{
                              borderRadius:11,padding:'10px 12px',
                              background:s.status==='accepted'?'rgba(16,185,129,.06)':s.status==='rejected'?'rgba(239,68,68,.04)':'rgba(255,255,255,.03)',
                              border:`1px solid ${s.status==='accepted'?'rgba(16,185,129,.2)':s.status==='rejected'?'rgba(239,68,68,.15)':s.type==='add'?'rgba(16,185,129,.12)':s.type==='delete'?'rgba(239,68,68,.12)':'rgba(245,158,11,.12)'}`,
                              opacity:s.status==='rejected'?0.4:1
                            }}>
                              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                                <span style={{fontSize:7,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.12em',padding:'2px 7px',borderRadius:20,background:s.type==='add'?'rgba(16,185,129,.15)':s.type==='delete'?'rgba(239,68,68,.15)':'rgba(245,158,11,.15)',color:s.type==='add'?'#10b981':s.type==='delete'?'#ef4444':'#f59e0b'}}>
                                  {s.type==='add'?'+ Add':s.type==='delete'?'− Del':'✎ Edit'}
                                </span>
                                <span style={{fontSize:8,color:'#334155',fontWeight:700}}>{s.line}</span>
                                {s.status!=='pending'&&<span style={{marginLeft:'auto',fontSize:7,fontWeight:900,textTransform:'uppercase',color:s.status==='accepted'?'#10b981':'#ef4444'}}>{s.status==='accepted'?'✓ Done':'✕ Out'}</span>}
                              </div>
                              <p style={{fontSize:11,color:'#94a3b8',lineHeight:1.5,margin:'0 0 8px'}}>{s.text}</p>
                              {s.status==='pending'&&(
                                <div style={{display:'flex',gap:6}}>
                                  <button onClick={()=>applySuggestion(s.id)} style={{flex:1,padding:'5px 0',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',borderRadius:7,color:'#10b981',fontSize:9,fontWeight:900,cursor:'pointer'}}>✓ Accept</button>
                                  <button onClick={()=>rejectSuggestion(s.id)} style={{flex:1,padding:'5px 0',background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.15)',borderRadius:7,color:'#f87171',fontSize:9,fontWeight:900,cursor:'pointer'}}>✕ Reject</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Chat */}
                    <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
                      <div style={{ padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,.04)',display:'flex',alignItems:'center',gap:7,background:'#0a0f1d',flexShrink:0,flexWrap:'wrap',gap:6 }}>
                        <div style={{width:26,height:26,borderRadius:7,background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#818cf8',fontSize:8,fontWeight:900}}>AI</div>
                        <span style={{fontSize:9,fontWeight:900,color:'#94a3b8',letterSpacing:'0.12em',textTransform:'uppercase'}}>Drafting Assistant</span>
                        <div style={{display:'flex',gap:5,marginLeft:'auto',flexWrap:'wrap'}}>
                          {['Add clause','Read draft','Add page','Cite sections'].map(s=>(
                            <button key={s} onClick={()=>{ setDeskInput(s); setTimeout(()=>sendDeskChat(s),50); }} style={{padding:'3px 8px',background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.12)',borderRadius:20,color:'#6366f1',fontSize:8,fontWeight:700,cursor:'pointer'}}>{s}</button>
                          ))}
                        </div>
                      </div>
                      <div ref={deskChatRef} style={{ flex:1,overflowY:'auto',padding:'12px 14px 8px',display:'flex',flexDirection:'column',gap:9 }}>
                        {deskChatHistory.map((msg,idx)=>(
                          <div key={idx} className="fade-up" style={{display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start',gap:7,alignItems:'flex-end'}}>
                            {msg.role==='ai'&&<div style={{width:24,height:24,borderRadius:6,background:'rgba(99,102,241,.1)',border:'1px solid rgba(99,102,241,.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#818cf8',fontSize:7,fontWeight:900,flexShrink:0}}>AI</div>}
                            <div style={{maxWidth:'85%',padding:'9px 13px',borderRadius:msg.role==='user'?'14px 14px 4px 14px':'4px 14px 14px 14px',background:msg.role==='user'?'rgba(99,102,241,.14)':'rgba(255,255,255,.04)',border:`1px solid ${msg.role==='user'?'rgba(99,102,241,.25)':'rgba(255,255,255,.06)'}`,fontSize:12,lineHeight:1.65,color:msg.role==='user'?'#c7d2fe':'#cbd5e1',whiteSpace:'pre-wrap'}}>{msg.text}</div>
                          </div>
                        ))}
                        {deskLoading&&<div style={{display:'flex',gap:5,padding:'9px 13px',width:'fit-content',background:'rgba(255,255,255,.04)',borderRadius:'4px 14px 14px 14px'}}>
                          {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#475569',animation:'pulse2 1.2s infinite',animationDelay:`${i*0.2}s`}}/>)}
                        </div>}
                      </div>

                      {/* Voice transcript preview */}
                      {voiceListening && voiceTranscript && (
                        <div style={{ padding:'6px 14px',background:'rgba(239,68,68,.04)',borderTop:'1px solid rgba(239,68,68,.1)',fontSize:11,color:'#f87171',fontStyle:'italic' }}>
                          🎙 "{voiceTranscript}"
                        </div>
                      )}

                      {/* Input bar */}
                      <div style={{ padding:'10px 14px 80px',borderTop:'1px solid rgba(255,255,255,.05)',display:'flex',gap:7,background:'#070b14',alignItems:'flex-end' }}>
                        <textarea
                          value={deskInput}
                          onChange={e=>setDeskInput(e.target.value)}
                          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendDeskChat();} }}
                          placeholder="Ask AI to draft, redraft, add clause, cite law… or say 'read draft' / 'add page'"
                          rows={2}
                          style={{flex:1,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:11,padding:'9px 13px',fontSize:12,lineHeight:1.5,resize:'none'}}
                        />
                        {/* Voice input button */}
                        <button
                          onClick={voiceListening?stopVoiceInput:startVoiceInput}
                          style={{padding:'9px 12px',background:voiceListening?'rgba(239,68,68,.15)':'rgba(255,255,255,.05)',border:`1px solid ${voiceListening?'rgba(239,68,68,.3)':'rgba(255,255,255,.08)'}`,borderRadius:11,color:voiceListening?'#ef4444':'#475569',fontSize:14,cursor:'pointer',flexShrink:0,transition:'all .2s',boxShadow:voiceListening?'0 0 16px rgba(239,68,68,.25)':'none'}}
                          title={voiceListening?'Stop voice input':'Start voice input'}
                        >
                          🎙
                        </button>
                        <button onClick={()=>sendDeskChat()} style={{padding:'9px 16px',background:'#6366f1',border:'none',borderRadius:11,color:'#fff',fontSize:10,fontWeight:900,cursor:'pointer',flexShrink:0}}>Send</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>

        {/* Hardware Dock */}
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100, pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(0,0,0,.9)', backdropFilter: 'blur(20px)', padding: '10px 18px', borderRadius: 38, border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.8)' }}>
            {[['cam', "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", camOn, setCamOn], ['mic', "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z", micOn, setMicOn]].map(([id, path, on, setter]) => (
              <button key={id} onClick={() => setter(v => !v)} style={{ width: 48, height: 48, borderRadius: '50%', background: on ? '#6366f1' : id === 'mic' ? 'rgba(239,68,68,.1)' : 'rgba(255,255,255,.05)', border: `2px solid ${on ? '#818cf8' : id === 'mic' ? 'rgba(239,68,68,.2)' : 'rgba(255,255,255,.1)'}`, color: on ? '#fff' : id === 'mic' ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .3s', boxShadow: on ? '0 0 20px rgba(99,102,241,.5)' : 'none', transform: on ? 'scale(1.1)' : 'scale(1)' }}>
                <Icon path={path} size={18} />
              </button>
            ))}
            <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,.1)' }} />
            <div style={{ padding: '0 10px' }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#6366f1', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Nexus Link</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{micOn || camOn ? 'UPLINK STABLE' : 'OFFLINE'}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
