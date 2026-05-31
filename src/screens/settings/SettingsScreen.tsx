import React from 'react';
import {View, Text, ScrollView, TouchableOpacity, Switch, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {SettingsStackParamList} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {BannerAdComponent} from '../../ads/BannerAdComponent';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {SectionHeader} from '../../components/layout/SectionHeader';
import {usePreferencesStore} from '../../store/usePreferencesStore';
import {storageClearAll} from '../../storage/storage';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

export function SettingsScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();
  const prefs = usePreferencesStore(s => s.preferences);
  const setTheme = usePreferencesStore(s => s.setTheme);
  const setArabicSize = usePreferencesStore(s => s.setArabicFontSize);
  const setEnglishSize = usePreferencesStore(s => s.setEnglishFontSize);
  const setEnglishHidden = usePreferencesStore(s => s.setEnglishHidden);
  const setRecStyle = usePreferencesStore(s => s.setRecitationStyle);
  const setDefaultRepeat = usePreferencesStore(s => s.setDefaultRepeatCount);
  const restoreDefaults = usePreferencesStore(s => s.restoreDefaults);

  function resetAllData() {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete ALL local data: learner profiles, progress, assignments, bookmarks, notes, and settings. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await storageClearAll();
            await usePreferencesStore.getState().restoreDefaults();
            Alert.alert('Done', 'All data has been cleared. Please restart the app.');
          },
        },
      ],
    );
  }

  function Row({label, right}: {label: string; right: React.ReactNode}) {
    return (
      <View style={{flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3], borderBottomWidth: 1, borderColor: c.border}}>
        <AppText variant="body" style={{flex: 1}}>{label}</AppText>
        {right}
      </View>
    );
  }

  function NavRow({label, screen}: {label: string; screen: keyof SettingsStackParamList}) {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate(screen as any)}
        style={{flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3], borderBottomWidth: 1, borderColor: c.border}}
        accessibilityLabel={label}
      >
        <AppText variant="body" style={{flex: 1}}>{label}</AppText>
        <Text style={{color: c.textMuted}}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['bottom']}>
      <ScrollView contentContainerStyle={{padding: Spacing[4], paddingBottom: 40}} showsVerticalScrollIndicator={false}>

        {/* Display */}
        <SectionHeader title="Display" />
        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>Theme</AppText>
          <View style={{flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[3]}}>
            {(['light', 'warm', 'dark'] as const).map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setTheme(t)}
                style={{flex: 1, paddingVertical: 8, borderRadius: Radii.md, backgroundColor: prefs.theme === t ? c.primary : c.surfaceAlt, borderWidth: 1, borderColor: prefs.theme === t ? c.primary : c.border, alignItems: 'center'}}
                accessibilityLabel={t}
              >
                <Text style={{color: prefs.theme === t ? '#fff' : c.textSecondary, fontSize: 13, textTransform: 'capitalize'}}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Row label="Arabic font size" right={
            <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
              <TouchableOpacity onPress={() => setArabicSize(Math.max(18, prefs.arabicFontSize - 2))} accessibilityLabel="Decrease Arabic font">
                <Text style={{color: c.primary, fontSize: 22}}>−</Text>
              </TouchableOpacity>
              <Text style={{color: c.textPrimary, fontSize: 14, minWidth: 28, textAlign: 'center'}}>{prefs.arabicFontSize}</Text>
              <TouchableOpacity onPress={() => setArabicSize(Math.min(48, prefs.arabicFontSize + 2))} accessibilityLabel="Increase Arabic font">
                <Text style={{color: c.primary, fontSize: 22}}>+</Text>
              </TouchableOpacity>
            </View>
          } />

          <Row label="English meaning font size" right={
            <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
              <TouchableOpacity onPress={() => setEnglishSize(Math.max(11, prefs.englishMeaningFontSize - 1))} accessibilityLabel="Decrease English font">
                <Text style={{color: c.primary, fontSize: 22}}>−</Text>
              </TouchableOpacity>
              <Text style={{color: c.textPrimary, fontSize: 14, minWidth: 28, textAlign: 'center'}}>{prefs.englishMeaningFontSize}</Text>
              <TouchableOpacity onPress={() => setEnglishSize(Math.min(22, prefs.englishMeaningFontSize + 1))} accessibilityLabel="Increase English font">
                <Text style={{color: c.primary, fontSize: 22}}>+</Text>
              </TouchableOpacity>
            </View>
          } />

          <Row label="Hide English meaning by default" right={
            <Switch
              value={prefs.englishMeaningDefaultHidden}
              onValueChange={setEnglishHidden}
              trackColor={{true: c.primary}}
              accessibilityLabel="Hide English meaning by default"
            />
          } />
        </AppCard>

        {/* Audio */}
        <SectionHeader title="Audio" />
        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>Default recitation style</AppText>
          <View style={{flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[3]}}>
            {[{value: 'muallim', label: 'Muallim'}, {value: 'mujawwad', label: 'Mujawwad'}].map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setRecStyle(opt.value as any)}
                style={{flex: 1, paddingVertical: 8, borderRadius: Radii.md, backgroundColor: prefs.selectedRecitationStyle === opt.value ? c.primary : c.surfaceAlt, borderWidth: 1, borderColor: prefs.selectedRecitationStyle === opt.value ? c.primary : c.border, alignItems: 'center'}}
                accessibilityLabel={opt.label}
              >
                <Text style={{color: prefs.selectedRecitationStyle === opt.value ? '#fff' : c.textSecondary, fontSize: 13}}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Row label="Default repeat count" right={
            <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
              <TouchableOpacity onPress={() => setDefaultRepeat(Math.max(1, prefs.defaultRepeatCount - 1))} accessibilityLabel="Decrease repeat">
                <Text style={{color: c.primary, fontSize: 22}}>−</Text>
              </TouchableOpacity>
              <Text style={{color: c.textPrimary, fontSize: 14, minWidth: 28, textAlign: 'center'}}>{prefs.defaultRepeatCount}</Text>
              <TouchableOpacity onPress={() => setDefaultRepeat(prefs.defaultRepeatCount + 1)} accessibilityLabel="Increase repeat">
                <Text style={{color: c.primary, fontSize: 22}}>+</Text>
              </TouchableOpacity>
            </View>
          } />
        </AppCard>

        {/* App info */}
        <SectionHeader title="App" />
        <AppCard style={{marginBottom: Spacing[4]}}>
          <NavRow label="About Quran Teacher Family" screen="About" />
          <NavRow label="Content Attribution" screen="Attribution" />
          <NavRow label="Privacy Policy" screen="PrivacyPolicy" />
        </AppCard>

        {/* Danger zone */}
        <SectionHeader title="Data" />
        <AppCard style={{marginBottom: Spacing[4]}}>
          <TouchableOpacity
            onPress={() => Alert.alert('Restore Defaults', 'Restore all display and audio settings to defaults? Your learning progress will not be affected.', [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Restore', onPress: restoreDefaults},
            ])}
            style={{paddingVertical: Spacing[3], borderBottomWidth: 1, borderColor: c.border}}
            accessibilityLabel="Restore default settings"
          >
            <AppText variant="body" style={{color: c.warning}}>Restore default settings</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={resetAllData}
            style={{paddingVertical: Spacing[3]}}
            accessibilityLabel="Reset all data"
          >
            <AppText variant="body" style={{color: c.error}}>Reset all local data</AppText>
            <AppText variant="caption" style={{color: c.textMuted, marginTop: 2}}>Deletes all learners, progress, assignments, bookmarks, notes</AppText>
          </TouchableOpacity>
        </AppCard>

        <AppText variant="caption" center style={{color: c.textMuted}}>
          Quran Teacher Family 1.0.0{'\n'}by Old Alex Hub
        </AppText>

      </ScrollView>
      {/* Banner ad — bottom of Settings, well away from settings controls */}
      <BannerAdComponent />
    </SafeAreaView>
  );
}
