export type Role = 'client' | 'admin';

export interface User {
  id: number;
  name: string;
  login: string;
  role: Role;
  token: string;
}

export interface Subscription {
  id: number;
  type: string;
  start: string;
  end: string;
  status: 'active' | 'frozen' | 'expired';
  daysLeft: number;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  sub: string;
  end: string;
  status: 'active' | 'frozen' | 'expired';
}

export interface Trainer {
  id: number;
  name: string;
  role: string;
  spec: string;
  exp: string;
  emoji: string;
}

export interface ScheduleItem {
  id: number;
  day: string;
  time: string;
  name: string;
  trainer: string;
  duration: string;
  spots: number;
  total: number;
  type: 'yoga' | 'hiit' | 'box' | 'cardio' | 'power';
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AuthFormData {
  name?: string;
  login: string;
  password: string;
}

export interface ApplicationFormData {
  name: string;
  phone: string;
  consent1: boolean;
  consent2: boolean;
}
