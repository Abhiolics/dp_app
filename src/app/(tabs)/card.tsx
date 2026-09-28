import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  CreditCard,
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  Award,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { getPlans, getDeposits, MembershipPlan, DepositItem } from '../../services';

export interface CashbackOffer {
  id: string;
  currency: string;
  specialBonus: string;
  code: string;
  amount: number;
  income: number;
  category: 'Top Picks' | '100-199' | '200-299' | '300-599' | '600-999' | '1000+';
  planId?: string;
}

const DEFAULT_OFFERS: CashbackOffer[] = [
  {
    id: 'off-1',
    currency: 'INR',
    specialBonus: '+₹5.00 Special',
    code: 'IpTDIP',
    amount: 1000,
    income: 38,
    category: 'Top Picks',
  },
  {
    id: 'off-2',
    currency: 'INR',
    specialBonus: '+₹5.00 Special',
    code: 'LByeHA',
    amount: 1000,
    income: 38,
    category: 'Top Picks',
  },
  {
    id: 'off-3',
    currency: 'INR',
    specialBonus: '+₹5.00 Special',
    code: 'UYAfwH',
    amount: 1000,
    income: 38,
    category: 'Top Picks',
  },
  {
    id: 'off-4',
    currency: 'INR',
    specialBonus: '+₹2.00 Special',
    code: 'NM78KP',
    amount: 100,
    income: 4,
    category: '100-199',
  },
  {
    id: 'off-5',
    currency: 'INR',
    specialBonus: '+₹3.00 Special',
    code: 'QW24PL',
    amount: 150,
    income: 6,
    category: '100-199',
  },
  {
    id: 'off-6',
    currency: 'INR',
    specialBonus: '+₹3.50 Special',
    code: 'ZX99GH',
    amount: 200,
    income: 8,
    category: '200-299',
  },
  {
    id: 'off-7',
    currency: 'INR',
    specialBonus: '+₹4.00 Special',
    code: 'VC65TR',
    amount: 250,
    income: 10,
    category: '200-299',
  },
  {
    id: 'off-8',
    currency: 'INR',
    specialBonus: '+₹5.00 Special',
    code: 'PL43MN',
    amount: 500,
    income: 19,
    category: '300-599',
  },
  {
    id: 'off-9',
    currency: 'INR',
    specialBonus: '+₹8.00 Special',
    code: 'KJ88BV',
    amount: 800,
    income: 30,
    category: '600-999',
  },
  {
    id: 'off-10',
    currency: 'INR',
    specialBonus: '+₹15.00 Special',
    code: 'VIP2000',
    amount: 2000,
    income: 76,
    category: '1000+',
  },
  {
    id: 'off-11',
    currency: 'INR',
    specialBonus: '+₹50.00 Special',
    code: 'VIP5000',
    amount: 5000,
    income: 190,
    category: '1000+',
  },
];

type FilterCategory = 'Top Picks' | '100-199' | '200-299' | '300-599' | '600-999' | '1000+';

const FILTER_TABS: FilterCategory[] = [
  'Top Picks',
  '100-199',
  '200-299',
  '300-599',
  '600-999',
  '1000+',
];

