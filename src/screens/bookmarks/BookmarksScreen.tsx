import React, {useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, TextInput, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {EmptyState} from '../../components/common/EmptyState';
import {useBookmarkStore} from '../../store/useBookmarkStore';
import {useLearnerStore} from '../../store/useLearnerStore';
import {getSurah} from '../../data/loaders';
import type {Bookmark, HomeStackParamList, MainTabParamList} from '../../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Bookmarks'>;
type TabNav = BottomTabNavigationProp<MainTabParamList>;

const BOOKMARK_COLORS: Record<string, string> = {
  blue: '#2980B9',
  green: '#27AE60',
  yellow: '#F39C12',
  red: '#E74C3C',
};

export function BookmarksScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const getBookmarksByLearner = useBookmarkStore(s => s.getBookmarksByLearner);
  const removeBookmark = useBookmarkStore(s => s.removeBookmark);
  const searchBookmarks = useBookmarkStore(s => s.searchBookmarks);
  const [query, setQuery] = useState('');

  const bookmarks = query.trim()
    ? searchBookmarks(query)
    : getBookmarksByLearner(activeLearner?.id);

  const grouped = bookmarks.reduce<Record<number, Bookmark[]>>((acc, bm) => {
    if (!acc[bm.surahNumber]) acc[bm.surahNumber] = [];
    acc[bm.surahNumber].push(bm);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([surahKey, items]) => ({
    surahNumber: Number(surahKey),
    items,
  }));

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['left', 'right']}>
      <View style={{paddingHorizontal: Spacing[4], paddingTop: Spacing[3], paddingBottom: Spacing[2]}}>
        <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: c.border, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2]}}>
          <Text style={{color: c.textMuted, marginRight: Spacing[2]}}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search bookmarks..."
            placeholderTextColor={c.textMuted}
            style={{flex: 1, color: c.textPrimary, fontSize: 15}}
            accessibilityLabel="Search bookmarks"
          />
        </View>
      </View>

      {sections.length === 0 ? (
        <EmptyState
          title="No bookmarks"
          subtitle="Tap the bookmark icon on any ayah to save it here."
        />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={s => String(s.surahNumber)}
          contentContainerStyle={{padding: Spacing[4], paddingBottom: 32}}
          renderItem={({item: section}) => {
            const surah = getSurah(section.surahNumber);
            return (
              <View style={{marginBottom: Spacing[4]}}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[2]}}>
                  <Text style={{color: c.textArabic, fontSize: 18, marginRight: Spacing[2]}}>{surah?.arabicName}</Text>
                  <AppText variant="caption" style={{color: c.textMuted}}>{surah?.transliteration}</AppText>
                </View>
                {section.items.map(bm => (
                  <AppCard key={bm.id} style={{marginBottom: Spacing[2]}}>
                    <TouchableOpacity
                      onPress={() => navigation.getParent<TabNav>()?.navigate('QuranTab', {
                        screen: 'AyahDetail',
                        params: {surahNumber: bm.surahNumber, ayahNumber: bm.ayahNumber},
                      })}
                      accessibilityLabel={`Open ayah ${bm.ayahNumber}`}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: BOOKMARK_COLORS[bm.color ?? 'blue'], marginRight: Spacing[2]}} />
                        <AppText variant="body" weight="semibold" style={{flex: 1}}>Ayah {bm.ayahNumber}</AppText>
                        <Text style={{color: c.textMuted, fontSize: 12}}>{new Date(bm.createdAt).toLocaleDateString()}</Text>
                        <TouchableOpacity
                          onPress={() => Alert.alert('Remove Bookmark', 'Remove this bookmark?', [
                            {text: 'Cancel', style: 'cancel'},
                            {text: 'Remove', style: 'destructive', onPress: () => removeBookmark(bm.id)},
                          ])}
                          style={{marginLeft: Spacing[3]}}
                          accessibilityLabel="Remove bookmark"
                        >
                          <Text style={{color: c.error, fontSize: 14}}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      {bm.note ? <AppText variant="caption" style={{color: c.textMuted, marginTop: 4, marginLeft: 18}}>{bm.note}</AppText> : null}
                    </TouchableOpacity>
                  </AppCard>
                ))}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
