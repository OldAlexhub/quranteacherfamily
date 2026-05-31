import React, {useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, TextInput, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {EmptyState} from '../../components/common/EmptyState';
import {useBookmarkStore} from '../../store/useBookmarkStore';
import {useLearnerStore} from '../../store/useLearnerStore';
import {getSurah} from '../../data/loaders';

export function NotesScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<any>();
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const notes = useBookmarkStore(s => s.notes);
  const deleteNote = useBookmarkStore(s => s.deleteNote);
  const searchNotes = useBookmarkStore(s => s.searchNotes);
  const [query, setQuery] = useState('');

  const shown = query.trim() ? searchNotes(query) : notes;
  const learnerNotes = activeLearner
    ? shown.filter(n => !n.learnerId || n.learnerId === activeLearner.id)
    : shown;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['bottom']}>
      <View style={{paddingHorizontal: Spacing[4], paddingTop: Spacing[3], paddingBottom: Spacing[2]}}>
        <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: c.border, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2]}}>
          <Text style={{color: c.textMuted, marginRight: Spacing[2]}}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes..."
            placeholderTextColor={c.textMuted}
            style={{flex: 1, color: c.textPrimary, fontSize: 15}}
            accessibilityLabel="Search notes"
          />
        </View>
      </View>

      <FlatList
        data={learnerNotes}
        keyExtractor={n => n.id}
        contentContainerStyle={{padding: Spacing[4], paddingBottom: 32}}
        ListEmptyComponent={
          <EmptyState
            title="No notes"
            subtitle="Add notes while reading Quran to see them here."
          />
        }
        renderItem={({item: note}) => {
          const surah = getSurah(note.surahNumber);
          return (
            <AppCard style={{marginBottom: Spacing[2]}}>
              <TouchableOpacity
                onPress={() => navigation.navigate('QuranTab', {screen: 'AyahDetail', params: {surahNumber: note.surahNumber, ayahNumber: note.ayahNumber}})}
                accessibilityLabel={`Note for ${surah?.transliteration} ayah ${note.ayahNumber}`}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[1]}}>
                  <AppText variant="caption" weight="semibold" style={{color: c.primary, flex: 1}}>
                    {surah?.transliteration ?? `Surah ${note.surahNumber}`} · Ayah {note.ayahNumber}
                  </AppText>
                  <AppText variant="caption" style={{color: c.textMuted}}>{new Date(note.createdAt).toLocaleDateString()}</AppText>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Delete Note', 'Delete this note?', [
                      {text: 'Cancel', style: 'cancel'},
                      {text: 'Delete', style: 'destructive', onPress: () => deleteNote(note.id)},
                    ])}
                    style={{marginLeft: Spacing[2]}}
                    accessibilityLabel="Delete note"
                  >
                    <Text style={{color: c.error, fontSize: 14}}>✕</Text>
                  </TouchableOpacity>
                </View>
                <AppText variant="body">{note.noteText}</AppText>
              </TouchableOpacity>
            </AppCard>
          );
        }}
      />
    </SafeAreaView>
  );
}
