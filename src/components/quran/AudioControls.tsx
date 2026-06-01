import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';

interface AudioControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onRepeat?: () => void;
  repeatCount?: number;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  reciterLabel?: string;
}

const SPEEDS = [0.75, 1.0, 1.25];

export function AudioControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrevious,
  onRepeat,
  repeatCount = 1,
  speed = 1.0,
  onSpeedChange,
  reciterLabel,
}: AudioControlsProps) {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <View style={{backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.border, paddingVertical: Spacing[3], paddingHorizontal: Spacing[4]}}>
      {reciterLabel ? (
        <Text style={{color: c.textMuted, fontSize: 12, textAlign: 'center', marginBottom: Spacing[2]}}>
          {reciterLabel}
        </Text>
      ) : null}

      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[3]}}>
        {onPrevious ? (
          <TouchableOpacity onPress={onPrevious} style={styles.ctrlBtn} accessibilityLabel="Previous ayah">
            <Text style={{color: c.textSecondary, fontSize: 22}}>⏮</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={isPlaying ? onPause : onPlay}
          style={[styles.playBtn, {backgroundColor: c.primary}]}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <Text style={{color: '#fff', fontSize: 28}}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onStop} style={styles.ctrlBtn} accessibilityLabel="Stop">
          <Text style={{color: c.textSecondary, fontSize: 22}}>⏹</Text>
        </TouchableOpacity>

        {onNext ? (
          <TouchableOpacity onPress={onNext} style={styles.ctrlBtn} accessibilityLabel="Next ayah">
            <Text style={{color: c.textSecondary, fontSize: 22}}>⏭</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing[2]}}>
        {(onRepeat || repeatCount > 1) ? (
          <TouchableOpacity
            onPress={onRepeat}
            disabled={!onRepeat}
            style={{flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.full, backgroundColor: c.primary + '18'}}
            accessibilityLabel={`Repeat ${repeatCount} times`}
          >
            <Text style={{color: c.primary, fontSize: 15}}>↻</Text>
            <Text style={{color: c.primary, fontSize: 13, fontWeight: '600'}}>{repeatCount}×</Text>
          </TouchableOpacity>
        ) : <View />}

        {onSpeedChange ? (
          <TouchableOpacity
            onPress={() => {
              const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
              onSpeedChange(next);
            }}
            accessibilityLabel={`Playback speed ${speed}x`}
          >
            <Text style={{color: c.textSecondary, fontSize: 13}}>{speed.toFixed(2)}×</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ctrlBtn: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  playBtn: {width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center'},
});
