export interface GeminiChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface EdgeChatMessageLike {
  sender: 'user' | 'ai';
  text?: string;
  clinicalCard?: {
    analysisText?: string;
  };
}

/**
 * Converts recent UI chat messages into bounded Gemini history turns.
 */
export function buildGeminiHistory(
  messages: EdgeChatMessageLike[],
  maxTurns = 6
): GeminiChatTurn[] {
  const turns: GeminiChatTurn[] = [];
  for (const msg of messages) {
    const rawText =
      msg.sender === 'user'
        ? msg.text
        : msg.text || msg.clinicalCard?.analysisText;
    const text = typeof rawText === 'string' ? rawText.trim() : '';
    if (!text) continue;
    turns.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      text: text.slice(0, 1000),
    });
  }
  return turns.slice(-maxTurns);
}
