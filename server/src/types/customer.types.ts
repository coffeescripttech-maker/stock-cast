// ---- Customer Types ----

export interface CustomerRow {
  id: number;
  name: string;
  phone: string;
  nfc_tag: string;
  points: number;
  total_spent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreateInput {
  name: string;
  phone: string;
  nfc_tag?: string;
  points?: number;
  total_spent?: number;
}

export type CustomerUpdateInput = Partial<CustomerCreateInput>;

export interface RewardsConfigRow {
  id: number;
  earn_rate: number;
  redeem_every: number;
  redeem_value: number;
  bronze_min: number;
  silver_min: number;
  gold_min: number;
  updated_by: number | null;
  updated_at: string;
}

export interface RewardsConfigUpdateInput {
  earn_rate?: number;
  redeem_every?: number;
  redeem_value?: number;
  bronze_min?: number;
  silver_min?: number;
  gold_min?: number;
}
