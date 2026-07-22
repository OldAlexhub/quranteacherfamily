import React, {useState} from 'react';
import {View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {HomeStackParamList} from '../../types';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {AppButton} from '../../components/common/AppButton';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {useLearnerStore} from '../../store/useLearnerStore';
import type {AvatarColor} from '../../types';

type Route = RouteProp<HomeStackParamList, 'EditLearner'>;

const COLORS: AvatarColor[] = ['#1B4332', '#2980B9', '#8E44AD', '#D35400', '#16A085', '#2C3E50'];

export function EditLearnerScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const {learnerId} = route.params;
  const learners = useLearnerStore(s => s.learners);
  const updateLearner = useLearnerStore(s => s.updateLearner);

  const learner = learners.find(l => l.id === learnerId);
  const [name, setName] = useState(learner?.displayName ?? '');
  const [color, setColor] = useState<AvatarColor>(learner?.avatarColor ?? COLORS[0]);
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!learner) {
    return (
      <ScreenWrapper>
        <AppText variant="body" style={{color: c.textMuted}}>Learner not found.</AppText>
      </ScreenWrapper>
    );
  }

  function validateName(n: string) {
    const t = n.trim();
    if (t.length > 30) setNameError('Name must be 30 characters or less');
    else setNameError('');
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (trimmed.length > 30) { Alert.alert('Name too long'); return; }
    setLoading(true);
    await updateLearner(learnerId, {displayName: trimmed, avatarColor: color});
    setLoading(false);
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenWrapper>
        <AppCard style={{marginBottom: Spacing[3]}}>
          <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Name</AppText>
          <TextInput
            value={name}
            onChangeText={t => { setName(t); validateName(t); }}
            placeholder="Learner name"
            placeholderTextColor={c.textMuted}
            maxLength={32}
            style={{borderWidth: 1, borderColor: nameError ? c.error : c.border, borderRadius: Radii.md, padding: Spacing[3], color: c.textPrimary, fontSize: 16, backgroundColor: c.surfaceAlt}}
            accessibilityLabel="Learner name"
          />
          {nameError ? <AppText variant="caption" style={{color: c.error, marginTop: 4}}>{nameError}</AppText> : null}
        </AppCard>

        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Color</AppText>
          <View style={{flexDirection: 'row', gap: Spacing[3]}}>
            {COLORS.map(col => (
              <TouchableOpacity
                key={col}
                onPress={() => setColor(col)}
                style={{width: 40, height: 40, borderRadius: 20, backgroundColor: col, borderWidth: color === col ? 3 : 1, borderColor: color === col ? c.accent : 'transparent'}}
                accessibilityLabel={`Color ${col}`}
              />
            ))}
          </View>
        </AppCard>

        <View style={{flexDirection: 'row', gap: Spacing[3]}}>
          <AppButton label="Cancel" onPress={() => navigation.goBack()} variant="ghost" style={{flex: 1}} />
          <AppButton label="Save" onPress={handleSave} loading={loading} disabled={!!nameError} style={{flex: 2}} />
        </View>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
}
