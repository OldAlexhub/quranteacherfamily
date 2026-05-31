import React from 'react';
import {View, StyleSheet} from 'react-native';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {BANNER_AD_UNIT_ID, ENABLE_BANNER_ADS} from '../config/adsConfig';

interface BannerAdComponentProps {
  size?: BannerAdSize;
}

/**
 * Reusable banner ad — renders nothing if ads are disabled or load fails.
 * Safe to place in any allowed location. Never inside Quran text, ayah streams,
 * teacher mode, or active audio/practice flows.
 */
export function BannerAdComponent({size = BannerAdSize.BANNER}: BannerAdComponentProps) {
  if (!ENABLE_BANNER_ADS) return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
          keywords: ['quran', 'islamic', 'education', 'family', 'children'],
        }}
        onAdFailedToLoad={() => {
          // Fail silently — never block the app
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    minHeight: 52,
  },
});
