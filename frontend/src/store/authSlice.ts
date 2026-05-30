import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Load from localStorage (simulate JWT persistence)
const savedToken = localStorage.getItem('ef_token');
const savedUser = localStorage.getItem('ef_user');

const initialState: AuthState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken,
  isAuthenticated: !!savedToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      // Persist token (simulate JWT storage)
      localStorage.setItem('ef_token', action.payload.token);
      localStorage.setItem('ef_user', JSON.stringify(action.payload));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('ef_token');
      localStorage.removeItem('ef_user');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
