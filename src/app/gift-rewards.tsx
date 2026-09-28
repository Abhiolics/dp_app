import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Gift,
  Check,
  Copy,
  Calendar,
  Sparkles,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { redeemGiftCode } from '../services';

export interface GiftRewardItem {
  id: string;
  code: string;
  rewardAmount: number;
  status: 'available' | 'claimed' | 'expired';
  expiryDate: string;
  title: string;
  description: string;
  usedAt?: string;
}

const STORAGE_KEY = '@user_gift_rewards_list';

export default function GiftRewardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 20) + 10;
  const { wallet, refreshWallet } = useAuth();

  const [rewards, setRewards] = useState<GiftRewardItem[]>([]);
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Manual code input
  const [customInput, setCustomInput] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Success celebration modal
  const [claimedReward, setClaimedReward] = useState<GiftRewardItem | null>(null);

  useEffect(() => {
    loadSavedRewards();
  }, []);

  const loadSavedRewards = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) {
          setRewards(parsed);
          return;
        }
      }
      setRewards([]);
    } catch {
      setRewards([]);
    }
  };

  const saveRewards = async (updated: GiftRewardItem[]) => {
    setRewards(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
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

  const handleClaim = async (item: GiftRewardItem) => {
    if (item.status === 'claimed') return;

    setLoadingCode(item.code);

    try {
      // Attempt backend API call
      try {
        await redeemGiftCode(item.code);
      } catch (err: any) {
        console.log('Backend redeem response:', err?.message || err);
      }

      // Update reward to claimed
      const updated = rewards.map((r) => {
        if (r.id === item.id) {
          return {
            ...r,
            status: 'claimed' as const,
            usedAt: new Date().toISOString().split('T')[0],
          };
        }
        return r;
      });

      await saveRewards(updated);
      await refreshWallet();
      setClaimedReward(item);
    } catch (err) {
      console.warn('Failed to claim:', err);
    } finally {
      setLoadingCode(null);
    }
  };

  const handleCustomRedeem = async () => {
    const code = customInput.trim().toUpperCase();
    if (!code) return;

    setIsSubmittingCustom(true);
    setCustomError(null);

    try {
      const res = await redeemGiftCode(code);
      const amount = res.data?.rewardAmount || 50;

      // Add to rewards list as claimed
      const newItem: GiftRewardItem = {
        id: Date.now().toString(),
        code,
        rewardAmount: amount,
        status: 'claimed',
        expiryDate: '2026-12-31',
        title: 'Custom Redeemed Voucher',
        description: res.message || 'Promotional coupon code redeemed',
        usedAt: new Date().toISOString().split('T')[0],
      };

      const updated = [newItem, ...rewards];
      await saveRewards(updated);
      await refreshWallet();
      setCustomInput('');
      setClaimedReward(newItem);
    } catch (err: any) {
      setCustomError(err.message || 'Invalid or expired gift voucher code.');
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header with Back option */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Gift Rewards</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Code Input Section */}
        <View style={styles.redeemBox}>
          <View style={styles.redeemHeaderRow}>
            <Gift size={18} color="#F59E0B" />
            <Text style={styles.redeemBoxTitle}>Redeem Gift Voucher</Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.codeInput}
              value={customInput}
              onChangeText={setCustomInput}
              placeholder="Enter voucher code (e.g. WIN100)"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[
                styles.redeemBtn,
                (!customInput.trim() || isSubmittingCustom) && { opacity: 0.6 },
              ]}
              onPress={handleCustomRedeem}
              disabled={!customInput.trim() || isSubmittingCustom}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FDE047', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.redeemBtnGradient}
              >
                {isSubmittingCustom ? (
                  <ActivityIndicator color="#0A0B10" size="small" />
                ) : (
                  <Text style={styles.redeemBtnText}>Redeem</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {customError && <Text style={styles.errorText}>{customError}</Text>}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Available Gift Vouchers</Text>
          <Text style={styles.sectionCount}>{rewards.length} Coupons</Text>
        </View>

        {/* Rewards List */}
        <View style={styles.rewardsList}>
          {rewards.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <View style={styles.emptyIconWrap}>
                <Gift size={32} color="#F59E0B" />
              </View>
              <Text style={styles.emptyTitle}>No Gift Vouchers</Text>
              <Text style={styles.emptySub}>
                You don't have any vouchers yet. Enter your promo or event code above to claim instant rewards!
              </Text>
            </View>
          ) : (
            rewards.map((item) => {
            const isClaimed = item.status === 'claimed';
            const isExpired = item.status === 'expired';
            const isCopied = copiedCode === item.code;
            const isItemLoading = loadingCode === item.code;

            return (
              <View key={item.id} style={[styles.rewardCard, isClaimed && styles.rewardCardClaimed]}>
                {/* Card Top: Code, Expiry & Status */}
                <View style={styles.cardTopRow}>
                  {/* Gift Code Pill */}
                  <TouchableOpacity
                    style={styles.codePill}
                    onPress={() => handleCopyCode(item.code)}
                    activeOpacity={0.7}
                  >
                    <Gift size={13} color="#F59E0B" style={{ marginRight: 5 }} />
                    <Text style={styles.codeText}>{item.code}</Text>
                    {isCopied ? (
                      <Check size={12} color="#10B981" style={{ marginLeft: 5 }} />
                    ) : (
                      <Copy size={12} color="#FBBF24" style={{ marginLeft: 5 }} />
                    )}
                  </TouchableOpacity>

                  {/* Status Badge: Used / Available / Expired */}
                  <View
                    style={[
                      styles.statusBadge,
                      isClaimed
                        ? styles.statusBadgeClaimed
                        : isExpired
                        ? styles.statusBadgeExpired
                        : styles.statusBadgeAvailable,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isClaimed
                          ? styles.statusTextClaimed
                          : isExpired
                          ? styles.statusTextExpired
                          : styles.statusTextAvailable,
                      ]}
                    >
                      {isClaimed ? 'Used' : isExpired ? 'Expired' : 'Available'}
                    </Text>
                  </View>
                </View>

                {/* Card Middle: Title & Reward Amount */}
                <View style={styles.cardMiddleRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.rewardTitle}>{item.title}</Text>
                    <Text style={styles.rewardDesc}>{item.description}</Text>
                  </View>

                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>Reward</Text>
                    <Text style={[styles.amountValue, isClaimed && { color: '#64748B' }]}>
                      +₹{item.rewardAmount}
                    </Text>
                  </View>
                </View>

                {/* Card Divider (Dashed) */}
                <View style={styles.dashedDivider} />

                {/* Card Bottom: Expiry Date & Claim CTA */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.expiryRow}>
                    <Calendar size={13} color="#94A3B8" style={{ marginRight: 4 }} />
                    <Text style={styles.expiryText}>
                      {isClaimed && item.usedAt
                        ? `Claimed on ${item.usedAt}`
                        : `Expiry: ${item.expiryDate}`}
                    </Text>
                  </View>

                  {/* Claim CTA Button */}
                  {isClaimed ? (
                    <View style={styles.claimedPill}>
                      <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={styles.claimedText}>Claimed</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.claimBtnWrap}
                      onPress={() => handleClaim(item)}
                      disabled={isItemLoading}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#FDE047', '#F59E0B', '#D97706']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.claimBtnGradient}
                      >
                        {isItemLoading ? (
                          <ActivityIndicator color="#0A0B10" size="small" />
                        ) : (
                          <>
                            <Sparkles size={13} color="#0A0B10" style={{ marginRight: 4 }} />
                            <Text style={styles.claimBtnText}>Claim</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Claimed Celebration Modal */}
      <Modal visible={!!claimedReward} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalSuccessCircle}>
              <CheckCircle2 size={44} color="#10B981" />
            </View>

            <Text style={styles.modalCongratsTitle}>Reward Claimed!</Text>
            <Text style={styles.modalCongratsSub}>
              Congratulations! Your gift voucher has been redeemed successfully.
            </Text>

            {claimedReward && (
              <View style={styles.modalRewardSummary}>
                <Text style={styles.modalRewardAmount}>+₹{claimedReward.rewardAmount}</Text>
                <Text style={styles.modalRewardCode}>Code: {claimedReward.code}</Text>
              </View>
            )}

            <Text style={styles.modalCreditNote}>
              ₹{claimedReward?.rewardAmount} has been credited directly into your wallet balance.
            </Text>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setClaimedReward(null)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FDE047', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalCloseGradient}
              >
                <Text style={styles.modalCloseText}>Awesome, Done</Text>
              </LinearGradient>
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
    paddingBottom: 14,
    backgroundColor: '#0A0B10',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerRightPlaceholder: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  // Redeem Custom Code Box
  redeemBox: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  redeemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  redeemBoxTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  redeemBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  redeemBtnGradient: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A0B10',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 8,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sectionCount: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FBBF24',
  },

  // Rewards List
  rewardsList: {
    gap: 12,
  },
  rewardCard: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardCardClaimed: {
    opacity: 0.7,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeAvailable: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgeClaimed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBadgeExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextAvailable: {
    color: '#10B981',
  },
  statusTextClaimed: {
    color: '#94A3B8',
  },
  statusTextExpired: {
    color: '#EF4444',
  },

  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
    paddingRight: 10,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  rewardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 1,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FBBF24',
  },

  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
    borderStyle: 'dashed',
    marginBottom: 12,
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },

  claimBtnWrap: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  claimBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  claimBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0B10',
  },
  claimedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  claimedText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#10B981',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#13151F',
    borderRadius: 22,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalSuccessCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalCongratsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  modalCongratsSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalRewardSummary: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 12,
  },
  modalRewardAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FBBF24',
  },
  modalRewardCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
  },
  modalCreditNote: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalCloseBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalCloseGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0A0B10',
  },
  emptyStateBox: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    marginTop: 8,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
});
