import { create } from 'zustand';

type ReportTab = 'transactions' | 'inventory';
type ReportFilter = 'week' | 'month' | 'all';

interface ReportState {
  reportTab: ReportTab;
  reportFilter: ReportFilter;
  setReportTab: (tab: ReportTab) => void;
  setReportFilter: (filter: ReportFilter) => void;
}

export const useReportStore = create<ReportState>()((set) => ({
  reportTab: 'transactions',
  reportFilter: 'week',

  setReportTab: (tab) => set({ reportTab: tab }),
  setReportFilter: (filter) => set({ reportFilter: filter }),
}));
