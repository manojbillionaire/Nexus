import { useState, useEffect, useRef } from 'react';
import api from '../api.js';

const Icon = ({ path, size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);

export default function AgencyHQPortal({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [advocates, setAdvocates] = useState([]);
  const [pending, setPending] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [stats, setStats] = useState({});
  const [searchQ, setSearchQ] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTier, setBroadcastTier] = useState('All');
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  // Affiliate management state
  const [showCreateAffiliate, setShowCreateAffiliate] = useState(false);
  const [newAff, setNewAff] = useState({ name:'', email:'', phone:'', password:'', state:'', district:'' });
  const [affCreating, setAffCreating] = useState(false);
  const [affError, setAffError] = useState('');
  const [generatedLink, setGeneratedLink] = useState(null); // { link, name, code }
  const [copiedId, setCopiedId] = useState(null);

  const loadData = async () => {
    try {
      const [advsRes, pendRes, affRes, bcastRes, statsRes] = await Promise.all([
        api.get('/api/agency/advocates'),
        api.get('/api/agency/pending'),
        api.get('/api/agency/affiliates'),
        api.get('/api/agency/broadcasts'),
        api.get('/api/agency/stats'),
      ]);
      setAdvocates(advsRes.data);
      setPending(pendRes.data);
      setAffiliates(affRes.data);
      setBroadcasts(bcastRes.data);
      setStats(statsRes.data);
    } catch (e) { console.error('Load error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const approve = async (id) => {
    await api.post(`/api/agency/approve/${id}`);
    loadData();
  };
  const reject = async (id) => {
    if (!confirm('Reject and delete this applicant?')) return;
    await api.post(`/api/agency/reject/${id}`);
    loadData();
  };
  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    await api.post('/api/agency/broadcast', { message: broadcastMsg.trim(), tier: broadcastTier });
    setBroadcastMsg('');
    loadData();
  };

  const askAI = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post('/api/ai/consult', { message: aiQuery, history: [] });
      setAiReply(res.data.reply);
    } catch { setAiReply('AI service unavailable.'); }
    finally { setAiLoading(false); }
  };

  const copyLink = (link, id) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const generateAffLink = async (aff) => {
    try {
      const res = await api.post(`/api/agency/affiliates/${aff._id}/generate-link`);
      setGeneratedLink({ link: res.data.link, name: aff.name, code: aff.code });
    } catch (e) { alert('Failed to generate link.'); }
  };

  const createAffiliate = async () => {
    if (!newAff.name || !newAff.email || !newAff.password) { setAffError('Name, email and password are required.'); return; }
    setAffCreating(true); setAffError('');
    try {
      const res = await api.post('/api/agency/affiliates/create', newAff);
      setGeneratedLink({ link: res.data.link, name: res.data.aff.name, code: res.data.aff.code });
      setNewAff({ name:'', email:'', phone:'', password:'', state:'', district:'' });
      setShowCreateAffiliate(false);
      loadData();
    } catch (e) { setAffError(e.response?.data?.error || 'Failed to create affiliate.'); }
    finally { setAffCreating(false); }
  };

  const filtered = advocates.filter(a => !searchQ || a.name?.toLowerCase().includes(searchQ.toLowerCase()) || a.email?.toLowerCase().includes(searchQ.toLowerCase()));

  const S = {
    page: { display:'flex', height:'100vh', background:'#020617', color:'#e2e8f0', fontFamily:"'Inter',system-ui,sans-serif", overflow:'hidden', fontSize:14 },
    sidebar: { width:220, background:'#070b14', borderRight:'1px solid rgba(255,255,255,.05)', display:'flex', flexDirection:'column', padding:'20px 0', flexShrink:0 },
    main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
    header: { height:54, background:'#0a0f1d', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', padding:'0 24px', justifyContent:'space-between', flexShrink:0 },
    content: { flex:1, overflowY:'auto', padding:24 },
    card: { background:'#0a0f1d', borderRadius:20, padding:22, border:'1px solid rgba(255,255,255,.05)' },
    navBtn: (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'10px 18px', margin:'2px 10px', borderRadius:12, background:active?'rgba(245,158,11,.08)':'transparent', border:active?'1px solid rgba(245,158,11,.15)':'1px solid transparent', color:active?'#f59e0b':'#475569', fontSize:12, fontWeight:700, cursor:'pointer', textAlign:'left', width:'calc(100% - 20px)', fontFamily:'inherit' }),
  };

  const NAVS = [
    ['dashboard','Dashboard','M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
    ['advocates','Advocates','M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
    ['pending',`Pending${pending.length>0?` (${pending.length})`:''}`, 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
    ['affiliates','Affiliates','M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'],
    ['broadcasts','Broadcasts','M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
    ['ai-intel','AI Intelligence','M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'],
  ];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#020617' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(245,158,11,.2)', borderTopColor:'#f59e0b', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        <div style={{ fontSize:12, color:'#475569' }}>Loading Agency HQ…</div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(245,158,11,.3);border-radius:4px}button:focus{outline:none}input{color:#e2e8f0;outline:none}input::placeholder{color:#475569}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={S.sidebar}>
        <div style={{ padding:'0 18px 20px', borderBottom:'1px solid rgba(255,255,255,.05)', marginBottom:10 }}>
          <div style={{ width:44, height:44, background:'#f59e0b', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <span style={{ fontSize:22, fontWeight:900, color:'#000', fontStyle:'italic' }}>T</span>
          </div>
          <div style={{ fontSize:8, color:'#f59e0b', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase' }}>Agency HQ</div>
          <div style={{ fontSize:14, fontWeight:900, color:'#e2e8f0' }}>Admin Portal</div>
          <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{user?.email}</div>
        </div>
        {NAVS.map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)} style={S.navBtn(tab===id)}>
            <Icon path={icon} size={15} strokeWidth={2} />
            <span>{label}</span>
            {id==='pending' && pending.length>0 && <span style={{ marginLeft:'auto', background:'#ef4444', color:'#fff', borderRadius:10, fontSize:9, fontWeight:900, padding:'2px 7px' }}>{pending.length}</span>}
          </button>
        ))}
        <div style={{ marginTop:'auto', padding:'16px 18px', borderTop:'1px solid rgba(255,255,255,.05)' }}>
          <button onClick={onLogout} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', width:'100%', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:11, color:'#f87171', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={14} /> Sign Out
          </button>
        </div>
      </div>

      <div style={S.main}>
        <header style={S.header}>
          <div style={{ fontSize:13, fontWeight:900, color:'#e2e8f0' }}>Nexus Justice <span style={{ color:'#f59e0b' }}>Agency HQ</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {pending.length>0 && <div style={{ padding:'4px 12px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:20, fontSize:10, color:'#f87171', fontWeight:900 }}>{pending.length} Pending</div>}
            <div style={{ padding:'4px 12px', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.15)', borderRadius:20, fontSize:10, color:'#f59e0b', fontWeight:900 }}>{stats.totalAdvocates||0} Advocates</div>
          </div>
        </header>
        <div style={S.content}>

          {/* DASHBOARD */}
          {tab==='dashboard' && (
            <div>
              <h2 style={{ fontSize:28, fontWeight:900, fontStyle:'italic', margin:'0 0 20px', letterSpacing:'-0.02em' }}>Dashboard <span style={{ color:'#475569', fontStyle:'normal', fontSize:18 }}>Overview</span></h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
                {[
                  ['Total Advocates', stats.totalAdvocates||0, '#6366f1'],
                  ['Pending Approval', stats.pending||0, '#f59e0b'],
                  ['Total Affiliates', stats.affiliates||0, '#10b981'],
                  ['Total Cases', stats.totalCases||0, '#8b5cf6'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ ...S.card }}>
                    <div style={{ fontSize:9, color:'#475569', fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
                    <div style={{ fontSize:32, fontWeight:900, color }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{ fontSize:10, color:'#f59e0b', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:14 }}>Recent Advocate Registrations</div>
                {advocates.slice(0,5).map(a => (
                  <div key={a._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'rgba(99,102,241,.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#818cf8', fontWeight:900, fontSize:14, flexShrink:0 }}>{a.name?.[0]}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{a.name}</div>
                      <div style={{ fontSize:11, color:'#475569' }}>{a.email} · {a.specialisation||'General'}</div>
                    </div>
                    <span style={{ fontSize:9, fontWeight:900, textTransform:'uppercase', padding:'3px 10px', borderRadius:20, background:a.status==='active'?'rgba(16,185,129,.1)':'rgba(245,158,11,.1)', color:a.status==='active'?'#10b981':'#f59e0b' }}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADVOCATES */}
          {tab==='advocates' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:0 }}>All Advocates</h2>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search by name or email…" style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:11, padding:'9px 16px', fontSize:12, width:240, color:'#e2e8f0', outline:'none' }} />
              </div>
              <div style={{ ...S.card, overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                      {['Name','Email','Phone','Bar Council No.','Specialisation','Plan','Status','Affiliate Code','Joined'].map(h=>(
                        <th key={h} style={{ paddingBottom:10, paddingLeft:12, textAlign:'left', fontSize:9, fontWeight:900, color:'#475569', textTransform:'uppercase', letterSpacing:'0.15em', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a=>(
                      <tr key={a._id} style={{ borderBottom:'1px solid rgba(255,255,255,.03)' }}>
                        <td style={{ padding:'12px', fontWeight:700, fontSize:13 }}>{a.name}</td>
                        <td style={{ padding:'12px', color:'#64748b', fontSize:12 }}>{a.email}</td>
                        <td style={{ padding:'12px', color:'#64748b', fontSize:12 }}>{a.phone}</td>
                        <td style={{ padding:'12px', color:'#818cf8', fontSize:12, fontWeight:700 }}>{a.barCouncilNo}</td>
                        <td style={{ padding:'12px', color:'#64748b', fontSize:12 }}>{a.specialisation||'—'}</td>
                        <td style={{ padding:'12px' }}><span style={{ fontSize:10, fontWeight:900, color:a.plan==='Pro'?'#6366f1':a.plan==='Elite'?'#f59e0b':'#475569', background:'rgba(255,255,255,.04)', padding:'3px 9px', borderRadius:20 }}>{a.plan}</span></td>
                        <td style={{ padding:'12px' }}><span style={{ fontSize:10, fontWeight:900, textTransform:'uppercase', color:a.status==='active'?'#10b981':a.status==='suspended'?'#ef4444':'#f59e0b', background:a.status==='active'?'rgba(16,185,129,.1)':a.status==='suspended'?'rgba(239,68,68,.1)':'rgba(245,158,11,.1)', padding:'3px 9px', borderRadius:20 }}>{a.status}</span></td>
                        <td style={{ padding:'12px', color:'#f59e0b', fontSize:11, fontFamily:'monospace' }}>{a.affiliateCode||'—'}</td>
                        <td style={{ padding:'12px', color:'#475569', fontSize:12 }}>{a.joinedAt?.slice(0,10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length===0 && <div style={{ textAlign:'center', padding:40, color:'#334155', fontSize:13 }}>No advocates found.</div>}
              </div>
            </div>
          )}

          {/* PENDING */}
          {tab==='pending' && (
            <div>
              <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:'0 0 18px' }}>Pending <span style={{ color:'#475569', fontStyle:'normal' }}>Approvals</span></h2>
              {pending.length===0 ? (
                <div style={{ ...S.card, textAlign:'center', padding:48, color:'#334155' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>✓</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>All caught up! No pending approvals.</div>
                </div>
              ) : pending.map(a => (
                <div key={a._id} style={{ ...S.card, marginBottom:12, display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f59e0b', fontWeight:900, fontSize:18, flexShrink:0 }}>{a.name?.[0]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{a.name}</div>
                    <div style={{ fontSize:11, color:'#64748b', display:'flex', gap:16, flexWrap:'wrap' }}>
                      <span>{a.email}</span><span>{a.phone}</span>
                      <span>Bar: <strong style={{ color:'#818cf8' }}>{a.barCouncilNo}</strong></span>
                      <span>Spec: {a.specialisation||'—'}</span>
                      {a.affiliateCode && <span>Ref: <strong style={{ color:'#f59e0b' }}>{a.affiliateCode}</strong></span>}
                    </div>
                    <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>Applied: {a.joinedAt?.slice(0,10)}</div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>approve(a._id)} style={{ padding:'9px 20px', background:'#10b981', border:'none', borderRadius:10, color:'#fff', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>✓ Approve</button>
                    <button onClick={()=>reject(a._id)} style={{ padding:'9px 20px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, color:'#f87171', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AFFILIATES */}
          {tab==='affiliates' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:12 }}>
                <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:0 }}>Affiliates <span style={{ color:'#475569', fontStyle:'normal' }}>Management</span></h2>
                <button onClick={()=>{ setShowCreateAffiliate(v=>!v); setAffError(''); }} style={{ padding:'10px 20px', background:'linear-gradient(135deg,#10b981,#059669)', border:'none', borderRadius:12, color:'#fff', fontSize:12, fontWeight:900, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>+</span> Create New Affiliate
                </button>
              </div>

              {/* Generated Link Banner */}
              {generatedLink && (
                <div style={{ ...S.card, marginBottom:18, border:'1px solid rgba(16,185,129,.3)', background:'rgba(16,185,129,.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                    <div>
                      <div style={{ fontSize:9, color:'#10b981', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:4 }}>✅ Affiliate Link Generated for {generatedLink.name}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:6 }}>Code: <span style={{ color:'#f59e0b', fontFamily:'monospace', fontWeight:700 }}>{generatedLink.code}</span></div>
                      <div style={{ fontSize:12, color:'#94a3b8', fontFamily:'monospace', wordBreak:'break-all', background:'rgba(0,0,0,.3)', padding:'8px 12px', borderRadius:8 }}>{generatedLink.link}</div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      <button onClick={()=>copyLink(generatedLink.link,'banner')} style={{ padding:'10px 18px', background: copiedId==='banner'?'#10b981':'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.3)', borderRadius:10, color: copiedId==='banner'?'#fff':'#10b981', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>
                        {copiedId==='banner'?'✓ Copied!':'📋 Copy Link'}
                      </button>
                      <button onClick={()=>setGeneratedLink(null)} style={{ padding:'10px 14px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, color:'#64748b', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Affiliate Form */}
              {showCreateAffiliate && (
                <div style={{ ...S.card, marginBottom:18, border:'1px solid rgba(99,102,241,.2)' }}>
                  <div style={{ fontSize:10, color:'#6366f1', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:16 }}>➕ New Affiliate Account</div>
                  {affError && <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'8px 12px', color:'#f87171', fontSize:12, marginBottom:12 }}>⚠ {affError}</div>}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:14 }}>
                    {[['name','Full Name','text','e.g. Priya Sharma'],['email','Email','email','priya@email.com'],['phone','Phone','tel','+91 98765...'],['password','Password','password','Min 8 chars'],['state','State','text','Kerala'],['district','District','text','Thiruvananthapuram']].map(([k,label,type,ph])=>(
                      <div key={k}>
                        <div style={{ fontSize:9, color:'#475569', fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>{label}{['name','email','password'].includes(k)&&<span style={{ color:'#f87171' }}> *</span>}</div>
                        <input type={type} placeholder={ph} value={newAff[k]} onChange={e=>setNewAff(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'10px 14px', color:'#e2e8f0', fontSize:12, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={createAffiliate} disabled={affCreating} style={{ padding:'11px 24px', background:'#6366f1', border:'none', borderRadius:10, color:'#fff', fontSize:12, fontWeight:900, cursor:'pointer', fontFamily:'inherit', opacity:affCreating?0.6:1 }}>
                      {affCreating ? '⏳ Creating…' : '✓ Create & Generate Link'}
                    </button>
                    <button onClick={()=>{setShowCreateAffiliate(false);setAffError('');}} style={{ padding:'11px 18px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, color:'#64748b', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Affiliates Grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:16 }}>
                {affiliates.map(aff => {
                  const affLink = `${window.location.origin}/signup?ref=${aff.code}`;
                  return (
                    <div key={aff._id} style={{ ...S.card }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                        <div style={{ width:42, height:42, borderRadius:12, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#10b981', fontWeight:900, fontSize:16, flexShrink:0 }}>{aff.name?.[0]}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14 }}>{aff.name}</div>
                          <div style={{ fontSize:11, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{aff.email}</div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:9, color:'#10b981', fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase' }}>Code</div>
                          <div style={{ fontSize:12, color:'#f59e0b', fontWeight:700, fontFamily:'monospace' }}>{aff.code}</div>
                        </div>
                      </div>

                      {/* Affiliate Link Row */}
                      <div style={{ background:'rgba(245,158,11,.04)', border:'1px solid rgba(245,158,11,.12)', borderRadius:10, padding:'8px 12px', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:9, color:'#f59e0b', fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:2 }}>🔗 Affiliate Link</div>
                          <div style={{ fontSize:10, color:'#64748b', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{affLink}</div>
                        </div>
                        <button onClick={()=>copyLink(affLink, aff._id)} style={{ padding:'6px 12px', background: copiedId===aff._id?'#10b981':'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', borderRadius:8, color: copiedId===aff._id?'#fff':'#f59e0b', fontSize:10, fontWeight:900, cursor:'pointer', fontFamily:'inherit', flexShrink:0, transition:'all .2s' }}>
                          {copiedId===aff._id ? '✓' : '📋'}
                        </button>
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                        <div style={{ background:'rgba(255,255,255,.03)', borderRadius:10, padding:'10px 14px' }}>
                          <div style={{ fontSize:9, color:'#475569', fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase' }}>Subscribers</div>
                          <div style={{ fontSize:22, fontWeight:900, color:'#6366f1' }}>{aff.subscribers?.length||0}</div>
                        </div>
                        <div style={{ background:'rgba(255,255,255,.03)', borderRadius:10, padding:'10px 14px' }}>
                          <div style={{ fontSize:9, color:'#475569', fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase' }}>Total Earned</div>
                          <div style={{ fontSize:18, fontWeight:900, color:'#10b981' }}>₹{(aff.totalEarned||0).toFixed(2)}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ fontSize:10, color:'#475569' }}>{aff.state}{aff.district?`, ${aff.district}`:''} · Joined {aff.joined?.slice(0,10)}</div>
                        <button onClick={()=>generateAffLink(aff)} style={{ padding:'6px 14px', background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)', borderRadius:8, color:'#818cf8', fontSize:10, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>
                          🔄 Regen Link
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {affiliates.length===0 && !showCreateAffiliate && (
                <div style={{ ...S.card, textAlign:'center', padding:48 }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🤝</div>
                  <div style={{ color:'#475569', fontSize:13, marginBottom:16 }}>No affiliates registered yet.</div>
                  <button onClick={()=>setShowCreateAffiliate(true)} style={{ padding:'11px 24px', background:'#10b981', border:'none', borderRadius:12, color:'#fff', fontSize:12, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>+ Add First Affiliate</button>
                </div>
              )}
            </div>
          )}

          {/* BROADCASTS */}
          {tab==='broadcasts' && (
            <div>
              <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:'0 0 18px' }}>Broadcasts</h2>
              <div style={{ ...S.card, marginBottom:18 }}>
                <div style={{ fontSize:10, color:'#f59e0b', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>Send Announcement</div>
                <textarea value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} placeholder="Type your announcement to advocates…" rows={3} style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'12px 14px', color:'#e2e8f0', fontSize:13, resize:'none', boxSizing:'border-box', outline:'none', marginBottom:12, fontFamily:'inherit' }} />
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <select value={broadcastTier} onChange={e=>setBroadcastTier(e.target.value)} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'8px 14px', color:'#e2e8f0', fontSize:12, outline:'none', fontFamily:'inherit' }}>
                    <option style={{ background:'#0a0f1d' }}>All</option>
                    <option style={{ background:'#0a0f1d' }}>Starter</option>
                    <option style={{ background:'#0a0f1d' }}>Pro</option>
                    <option style={{ background:'#0a0f1d' }}>Elite</option>
                  </select>
                  <button onClick={sendBroadcast} style={{ padding:'10px 24px', background:'#f59e0b', border:'none', borderRadius:11, color:'#000', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>Send Broadcast</button>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {broadcasts.map(b => (
                  <div key={b._id} style={{ ...S.card, display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, color:'#e2e8f0', lineHeight:1.5 }}>{b.message}</p>
                      <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>{b.sentAt?.slice(0,10)} · Tier: {b.tier} · By: {b.sentBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI INTELLIGENCE */}
          {tab==='ai-intel' && (
            <div>
              <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:'0 0 18px' }}>AI <span style={{ color:'#475569', fontStyle:'normal' }}>Intelligence</span></h2>
              <div style={{ ...S.card, marginBottom:18 }}>
                <div style={{ fontSize:10, color:'#6366f1', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>Query AI (DeepSeek + Gemini Fallback)</div>
                <div style={{ display:'flex', gap:10 }}>
                  <input value={aiQuery} onChange={e=>setAiQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askAI()} placeholder="Ask about platform metrics, legal trends, advocate performance…" style={{ flex:1, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'11px 15px', fontSize:13, color:'#e2e8f0', outline:'none' }} />
                  <button onClick={askAI} disabled={aiLoading} style={{ padding:'11px 22px', background:'#6366f1', border:'none', borderRadius:12, color:'#fff', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>
                    {aiLoading ? '…' : 'Ask AI'}
                  </button>
                </div>
                {aiReply && (
                  <div style={{ marginTop:16, padding:'14px 16px', background:'rgba(99,102,241,.06)', border:'1px solid rgba(99,102,241,.15)', borderRadius:12 }}>
                    <div style={{ fontSize:9, color:'#6366f1', fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>AI Response</div>
                    <p style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{aiReply}</p>
                  </div>
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div style={S.card}>
                  <div style={{ fontSize:10, color:'#10b981', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>API Status</div>
                  {[
                    ['DeepSeek API', !!import.meta.env.VITE_DEEPSEEK_KEY, 'Primary AI Orchestration'],
                    ['Gemini API', !!import.meta.env.VITE_GEMINI_KEY, 'Fallback AI (Legacy)'],
                    ['Sarvam AI', !!import.meta.env.VITE_SARVAM_KEY, 'Local Language TTS'],
                    ['Serper.dev', !!import.meta.env.VITE_SERPER_KEY, 'Web Search'],
                    ['MongoDB', true, 'Database (Railway)'],
                  ].map(([name, active, desc]) => (
                    <div key={name} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:active?'#10b981':'#f59e0b', flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700 }}>{name}</div>
                        <div style={{ fontSize:10, color:'#475569' }}>{desc}</div>
                      </div>
                      <span style={{ fontSize:9, fontWeight:900, color:active?'#10b981':'#f59e0b', textTransform:'uppercase' }}>{active?'Active':'Config Needed'}</span>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={{ fontSize:10, color:'#f59e0b', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>Platform Summary</div>
                  {[
                    ['Total Advocates', stats.totalAdvocates||0],
                    ['Pending Approval', stats.pending||0],
                    ['Active Affiliates', stats.affiliates||0],
                    ['Broadcasts Sent', stats.broadcasts||0],
                    ['Total Cases', stats.totalCases||0],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ fontSize:12, color:'#64748b' }}>{k}</span>
                      <span style={{ fontSize:16, fontWeight:900, color:'#e2e8f0' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
