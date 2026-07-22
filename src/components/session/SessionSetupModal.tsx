import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../theme';
import {AppButton} from '../common/AppButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onStart: (studyMinutes: number, breakMinutes: number, targetAyahs: number) => void;
}

const STUDY_OPTIONS = [10, 15, 20, 30];
const BREAK_OPTIONS = [3, 5, 10];
const AYAH_OPTIONS = [3, 5, 10, 15];

export function SessionSetupModal({visible, onClose, onStart}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const [studyMins, setStudyMins] = useState(15);
  const [breakMins, setBreakMins] = useState(5);
  const [targetAyahs, setTargetAyahs] = useState(5);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.modalBackground}]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              marginLeft: insets.left,
              marginRight: insets.right,
              paddingBottom: Math.max(24, insets.bottom + 16),
            },
          ]}>
          <View style={styles.handle} />

          <Text style={[styles.title, {color: colors.textPrimary}]}>
            Set Your Practice Goal
          </Text>
          <Text style={[styles.subtitle, {color: colors.textMuted}]}>
            Short, focused sessions build strong habits
          </Text>

          {/* Study duration */}
          <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
            Practice time
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
            {STUDY_OPTIONS.map(min => (
              <TouchableOpacity
                key={min}
                onPress={() => setStudyMins(min)}
                accessibilityLabel={`${min} minute study session`}
                style={[
                  styles.chip,
                  {
                    backgroundColor: studyMins === min ? colors.primary : colors.surfaceAlt,
                    borderColor: studyMins === min ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {color: studyMins === min ? colors.textInverse : colors.textSecondary},
                  ]}>
                  {min} min
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Break duration */}
          <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
            Break after
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
            {BREAK_OPTIONS.map(min => (
              <TouchableOpacity
                key={min}
                onPress={() => setBreakMins(min)}
                accessibilityLabel={`${min} minute break`}
                style={[
                  styles.chip,
                  {
                    backgroundColor: breakMins === min ? colors.info : colors.surfaceAlt,
                    borderColor: breakMins === min ? colors.info : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {color: breakMins === min ? colors.textInverse : colors.textSecondary},
                  ]}>
                  {min} min
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Target ayahs */}
          <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
            Ayah goal
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
            {AYAH_OPTIONS.map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => setTargetAyahs(n)}
                accessibilityLabel={`Goal of ${n} ayahs`}
                style={[
                  styles.chip,
                  {
                    backgroundColor: targetAyahs === n ? colors.accent : colors.surfaceAlt,
                    borderColor: targetAyahs === n ? colors.accent : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {color: targetAyahs === n ? colors.textInverse : colors.textSecondary},
                  ]}>
                  {n} ayahs
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Summary */}
          <View style={[styles.summary, {backgroundColor: colors.surfaceAlt, borderColor: colors.border}]}>
            <Text style={[styles.summaryText, {color: colors.textSecondary}]}>
              📖 {studyMins} min study · ☕ {breakMins} min break · 🎯 {targetAyahs} ayahs
            </Text>
          </View>

          <AppButton
            label="Begin Practice"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => onStart(studyMins, breakMins, targetAyahs)}
          />
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, {color: colors.textMuted}]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end'},
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {fontSize: 22, fontWeight: '800', textAlign: 'center'},
  subtitle: {fontSize: 13, textAlign: 'center', marginBottom: 4},
  sectionLabel: {fontSize: 13, fontWeight: '700', marginTop: 4},
  optionRow: {flexGrow: 0},
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  chipText: {fontSize: 14, fontWeight: '700'},
  summary: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  summaryText: {fontSize: 13, fontWeight: '600'},
  cancelBtn: {alignItems: 'center', paddingVertical: 4},
  cancelText: {fontSize: 14},
});
