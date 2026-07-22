import React from 'react';
import {ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {useTheme} from '../../theme';
import {Spacing} from '../../theme/spacing';

function Section({title, body}: {title: string; body: string}) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <AppCard style={{marginBottom: Spacing[3]}}>
      <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2], color: c.primary}}>{title}</AppText>
      <AppText variant="body" style={{lineHeight: 24}}>{body}</AppText>
    </AppCard>
  );
}

export function PrivacyPolicyScreen() {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{padding: Spacing[4], paddingBottom: 40}} showsVerticalScrollIndicator={false}>
        <AppText variant="heading" weight="bold" style={{marginBottom: Spacing[1]}}>Privacy Policy</AppText>
        <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[4]}}>Quran Teacher Family — by Old Alex Hub</AppText>

        <Section
          title="Data Collection"
          body="Quran Teacher Family does not collect, transmit, sell, or share any personal data. The app has no backend server, no account system, no analytics SDK, and no advertising SDK."
        />
        <Section
          title="Local Storage"
          body="All data you create in this app — including learner profiles, bookmarks, notes, assignments, preferences, practice history, and progress — is stored only on your device. This data never leaves your device and is not accessible to Old Alex Hub."
        />
        <Section
          title="Internet Usage"
          body="The app does not require an internet connection to function. If Google Play Asset Delivery is used to deliver audio asset packs, Google Play may deliver app assets as part of installation or asset delivery. This is Google's standard app distribution system. The app itself does not send user learning data to Old Alex Hub or any other party."
        />
        <Section
          title="Permissions"
          body="The app may request notification permission (POST_NOTIFICATIONS) to support optional daily practice reminders. If you deny this permission, the app will continue to function normally without reminders. The app does not use location, camera, microphone, contacts, phone, SMS, or broad storage permissions."
        />
        <Section
          title="Children's Privacy"
          body="This app may be used by families and children under parent or guardian supervision. The app does not knowingly collect personal information from children. Learner profiles contain only optional names chosen by the parent. No email address, phone number, date of birth, or other personal information is required or collected."
        />
        <Section
          title="Data Deletion"
          body="You can delete individual learner data in the Parent Dashboard screen. You can delete all local app data in Settings > Reset all local data. You can also uninstall the app to remove all associated local data from your device."
        />
        <Section
          title="Content Attribution"
          body="Arabic Quran text: Tanzil project (tanzil.net). English meaning: Pickthall translation (public domain). Audio: Quranic Word-By-Word Audio Dataset (Apache 2.0). No modifications have been made to the Quran text."
        />
        <Section
          title="Disclaimer"
          body="This app is a Quran learning companion. It does not replace a qualified Quran teacher, imam, scholar, or Tajweed instructor. English meaning is provided only to help understanding and does not replace the Arabic Quran."
        />
        <Section
          title="Contact"
          body="For questions about this privacy policy, contact Old Alex Hub via the Google Play Store listing page."
        />
        <AppText variant="caption" style={{color: c.textMuted, textAlign: 'center', marginTop: Spacing[4]}}>
          Effective date: 2024{'\n'}Last updated: 2024
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
