import React, {useState, useMemo} from 'react';
import {View, FlatList, TextInput, Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {QuranStackParamList} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {SafeAreaView} from 'react-native-safe-area-context';
import {SurahCard} from '../../components/quran/SurahCard';
import {EmptyState} from '../../components/common/EmptyState';
import {AppText} from '../../components/common/AppText';
import {BannerAdComponent} from '../../ads/BannerAdComponent';
import {loadSurahs, searchSurahs} from '../../data/loaders';
import {useProgressStore} from '../../store/useProgressStore';
import {useLearnerStore} from '../../store/useLearnerStore';

type Nav = NativeStackNavigationProp<QuranStackParamList>;
type FilterType = 'all' | 'in_progress' | 'memorized' | 'needs_review';

export function SurahListScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const surahs = loadSurahs();
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const readingProgress = useProgressStore(s => activeLearner ? s.readingProgress[activeLearner.id] : null);
  const calculateMemorizationProgress = useProgressStore(s => s.calculateMemorizationProgress);

  const displayedSurahs = useMemo(() => {
    let list = query.trim().length > 0 ? searchSurahs(query) : surahs;
    if (filter !== 'all' && activeLearner) {
      list = list.filter(s => {
        const progress = calculateMemorizationProgress(activeLearner.id, s.number);
        if (filter === 'memorized') return progress.memorized >= s.ayahCount;
        if (filter === 'needs_review') return progress.needsReview > 0;
        if (filter === 'in_progress') {
          return progress.practicing + progress.notStarted > 0 ||
            (progress.memorized > 0 && progress.memorized < s.ayahCount);
        }
        return true;
      });
    }
    return list;
  }, [query, filter, activeLearner, calculateMemorizationProgress, surahs]);

  const filters: {key: FilterType; label: string}[] = [
    {key: 'all', label: 'All'},
    {key: 'in_progress', label: 'In Progress'},
    {key: 'memorized', label: 'Memorized'},
    {key: 'needs_review', label: 'Review'},
  ];

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['left', 'right']}>
      {/* Search */}
      <View style={{paddingHorizontal: Spacing[4], paddingTop: Spacing[3], paddingBottom: Spacing[2]}}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: c.surface, borderRadius: Radii.lg,
          borderWidth: 1, borderColor: c.border,
          paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
        }}>
          <Text style={{color: c.textMuted, marginRight: Spacing[2], fontSize: 16}}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search surahs..."
            placeholderTextColor={c.textMuted}
            style={{flex: 1, color: c.textPrimary, fontSize: 15}}
            accessibilityLabel="Search surahs"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Text style={{color: c.textMuted, fontSize: 16}}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View style={{flexDirection: 'row', paddingHorizontal: Spacing[4], paddingBottom: Spacing[2], gap: Spacing[2]}}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: Radii.full,
              backgroundColor: filter === f.key ? c.primary : c.surface,
              borderWidth: 1,
              borderColor: filter === f.key ? c.primary : c.border,
            }}
            accessibilityLabel={`Filter: ${f.label}`}
          >
            <Text style={{color: filter === f.key ? '#fff' : c.textSecondary, fontSize: 12, fontWeight: '500'}}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <AppText variant="caption" style={{color: c.textMuted, paddingHorizontal: Spacing[4], paddingBottom: Spacing[1]}}>
        {displayedSurahs.length} surahs
      </AppText>

      <FlatList
        data={displayedSurahs}
        keyExtractor={s => String(s.number)}
        contentContainerStyle={{paddingHorizontal: Spacing[4], paddingBottom: 16}}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="No surahs found"
            subtitle={query.trim().length > 0 ? `No results for "${query}"` : 'Try a different filter'}
          />
        }
        renderItem={({item}) => (
          <SurahCard
            surah={item}
            isLastRead={readingProgress?.lastSurahNumber === item.number}
            onPress={() => navigation.navigate('QuranReader', {surahNumber: item.number})}
          />
        )}
      />

      {/* Banner ad — bottom, not touching surah list */}
      <BannerAdComponent />
    </SafeAreaView>
  );
}
