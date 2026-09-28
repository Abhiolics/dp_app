import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Share2, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import GiftBox3DArt from './GiftBox3DArt';

export default function InviteBanner() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const inviteCode = user?._id ? user._id.slice(-6).toUpperCase() : 'VIP2026';
  const inviteLink = `https://dreampay.vip/invite?code=${inviteCode}`;

  const handleInvite = async () => {
    // 1. Copy link to clipboard
    try {
      await Clipboard.setStringAsync(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore
    }

    // 2. Open native share sheet with generated invite link
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

  return (
    <LinearGradient
      colors={['#241B08', '#16141F', '#0E0D14']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Left Text & CTA */}
      <View style={styles.leftContent}>
        <Text style={styles.title}>Invite Friends & Earn</Text>
        <Text style={styles.subtitle}>
          Grow your team and unlock VIP golden commissions!
        </Text>

        <TouchableOpacity
          style={styles.inviteButton}
          activeOpacity={0.85}
          onPress={handleInvite}
        >
          {copied ? (
            <>
              <Check size={14} color="#0A0B10" strokeWidth={2.8} />
              <Text style={styles.inviteText}>Link Copied!</Text>
            </>
          ) : (
            <>
              <Share2 size={13} color="#0A0B10" strokeWidth={2.5} />
              <Text style={styles.inviteText}>Invite Now</Text>
              <ArrowRight size={14} color="#0A0B10" strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Right 3D Gift Box & Coins Graphic */}
      <View style={styles.artWrapper}>
        <GiftBox3DArt />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 18,
    paddingLeft: 20,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.32)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
    overflow: 'hidden',
  },
  leftContent: {
    flex: 1,
    paddingRight: 8,
    zIndex: 2,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 4,
    maxWidth: 190,
  },
  inviteButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  inviteText: {
    color: '#0A0B10',
    fontSize: 12.5,
    fontWeight: '800',
  },
  artWrapper: {
    width: 120,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -6,
  },
});
