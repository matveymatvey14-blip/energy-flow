import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../store/toastSlice';

const ToastContainer: React.FC = () => {
  const toasts = useSelector((state: any) => state.toast.toasts);
  const dispatch = useDispatch();

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        dispatch(removeToast(toasts[0].id));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts, dispatch]);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 2147483647,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {toasts.map((t: any) => (
        <div
          key={t.id}
          onClick={() => dispatch(removeToast(t.id))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            borderRadius: '12px',
            minWidth: '280px',
            maxWidth: '380px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#ffffff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            background: t.type === 'success'
              ? 'rgba(30,60,10,0.97)'
              : t.type === 'error'
              ? 'rgba(80,10,10,0.97)'
              : 'rgba(10,30,80,0.97)',
            border: t.type === 'success'
              ? '1.5px solid #c8f000'
              : t.type === 'error'
              ? '1.5px solid #f87171'
              : '1.5px solid #60a5fa',
          }}
        >
          <span style={{
            fontSize: '18px',
            color: t.type === 'success' ? '#c8f000'
              : t.type === 'error' ? '#f87171'
              : '#60a5fa',
          }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
