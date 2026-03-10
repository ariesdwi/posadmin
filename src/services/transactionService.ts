import api from '@/lib/api';
import { getInclusiveEndDate } from '@/lib/utils';

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | '';
  userId?: string;
  tableNumber?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getTransactions = async (filters: TransactionFilter = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', getInclusiveEndDate(filters.endDate));
  if (filters.status) params.append('status', filters.status);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.tableNumber) params.append('tableNumber', filters.tableNumber);
  if (filters.search) params.append('transactionNumber', filters.search);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

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

export const updateTransaction = async (id: string, data: any) => {
  return api.patch(`/transactions/${id}`, data);
};

export const exportTransactionsPDF = async (filters: { startDate?: string; endDate?: string }) => {
  const params: any = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  return api.get('/reports/export/transactions', {
    params,
    responseType: 'blob',
  });
};
