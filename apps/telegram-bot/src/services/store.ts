import fs from 'node:fs';
import path from 'node:path';

export type SectorType = 'pharmacy' | 'feed' | 'seeds' | 'greenhouse' | 'machinery';

export interface UserBusinessState {
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  fullName?: string;
  phone?: string;
  sector?: SectorType;
  storeName?: string;
  region?: string;
  step: 'WAITING_NAME' | 'WAITING_PHONE' | 'WAITING_SECTOR' | 'WAITING_STORE_NAME' | 'WAITING_REGION' | 'COMPLETED';
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'businesses.json');

class BusinessStore {
  private users: Map<number, UserBusinessState> = new Map();

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        for (const [id, val] of Object.entries(data)) {
          this.users.set(Number(id), val as UserBusinessState);
        }
      }
    } catch (err) {
      console.warn('Could not load data file, starting with empty store:', err);
    }
  }

  private saveToFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const obj: Record<number, UserBusinessState> = {};
      for (const [id, val] of this.users.entries()) {
        obj[id] = val;
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving businesses to file:', err);
    }
  }

  get(telegramId: number): UserBusinessState | undefined {
    return this.users.get(telegramId);
  }

  set(telegramId: number, state: UserBusinessState) {
    this.users.set(telegramId, state);
    this.saveToFile();
  }

  delete(telegramId: number) {
    this.users.delete(telegramId);
    this.saveToFile();
  }

  isRegistered(telegramId: number): boolean {
    const user = this.users.get(telegramId);
    return !!(user && user.step === 'COMPLETED' && user.storeName && user.sector);
  }
}

export const businessStore = new BusinessStore();
