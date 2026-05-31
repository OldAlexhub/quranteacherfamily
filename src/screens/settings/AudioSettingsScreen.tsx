import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {SectionHeader} from '../../components/layout/SectionHeader';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {usePreferencesStore} from '../../store/usePreferencesStore';

export function AudioSettingsScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const prefs = usePreferencesStore(s => s.preferences);
  const setRecStyle = usePreferencesStore(s => s.setRecitationStyle);
  const setDefaultRepeat = usePreferencesStore(s => s.setDefaultRepeatCount);

  return (
    <ScreenWrapper>
      <SectionHeader title="Recitation Style" />
      <AppCard style={{marginBottom: Spacing[4]}}>
        {[
          {value: 'muallim', label: 'Muallim Teacher Style', desc: 'Clear, measured. Ideal for children learning.'},
          {value: 'mujawwad', label: 'Mujawwad Tajweed Style', desc: 'Melodic with full Tajweed rules.'},
        ].map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setRecStyle(opt.value as any)}
            style={{flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing[3], borderBottomWidth: 1, borderColor: c.border}}
            accessibilityLabel={opt.label}
          >
            <View style={{width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: prefs.selectedRecitationStyle === opt.value ? c.primary : c.border, backgroundColor: prefs.selectedRecitationStyle === opt.value ? c.primary : 'transparent', marginRight: Spacing[3], marginTop: 2}} />
            <View style={{flex: 1}}>
              <AppText variant="body" weight={prefs.selectedRecitationStyle === opt.value ? 'semibold' : 'regular'}>{opt.label}</AppText>
              <AppText variant="caption" style={{color: c.textMuted}}>{opt.desc}</AppText>
            </View>
          </TouchableOpacity>
        ))}
      </AppCard>

      <SectionHeader title="Practice Defaults" />
      <AppCard style={{marginBottom: Spacing[4]}}>
        <View style={{flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3]}}>
          <AppText variant="body" style={{flex: 1}}>Default repeat count</AppText>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
            <TouchableOpacity onPress={() => setDefaultRepeat(Math.max(1, prefs.defaultRepeatCount - 1))} accessibilityLabel="Decrease">
              <Text style={{color: c.primary, fontSize: 22}}>−</Text>
            </TouchableOpacity>
            <Text style={{color: c.textPrimary, fontSize: 16, minWidth: 28, textAlign: 'center'}}>{prefs.defaultRepeatCount}</Text>
            <TouchableOpacity onPress={() => setDefaultRepeat(prefs.defaultRepeatCount + 1)} accessibilityLabel="Increase">
              <Text style={{color: c.primary, fontSize: 22}}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AppCard>

      <AppCard style={{backgroundColor: c.surfaceAlt}}>
        <AppText variant="caption" style={{color: c.textMuted}}>
          Audio is delivered via Google Play Asset Delivery. The Muallim and Mujawwad audio packs must be installed from Google Play before audio playback is available. No audio is streamed — all playback is offline.
        </AppText>
      </AppCard>
    </ScreenWrapper>
  );
}
