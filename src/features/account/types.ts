export interface PayWallet {
  user_id: string;
  wallet_id: string;
  balance: string;
  currency: string;
  account: {
    account_number: string;
    account_name: string;
    bank_name: string;
    status: string;
  };
  settlement_wallet_id: string | null;
}
export interface AccountSummary {
  settlement: {
    settlement_wallet_id: string;
    pending_balance: string;
    settled_balance: string;
    total_balance: string;
    currency: string;
  };
  outstandingFeeMinor: number;
  provisioning: string;
}
export interface WalletSummary {
  wallet: PayWallet;
  provisioning: string;
}
export interface SettlementEntry {
  id: string;
  source: "RIDER_FULFILLED" | "CUSTOMER_LINK";
  sourceReference: string;
  counterpartyName?: string;
  totalAmountMinor: number;
  earningsMinor: number;
  currency: string;
  status: string;
  createdAt: string;
}
export interface WalletTransaction {
  transaction_id: string;
  created_at: string;
  narration?: string;
  amount: string;
  direction: string;
  status: string;
  type: string;
  transfer_scope?: string | null;
  charges?: string;
  stamp_duty?: string;
  balance_before?: string;
  balance_after?: string;
  provider_reference?: string | null;
  provider_response_code?: string | null;
  counterparty_account_number?: string | null;
  destination?: {
    account_number?: string;
    bank_name?: string;
    account_name?: string;
  } | null;
  executed_at?: string | null;
  vendor_name?: string;
  receipt_available?: boolean;
}
export interface Statement {
  data: WalletTransaction[];
  next_cursor: string | null;
}
export interface Bank {
  code: string;
  name: string;
  long_code: string;
}
