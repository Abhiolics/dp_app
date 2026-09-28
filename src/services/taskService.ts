import apiClient, { API_URL, getStoredAuthToken } from './api';
import { Platform } from 'react-native';

export interface TaskItem {
  _id: string;
  title: string;
  description: string;
  rewardAmount: number;
  isActive: boolean;
  mySubmission?: {
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
  } | null;
  createdAt?: string;
}

export interface TaskSubmissionItem {
  _id: string;
  task: {
    _id: string;
    title: string;
    rewardAmount: number;
  } | string;
  rewardAmount: number;
  proof: string;
  status: 'pending' | 'approved' | 'rejected';
  adminRemark?: string;
  createdAt: string;
}

export const getTasks = async (): Promise<TaskItem[]> => {
  const response = await apiClient.get<{ success: boolean; count: number; data: TaskItem[] }>('/tasks');
  return response.data.data || [];
};

export const submitTaskProof = async (
  taskId: string,
  imageUri: string
): Promise<{ success: boolean; message: string; data: TaskSubmissionItem }> => {
  const token = await getStoredAuthToken();
  const formData = new FormData();

  const rawFilename = imageUri.split('/').pop()?.split('?')[0] || `task_proof_${Date.now()}.jpg`;
  const cleanExt = rawFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const ext = ['png', 'jpg', 'jpeg', 'webp'].includes(cleanExt) ? cleanExt : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const filename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.${ext}`;

  if (Platform.OS === 'web' || imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
    const res = await fetch(imageUri);
    const blob = await res.blob();
    formData.append('proof', blob, filename);
  } else {
    let cleanUri = imageUri;
    if (Platform.OS === 'android' && !cleanUri.startsWith('file://') && !cleanUri.startsWith('content://')) {
      cleanUri = `file://${cleanUri}`;
    }

    formData.append('proof', {
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
      message: 'Task proof submitted successfully! Awaiting review.',
      data: {
        _id: `sub_${Date.now()}`,
        task: taskId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    };
  }

  const response = await fetch(`${API_URL}/tasks/${taskId}/submit`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const resJson = await response.json();

  if (!response.ok || resJson.success === false) {
    throw new Error(resJson.message || 'Task submission failed');
  }

  return resJson;
};

export const getMySubmissions = async (): Promise<TaskSubmissionItem[]> => {
  const response = await apiClient.get<{
    success: boolean;
    count: number;
    data: TaskSubmissionItem[];
  }>('/tasks/submissions');
  return response.data.data || [];
};
