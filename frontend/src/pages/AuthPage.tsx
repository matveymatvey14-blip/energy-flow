import React, { useState } from 'react';
import "../App.css";
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useToast } from '../hooks/index';
import { loginSuccess } from '../store/authSlice';
import { api } from '../api/index';

// ── Validation Schemas ────────────────────────────────────────────────────────
const loginSchema = yup.object({
  login:    yup.string().required('Введите логин').min(3, 'Минимум 3 символа'),
  password: yup.string().required('Введите пароль').min(6, 'Минимум 6 символов'),
});

const registerSchema = yup.object({
  name:     yup.string().required('Введите имя').min(2, 'Минимум 2 символа'),
  login:    yup.string().required('Введите логин').min(3, 'Минимум 3 символа'),
  password: yup.string().required('Введите пароль').min(6, 'Минимум 6 символов'),
  confirm:  yup.string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref('password')], 'Пароли не совпадают'),
});

type LoginData    = yup.InferType<typeof loginSchema>;
type RegisterData = yup.InferType<typeof registerSchema>;

// ── Field Component ───────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  register: any;
}> = ({ label, type = 'text', placeholder, error, register }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      display: 'block', fontFamily: 'Inter,sans-serif',
      fontSize: 11, fontWeight: 500, letterSpacing: '.12em',
      textTransform: 'uppercase' as const,
      color: error ? '#f87171' : 'rgba(255,255,255,.4)',
      marginBottom: 7,
    }}>{label}</label>
    <input
      {...register}
      type={type}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: `rgba(255,255,255,${error ? '.08' : '.05'})`,
        border: `1px solid ${error ? '#f87171' : 'rgba(255,255,255,.1)'}`,
        borderRadius: 50, padding: '13px 20px',
        fontFamily: 'Inter,sans-serif', fontSize: 14,
        color: '#fff', outline: 'none', boxSizing: 'border-box' as const,
        transition: 'border-color .2s',
      }}
    />
    {error && (
      <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#f87171', marginTop: 5, paddingLeft: 8 }}>
        ⚠ {error}
      </p>
    )}
  </div>
);

// ── Auth Page ─────────────────────────────────────────────────────────────────
const AuthPage: React.FC = () => {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const toast     = useToast();
  const [tab, setTab] = useState<'login'|'register'>('login');
  const [loading, setLoading] = useState(false);

  const { register: regL, handleSubmit: hsL, formState: { errors: eL }, reset: resetL } =
    useForm<LoginData>({ resolver: yupResolver(loginSchema) });

  const { register: regR, handleSubmit: hsR, formState: { errors: eR }, reset: resetR } =
    useForm<RegisterData>({ resolver: yupResolver(registerSchema) });

  const handleLogin = async (data: LoginData) => {
    setLoading(true);
    try {
      const user = await api.login(data.login, data.password);
      dispatch(loginSuccess(user));
      toast.success(`Добро пожаловать, ${user.name}!`);
      navigate('/cabinet');
    } catch (err: any) {
      toast.error(err.message || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setLoading(true);
    try {
      const user = await api.register(data.name, data.login, data.password);
      dispatch(loginSuccess(user));
      toast.success('Регистрация прошла успешно!');
      navigate('/cabinet');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: 'login'|'register') => {
    setTab(t);
    resetL(); resetR();
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0e0a06',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Inter,sans-serif',
    }}>
      {/* Background */}
      <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'rgba(200,240,0,.05)', filter:'blur(80px)', top:'-5%', left:'-10%' }} />
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(200,240,0,.03)', filter:'blur(60px)', bottom:'5%', right:'-5%' }} />
      </div>

      <div style={{ width:'100%', maxWidth:400, position:'relative', zIndex:1 }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,.5)', fontFamily:'Inter,sans-serif', fontSize:13, cursor:'pointer', marginBottom:24, display:'flex', alignItems:'center', gap:6, padding:0, transition:'color .2s' }}
          onMouseEnter={e => (e.currentTarget.style.color='#fff')}
          onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,.5)')}
        >
          ← На главную
        </button>

        {/* Card */}
        <div style={{
          background:'#1e1810', border:'1px solid rgba(255,255,255,.1)',
          borderRadius:20, padding:'36px 40px',
          boxShadow:'0 40px 80px rgba(0,0,0,.6)', position:'relative',
        }}>
          <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:2, background:'linear-gradient(to right,transparent,#c8f000,transparent)', borderRadius:2 }} />

          {/* Tabs */}
          <div style={{ display:'flex', gap:24, marginBottom:28, borderBottom:'1px solid rgba(255,255,255,.08)' }}>
            {(['login','register'] as const).map(t => (
              <button key={t} onClick={() => switchTab(t)} style={{
                background:'none', border:'none',
                borderBottom:`2px solid ${tab===t?'#c8f000':'transparent'}`,
                paddingBottom:12, marginBottom:-1,
                fontFamily:'Inter,sans-serif', fontSize:15, fontWeight:500,
                color: tab===t ? '#fff' : 'rgba(255,255,255,.35)',
                cursor:'pointer', transition:'all .2s',
              }}>
                {t === 'login' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={hsL(handleLogin)}>
              <Field label="Логин" placeholder="Ваш логин" register={regL('login')} error={eL.login?.message} />
              <Field label="Пароль" type="password" placeholder="Пароль" register={regL('password')} error={eL.password?.message} />
              <button type="submit" disabled={loading} style={{
                width:'100%', marginTop:16, padding:14,
                background: loading ? 'rgba(200,240,0,.4)' : '#c8f000',
                border:'none', borderRadius:50,
                fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:600,
                color:'#0e0a06', cursor: loading ? 'not-allowed' : 'pointer',
                transition:'all .25s',
              }}>
                {loading ? 'Входим...' : 'Войти'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={hsR(handleRegister)}>
              <Field label="Имя" placeholder="Ваше имя" register={regR('name')} error={eR.name?.message} />
              <Field label="Логин" placeholder="Придумайте логин" register={regR('login')} error={eR.login?.message} />
              <Field label="Пароль" type="password" placeholder="Придумайте пароль" register={regR('password')} error={eR.password?.message} />
              <Field label="Подтверждение пароля" type="password" placeholder="Повторите пароль" register={regR('confirm')} error={eR.confirm?.message} />
              <button type="submit" disabled={loading} style={{
                width:'100%', marginTop:16, padding:14,
                background: loading ? 'rgba(200,240,0,.4)' : '#c8f000',
                border:'none', borderRadius:50,
                fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:600,
                color:'#0e0a06', cursor: loading ? 'not-allowed' : 'pointer',
                transition:'all .25s',
              }}>
                {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
