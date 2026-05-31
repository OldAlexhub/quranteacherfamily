import React, {useMemo} from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii, Shadows} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {SectionHeader} from '../../components/layout/SectionHeader';
import {BannerAdComponent} from '../../ads/BannerAdComponent';
import {useLearnerStore} from '../../store/useLearnerStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useAssignmentStore} from '../../store/useAssignmentStore';
import {loadSurahs} from '../../data/loaders';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export function HomeScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();
  const learners = useLearnerStore(s => s.learners);
  const activeLearnerIdx = useLearnerStore(s => s.activeLearnerIdx);
  const readingProgress = useProgressStore(s => s.readingProgress);
  const assignments = useAssignmentStore(s => s.assignments);
  const activeLearner = learners[activeLearnerIdx] ?? null;
  const activeLearnerId = activeLearner?.id;
  const continueReadingProgress = activeLearnerId ? readingProgress[activeLearnerId] : null;
  const continueReading = continueReadingProgress
    ? {
        surahNumber: continueReadingProgress.lastSurahNumber,
        ayahNumber: continueReadingProgress.lastAyahNumber,
      }
    : null;
  const todayAssignments = useMemo(() => {
    if (!activeLearnerId) return [];
    const today = new Date().toISOString().slice(0, 10);
    return (assignments[activeLearnerId] ?? []).filter(
      a => a.dueDate.slice(0, 10) <= today && a.status !== 'completed',
    );
  }, [activeLearnerId, assignments]);
  const surahs = loadSurahs();
  const continueSurah = continueReading ? surahs.find(s => s.number === continueReading.surahNumber) : null;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['top']}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: 24}}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: Spacing[3]}}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <View>
              <AppText variant="caption" style={{color: c.textMuted}}>
                {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
              </AppText>
              <AppText variant="title" weight="bold" style={{color: c.primary, letterSpacing: -0.5}}>
                Quran Teacher
              </AppText>
              {activeLearner ? (
                <AppText variant="caption" style={{color: c.textSecondary}}>
                  {activeLearner.displayName || 'Learner'}
                </AppText>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ParentDashboard')}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: activeLearner?.avatarColor ?? c.primary,
                alignItems: 'center', justifyContent: 'center',
                ...Shadows.sm,
              }}
              accessibilityLabel="Parent Dashboard"
            >
              <Text style={{color: '#fff', fontSize: 18}}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{paddingHorizontal: Spacing[4]}}>

          {/* Continue Reading */}
          {continueSurah ? (
            <>
              <SectionHeader title="Continue" />
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('QuranTab', {
                  screen: 'QuranReader',
                  params: {surahNumber: continueSurah.number, startAyah: continueReading?.ayahNumber},
                })}
                style={{
                  backgroundColor: c.primary,
                  borderRadius: Radii.lg,
                  padding: Spacing[4],
                  marginBottom: Spacing[4],
                  flexDirection: 'row',
                  alignItems: 'center',
                  ...Shadows.md,
                }}
                accessibilityLabel={`Continue ${continueSurah.transliteration}`}
              >
                <View style={{flex: 1}}>
                  <AppText variant="caption" style={{color: 'rgba(255,255,255,0.65)', marginBottom: 2}}>
                    Continue from
                  </AppText>
                  <Text style={{color: '#fff', fontSize: 24, textAlign: 'right', fontWeight: '500', marginBottom: 2}}>
                    {continueSurah.arabicName}
                  </Text>
                  <AppText variant="caption" style={{color: 'rgba(255,255,255,0.75)'}}>
                    {continueSurah.transliteration} · Ayah {continueReading?.ayahNumber}
                  </AppText>
                </View>
                <Text style={{color: 'rgba(255,255,255,0.9)', fontSize: 32, marginLeft: Spacing[3]}}>▶</Text>
              </TouchableOpacity>
            </>
          ) : (
            <AppCard style={{marginBottom: Spacing[4]}}>
              <AppText variant="body" weight="medium" style={{marginBottom: Spacing[2]}}>Begin learning</AppText>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[3]}}>
                Open the Quran to start reading Arabic with your learner.
              </AppText>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('QuranTab')}
                style={{backgroundColor: c.primary, borderRadius: Radii.md, padding: Spacing[3], alignItems: 'center'}}
                accessibilityLabel="Open Quran"
              >
                <AppText variant="body" weight="semibold" style={{color: '#fff'}}>Open Quran</AppText>
              </TouchableOpacity>
            </AppCard>
          )}

          {/* Today's practice */}
          <SectionHeader
            title="Today's Practice"
            action={{label: 'All', onPress: () => navigation.navigate('Assignments')}}
          />
          {todayAssignments.length === 0 ? (
            <AppCard style={{marginBottom: Spacing[4]}}>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>No practice plan yet.</AppText>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateAssignment', {learnerId: activeLearner?.id})}
                accessibilityLabel="Create practice plan"
              >
                <AppText variant="caption" style={{color: c.primary}}>+ Create today's plan</AppText>
              </TouchableOpacity>
            </AppCard>
          ) : (
            <>
              {todayAssignments.slice(0, 3).map(a => (
                <AppCard key={a.id} style={{marginBottom: Spacing[2]}}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={{flex: 1}}>
                      <AppText variant="body" weight="medium">{a.title}</AppText>
                      <AppText variant="caption" style={{color: c.textMuted}}>
                        Surah {a.surahNumber}, {a.startAyah}–{a.endAyah}
                      </AppText>
                    </View>
                    <View style={{
                      paddingHorizontal: 8, paddingVertical: 3,
                      backgroundColor: a.status === 'completed' ? c.success + '20' : c.surfaceAlt,
                      borderRadius: Radii.full,
                      borderWidth: 1,
                      borderColor: a.status === 'completed' ? c.success + '50' : c.border,
                    }}>
                      <Text style={{color: a.status === 'completed' ? c.success : c.textMuted, fontSize: 11}}>
                        {a.status === 'completed' ? '✓ Done' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </AppCard>
              ))}
              {todayAssignments.length > 3 && (
                <TouchableOpacity onPress={() => navigation.navigate('Assignments')} style={{marginBottom: Spacing[2]}}>
                  <AppText variant="caption" style={{color: c.primary}}>+{todayAssignments.length - 3} more assignments</AppText>
                </TouchableOpacity>
              )}
              <View style={{marginBottom: Spacing[3]}} />
            </>
          )}

          {/* Quick actions */}
          <SectionHeader title="Quick Actions" />
          <View style={{flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[5]}}>
            {[
              {icon: '🔄', label: 'Repeat', action: () => (navigation as any).navigate('PracticeTab', {screen: 'RepeatPractice'})},
              {icon: '📋', label: 'Memorize', action: () => (navigation as any).navigate('PracticeTab', {screen: 'MemorizationTracker'})},
              {icon: '🔍', label: 'Search', action: () => navigation.navigate('Search')},
              {icon: '🔖', label: 'Saved', action: () => navigation.navigate('Bookmarks')},
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                onPress={item.action}
                style={{
                  flex: 1,
                  backgroundColor: c.surface,
                  borderRadius: Radii.lg,
                  padding: Spacing[3],
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: c.border,
                  ...Shadows.sm,
                }}
                accessibilityLabel={item.label}
              >
                <Text style={{fontSize: 22, marginBottom: 4}}>{item.icon}</Text>
                <Text style={{color: c.textSecondary, fontSize: 11}}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Browse surahs */}
          <SectionHeader
            title="Surahs"
            action={{label: 'Browse all', onPress: () => (navigation as any).navigate('QuranTab')}}
          />
          {surahs.slice(0, 5).map(s => (
            <TouchableOpacity
              key={s.number}
              onPress={() => (navigation as any).navigate('QuranTab', {screen: 'QuranReader', params: {surahNumber: s.number}})}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: c.surface, borderRadius: Radii.md,
                padding: Spacing[3], marginBottom: Spacing[2],
                borderWidth: 1, borderColor: c.border,
              }}
              accessibilityLabel={`Open ${s.transliteration}`}
            >
              <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: Spacing[3]}}>
                <Text style={{color: c.textSecondary, fontSize: 13, fontWeight: '700'}}>{s.number}</Text>
              </View>
              <Text style={{color: c.textArabic, fontSize: 18, flex: 1, textAlign: 'right', paddingLeft: Spacing[2]}}>{s.arabicName}</Text>
              <AppText variant="caption" style={{color: c.textMuted, marginLeft: Spacing[2]}}>{s.ayahCount}</AppText>
            </TouchableOpacity>
          ))}

        </View>
      </ScrollView>

      {/* Banner ad — bottom of Home, safe area */}
      <BannerAdComponent />
    </SafeAreaView>
  );
}
