import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Plus, ArrowDownToLine } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import Wallet3DArt from './Wallet3DArt';

export default function BalanceCard() {
  const router = useRouter();
  const { wallet } = useAuth();
  const [showBalance, setShowBalance] = useState(true);

  const balance = wallet?.balance ?? 0;

  return (
    <LinearGradient
      colors={['#241B08', '#16141F', '#0E0D14']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardContainer}
    >
      {/* Top Section: Balance Info & 3D Artwork */}
      <View style={styles.topSection}>
        {/* Balance Info */}
        <View style={styles.balanceInfo}>
          {/* Label + Eye Toggle */}
          <TouchableOpacity
            style={styles.labelRow}
            activeOpacity={0.7}
            onPress={() => setShowBalance(!showBalance)}
          >
            <Text style={styles.availableLabel}>Available Balance</Text>
            {showBalance ? (
              <Eye size={16} color="#FBBF24" strokeWidth={2.2} />
            ) : (
              <EyeOff size={16} color="#FBBF24" strokeWidth={2.2} />
            )}
          </TouchableOpacity>

          {/* Amount */}
          <Text style={styles.balanceText}>
            {showBalance ? `₹ ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹ ••••••'}
          </Text>
        </View>

        {/* 3D Wallet & Coins Illustration */}
        <View style={styles.artWrapper}>
          <Wallet3DArt />
        </View>
      </View>

      {/* Bottom Section: Action Buttons */}
      <View style={styles.actionButtonsRow}>
        {/* Deposit Button */}
        <TouchableOpacity
          style={styles.depositButton}
          activeOpacity={0.85}
          onPress={() => router.push('/deposit')}
        >
          <LinearGradient
            colors={['#FDE047', '#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.depositGradient}
          >
            <View style={styles.depositIconCircle}>
              <Plus size={16} color="#F59E0B" strokeWidth={3} />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.depositTitle}>Deposit</Text>
              <Text style={styles.depositSubtitle}>Add Funds</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Withdraw Button */}
        <TouchableOpacity
          style={styles.withdrawButton}
          activeOpacity={0.85}
          onPress={() => router.push('/withdraw')}
        >
          <View style={styles.withdrawIconCircle}>
            <ArrowDownToLine size={16} color="#F59E0B" strokeWidth={2.5} />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.withdrawTitle}>Withdraw</Text>
            <Text style={styles.withdrawSubtitle}>To Bank</Text>
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.32)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceInfo: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  availableLabel: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  balanceText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  artWrapper: {
    width: 150,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -10,
    marginTop: -8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  depositButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  depositGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  depositIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A0B10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  buttonTextContainer: {
    justifyContent: 'center',
  },
  depositTitle: {
    color: '#0A0B10',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 1,
  },
  depositSubtitle: {
    color: '#78350F',
    fontSize: 10.5,
    fontWeight: '700',
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  withdrawIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  withdrawTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  withdrawSubtitle: {
    color: '#FBBF24',
    fontSize: 10.5,
    fontWeight: '500',
  },
});
