import { CLOUD_MODE, getSupabase } from './supabaseClient';
import {
  buildGeminiHistory,
  type EdgeChatMessageLike,
  type GeminiChatTurn,
} from '../utils/aiHistory';

export { buildGeminiHistory, type EdgeChatMessageLike, type GeminiChatTurn };

export interface EdgeAssistantReply {
  reply: string;
  model: string;
}

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

    const { data, error } = await supabase.functions.invoke('ai-triage', {
      body: {
        message: cleanMessage.slice(0, 2000),
        allergies: params.allergies || [],
        history: params.history || [],
      },
    });

    if (error || !data || typeof data.reply !== 'string' || !data.reply.trim()) {
      return null;
    }

    return {
      reply: data.reply.trim(),
      model: typeof data.model === 'string' ? data.model : 'gemini-2.5-flash',
    };
  } catch {
    return null;
  }
}
