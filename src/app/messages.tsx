import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  CheckCheck,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationItem,
} from '../services';

type FilterType = 'All' | 'Unread';

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 20) + 10;
  const { refreshUnreadCount } = useAuth();

  const [filter, setFilter] = useState<FilterType>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadNotificationsList = async () => {
    try {
      setIsLoading(true);
      const list = await getNotifications();
      setNotifications(list);
      await refreshUnreadCount();
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationsList();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredList = notifications.filter((n) => {
    if (filter === 'Unread') return !n.isRead;
    return true;
  });

  const handleCardPress = async (item: NotificationItem) => {
    setExpandedId((prev) => (prev === item._id ? null : item._id));

    if (!item.isRead) {
      try {
        await markNotificationAsRead(item._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
        await refreshUnreadCount();
      } catch (err) {
        console.warn('Error marking notification as read:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refreshUnreadCount();
    } catch (err) {
      console.warn('Error marking all notifications as read:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="#10B981" />;
      case 'warning':
        return <AlertTriangle size={16} color="#F59E0B" />;
      case 'error':
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <Info size={16} color="#7C3AED" />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={styles.markAllBtn}
            activeOpacity={0.7}
          >
            <CheckCheck size={16} color="#F59E0B" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={loadNotificationsList}
            style={styles.markAllBtn}
            activeOpacity={0.7}
          >
            <RefreshCw size={15} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'All' && styles.filterTabActive]}
          onPress={() => setFilter('All')}
        >
          <Text style={[styles.filterTabText, filter === 'All' && styles.filterTabTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'Unread' && styles.filterTabActive]}
          onPress={() => setFilter('Unread')}
        >
          <Text style={[styles.filterTabText, filter === 'Unread' && styles.filterTabTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color="#F59E0B" style={{ marginVertical: 36 }} />
        ) : filteredList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={40} color="#64748B" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'Unread'
                ? "You've read all your notifications."
                : 'Account and payment updates will appear here.'}
            </Text>
          </View>
        ) : (
          filteredList.map((item) => {
            const isExpanded = expandedId === item._id;

            return (
              <TouchableOpacity
                key={item._id}
                style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
                onPress={() => handleCardPress(item)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircle}>{getTypeIcon(item.type)}</View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, !item.isRead && styles.unreadTitle]}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardTime}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  {!item.isRead && <View style={styles.unreadDot} />}
                  {isExpanded ? (
                    <ChevronUp size={16} color="#94A3B8" />
                  ) : (
                    <ChevronDown size={16} color="#94A3B8" />
                  )}
                </View>

                <Text
                  style={styles.cardMessage}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {item.message}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  markAllBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterTabActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  filterTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterTabTextActive: {
    color: '#0A0B10',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  emptyCard: {
    backgroundColor: '#13151F',
    borderRadius: 18,
    padding: 36,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  notificationCard: {
    backgroundColor: '#13151F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  unreadCard: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: '#181A26',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  unreadTitle: {
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginRight: 4,
  },
  cardMessage: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
});
