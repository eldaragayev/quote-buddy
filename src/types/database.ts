export interface User {
  id?: number;
  name?: string;
  business_name?: string;
}

export interface Settings {
  id?: number;
  default_currency_code?: string;
}

export interface Issuer {
  id?: number;
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_default?: number;
}

export interface Client {
  id?: number;
  name: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  shipping_address?: string;
  tags?: string;
  is_archived?: number;
  default_currency_code?: string;
  default_due_option?: DueOption;
  default_tax_id?: number;
  default_discount_type?: DiscountType;
  default_discount_value?: number;
}

export interface ClientNote {
  id?: number;
  client_id: number;
  content: string;
  created_at?: string;
}

export interface Tax {
  id?: number;
  name: string;
  rate_percent: number;
}

export interface Item {
  id?: number;
  name: string;
  rate: number;
  unit?: string;
  tax_id?: number;
}

export interface Invoice {
  id?: number;
  issuer_id: number;
  client_id: number;
  number: number;
  issued_date: string;
  due_option: DueOption;
  due_date?: string;
  currency_code: string;
  status?: InvoiceStatus;
  discount_type?: DiscountType;
  discount_value?: number;
  tax_id?: number;
  public_notes?: string;
  terms?: string;
  po_number?: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id: number;
  item_id?: number;
  name: string;
  qty: number;
  rate: number;
  position: number;
}

export interface Expense {
  id?: number;
  title: string;
  description?: string;
  amount: number;
  date: string;
  attachment_uri?: string;
  attachment_mime?: string;
}

export interface Estimate {
  id?: number;
  client_id: number;
}

export interface EstimateItem {
  id?: number;
  estimate_id: number;
  item_id?: number;
  name: string;
  qty: number;
  rate: number;
  position: number;
}

export interface AgentChat {
  id?: number;
}

export interface AgentMessage {
  id?: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentMessageAttachment {
  id?: number;
  message_id: number;
  file_uri: string;
  mime_type?: string;
}

export type DueOption = 'none' | 'on_receipt' | 'net_7' | 'net_14' | 'net_30' | 'custom';
export type DiscountType = 'percent' | 'fixed';
export type InvoiceStatus = 'unpaid' | 'paid';

export interface InvoiceWithClient extends Invoice {
  client?: Client;
  issuer?: Issuer;
  items?: InvoiceItem[];
  tax?: Tax;
}

export interface ClientWithBalance extends Client {
  outstanding?: number;
  total_billed?: number;
  last_invoice_date?: string;
  overdue_count?: number;
}

export interface EstimateWithClient extends Estimate {
  client?: Client;
  items?: EstimateItem[];
}