import api from '@/lib/api';
import { getInclusiveEndDate } from '@/lib/utils';

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | '';
  userId?: string;
  tableNumber?: string;
}

export const getTransactions = async (filters: TransactionFilter = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', getInclusiveEndDate(filters.endDate));
  if (filters.status) params.append('status', filters.status);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.tableNumber) params.append('tableNumber', filters.tableNumber);

  return api.get(`/transactions?${params.toString()}`);
};

export const getTransactionById = async (id: string) => {
  return api.get(`/transactions/${id}`);
};

export const updateTransactionStatus = async (id: string, status: string) => {
  return api.patch(`/transactions/${id}/status`, { status });
};

export const deleteTransaction = async (id: string) => {
  return api.delete(`/transactions/${id}`);
};