export default function CardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 20) + 10;
  const { wallet, user } = useAuth();

  const [activeTab, setActiveTab] = useState<FilterCategory>('Top Picks');
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [totalDeposit, setTotalDeposit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<CashbackOffer | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const balance = wallet?.balance ?? 0;
  const pending = wallet?.pendingBalance ?? 0;

  useEffect(() => {
    Promise.allSettled([getPlans(), getDeposits()]).then(([plansRes, depRes]) => {
      if (plansRes.status === 'fulfilled') {
        setPlans(plansRes.value);
      }
      if (depRes.status === 'fulfilled' && Array.isArray(depRes.value)) {
        const approved = depRes.value
          .filter((d: DepositItem) => d.status === 'approved')
          .reduce((acc: number, d: DepositItem) => acc + (d.amount || 0), 0);
        setTotalDeposit(approved);
      }
      setIsLoading(false);
    });
  }, []);

  // Merge backend plans into offer structure
  const allOffers = useMemo(() => {
    if (!plans || plans.length === 0) return DEFAULT_OFFERS;

    const backendOffers: CashbackOffer[] = plans.map((p, idx) => {
      const amt = p.amount;
      let cat: FilterCategory = '1000+';
      if (amt >= 100 && amt <= 199) cat = '100-199';
      else if (amt >= 200 && amt <= 299) cat = '200-299';
      else if (amt >= 300 && amt <= 599) cat = '300-599';
      else if (amt >= 600 && amt <= 999) cat = '600-999';

      return {
        id: p._id,
        currency: 'INR',
        specialBonus: '+₹5.00 Special',
        code: p._id.slice(-6).toUpperCase(),
        amount: p.amount,
        income: Math.round(p.amount * 0.038),
        category: idx < 3 ? 'Top Picks' : cat,
        planId: p._id,
      };
    });

    // Combine with defaults ensuring Top Picks has items
    const combined = [...backendOffers, ...DEFAULT_OFFERS];
    // Deduplicate by ID
    const seen = new Set<string>();
    return combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [plans]);

  const displayedOffers = useMemo(() => {
    return allOffers.filter((o) => {
      if (activeTab === 'Top Picks') return o.category === 'Top Picks';
      if (activeTab === '100-199') return o.amount >= 100 && o.amount <= 199;
      if (activeTab === '200-299') return o.amount >= 200 && o.amount <= 299;
      if (activeTab === '300-599') return o.amount >= 300 && o.amount <= 599;
      if (activeTab === '600-999') return o.amount >= 600 && o.amount <= 999;
      if (activeTab === '1000+') return o.amount >= 1000;
      return true;
    });
  }, [allOffers, activeTab]);

  const handleClaim = (offer: CashbackOffer) => {
    setSelectedOffer(offer);
  };

  const handleProceedDeposit = (offer: CashbackOffer) => {
    setSelectedOffer(null);
    router.push({
      pathname: '/deposit',
      params: {
        planId: offer.planId || offer.id,
        planAmount: String(offer.amount),
      },
    });
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

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Sticky Top Section: Header & Big Hero Card */}
      <View style={[styles.stickyTopContainer, { paddingTop: topPadding }]}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Plans</Text>
        </View>

        {/* 1. Sticky Big Hero Card (Cashback Rate 3.8% + Vertical Ascending Bars Graphic) */}
        <LinearGradient
          colors={['#2A1F08', '#1A1510', '#100E0A']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Top Half of Hero */}
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>Cashback Rate</Text>
              <Text style={styles.heroRateText}>3.8%</Text>
            </View>

            {/* Ascending Histogram Bar Chart Graphic */}
            <View style={styles.barChartContainer}>
              <View style={[styles.barItem, { height: 12 }]} />
              <View style={[styles.barItem, { height: 18 }]} />
              <View style={[styles.barItem, { height: 26 }]} />
              <View style={[styles.barItem, { height: 34 }]} />
              <View style={[styles.barItem, { height: 42 }]} />
            </View>
          </View>

          {/* Divider Line */}
          <View style={styles.heroDivider} />

          {/* Bottom Half of Hero: 3-column stats */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.statItemLabel}>Balance</Text>
              <Text style={styles.statItemValue}>₹{balance.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.statVerticalDivider} />

            <View style={styles.heroStatItem}>
              <Text style={styles.statItemLabel}>Deposit</Text>
              <Text style={styles.statItemValue}>₹{totalDeposit.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.statVerticalDivider} />

            <View style={styles.heroStatItem}>
              <Text style={styles.statItemLabel}>Pending</Text>
              <Text style={styles.statItemValue}>₹{pending.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Scrollable Content Below Sticky Big Card */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Notice / Alert Banner */}
        <View style={styles.noticeBanner}>
          <AlertTriangle size={17} color="#D97706" style={{ marginTop: 1 }} />
          <Text style={styles.noticeText}>
            Please use Freecharge or Mobikwik wallet for payment!
          </Text>
        </View>

        {/* 3. Section Header: Available Offers & Refreshes Daily */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Available Offers</Text>
          <Text style={styles.refreshesDailyText}>Refreshes Daily</Text>
        </View>

        {/* 4. Filter Tabs Row (Horizontal Scroll) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
          style={styles.tabsScrollView}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#F59E0B', '#EAB308']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activePillGradient}
                  >
                    <Text style={styles.filterPillTextActive}>{tab}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.filterPillTextInactive}>{tab}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Offers List */}
        {isLoading ? (
          <ActivityIndicator color="#F59E0B" style={{ marginVertical: 40 }} />
        ) : displayedOffers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CreditCard size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No offers in {activeTab}</Text>
            <Text style={styles.emptySub}>
              Switch to Top Picks or check back soon for refreshed offers.
            </Text>
          </View>
        ) : (
          <View style={styles.offersList}>
            {displayedOffers.map((item) => {
              const isCopied = copiedCode === item.code;
              return (
                <View key={item.id} style={styles.offerCard}>
                  {/* Top Row: Currency, Special Badge, Code */}
                  <View style={styles.offerTopRow}>
                    <View style={styles.currencyAndBadgeRow}>
                      <Text style={styles.currencyText}>{item.currency}</Text>
                      <View style={styles.specialBadge}>
                        <Text style={styles.specialBadgeText}>{item.specialBonus}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.codeRow}
                      onPress={() => handleCopyCode(item.code)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.codeLabel}>Code: </Text>
                      <Text style={styles.codeValue}>{item.code}</Text>
                      {isCopied ? (
                        <Check size={12} color="#F59E0B" style={{ marginLeft: 3 }} />
                      ) : (
                        <Copy size={12} color="#94A3B8" style={{ marginLeft: 3 }} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Bottom Row: Amount, Income, Claim Button */}
                  <View style={styles.offerBottomRow}>
                    <View style={styles.metricsGroup}>
                      {/* Amount */}
                      <View style={styles.metricCol}>
                        <Text style={styles.metricLabel}>Amount</Text>
                        <Text style={styles.metricValueAmount}>
                          ₹{item.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      {/* Income */}
                      <View style={[styles.metricCol, { marginLeft: 28 }]}>
                        <Text style={styles.metricLabel}>Income</Text>
                        <Text style={styles.metricValueIncome}>+{item.income}</Text>
                      </View>
                    </View>

                    {/* Claim Button */}
                    <TouchableOpacity
                      style={styles.claimButtonWrap}
                      onPress={() => handleClaim(item)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#FDE047', '#F59E0B', '#D97706']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.claimButtonGradient}
                      >
                        <Text style={styles.claimButtonText}>Claim</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Claim / Confirmation Modal */}
      <Modal visible={!!selectedOffer} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={20} color="#F59E0B" />
                <Text style={styles.modalTitle}>Claim Cashback Offer</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedOffer(null)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {selectedOffer && (
              <View style={styles.modalBody}>
                <View style={styles.modalHeroBox}>
                  <Text style={styles.modalOfferAmount}>
                    ₹{selectedOffer.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.modalOfferSub}>
                    Guaranteed Return: +₹{selectedOffer.income} at 3.8% Cashback Rate
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Offer Code</Text>
                  <Text style={styles.detailValueBold}>{selectedOffer.code}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bonus Incentive</Text>
                  <Text style={[styles.detailValueBold, { color: '#FBBF24' }]}>
                    {selectedOffer.specialBonus}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Available Wallet</Text>
                  <Text style={styles.detailValue}>₹{balance.toLocaleString('en-IN')}</Text>
                </View>

                <TouchableOpacity
                  style={styles.confirmClaimBtn}
                  onPress={() => handleProceedDeposit(selectedOffer)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FDE047', '#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmClaimGradient}
                  >
                    <Text style={styles.confirmClaimText}>
                      Deposit & Activate Offer (₹{selectedOffer.amount})
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
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
  stickyTopContainer: {
    backgroundColor: '#0A0B10',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },

  // 1. Hero Card
  heroCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FBBF24',
    marginBottom: 2,
  },
  heroRateText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FDE047',
    letterSpacing: -0.5,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 44,
    gap: 4,
    paddingBottom: 2,
  },
  barItem: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    marginVertical: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginBottom: 2,
  },
  statItemValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statVerticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },

  // 2. Notice Banner
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 18,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FDE047',
    lineHeight: 16,
  },

  // 3. Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  refreshesDailyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },

  // 4. Filter Tabs
  tabsScrollView: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  filterPillActive: {
    borderColor: 'transparent',
  },
  activePillGradient: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterPillTextActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0B10',
  },
  filterPillTextInactive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },

  // 5. Offer Cards
  offersList: {
    gap: 12,
  },
  offerCard: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  offerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  currencyAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  specialBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  specialBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE047',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  codeValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FBBF24',
  },

  offerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricCol: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValueAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  metricValueIncome: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FBBF24',
  },
  claimButtonWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A0B10',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal
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
    gap: 12,
  },
  modalHeroBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  modalOfferAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FDE047',
  },
  modalOfferSub: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  confirmClaimBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  confirmClaimGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmClaimText: {
    color: '#0A0B10',
    fontSize: 14,
    fontWeight: '800',
  },
});
