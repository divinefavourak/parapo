import { mockDashboardData } from '../features/dashboard/mockData';
import { DashboardData } from '../features/dashboard/types';

// Ready for React Query wiring when a real API is available.
export function useDashboard(): { data: DashboardData; isLoading: boolean } {
  return { data: mockDashboardData, isLoading: false };
}
