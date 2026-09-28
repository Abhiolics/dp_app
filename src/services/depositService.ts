import apiClient, { API_URL, getStoredAuthToken } from './api';
import { Platform } from 'react-native';

export interface DepositItem {
  _id: string;
  user?: string;
  amount: number;
  transactionRef: string;
  paymentProof?: string;
  status: 'pending' | 'approved' | 'rejected';
  plan?: {
    _id: string;
    name: string;
    amount: number;
  } | null;
  adminRemark?: string;
  createdAt: string;
}

export const submitDeposit = async (
  amount: number,
  transactionRef: string,
  imageUri: string,
  planId?: string
): Promise<{ success: boolean; message: string; data: DepositItem }> => {
  const token = await getStoredAuthToken();
  const formData = new FormData();
  formData.append('amount', String(amount));
  formData.append('transactionRef', transactionRef.trim());
  if (planId) {
    formData.append('planId', planId);
  }

  // Derive file extension and MIME type
  const rawFilename = imageUri.split('/').pop()?.split('?')[0] || `proof_${Date.now()}.jpg`;
  const cleanExt = rawFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const ext = ['png', 'jpg', 'jpeg', 'webp'].includes(cleanExt) ? cleanExt : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const filename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.${ext}`;

  // Handle Web (Browser / Expo Web) vs Native Mobile (iOS / Android)
  if (Platform.OS === 'web' || imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
    // In Web browsers, FormData expects a Blob or File object.
    // Passing a plain { uri, name, type } object causes the browser to convert it to "[object Object]"!
    const res = await fetch(imageUri);
    const blob = await res.blob();
    formData.append('paymentProof', blob, filename);
  } else {
    // On React Native Mobile (iOS / Android), FormData expects an object with uri, name, and type
    let cleanUri = imageUri;
    if (Platform.OS === 'android' && !cleanUri.startsWith('file://') && !cleanUri.startsWith('content://')) {
      cleanUri = `file://${cleanUri}`;
    }

    formData.append('paymentProof', {
      uri: cleanUri,
      name: filename,
      type: mimeType,
    } as any);
  }

  // Local response if API_URL is not set
  if (!API_URL) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      message: 'Deposit submitted successfully! Awaiting verification.',
      data: {
        _id: `dep_${Date.now()}`,
        amount,
        transactionRef,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    };
  }

  // Send request via fetch without manual Content-Type header so the multipart boundary is automatically set
  const response = await fetch(`${API_URL}/deposits`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // DO NOT set Content-Type header so boundary is automatically created
    },
    body: formData,
  });

  const resJson = await response.json();

  if (!response.ok || resJson.success === false) {
    throw new Error(resJson.message || 'Deposit submission failed');
  }

  return resJson;
};

export const getDeposits = async (): Promise<DepositItem[]> => {
  const response = await apiClient.get<{ success: boolean; count: number; data: DepositItem[] }>('/deposits');
  return response.data.data || [];
};
