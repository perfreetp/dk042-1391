import { create } from 'zustand';
import type { UserInfo, VerifyRecord, ReportRecord, DailyStats, PartInfo } from '@/types';
import { mockVerifyRecords, mockReportRecords, mockDailyStats, mockCurrentUser, mockParts } from '@/data/mockData';

interface AppState {
  currentUser: UserInfo;
  dailyStats: DailyStats;
  verifyRecords: VerifyRecord[];
  reportRecords: ReportRecord[];
  parts: PartInfo[];
  pendingVerifyCount: number;
  setCurrentUser: (user: UserInfo) => void;
  addVerifyRecord: (record: VerifyRecord) => void;
  addReportRecord: (record: ReportRecord) => void;
  queryPartBySerial: (serial: string) => PartInfo | undefined;
  refreshStats: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  dailyStats: mockDailyStats,
  verifyRecords: mockVerifyRecords,
  reportRecords: mockReportRecords,
  parts: mockParts,
  pendingVerifyCount: 3,

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
    set({
      verifyRecords: newRecords,
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
    set({
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
  }
}));
