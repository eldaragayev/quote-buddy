import { DueOption } from '../types/database';

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
};

export const formatShortDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const getDaysUntilDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const getDueText = (dueDate: string | null, status: string): string | null => {
  if (!dueDate || status === 'paid') return null;
  
  const days = getDaysUntilDue(dueDate);
  
  if (days < 0) {
    return `Overdue ${Math.abs(days)}d`;
  } else if (days === 0) {
    return 'Due today';
  } else {
    return `Due in ${days}d`;
  }
};

export const getDueDateFromOption = (option: DueOption, issueDate: Date = new Date()): Date | null => {
  const date = new Date(issueDate);
  
  switch (option) {
    case 'none':
      return null;
    case 'on_receipt':
      return date;
    case 'net_7':
      date.setDate(date.getDate() + 7);
      return date;
    case 'net_14':
      date.setDate(date.getDate() + 14);
      return date;
    case 'net_30':
      date.setDate(date.getDate() + 30);
      return date;
    case 'custom':
      return null;
    default:
      return null;
  }
};

export const formatInvoiceNumber = (number: number): string => {
  return `#${number.toString().padStart(4, '0')}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};