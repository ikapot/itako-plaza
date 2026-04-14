export interface TradeStatus {
  timestamp: string;
  // --- Flat Fields (Hybrid) ---
  bestBid: number;
  bestAsk: number;
  rsi: number;
  ema_trend: 'UP' | 'DOWN' | 'NEUTRAL';
  
  // --- Nested Fields (Atelier UI) ---
  price: number;
  status: 'ACTIVE' | 'IDLE' | 'INITIALIZING';
  indicators: {
    ATR: number;
    EMA_direction: 'UP' | 'DOWN' | 'NEUTRAL';
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
  
  // --- Meta ---
  error?: string; // For API-level errors
}
