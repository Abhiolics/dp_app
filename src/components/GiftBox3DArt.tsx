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

export default function GiftBox3DArt() {
  return (
    <View style={styles.container}>
      <Svg width="125" height="105" viewBox="0 0 125 105" fill="none">
        <Defs>
          {/* Gift Box Base Gradient - Obsidian Onyx */}
          <LinearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#2D2418" />
            <Stop offset="50%" stopColor="#1E1810" />
            <Stop offset="100%" stopColor="#120E08" />
          </LinearGradient>

          {/* Gift Box Lid Gradient */}
          <LinearGradient id="lidGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#3E301D" />
            <Stop offset="100%" stopColor="#221A0F" />
          </LinearGradient>

          {/* Luxury Gold Ribbon Gradient */}
          <LinearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="50%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>

          {/* Gold Coin Gradient */}
          <LinearGradient id="goldCoinGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FDE68A" />
            <Stop offset="50%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>
          <LinearGradient id="goldRimGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF3C7" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>
        </Defs>

        {/* Floating Sparkle Stars */}
        <G transform="translate(18, 22) scale(0.8)">
          <Path
            d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z"
            fill="#FDE047"
          />
        </G>
        <G transform="translate(112, 30) scale(0.7)">
          <Path
            d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z"
            fill="#F59E0B"
          />
        </G>
        <G transform="translate(52, 6) scale(0.6)">
          <Path
            d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z"
            fill="#FBBF24"
          />
        </G>

        {/* Top Right Floating Gold Coin */}
        <G transform="translate(100, 18)">
          <Circle cx="0" cy="0" r="11" fill="url(#goldRimGrad)" />
          <Circle cx="-0.5" cy="-0.5" r="9.5" fill="url(#goldCoinGrad)" />
          <Circle cx="-0.5" cy="-0.5" r="8" stroke="#D97706" strokeWidth="0.6" fill="none" />
          <SvgText
            x="-0.5"
            y="3"
            fill="#92400E"
            fontSize="9"
            fontWeight="800"
            textAnchor="middle"
          >
            ₹
          </SvgText>
        </G>

        {/* Bottom Left Floating Gold Coin */}
        <G transform="translate(24, 76)">
          <Circle cx="0" cy="0" r="14" fill="url(#goldRimGrad)" />
          <Circle cx="-0.8" cy="-0.8" r="12.5" fill="url(#goldCoinGrad)" />
          <Circle cx="-0.8" cy="-0.8" r="10.5" stroke="#D97706" strokeWidth="0.8" fill="none" />
          <SvgText
            x="-0.8"
            y="3.8"
            fill="#92400E"
            fontSize="11"
            fontWeight="800"
            textAnchor="middle"
          >
            ₹
          </SvgText>
        </G>

        {/* Medium Floating Gold Coin (Top Center-Left) */}
        <G transform="translate(56, 32)">
          <Circle cx="0" cy="0" r="17" fill="url(#goldRimGrad)" />
          <Circle cx="-1" cy="-1" r="15" fill="url(#goldCoinGrad)" />
          <Circle cx="-1" cy="-1" r="12.5" stroke="#D97706" strokeWidth="0.8" fill="none" />
          <SvgText
            x="-1"
            y="4.5"
            fill="#92400E"
            fontSize="13"
            fontWeight="800"
            textAnchor="middle"
          >
            ₹
          </SvgText>
          {/* Highlight arc */}
          <Path
            d="M -8 -6 C -3 -11, 4 -11, 8 -6"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {/* 3D Gift Box Body */}
        <G transform="translate(52, 42)">
          {/* Box Shadow */}
          <Rect x="5" y="10" width="58" height="48" rx="8" fill="#881337" opacity={0.4} />

          {/* Box Container */}
          <Rect x="4" y="8" width="58" height="46" rx="8" fill="url(#boxGrad)" />

          {/* Vertical Purple Ribbon on Box */}
          <Rect x="28" y="8" width="10" height="46" fill="url(#ribbonGrad)" />

          {/* Box Lid */}
          <Rect x="0" y="2" width="66" height="12" rx="4" fill="url(#lidGrad)" />
          {/* Lid Ribbon */}
          <Rect x="28" y="2" width="10" height="12" fill="url(#ribbonGrad)" />

          {/* Ribbon Bow Loops */}
          {/* Left Loop */}
          <Path
            d="M 33 2 C 24 -12, 12 -2, 31 1 Z"
            fill="url(#ribbonGrad)"
          />
          {/* Right Loop */}
          <Path
            d="M 33 2 C 42 -12, 54 -2, 35 1 Z"
            fill="url(#ribbonGrad)"
          />
          {/* Center Bow Knot */}
          <Circle cx="33" cy="2" r="4.5" fill="#7E22CE" />
          <Circle cx="32" cy="1" r="2" fill="#A855F7" />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 125,
    height: 105,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
