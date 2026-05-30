import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store/index';
import { addToast } from './store/toastSlice';
import { useWebSocket } from './useWebSocket';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import CabinetPage from './pages/CabinetPage';
import ProtectedRoute from './components/ProtectedRoute';

// ── Toast Container ───────────────────────────────────────────────────────────
const ToastBox: React.FC = () => {
  const toasts = useSelector((state: any) => state.toast.toasts);
  const dispatch = useDispatch();

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'toast/removeToast', payload: toasts[0].id });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts, dispatch]);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20,
      zIndex: 2147483647,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {toasts.map((t: any) => (
        <div key={t.id}
          onClick={() => dispatch({ type: 'toast/removeToast', payload: t.id })}
          style={{
            padding: '14px 20px', borderRadius: 12,
            minWidth: 280, maxWidth: 380,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            background: t.type === 'success' ? 'rgba(20,50,5,0.97)'
              : t.type === 'error' ? 'rgba(80,10,10,0.97)'
              : 'rgba(10,30,80,0.97)',
            border: `1.5px solid ${t.type === 'success' ? '#c8f000'
              : t.type === 'error' ? '#f87171' : '#60a5fa'}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <span style={{
            fontSize: 18, color: t.type === 'success' ? '#c8f000'
              : t.type === 'error' ? '#f87171' : '#60a5fa',
          }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
};

// ── Main App with WebSocket ───────────────────────────────────────────────────
const AppInner: React.FC = () => {
  const dispatch = useDispatch();
  const isAuth = useSelector((state: any) => state.auth.isAuthenticated);

  // WebSocket - real-time notifications (simulated when backend offline)
  useWebSocket(isAuth);

  useEffect(() => {
    const fired = sessionStorage.getItem('welcome_shown');
    if (!fired) {
      setTimeout(() => {
        dispatch(addToast({ message: 'Добро пожаловать в Energy Flow!', type: 'success' }));
        sessionStorage.setItem('welcome_shown', '1');
      }, 1000);
    }
  }, []); // eslint-disable-line

  return (
    <BrowserRouter>
      <ToastBox />
      <Routes>
        <Route path="/"        element={<HomePage />} />
        <Route path="/auth"    element={<AuthPage />} />
        <Route path="/cabinet" element={
          <ProtectedRoute>
            <CabinetPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const App: React.FC = () => (
  <Provider store={store}>
    <AppInner />
  </Provider>
);

export default App;
