import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api.js';

const Icon = ({ path, size = 20, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);

const LANGUAGES = [
  { code:'ml-IN', label:'Malayalam' },
  { code:'hi-IN', label:'Hindi' },
  { code:'ta-IN', label:'Tamil' },
  { code:'te-IN', label:'Telugu' },
  { code:'kn-IN', label:'Kannada' },
  { code:'mr-IN', label:'Marathi' },
  { code:'bn-IN', label:'Bengali' },
  { code:'gu-IN', label:'Gujarati' },
];

const CLIENTS_INIT = [
  { slNo:1, name:'Sreedharan K.', phone:'+91 9876543210', courtName:'District Court, Aluva', caseNumber:'OS 145/2025', oppAdvocateName:'Ramesh Menon', nextPostingDate:'2026-03-15', purposeOfPosting:'Filing Written Statement' },
  { slNo:2, name:'Elena Rodriguez', phone:'+1 555-0199', courtName:'High Court', caseNumber:'WP(C) 204/2026', oppAdvocateName:'Sarah Jenkins', nextPostingDate:'2026-03-20', purposeOfPosting:'Hearing' },
  { slNo:3, name:'Marcus Thorne', phone:'+1 555-0188', courtName:'Magistrate Court', caseNumber:'CC 55/2026', oppAdvocateName:'David Clark', nextPostingDate:'2026-04-05', purposeOfPosting:'Evidence' },
];

const PAGE1 = `IN THE COURT OF THE DISTRICT JUDGE, ERNAKULAM\n\nO.S. No. 145 of 2025\n\nBETWEEN:\n\nSreedharan K., S/o Krishnan Nair,\nHouse No. 42, near St. George Church, Aluva,\nErnakulam District — 683 101.\n                                                    ... PLAINTIFF\n\nAND\n\nRajan P., S/o Parameswaran Nair,\nHouse No. 43, near St. George Church, Aluva,\nErnakulam District — 683 101.\n                                                    ... DEFENDANT\n\nPLAINT UNDER ORDER VII RULE 1 OF THE CODE OF CIVIL PROCEDURE, 1908`;

export default function AdvocatePortal({ user, onLogout }) {
  const [view, setView] = useState('command');
  const [userData, setUserData] = useState(user);
  const [notifications, setNotifications] = useState([]);
  const [clients, setClients] = useState(CLIENTS_INIT);
  const [addingClient, setAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [supportMsgs, setSupportMsgs] = useState([{ id:1, role:'ai', text:'Hello! I am the Nexus Support AI. How can I help you today?' }]);
  const [supportInput, setSupportInput] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [draftPages, setDraftPages] = useState([PAGE1]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deskChatHistory, setDeskChatHistory] = useState([{ role:'ai', text:"Welcome to the Writing Desk! I'm powered by DeepSeek AI (with Gemini as fallback). Ask me to draft, add clauses, cite laws, or read the draft aloud." }]);
  const [deskInput, setDeskInput] = useState('');
  const [deskLoading, setDeskLoading] = useState(false);
  const [deskView, setDeskView] = useState('split');
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState('');
  const [consultVoice, setConsultVoice] = useState(false);
  const [translateInput, setTranslateInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [sarvamLang, setSarvamLang] = useState('ml-IN');
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [draftEditMode, setDraftEditMode] = useState(false);
  const [kbDocs, setKbDocs] = useState([
    { id:1, category:'railway', name:'Railways Act, 1989.pdf', size:'2.4 MB', date:'2026-01-12', pages:184 },
    { id:2, category:'property', name:'Transfer of Property Act, 1882.pdf', size:'960 KB', date:'2025-10-05', pages:78 },
  ]);
  const [kbSearch, setKbSearch] = useState('');
  const [kbUploading, setKbUploading] = useState(false);
  const [kbUploadName, setKbUploadName] = useState('');

  const chatRef = useRef(null);
  const deskChatRef = useRef(null);
  const supportRef = useRef(null);
  const recognitionRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const consultRecogRef = useRef(null);
  const MAX_PAGES = 20;

  useEffect(() => { loadNotifications(); }, []);
  useEffect(() => { chatRef.current?.scrollTo({ top:99999, behavior:'smooth' }); }, [chatHistory]);
  useEffect(() => { deskChatRef.current?.scrollTo({ top:99999, behavior:'smooth' }); }, [deskChatHistory]);
  useEffect(() => { supportRef.current?.scrollTo({ top:99999, behavior:'smooth' }); }, [supportMsgs]);

  // Camera: start/stop on camOn toggle
  useEffect(() => {
    if (camOn) {
      setCamError('');
      navigator.mediaDevices.getUserMedia({ video: { facingMode:'user', width:640, height:360 }, audio: false })
        .then(stream => {
          cameraStreamRef.current = stream;
          if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = stream;
            cameraVideoRef.current.play();
          }
        })
        .catch(err => {
          setCamOn(false);
          setCamError(err.name === 'NotAllowedError' ? 'Camera access denied. Please allow camera in browser settings.' : 'Camera unavailable: ' + err.message);
        });
    } else {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
    }
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [camOn]);

  // Attach stream to video element once it's in DOM
  useEffect(() => {
    if (camOn && cameraStreamRef.current && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraStreamRef.current;
      cameraVideoRef.current.play();
    }
  }, [camOn, view]);

  // Mic (Command Center): real speech recognition piped to AI consult
  const toggleCommandMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser. Try Chrome or Edge.'); return; }
    if (micOn) {
      recognitionRef.current?.stop();
      setMicOn(false);
    } else {
      const rec = new SR();
      rec.lang = 'en-IN'; rec.continuous = true; rec.interimResults = false;
      rec.onstart = () => setMicOn(true);
      rec.onresult = (e) => {
        const transcript = Array.from(e.results)
          .filter(r => r.isFinal)
          .map(r => r[0].transcript)
          .join(' ')
          .trim();
        if (transcript) {
          // Auto-send to AI consult
          setConsoleInput(transcript);
          setChatHistory(h => [...h, { role:'user', text: '🎙 ' + transcript, id: Date.now() }]);
          setConsoleLoading(true);
          api.post('/api/ai/consult', { message: transcript, history: [] })
            .then(res => setChatHistory(h => [...h, { role:'ai', text: res.data.reply, id: Date.now()+1, model: res.data.model }]))
            .catch(() => setChatHistory(h => [...h, { role:'ai', text: 'AI unavailable.', id: Date.now()+1 }]))
            .finally(() => setConsoleLoading(false));
        }
      };
      rec.onerror = () => setMicOn(false);
      rec.onend = () => { if (micOn) rec.start(); }; // continuous loop
      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Consult view: voice-to-AI
  const toggleConsultVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser.'); return; }
    if (consultVoice) {
      consultRecogRef.current?.stop();
      setConsultVoice(false);
    } else {
      const rec = new SR();
      rec.lang = 'en-IN'; rec.continuous = false; rec.interimResults = true;
      rec.onstart = () => setConsultVoice(true);
      rec.onresult = (e) => {
        const t = Array.from(e.results).map(r => r[0].transcript).join('');
        setConsoleInput(t);
        if (e.results[e.results.length-1].isFinal) {
          setConsultVoice(false);
        }
      };
      rec.onerror = () => setConsultVoice(false);
      rec.onend = () => setConsultVoice(false);
      consultRecogRef.current = rec;
      rec.start();
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get('/api/advocate/notifications');
      setNotifications(res.data.reverse());
    } catch {}
  };

  const markRead = async (notifId) => {
    try {
      await api.put(`/api/advocate/notifications/${notifId}/read`);
      setNotifications(n => n.map(x => x._id===notifId ? {...x, read:true} : x));
    } catch { setNotifications(n => n.map(x => x._id===notifId ? {...x, read:true} : x)); }
  };

  const unread = notifications.filter(n => !n.read).length;

  // AI Consult
  const sendConsult = async () => {
    if (!consoleInput.trim() || consoleLoading) return;
    const text = consoleInput.trim(); setConsoleInput('');
    setChatHistory(h => [...h, { role:'user', text, id:Date.now() }]);
    setConsoleLoading(true);
    try {
      const res = await api.post('/api/ai/consult', { message:text, history:chatHistory.slice(-6).map(m=>({role:m.role,text:m.text})) });
      setChatHistory(h => [...h, { role:'ai', text:res.data.reply, id:Date.now()+1, model:res.data.model }]);
    } catch {
      setChatHistory(h => [...h, { role:'ai', text:'AI service temporarily unavailable. Please try again.', id:Date.now()+1 }]);
    }
    setConsoleLoading(false);
  };

  // Writing Desk AI
  const sendDeskChat = async (overrideText) => {
    const text = (overrideText || deskInput).trim();
    if (!text || deskLoading) return;
    setDeskInput('');
    setDeskChatHistory(h => [...h, { role:'user', text }]);
    setDeskLoading(true);
    try {
      const res = await api.post('/api/ai/draft', { instruction:text, currentDraft:draftPages[currentPage-1], pageNum:currentPage });
      setDeskChatHistory(h => [...h, { role:'ai', text:res.data.reply, model:res.data.model }]);
    } catch {
      setDeskChatHistory(h => [...h, { role:'ai', text:'AI drafting service unavailable. Please try again.' }]);
    }
    setDeskLoading(false);
  };

  // Support AI
  const sendSupport = async () => {
    if (!supportInput.trim() || supportLoading) return;
    const text = supportInput.trim(); setSupportInput('');
    setSupportMsgs(m => [...m, { id:Date.now(), role:'user', text }]);
    setSupportLoading(true);
    try {
      const res = await api.post('/api/ai/consult', { message:`Support request: ${text}`, history:[] });
      setSupportMsgs(m => [...m, { id:Date.now()+1, role:'ai', text:res.data.reply }]);
    } catch {
      setSupportMsgs(m => [...m, { id:Date.now()+1, role:'ai', text:"I've noted your issue. Our team will respond within 24 hours." }]);
    }
    setSupportLoading(false);
  };

  // Sarvam AI Translation
  const translateText = async (text) => {
    if (!text) return;
    setTranslating(true);
    try {
      const res = await api.post('/api/sarvam/translate', { text, targetLang:sarvamLang });
      setTranslatedText(res.data.translated);
    } catch { setTranslatedText('Translation unavailable.'); }
    finally { setTranslating(false); }
  };

  // Web Search
  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await api.post('/api/ai/search', { query:searchQuery });
      setSearchResults(res.data);
    } catch { setSearchResults({ summary:'Search failed. Please try again.', results:[] }); }
    finally { setSearchLoading(false); }
  };

  // TTS
  const readPageAloud = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(draftPages[currentPage-1]);
    utt.rate = 0.92; utt.lang = 'en-IN';
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  // Voice Input
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-IN'; rec.continuous = false; rec.interimResults = true;
    rec.onstart = () => setVoiceListening(true);
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r=>r[0].transcript).join('');
      setVoiceTranscript(t);
      if (e.results[e.results.length-1].isFinal) setDeskInput(d=>(d+' '+t).trim());
    };
    rec.onend = () => { setVoiceListening(false); setVoiceTranscript(''); };
    recognitionRef.current = rec; rec.start();
  };

  const LANGUAGES = [
    { code:'ml-IN', label:'Malayalam' },
    { code:'hi-IN', label:'Hindi' },
    { code:'ta-IN', label:'Tamil' },
    { code:'te-IN', label:'Telugu' },
    { code:'kn-IN', label:'Kannada' },
    { code:'mr-IN', label:'Marathi' },
    { code:'bn-IN', label:'Bengali' },
    { code:'gu-IN', label:'Gujarati' },
  ];

  const sideNav = [
    { id:'command', label:'Command', icon:'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { id:'consult', label:'Consult', icon:'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
    { id:'clients', label:'Clients', icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id:'knowledge-base', label:'Knowledge', icon:'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id:'writing-desk', label:'Writing', icon:'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { id:'search', label:'Search', icon:'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0' },
    { id:'translate', label:'Translate', icon:'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
    { id:'notifications', label:'Notif.', icon:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id:'support', label:'Support', icon:'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
  ];

  const S = {
    page: { display:'flex', height:'100vh', background:'#020617', color:'#e2e8f0', fontFamily:"'Inter',system-ui,sans-serif", overflow:'hidden', fontSize:14 },
    sidebar: { width:72, background:'#070b14', borderRight:'1px solid rgba(255,255,255,.05)', display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 0', gap:8, flexShrink:0, overflowY:'auto' },
    sideBtn: (active) => ({ width:44, height:44, borderRadius:12, background:active?'rgba(245,158,11,.1)':'transparent', border:active?'1px solid rgba(245,158,11,.25)':'1px solid transparent', color:active?'#f59e0b':'#475569', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', transition:'all .2s', flexShrink:0, outline:'none' }),
    header: { height:56, background:'#0a0f1d', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0 },
    card: { background:'#0a0f1d', borderRadius:24, padding:28, border:'1px solid rgba(255,255,255,.05)' },
  };

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse2{0%,100%{opacity:.5}50%{opacity:1}}
        .fade-up{animation:fadeUp .35s ease forwards}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(99,102,241,.4);border-radius:4px}
        input,textarea,select{color:#e2e8f0;outline:none;font-family:inherit}
        input::placeholder,textarea::placeholder{color:#475569}
        button:focus{outline:none}
      `}</style>

      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={{ width:44, height:44, background:'#f59e0b', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', marginBottom:12, boxShadow:'0 4px 20px rgba(245,158,11,.3)', flexShrink:0 }}>
          <span style={{ fontSize:22, fontWeight:900, color:'#000', fontStyle:'italic' }}>T</span>
        </div>
        {sideNav.map(item => (
          <button key={item.id} onClick={()=>setView(item.id)} title={item.label} style={S.sideBtn(view===item.id)}>
            <Icon path={item.icon} size={18} />
            {view===item.id && <div style={{ position:'absolute', left:0, width:3, height:22, background:'#f59e0b', borderRadius:'0 3px 3px 0' }} />}
            {item.id==='notifications' && unread>0 && <div style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%', background:'#ef4444' }} />}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <header style={S.header}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:12, fontWeight:900, color:'#fff' }}>Nexus Justice <span style={{ color:'#6366f1' }}>v3.1</span></span>
            <div style={{ fontSize:11, color:'#475569' }}>Welcome, <span style={{ color:'#e2e8f0', fontWeight:700 }}>{userData?.name}</span></div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ padding:'4px 12px', background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.15)', borderRadius:20, fontSize:9, color:'#6366f1', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.2em' }}>{userData?.plan} Plan</div>
            <div style={{ padding:'4px 12px', background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.12)', borderRadius:20, fontSize:9, color:'#10b981', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.2em' }}>
              <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#10b981', marginRight:4, animation:'pulse2 2s infinite', verticalAlign:'middle' }} />
              Active
            </div>
            <button onClick={onLogout} style={{ padding:'6px 14px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.15)', borderRadius:10, color:'#f87171', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Sign Out</button>
          </div>
        </header>

        <main style={{ flex:1, overflow:'hidden', background:'#020617' }}>

          {/* COMMAND */}
          {view==='command' && (
            <div style={{ height:'100%', display:'flex', gap:24, padding:24, overflow:'hidden' }}>
              <div style={{ width:280, display:'flex', flexDirection:'column', gap:16, flexShrink:0 }}>
                <div style={S.card}>
                  <div style={{ color:'#f59e0b', fontSize:9, fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:6 }}>Voice Node Alpha</div>
                  <h3 style={{ fontSize:24, fontWeight:900, fontStyle:'italic', marginBottom:14 }}>Command<span style={{ color:'#475569' }}>Center</span></h3>
                  <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                    <button onClick={toggleCommandMic} style={{ flex:1, padding:'9px', background:micOn?'rgba(239,68,68,.15)':'rgba(99,102,241,.08)', border:`1px solid ${micOn?'rgba(239,68,68,.4)':'rgba(99,102,241,.2)'}`, borderRadius:10, color:micOn?'#f87171':'#818cf8', fontSize:10, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                      {micOn ? <><span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'#ef4444', animation:'pulse2 1s infinite' }} />LIVE</> : '🎙 MIC → AI'}
                    </button>
                    <button onClick={()=>setCamOn(v=>!v)} style={{ flex:1, padding:'9px', background:camOn?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)', border:`1px solid ${camOn?'rgba(16,185,129,.3)':'rgba(255,255,255,.08)'}`, borderRadius:10, color:camOn?'#10b981':'#64748b', fontSize:10, fontWeight:900, cursor:'pointer' }}>
                      {camOn ? '■ STOP CAM' : '📹 CAM'}
                    </button>
                  </div>
                  {micOn && <div style={{ fontSize:10, color:'#f87171', fontWeight:700, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}><span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#ef4444', animation:'pulse2 0.8s infinite' }} />Listening… speak to send to AI</div>}
                  {camError && <div style={{ fontSize:10, color:'#f87171', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'6px 10px', marginBottom:8 }}>⚠ {camError}</div>}
                  {camOn && (
                    <div style={{ marginBottom:10, borderRadius:12, overflow:'hidden', background:'#000', border:'1px solid rgba(16,185,129,.2)', position:'relative' }}>
                      <video ref={cameraVideoRef} autoPlay playsInline muted style={{ width:'100%', display:'block', maxHeight:160, objectFit:'cover' }} />
                      <div style={{ position:'absolute', top:6, right:8, fontSize:9, color:'#10b981', fontWeight:900, background:'rgba(0,0,0,.6)', padding:'2px 8px', borderRadius:20 }}>● LIVE</div>
                    </div>
                  )}
                  <div style={{ fontSize:10, color:'#6366f1', fontWeight:700 }}>Affiliate Code: <span style={{ color:'#f59e0b', fontFamily:'monospace' }}>{userData?.affiliateCode}</span></div>
                </div>
                <div style={{ ...S.card, flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  <div style={{ fontSize:9, color:'#475569', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>Quick Actions</div>
                  {[
                    ['AI Consultation', ()=>setView('consult'), '#6366f1'],
                    ['Add Client', ()=>{setView('clients');setAddingClient(true);}, '#10b981'],
                    ['Writing Desk', ()=>setView('writing-desk'), '#f59e0b'],
                    ['Web Search', ()=>setView('search'), '#8b5cf6'],
                    ['Translate', ()=>setView('translate'), '#f59e0b'],
                  ].map(([label, action, color]) => (
                    <button key={label} onClick={action} style={{ padding:'10px 14px', background:`rgba(${color==='#6366f1'?'99,102,241':color==='#10b981'?'16,185,129':color==='#f59e0b'?'245,158,11':color==='#8b5cf6'?'139,92,246':'245,158,11'},.06)`, border:`1px solid ${color}22`, borderRadius:12, color, fontSize:11, fontWeight:700, cursor:'pointer', textAlign:'left', marginBottom:8, width:'100%', fontFamily:'inherit' }}>
                      → {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16, overflow:'hidden' }}>
                <div style={{ ...S.card, flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                  <div style={{ fontSize:9, color:'#6366f1', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:4 }}>Nexus AI Legal Engine</div>
                  <h3 style={{ fontSize:20, fontWeight:900, fontStyle:'italic', marginBottom:14 }}>Consultation<span style={{ color:'#475569', fontStyle:'normal' }}> Console</span></h3>
                  <div ref={chatRef} style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                    {chatHistory.length===0 && (
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, opacity:.4 }}>
                        <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={40} strokeWidth={1.5} />
                        <p style={{ fontSize:12, color:'#475569', fontWeight:700 }}>Begin legal consultation</p>
                      </div>
                    )}
                    {chatHistory.map(msg => (
                      <div key={msg.id} className="fade-up" style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start' }}>
                        <div style={{ maxWidth:'80%', padding:'11px 15px', borderRadius:msg.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px', background:msg.role==='user'?'rgba(99,102,241,.15)':'rgba(255,255,255,.04)', border:`1px solid ${msg.role==='user'?'rgba(99,102,241,.25)':'rgba(255,255,255,.06)'}`, fontSize:13, lineHeight:1.6, color:msg.role==='user'?'#c7d2fe':'#cbd5e1' }}>
                          {msg.text}
                          {msg.model && <span style={{ fontSize:9, color:'#334155', display:'block', marginTop:4 }}>via {msg.model}</span>}
                        </div>
                      </div>
                    ))}
                    {consoleLoading && <div style={{ display:'flex', gap:5, padding:'11px 15px', background:'rgba(255,255,255,.04)', borderRadius:'18px 18px 18px 4px', width:'fit-content' }}>
                      {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#475569', animation:'pulse2 1.2s infinite', animationDelay:`${i*0.2}s` }}/>)}
                    </div>}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={toggleConsultVoice} title="Voice input" style={{ padding:'11px 13px', background:consultVoice?'rgba(239,68,68,.15)':'rgba(255,255,255,.05)', border:`1px solid ${consultVoice?'rgba(239,68,68,.4)':'rgba(255,255,255,.08)'}`, borderRadius:12, color:consultVoice?'#f87171':'#475569', fontSize:15, cursor:'pointer', flexShrink:0 }}>
                      {consultVoice ? <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'#ef4444', animation:'pulse2 0.8s infinite' }} /> : '🎙'}
                    </button>
                    <input value={consoleInput} onChange={e=>setConsoleInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendConsult()} placeholder={consultVoice ? '🎙 Listening…' : "Ask about case strategy, legal sections…"} style={{ flex:1, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'11px 15px', fontSize:13, color:'#e2e8f0', outline:'none', fontFamily:'inherit' }} />
                    <button onClick={sendConsult} disabled={!consoleInput.trim()||consoleLoading} style={{ padding:'11px 20px', background:'#6366f1', border:'none', borderRadius:12, color:'#fff', fontSize:11, fontWeight:900, cursor:'pointer', opacity:!consoleInput.trim()||consoleLoading?0.5:1 }}>Send</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONSULT */}
          {view==='consult' && (
            <div style={{ height:'100%', display:'flex', flexDirection:'column', padding:24, overflow:'hidden' }}>
              <div style={{ ...S.card, flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
                  <div>
                    <div style={{ fontSize:9, color:'#6366f1', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:4 }}>DeepSeek + Gemini Fallback</div>
                    <h3 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:0 }}>Legal<span style={{ color:'#475569', fontStyle:'normal' }}> Consultant</span></h3>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {['Draft petition','Find IPC sections','Order XXXIX CPC'].map(s=>(
                      <button key={s} onClick={()=>setConsoleInput(s)} style={{ padding:'6px 12px', background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.15)', borderRadius:20, color:'#818cf8', fontSize:10, fontWeight:600, cursor:'pointer' }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div ref={chatRef} style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
                  {chatHistory.length===0 && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:20, textAlign:'center', opacity:.6 }}>
                      <Icon path="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" size={40} strokeWidth={1.5} />
                      <p style={{ fontSize:14, fontWeight:700 }}>Ask anything legal — IPC, CPC, Evidence Act, Property, Labour Law…</p>
                    </div>
                  )}
                  {chatHistory.map(msg=>(
                    <div key={msg.id} className="fade-up" style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start' }}>
                      <div style={{ maxWidth:'78%', padding:'13px 17px', borderRadius:msg.role==='user'?'20px 20px 4px 20px':'20px 20px 20px 4px', background:msg.role==='user'?'rgba(99,102,241,.15)':'rgba(255,255,255,.04)', border:`1px solid ${msg.role==='user'?'rgba(99,102,241,.3)':'rgba(255,255,255,.07)'}`, fontSize:13, lineHeight:1.7, color:msg.role==='user'?'#c7d2fe':'#cbd5e1', whiteSpace:'pre-wrap' }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {consoleLoading && <div style={{ display:'flex', gap:6, padding:'13px 17px', background:'rgba(255,255,255,.04)', borderRadius:'20px 20px 20px 4px', width:'fit-content' }}>
                    {[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#475569', animation:'pulse2 1.2s infinite', animationDelay:`${i*0.2}s` }}/>)}
                  </div>}
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={toggleConsultVoice} title="Voice input" style={{ padding:'13px 14px', background:consultVoice?'rgba(239,68,68,.15)':'rgba(255,255,255,.05)', border:`1px solid ${consultVoice?'rgba(239,68,68,.4)':'rgba(255,255,255,.08)'}`, borderRadius:14, color:consultVoice?'#f87171':'#475569', fontSize:16, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center' }}>
                    {consultVoice ? <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'#ef4444', animation:'pulse2 0.8s infinite' }} /> : '🎙'}
                  </button>
                  <input value={consoleInput} onChange={e=>setConsoleInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendConsult()} placeholder={consultVoice ? '🎙 Listening… speak now' : 'Ask about case strategy, legal sections, petition drafts…'} style={{ flex:1, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'13px 18px', fontSize:13, color:'#e2e8f0', outline:'none', fontFamily:'inherit' }} />
                  <button onClick={sendConsult} disabled={consoleLoading||!consoleInput.trim()} style={{ padding:'13px 22px', background:'#6366f1', border:'none', borderRadius:14, color:'#fff', fontSize:11, fontWeight:900, cursor:'pointer', opacity:consoleLoading||!consoleInput.trim()?0.5:1 }}>Send</button>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTS */}
          {view==='clients' && (
            <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ fontSize:32, fontWeight:900, fontStyle:'italic', margin:0 }}>Client<span style={{ color:'#475569', fontStyle:'normal' }}> Registry</span></h2>
                <button onClick={()=>setAddingClient(true)} style={{ padding:'11px 22px', background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.25)', borderRadius:14, color:'#f59e0b', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>+ Add Client</button>
              </div>
              {addingClient && (
                <div style={{ ...S.card, marginBottom:18 }} className="fade-up">
                  <div style={{ fontSize:9, color:'#10b981', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:14 }}>New Client</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                    {[['name','Client Name'],['phone','Phone'],['caseNumber','Case No.'],['courtName','Court'],['oppAdvocateName','Opp. Advocate'],['nextPostingDate','Next Date'],['purposeOfPosting','Purpose']].map(([field,label]) => (
                      <input key={field} placeholder={label} value={newClient[field]||''} onChange={e=>setNewClient(p=>({...p,[field]:e.target.value}))}
                        style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'9px 13px', fontSize:12, gridColumn:['purposeOfPosting','courtName'].includes(field)?'span 2':'auto' }} />
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>{if(newClient.name){setClients(c=>[...c,{...newClient,slNo:c.length+1}]);setNewClient({});setAddingClient(false);}}} style={{ padding:'9px 22px', background:'#10b981', border:'none', borderRadius:10, color:'#fff', fontSize:11, fontWeight:900, cursor:'pointer' }}>Save</button>
                    <button onClick={()=>{setAddingClient(false);setNewClient({});}} style={{ padding:'9px 22px', background:'transparent', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, color:'#94a3b8', fontSize:11, fontWeight:900, cursor:'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
              <div style={{ ...S.card, overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,.08)' }}>
                      {['#','Client','Phone','Court','Case No.','Next Date','Purpose','Action'].map(h=>(
                        <th key={h} style={{ paddingBottom:11, paddingLeft:13, textAlign:'left', fontSize:9, fontWeight:900, color:'#475569', textTransform:'uppercase', letterSpacing:'0.15em', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(c=>(
                      <tr key={c.slNo} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                        <td style={{ padding:'13px', color:'#334155', fontSize:12 }}>{c.slNo}</td>
                        <td style={{ padding:'13px', fontWeight:700, fontSize:13 }}>{c.name}</td>
                        <td style={{ padding:'13px', color:'#64748b', fontSize:12 }}>{c.phone}</td>
                        <td style={{ padding:'13px', color:'#64748b', fontSize:12 }}>{c.courtName}</td>
                        <td style={{ padding:'13px' }}><span style={{ fontSize:11, fontWeight:700, color:'#818cf8', background:'rgba(99,102,241,.1)', padding:'3px 10px', borderRadius:6 }}>{c.caseNumber}</span></td>
                        <td style={{ padding:'13px', color:'#10b981', fontSize:12, fontWeight:700 }}>{c.nextPostingDate}</td>
                        <td style={{ padding:'13px', color:'#64748b', fontSize:12 }}>{c.purposeOfPosting}</td>
                        <td style={{ padding:'13px' }}><button onClick={()=>setClients(cl=>cl.filter(x=>x.slNo!==c.slNo))} style={{ padding:'4px 12px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:7, color:'#f87171', fontSize:10, fontWeight:700, cursor:'pointer' }}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KNOWLEDGE BASE */}
          {view==='knowledge-base' && (
            <div style={{ height:'100%', overflowY:'auto', padding:28 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:9, color:'#8b5cf6', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:4 }}>Local Knowledge Engine</div>
                  <h2 style={{ fontSize:32, fontWeight:900, fontStyle:'italic', margin:0 }}>Law <span style={{ color:'#475569', fontStyle:'normal' }}>Knowledge Base</span></h2>
                  <p style={{ fontSize:12, color:'#475569', marginTop:6 }}>Upload law documents — AI references them during consultations.</p>
                </div>
                <button onClick={()=>setKbUploading(true)} style={{ padding:'12px 22px', background:'rgba(139,92,246,.12)', border:'1px solid rgba(139,92,246,.3)', borderRadius:14, color:'#a78bfa', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>+ Upload</button>
              </div>
              {kbUploading && (
                <div style={{ ...S.card, marginBottom:20 }} className="fade-up">
                  <input placeholder="Document name (e.g. Kerala Cooperative Act)" value={kbUploadName} onChange={e=>setKbUploadName(e.target.value)} style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:12 }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>{if(kbUploadName.trim()){setKbDocs(d=>[...d,{id:Date.now(),category:'general',name:kbUploadName.endsWith('.pdf')?kbUploadName:kbUploadName+'.pdf',size:'—',date:new Date().toISOString().slice(0,10),pages:0}]);setKbUploadName('');setKbUploading(false);}}} style={{ padding:'9px 22px', background:'#8b5cf6', border:'none', borderRadius:10, color:'#fff', fontSize:11, fontWeight:900, cursor:'pointer' }}>Add</button>
                    <button onClick={()=>{setKbUploading(false);setKbUploadName('');}} style={{ padding:'9px 22px', background:'transparent', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, color:'#94a3b8', fontSize:11, fontWeight:900, cursor:'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
              <input value={kbSearch} onChange={e=>setKbSearch(e.target.value)} placeholder="Search documents…" style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'11px 14px', fontSize:13, marginBottom:20, display:'block', boxSizing:'border-box' }} />
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
                {kbDocs.filter(d=>!kbSearch||d.name.toLowerCase().includes(kbSearch.toLowerCase())).map(doc=>(
                  <div key={doc.id} style={{ ...S.card, padding:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>{doc.name}</div>
                    <div style={{ fontSize:10, color:'#475569', marginBottom:12 }}>{doc.category} · {doc.size} · {doc.date}</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button style={{ flex:1, padding:'7px 0', background:'rgba(139,92,246,.08)', border:'1px solid rgba(139,92,246,.2)', borderRadius:9, color:'#a78bfa', fontSize:10, fontWeight:700, cursor:'pointer' }}>Use in AI</button>
                      <button onClick={()=>setKbDocs(d=>d.filter(x=>x.id!==doc.id))} style={{ padding:'7px 12px', background:'rgba(239,68,68,.07)', border:'1px solid rgba(239,68,68,.15)', borderRadius:9, color:'#f87171', fontSize:10, fontWeight:700, cursor:'pointer' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WRITING DESK */}
          {view==='writing-desk' && (
            <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ background:'#070b14', borderBottom:'1px solid rgba(255,255,255,.06)', padding:'9px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontSize:8, color:'#f59e0b', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase' }}>AI Drafting Studio</div>
                  <div style={{ fontSize:14, fontWeight:900, fontStyle:'italic', color:'#e2e8f0' }}>Writing <span style={{ color:'#475569', fontStyle:'normal' }}>Desk</span></div>
                </div>
                <div style={{ display:'flex', background:'rgba(255,255,255,.04)', borderRadius:9, padding:3, gap:2 }}>
                  {[['split','Split'],['draft','Draft'],['chat','AI Chat']].map(([v,l])=>(
                    <button key={v} onClick={()=>setDeskView(v)} style={{ padding:'4px 11px', borderRadius:7, background:deskView===v?'#1e293b':'transparent', border:deskView===v?'1px solid rgba(255,255,255,.08)':'1px solid transparent', color:deskView===v?'#e2e8f0':'#475569', fontSize:9, fontWeight:800, cursor:'pointer', textTransform:'uppercase' }}>{l}</button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8, marginLeft:'auto', alignItems:'center' }}>
                  {isSpeaking && <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)', borderRadius:20 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'pulse2 .8s infinite' }} />
                    <span style={{ fontSize:9, fontWeight:900, color:'#10b981', textTransform:'uppercase' }}>Reading</span>
                    <button onClick={()=>{window.speechSynthesis?.cancel();setIsSpeaking(false);}} style={{ background:'none', border:'none', color:'#10b981', cursor:'pointer', fontSize:11, padding:0, marginLeft:2 }}>■</button>
                  </div>}
                  {voiceListening && <span style={{ fontSize:9, color:'#ef4444', fontWeight:900, animation:'pulse2 1s infinite' }}>🎙 Listening…</span>}
                </div>
              </div>
              {/* Page bar */}
              <div style={{ background:'#050810', borderBottom:'1px solid rgba(255,255,255,.05)', padding:'7px 16px', display:'flex', alignItems:'center', gap:6, flexShrink:0, overflowX:'auto' }}>
                <span style={{ fontSize:8, fontWeight:900, color:'#334155', textTransform:'uppercase', letterSpacing:'0.2em', marginRight:4, whiteSpace:'nowrap' }}>Pages</span>
                {draftPages.map((_,i)=>(
                  <button key={i} onClick={()=>setCurrentPage(i+1)} style={{ minWidth:32, height:28, borderRadius:7, background:currentPage===i+1?'#6366f1':'rgba(255,255,255,.04)', border:`1px solid ${currentPage===i+1?'#818cf8':'rgba(255,255,255,.06)'}`, color:currentPage===i+1?'#fff':'#475569', fontSize:10, fontWeight:900, cursor:'pointer' }}>{i+1}</button>
                ))}
                {draftPages.length<MAX_PAGES && <button onClick={()=>{setDraftPages(p=>[...p,`PAGE ${p.length+1}\n\n[Continue drafting here…]`]);setCurrentPage(draftPages.length+1);}} style={{ minWidth:32, height:28, borderRadius:7, background:'rgba(16,185,129,.06)', border:'1px dashed rgba(16,185,129,.2)', color:'#10b981', fontSize:14, fontWeight:900, cursor:'pointer' }}>+</button>}
                <button onClick={()=>isSpeaking?(window.speechSynthesis?.cancel(),setIsSpeaking(false)):readPageAloud()} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, padding:'5px 11px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:9, color:'#64748b', fontSize:9, fontWeight:900, cursor:'pointer', whiteSpace:'nowrap' }}>
                  {isSpeaking?'■ Stop':'▶ Read'}
                </button>
              </div>
              {/* Content */}
              <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
                {(deskView==='split'||deskView==='draft') && (
                  <div style={{ flex:deskView==='draft'?1:'0 0 52%', display:'flex', flexDirection:'column', borderRight:deskView==='split'?'1px solid rgba(255,255,255,.05)':'none', overflow:'hidden' }}>
                    <div style={{ flex:1, overflowY:'scroll', background:'#0d1117', padding:'28px 32px 60px', position:'relative' }}>
                      {!draftEditMode ? (
                        <>
                          {(draftPages[currentPage-1]||'').split('\n').map((line,i)=>(
                            <p key={i} style={{ margin:line.trim()===''?'0 0 8px':'0 0 4px', fontFamily:"'Courier New',monospace", fontSize:12.5, lineHeight:1.85, color:line===line.toUpperCase()&&line.trim().length>2?'#e2e8f0':'#cbd5e1', fontWeight:line===line.toUpperCase()&&line.trim().length>2?700:400, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{line||'\u00A0'}</p>
                          ))}
                          <button onClick={()=>setDraftEditMode(true)} style={{ position:'sticky', bottom:20, left:'50%', transform:'translateX(-50%)', padding:'8px 20px', background:'rgba(245,158,11,.9)', border:'none', borderRadius:20, color:'#000', fontSize:10, fontWeight:900, cursor:'pointer' }}>✎ Edit Page</button>
                        </>
                      ) : (
                        <div style={{ height:'100%', display:'flex', flexDirection:'column', gap:10 }}>
                          <textarea autoFocus value={draftPages[currentPage-1]||''} onChange={e=>setDraftPages(p=>p.map((pg,i)=>i===currentPage-1?e.target.value:pg))} style={{ flex:1, background:'transparent', border:'1px solid rgba(245,158,11,.2)', outline:'none', color:'#cbd5e1', fontFamily:"'Courier New',monospace", fontSize:12.5, lineHeight:1.9, padding:'8px 12px', resize:'none', borderRadius:8 }} />
                          <button onClick={()=>setDraftEditMode(false)} style={{ padding:'8px 20px', background:'#6366f1', border:'none', borderRadius:9, color:'#fff', fontSize:10, fontWeight:900, cursor:'pointer' }}>✓ Done Editing</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(deskView==='split'||deskView==='chat') && (
                  <div style={{ flex:deskView==='chat'?1:'0 0 48%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                    <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,.04)', background:'#0a0f1d', display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
                      <span style={{ fontSize:9, fontWeight:900, color:'#94a3b8', letterSpacing:'0.12em', textTransform:'uppercase' }}>AI Drafting Assistant</span>
                      <div style={{ display:'flex', gap:5, marginLeft:'auto' }}>
                        {['Add clause','Read draft','Cite section'].map(s=>(
                          <button key={s} onClick={()=>sendDeskChat(s)} style={{ padding:'3px 8px', background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.12)', borderRadius:20, color:'#6366f1', fontSize:8, fontWeight:700, cursor:'pointer' }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div ref={deskChatRef} style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:9 }}>
                      {deskChatHistory.map((msg,i)=>(
                        <div key={i} className="fade-up" style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start' }}>
                          <div style={{ maxWidth:'85%', padding:'9px 13px', borderRadius:msg.role==='user'?'14px 14px 4px 14px':'4px 14px 14px 14px', background:msg.role==='user'?'rgba(99,102,241,.14)':'rgba(255,255,255,.04)', border:`1px solid ${msg.role==='user'?'rgba(99,102,241,.25)':'rgba(255,255,255,.06)'}`, fontSize:12, lineHeight:1.65, color:msg.role==='user'?'#c7d2fe':'#cbd5e1', whiteSpace:'pre-wrap' }}>{msg.text}</div>
                        </div>
                      ))}
                      {deskLoading && <div style={{ display:'flex', gap:5, padding:'9px 13px', background:'rgba(255,255,255,.04)', borderRadius:'4px 14px 14px 14px', width:'fit-content' }}>
                        {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#475569', animation:'pulse2 1.2s infinite', animationDelay:`${i*0.2}s` }}/>)}
                      </div>}
                    </div>
                    <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,.05)', display:'flex', gap:7, background:'#070b14' }}>
                      <textarea value={deskInput} onChange={e=>setDeskInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendDeskChat();}}} placeholder="Ask AI to draft, add clause, cite law…" rows={2} style={{ flex:1, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:11, padding:'9px 13px', fontSize:12, resize:'none' }} />
                      <button onClick={voiceListening?()=>{recognitionRef.current?.stop();setVoiceListening(false);}:startVoice} style={{ padding:'9px 12px', background:voiceListening?'rgba(239,68,68,.15)':'rgba(255,255,255,.05)', border:`1px solid ${voiceListening?'rgba(239,68,68,.3)':'rgba(255,255,255,.08)'}`, borderRadius:11, color:voiceListening?'#ef4444':'#475569', fontSize:14, cursor:'pointer' }}>🎙</button>
                      <button onClick={()=>sendDeskChat()} style={{ padding:'9px 16px', background:'#6366f1', border:'none', borderRadius:11, color:'#fff', fontSize:10, fontWeight:900, cursor:'pointer' }}>Send</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WEB SEARCH */}
          {view==='search' && (
            <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:9, color:'#8b5cf6', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:4 }}>Powered by Serper.dev + AI Summary</div>
                <h2 style={{ fontSize:32, fontWeight:900, fontStyle:'italic', margin:0 }}>Legal <span style={{ color:'#475569', fontStyle:'normal' }}>Web Search</span></h2>
              </div>
              <div style={{ display:'flex', gap:10, marginBottom:24 }}>
                <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()} placeholder="Search Indian laws, cases, acts…" style={{ flex:1, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'13px 18px', fontSize:14 }} />
                <button onClick={doSearch} disabled={searchLoading} style={{ padding:'13px 24px', background:'#8b5cf6', border:'none', borderRadius:14, color:'#fff', fontSize:11, fontWeight:900, cursor:'pointer' }}>
                  {searchLoading ? <span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> : 'Search'}
                </button>
              </div>
              {searchResults && (
                <div>
                  {searchResults.summary && (
                    <div style={{ ...S.card, marginBottom:20, background:'rgba(139,92,246,.04)', border:'1px solid rgba(139,92,246,.15)' }}>
                      <div style={{ fontSize:9, color:'#8b5cf6', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:10 }}>AI Summary</div>
                      <p style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{searchResults.summary}</p>
                    </div>
                  )}
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {searchResults.results?.map((r,i) => (
                      <a key={i} href={r.link} target="_blank" rel="noopener noreferrer" style={{ ...S.card, display:'block', textDecoration:'none' }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#818cf8', marginBottom:4 }}>{r.title}</div>
                        <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5, marginBottom:6 }}>{r.snippet}</div>
                        <div style={{ fontSize:10, color:'#334155' }}>{r.link?.slice(0,60)}…</div>
                      </a>
                    ))}
                  </div>
                  {searchResults.results?.length===0 && !searchResults.summary && (
                    <div style={{ textAlign:'center', padding:48, color:'#334155' }}>No results found.</div>
                  )}
                </div>
              )}
              {!searchResults && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                  {['IPC Section 420','CPC Order XXXIX','Kerala Land Reforms Act','POCSO Act provisions','GST on legal services'].map(q=>(
                    <button key={q} onClick={()=>{setSearchQuery(q);}} style={{ padding:'8px 16px', background:'rgba(139,92,246,.08)', border:'1px solid rgba(139,92,246,.15)', borderRadius:20, color:'#a78bfa', fontSize:12, fontWeight:600, cursor:'pointer' }}>{q}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TRANSLATE (Sarvam AI) */}
          {view==='translate' && (
            <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:9, color:'#f59e0b', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:4 }}>Powered by Sarvam AI</div>
                <h2 style={{ fontSize:32, fontWeight:900, fontStyle:'italic', margin:0 }}>Local Language <span style={{ color:'#475569', fontStyle:'normal' }}>Translation</span></h2>
                <p style={{ fontSize:12, color:'#475569', marginTop:6 }}>Translate legal content into Indian languages using Sarvam AI (Gemini fallback if unavailable)</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div style={S.card}>
                  <div style={{ fontSize:9, color:'#f59e0b', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>English Input</div>
                  <textarea
                    value={translateInput}
                    onChange={e=>setTranslateInput(e.target.value)}
                    placeholder="Enter legal text to translate…"
                    rows={8}
                    style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'12px 14px', fontSize:13, resize:'none', boxSizing:'border-box', color:'#e2e8f0', outline:'none', fontFamily:'inherit' }}
                  />
                  <div style={{ display:'flex', gap:10, marginTop:12, alignItems:'center' }}>
                    <button
                      onClick={()=>{
                        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                        if (!SR) { alert('Speech recognition not supported.'); return; }
                        const rec = new SR();
                        rec.lang = 'en-IN'; rec.continuous = false; rec.interimResults = false;
                        rec.onresult = (e) => setTranslateInput(t => (t + ' ' + e.results[0][0].transcript).trim());
                        rec.start();
                      }}
                      title="Dictate text to translate"
                      style={{ padding:'9px 12px', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:10, color:'#f59e0b', fontSize:14, cursor:'pointer', flexShrink:0 }}
                    >🎙</button>
                    <select value={sarvamLang} onChange={e=>setSarvamLang(e.target.value)} style={{ flex:1, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'9px 12px', fontSize:12, color:'#e2e8f0', outline:'none', fontFamily:'inherit' }}>
                      {LANGUAGES.map(l=><option key={l.code} value={l.code} style={{ background:'#0a0f1d' }}>{l.label}</option>)}
                    </select>
                    <button onClick={()=>translateText(translateInput)} disabled={translating||!translateInput.trim()} style={{ padding:'9px 20px', background:'#f59e0b', border:'none', borderRadius:11, color:'#000', fontSize:11, fontWeight:900, cursor:'pointer', opacity:translating||!translateInput.trim()?0.5:1 }}>
                      {translating?'Translating…':'Translate →'}
                    </button>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={{ fontSize:9, color:'#10b981', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>Translated Output — {LANGUAGES.find(l=>l.code===sarvamLang)?.label}</div>
                  <div style={{ minHeight:200, background:'rgba(255,255,255,.03)', borderRadius:12, padding:'12px 14px', fontSize:14, lineHeight:1.8, color:'#94a3b8' }}>
                    {translating ? (
                      <div style={{ display:'flex', alignItems:'center', gap:8, opacity:.6 }}>
                        <div style={{ width:16, height:16, border:'2px solid rgba(16,185,129,.3)', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
                        Translating with Sarvam AI…
                      </div>
                    ) : translatedText || <span style={{ color:'#334155', fontStyle:'italic' }}>Translation will appear here…</span>}
                  </div>
                  {translatedText && (
                    <div style={{ marginTop:12, display:'flex', gap:8 }}>
                      <button onClick={()=>navigator.clipboard.writeText(translatedText)} style={{ padding:'7px 16px', background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)', borderRadius:9, color:'#10b981', fontSize:10, fontWeight:700, cursor:'pointer' }}>📋 Copy</button>
                      <button onClick={()=>{
                        const utt = new SpeechSynthesisUtterance(translatedText);
                        const langMap = { 'hi-IN':'hi-IN','ta-IN':'ta-IN','te-IN':'te-IN','kn-IN':'kn-IN','ml-IN':'ml-IN','mr-IN':'mr-IN','bn-IN':'bn-IN','gu-IN':'gu-IN' };
                        utt.lang = langMap[sarvamLang] || sarvamLang;
                        utt.rate = 0.9;
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utt);
                      }} style={{ padding:'7px 16px', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:9, color:'#f59e0b', fontSize:10, fontWeight:700, cursor:'pointer' }}>🔊 Speak</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {view==='notifications' && (
            <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
              <div style={{ marginBottom:22 }}>
                <div style={{ fontSize:9, color:'#6366f1', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:4 }}>Updates & Alerts</div>
                <h2 style={{ fontSize:32, fontWeight:900, fontStyle:'italic', margin:0 }}>Notifications</h2>
              </div>

              {/* Affiliate notifications prominently */}
              {notifications.filter(n=>n.type==='affiliate'||n.type==='affiliate_portal').map(n=>(
                <div key={n._id||n.id} className="fade-up" style={{ ...S.card, marginBottom:14, borderColor:'rgba(245,158,11,.3)', background:'rgba(245,158,11,.04)' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                    <div style={{ fontSize:24 }}>💰</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, color:'#f59e0b', fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>{n.type==='affiliate_portal'?'Commission Portal':'Affiliate Link'}</div>
                      <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{n.message}</p>
                      {n.type==='affiliate_portal' && (
                        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                          <div style={{ fontSize:12, color:'#94a3b8', background:'rgba(0,0,0,.3)', borderRadius:8, padding:'6px 12px', fontFamily:'monospace' }}>{window.location.origin}/signup?ref={userData?.affiliateCode}</div>
                          <button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${userData?.affiliateCode}`)} style={{ padding:'6px 14px', background:'rgba(245,158,11,.15)', border:'1px solid rgba(245,158,11,.3)', borderRadius:8, color:'#f59e0b', fontSize:10, fontWeight:700, cursor:'pointer' }}>Copy</button>
                        </div>
                      )}
                      {n.link && n.type==='affiliate' && (
                        <div style={{ marginTop:8 }}>
                          <div style={{ fontSize:11, color:'#f59e0b', fontWeight:700, marginBottom:6 }}>📱 This is your affiliate link — paste it on social media to gain commission:</div>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <div style={{ flex:1, fontSize:12, color:'#94a3b8', background:'rgba(0,0,0,.3)', borderRadius:8, padding:'6px 12px', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.link}</div>
                            <button onClick={()=>navigator.clipboard.writeText(n.link)} style={{ padding:'6px 14px', background:'rgba(245,158,11,.15)', border:'1px solid rgba(245,158,11,.3)', borderRadius:8, color:'#f59e0b', fontSize:10, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>Copy</button>
                          </div>
                        </div>
                      )}
                    </div>
                    {!n.read && <button onClick={()=>markRead(n._id||n.id)} style={{ padding:'5px 12px', background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', borderRadius:8, color:'#f59e0b', fontSize:10, fontWeight:700, cursor:'pointer', flexShrink:0 }}>Mark Read</button>}
                  </div>
                </div>
              ))}

              {/* Other notifications */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {notifications.filter(n=>n.type!=='affiliate'&&n.type!=='affiliate_portal').map(n=>(
                  <div key={n._id||n.id} className="fade-up" style={{ ...S.card, display:'flex', alignItems:'center', gap:14, borderColor:n.read?'rgba(255,255,255,.05)':'rgba(99,102,241,.2)' }}>
                    <div style={{ width:9, height:9, borderRadius:'50%', background:n.read?'#334155':'#6366f1', flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:n.read?400:600, color:n.read?'#64748b':'#e2e8f0' }}>{n.message}</p>
                      <p style={{ margin:'3px 0 0', fontSize:10, color:'#334155' }}>{n.createdAt?.slice(0,10)}</p>
                    </div>
                    {!n.read && <button onClick={()=>markRead(n._id||n.id)} style={{ padding:'5px 13px', background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)', borderRadius:9, color:'#818cf8', fontSize:10, fontWeight:700, cursor:'pointer' }}>Mark Read</button>}
                  </div>
                ))}
              </div>
              {notifications.length===0 && <div style={{ ...S.card, textAlign:'center', padding:48, color:'#334155', fontSize:13 }}>No notifications yet.</div>}
            </div>
          )}

          {/* SUPPORT */}
          {view==='support' && (
            <div style={{ height:'100%', display:'flex', flexDirection:'column', padding:24, overflow:'hidden' }}>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:9, color:'#f59e0b', fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:4 }}>Nexus Support System</div>
                <h2 style={{ fontSize:26, fontWeight:900, fontStyle:'italic', margin:0 }}>Help<span style={{ color:'#475569', fontStyle:'normal' }}> Desk</span></h2>
              </div>
              <div ref={supportRef} style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                {supportMsgs.map((msg,i)=>(
                  <div key={i} className="fade-up" style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start', gap:8 }}>
                    {msg.role==='ai' && <div style={{ width:30, height:30, borderRadius:9, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f59e0b', fontSize:10, fontWeight:900, flexShrink:0 }}>AI</div>}
                    <div style={{ maxWidth:'76%', padding:'11px 15px', borderRadius:msg.role==='user'?'18px 18px 4px 18px':'4px 18px 18px 18px', background:msg.role==='user'?'rgba(99,102,241,.12)':'rgba(255,255,255,.04)', border:`1px solid ${msg.role==='user'?'rgba(99,102,241,.2)':'rgba(255,255,255,.06)'}`, fontSize:13, lineHeight:1.6, color:'#cbd5e1' }}>{msg.text}</div>
                  </div>
                ))}
                {supportLoading && <div style={{ display:'flex', gap:5, padding:'11px 15px', background:'rgba(255,255,255,.04)', borderRadius:'4px 18px 18px 18px', width:'fit-content' }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#475569', animation:'pulse2 1.2s infinite', animationDelay:`${i*0.2}s` }}/>)}
                </div>}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <input value={supportInput} onChange={e=>setSupportInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendSupport()} placeholder="Describe your issue…" style={{ flex:1, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:13, padding:'11px 15px', fontSize:13 }} />
                <button onClick={sendSupport} style={{ padding:'11px 20px', background:'#f59e0b', border:'none', borderRadius:13, color:'#000', fontSize:11, fontWeight:900, cursor:'pointer' }}>Send</button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );

}
