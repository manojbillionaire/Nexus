import { useState, useEffect } from 'react';
import api from '../api.js';

const Icon = ({ path, size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);

export default function AffiliatePortal({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/api/affiliate/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const copyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const S = {
    page: { display:'flex', height:'100vh', background:'#020617', color:'#e2e8f0', fontFamily:"'Inter',system-ui,sans-serif", overflow:'hidden', fontSize:14 },
    card: { background:'#0a0f1d', borderRadius:20, padding:22, border:'1px solid rgba(255,255,255,.05)' },
    navBtn: (active) => ({ padding:'10px 18px', margin:'2px 10px', borderRadius:12, background:active?'rgba(16,185,129,.08)':'transparent', border:active?'1px solid rgba(16,185,129,.15)':'1px solid transparent', color:active?'#10b981':'#475569', fontSize:12, fontWeight:700, cursor:'pointer', textAlign:'left', width:'calc(100% - 20px)', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }),
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#020617' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(16,185,129,.2)', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        <div style={{ fontSize:12, color:'#475569' }}>Loading Affiliate Portal…</div>
      </div>
    </div>
  );

  const aff = data?.aff || user;
  const subscribers = data?.subscribers || [];
  const earned = data?.earned || 0;
  const payments = data?.paymentHistory || [];
  const PLAN_FEE = { Starter:0, Pro:999, Elite:2499 };
  const COMMISSION = 0.10;

  const affiliateLink = `${window.location.origin}/signup?ref=${aff?.code}`;

  return (
    <div style={S.page}>
      <style>{`::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(16,185,129,.3);border-radius:4px}button:focus{outline:none}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>

      {/* Sidebar */}
      <div style={{ width:220, background:'#070b14', borderRight:'1px solid rgba(255,255,255,.05)', display:'flex', flexDirection:'column', padding:'20px 0', flexShrink:0 }}>
        <div style={{ padding:'0 18px 20px', borderBottom:'1px solid rgba(255,255,255,.05)', marginBottom:10 }}>
          <div style={{ width:44, height:44, background:'#10b981', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <span style={{ fontSize:22, fontWeight:900, color:'#000' }}>A</span>
          </div>
          <div style={{ fontSize:8, color:'#10b981', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase' }}>Affiliate Portal</div>
          <div style={{ fontSize:14, fontWeight:900, color:'#e2e8f0' }}>{aff?.name}</div>
          <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{aff?.email}</div>
        </div>
        {[
          ['dashboard','Dashboard','M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
          ['subscribers','Subscribers','M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
          ['payments','Payments','M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
          ['share','Share & Earn','M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'],
        ].map(([id,label,icon]) => (
          <button key={id} onClick={()=>setTab(id)} style={S.navBtn(tab===id)}>
            <Icon path={icon} size={15} strokeWidth={2} />
            {label}
          </button>
        ))}
        <div style={{ marginTop:'auto', padding:'16px 18px', borderTop:'1px solid rgba(255,255,255,.05)' }}>
          <button onClick={onLogout} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', width:'100%', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:11, color:'#f87171', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ height:54, background:'#0a0f1d', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', padding:'0 24px', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:900 }}>Nexus Justice <span style={{ color:'#10b981' }}>Affiliate Portal</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ padding:'4px 12px', background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.15)', borderRadius:20, fontSize:10, color:'#10b981', fontWeight:900 }}>Code: {aff?.code}</div>
            <div style={{ padding:'4px 12px', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.15)', borderRadius:20, fontSize:10, color:'#f59e0b', fontWeight:900 }}>₹{earned.toFixed(2)} Earned</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:24 }}>

          {tab==='dashboard' && (
            <div>
              <h2 style={{ fontSize:28, fontWeight:900, fontStyle:'italic', margin:'0 0 20px', letterSpacing:'-0.02em' }}>Affiliate <span style={{ color:'#475569', fontStyle:'normal' }}>Dashboard</span></h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
                {[
                  ['Referral Code', aff?.code, '#f59e0b'],
                  ['Total Referrals', subscribers.length, '#6366f1'],
                  ['Active Referrals', subscribers.filter(s=>s.status==='active').length, '#10b981'],
                  ['Commission Earned', `₹${earned.toFixed(2)}`, '#8b5cf6'],
                ].map(([label,val,color]) => (
                  <div key={label} style={{ ...S.card }}>
                    <div style={{ fontSize:9, color:'#475569', fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
                    <div style={{ fontSize:24, fontWeight:900, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Affiliate link card */}
              <div style={{ ...S.card, marginBottom:20, background:'rgba(245,158,11,.04)', border:'1px solid rgba(245,158,11,.15)' }}>
                <div style={{ fontSize:10, color:'#f59e0b', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>🔗 Your Referral Link — Paste on Social Media to Earn Commission!</div>
                <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(0,0,0,.3)', borderRadius:12, padding:'12px 16px', marginBottom:12 }}>
                  <div style={{ flex:1, fontSize:13, color:'#94a3b8', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{affiliateLink}</div>
                  <button onClick={()=>copyCode(affiliateLink)} style={{ padding:'7px 16px', background:'rgba(245,158,11,.15)', border:'1px solid rgba(245,158,11,.3)', borderRadius:9, color:'#f59e0b', fontSize:10, fontWeight:900, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}>
                    {copied ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
                <p style={{ fontSize:12, color:'#64748b', margin:0 }}>Share this link on WhatsApp, LinkedIn, Facebook or any social media. When an advocate signs up through your link and subscribes to a paid plan, you earn <strong style={{ color:'#f59e0b' }}>10% commission</strong> every month they remain active!</p>
              </div>

              {/* Recent subscribers */}
              <div style={S.card}>
                <div style={{ fontSize:10, color:'#10b981', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:14 }}>Recent Referrals</div>
                {subscribers.slice(0,5).map(s => (
                  <div key={s._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:'rgba(99,102,241,.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#818cf8', fontWeight:900, fontSize:12, flexShrink:0 }}>{s.name?.[0]}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{s.name}</div>
                      <div style={{ fontSize:11, color:'#475569' }}>{s.email} · {s.plan}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ fontSize:10, fontWeight:900, color:s.status==='active'?'#10b981':'#f59e0b' }}>{s.status}</span>
                      {s.status==='active' && <div style={{ fontSize:11, color:'#10b981', fontWeight:700 }}>₹{((PLAN_FEE[s.plan]||0)*COMMISSION).toFixed(2)}/mo</div>}
                    </div>
                  </div>
                ))}
                {subscribers.length===0 && <div style={{ textAlign:'center', padding:24, color:'#334155', fontSize:13 }}>No referrals yet. Share your link to start earning!</div>}
              </div>
            </div>
          )}

          {tab==='subscribers' && (
            <div>
              <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:'0 0 18px' }}>Referred <span style={{ color:'#475569', fontStyle:'normal' }}>Advocates</span></h2>
              <div style={{ ...S.card, overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                      {['Name','Email','Plan','Status','Joined','Monthly Commission'].map(h=>(
                        <th key={h} style={{ paddingBottom:10, paddingLeft:12, textAlign:'left', fontSize:9, fontWeight:900, color:'#475569', textTransform:'uppercase', letterSpacing:'0.12em', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map(s => (
                      <tr key={s._id} style={{ borderBottom:'1px solid rgba(255,255,255,.03)' }}>
                        <td style={{ padding:'11px 12px', fontWeight:700, fontSize:13 }}>{s.name}</td>
                        <td style={{ padding:'11px 12px', color:'#64748b', fontSize:12 }}>{s.email}</td>
                        <td style={{ padding:'11px 12px' }}><span style={{ fontSize:10, fontWeight:900, color:'#818cf8', background:'rgba(99,102,241,.1)', padding:'3px 9px', borderRadius:20 }}>{s.plan}</span></td>
                        <td style={{ padding:'11px 12px' }}><span style={{ fontSize:10, fontWeight:900, color:s.status==='active'?'#10b981':'#f59e0b' }}>{s.status}</span></td>
                        <td style={{ padding:'11px 12px', color:'#475569', fontSize:12 }}>{s.joinedAt?.slice(0,10)}</td>
                        <td style={{ padding:'11px 12px', fontWeight:900, color:'#10b981', fontSize:13 }}>{s.status==='active'?`₹${((PLAN_FEE[s.plan]||0)*COMMISSION).toFixed(2)}`:'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {subscribers.length===0 && <div style={{ textAlign:'center', padding:40, color:'#334155', fontSize:13 }}>No referrals yet. Share your link to earn commissions!</div>}
              </div>
            </div>
          )}

          {tab==='payments' && (
            <div>
              <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:'0 0 18px' }}>Payment <span style={{ color:'#475569', fontStyle:'normal' }}>History</span></h2>
              <div style={{ ...S.card, marginBottom:18, background:'rgba(16,185,129,.04)', border:'1px solid rgba(16,185,129,.15)' }}>
                <div style={{ fontSize:9, color:'#10b981', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:4 }}>Commission Schedule</div>
                <p style={{ fontSize:13, color:'#94a3b8' }}>Commissions are paid on the <strong style={{ color:'#e2e8f0' }}>4th of every month</strong> for active subscribers. Rate: <strong style={{ color:'#10b981' }}>10%</strong> of each subscriber's monthly plan fee.</p>
              </div>
              <div style={S.card}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                      {['Month','Amount','Paid On','Transaction ID','Status'].map(h=>(
                        <th key={h} style={{ paddingBottom:10, paddingLeft:12, textAlign:'left', fontSize:9, fontWeight:900, color:'#475569', textTransform:'uppercase', letterSpacing:'0.12em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,.03)' }}>
                        <td style={{ padding:'12px', fontWeight:700 }}>{p.month}</td>
                        <td style={{ padding:'12px', color:'#10b981', fontWeight:900, fontSize:15 }}>₹{p.amount?.toFixed(2)}</td>
                        <td style={{ padding:'12px', color:'#64748b', fontSize:12 }}>{p.paidOn?.slice(0,10)}</td>
                        <td style={{ padding:'12px', color:'#818cf8', fontSize:11, fontFamily:'monospace' }}>{p.txId}</td>
                        <td style={{ padding:'12px' }}><span style={{ fontSize:10, fontWeight:900, color:'#10b981', background:'rgba(16,185,129,.1)', padding:'3px 9px', borderRadius:20 }}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length===0 && <div style={{ textAlign:'center', padding:40, color:'#334155', fontSize:13 }}>No payment history yet.</div>}
              </div>
            </div>
          )}

          {tab==='share' && (
            <div>
              <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:'0 0 18px' }}>Share <span style={{ color:'#475569', fontStyle:'normal' }}>& Earn</span></h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
                {[
                  ['WhatsApp', '#25D366', '💬', `Share on WhatsApp`, `https://wa.me/?text=${encodeURIComponent('Join Nexus Justice — AI-powered legal platform for advocates! Sign up here: ' + affiliateLink)}`],
                  ['LinkedIn', '#0077B5', '💼', 'Share on LinkedIn', `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(affiliateLink)}`],
                  ['Twitter/X', '#1DA1F2', '🐦', 'Share on Twitter/X', `https://twitter.com/intent/tweet?text=${encodeURIComponent('Advocates — join Nexus Justice, India\'s AI-powered legal platform! ' + affiliateLink)}`],
                  ['Facebook', '#1877F2', '📘', 'Share on Facebook', `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateLink)}`],
                ].map(([platform, color, emoji, label, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" style={{ ...S.card, display:'flex', alignItems:'center', gap:14, textDecoration:'none', border:`1px solid ${color}22`, cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=color+'66'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=color+'22'}>
                    <div style={{ width:48, height:48, borderRadius:14, background:color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{emoji}</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:4 }}>{label}</div>
                      <div style={{ fontSize:11, color:'#64748b' }}>Earn 10% commission per referral</div>
                    </div>
                    <div style={{ marginLeft:'auto', color, fontSize:18 }}>→</div>
                  </a>
                ))}
              </div>
              <div style={{ ...S.card, marginTop:20 }}>
                <div style={{ fontSize:10, color:'#f59e0b', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:14 }}>How It Works</div>
                {[
                  ['1', 'Share your unique affiliate link on social media, WhatsApp, or directly with advocate friends.'],
                  ['2', 'Advocates sign up using your link and choose a paid plan (Pro ₹999/mo or Elite ₹2499/mo).'],
                  ['3', 'You earn 10% commission every month as long as they remain active subscribers.'],
                  ['4', 'Commissions are paid to your account on the 4th of every month.'],
                ].map(([num, text]) => (
                  <div key={num} style={{ display:'flex', gap:14, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f59e0b', fontWeight:900, fontSize:13, flexShrink:0 }}>{num}</div>
                    <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6, margin:0 }}>{text}</p>
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
