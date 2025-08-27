import { Invoice, InvoiceItem, Client, Issuer, Tax } from './database';

export interface PDFGenerationOptions {
  invoice: Invoice;
  client: Client;
  issuer: Issuer;
  items: InvoiceItem[];
  tax?: Tax | null;
  currency: string;
}

export enum PDFErrorType {
  GENERATION_FAILED = 'GENERATION_FAILED',
  STORAGE_PERMISSION_DENIED = 'STORAGE_PERMISSION_DENIED',
  SHARING_UNAVAILABLE = 'SHARING_UNAVAILABLE',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  INVALID_DATA = 'INVALID_DATA',
}

export class PDFError extends Error {
  constructor(public type: PDFErrorType, message: string) {
    super(message);
    this.name = 'PDFError';
  }
}