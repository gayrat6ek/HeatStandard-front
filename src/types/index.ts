// User types
export interface User {
  id: string;
  phone_number: string;
  username: string | null;
  telegram_id: string | null;
  full_name: string | null;
  role: 'admin' | 'user';
  current_lang: 'uz' | 'ru' | 'en';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Organization types
export interface Organization {
  id: string;
  iiko_id: string;
  name: string;
  country: string | null;
  restaurant_address: string | null;
  timezone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Group types (replaces Category/Subcategory)
export interface Group {
  id: string;
  iiko_id: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_uz: string | null;
  description_ru: string | null;
  description_en: string | null;
  parent_group_id: string | null;
  order: number;
  organization_id: string;
  is_included_in_menu: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product types
export interface Product {
  id: string;
  iiko_id: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_uz: string | null;
  description_ru: string | null;
  description_en: string | null;
  price: number;
  images: string[];
  group_id: string | null;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Order types
export interface OrderItemResponse {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  order_number: number;
  iiko_id: string | null;
  organization_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  status: 'pending' | 'sent_to_iiko' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'declined';
  total_amount: number;
  notes?: string | null;
  telegram_message_id?: number | null;
  items?: OrderItemResponse[];
  created_at: string;
  updated_at: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

