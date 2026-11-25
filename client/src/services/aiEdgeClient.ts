import { CLOUD_MODE, getSupabase } from './supabaseClient';
import {
  buildGeminiHistory,
  sanitizeGeminiReply,
  type EdgeChatMessageLike,
  type GeminiChatTurn,
} from '../utils/aiHistory';

export {
  buildGeminiHistory,
  sanitizeGeminiReply,
  type EdgeChatMessageLike,
  type GeminiChatTurn,
};

export interface EdgeAssistantReply {
  reply: string;
  model: string;
}

const EDGE_TIMEOUT_MS = 15000;

/**
 * Calls the `ai-triage` Supabase Edge Function so GEMINI_API_KEY stays strictly
 * on the server and is never bundled into the client/APK.
 * Returns `null` when offline, in local demo mode, unauthenticated, or on error
 * so callers can fall back to the deterministic local triage engine.
 */
export async function askGeminiEdgeAssistant(params: {
  message: string;
  allergies: string[];
  history: GeminiChatTurn[];
}): Promise<EdgeAssistantReply | null> {
  if (!CLOUD_MODE) return null;
  const cleanMessage = (params.message || '').trim();
  if (!cleanMessage) return null;

  try {
    const supabase = getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const invokePromise = supabase.functions.invoke('ai-triage', {
      body: {
        message: cleanMessage.slice(0, 2000),
        allergies: params.allergies || [],
        history: params.history || [],
      },
    });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), EDGE_TIMEOUT_MS)
    );

    const result = await Promise.race([invokePromise, timeoutPromise]);
    if (!result) return null;

    const { data, error } = result;
    if (error || !data || typeof data.reply !== 'string') {
      return null;
    }

    const sanitized = sanitizeGeminiReply(data.reply);
    if (!sanitized) return null;

    return {
      reply: sanitized,
      model: typeof data.model === 'string' ? data.model : 'gemini-2.5-flash',
    };
  } catch {
    return null;
  }
}
