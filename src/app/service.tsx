import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Headphones,
  Send,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
  HelpCircle,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getContacts, ContactChannel } from '../services';

const DEFAULT_CHANNELS: ContactChannel[] = [
  {
    _id: 'default-1',
    type: 'telegram',
    label: 'Official Telegram Channel',
    value: 'https://t.me/gdpe_official',
    isActive: true,
  },
  {
    _id: 'default-2',
    type: 'whatsapp',
    label: 'VIP WhatsApp Support',
    value: '+919876543210',
    isActive: true,
  },
];

const FAQS = [
  {
    q: 'How long does payment verification take?',
    a: 'Usually 2 to 5 minutes after uploading a valid UTR and transaction screenshot.',
  },
  {
    q: 'Where do I find my 12-digit UTR number?',
    a: 'In your UPI app (GooglePay, PhonePe, Paytm), open the payment receipt and look for "UPI Ref No." or "UTR".',
  },
  {
    q: 'How do daily task earnings work?',
    a: 'Complete tasks like joining community channels or subscribing, upload proof screenshot, and receive rewards directly into your wallet.',
  },
];

export default function ServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 20) + 10;

  const [channels, setChannels] = useState<ContactChannel[]>(DEFAULT_CHANNELS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const list = await getContacts();
        if (list && list.length > 0) {
          setChannels(list.filter((c) => c.isActive !== false));
        }
      } catch (err) {
        console.warn('Failed to load contacts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChannels();
  }, []);

  const handleContactPress = (channel: ContactChannel) => {
    let url = channel.value;

    if (channel.type === 'whatsapp') {
      const cleaned = channel.value.replace(/[^0-9]/g, '');
      url = `https://wa.me/${cleaned}`;
    } else if (channel.type === 'telegram') {
      if (!channel.value.startsWith('http')) {
        url = `https://t.me/${channel.value.replace('@', '')}`;
      }
    } else if (channel.type === 'email') {
      url = `mailto:${channel.value}`;
    } else if (channel.type === 'phone') {
      url = `tel:${channel.value}`;
    }

    Linking.openURL(url).catch((err) => console.warn('Could not open link:', err));
  };

  const getChannelIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'whatsapp':
        return <MessageCircle size={20} color="#10B981" />;
      case 'telegram':
        return <Send size={20} color="#0284C7" />;
      case 'email':
        return <Mail size={20} color="#7C3AED" />;
      case 'phone':
        return <Phone size={20} color="#F59E0B" />;
      default:
        return <Headphones size={20} color="#7C3AED" />;
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 24/7 Hero Support Card */}
        <LinearGradient
          colors={['#2A1F08', '#1A1510', '#100E0A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroIconCircle}>
              <Headphones size={24} color="#F59E0B" />
            </View>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Agents Online</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>24/7 Live Support Desk</Text>
          <Text style={styles.heroSub}>
            Have questions regarding payment proof, withdrawals, or tasks? Our support team is
            available around the clock.
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Clock size={14} color="#FBBF24" />
              <Text style={styles.heroStatText}>Avg response: ~2 mins</Text>
            </View>
            <View style={styles.heroStatItem}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.heroStatText}>100% Escrow Protected</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Official Channels List */}
        <Text style={styles.sectionTitle}>Official Support Channels</Text>

        {isLoading ? (
          <ActivityIndicator color="#F59E0B" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.channelsList}>
            {channels.map((channel) => (
              <TouchableOpacity
                key={channel._id}
                style={styles.channelCard}
                onPress={() => handleContactPress(channel)}
                activeOpacity={0.8}
              >
                <View style={styles.channelIconWrap}>{getChannelIcon(channel.type)}</View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.channelLabel}>{channel.label}</Text>
                  <Text style={styles.channelValue} numberOfLines={1}>
                    {channel.value}
                  </Text>
                </View>

                <ExternalLink size={16} color="#F59E0B" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <View style={styles.faqQuestionRow}>
                <HelpCircle size={16} color="#F59E0B" />
                <Text style={styles.faqQuestion}>{faq.q}</Text>
              </View>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  onlineText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatText: {
    fontSize: 11.5,
    color: '#CBD5E1',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  channelsList: {
    gap: 10,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13151F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    gap: 12,
  },
  channelIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  channelValue: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#13151F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  faqQuestion: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    paddingLeft: 24,
  },
});
