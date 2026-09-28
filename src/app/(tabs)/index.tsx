import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Header from '../../components/Header';
import BalanceCard from '../../components/BalanceCard';
import StatsCard from '../../components/StatsCard';
import ActionButtons from '../../components/ActionButtons';
import RecentTransactions from '../../components/RecentTransactions';
import InviteBanner from '../../components/InviteBanner';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const { refreshUserData, refreshWallet } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshUserData(), refreshWallet()]);
    } catch {
      // Ignore
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Sticky Top Section: Header & Big Balance Card */}
      <View style={styles.stickyTopContainer}>
        <Header />
        <BalanceCard />
      </View>

      {/* Scrollable Content Below Sticky Big Card */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
        }
      >
        <StatsCard />
        <ActionButtons />
        <RecentTransactions />
        <InviteBanner />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B10',
  },
  stickyTopContainer: {
    backgroundColor: '#0A0B10',
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: 115, // Clearance for elevated bottom tab bar
  },
});
