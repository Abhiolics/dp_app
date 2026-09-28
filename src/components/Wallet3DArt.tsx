import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
  Text as SvgText,
} from 'react-native-svg';

export default function Wallet3DArt() {
  return (
    <View style={styles.container}>
      <Svg width="165" height="135" viewBox="0 0 165 135" fill="none">
        <Defs>
          {/* Wallet Body Gradient - Deep Obsidian with Gold Sheen */}
          <LinearGradient id="walletGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#3D2D16" />
            <Stop offset="60%" stopColor="#241B0D" />
            <Stop offset="100%" stopColor="#150F07" />
          </LinearGradient>

          {/* Wallet Flap Gradient - Pure Gold */}
          <LinearGradient id="flapGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>

          {/* Credit Card Gradient - Champagne Gold */}
          <LinearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>

          {/* Gold Coin Front Gradient */}
          <LinearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FDE68A" />
            <Stop offset="50%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>

          {/* Gold Coin Rim Gradient */}
          <LinearGradient id="coinRimGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF3C7" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>

          {/* Soft Shadow Filter Effect - Warm Gold Ambient */}
          <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(245, 158, 11, 0.35)" />
            <Stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
          </RadialGradient>
        </Defs>

        {/* Ambient Glow */}
        <Circle cx="100" cy="80" r="50" fill="url(#glowGrad)" />

        {/* Hand-drawn Annotation: "Grow Your Earnings" */}
        <SvgText
          x="142"
          y="18"
          fill="#D8B4FE"
          fontSize="10.5"
          fontStyle="italic"
          fontWeight="600"
          textAnchor="middle"
          letterSpacing="0.2"
        >
          Grow
        </SvgText>
        <SvgText
          x="142"
          y="29"
          fill="#D8B4FE"
          fontSize="10"
          fontStyle="italic"
          fontWeight="600"
          textAnchor="middle"
          letterSpacing="0.2"
        >
          Your
        </SvgText>
        <SvgText
          x="142"
          y="40"
          fill="#D8B4FE"
          fontSize="10"
          fontStyle="italic"
          fontWeight="600"
          textAnchor="middle"
          letterSpacing="0.2"
        >
          Earnings
        </SvgText>

        {/* Playful Curved Arrow curving down from text toward wallet */}
        <Path
          d="M 148 48 C 148 58, 138 64, 132 64"
          stroke="#C4B5FD"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrowhead */}
        <Path
          d="M 136 61 L 131 64 L 135 67"
          stroke="#C4B5FD"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Sparkles / Stars */}
        <G transform="translate(42, 22)">
          <Path
            d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z"
            fill="#FDE68A"
          />
        </G>
        <G transform="translate(108, 18) scale(0.8)">
          <Path
            d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z"
            fill="#FDE68A"
          />
        </G>
        <G transform="translate(118, 32) scale(0.6)">
          <Path
            d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z"
            fill="#FBBF24"
          />
        </G>

        {/* Credit Card sticking out of wallet */}
        <G transform="rotate(-6 70 55)">
          <Rect
            x="48"
            y="18"
            width="46"
            height="32"
            rx="6"
            fill="url(#cardGrad)"
          />
          {/* Card Chip / Notch details */}
          <Rect
            x="54"
            y="26"
            width="8"
            height="14"
            rx="2"
            fill="rgba(255,255,255,0.3)"
          />
          <Rect
            x="66"
            y="28"
            width="22"
            height="3"
            rx="1.5"
            fill="rgba(255,255,255,0.4)"
          />
        </G>

        {/* Main 3D Wallet Body */}
        <G>
          {/* Wallet Base Back Shadow */}
          <Rect
            x="38"
            y="44"
            width="78"
            height="58"
            rx="16"
            fill="#4C1D95"
          />
          {/* Wallet Front Body */}
          <Rect
            x="36"
            y="42"
            width="78"
            height="58"
            rx="16"
            fill="url(#walletGrad)"
          />
          {/* Upper Lighting Rim */}
          <Path
            d="M 44 42 L 106 42"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Wallet Flap Overlay */}
          <Path
            d="M 36 48 C 36 48, 65 52, 94 48 C 104 46, 114 54, 114 62 L 114 74 C 114 82, 106 88, 96 88 L 70 88 C 50 88, 36 78, 36 68 Z"
            fill="url(#flapGrad)"
          />

          {/* Metallic Clasp Button */}
          <Circle cx="98" cy="68" r="5" fill="#E2E8F0" />
          <Circle cx="98" cy="68" r="3" fill="#94A3B8" />
          <Circle cx="97" cy="67" r="1.2" fill="#FFFFFF" />
        </G>

        {/* Top Gold Coin (Peeking behind wallet) */}
        <G transform="translate(86, 32)">
          {/* Outer 3D Rim */}
          <Circle cx="0" cy="0" r="18" fill="url(#coinRimGrad)" />
          {/* Front Face */}
          <Circle cx="-0.8" cy="-0.8" r="16" fill="url(#coinGrad)" />
          {/* Inner Inset Ring */}
          <Circle
            cx="-0.8"
            cy="-0.8"
            r="13.5"
            stroke="#D97706"
            strokeWidth="0.8"
            fill="none"
          />
          {/* Rupee Symbol ₹ */}
          <SvgText
            x="-1"
            y="4.5"
            fill="#B45309"
            fontSize="14"
            fontWeight="800"
            textAnchor="middle"
          >
            ₹
          </SvgText>
        </G>

        {/* Bottom Right Floating Gold Coin (3D tilted) */}
        <G transform="translate(122, 68)">
          {/* 3D Depth Rim */}
          <Circle cx="2" cy="2" r="17" fill="#B45309" />
          <Circle cx="0" cy="0" r="17" fill="url(#coinRimGrad)" />
          <Circle cx="-1" cy="-1" r="15" fill="url(#coinGrad)" />
          <Circle
            cx="-1"
            cy="-1"
            r="12.5"
            stroke="#D97706"
            strokeWidth="0.8"
            fill="none"
          />
          <SvgText
            x="-1"
            y="4.5"
            fill="#B45309"
            fontSize="13"
            fontWeight="800"
            textAnchor="middle"
          >
            ₹
          </SvgText>
          {/* Coin Highlight */}
          <Path
            d="M -9 -7 C -4 -12, 4 -12, 9 -7"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 165,
    height: 135,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
