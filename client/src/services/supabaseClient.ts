import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
export const CLOUD_MODE = process.env.EXPO_PUBLIC_DATA_MODE === 'supabase';
export const SUPABASE_CONFIGURED = Boolean(url && publishableKey);

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (!url || !publishableKey) {
    throw new Error('Chưa kết nối cơ sở dữ liệu trực tuyến. Vui lòng cấu hình Supabase trước khi đăng nhập.');
  }
  if (!client) {
    client = createClient(url, publishableKey, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    if (Platform.OS !== 'web') {
      const activeClient = client;
      AppState.addEventListener('change', (state) => {
        if (state === 'active') activeClient.auth.startAutoRefresh();
        else activeClient.auth.stopAutoRefresh();
      });
    }
  }
  return client;
}
