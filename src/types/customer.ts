export interface Customer {
  id: number;
  name: string;
  phone: string;
  nfcTag: string;
  points: number;
  totalSpent: number;
  joinDate: string;
}

export interface RewardsConfig {
  earnRate: number;
  redeemEvery: number;
  redeemValue: number;
  bronzeMin: number;
  silverMin: number;
  goldMin: number;
}

export type TierKey = 'gold' | 'silver' | 'bronze';

export interface TierInfo {
  key: TierKey;
  label: string;
  color: string;
  bg: string;
}
