import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import EmptyTransactionsArt from './EmptyTransactionsArt';
import { getTransactions, TransactionItem } from '../services';

export default function RecentTransactions() {
  const router = useRouter();
  const [recent, setRecent] = useState<TransactionItem[]>([]);

  useEffect(() => {
    getTransactions({ limit: 3 })
      .then((res) => {
        if (res.data) setRecent(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Recent Transactions</Text>
        <TouchableOpacity
          style={styles.seeAllButton}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/wallet')}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={15} color="#F59E0B" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {recent.length === 0 ? (
        <View style={styles.card}>
          <EmptyTransactionsArt />
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptySubtitle}>Fund your wallet to get started</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/deposit')}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#FDE047', '#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topUpButton}
            >
              <Text style={styles.topUpText}>Deposit Now</Text>
              <ArrowRight size={16} color="#0A0B10" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listCard}>
          {recent.map((tx, idx) => {
            const isCredit = tx.type === 'credit';
            return (
              <TouchableOpacity
                key={tx._id}
                style={[
                  styles.txItem,
                  idx < recent.length - 1 && styles.txItemBorder,
                ]}
                onPress={() => router.push('/(tabs)/wallet')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.txIconWrap,
                    { backgroundColor: isCredit ? 'rgba(245, 158, 11, 0.16)' : 'rgba(239, 68, 68, 0.14)' },
                  ]}
                >
                  {isCredit ? (
                    <ArrowDownLeft size={16} color="#F59E0B" />
                  ) : (
                    <ArrowUpRight size={16} color="#EF4444" />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc} numberOfLines={1}>
                    {tx.description || tx.category.replace('_', ' ')}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.txAmount,
                    { color: isCredit ? '#FBBF24' : '#F87171' },
                  ]}
                >
                  {isCredit ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#F59E0B',
    fontSize: 13.5,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    elevation: 2,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  buttonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 26,
    gap: 6,
  },
  topUpText: {
    color: '#0A0B10',
    fontSize: 14,
    fontWeight: '800',
  },
  listCard: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    elevation: 2,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  txItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDesc: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  txDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  txAmount: {
    fontSize: 14.5,
    fontWeight: '800',
  },
});
