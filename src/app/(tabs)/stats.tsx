import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Gift,
  Share2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Users,
  Award,
  ArrowRight,
  TrendingUp,
  X,
  Info,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';
import { getTeamStats, TeamStats } from '../../services';

export default function TeamsTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 20) + 10;
  const { user } = useAuth();

  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    getTeamStats(user)
      .then((data) => setStats(data))
      .catch((err) => console.warn('Failed to load team stats:', err))
      .finally(() => setIsLoading(false));
  }, [user]);

  const inviteLink = stats?.inviteLink || `https://dreampay.vip/invite?code=VIP2026`;

  const handleShare = async () => {
    try {
      await Clipboard.setStringAsync(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }

    try {
      await Share.share({
        title: 'Join My Team on DreamPay',
        message: `Join my team on DreamPay and start earning daily commissions! Invitation Link: ${inviteLink}`,
        url: inviteLink,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const totalCommissions = stats?.totalCommissions ?? 0;
  const commsYesterday = stats?.commissionsYesterday ?? 0;
  const commsToday = stats?.commissionsToday ?? 0;
  const teamMembers = stats?.totalTeamMembers ?? 0;
  const teamDeposit = stats?.totalTeamDeposit ?? 0;
  const newMembersToday = stats?.newMembersToday ?? 0;
  const newMembersYesterday = stats?.newMembersYesterday ?? 0;
  const currentVol = stats?.currentCommissionVolume ?? 0;
  const targetVol = stats?.targetCommissionVolume ?? 50000;
  const currentLevel = stats?.currentLevel ?? 'Level A';
  const progressPct = targetVol > 0 ? Math.min(Math.round((currentVol / targetVol) * 100), 100) : 0;

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Text style={styles.headerTitle}>Teams</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color="#F59E0B" style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* 1. Hero Card (Dark Golden Glassmorphism Gradient) */}
            <LinearGradient
              colors={['#2A1F08', '#1A1510', '#100E0A']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <Text style={styles.heroSub}>My Total Commissions</Text>
              <Text style={styles.heroAmount}>
                +₹{totalCommissions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/-
              </Text>

              {/* 4-Grid Stats Box */}
              <View style={styles.gridContainer}>
                {/* Box 1: Yesterday */}
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>Commissions Yesterday</Text>
                  <Text style={styles.gridValue}>+{commsYesterday.toFixed(2)}</Text>
                </View>

                {/* Box 2: Total Members */}
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>Total Team Members</Text>
                  <Text style={styles.gridValue}>+{teamMembers}</Text>
                </View>

                {/* Box 3: Today */}
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>Commissions Today</Text>
                  <Text style={styles.gridValue}>+{commsToday.toFixed(2)}</Text>
                </View>

                {/* Box 4: Total Deposit */}
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>Total Team Deposit</Text>
                  <Text style={styles.gridValue}>+{teamDeposit.toFixed(2)}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* 2. Invitation Card */}
            <View style={styles.invitationCard}>
              <View style={styles.inviteIconCircle}>
                <Gift size={22} color="#F59E0B" />
              </View>

              <View style={styles.inviteTextContainer}>
                <Text style={styles.inviteTitle}>Invitation</Text>
                <Text style={styles.inviteSub}>Share the Link to Invite</Text>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FDE047', '#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shareGradient}
                >
                  <Text style={styles.shareText}>Share</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* 3. New Team Members Card */}
            <View style={styles.contentCard}>
              <Text style={styles.cardSectionTitle}>New Team Members</Text>
              <Text style={styles.levelBadgeText}>{currentLevel}</Text>

              <View style={styles.statLineRow}>
                <Text style={styles.statLineLabel}>Today:</Text>
                <Text style={styles.statLineValue}>{newMembersToday}</Text>
              </View>

              <View style={styles.statLineRow}>
                <Text style={styles.statLineLabel}>Yesterday:</Text>
                <Text style={styles.statLineValue}>{newMembersYesterday}</Text>
              </View>
            </View>

            {/* 4. Commissions/Deposit Card */}
            <View style={styles.contentCard}>
              <Text style={styles.cardSectionTitle}>Commissions/Deposit</Text>
              <Text style={styles.levelBadgeText}>{currentLevel}</Text>

              <View style={styles.volumeRow}>
                <Text style={styles.volumeText}>
                  {currentVol.toFixed(2)}/{targetVol.toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDetailsModal(true)}
                  style={styles.viewDetailsBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewDetailsText}>View Details →</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={['#FDE047', '#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.max(progressPct, 6)}%` }]}
                />
              </View>
            </View>
          </>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* View Details Modal */}
      <Modal visible={showDetailsModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Award size={20} color="#F59E0B" />
                <Text style={styles.modalTitle}>Commission Structure</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Earn automatic perpetual commissions whenever members in your network deposit or trade.
            </Text>

            <View style={styles.tierBreakdown}>
              <View style={styles.tierItem}>
                <View style={styles.tierDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierName}>Level A (Direct Referrals)</Text>
                  <Text style={styles.tierDetail}>Earn 20% on all deposit volumes</Text>
                </View>
                <Text style={styles.tierRate}>20%</Text>
              </View>

              <View style={styles.tierItem}>
                <View style={[styles.tierDot, { backgroundColor: '#FBBF24' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierName}>Level B (Sub-Referrals)</Text>
                  <Text style={styles.tierDetail}>Earn 10% on secondary team trades</Text>
                </View>
                <Text style={styles.tierRate}>10%</Text>
              </View>

              <View style={styles.tierItem}>
                <View style={[styles.tierDot, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierName}>Level C (Extended Network)</Text>
                  <Text style={styles.tierDetail}>Earn 5% on 3rd tier community</Text>
                </View>
                <Text style={styles.tierRate}>5%</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowDetailsModal(false)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FDE047', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalCloseGradient}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  heroSub: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridBox: {
    width: '48%',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  gridLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  gridValue: {
    color: '#FBBF24',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  inviteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inviteTextContainer: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  inviteSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  shareButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  shareGradient: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    color: '#0A0B10',
    fontSize: 13.5,
    fontWeight: '800',
  },
  contentCard: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  levelBadgeText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FBBF24',
    marginBottom: 12,
  },
  statLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  statLineLabel: {
    fontSize: 13.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statLineValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  volumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  volumeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  viewDetailsBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#13151F',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalDesc: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  tierBreakdown: {
    gap: 12,
    marginBottom: 20,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  tierName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  tierDetail: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  tierRate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FBBF24',
  },
  modalCloseBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalCloseGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: '#0A0B10',
    fontSize: 14,
    fontWeight: '800',
  },
});
