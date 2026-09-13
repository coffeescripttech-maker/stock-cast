import { create } from 'zustand';

type ReportTab = 'transactions' | 'inventory';
type ReportFilter = 'day' | 'week' | 'month' | 'all' | 'custom';

interface ReportState {
  reportTab: ReportTab;
  reportFilter: ReportFilter;
  dateFrom: string; // yyyy-mm-dd for the custom range
  dateTo: string; // yyyy-mm-dd for the custom range
  setReportTab: (tab: ReportTab) => void;
  setReportFilter: (filter: ReportFilter) => void;
  setDateRange: (from: string, to: string) => void;
}

export const useReportStore = create<ReportState>()((set) => ({
  reportTab: 'transactions',
  reportFilter: 'week',
  dateFrom: '',
  dateTo: '',

  setReportTab: (tab) => set({ reportTab: tab }),
  setReportFilter: (filter) => set({ reportFilter: filter }),
  setDateRange: (from, to) => set({ dateFrom: from, dateTo: to }),
}));