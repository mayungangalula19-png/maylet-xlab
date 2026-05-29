export interface FundingPitch { id: string; project_id: string; amount_requested: number; equity_offered: number; status: 'active' | 'funded' | 'expired'; }
