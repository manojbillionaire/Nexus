import { useState, useEffect } from 'react';
import api from './api.js';
import AuthPortal from './portals/AuthPortal.jsx';
import AdvocatePortal from './portals/AdvocatePortal.jsx';
import AgencyHQPortal from './portals/AgencyHQPortal.jsx';
import AffiliatePortal from './portals/AffiliatePortal.jsx';
import PWAManager from './PWAManager.jsx';

// Role → allowed portal screen
function resolveScreen(user) {
  if (!user) return 'auth';
  switch (user.role) {
    case 'agency':    return 'agency';
    case 'affiliate': return 'affiliate';
    case 'advocate':  return 'advocate';
    default:          return 'advocate'; // fallback
  }
}

function AccessDenied({ role, onLogout }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#020617', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ textAlign:'center', maxWidth:420, padding:32 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🚫</div>
        <h2 style={{ color:'#e2e8f0', fontWeight:900, fontSize:22, margin:'0 0 12px' }}>Access Denied</h2>
        <p style={{ color:'#475569', fontSize:13, lineHeight:1.7, marginBottom:24 }}>
          Your role <strong style={{ color:'#f59e0b' }}>({role})</strong> does not have permission to access this portal.
          You can only access the portal assigned to your account.
        </p>
        <button onClick={onLogout} style={{ padding:'12px 28px', background:'#6366f1', border:'none', borderRadius:12, color:'#fff', fontSize:13, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>
          ← Back to Sign In
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nj_token');
    const userData = localStorage.getItem('nj_user');
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch {}
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, user) => {
    localStorage.setItem('nj_token', token);
    localStorage.setItem('nj_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('nj_token');
    localStorage.removeItem('nj_user');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#020617' }}>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:56, height:56, background:'#f59e0b', borderRadius:16, display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:16, boxShadow:'0 8px 32px rgba(245,158,11,.35)' }}>
            <span style={{ fontSize:28, fontWeight:900, color:'#000', fontStyle:'italic' }}>T</span>
          </div>
          <div style={{ fontSize:12, color:'#475569', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase' }}>Loading Nexus Justice…</div>
        </div>
      </div>
    );
  }

  // Not logged in → show auth
  if (!currentUser) return <><PWAManager /><AuthPortal onLogin={handleLogin} /></>;

  // Role-based portal routing — strict, no cross-role access
  const screen = resolveScreen(currentUser);

  if (screen === 'agency')    return <><PWAManager /><AgencyHQPortal   user={currentUser} onLogout={handleLogout} /></>;
  if (screen === 'affiliate') return <><PWAManager /><AffiliatePortal  user={currentUser} onLogout={handleLogout} /></>;
  if (screen === 'advocate')  return <><PWAManager /><AdvocatePortal   user={currentUser} onLogout={handleLogout} /></>;

  // Unknown role — deny access
  return <AccessDenied role={currentUser.role} onLogout={handleLogout} />;
}
