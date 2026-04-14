const mockGistContent = {
  "timestamp": "2026-04-14T16:53:00Z",
  "bestBid": 12345.0,
  "bestAsk": 12350.0,
  "rsi": 45.2,
  "ema_trend": "UP",
  "price": 12347.5,
  "status": "ACTIVE",
  "indicators": {
    "ATR": 12.5,
    "EMA_direction": "UP",
    "RSI": 45.2,
    "Z_score": 0.5
  },
  "capital": {
    "balance": 2100.0,
    "gain_loss_percent": 5.0
  },
  "history": [],
  "ai_bias": "BULLISH",
  "ai_reason": "Test"
};

function verifyStructure(data: any) {
  console.log("--- Verifying Hybrid Structure ---");
  
  // Flat check
  const hasFlat = 'bestBid' in data && 'bestAsk' in data && 'rsi' in data && 'ema_trend' in data;
  console.log(`[Step 1] Flat fields present: ${hasFlat ? "✅" : "❌"}`);
  
  // Nested check
  const hasNested = data.indicators && data.capital && Array.isArray(data.history);
  console.log(`[Atelier UI] Nested structure present: ${hasNested ? "✅" : "❌"}`);
  
  if (hasFlat && hasNested) {
    console.log("Result: PASS - Structure is robust and hybrid-ready.");
  } else {
    console.log("Result: FAIL - Incomplete structure.");
  }
}

verifyStructure(mockGistContent);
