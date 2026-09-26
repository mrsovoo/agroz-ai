export type StoredDiagnosis = {
  id: number;
  userId: number | null;
  category: string;
  inputText: string | null;
  hasImage: boolean;
  diseaseName: string;
  solution: string;
  medicines: string;
  severity: string | null;
  confidence: number | null;
  source: string | null;
  viewHash: string | null;
  createdAt: Date;
};

// Node.js processlararo / requestlararo global xotirada saqlash
const globalForStore = globalThis as unknown as {
  inMemoryDiagnoses?: Map<number, StoredDiagnosis>;
};

export const inMemoryDiagnoses =
  globalForStore.inMemoryDiagnoses ?? new Map<number, StoredDiagnosis>();
globalForStore.inMemoryDiagnoses = inMemoryDiagnoses;

export function saveInMemoryDiagnosis(d: StoredDiagnosis) {
  inMemoryDiagnoses.set(d.id, d);
  // Oxirgi 100 tani saqlab turish
  if (inMemoryDiagnoses.size > 100) {
    const firstKey = inMemoryDiagnoses.keys().next().value;
    if (firstKey !== undefined) inMemoryDiagnoses.delete(firstKey);
  }
}

export function getInMemoryDiagnosis(id: number): StoredDiagnosis | undefined {
  return inMemoryDiagnoses.get(id);
}
