// @refresh reset
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useProgress } from 'react-native-track-player';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { useLearning } from './store';
import {
  bundledVerse,
  counts,
  downloadSurah,
  cancelDownload,
  surahName,
  verse,
} from './content';
import { cancelPracticeAudio, playResource } from './audio';
import {
  Button,
  Icon,
  Label,
  Landscape,
  palette,
  styles,
  useWords,
} from './ui';
import { MushafFrame, SurahOrnament } from './MushafFrame';
import type { QuranVerse } from './types';
import { track } from './telemetry';
import { UnderstandingPanel } from './UnderstandingPanel';
import { tafsir } from './understanding';

const numeral = (n: number) =>
  String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
export function ReaderScreen({
  surah,
  id,
  onBegin,
}: {
  surah: number;
  id: string;
  onBegin: (keys: string[]) => void;
}) {
  const { ar, t } = useWords();
  const settings = useLearning(s => s.data.profiles[id].settings),
    fontScale = useLearning(s => s.data.fontScale);
  const bookmarks = useBookmarkStore(s => s.bookmarks),
    notes = useBookmarkStore(s => s.notes);
  const [first, setFirst] = useState('1'),
    [last, setLast] = useState(String(Math.min(3, counts[surah])));
  const [notice, setNotice] = useState(''),
    [playing, setPlaying] = useState<number | null>(null);
  const [selected, setSelected] = useState(1),
    [section, setSection] = useState(0);
  const [sheet, setSheet] = useState<
      'passage' | 'ayah' | 'understanding' | null
    >(null),
    [note, setNote] = useState('');
  const [understandingTab, setUnderstandingTab] = useState<'ayah' | 'surah'>(
    'ayah',
  );
  const [activeVerse, setActiveVerse] = useState<QuranVerse | null>(null),
    [downloading, setDownloading] = useState(false);
  const operation = useRef(0),
    scroll = useRef<ScrollView>(null),
    alive = useRef(true);
  const progress = useProgress(150);
  const pages = useMemo(() => {
    // Responsive sections, not claimed to be canonical printed Mushaf pages.
    const result: number[][] = [];
    let group: number[] = [],
      length = 0;
    for (let a = 1; a <= counts[surah]; a++) {
      const text = bundledVerse(`${surah}:${a}`).arabic;
      if (group.length && length + text.length > 700) {
        result.push(group);
        group = [];
        length = 0;
      }
      group.push(a);
      length += text.length;
    }
    if (group.length) result.push(group);
    return result;
  }, [surah]);
  const ayahs = pages[section] ?? pages[0];
  const stop = () => {
    operation.current++;
    cancelPracticeAudio();
    setPlaying(null);
    setActiveVerse(null);
  };
  useEffect(() => {
    alive.current = true;
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') stop();
    });
    return () => {
      alive.current = false;
      operation.current++;
      cancelPracticeAudio();
      sub.remove();
    };
  }, []);
  const play = async (start: number, continuous = false) => {
    if (playing !== null) {
      stop();
      return;
    }
    const token = ++operation.current;
    setNotice('');
    try {
      for (
        let a = start;
        a <= (continuous ? ayahs[ayahs.length - 1] : start);
        a++
      ) {
        if (token !== operation.current) return;
        setPlaying(a);
        setSelected(a);
        const data = await verse(`${surah}:${a}`, settings.reciter);
        if (token !== operation.current) return;
        setActiveVerse(data);
        if (!data.audioUrl) throw new Error('unavailable');
        await playResource(data.audioUrl, data.key, settings.speed);
      }
    } catch (error) {
      if (
        token === operation.current &&
        (error as Error).message !== 'cancelled'
      ) {
        setNotice(
          t(
            'Audio unavailable. Please try again.',
            'الصوت غير متاح. حاول مجددًا.',
          ),
        );
        track('playback_error', { code: 'playback' });
      }
    } finally {
      if (token === operation.current) {
        setPlaying(null);
        setActiveVerse(null);
      }
    }
  };
  const openAyah = (a: number) => {
    stop();
    setSelected(a);
    setNote(
      notes.find(
        n =>
          n.learnerId === id && n.surahNumber === surah && n.ayahNumber === a,
      )?.noteText ?? '',
    );
    setSheet('ayah');
  };
  const move = (next: number) => {
    stop();
    setSection(next);
    setSelected(pages[next][0]);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const practice = () => {
    const a = Number(first),
      b = Number(last);
    if (
      !Number.isInteger(a) ||
      !Number.isInteger(b) ||
      a < 1 ||
      b < a ||
      b > counts[surah]
    ) {
      setNotice(t('Choose a valid ayah range.', 'اختر نطاق آيات صحيحًا.'));
      return;
    }
    stop();
    setSheet(null);
    onBegin(Array.from({ length: b - a + 1 }, (_, i) => `${surah}:${a + i}`));
  };
  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await tafsir(surah, ar ? 'ar' : 'en');
      await downloadSurah(surah, settings.reciter, d => {
        if (alive.current)
          setNotice(
            `${t('Downloading', 'جارٍ التنزيل')} ${d.completed}/${d.total}`,
          );
      });
      if (alive.current)
        setNotice(
          t('Ayah audio saved. Individual word audio still needs internet.', 'حُفظ صوت الآيات. صوت الكلمات المفردة يحتاج إلى الإنترنت.'),
        );
    } catch (error) {
      if (alive.current)
        setNotice(
          (error as Error).message==='download-cancelled'?t('Download paused. Completed ayahs are saved; download again to resume.','توقف التنزيل. الآيات المكتملة محفوظة؛ نزّل مجددًا للمتابعة.'):t(
            'Offline audio is not available yet. Quran text is already saved on this device.',
            'الصوت دون اتصال غير متاح بعد. نص القرآن محفوظ على هذا الجهاز.',
          ),
        );
      track('download_error', { code: 'download' });
    } finally {
      if (alive.current) setDownloading(false);
    }
  };
  const saved = bookmarks.find(
    b =>
      b.surahNumber === surah &&
      b.ayahNumber === selected &&
      b.learnerId === id,
  );
  const selectedVerse = bundledVerse(`${surah}:${selected}`, settings.reciter);
  const explore = (tab: 'ayah' | 'surah') => {
    stop();
    setUnderstandingTab(tab);
    setSheet('understanding');
  };
  return (
    <View style={reader.screen}>
      <View pointerEvents="none" style={reader.landscape}>
        <Landscape />
      </View>
      <ScrollView ref={scroll} contentContainerStyle={reader.scroll}>
        <View style={reader.caption}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('About this surah', 'عن هذه السورة')}
            onPress={() => explore('surah')}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Label style={reader.chapter}>{surahName(surah, ar)} ⓘ</Label>
          </Pressable>
          <Label style={reader.captionText}>
            {t('Ayahs', 'الآيات')} {ayahs[0]}–{ayahs[ayahs.length - 1]}
          </Label>
        </View>
        <MushafFrame>
          <SurahOrnament title={surahName(surah, true)} />
          {section === 0 && bundledVerse(`${surah}:1`).openingBasmala && (
            <Text style={reader.basmala}>
              {bundledVerse(`${surah}:1`).openingBasmala}
            </Text>
          )}
          <Text
            style={[
              reader.quran,
              { fontSize: 27 * fontScale, lineHeight: 57 * fontScale },
            ]}
          >
            {ayahs.map(a => {
              const v = bundledVerse(`${surah}:${a}`, settings.reciter),
                active = playing === a;
              const segment = activeVerse?.segments.find(
                s =>
                  progress.position * 1000 >= s.startMs &&
                  progress.position * 1000 < s.endMs,
              );
              return (
                <Text
                  key={a}
                  accessibilityLabel={`${t('Ayah', 'آية')} ${a}. ${v.arabic}`}
                  onPress={() => openAyah(a)}
                  style={active ? reader.activeAyah : undefined}
                >
                  {active &&
                  activeVerse?.words.length &&
                  activeVerse.segments.length
                    ? activeVerse.words.map(w => (
                        <Text
                          key={w.position}
                          style={
                            segment &&
                            w.position >= segment.word &&
                            w.position <= (segment.endWord ?? segment.word)
                              ? reader.activeWord
                              : undefined
                          }
                        >
                          {w.text}{' '}
                        </Text>
                      ))
                    : v.arabic}
                  <Text style={reader.verseMark}>{` ﴿${numeral(a)}﴾ `}</Text>
                </Text>
              );
            })}
          </Text>
          <View style={reader.pageBottom}>
            <Text style={reader.flourish}>✦</Text>
            <Label style={reader.pageHint}>
              {t('Tap an ayah to explore', 'اضغط على آية لاستكشافها')}
            </Label>
            <Text style={reader.flourish}>✦</Text>
          </View>
        </MushafFrame>
        {pages.length > 1 && (
          <View style={reader.navigation}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Previous section', 'المقطع السابق')}
              disabled={section === 0}
              onPress={() => move(section - 1)}
              style={[reader.pageButton, section === 0 && { opacity: 0.35 }]}
            >
              <Icon name="back" size={18} />
            </Pressable>
            <Label style={reader.captionText}>
              {section + 1} / {pages.length}
            </Label>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Next section', 'المقطع التالي')}
              disabled={section === pages.length - 1}
              onPress={() => move(section + 1)}
              style={[
                reader.pageButton,
                section === pages.length - 1 && { opacity: 0.35 },
                { transform: [{ rotate: '180deg' }] },
              ]}
            >
              <Icon name="back" size={18} />
            </Pressable>
          </View>
        )}
        {!!notice && !sheet && <Label style={styles.notice}>{notice}</Label>}
      </ScrollView>
      <View
        style={[reader.dock, { flexDirection: ar ? 'row-reverse' : 'row' }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            playing !== null
              ? t('Stop recitation', 'إيقاف التلاوة')
              : t('Listen to this passage', 'استمع لهذا المقطع')
          }
          onPress={() => play(selected, true)}
          style={reader.listen}
        >
          {playing !== null ? (
            <Text style={{ color: palette.white, fontSize: 20 }}>■</Text>
          ) : (
            <Icon name="play" color={palette.white} size={21} />
          )}
          <Label style={reader.listenLabel}>
            {playing !== null ? t('Stop', 'إيقاف') : t('Listen', 'استمع')}
          </Label>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Memorize', 'احفظ')}
          onPress={() => {
            stop();
            setNotice('');
            setSheet('passage');
          }}
          style={reader.memorize}
        >
          <Icon name="quran" size={21} />
          <Label style={{ color: palette.green, fontWeight: '700' }}>
            {t('Memorize', 'احفظ')}
          </Label>
        </Pressable>
      </View>
      <Modal
        visible={sheet !== null}
        transparent
        animationType="none"
        onRequestClose={() => setSheet(null)}
      >
        <View style={reader.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel={t('Close', 'إغلاق')}
            onPress={() => setSheet(null)}
          />
          <View style={reader.sheet} accessibilityViewIsModal>
            <View style={reader.sheetHeader}>
              <Label style={[styles.subtitle, { flex: 1 }]}>
                {sheet === 'understanding'
                  ? t('Understand the Quran', 'افهم القرآن')
                  : sheet === 'passage'
                  ? t('Make this passage yours', 'احفظ هذا المقطع')
                  : `${surahName(surah, ar)} · ${surah}:${selected}`}
              </Label>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Close', 'إغلاق')}
                style={styles.circle}
                onPress={() => setSheet(null)}
              >
                <Text style={{ fontSize: 24, color: palette.green }}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
            >
              {sheet === 'understanding' ? (
                <UnderstandingPanel
                  key={`${surah}:${selected}:${understandingTab}`}
                  verseKey={`${surah}:${selected}`}
                  initial={understandingTab}
                />
              ) : sheet === 'passage' ? (
                <>
                  <Label muted>
                    {t(
                      'Choose your first and last ayah. We’ll guide you through listening, repeating, and recall.',
                      'اختر أول آية وآخر آية. سنرشدك للاستماع والترديد والتذكّر.',
                    )}
                  </Label>
                  <View style={styles.row}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Label>{t('From ayah', 'من آية')}</Label>
                      <TextInput
                        accessibilityLabel={t('First ayah', 'أول آية')}
                        style={styles.input}
                        keyboardType="number-pad"
                        value={first}
                        onChangeText={setFirst}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Label>{t('To ayah', 'إلى آية')}</Label>
                      <TextInput
                        accessibilityLabel={t('Last ayah', 'آخر آية')}
                        style={styles.input}
                        keyboardType="number-pad"
                        value={last}
                        onChangeText={setLast}
                      />
                    </View>
                  </View>
                  <Button
                    label={t('Begin memorizing', 'ابدأ الحفظ')}
                    onPress={practice}
                  />
                  <Button
                    quiet
                    label={
                      downloading
                        ? t('Pause download', 'إيقاف التنزيل مؤقتًا')
                        : t('Save surah audio offline', 'تنزيل صوت السورة')
                    }
                    onPress={downloading?()=>{cancelDownload();}:download}
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.arabic, { fontSize: 27 * fontScale }]}>
                    {selectedVerse.arabic}
                  </Text>
                  <Button
                    quiet
                    label={t('Understand this ayah', 'افهم هذه الآية')}
                    onPress={() => explore('ayah')}
                  />
                  {settings.meaning && (
                    <Label muted>{selectedVerse.meaning}</Label>
                  )}
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Button
                        quiet
                        label={t('Listen', 'استمع')}
                        onPress={() => {
                          setSheet(null);
                          play(selected);
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        quiet
                        label={
                          saved
                            ? t('Bookmarked ✓', 'محفوظة ✓')
                            : t('Bookmark', 'علامة مرجعية')
                        }
                        onPress={() =>
                          saved
                            ? useBookmarkStore
                                .getState()
                                .removeBookmark(saved.id)
                            : useBookmarkStore
                                .getState()
                                .addBookmark(surah, selected, id)
                        }
                      />
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setFirst(String(selected));
                      setLast(String(selected));
                      setSheet('passage');
                    }}
                    style={styles.link}
                  >
                    <Label style={{ color: palette.green, fontWeight: '700' }}>
                      {t('Memorize from this ayah', 'ابدأ الحفظ من هذه الآية')}{' '}
                      ›
                    </Label>
                  </Pressable>
                  <Label>{t('Your personal note', 'ملاحظتك الشخصية')}</Label>
                  <TextInput
                    multiline
                    accessibilityLabel={t('Personal note', 'ملاحظة شخصية')}
                    style={[styles.input, { minHeight: 80 }]}
                    value={note}
                    maxLength={1000}
                    onChangeText={setNote}
                  />
                  <Button
                    label={t('Save note', 'حفظ الملاحظة')}
                    onPress={() => {
                      useBookmarkStore.getState().saveNote({
                        learnerId: id,
                        surahNumber: surah,
                        ayahNumber: selected,
                        noteText: note,
                      });
                      setSheet(null);
                    }}
                  />
                </>
              )}
              {!!notice && <Label style={styles.notice}>{notice}</Label>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const reader = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#DFE8D6' },
  landscape: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.5,
  },
  scroll: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20, gap: 14 },
  caption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 8,
  },
  chapter: { fontSize: 17, fontWeight: '700', color: '#234E3B' },
  captionText: { fontSize: 12, color: '#46634B' },
  basmala: {
    fontSize: 24,
    lineHeight: 46,
    textAlign: 'center',
    color: '#263D2E',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  quran: {
    color: '#202E24',
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingHorizontal: 3,
    paddingVertical: 8,
  },
  verseMark: { color: '#6C7752', fontSize: 21 },
  activeAyah: { backgroundColor: '#DFF1B9', color: '#173E35' },
  activeWord: { backgroundColor: '#A9E3B0', color: '#133A2A' },
  pageBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 20,
    paddingBottom: 8,
  },
  flourish: { color: '#B7A164', fontSize: 15 },
  pageHint: { fontSize: 11, color: '#798263', textAlign: 'center' },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  pageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3DD',
  },
  dock: {
    padding: 12,
    paddingHorizontal: 18,
    backgroundColor: '#FFFCEF',
    borderTopWidth: 1,
    borderColor: '#CDD4B8',
    gap: 12,
  },
  listen: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 28,
    backgroundColor: '#245D47',
  },
  listenLabel: { color: palette.white, fontWeight: '700' },
  memorize: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    minHeight: 52,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#0B241E88',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: palette.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
});
