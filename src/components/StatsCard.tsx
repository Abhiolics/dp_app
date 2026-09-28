import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';

export default function StatsCard() {
  return (
    <View style={styles.container}>
      {/* Total Deposit */}
      <View style={styles.statColumn}>
        <View style={styles.depositIconCircle}>
          <ArrowUp size={18} color="#F59E0B" strokeWidth={2.8} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.statLabel}>Total Deposit</Text>
          <Text style={styles.statValue}>₹ 0.00</Text>
        </View>
      </View>

      {/* Center Divider */}
      <View style={styles.verticalDivider} />

      {/* Total Withdrawal */}
      <View style={styles.statColumn}>
        <View style={styles.withdrawIconCircle}>
          <ArrowDown size={18} color="#EF4444" strokeWidth={2.8} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.statLabel}>Total Withdrawal</Text>
          <Text style={styles.statValue}>₹ 0.00</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 21, 31, 0.82)',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  statColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  depositIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  withdrawIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    justifyContent: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  verticalDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 12,
  },
});
