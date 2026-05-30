import { User, Client, Subscription } from '../types';

// Simulate JWT token generation
const mockJWT = (payload: object): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify(payload));
  const sig    = btoa('mock-signature');
  return `${header}.${body}.${sig}`;
};

// Mock users DB
const USERS = [
  { id: 1, name: 'Администратор', login: 'admin',   password: 'admin123', role: 'admin'  as const },
  { id: 2, name: 'Иван Клиентов', login: 'client',  password: 'client123', role: 'client' as const },
];

// Simulate network delay
const delay = (ms = 500) => new Promise(r => setTimeout(r, ms));

export const api = {
  // Auth
  async login(login: string, password: string): Promise<User> {
    await delay();
    const user = USERS.find(u => u.login === login && u.password === password);
    if (!user) throw new Error('Неверный логин или пароль');
    const token = mockJWT({ id: user.id, role: user.role, exp: Date.now() + 86400000 });
    return { id: user.id, name: user.name, login: user.login, role: user.role, token };
  },

  async register(name: string, login: string, password: string): Promise<User> {
    await delay();
    if (USERS.find(u => u.login === login)) throw new Error('Логин уже занят');
    if (password.length < 6) throw new Error('Пароль должен быть минимум 6 символов');
    const newUser = { id: Date.now(), name, login, password, role: 'client' as const };
    USERS.push(newUser);
    const token = mockJWT({ id: newUser.id, role: 'client', exp: Date.now() + 86400000 });
    return { id: newUser.id, name, login, role: 'client', token };
  },

  // Client subscriptions
  async getMySubscriptions(): Promise<Subscription[]> {
    await delay(300);
    return [
      { id:1, type:'Безлимит 12 месяцев', start:'01.01.2025', end:'01.01.2026', status:'active',  daysLeft:220 },
      { id:2, type:'Заморозка +3 месяца',  start:'15.06.2025', end:'15.09.2025', status:'frozen',  daysLeft:0   },
    ];
  },

  // Admin clients list
  async getAllClients(): Promise<Client[]> {
    await delay(400);
    return [
      { id:1, name:'Александр Петров',   phone:'+7 912 345-67-89', sub:'Безлимит 12 мес', end:'01.01.2026', status:'active'  },
      { id:2, name:'Мария Иванова',       phone:'+7 903 234-56-78', sub:'Безлимит 6 мес',  end:'15.08.2025', status:'active'  },
      { id:3, name:'Дмитрий Сидоров',    phone:'+7 985 123-45-67', sub:'Безлимит 12 мес', end:'20.03.2025', status:'expired' },
      { id:4, name:'Анна Козлова',        phone:'+7 916 987-65-43', sub:'Безлимит 6 мес',  end:'30.11.2025', status:'active'  },
      { id:5, name:'Сергей Новиков',      phone:'+7 926 111-22-33', sub:'Безлимит 12 мес', end:'10.07.2025', status:'frozen'  },
      { id:6, name:'Екатерина Морозова',  phone:'+7 936 444-55-66', sub:'Безлимит 12 мес', end:'05.12.2025', status:'active'  },
    ];
  },
};
