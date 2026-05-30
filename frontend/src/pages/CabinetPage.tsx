import React, { useEffect, useState } from 'react';
import "../App.css";
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useToast } from '../hooks/index';
import { logout } from '../store/authSlice';
import { api } from '../api/index';
import { Subscription, Client } from '../types/index';

const STATUS_COLOR = { active:'#c8f000', frozen:'#60a5fa', expired:'#f87171' };
const STATUS_LABEL = { active:'Активен', frozen:'Заморожен', expired:'Истёк' };

// ── Client View ───────────────────────────────────────────────────────────────
const ClientView: React.FC = () => {
  const [subs, setSubs]     = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api.getMySubscriptions()
      .then(setSubs)
      .catch(() => toast.error('Не удалось загрузить абонементы'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={loaderStyle}>Загрузка...</div>;

  return (
    <>
      <h1 style={titleStyle}>Мой кабинет</h1>
      <p style={subtitleStyle}>Ваши активные абонементы</p>

      {subs.map(sub => (
        <div key={sub.id} style={cardStyle}
          onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(200,240,0,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.08)')}
        >
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#fff', letterSpacing:'.04em' }}>{sub.type}</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:5, fontWeight:300 }}>{sub.start} — {sub.end}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:24 }}>
            {sub.status === 'active' && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:38, color:'#c8f000', lineHeight:1 }}>{sub.daysLeft}</div>
                <div style={{ fontFamily:'Inter,sans-serif', fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em', textTransform:'uppercase' }}>дней</div>
              </div>
            )}
            <span style={{ padding:'4px 14px', borderRadius:20, fontSize:11, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' as const, background:`${STATUS_COLOR[sub.status]}18`, color:STATUS_COLOR[sub.status] }}>
              {STATUS_LABEL[sub.status]}
            </span>
          </div>
        </div>
      ))}

      <div style={{ marginTop:28, padding:'18px 22px', background:'rgba(200,240,0,0.04)', border:'1px solid rgba(200,240,0,0.12)', borderRadius:12 }}>
        <p style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:300 }}>
          💡 Для продления абонемента обратитесь на ресепшн или звоните: <span style={{ color:'#c8f000' }}>+7 937 225-9987</span>
        </p>
      </div>
    </>
  );
};

// ── Admin View ────────────────────────────────────────────────────────────────
const AdminView: React.FC = () => {
  const [clients, setClients]   = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const toast = useToast();

  useEffect(() => {
    api.getAllClients()
      .then(data => { setClients(data); toast.info('Данные клиентов загружены'); })
      .catch(() => toast.error('Не удалось загрузить клиентов'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={loaderStyle}>Загрузка...</div>;

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const stats = [
    { num: clients.length,                              lbl:'Всего' },
    { num: clients.filter(c=>c.status==='active').length,  lbl:'Активных' },
    { num: clients.filter(c=>c.status==='frozen').length,  lbl:'Заморожено' },
    { num: clients.filter(c=>c.status==='expired').length, lbl:'Истекло' },
  ];

  return (
    <>
      <h1 style={titleStyle}>Панель администратора</h1>
      <p style={subtitleStyle}>Управление клиентами и абонементами</p>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        {stats.map(s => (
          <div key={s.lbl} style={{ background:'#1e1810', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'18px 22px' }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color:'#c8f000', lineHeight:1 }}>{s.num}</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:'.1em', textTransform:'uppercase' as const, marginTop:4 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        placeholder="Поиск по имени или телефону..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'11px 18px', fontFamily:'Inter,sans-serif', fontSize:14, color:'#fff', outline:'none', width:300, marginBottom:20 }}
      />

      {/* Table */}
      <div style={{ background:'#1e1810', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['#','Клиент','Телефон','Абонемент','До','Статус'].map(h => (
                <th key={h} style={{ textAlign:'left', fontFamily:'Inter,sans-serif', fontSize:10, letterSpacing:'.15em', textTransform:'uppercase' as const, color:'rgba(200,240,0,0.6)', fontWeight:500, padding:'0 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <td style={tdStyle}><span style={{ color:'rgba(255,255,255,0.25)' }}>{i+1}</span></td>
                <td style={{ ...tdStyle, color:'#fff', fontWeight:500 }}>{c.name}</td>
                <td style={tdStyle}>{c.phone}</td>
                <td style={tdStyle}>{c.sub}</td>
                <td style={tdStyle}>{c.end}</td>
                <td style={tdStyle}>
                  <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, letterSpacing:'.06em', background:`${STATUS_COLOR[c.status]}18`, color:STATUS_COLOR[c.status] }}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ── Cabinet Page ──────────────────────────────────────────────────────────────
const CabinetPage: React.FC = () => {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const toast     = useToast();
  const user      = useAppSelector(s => s.auth.user);

  if (!user) { navigate('/auth'); return null; }

  const handleLogout = () => {
    dispatch(logout());
    toast.info('Вы вышли из аккаунта');
    navigate('/');
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0e0a06' }}>

      {/* Navbar */}
      <nav style={{ background:'#140f09', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'0 40px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#fff', letterSpacing:'.1em', cursor:'pointer' }} onClick={() => navigate('/')}>
          Energy Flow
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'#fff', fontWeight:500 }}>{user.name}</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'rgba(200,240,0,0.7)', letterSpacing:'.1em', textTransform:'uppercase' }}>
              {user.role === 'admin' ? 'Администратор' : 'Клиент'}
            </div>
          </div>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'#c8f000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#0e0a06' }}>
            {user.name[0].toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            style={{ background:'none', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'rgba(255,255,255,0.5)', fontFamily:'Inter,sans-serif', fontSize:12, padding:'6px 14px', cursor:'pointer' }}
          >
            Выйти
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="cab-body" style={{ padding:'40px', maxWidth:1100, margin:'0 auto' }}>
        {user.role === 'admin' ? <AdminView /> : <ClientView />}
      </div>
    </div>
  );
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const titleStyle:    React.CSSProperties = { fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color:'#fff', letterSpacing:'.06em', marginBottom:6 };
const subtitleStyle: React.CSSProperties = { fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:28, fontWeight:300 };
const loaderStyle:   React.CSSProperties = { color:'rgba(255,255,255,0.4)', fontFamily:'Inter,sans-serif', padding:40 };
const cardStyle:     React.CSSProperties = { background:'#1e1810', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'22px 26px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, cursor:'default', transition:'border-color .2s' };
const tdStyle:       React.CSSProperties = { padding:'14px 16px', fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.7)', borderBottom:'1px solid rgba(255,255,255,0.05)', fontWeight:300 };

export default CabinetPage;
