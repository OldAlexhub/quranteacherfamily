import React, {useState, useMemo} from 'react';
import {View, Text, FlatList, TouchableOpacity, TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {searchSurahs, searchArabic, searchEnglishMeaning} from '../../data/loaders';

type ResultType = 'surah' | 'arabic' | 'meaning' | 'bookmark' | 'note';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  surahNumber?: number;
  ayahNumber?: number;
}

export function SearchScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim();
    if (q.length < 2) return [];

    const list: SearchResult[] = [];

    const surahResults = searchSurahs(q);
    surahResults.slice(0, 5).forEach(s => {
      list.push({id: `surah_${s.number}`, type: 'surah', title: s.arabicName, subtitle: `${s.transliteration} · ${s.ayahCount} ayahs`, surahNumber: s.number});
    });

    const arabicResults = searchArabic(q);
    arabicResults.slice(0, 10).forEach(r => {
      list.push({id: `arabic_${r.surahNumber}_${r.ayahNumber}`, type: 'arabic', title: r.arabicText.slice(0, 60), subtitle: `Surah ${r.surahNumber}, Ayah ${r.ayahNumber}`, surahNumber: r.surahNumber, ayahNumber: r.ayahNumber});
    });

    const englishResults = searchEnglishMeaning(q);
    englishResults.slice(0, 10).forEach(r => {
      list.push({id: `meaning_${r.surahNumber}_${r.ayahNumber}`, type: 'meaning', title: r.englishMeaning.slice(0, 80), subtitle: `Meaning · Surah ${r.surahNumber}, Ayah ${r.ayahNumber}`, surahNumber: r.surahNumber, ayahNumber: r.ayahNumber});
    });

    return list;
  }, [query]);

  const TYPE_COLORS: Record<ResultType, string> = {
    surah: c.primary,
    arabic: c.accent,
    meaning: c.info,
    bookmark: c.bookmarkBlue,
    note: c.primaryLight,
  };

  const TYPE_LABELS: Record<ResultType, string> = {
    surah: 'Surah',
    arabic: 'Arabic',
    meaning: 'Meaning',
    bookmark: 'Bookmark',
    note: 'Note',
  };

  function openResult(result: SearchResult) {
    if (result.type === 'surah' && result.surahNumber) {
      navigation.navigate('QuranTab', {screen: 'QuranReader', params: {surahNumber: result.surahNumber}});
    } else if (result.surahNumber && result.ayahNumber) {
      navigation.navigate('QuranTab', {screen: 'AyahDetail', params: {surahNumber: result.surahNumber, ayahNumber: result.ayahNumber}});
    }
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['left', 'right']}>
      <View style={{paddingHorizontal: Spacing[4], paddingTop: Spacing[3], paddingBottom: Spacing[2]}}>
        <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: c.primary, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2]}}>
          <Text style={{color: c.primary, marginRight: Spacing[2], fontSize: 18}}>🔍</Text>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search surah names, Arabic text, meaning..."
            placeholderTextColor={c.textMuted}
            style={{flex: 1, color: c.textPrimary, fontSize: 15}}
            accessibilityLabel="Search Quran"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Text style={{color: c.textMuted}}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <View style={{padding: Spacing[4]}}>
          <AppText variant="caption" style={{color: c.textMuted}}>Type at least 2 characters to search.</AppText>
        </View>
      )}

      {query.trim().length >= 2 && results.length === 0 && (
        <View style={{padding: Spacing[6], alignItems: 'center'}}>
          <AppText variant="body" center>No results for "{query}"</AppText>
          <AppText variant="caption" center style={{color: c.textMuted, marginTop: Spacing[2]}}>Try searching in Arabic or English.</AppText>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={r => r.id}
        contentContainerStyle={{padding: Spacing[4], paddingBottom: 32}}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => openResult(item)} accessibilityLabel={`Open ${item.title}`}>
            <AppCard style={{marginBottom: Spacing[2]}}>
              <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                <View style={{paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radii.sm, backgroundColor: TYPE_COLORS[item.type] + '20', marginRight: Spacing[2], marginTop: 2}}>
                  <Text style={{color: TYPE_COLORS[item.type], fontSize: 10, fontWeight: '600'}}>{TYPE_LABELS[item.type]}</Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={{
                    color: item.type === 'arabic' ? c.textArabic : c.textPrimary,
                    fontSize: item.type === 'arabic' ? 18 : 15,
                    textAlign: item.type === 'arabic' ? 'right' : 'left',
                    writingDirection: item.type === 'arabic' ? 'rtl' : 'ltr',
                    marginBottom: 2,
                  }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <AppText variant="caption" style={{color: c.textMuted}}>{item.subtitle}</AppText>
                </View>
                <Text style={{color: c.textMuted, marginLeft: Spacing[2]}}>›</Text>
              </View>
            </AppCard>
          </TouchableOpacity>
        )}
      />

      {query.trim().length === 0 && (
        <View style={{padding: Spacing[6], alignItems: 'center'}}>
          <Text style={{fontSize: 40, marginBottom: Spacing[3]}}>🔍</Text>
          <AppText variant="heading" center>Search the Quran</AppText>
          <AppText variant="body" center style={{color: c.textMuted, marginTop: Spacing[2]}}>
            Search surah names, Arabic text, or English meaning. Arabic search results appear first.
          </AppText>
        </View>
      )}
    </SafeAreaView>
  );
}
