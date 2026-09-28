import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Headphones,
  CheckCircle2,
  Clock,
  Building2,
  User,
  CreditCard,
  Hash,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { requestWithdrawal, getWithdrawals, WithdrawalItem } from '../services';

export default function WithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 20) + 10;
  const { wallet, refreshUserData } = useAuth();

  const [activeTab, setActiveTab] = useState<'withdraw' | 'history'>('withdraw');

  // Form State
  const [amount, setAmount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // History State
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const availableBalance = wallet?.balance || 0;

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const list = await getWithdrawals();
      setWithdrawals(list);
    } catch (err) {
      console.warn('Failed loading withdrawals:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const handleSelectQuickAmount = (val: number) => {
    setAmount(String(val));
    setErrorMessage(null);
  };

  const handleSelectMax = () => {
    setAmount(String(availableBalance));
    setErrorMessage(null);
  };

  const isFormValid =
    Boolean(amount) &&
    Number(amount) > 0 &&
    Number(amount) <= availableBalance &&
    accountHolder.trim().length > 2 &&
    accountNumber.trim().length >= 6 &&
    ifscCode.trim().length >= 4;

  const handleSubmit = async () => {
    setErrorMessage(null);
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      setErrorMessage('Please enter a valid withdrawal amount.');
      return;
    }
    if (numAmount > availableBalance) {
      setErrorMessage('Withdrawal amount exceeds your available balance.');
      return;
    }
    if (!accountHolder.trim()) {
      setErrorMessage('Please enter the bank account holder name.');
      return;
    }
    if (!accountNumber.trim()) {
      setErrorMessage('Please enter the bank account number.');
      return;
    }
    if (!ifscCode.trim()) {
      setErrorMessage('Please enter the bank IFSC code.');
      return;
    }

    setIsSubmitting(true);

    try {
      await requestWithdrawal(numAmount, {
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        upiId: upiId.trim() || undefined,
      });

      setIsSubmitting(false);
      setShowSuccessModal(true);
      await refreshUserData();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Withdrawal request failed. Please try again.');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setAmount('');
    setActiveTab('history');
  };

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'withdraw' && styles.tabButtonActive]}
            onPress={() => setActiveTab('withdraw')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'withdraw' && styles.tabButtonTextActive,
              ]}
            >
              Withdraw
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.needHelpButton}
          onPress={() => router.push('/service')}
          activeOpacity={0.7}
        >
          <Headphones size={18} color="#F59E0B" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {activeTab === 'withdraw' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Balance Hero Card */}
          <LinearGradient
            colors={['#2A1F08', '#1A1510', '#100E0A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Available for Withdrawal</Text>
            <Text style={styles.balanceValue}>₹ {availableBalance.toLocaleString()}</Text>
            <Text style={styles.balanceSub}>
              Pending Settlement: ₹ {(wallet?.pendingBalance || 0).toLocaleString()}
            </Text>
          </LinearGradient>

          {/* Amount Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Withdrawal Amount (₹)</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(val) => {
                  setAmount(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="500"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>

            {/* Quick Chips */}
            <View style={styles.chipsRow}>
              {[500, 1000, 2500, 5000].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={styles.chip}
                  onPress={() => handleSelectQuickAmount(v)}
                >
                  <Text style={styles.chipText}>₹{v}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.chip, styles.chipMax]}
                onPress={handleSelectMax}
              >
                <Text style={[styles.chipText, styles.chipTextMax]}>All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bank Account Details */}
          <View style={styles.bankFormCard}>
            <View style={styles.bankFormTitleRow}>
              <Building2 size={18} color="#F59E0B" />
              <Text style={styles.bankFormTitle}>Beneficiary Bank Account</Text>
            </View>

            {/* Account Holder Name */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Account Holder Name</Text>
              <View style={styles.fieldInputRow}>
                <User size={16} color="#F59E0B" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="As per bank passbook"
                  placeholderTextColor="#64748B"
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                />
              </View>
            </View>

            {/* Account Number */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Account Number</Text>
              <View style={styles.fieldInputRow}>
                <Hash size={16} color="#F59E0B" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Enter full account number"
                  placeholderTextColor="#64748B"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* IFSC Code */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>IFSC Code</Text>
              <View style={styles.fieldInputRow}>
                <CreditCard size={16} color="#F59E0B" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. SBIN0001234"
                  placeholderTextColor="#64748B"
                  value={ifscCode}
                  onChangeText={(val) => setIfscCode(val.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* UPI ID (Optional) */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>UPI ID (Optional)</Text>
              <View style={styles.fieldInputRow}>
                <Sparkles size={16} color="#F59E0B" />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. name@upi"
                  placeholderTextColor="#64748B"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      ) : (
        /* WITHDRAWAL HISTORY TAB */
        <ScrollView
          contentContainerStyle={styles.historyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.historyHeaderRow}>
            <Text style={styles.historySectionTitle}>Your Withdrawal History</Text>
            <TouchableOpacity onPress={loadHistory} activeOpacity={0.7}>
              <RefreshCw size={16} color="#F59E0B" />
            </TouchableOpacity>
          </View>

          {isLoadingHistory ? (
            <ActivityIndicator color="#F59E0B" style={{ marginVertical: 32 }} />
          ) : withdrawals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Clock size={40} color="#64748B" />
              <Text style={styles.emptyTitle}>No Withdrawals Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your requested payouts will appear here with instant status updates.
              </Text>
            </View>
          ) : (
            withdrawals.map((item) => {
              const statusColor =
                item.status === 'approved'
                  ? '#10B981'
                  : item.status === 'rejected'
                  ? '#EF4444'
                  : '#F59E0B';

              return (
                <View key={item._id} style={styles.historyCard}>
                  <View style={styles.historyCardTop}>
                    <View>
                      <Text style={styles.historyAmount}>₹ {item.amount.toLocaleString()}</Text>
                      <Text style={styles.historyBankInfo}>
                        {item.bankDetails.accountHolder} •{' '}
                        {item.bankDetails.accountNumber.slice(-4).padStart(item.bankDetails.accountNumber.length, '•')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${statusColor}18`, borderColor: statusColor },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyCardDivider} />

                  <View style={styles.historyCardBottom}>
                    <Text style={styles.historyDate}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                    <Text style={styles.historyIfsc}>IFSC: {item.bankDetails.ifscCode}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Sticky Bottom Action Bar */}
      {activeTab === 'withdraw' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitButtonWrapper, !isFormValid && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                !isFormValid
                  ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']
                  : ['#FDE047', '#F59E0B', '#D97706']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0A0B10" size="small" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: !isFormValid ? '#64748B' : '#0A0B10' },
                  ]}
                >
                  Request Instant Withdrawal
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={40} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>Withdrawal Requested!</Text>
            <Text style={styles.modalDesc}>
              Your withdrawal request has been placed and debited from your wallet. Funds will be
              transferred to your registered bank account upon confirmation.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.85}
              onPress={handleSuccessClose}
            >
              <Text style={styles.modalButtonText}>View History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0B10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabButtonTextActive: {
    color: '#FBBF24',
    fontWeight: '700',
  },
  needHelpButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  balanceLabel: {
    color: '#FBBF24',
    fontSize: 12.5,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 6,
  },
  balanceSub: {
    color: '#94A3B8',
    fontSize: 11.5,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 14,
    height: 50,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBBF24',
  },
  chipMax: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  chipTextMax: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  bankFormCard: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  bankFormTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  bankFormTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  fieldBox: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '600',
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0B10',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  submitButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  historyContent: {
    padding: 16,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  historyCard: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  historyBankInfo: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  historyCardDivider: {
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginVertical: 10,
  },
  historyCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 11,
    color: '#64748B',
  },
  historyIfsc: {
    fontSize: 11,
    color: '#FBBF24',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#13151F',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#0A0B10',
    fontSize: 14,
    fontWeight: '800',
  },
});
