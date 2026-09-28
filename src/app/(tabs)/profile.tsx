import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  CreditCard,
  Gift,
  Bell,
  ClipboardList,
  Headphones,
  Copy,
  Check,
  X,
  Wallet,
  Banknote,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';
import {
  redeemGiftCode,
  getDeposits,
  getWithdrawals,
  DepositItem,
  WithdrawalItem,
} from '../../services';

export default function MyAssetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 20) + 12;
  const { user, wallet, logoutUser, updateUserProfile, refreshWallet, refreshUserData } = useAuth();

  const [copiedId, setCopiedId] = useState(false);
  const [totalDeposit, setTotalDeposit] = useState<number>(0);
  const [totalWithdraw, setTotalWithdraw] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Edit Profile form state
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phoneNumber || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Gift Code state
  const [giftCode, setGiftCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [giftResult, setGiftResult] = useState<{ text: string; isError: boolean } | null>(null);

  const balance = wallet?.balance ?? 0;
  const userId = user?._id ? user._id.slice(-8).toUpperCase() : user?.id ? String(user.id).slice(-8).toUpperCase() : 'USER';

  const loadTotals = async () => {
    try {
      const [depRes, withRes] = await Promise.allSettled([getDeposits(), getWithdrawals()]);

      if (depRes.status === 'fulfilled' && Array.isArray(depRes.value) && depRes.value.length > 0) {
        const sum = depRes.value
          .filter((d: DepositItem) => d.status === 'approved')
          .reduce((acc: number, d: DepositItem) => acc + (d.amount || 0), 0);
        setTotalDeposit(sum);
      }

      if (withRes.status === 'fulfilled' && Array.isArray(withRes.value) && withRes.value.length > 0) {
        const sum = withRes.value
          .filter((w: WithdrawalItem) => w.status === 'approved')
          .reduce((acc: number, w: WithdrawalItem) => acc + (w.amount || 0), 0);
        setTotalWithdraw(sum);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadTotals();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshUserData(), refreshWallet(), loadTotals()]);
    setIsRefreshing(false);
  };

  const handleCopyId = async () => {
    try {
      await Clipboard.setStringAsync(userId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setUpdateError('Please enter your full name.');
      return;
    }
    setIsUpdating(true);
    setUpdateError(null);

    try {
      await updateUserProfile({
        fullName: editName.trim(),
        phoneNumber: editPhone.trim(),
      });
      setIsUpdating(false);
      setShowProfileModal(false);
    } catch (err: any) {
      setIsUpdating(false);
      setUpdateError(err.message || 'Failed to update profile.');
    }
  };

  const handleRedeemGift = async () => {
    if (!giftCode.trim()) return;
    setIsRedeeming(true);
    setGiftResult(null);

    try {
      const res = await redeemGiftCode(giftCode.trim());
      setGiftResult({
        text: res.message || 'Gift code redeemed successfully!',
        isError: false,
      });
      setGiftCode('');
      await refreshWallet();
    } catch (err: any) {
      setGiftResult({
        text: err.message || 'Invalid or expired gift code.',
        isError: true,
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logoutUser();
    router.replace('/login');
  };

  // 6 Menu options definition
  const menuOptions = [
    {
      id: 'profile',
      label: 'Profile',
      sublabel: 'Personal details & credentials',
      icon: User,
      onPress: () => {
        setEditName(user?.fullName || '');
        setEditPhone(user?.phoneNumber || '');
        setShowProfileModal(true);
      },
    },
    {
      id: 'account',
      label: 'Account',
      sublabel: 'Linked bank & withdrawal details',
      icon: CreditCard,
      onPress: () => router.push('/account'),
    },
    {
      id: 'gift',
      label: 'Gift Code',
      sublabel: 'Claim voucher bonus credits',
      icon: Gift,
      onPress: () => router.push('/gift-rewards'),
    },
    {
      id: 'notification',
      label: 'Notification',
      sublabel: 'Platform messages & alerts',
      icon: Bell,
      onPress: () => router.push('/messages'),
    },
    {
      id: 'plan',
      label: 'Plan',
      sublabel: 'VIP memberships & daily cashback',
      icon: ClipboardList,
      onPress: () => router.push('/(tabs)/card'),
    },
    {
      id: 'service',
      label: 'Service',
      sublabel: '24/7 dedicated customer care',
      icon: Headphones,
      onPress: () => router.push('/service'),
    },
  ];

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
        }
      >
        {/* Top Header: Avatar & My Asset Title in Dark Golden Theme */}
        <View style={styles.topHeader}>
          {/* Avatar with gold brand border */}
          <View style={styles.avatarBorder}>
            <View style={styles.avatarInner}>
              <User size={30} color="#F59E0B" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.myAssetTitle}>My Asset</Text>

          {/* User ID Pill */}
          <TouchableOpacity
            style={styles.userIdPill}
            onPress={handleCopyId}
            activeOpacity={0.7}
          >
            <Text style={styles.userIdText}>ID: {userId}</Text>
            {copiedId ? (
              <Check size={12} color="#10B981" style={{ marginLeft: 4 }} />
            ) : (
              <Copy size={12} color="#FBBF24" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        </View>

        {/* 1. Full-Width Assets Card */}
        <View style={styles.assetCard}>
          <View style={styles.assetSquircle}>
            <Banknote size={22} color="#F59E0B" />
          </View>
          <View style={styles.assetTextGroup}>
            <Text style={styles.assetLabel}>Assets</Text>
            <Text style={styles.assetValue}>
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* 2. Row of 2 Cards: Deposit & Withdraw */}
        <View style={styles.dualCardRow}>
          {/* Deposit Card */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/deposit')}
            activeOpacity={0.85}
          >
            <View style={styles.statSquircle}>
              <Wallet size={20} color="#F59E0B" />
            </View>
            <View style={styles.statTextGroup}>
              <Text style={styles.statLabel}>Deposit</Text>
              <Text style={styles.statValue}>₹{totalDeposit.toLocaleString('en-IN')}</Text>
            </View>
          </TouchableOpacity>

          {/* Withdraw Card */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/withdraw')}
            activeOpacity={0.85}
          >
            <View style={styles.statSquircle}>
              <Wallet size={20} color="#F59E0B" />
            </View>
            <View style={styles.statTextGroup}>
              <Text style={styles.statLabel}>Withdraw</Text>
              <Text style={styles.statValue}>₹{totalWithdraw.toLocaleString('en-IN')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. Feature Actions Card: ALL SIX OPTIONS IN ROWS */}
        <View style={styles.optionsListCard}>
          {menuOptions.map((item, index) => {
            const IconComp = item.icon;
            const isLast = index === menuOptions.length - 1;

            return (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  {/* Left Icon Squircle in Gold */}
                  <View style={styles.optionIconSquircle}>
                    <IconComp size={20} color="#F59E0B" />
                  </View>

                  {/* Middle Text Info */}
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionLabel}>{item.label}</Text>
                    <Text style={styles.optionSublabel}>{item.sublabel}</Text>
                  </View>

                  {/* Right Chevron */}
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Divider between rows */}
                {!isLast && <View style={styles.optionDivider} />}
              </React.Fragment>
            );
          })}

          {/* App Version Tag */}
          <Text style={styles.versionText}>v1.0.0.1</Text>
        </View>

        {/* 4. Logout Button */}
        <TouchableOpacity
          style={styles.logoutButtonWrap}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.logoutInner}>
            <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <User size={20} color="#F59E0B" />
                <Text style={styles.modalTitle}>User Profile</Text>
              </View>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.fieldInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Text style={styles.fieldStaticText}>{user?.email || 'N/A'}</Text>
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.fieldLabel}>Current Plan Tier</Text>
              <Text style={[styles.fieldStaticText, { color: '#FBBF24', fontWeight: '700' }]}>
                {user?.plan?.name || 'VIP Tier'}
              </Text>
            </View>

            {updateError && <Text style={styles.errorText}>{updateError}</Text>}

            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={handleSaveProfile}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FDE047', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.goldBtnGradient}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#0A0B10" size="small" />
                ) : (
                  <Text style={styles.saveProfileBtnText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Account / Bank Details Modal */}
      <Modal visible={showAccountModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CreditCard size={20} color="#F59E0B" />
                <Text style={styles.modalTitle}>Settlement Account</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.accountDesc}>
              Your linked bank account details for instant withdrawals and payout settlements.
            </Text>

            <View style={styles.accountInfoCard}>
              <View style={styles.accountRow}>
                <Text style={styles.accountRowLabel}>Bank Name</Text>
                <Text style={styles.accountRowVal}>State Bank of India</Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountRowLabel}>Account Holder</Text>
                <Text style={styles.accountRowVal}>{user?.fullName || 'Account Holder'}</Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountRowLabel}>Account No.</Text>
                <Text style={styles.accountRowVal}>•••• •••• 4821</Text>
              </View>
              <View style={styles.accountRow}>
                <Text style={styles.accountRowLabel}>IFSC Code</Text>
                <Text style={styles.accountRowVal}>SBIN0001245</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.manageWithdrawBtn}
              onPress={() => {
                setShowAccountModal(false);
                router.push('/withdraw');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.manageWithdrawBtnText}>Manage in Withdraw Screen →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gift Code Modal */}
      <Modal visible={showGiftModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Gift size={20} color="#F59E0B" />
                <Text style={styles.modalTitle}>Redeem Gift Code</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGiftModal(false)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.accountDesc}>
              Enter your promotional gift voucher code to claim instant credits to your wallet.
            </Text>

            <TextInput
              style={styles.giftInput}
              placeholder="e.g. BONUS2026"
              placeholderTextColor="#64748B"
              value={giftCode}
              onChangeText={setGiftCode}
              autoCapitalize="characters"
            />

            {giftResult && (
              <View
                style={[
                  styles.giftAlert,
                  { backgroundColor: giftResult.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.giftAlertText,
                    { color: giftResult.isError ? '#EF4444' : '#10B981' },
                  ]}
                >
                  {giftResult.text}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.redeemBtn}
              onPress={handleRedeemGift}
              disabled={isRedeeming}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FDE047', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.goldBtnGradient}
              >
                {isRedeeming ? (
                  <ActivityIndicator color="#0A0B10" size="small" />
                ) : (
                  <Text style={styles.redeemBtnText}>Redeem Code</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <LogOut size={20} color="#EF4444" />
                <Text style={[styles.modalTitle, { color: '#EF4444' }]}>Log Out</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLogoutModal(false)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.accountDesc}>
              Are you sure you want to log out of your DreamPay account? You will need to sign in again to access your assets.
            </Text>

            <View style={styles.logoutBtnRow}>
              <TouchableOpacity
                style={styles.cancelLogoutBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelLogoutBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmLogoutBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0B10',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },

  // Top Header: Avatar & Title
  topHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 10,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myAssetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  userIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  userIdText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FBBF24',
  },

  // 1. Assets Full-Width Card
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  assetSquircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  assetTextGroup: {
    justifyContent: 'center',
  },
  assetLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 2,
  },
  assetValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },

  // 2. Row of 2 Cards: Deposit & Withdraw
  dualCardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  statSquircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statTextGroup: {
    justifyContent: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },

  // 3. Options List Card (ALL 6 OPTIONS AS ROWS)
  optionsListCard: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  optionSublabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  optionDivider: {
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginLeft: 58,
  },
  versionText: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'right',
    paddingTop: 10,
    paddingBottom: 6,
    fontWeight: '500',
  },

  // 4. Logout Button
  logoutButtonWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  logoutInner: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#13151F',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalFieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  fieldStaticText: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
    paddingVertical: 6,
  },
  errorText: {
    fontSize: 12.5,
    color: '#EF4444',
    marginBottom: 10,
  },
  saveProfileBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
  },
  goldBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveProfileBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0B10',
  },

  // Account Modal
  accountDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 14,
  },
  accountInfoCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    gap: 8,
    marginBottom: 14,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountRowLabel: {
    fontSize: 12.5,
    color: '#94A3B8',
  },
  accountRowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  manageWithdrawBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  manageWithdrawBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FBBF24',
  },

  // Gift Modal
  giftInput: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '700',
    marginBottom: 12,
  },
  giftAlert: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  giftAlertText: {
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  redeemBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  redeemBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0B10',
  },

  // Logout Modal
  logoutBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelLogoutBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelLogoutBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  confirmLogoutBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmLogoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
