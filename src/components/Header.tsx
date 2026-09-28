import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Bell, Copy, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, unreadCount } = useAuth();
  const [copied, setCopied] = useState(false);

  const displayName = user?.fullName || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const displayId = user?._id ? user._id.slice(-8).toUpperCase() : 'MEMBER';

  const handleCopyId = async () => {
    try {
      await Clipboard.setStringAsync(displayId);
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(displayId);
      }
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12) + 8;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* User Info Left Section */}
      <View style={styles.leftSection}>
        {/* Avatar Circle with letter */}
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </TouchableOpacity>

        {/* Username & ID */}
        <View style={styles.userTextContainer}>
          <Text style={styles.username} numberOfLines={1}>
            {displayName}
          </Text>
          <TouchableOpacity
            style={styles.idRow}
            onPress={handleCopyId}
            activeOpacity={0.7}
            accessibilityLabel="Copy User ID"
          >
            <Text style={styles.userId}>ID: {displayId}</Text>
            <View style={styles.copyIconWrapper}>
              {copied ? (
                <Check size={13} color="#7C3AED" strokeWidth={2.5} />
              ) : (
                <Copy size={13} color="#64748B" strokeWidth={1.8} />
              )}
            </View>
            {copied && (
              <View style={styles.copiedBadge}>
                <Text style={styles.copiedText}>Copied</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Icons Right Section */}
      <View style={styles.rightSection}>
        {/* DreamPay Brand Badge */}
        <View style={styles.brandPill}>
          <Image
            source={require('../../assets/images/dreampay-logo.png')}
            style={styles.brandPillLogo}
            resizeMode="cover"
          />
          <Text style={styles.brandPillText}>DreamPay</Text>
        </View>

        {/* Bell with notification badge */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/messages')}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <Bell size={20} color="#F59E0B" strokeWidth={2.2} />
          {unreadCount > 0 && (
            <View style={styles.notificationDot}>
              {unreadCount > 9 ? (
                <Text style={styles.dotText}>9+</Text>
              ) : (
                <Text style={styles.dotText}>{unreadCount}</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'transparent',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  avatarText: {
    color: '#FBBF24',
    fontSize: 20,
    fontWeight: '800',
  },
  userTextContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  username: {
    color: '#F8FAFC',
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userId: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '500',
  },
  copyIconWrapper: {
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copiedBadge: {
    marginLeft: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  copiedText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(26, 29, 44, 0.8)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#0A0B10',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  dotText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 4,
  },
  brandPillLogo: {
    width: 18,
    height: 18,
    borderRadius: 6,
    marginRight: 5,
  },
  brandPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 0.3,
  },
});
