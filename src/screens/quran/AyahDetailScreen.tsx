import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, TextInput, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp, RouteProp} from '@react-navigation/native-stack';
import type {QuranStackParamList, PracticeStatusType} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {AppButton} from '../../components/common/AppButton';
import {getAyah, getSurah} from '../../data/loaders';
import {usePreferencesStore} from '../../store/usePreferencesStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useBookmarkStore} from '../../store/useBookmarkStore';
import {useLearnerStore} from '../../store/useLearnerStore';
import {playAyah, stopAudio} from '../../audio/audioPlayer';
import {BannerAdComponent} from '../../ads/BannerAdComponent';

type Route = RouteProp<QuranStackParamList, 'AyahDetail'>;
type Nav = NativeStackNavigationProp<QuranStackParamList>;

const STATUS_OPTIONS: {value: PracticeStatusType; label: string; color: string}[] = [
  {value: 'not_started', label: 'Not started', color: '#9B9B9B'},
  {value: 'learning', label: 'Learning', color: '#2980B9'},
  {value: 'practicing', label: 'Practicing', color: '#D4AF37'},
  {value: 'needs_review', label: 'Needs review', color: '#E74C3C'},
  {value: 'memorized', label: 'Memorized', color: '#27AE60'},
];

export function AyahDetailScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const {surahNumber, ayahNumber} = route.params;

  const preferences = usePreferencesStore(s => s.preferences);
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const getPracticeStatus = useProgressStore(s => s.getPracticeStatus);
  const updatePracticeStatus = useProgressStore(s => s.updatePracticeStatus);
  const isBookmarked = useBookmarkStore(s => s.isBookmarked);
  const addBookmark = useBookmarkStore(s => s.addBookmark);
  const removeBookmark = useBookmarkStore(s => s.removeBookmark);
  const bookmarks = useBookmarkStore(s => s.bookmarks);
  const getNotesByAyah = useBookmarkStore(s => s.getNotesByAyah);
  const saveNote = useBookmarkStore(s => s.saveNote);
  const deleteNote = useBookmarkStore(s => s.deleteNote);

  const ayah = getAyah(surahNumber, ayahNumber);
  const surah = getSurah(surahNumber);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const currentStatus = activeLearner ? getPracticeStatus(activeLearner.id, surahNumber, ayahNumber) : 'not_started';
  const bookmarked = isBookmarked(surahNumber, ayahNumber, activeLearner?.id);
  const notes = getNotesByAyah(surahNumber, ayahNumber);

  if (!ayah || !surah) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center'}}>
        <AppText variant="body" style={{color: c.textMuted}}>Ayah not found</AppText>
      </SafeAreaView>
    );
  }

  async function handlePlay() {
    if (isPlaying) { await stopAudio(); setIsPlaying(false); }
    else { setIsPlaying(true); await playAyah(surahNumber, ayahNumber, preferences.selectedRecitationStyle); }
  }

  function handleBookmark() {
    if (bookmarked) {
      const bm = bookmarks.find(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber);
      if (bm) removeBookmark(bm.id);
    } else {
      addBookmark(surahNumber, ayahNumber, activeLearner?.id);
    }
  }

  async function handleSaveNote() {
    if (!noteText.trim()) return;
    if (noteText.length > 1000) { Alert.alert('Note too long', 'Notes cannot exceed 1,000 characters.'); return; }
    await saveNote({
      learnerId: activeLearner?.id,
      surahNumber,
      ayahNumber,
      noteText: noteText.trim(),
    });
    setNoteText('');
    setShowNoteInput(false);
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['bottom']}>
      <ScrollView contentContainerStyle={{padding: Spacing[4], paddingBottom: 40}} showsVerticalScrollIndicator={false}>

        {/* Reference */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[3]}}>
          <AppText variant="caption" style={{color: c.textMuted}}>{surah.transliteration} · Ayah {ayahNumber} of {surah.ayahCount}</AppText>
          <View style={{flex: 1}} />
          <TouchableOpacity onPress={handleBookmark} accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark this ayah'}>
            <Text style={{fontSize: 22, color: bookmarked ? c.accent : c.textMuted}}>🔖</Text>
          </TouchableOpacity>
        </View>

        {/* Arabic text */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <Text
            style={{color: c.textArabic, fontSize: preferences.arabicFontSize + 4, textAlign: 'right', writingDirection: 'rtl', lineHeight: (preferences.arabicFontSize + 4) * 2.2}}
            accessibilityLabel={`Arabic text: ${ayah.arabicText}`}
          >
            {ayah.arabicText}
          </Text>
          <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing[3], gap: Spacing[3]}}>
            <TouchableOpacity onPress={handlePlay} style={{flexDirection: 'row', alignItems: 'center', gap: 4}} accessibilityLabel={isPlaying ? 'Stop' : 'Play ayah'}>
              <Text style={{color: c.primary, fontSize: 20}}>{isPlaying ? '⏹' : '▶'}</Text>
              <AppText variant="caption" style={{color: c.primary}}>{isPlaying ? 'Stop' : 'Play'}</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('WordTeacherMode', {surahNumber, ayahNumber})}
              style={{flexDirection: 'row', alignItems: 'center', gap: 4}}
              accessibilityLabel="Word by word practice"
            >
              <Text style={{color: c.primary, fontSize: 18}}>ا</Text>
              <AppText variant="caption" style={{color: c.primary}}>Word practice</AppText>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Transliteration + English meaning */}
        {(ayah.transliteration || ayah.englishMeaning) ? (
          <AppCard style={{marginBottom: Spacing[4]}}>
            {ayah.transliteration ? (
              <View style={{marginBottom: ayah.englishMeaning ? Spacing[3] : 0}}>
                <AppText variant="caption" weight="semibold" style={{color: c.textMuted, marginBottom: Spacing[1]}}>How to read (transliteration)</AppText>
                <AppText variant="body" english style={{lineHeight: 24, fontStyle: 'italic', color: c.textSecondary}}>
                  {ayah.transliteration}
                </AppText>
              </View>
            ) : null}
            {ayah.englishMeaning ? (
              !showMeaning ? (
                <TouchableOpacity onPress={() => setShowMeaning(true)} accessibilityLabel="Show English meaning">
                  <AppText variant="body" style={{color: c.primary}}>Show English meaning</AppText>
                </TouchableOpacity>
              ) : (
                <>
                  <AppText variant="caption" weight="semibold" style={{color: c.textMuted, marginBottom: Spacing[2]}}>English meaning (Pickthall)</AppText>
                  <AppText variant="body" english style={{lineHeight: 24, fontStyle: 'italic'}}>{ayah.englishMeaning}</AppText>
                  <TouchableOpacity onPress={() => setShowMeaning(false)} style={{marginTop: Spacing[2]}} accessibilityLabel="Hide meaning">
                    <AppText variant="caption" style={{color: c.textMuted}}>Hide meaning</AppText>
                  </TouchableOpacity>
                </>
              )
            ) : null}
          </AppCard>
        ) : null}

        {/* Practice status */}
        {activeLearner ? (
          <AppCard style={{marginBottom: Spacing[4]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Practice Status</AppText>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2]}}>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => updatePracticeStatus(activeLearner.id, surahNumber, ayahNumber, opt.value)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6,
                    borderRadius: Radii.full,
                    backgroundColor: currentStatus === opt.value ? opt.color : c.surfaceAlt,
                    borderWidth: 1,
                    borderColor: currentStatus === opt.value ? opt.color : c.border,
                  }}
                  accessibilityLabel={`Mark as ${opt.label}`}
                >
                  <Text style={{color: currentStatus === opt.value ? '#fff' : c.textSecondary, fontSize: 13}}>
                    {currentStatus === opt.value ? '✓ ' : ''}{opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>
        ) : null}

        {/* Notes */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[2]}}>
            <AppText variant="body" weight="semibold" style={{flex: 1}}>Notes</AppText>
            <TouchableOpacity onPress={() => setShowNoteInput(v => !v)} accessibilityLabel="Add note">
              <Text style={{color: c.primary, fontSize: 16}}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {notes.length === 0 && !showNoteInput ? (
            <AppText variant="caption" style={{color: c.textMuted}}>No notes for this ayah.</AppText>
          ) : null}

          {notes.map(note => (
            <View key={note.id} style={{backgroundColor: c.surfaceAlt, borderRadius: Radii.md, padding: Spacing[3], marginBottom: Spacing[2]}}>
              <AppText variant="body" style={{marginBottom: 4}}>{note.noteText}</AppText>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <AppText variant="caption" style={{color: c.textMuted}}>{new Date(note.createdAt).toLocaleDateString()}</AppText>
                <TouchableOpacity
                  onPress={() => Alert.alert('Delete Note', 'Delete this note?', [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Delete', style: 'destructive', onPress: () => deleteNote(note.id)},
                  ])}
                  accessibilityLabel="Delete note"
                >
                  <Text style={{color: c.error, fontSize: 14}}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {showNoteInput ? (
            <View>
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Write a note..."
                placeholderTextColor={c.textMuted}
                multiline
                maxLength={1000}
                style={{
                  borderWidth: 1, borderColor: c.border,
                  borderRadius: Radii.md, padding: Spacing[3],
                  color: c.textPrimary, fontSize: 15,
                  minHeight: 80, textAlignVertical: 'top',
                  backgroundColor: c.surfaceAlt, marginBottom: Spacing[2],
                }}
                accessibilityLabel="Note text input"
              />
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>{noteText.length}/1000</AppText>
              <View style={{flexDirection: 'row', gap: Spacing[2]}}>
                <AppButton label="Cancel" onPress={() => {setShowNoteInput(false); setNoteText('');}} variant="ghost" size="sm" style={{flex: 1}} />
                <AppButton label="Save Note" onPress={handleSaveNote} size="sm" style={{flex: 2}} disabled={!noteText.trim()} />
              </View>
            </View>
          ) : null}
        </AppCard>

      </ScrollView>
      <BannerAdComponent />
    </SafeAreaView>
  );
}
