import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppButton} from '../../components/common/AppButton';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {usePreferencesStore} from '../../store/usePreferencesStore';
import {useLearnerStore} from '../../store/useLearnerStore';
import type {RecitationStyle} from '../../types';

type Step = 'welcome' | 'display' | 'recitation' | 'learner';
const ONBOARDING_STEPS: Step[] = ['welcome', 'display', 'recitation', 'learner'];

export function OnboardingScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const [step, setStep] = useState<Step>('welcome');
  const [displayMode, setDisplayMode] = useState<'arabic_only' | 'arabic_hidden_english' | 'arabic_english'>('arabic_hidden_english');
  const [recitationStyle, setRecitationStyle] = useState<RecitationStyle>('muallim');
  const [learnerName, setLearnerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);
  const stepIndex = ONBOARDING_STEPS.indexOf(step);

  const setOnboardingCompleted = usePreferencesStore(s => s.setOnboardingCompleted);
  const setEnglishHidden = usePreferencesStore(s => s.setEnglishHidden);
  const setRecStyle = usePreferencesStore(s => s.setRecitationStyle);
  const createLearner = useLearnerStore(s => s.createLearner);

  const bg: any = {flex: 1, backgroundColor: c.background};

  async function finish(skipLearner = false) {
    setLoading(true);
    await setEnglishHidden(displayMode !== 'arabic_english');
    await setRecStyle(recitationStyle);
    if (!skipLearner && learnerName.trim()) {
      const trimmed = learnerName.trim();
      if (trimmed.length > 30) {
        setNameError('Name must be 30 characters or less');
        setLoading(false);
        return;
      }
      await createLearner(trimmed);
    }
    await setOnboardingCompleted(true);
    setLoading(false);
  }

  function validateName(name: string) {
    const t = name.trim();
    if (t.length > 30) setNameError('Name must be 30 characters or less');
    else setNameError('');
  }

  return (
    <SafeAreaView style={bg}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{padding: Spacing[6], flexGrow: 1}} showsVerticalScrollIndicator={false}>
          <View style={{marginBottom: Spacing[5]}} accessibilityLabel={`Setup step ${stepIndex + 1} of ${ONBOARDING_STEPS.length}`}>
            <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>
              Setup · Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
            </AppText>
            <View style={{flexDirection: 'row', gap: Spacing[2]}}>
              {ONBOARDING_STEPS.map((item, index) => (
                <View
                  key={item}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: Radii.full,
                    backgroundColor: index <= stepIndex ? c.primary : c.border,
                  }}
                />
              ))}
            </View>
          </View>

          {step === 'welcome' && (
            <View style={{flex: 1, justifyContent: 'center', minHeight: 500}}>
              <View style={{alignItems: 'center', marginBottom: Spacing[8]}}>
                <View style={{width: 80, height: 80, borderRadius: 20, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4]}}>
                  <Text style={{fontSize: 36}}>📖</Text>
                </View>
                <AppText variant="title" center weight="bold" style={{marginBottom: Spacing[2]}}>Quran Teacher Family</AppText>
                <AppText variant="caption" center style={{color: c.primary}}>by Old Alex Hub</AppText>
              </View>

              <AppCard style={{marginBottom: Spacing[4]}}>
                <AppText variant="subheading" weight="semibold" style={{marginBottom: Spacing[3], color: c.primary}}>Arabic-First Learning</AppText>
                <AppText variant="body" style={{marginBottom: Spacing[2]}}>This app is designed for Muslim families who want to teach their children the Quran at home.</AppText>
                <AppText variant="body" style={{marginBottom: Spacing[2]}}>• Arabic reading is the center of the app</AppText>
                <AppText variant="body" style={{marginBottom: Spacing[2]}}>• Arabic recitation and word-by-word practice</AppText>
                <AppText variant="body" style={{marginBottom: Spacing[2]}}>• English meaning is optional support only</AppText>
                <AppText variant="body">• All data stays on your device — no account needed</AppText>
              </AppCard>

              <AppCard style={{marginBottom: Spacing[6], borderColor: c.accent}}>
                <AppText variant="caption" style={{color: c.textMuted, fontStyle: 'italic'}}>
                  This app is a learning companion. It does not replace a qualified Quran teacher, imam, or tajweed instructor. Always seek qualified guidance for formal Quran study.
                </AppText>
              </AppCard>

              <AppButton label="Get Started" onPress={() => setStep('display')} size="lg" fullWidth />
            </View>
          )}

          {step === 'display' && (
            <View>
              <AppText variant="heading" weight="bold" style={{marginBottom: Spacing[2]}}>Display Preference</AppText>
              <AppText variant="body" style={{marginBottom: Spacing[6], color: c.textMuted}}>How would you like to see Quran ayahs? You can change this later in Settings.</AppText>

              {[
                {value: 'arabic_only', label: 'Arabic only', desc: 'Show Arabic text only. The purest reading experience.'},
                {value: 'arabic_hidden_english', label: 'Arabic with hidden meaning', desc: 'Show Arabic text with a "Show meaning" button for each ayah. Recommended.'},
                {value: 'arabic_english', label: 'Arabic with meaning visible', desc: 'Show Arabic text with English meaning always visible below each ayah.'},
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setDisplayMode(opt.value as typeof displayMode)}
                  style={{
                    borderWidth: 2,
                    borderColor: displayMode === opt.value ? c.primary : c.border,
                    borderRadius: Radii.lg,
                    padding: Spacing[4],
                    marginBottom: Spacing[3],
                    backgroundColor: displayMode === opt.value ? c.primary + '12' : c.surface,
                  }}
                  accessibilityLabel={opt.label}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[1]}}>
                    <View style={{width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: displayMode === opt.value ? c.primary : c.border, backgroundColor: displayMode === opt.value ? c.primary : 'transparent', marginRight: Spacing[2]}} />
                    <AppText variant="subheading" weight="semibold">{opt.label}</AppText>
                  </View>
                  <AppText variant="caption" style={{marginLeft: 28, color: c.textMuted}}>{opt.desc}</AppText>
                </TouchableOpacity>
              ))}

              <View style={{flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[4]}}>
                <AppButton label="Back" onPress={() => setStep('welcome')} variant="ghost" style={{flex: 1}} />
                <AppButton label="Next" onPress={() => setStep('recitation')} style={{flex: 2}} />
              </View>
            </View>
          )}

          {step === 'recitation' && (
            <View>
              <AppText variant="heading" weight="bold" style={{marginBottom: Spacing[2]}}>Recitation Style</AppText>
              <AppText variant="body" style={{marginBottom: Spacing[6], color: c.textMuted}}>Choose the default Arabic recitation style for listening and practice.</AppText>

              {[
                {value: 'muallim', label: 'Muallim (Teacher Style)', desc: 'Clear, measured recitation designed for learning and repetition. Ideal for children.'},
                {value: 'mujawwad', label: 'Mujawwad (Tajweed Style)', desc: 'Melodic recitation with full Tajweed rules. Beautiful for listening and memorization.'},
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setRecitationStyle(opt.value as RecitationStyle)}
                  style={{
                    borderWidth: 2,
                    borderColor: recitationStyle === opt.value ? c.primary : c.border,
                    borderRadius: Radii.lg,
                    padding: Spacing[4],
                    marginBottom: Spacing[3],
                    backgroundColor: recitationStyle === opt.value ? c.primary + '12' : c.surface,
                  }}
                  accessibilityLabel={opt.label}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[1]}}>
                    <View style={{width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: recitationStyle === opt.value ? c.primary : c.border, backgroundColor: recitationStyle === opt.value ? c.primary : 'transparent', marginRight: Spacing[2]}} />
                    <AppText variant="subheading" weight="semibold">{opt.label}</AppText>
                  </View>
                  <AppText variant="caption" style={{marginLeft: 28, color: c.textMuted}}>{opt.desc}</AppText>
                </TouchableOpacity>
              ))}

              <AppCard style={{marginBottom: Spacing[4], borderColor: c.border}}>
                <AppText variant="caption" style={{color: c.textMuted}}>Audio is delivered via Google Play Asset Delivery. Both recitation styles are available as downloadable asset packs.</AppText>
              </AppCard>

              <View style={{flexDirection: 'row', gap: Spacing[3]}}>
                <AppButton label="Back" onPress={() => setStep('display')} variant="ghost" style={{flex: 1}} />
                <AppButton label="Next" onPress={() => setStep('learner')} style={{flex: 2}} />
              </View>
            </View>
          )}

          {step === 'learner' && (
            <View>
              <AppText variant="heading" weight="bold" style={{marginBottom: Spacing[2]}}>Create a Learner Profile</AppText>
              <AppText variant="body" style={{marginBottom: Spacing[2], color: c.textMuted}}>Add the first learner's name to start tracking their Quran progress. This is stored only on this device.</AppText>
              <AppText variant="caption" style={{marginBottom: Spacing[6], color: c.textMuted, fontStyle: 'italic'}}>You can skip this step and read without a profile, but goals and progress will not be saved.</AppText>

              <AppCard style={{marginBottom: Spacing[4]}}>
                <AppText variant="body" weight="medium" style={{marginBottom: Spacing[2]}}>Learner Name (optional)</AppText>
                <TextInput
                  value={learnerName}
                  onChangeText={t => {
                    setLearnerName(t);
                    validateName(t);
                  }}
                  placeholder="e.g. Yahya, Omar, or leave blank"
                  placeholderTextColor={c.textMuted}
                  maxLength={30}
                  style={{
                    borderWidth: 1,
                    borderColor: nameError ? c.error : c.border,
                    borderRadius: Radii.md,
                    padding: Spacing[3],
                    color: c.textPrimary,
                    fontSize: 16,
                    backgroundColor: c.surfaceAlt,
                  }}
                  accessibilityLabel="Learner name input"
                />
                {nameError ? <AppText variant="caption" style={{color: c.error, marginTop: 4}}>{nameError}</AppText> : null}
                <AppText variant="caption" style={{marginTop: Spacing[2], color: c.textMuted}}>No date of birth, email, or personal data required.</AppText>
              </AppCard>

              <View style={{flexDirection: 'row', gap: Spacing[3]}}>
                <AppButton label="Back" onPress={() => setStep('recitation')} variant="ghost" style={{flex: 1}} />
                <AppButton label="Skip" onPress={() => finish(true)} variant="secondary" style={{flex: 1}} loading={loading} />
                <AppButton label="Create & Start" onPress={() => finish(false)} style={{flex: 2}} loading={loading} disabled={!learnerName.trim() || !!nameError} />
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
