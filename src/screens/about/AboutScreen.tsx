import React from 'react';
import {View, Text, Linking, TouchableOpacity} from 'react-native';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {SectionHeader} from '../../components/layout/SectionHeader';
import {useTheme} from '../../theme';
import {Spacing} from '../../theme/spacing';
import {useNavigation} from '@react-navigation/native';

export function AboutScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper>
      {/* App identity */}
      <View style={{alignItems: 'center', paddingVertical: Spacing[6]}}>
        <View style={{width: 72, height: 72, borderRadius: 18, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3]}}>
          <Text style={{fontSize: 32}}>📖</Text>
        </View>
        <AppText variant="title" weight="bold" center>Quran Teacher Family</AppText>
        <AppText variant="caption" center style={{color: c.primary, marginTop: 4}}>Version 1.0.0</AppText>
        <AppText variant="caption" center style={{color: c.textMuted}}>by Old Alex Hub</AppText>
      </View>

      <SectionHeader title="About this app" />
      <AppCard style={{marginBottom: Spacing[4]}}>
        <AppText variant="body" style={{marginBottom: Spacing[2]}}>
          Quran Teacher Family is an Arabic-first Quran teaching companion for Muslim families. It is designed to help parents teach their children Quran at home with Arabic recitation, word-by-word practice, memorization tracking, and optional English meaning.
        </AppText>
        <AppText variant="body">
          All data stays on your device. No internet connection is required for reading, practice, or progress tracking. Audio is delivered via Google Play Asset Delivery.
        </AppText>
      </AppCard>

      <SectionHeader title="Important disclaimers" />
      <AppCard style={{marginBottom: Spacing[4], borderColor: c.warning + '40'}}>
        <AppText variant="body" style={{marginBottom: Spacing[2]}}>
          This app is a learning companion only. It does not replace a qualified Quran teacher, Tajweed instructor, imam, or Islamic scholar.
        </AppText>
        <AppText variant="body" style={{marginBottom: Spacing[2]}}>
          English meaning is provided only to help understanding. It is not a replacement for the Arabic Quran.
        </AppText>
        <AppText variant="body">
          Memorization marked in this app is tracked by the parent. The app does not certify or verify Quran memorization.
        </AppText>
      </AppCard>

      <SectionHeader title="Content sources" />
      <AppCard style={{marginBottom: Spacing[4]}}>
        <TouchableOpacity onPress={() => navigation.navigate('Attribution')} accessibilityLabel="View content attribution">
          <AppText variant="body" style={{color: c.primary, marginBottom: Spacing[2]}}>View full content attribution →</AppText>
        </TouchableOpacity>
        <AppText variant="caption" style={{color: c.textMuted}}>
          Arabic Quran text: Tanzil project{'\n'}
          English meaning: Pickthall translation (public domain){'\n'}
          Audio: Quranic Word-By-Word Audio Dataset (Apache 2.0)
        </AppText>
      </AppCard>

      <SectionHeader title="Privacy" />
      <AppCard style={{marginBottom: Spacing[4]}}>
        <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} accessibilityLabel="View privacy policy">
          <AppText variant="body" style={{color: c.primary, marginBottom: Spacing[2]}}>View Privacy Policy →</AppText>
        </TouchableOpacity>
        <AppText variant="caption" style={{color: c.textMuted}}>
          This app does not collect, transmit, sell, or share any personal data. All learning data is stored locally on your device only.
        </AppText>
      </AppCard>

      <AppText variant="caption" center style={{color: c.textMuted, marginTop: Spacing[4]}}>
        © Old Alex Hub{'\n'}
        Package: com.oldalexhub.quranteacherfamily
      </AppText>
    </ScreenWrapper>
  );
}
