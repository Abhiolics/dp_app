import React from 'react';
import { Platform, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import {
  PhonePeIcon,
  PaytmIcon,
  GooglePayIcon,
  CredIcon,
  BhimIcon,
  AmazonPayIcon,
} from '../components/UpiAppIcons';

export interface SupportedUpiApp {
  id: string;
  name: string;
  packageName?: string;
  schemes: string[];
  primaryColor: string;
  accentBg: string;
  badgeTextColor: string;
  renderLogo: (size?: number) => React.ReactNode;
  buildUrl: (params: { upiId: string; amount: string; name?: string }) => string;
}

export const SUPPORTED_UPI_APPS: SupportedUpiApp[] = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    packageName: 'com.phonepe.app',
    schemes: ['phonepe://pay', 'phonepe://'],
    primaryColor: '#5F259F',
    accentBg: '#F5EEFD',
    badgeTextColor: '#FFFFFF',
    renderLogo: (size = 44) => React.createElement(PhonePeIcon, { size }),
    buildUrl: ({ upiId, amount, name = 'DreamPay Deposit' }) => {
      const am = parseFloat(amount || '0').toFixed(2);
      return `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${am}&cu=INR&tn=${encodeURIComponent('Deposit')}`;
    },
  },
  {
    id: 'paytm',
    name: 'Paytm',
    packageName: 'net.one97.paytm',
    schemes: ['paytmmp://pay', 'paytm://pay', 'paytmmp://', 'paytm://'],
    primaryColor: '#002970',
    accentBg: '#EBF8FF',
    badgeTextColor: '#FFFFFF',
    renderLogo: (size = 44) => React.createElement(PaytmIcon, { size }),
    buildUrl: ({ upiId, amount, name = 'DreamPay Deposit' }) => {
      const am = parseFloat(amount || '0').toFixed(2);
      return `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${am}&cu=INR&tn=${encodeURIComponent('Deposit')}`;
    },
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    packageName: 'com.google.android.apps.nbu.paisa.user',
    schemes: ['tez://upi/pay', 'gpay://upi/pay', 'tez://', 'gpay://'],
    primaryColor: '#1A73E8',
    accentBg: '#EFF6FF',
    badgeTextColor: '#FFFFFF',
    renderLogo: (size = 44) => React.createElement(GooglePayIcon, { size }),
    buildUrl: ({ upiId, amount, name = 'DreamPay Deposit' }) => {
      const am = parseFloat(amount || '0').toFixed(2);
      return `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${am}&cu=INR&tn=${encodeURIComponent('Deposit')}`;
    },
  },
  {
    id: 'cred',
    name: 'CRED',
    packageName: 'com.dreamplug.androidapp',
    schemes: ['credpay://upi/pay', 'cred://'],
    primaryColor: '#0A0A0A',
    accentBg: '#F4F4F5',
    badgeTextColor: '#FFFFFF',
    renderLogo: (size = 44) => React.createElement(CredIcon, { size }),
    buildUrl: ({ upiId, amount, name = 'DreamPay Deposit' }) => {
      const am = parseFloat(amount || '0').toFixed(2);
      return `credpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${am}&cu=INR&tn=${encodeURIComponent('Deposit')}`;
    },
  },
  {
    id: 'bhim',
    name: 'BHIM',
    packageName: 'in.org.npci.upiapp',
    schemes: ['bhim://pay', 'bhim://'],
    primaryColor: '#008276',
    accentBg: '#F0FDFA',
    badgeTextColor: '#FFFFFF',
    renderLogo: (size = 44) => React.createElement(BhimIcon, { size }),
    buildUrl: ({ upiId, amount, name = 'DreamPay Deposit' }) => {
      const am = parseFloat(amount || '0').toFixed(2);
      return `bhim://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${am}&cu=INR&tn=${encodeURIComponent('Deposit')}`;
    },
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    packageName: 'in.amazon.mShop.android.shopping',
    schemes: ['amazonpay://pay', 'amzn://'],
    primaryColor: '#131921',
    accentBg: '#FFF7ED',
    badgeTextColor: '#FFFFFF',
    renderLogo: (size = 44) => React.createElement(AmazonPayIcon, { size }),
    buildUrl: ({ upiId, amount, name = 'DreamPay Deposit' }) => {
      const am = parseFloat(amount || '0').toFixed(2);
      return `amazonpay://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${am}&cu=INR&tn=${encodeURIComponent('Deposit')}`;
    },
  },
];

export function buildGenericUpiUrl({
  upiId,
  amount,
  name = 'DreamPay Deposit',
}: {
  upiId: string;
  amount: string;
  name?: string;
}): string {
  const am = parseFloat(amount || '0').toFixed(2);
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${am}&cu=INR&tn=${encodeURIComponent('Deposit')}`;
}

/**
 * Checks which supported UPI apps are installed on the device.
 * Returns only the apps that can be opened.
 */
export async function detectInstalledUpiApps(): Promise<SupportedUpiApp[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  const installed: SupportedUpiApp[] = [];

  for (const app of SUPPORTED_UPI_APPS) {
    let isInstalled = false;
    for (const scheme of app.schemes) {
      try {
        const canOpen = await Linking.canOpenURL(scheme);
        if (canOpen) {
          isInstalled = true;
          break;
        }
      } catch {
        // Scheme check failed
      }
    }
    if (isInstalled) {
      installed.push(app);
    }
  }

  return installed;
}

/**
 * Initiates payment with the selected app or generic UPI chooser.
 */
export async function launchUpiPayment({
  app,
  upiId,
  amount,
  name = 'DreamPay Deposit',
}: {
  app?: SupportedUpiApp;
  upiId: string;
  amount: string;
  name?: string;
}): Promise<boolean> {
  const genericUrl = buildGenericUpiUrl({ upiId, amount, name });

  if (app) {
    const appUrl = app.buildUrl({ upiId, amount, name });
    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
        return true;
      }
    } catch {
      // Fall back to generic UPI
    }
  }

  // Fallback: try opening generic UPI intent
  try {
    const canGeneric = await Linking.canOpenURL(genericUrl);
    if (canGeneric) {
      await Linking.openURL(genericUrl);
      return true;
    } else {
      await Linking.openURL(genericUrl);
      return true;
    }
  } catch {
    Alert.alert(
      'Unable to Launch UPI',
      `Could not open ${app?.name || 'UPI app'}. Please scan the QR code above or copy the UPI ID (${upiId}) to pay directly from your payment app.`
    );
    return false;
  }
}
