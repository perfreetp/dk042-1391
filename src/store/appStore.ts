import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  UserInfo,
  VerifyRecord,
  ReportRecord,
  DailyStats,
  PartInfo,
  PendingVerifyTask,
  PendingReportPrefill
} from '@/types';
import { mockVerifyRecords, mockReportRecords, mockDailyStats, mockCurrentUser, mockParts } from '@/data/mockData';
import { getStatusText } from '@/utils/format';
import dayjs from 'dayjs';

const STORAGE_KEY = 'aml_verify_store_v1';

interface PersistedState {
  verifyRecords: VerifyRecord[];
  reportRecords: ReportRecord[];
  dailyStats: DailyStats;
}

const loadPersisted = (): Partial<PersistedState> => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (!raw) return {};
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed || {};
  } catch (e) {
    console.warn('[Store] loadPersisted failed:', e);
    return {};
  }
};

const persistState = (state: PersistedState) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[Store] persistState failed:', e);
  }
};

const persisted = loadPersisted();

interface AppState {
  currentUser: UserInfo;
  dailyStats: DailyStats;
  verifyRecords: VerifyRecord[];
  reportRecords: ReportRecord[];
  parts: PartInfo[];
  pendingVerifyCount: number;
  pendingVerifyTask: PendingVerifyTask | null;
  pendingReportPrefill: PendingReportPrefill | null;
  setCurrentUser: (user: UserInfo) => void;
  addVerifyRecord: (record: VerifyRecord) => void;
  addReportRecord: (record: ReportRecord) => void;
  queryPartBySerial: (serial: string) => PartInfo | undefined;
  refreshStats: () => void;
  setPendingVerifyTask: (task: PendingVerifyTask | null) => void;
  clearPendingVerifyTask: () => void;
  setPendingReportPrefill: (prefill: PendingReportPrefill | null) => void;
  clearPendingReportPrefill: () => void;
  updateReportStatus: (id: string, status: ReportRecord['status'], handler: string, handleRemark: string) => void;
  clearAllRecords: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  dailyStats: persisted.dailyStats || mockDailyStats,
  verifyRecords: persisted.verifyRecords || mockVerifyRecords,
  reportRecords: persisted.reportRecords || mockReportRecords,
  parts: mockParts,
  pendingVerifyCount: 3,
  pendingVerifyTask: null,
  pendingReportPrefill: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  addVerifyRecord: (record) => {
    const { verifyRecords, dailyStats } = get();
    const newRecords = [record, ...verifyRecords];
    const newStats = {
      ...dailyStats,
      totalVerify: dailyStats.totalVerify + 1,
      passCount: record.status === 'pass' ? dailyStats.passCount + 1 : dailyStats.passCount,
      reviewCount: record.status === 'review' ? dailyStats.reviewCount + 1 : dailyStats.reviewCount,
      rejectCount: record.status === 'reject' ? dailyStats.rejectCount + 1 : dailyStats.rejectCount
    };
    set({ verifyRecords: newRecords, dailyStats: newStats });
    persistState({
      verifyRecords: newRecords,
      reportRecords: get().reportRecords,
      dailyStats: newStats
    });
    console.log('[Store] addVerifyRecord:', record.id, 'status:', record.status);
  },

  addReportRecord: (record) => {
    const { reportRecords, dailyStats } = get();
    const newRecords = [record, ...reportRecords];
    const newStats = {
      ...dailyStats,
      reportCount: dailyStats.reportCount + 1
    };
    set({ reportRecords: newRecords, dailyStats: newStats });
    persistState({
      verifyRecords: get().verifyRecords,
      reportRecords: newRecords,
      dailyStats: newStats
    });
    console.log('[Store] addReportRecord:', record.reportNo);
  },

  queryPartBySerial: (serial) => {
    const { parts } = get();
    const found = parts.find(p => p.serialNumber === serial || p.serialNumber.toLowerCase() === serial.toLowerCase());
    console.log('[Store] queryPartBySerial:', serial, 'found:', found ? found.partName : 'NOT FOUND');
    return found;
  },

  refreshStats: () => {
    const { verifyRecords, reportRecords } = get();
    const stats: DailyStats = {
      totalVerify: verifyRecords.length,
      passCount: verifyRecords.filter(r => r.status === 'pass').length,
      reviewCount: verifyRecords.filter(r => r.status === 'review').length,
      rejectCount: verifyRecords.filter(r => r.status === 'reject').length,
      reportCount: reportRecords.length
    };
    set({ dailyStats: stats });
    persistState({
      verifyRecords: get().verifyRecords,
      reportRecords: get().reportRecords,
      dailyStats: stats
    });
  },

  setPendingVerifyTask: (task) => set({ pendingVerifyTask: task }),
  clearPendingVerifyTask: () => set({ pendingVerifyTask: null }),
  setPendingReportPrefill: (prefill) => set({ pendingReportPrefill: prefill }),
  clearPendingReportPrefill: () => set({ pendingReportPrefill: null }),

  updateReportStatus: (id, status, handler, handleRemark) => {
    const { reportRecords } = get();
    const newRecords = reportRecords.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status,
        statusText: getStatusText(status),
        handler: handler || r.handler || 'MCC调度',
        handleRemark: handleRemark || r.handleRemark,
        handledAt: dayjs().format('YYYY-MM-DD HH:mm'),
        remark: r.remark
          ? `${r.remark}\n[${dayjs().format('MM-DD HH:mm')} ${handler}] ${handleRemark}`
          : `[${dayjs().format('MM-DD HH:mm')} ${handler}] ${handleRemark}`
      } as ReportRecord;
    });
    set({ reportRecords: newRecords });
    persistState({
      verifyRecords: get().verifyRecords,
      reportRecords: newRecords,
      dailyStats: get().dailyStats
    });
    console.log('[Store] updateReportStatus:', id, '->', status);
  },

  clearAllRecords: () => {
    const emptyStats: DailyStats = {
      totalVerify: 0,
      passCount: 0,
      reviewCount: 0,
      rejectCount: 0,
      reportCount: 0
    };
    set({ verifyRecords: [], reportRecords: [], dailyStats: emptyStats });
    persistState({ verifyRecords: [], reportRecords: [], dailyStats: emptyStats });
    console.log('[Store] clearAllRecords done');
  }
}));
