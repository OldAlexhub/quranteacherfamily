import React from 'react';
import {ScrollView, View, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {SectionHeader} from '../../components/layout/SectionHeader';
import {useTheme} from '../../theme';
import {Spacing} from '../../theme/spacing';

export function AttributionScreen() {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['bottom']}>
      <ScrollView contentContainerStyle={{padding: Spacing[4], paddingBottom: 40}} showsVerticalScrollIndicator={false}>

        <SectionHeader title="Content Attribution" />

        <AppCard style={{marginBottom: Spacing[4], borderColor: c.primary + '30'}}>
          <AppText variant="body" weight="semibold" style={{color: c.primary, marginBottom: Spacing[2]}}>Arabic Quran Text</AppText>
          <AppText variant="body" style={{marginBottom: Spacing[2]}}>Source: Tanzil Quran Text</AppText>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[1]}}>Website: tanzil.net</AppText>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>Script: Uthmani (Hafs)</AppText>
          <AppText variant="caption" style={{color: c.textMuted}}>The Arabic Quran text has not been modified in any way. This app uses the Tanzil text for educational purposes. Please see assets/licenses/tanzil-license.md for full license terms.</AppText>
        </AppCard>

        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="body" weight="semibold" style={{color: c.primary, marginBottom: Spacing[2]}}>English Meaning</AppText>
          <AppText variant="body" style={{marginBottom: Spacing[2]}}>The Meaning of the Glorious Koran</AppText>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[1]}}>Translation by Marmaduke Pickthall (1875–1936)</AppText>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>First published 1930. In the public domain.</AppText>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>Source: Project Gutenberg public domain text.</AppText>
          <AppText variant="caption" style={{color: c.textMuted, fontStyle: 'italic'}}>English meaning is optional and provided only to help understanding. It does not replace the Arabic Quran. Please see assets/licenses/pickthall-public-domain-notes.md for notes.</AppText>
        </AppCard>

        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="body" weight="semibold" style={{color: c.primary, marginBottom: Spacing[2]}}>Audio Recitation</AppText>
          <AppText variant="body" style={{marginBottom: Spacing[2]}}>Quranic Word-By-Word Audio Dataset</AppText>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[1]}}>Recitation styles: Muallim Teacher Style, Mujawwad Tajweed Style</AppText>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>License: Apache License 2.0</AppText>
          <AppText variant="caption" style={{color: c.textMuted}}>Audio is delivered via Google Play Asset Delivery. Full license text in assets/licenses/quran-word-audio-license.md.</AppText>
        </AppCard>

        <AppCard style={{backgroundColor: c.surfaceAlt}}>
          <AppText variant="caption" style={{color: c.textMuted}}>
            This app is a Quran learning companion built by Old Alex Hub. It does not claim to replace a qualified Quran teacher or Islamic scholar. No content modifications have been made to the Quran text. Arabic remains the primary language of this app.
          </AppText>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}
