import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckSquare, Sparkles, Wallet, Headphones } from 'lucide-react-native';

export default function ActionButtons() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 1. Task Card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push('/tasks')}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
          <CheckSquare size={19} color="#38BDF8" strokeWidth={2.2} />
        </View>
        <Text style={styles.cardTitle}>Task</Text>
        <Text style={styles.cardSubtitle}>Earn Daily</Text>
      </TouchableOpacity>

      {/* 2. Plans Card */}
      <TouchableOpacity
        style={[styles.card, { borderColor: 'rgba(245, 158, 11, 0.45)' }]}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/card')}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.5)' }]}>
          <Sparkles size={19} color="#FBBF24" strokeWidth={2.2} />
        </View>
        <Text style={[styles.cardTitle, { color: '#FDE047' }]}>Plans</Text>
        <Text style={[styles.cardSubtitle, { color: '#F59E0B' }]}>VIP Tiers</Text>
      </TouchableOpacity>

      {/* 3. Money Card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/wallet')}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
          <Wallet size={19} color="#10B981" strokeWidth={2.2} />
        </View>
        <Text style={styles.cardTitle}>Money</Text>
        <Text style={styles.cardSubtitle}>History</Text>
      </TouchableOpacity>

      {/* 4. Service Card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push('/service')}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
          <Headphones size={19} color="#F59E0B" strokeWidth={2.2} />
        </View>
        <Text style={styles.cardTitle}>Service</Text>
        <Text style={styles.cardSubtitle}>24/7 Desk</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
  },
});
