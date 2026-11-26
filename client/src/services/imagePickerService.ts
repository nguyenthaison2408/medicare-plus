import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PickImageOptions {
  title?: string;
  message?: string;
  aspect?: [number, number];
  quality?: number;
  onSuccess: (dataUri: string) => void;
  onError?: (errorMessage: string) => void;
}

/**
 * Fallback bộ chọn file cho trình duyệt Web dùng HTML5 Input & Canvas thu nhỏ
 */
function pickImageWebFallback(
  options: PickImageOptions,
  resolve: () => void
): void {
  if (typeof document === 'undefined') {
    resolve();
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) {
      resolve();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const err = 'Ảnh tải lên không được vượt quá 5MB.';
      options.onError?.(err);
      Alert.alert('Ảnh quá lớn', err);
      resolve();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        resolve();
        return;
      }
      const img = new (window as unknown as { Image: new () => HTMLImageElement }).Image();
      img.onload = () => {
        const maxDim = 320;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          options.onSuccess(canvas.toDataURL('image/jpeg', options.quality ?? 0.7));
        } else {
          options.onSuccess(result);
        }
        resolve();
      };
      img.onerror = () => {
        options.onSuccess(result);
        resolve();
      };
      img.src = result;
    };
    reader.onerror = () => {
      const err = 'Không thể đọc file ảnh từ máy.';
      options.onError?.(err);
      resolve();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

/**
 * Mở thư viện ảnh của thiết bị (hỗ trợ cả Android, iOS và Web)
 */
export async function pickImageFromGallery(options: PickImageOptions): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const msg = 'Medicare Plus cần quyền truy cập thư viện ảnh để tải avatar lên.';
        Alert.alert('Cần cấp quyền', msg);
        options.onError?.(msg);
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: options.aspect || [1, 1],
      quality: options.quality ?? 0.6,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    if (asset.base64) {
      const mime = asset.mimeType || 'image/jpeg';
      options.onSuccess(`data:${mime};base64,${asset.base64}`);
    } else if (asset.uri) {
      options.onSuccess(asset.uri);
    }
  } catch (err) {
    if (Platform.OS === 'web') {
      // Fallback về HTML Input trên web nếu expo-image-picker gặp lỗi tương thích
      return new Promise((resolve) => pickImageWebFallback(options, resolve));
    }
    const msg = err instanceof Error ? err.message : 'Không thể chọn ảnh từ thư viện.';
    options.onError?.(msg);
    Alert.alert('Lỗi chọn ảnh', msg);
  }
}

/**
 * Chụp ảnh mới từ camera của thiết bị (Android / iOS)
 */
export async function pickImageFromCamera(options: PickImageOptions): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      return await pickImageFromGallery(options);
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      const msg = 'Medicare Plus cần quyền truy cập camera để chụp ảnh đại diện.';
      Alert.alert('Cần cấp quyền', msg);
      options.onError?.(msg);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: options.aspect || [1, 1],
      quality: options.quality ?? 0.6,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    if (asset.base64) {
      const mime = asset.mimeType || 'image/jpeg';
      options.onSuccess(`data:${mime};base64,${asset.base64}`);
    } else if (asset.uri) {
      options.onSuccess(asset.uri);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Không thể mở máy ảnh để chụp avatar.';
    options.onError?.(msg);
    Alert.alert('Lỗi máy ảnh', msg);
  }
}

/**
 * Hiển thị menu cho người dùng chọn chụp mới hoặc tải từ thư viện ảnh
 */
export function promptImagePicker(options: PickImageOptions): void {
  if (Platform.OS === 'web') {
    void pickImageFromGallery(options);
    return;
  }

  Alert.alert(
    options.title || 'Ảnh đại diện',
    options.message || 'Bạn muốn chụp ảnh mới hay chọn ảnh có sẵn trong máy?',
    [
      {
        text: 'Chụp ảnh mới',
        onPress: () => {
          void pickImageFromCamera(options);
        },
      },
      {
        text: 'Thư viện ảnh',
        onPress: () => {
          void pickImageFromGallery(options);
        },
      },
      {
        text: 'Hủy',
        style: 'cancel',
      },
    ]
  );
}
