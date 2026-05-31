import React from 'react';
import {View, TouchableOpacity, Text, ViewStyle} from 'react-native';
import {useTheme} from '../../theme';
import {Spacing, Radii, Shadows} from '../../theme/spacing';
import type {Surah} from '../../types';
import {ProgressBar} from '../progress/ProgressBar';

interface SurahCardProps {
  surah: Surah;
  progress?: number;
  isLastRead?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function SurahCard({surah, progress, isLastRead, onPress, style}: SurahCardProps) {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[{
        backgroundColor: c.surface,
        borderRadius: Radii.lg,
        marginBottom: Spacing[2],
        borderWidth: 1,
        borderColor: isLastRead ? c.primary : c.border,
        ...Shadows.sm,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
      }, style]}
      accessibilityLabel={`${surah.transliteration}, surah ${surah.number}`}
    >
      {/* Number badge */}
      <View style={{width: 38, height: 38, borderRadius: 10, backgroundColor: isLastRead ? c.primary : c.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: Spacing[3]}}>
        <Text style={{color: isLastRead ? '#fff' : c.textSecondary, fontSize: 14, fontWeight: '700'}}>{surah.number}</Text>
      </View>

      {/* Info */}
      <View style={{flex: 1}}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 2}}>
          <Text style={{color: c.textArabic, fontSize: 18, fontWeight: '500', textAlign: 'right', flex: 1}} numberOfLines={1}>
            {surah.arabicName}
          </Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <Text style={{color: c.textSecondary, fontSize: 13}}>{surah.transliteration}</Text>
          <Text style={{color: c.textMuted, fontSize: 12}}>{surah.ayahCount} ayahs</Text>
        </View>
        {progress !== undefined && progress > 0 ? (
          <ProgressBar progress={progress} height={4} style={{marginTop: 6}} />
        ) : null}
      </View>

      {isLastRead ? (
        <View style={{marginLeft: Spacing[2], paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.primary, borderRadius: Radii.full}}>
          <Text style={{color: '#fff', fontSize: 10}}>Last read</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
