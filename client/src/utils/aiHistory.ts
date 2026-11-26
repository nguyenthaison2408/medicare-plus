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

/**
 * Normalizes Gemini markdown output for clean mobile bubble rendering
 * and enforces a safe display length ceiling.
 */
export function sanitizeGeminiReply(
  rawReply: string,
  maxLength = 1500
): string {
  const cleaned = (rawReply || '')
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 3).trim()}...`;
}
