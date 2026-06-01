import React, {useEffect, useState} from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import type {GestureResponderEvent, ViewStyle} from 'react-native';
import {useTheme} from '../../theme';
import {Spacing, Radii, Shadows} from '../../theme/spacing';
import type {Ayah, PracticeStatusType} from '../../types';
import {AppText} from '../common/AppText';

interface AyahCardProps {
  ayah: Ayah;
  showMeaning?: boolean;
  forceShowMeaning?: boolean;
  arabicFontSize?: number;
  englishFontSize?: number;
  practiceStatus?: PracticeStatusType;
  isBookmarked?: boolean;
  onPlay?: () => void;
  onBookmark?: () => void;
  onWordMode?: () => void;
  onStatusChange?: (status: PracticeStatusType) => void;
  onPress?: () => void;
  style?: ViewStyle;
}

export function AyahCard({
  ayah,
  showMeaning = false,
  forceShowMeaning,
  arabicFontSize = 28,
  englishFontSize = 15,
  practiceStatus,
  isBookmarked = false,
  onPlay,
  onBookmark,
  onWordMode,
  onStatusChange,
  onPress,
  style,
}: AyahCardProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [localShowMeaning, setLocalShowMeaning] = useState(showMeaning);
  const shouldShowMeaning = forceShowMeaning === true || localShowMeaning;

  useEffect(() => {
    if (forceShowMeaning === false) {
      setLocalShowMeaning(false);
    }
  }, [forceShowMeaning]);

  function handleInnerPress(event: GestureResponderEvent, action: () => void) {
    event.stopPropagation();
    action();
  }

  const statusColor = {
    memorized: c.memorized,
    practicing: c.practicing,
    needs_review: c.needsReview,
    learning: c.primaryLight,
    not_started: c.notStarted,
  }[practiceStatus ?? 'not_started'] ?? c.notStarted;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[{
        backgroundColor: c.surface,
        borderRadius: Radii.lg,
        marginBottom: Spacing[3],
        borderWidth: 1,
        borderColor: c.border,
        ...Shadows.sm,
      }, style]}
      accessibilityLabel={`Ayah ${ayah.surahNumber}:${ayah.ayahNumber}`}
    >
      {/* Ayah number + controls row */}
      <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingTop: Spacing[3]}}>
        <View style={{width: 30, height: 30, borderRadius: 15, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: Spacing[2]}}>
          <Text style={{color: '#fff', fontSize: 12, fontWeight: '700'}}>{ayah.ayahNumber}</Text>
        </View>
        <View style={{flex: 1}} />
        {practiceStatus && (
          <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: statusColor, marginRight: Spacing[2]}} />
        )}
        {onPlay ? (
          <TouchableOpacity onPress={event => handleInnerPress(event, onPlay)} style={styles.iconBtn} accessibilityLabel="Play ayah">
            <Text style={{color: c.primary, fontSize: 18}}>▶</Text>
          </TouchableOpacity>
        ) : null}
        {onBookmark ? (
          <TouchableOpacity onPress={event => handleInnerPress(event, onBookmark)} style={styles.iconBtn} accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
            <Text style={{color: isBookmarked ? c.accent : c.textMuted, fontSize: 18}}>🔖</Text>
          </TouchableOpacity>
        ) : null}
        {onWordMode ? (
          <TouchableOpacity onPress={event => handleInnerPress(event, onWordMode)} style={styles.iconBtn} accessibilityLabel="Word by word mode">
            <Text style={{color: c.primary, fontSize: 16}}>ا</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Arabic text */}
      <View style={{paddingHorizontal: Spacing[4], paddingVertical: Spacing[3]}}>
        <Text
          style={{
            color: c.textArabic,
            fontSize: arabicFontSize,
            textAlign: 'right',
            writingDirection: 'rtl',
            lineHeight: arabicFontSize * 2.2,
            fontWeight: '400',
          }}
          accessibilityLabel={`Arabic: ${ayah.arabicText}`}
        >
          {ayah.arabicText}
        </Text>
      </View>

      {/* Transliteration — always visible, helps non-Arabic readers follow along */}
      {ayah.transliteration ? (
        <View style={{paddingHorizontal: Spacing[4], paddingBottom: Spacing[2]}}>
          <Text style={{color: c.textMuted, fontSize: 11, marginBottom: 2}}>How to read:</Text>
          <Text style={{color: c.textSecondary, fontSize: englishFontSize * 0.9, lineHeight: englishFontSize * 1.5, fontStyle: 'italic'}}>
            {ayah.transliteration}
          </Text>
        </View>
      ) : null}

      {/* English meaning toggle */}
      {ayah.englishMeaning ? (
        <>
          {!shouldShowMeaning && (
            <TouchableOpacity
              onPress={event => handleInnerPress(event, () => setLocalShowMeaning(true))}
              style={{paddingHorizontal: Spacing[4], paddingBottom: Spacing[3]}}
              accessibilityLabel="Show English meaning"
            >
              <Text style={{color: c.primary, fontSize: 13}}>Show meaning</Text>
            </TouchableOpacity>
          )}
          {shouldShowMeaning && (
            <View style={{paddingHorizontal: Spacing[4], paddingBottom: Spacing[3]}}>
              <Text style={{color: c.textEnglish, fontSize: englishFontSize, lineHeight: englishFontSize * 1.6, fontStyle: 'italic'}}
                accessibilityLabel={`English meaning: ${ayah.englishMeaning}`}>
                {ayah.englishMeaning}
              </Text>
              {forceShowMeaning !== true ? (
                <TouchableOpacity
                  onPress={event => handleInnerPress(event, () => setLocalShowMeaning(false))}
                  style={{marginTop: 4}}
                  accessibilityLabel="Hide meaning"
                >
                  <Text style={{color: c.textMuted, fontSize: 12}}>Hide meaning</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
