export interface TradeStatus {
  timestamp: string;
  price: number;
  status: 'ACTIVE' | 'IDLE';
  indicators: {
    ATR: number;
    EMA_direction: 'UP' | 'DOWN';
    RSI: number;
    Z_score: number;
  };
  capital: {
    balance: number;
    gain_loss_percent: number;
  };
  history: Array<{
    side: 'BUY' | 'SELL';
    price: number;
    timestamp: string;
    amount: number;
  }>;
  ai_bias: string;
  ai_reason: string;
}
