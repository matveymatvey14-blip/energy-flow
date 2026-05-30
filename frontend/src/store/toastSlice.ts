import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Toast } from '../types';

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = { toasts: [] };

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      state.toasts.push({ ...action.payload, id: Date.now() });
    },
    removeToast(state, action: PayloadAction<number>) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
