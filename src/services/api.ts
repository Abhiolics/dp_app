import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// BACKEND CONFIGURATION
// ============================================================================
// export const BASE_URL = 'https://gdpebackend.vercel.app';
// export const API_URL = `${BASE_URL}/api`;

export const BASE_URL = '';
export const API_URL = '';

export const TOKEN_STORAGE_KEY = '@gdpe_user_token';
export const USER_STORAGE_KEY = '@gdpe_user_profile';

const MOCK_USER = {
  _id: 'usr_dreampay_vip_2026',
  id: 'usr_dreampay_vip_2026',
  fullName: 'Rahul Sharma',
  email: 'trader@dreampay.vip',
  phoneNumber: '+91 98765 43210',
  role: 'user',
  isActive: true,
  isEmailVerified: true,
  plan: {
    _id: 'plan_vip_pro',
    name: 'Pro Trader Tier',
    amount: 5000,
    description: '12% Weekly Yield & Priority Withdrawals',
  },
  wallet: {
    balance: 24850,
    pendingBalance: 1200,
  },
  createdAt: new Date().toISOString(),
};

/**
 * Initial Data Adapter
 */
const mockAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const url = (config.url || '').replace(/^\/api/, '');
  const method = (config.method || 'get').toLowerCase();

  let body: any = {};
  try {
    body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
  } catch {
    body = {};
  }

  // Simulate network latency (250ms)
  await new Promise((resolve) => setTimeout(resolve, 250));

  let responseData: any = { success: true };

  // 1. App settings
  if (url.includes('/app/settings')) {
    responseData = {
      success: true,
      data: {
        maintenanceMode: false,
        maintenanceMessage: '',
        forceUpdate: false,
        updateMessage: '',
        currentVersion: '1.0.0',
      },
    };
  }
  // 2. Auth - Send OTP
  else if (url.includes('/auth/send-otp')) {
    responseData = {
      success: true,
      message: 'Verification code sent to your email',
      otp: '123456',
    };
  }
  // 3. Auth - Verify OTP / Login / Register
  else if (
    url.includes('/auth/verify-otp') ||
    url.includes('/auth/login') ||
    url.includes('/auth/register')
  ) {
    const userToReturn = {
      ...MOCK_USER,
      fullName: body.fullName || MOCK_USER.fullName,
      email: body.email || MOCK_USER.email,
      phoneNumber: body.phoneNumber || MOCK_USER.phoneNumber,
    };
    responseData = {
      success: true,
      token: 'demo-jwt-offline-token',
      isNewUser: false,
      user: userToReturn,
      data: userToReturn,
    };
  }
  // 4. Auth - Me
  else if (url.includes('/auth/me')) {
    responseData = {
      success: true,
      data: MOCK_USER,
    };
  }
  // 5. Auth - Update Profile
  else if (url.includes('/auth/update-profile')) {
    responseData = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...MOCK_USER,
        fullName: body.fullName || MOCK_USER.fullName,
        phoneNumber: body.phoneNumber || MOCK_USER.phoneNumber,
      },
    };
  }
  // 6. Wallet Balance
  else if (url === '/wallet' || url.endsWith('/wallet')) {
    responseData = {
      success: true,
      data: {
        balance: 24850,
        pendingBalance: 1200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }
  // 7. Wallet Transactions
  else if (url.includes('/wallet/transactions')) {
    responseData = {
      success: true,
      count: 4,
      total: 4,
      data: [
        {
          _id: 'tx_1',
          amount: 5000,
          type: 'credit',
          category: 'deposit',
          status: 'completed',
          description: 'UPI Deposit - PhonePe',
          referenceId: 'UPI983719283712',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          _id: 'tx_2',
          amount: 350,
          type: 'credit',
          category: 'task_reward',
          status: 'completed',
          description: 'Daily Trading Cashback Task',
          createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
        {
          _id: 'tx_3',
          amount: 2000,
          type: 'debit',
          category: 'withdrawal',
          status: 'completed',
          description: 'Bank Withdrawal to HDFC Bank',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          _id: 'tx_4',
          amount: 500,
          type: 'credit',
          category: 'gift_code',
          status: 'completed',
          description: 'VIP Celebration Gift Voucher',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ],
    };
  }
  // 8. Plans
  else if (url.includes('/plans')) {
    responseData = {
      success: true,
      count: 3,
      data: [
        {
          _id: 'plan_1',
          name: 'Starter Tier',
          amount: 1000,
          description: 'Ideal for beginners with 5% weekly return',
          isActive: true,
        },
        {
          _id: 'plan_2',
          name: 'Pro Trader',
          amount: 5000,
          description: 'Top recommendation with 12% bonus yield',
          isActive: true,
        },
        {
          _id: 'plan_3',
          name: 'VIP Elite',
          amount: 20000,
          description: 'High net worth tier with dedicated manager',
          isActive: true,
        },
      ],
    };
  }
  // 9. Tasks
  else if (url.includes('/tasks/submissions')) {
    responseData = {
      success: true,
      count: 1,
      data: [
        {
          _id: 'sub_1',
          task: { _id: 'task_1', title: 'Daily Market Check-in' },
          status: 'approved',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  } else if (url.includes('/tasks')) {
    responseData = {
      success: true,
      count: 3,
      data: [
        {
          _id: 'task_1',
          title: 'Daily Market Check-in',
          description: 'Check market trends and view today’s live exchange rates',
          rewardAmount: 50,
          category: 'daily',
          actionUrl: 'https://dreampay.vip',
          status: 'completed',
        },
        {
          _id: 'task_2',
          title: 'Join Official Telegram Community',
          description: 'Join the channel for daily gift codes and announcements',
          rewardAmount: 100,
          category: 'one_time',
          actionUrl: 'https://t.me/gdpe_official',
          status: 'available',
        },
        {
          _id: 'task_3',
          title: 'Invite 3 Trading Friends',
          description: 'Share your referral code and earn ₹150 per verified registration',
          rewardAmount: 450,
          category: 'referral',
          status: 'available',
        },
      ],
    };
  }
  // 10. Teams
  else if (url.includes('/teams')) {
    responseData = {
      success: true,
      data: {
        totalCommissions: 4280,
        commissionsYesterday: 620,
        commissionsToday: 890,
        totalTeamMembers: 14,
        totalTeamDeposit: 85000,
        newMembersToday: 2,
        newMembersYesterday: 3,
        currentCommissionVolume: 4280,
        targetCommissionVolume: 10000,
        currentLevel: 'Level B',
      },
    };
  }
  // 11. Notifications
  else if (url.includes('/notifications/unread-count')) {
    responseData = { success: true, unreadCount: 2 };
  } else if (url.includes('/notifications')) {
    responseData = {
      success: true,
      count: 2,
      data: [
        {
          _id: 'notif_1',
          title: 'Welcome to DreamPay',
          message: 'Your account is ready. Explore features and deposit anytime.',
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'notif_2',
          title: 'Daily Task Available',
          message: 'Complete your daily trading check-in for ₹50 reward.',
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }
  // 12. Deposits & UPI channels
  else if (url.includes('/deposits/upi-channels') || url.includes('/payment-methods')) {
    responseData = {
      success: true,
      data: {
        qrCode: {
          imageUrl: '',
          upiId: 'dreampay.vip@icici',
          enabled: true,
        },
        bankAccount: {
          accountHolder: 'DREAMPAY VENTURES LTD',
          accountNumber: '50200084920192',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: 'dreampay.vip@icici',
          enabled: true,
        },
      },
    };
  } else if (url.includes('/deposits')) {
    responseData = {
      success: true,
      count: 1,
      data: [
        {
          _id: 'dep_1',
          amount: 5000,
          transactionRef: 'UPI983719283712',
          status: 'approved',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ],
    };
  }
  // 13. Withdrawals
  else if (url.includes('/withdrawals')) {
    if (method === 'post') {
      responseData = {
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: {
          _id: `wth_${Date.now()}`,
          amount: body.amount || 1000,
          bankDetails: body.bankDetails || {},
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      };
    } else {
      responseData = {
        success: true,
        count: 1,
        data: [
          {
            _id: 'wth_1',
            amount: 2000,
            status: 'approved',
            bankDetails: {
              accountHolder: 'Rahul Sharma',
              accountNumber: '**** **** 0192',
              ifscCode: 'HDFC0001234',
            },
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      };
    }
  }
  // 14. Gift Code
  else if (url.includes('/gift-codes/redeem')) {
    responseData = {
      success: true,
      message: 'Gift Code redeemed successfully! +₹200 added to wallet.',
      data: {
        code: body.code || 'GIFT2026',
        rewardAmount: 200,
      },
    };
  }
  // 15. Contacts
  else if (url.includes('/contacts')) {
    responseData = {
      success: true,
      count: 2,
      data: [
        {
          _id: 'c1',
          type: 'telegram',
          label: 'Official Telegram Support',
          value: 'https://t.me/gdpe_official',
          isActive: true,
        },
        {
          _id: 'c2',
          type: 'whatsapp',
          label: 'Customer Care WhatsApp',
          value: '+91 98765 00000',
          isActive: true,
        },
      ],
    };
  }

  return {
    data: responseData,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    request: {},
  };
};

const apiClient = axios.create({
  baseURL: API_URL || undefined,
  timeout: 20000,
  headers: {
    'Accept': 'application/json',
  },
  // If BASE_URL is not set, use offline mockAdapter
  adapter: !BASE_URL ? mockAdapter : undefined,
});

// Automatically attach JWT token to every request if present
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Error reading auth token from storage:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Format and handle errors consistently
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

/**
 * Prepend backend base URL to relative file paths (e.g. /uploads/image.jpg)
 */
export const getFullImageUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return BASE_URL ? `${BASE_URL}${cleanPath}` : cleanPath;
};

export const saveAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const getStoredAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
};

export const removeAuthToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  await AsyncStorage.removeItem(USER_STORAGE_KEY);
};

export default apiClient;

