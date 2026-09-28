import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Copy,
  Check,
  Gift,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';
import {
  getTransactions,
  redeemGiftCode,
  getDeposits,
  getWithdrawals,
  TransactionItem,
} from '../../services';

export interface PaymentRecord {
  id: string;
  orderCode: string;
  amount: number;
  status: 'failed' | 'success' | 'pending';
  category: string;
  type: 'receive' | 'purchase';
  time: string;
  date: string;
  referenceId?: string;
  description?: string;
  rawDate: string;
}



function formatDateTime(isoString?: string) {
  try {
    const d = isoString ? new Date(isoString) : new Date();
    if (isNaN(d.getTime())) {
      return { time: '00:14:32', date: '2026-06-07' };
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return {
      time: `${hours}:${minutes}:${seconds}`,
      date: `${year}-${month}-${day}`,
    };
  } catch {
    return { time: '00:14:32', date: '2026-06-07' };
  }
}

function getOrderCode(item: { referenceId?: string; _id?: string; transactionRef?: string }): string {
  if (item.referenceId && item.referenceId.length >= 6) {
    const clean = item.referenceId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (clean.length >= 6) return clean.slice(-6);
  }
  if (item.transactionRef && item.transactionRef.length >= 6) {
    const clean = item.transactionRef.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (clean.length >= 6) return clean.slice(-6);
  }
  if (item._id) {
    return item._id.replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase();
  }
  return '78XQI9';
}

function normalizeStatus(status?: string): 'failed' | 'success' | 'pending' {
  const s = String(status || '').toLowerCase();
  if (s === 'failed' || s === 'rejected' || s === 'cancelled') return 'failed';
  if (s === 'completed' || s === 'approved' || s === 'success') return 'success';
  return 'pending';
}

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 20) + 10;
  const { wallet, refreshUserData, refreshWallet } = useAuth();

  const [activeTab, setActiveTab] = useState<'Receive' | 'Purchase'>('Purchase');
  const [allRecords, setAllRecords] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);

  // Gift Code Modal
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [giftMessage, setGiftMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch wallet transactions
      const [txRes, depRes, withRes] = await Promise.allSettled([
        getTransactions({ limit: 100 }),
        getDeposits(),
        getWithdrawals(),
      ]);

      const records: PaymentRecord[] = [];
      const seenIds = new Set<string>();

      // Process Transactions
      if (txRes.status === 'fulfilled' && txRes.value?.data?.length > 0) {
        txRes.value.data.forEach((tx) => {
          seenIds.add(tx._id);
          const dt = formatDateTime(tx.createdAt);
          const isCredit = tx.type === 'credit';
          records.push({
            id: tx._id,
            orderCode: getOrderCode(tx),
            amount: tx.amount,
            status: normalizeStatus(tx.status),
            category: tx.category || (isCredit ? 'Credit' : 'Debit'),
            type: isCredit ? 'receive' : 'purchase',
            time: dt.time,
            date: dt.date,
            referenceId: tx.referenceId,
            description: tx.description,
            rawDate: tx.createdAt,
          });
        });
      }

      // Process Deposits (into Receive)
      if (depRes.status === 'fulfilled' && Array.isArray(depRes.value)) {
        depRes.value.forEach((dep) => {
          if (!seenIds.has(dep._id)) {
            seenIds.add(dep._id);
            const dt = formatDateTime(dep.createdAt);
            records.push({
              id: dep._id,
              orderCode: getOrderCode(dep),
              amount: dep.amount,
              status: normalizeStatus(dep.status),
              category: 'Deposit',
              type: 'receive',
              time: dt.time,
              date: dt.date,
              referenceId: dep.transactionRef,
              description: dep.adminRemark || 'Account Deposit',
              rawDate: dep.createdAt,
            });
          }
        });
      }

      // Process Withdrawals (into Purchase)
      if (withRes.status === 'fulfilled' && Array.isArray(withRes.value)) {
        withRes.value.forEach((w) => {
          if (!seenIds.has(w._id)) {
            seenIds.add(w._id);
            const dt = formatDateTime(w.createdAt);
            records.push({
              id: w._id,
              orderCode: getOrderCode(w),
              amount: w.amount,
              status: normalizeStatus(w.status),
              category: 'Withdrawal',
              type: 'purchase',
              time: dt.time,
              date: dt.date,
              description: w.adminRemark || 'Withdrawal Payout',
              rawDate: w.createdAt,
            });
          }
        });
      }

      // Sort descending by date if records exist
      records.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
      setAllRecords(records);
    } catch (err) {
      console.warn('Failed to load payment history:', err);
      setAllRecords([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshUserData(), refreshWallet(), loadData()]);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Ignore
    }
  };

  const handleRedeemGift = async () => {
    if (!giftCodeInput.trim()) return;
    setIsRedeeming(true);
    setGiftMessage(null);

    try {
      const res = await redeemGiftCode(giftCodeInput);
      setGiftMessage({
        text: res.message || 'Successfully redeemed!',
        isError: false,
      });
      setGiftCodeInput('');
      await refreshWallet();
      await loadData();
    } catch (err: any) {
      setGiftMessage({
        text: err.message || 'Invalid or expired gift voucher code.',
        isError: true,
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const currentTabType = activeTab === 'Receive' ? 'receive' : 'purchase';
  const displayedRecords = allRecords.filter((r) => r.type === currentTabType);

  const getStatusBadge = (status: 'failed' | 'success' | 'pending') => {
    switch (status) {
      case 'failed':
        return {
          bg: '#EF4444',
          text: '#FFFFFF',
          label: 'Failed',
        };
      case 'success':
        return {
          bg: '#10B981',
          text: '#FFFFFF',
          label: 'Success',
        };
      case 'pending':
      default:
        return {
          bg: '#F59E0B',
          text: '#FFFFFF',
          label: 'Pending',
        };
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header matching design */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerSide}>
          {router.canGoBack() && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#F8FAFC" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.headerTitle}>Payment History</Text>

        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <TouchableOpacity
            style={styles.giftIconBtn}
            onPress={() => setShowGiftModal(true)}
            activeOpacity={0.7}
          >
            <Gift size={18} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
        }
      >
        {/* Segmented Control [ Receive | Purchase ] */}
        <View style={styles.segmentedContainer}>
          {/* Tab 1: Receive */}
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === 'Receive' && styles.segmentTabActive,
            ]}
            onPress={() => setActiveTab('Receive')}
            activeOpacity={0.85}
          >
            {activeTab === 'Receive' ? (
              <LinearGradient
                colors={['#FDE047', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.segmentGradient}
              >
                <Text style={styles.segmentTextActive}>Receive</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.segmentTextInactive}>Receive</Text>
            )}
          </TouchableOpacity>

          {/* Tab 2: Purchase */}
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === 'Purchase' && styles.segmentTabActive,
            ]}
            onPress={() => setActiveTab('Purchase')}
            activeOpacity={0.85}
          >
            {activeTab === 'Purchase' ? (
              <LinearGradient
                colors={['#FDE047', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.segmentGradient}
              >
                <Text style={styles.segmentTextActive}>Purchase</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.segmentTextInactive}>Purchase</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content list */}
        {isLoading ? (
          <ActivityIndicator color="#7C3AED" style={{ marginVertical: 40 }} />
        ) : displayedRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CreditCard size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No {activeTab} Records</Text>
            <Text style={styles.emptySubtitle}>
              Your {activeTab.toLowerCase()} transactions will appear here once processed.
            </Text>
          </View>
        ) : (
          displayedRecords.map((item) => {
            const badge = getStatusBadge(item.status);
            const isCopied = copiedCode === item.orderCode;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.paymentCard}
                activeOpacity={0.85}
                onPress={() => setSelectedRecord(item)}
              >
                {/* Top Row: Amount & Status Badge */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.amountText}>
                    ₹{item.amount.toLocaleString('en-IN')}/-
                  </Text>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Bottom Row: Order Code & Time/Date */}
                <View style={styles.cardBottomRow}>
                  {/* Order Code */}
                  <TouchableOpacity
                    style={styles.orderCodeContainer}
                    onPress={() => handleCopyCode(item.orderCode)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.orderCodeLabel}>Order Code: </Text>
                    <Text style={styles.orderCodeValue}>{item.orderCode}</Text>
                    {isCopied ? (
                      <Check size={13} color="#10B981" style={{ marginLeft: 4 }} />
                    ) : (
                      <Copy size={13} color="#94A3B8" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>

                  {/* Time and Date */}
                  <View style={styles.dateTimeContainer}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Transaction Detail Modal */}
      <Modal visible={!!selectedRecord} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setSelectedRecord(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedRecord && (
              <View style={styles.modalBody}>
                <View style={styles.detailAmountRow}>
                  <Text style={styles.modalAmount}>
                    ₹{selectedRecord.amount.toLocaleString('en-IN')}/-
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBadge(selectedRecord.status).bg },
                    ]}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
                      {getStatusBadge(selectedRecord.status).label}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Code</Text>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    onPress={() => handleCopyCode(selectedRecord.orderCode)}
                  >
                    <Text style={styles.detailValueBold}>{selectedRecord.orderCode}</Text>
                    <Copy size={13} color="#7C3AED" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>
                    {selectedRecord.type === 'receive' ? 'Receive (Credit)' : 'Purchase (Debit)'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{selectedRecord.category}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Timestamp</Text>
                  <Text style={styles.detailValue}>
                    {selectedRecord.date} {selectedRecord.time}
                  </Text>
                </View>

                {selectedRecord.referenceId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference ID</Text>
                    <Text style={[styles.detailValue, { maxWidth: 160 }]} numberOfLines={1}>
                      {selectedRecord.referenceId}
                    </Text>
                  </View>
                )}

                {selectedRecord.description && (
                  <View style={styles.detailRowDesc}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailDesc}>{selectedRecord.description}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedRecord(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Gift Voucher Redeem Modal */}
      <Modal visible={showGiftModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Gift size={20} color="#7C3AED" />
                <Text style={styles.modalTitle}>Redeem Gift Voucher</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGiftModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.giftModalDesc}>
              Enter your promotional gift voucher code to claim instant credits to your wallet.
            </Text>

            <TextInput
              style={styles.giftInput}
              placeholder="e.g. VIPBONUS50"
              placeholderTextColor="#94A3B8"
              value={giftCodeInput}
              onChangeText={setGiftCodeInput}
              autoCapitalize="characters"
            />

            {giftMessage && (
              <View
                style={[
                  styles.giftAlert,
                  { backgroundColor: giftMessage.isError ? '#FEE2E2' : '#DCFCE7' },
                ]}
              >
                <Text
                  style={[
                    styles.giftAlertText,
                    { color: giftMessage.isError ? '#DC2626' : '#15803D' },
                  ]}
                >
                  {giftMessage.text}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.redeemSubmitBtn, isRedeeming && { opacity: 0.6 }]}
              onPress={handleRedeemGift}
              disabled={isRedeeming}
              activeOpacity={0.8}
            >
              {isRedeeming ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.redeemSubmitBtnText}>Redeem Code</Text>
              )}
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0A0B10',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerSide: {
    width: 40,
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  giftIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 110,
  },

  // Segmented Control
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    padding: 3,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  segmentTabActive: {
    // Active styling handled by LinearGradient
  },
  segmentGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentTextActive: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0A0B10',
  },
  segmentTextInactive: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Payment Card (Dark Golden Glass Card)
  paymentCard: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  orderCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderCodeLabel: {
    fontSize: 13.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  orderCodeValue: {
    fontSize: 13.5,
    color: '#FBBF24',
    fontWeight: '700',
  },
  dateTimeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    borderWidth: 1.5,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modalBody: {
    gap: 10,
  },
  detailAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FDE047',
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailRowDesc: {
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  detailValueBold: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FBBF24',
  },
  detailDesc: {
    fontSize: 12.5,
    color: '#CBD5E1',
    lineHeight: 18,
    marginTop: 4,
  },
  modalCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },

  // Gift Modal
  giftModalDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 14,
  },
  giftInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '600',
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
  redeemSubmitBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  redeemSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0B10',
  },
});
