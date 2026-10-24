// @refresh reset
import React, { useEffect, useState, useRef } from 'react';
import {
  AppState,
  ScrollView,
  Text,
  View,
  Pressable,
  Vibration,
  AccessibilityInfo,
} from 'react-native';
import { useProgress } from 'react-native-track-player';
import { useLearning } from './store';
import { bundledVerse, surahName, verse } from './content';
import { cancelPracticeAudio, pausePracticeAudio, playResource, waitForTurn } from './audio';
import { Button, Card, Label, styles, palette, Icon, useWords } from './ui';
import { MushafFrame, SurahOrnament } from './MushafFrame';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { sessionCompleted } from './ads';
import { track } from './telemetry';
import type { QuranVerse, Recall } from './types';
import { UnderstandingPanel } from './UnderstandingPanel';

export function LessonScreen({
  id,
  onClose,
  onSettings,
}: {
  id: string;
  onClose: () => void;
  onSettings: () => void;
}) {
  const { ar, t } = useWords();
  const profile = useLearning(s => s.data.profiles[id]);
  const lesson = profile.active!;
  const key = lesson.keys[lesson.index];
  const [data, setData] = useState<QuranVerse>(() =>
    bundledVerse(key, profile.settings.reciter),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [showHint, setShowHint] = useState(false),
    [help, setHelp] = useState<number | null>(null);
  const operation = useRef(0);
  const progress = useProgress(150);
  const store = useLearning.getState;
  const patch = (p: Parameters<ReturnType<typeof store>['patchLesson']>[1]) =>
    store().patchLesson(id, p);
  useEffect(() => {
    let valid = true;
    setData(bundledVerse(key, profile.settings.reciter));
    setShowHint(false);
    setHelp(null);
    verse(key, profile.settings.reciter).then(v => {
      if (valid) setData(v);
    });
    return () => {
      valid = false;
      operation.current++;
      cancelPracticeAudio();
    };
  }, [key, profile.settings.reciter]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        pausePracticeAudio().then(()=>{operation.current++;setBusy(false);store().patchLesson(id,{phase:'ready'});});
      }
    });
    return () => sub.remove();
  }, [id]);
  useEffect(() => {
    const timer = setInterval(() => {
      const l = store().data.profiles[id]?.active;
      if (l && l.step !== 'summary' && AppState.currentState === 'active')
        store().patchLesson(id, { activeSeconds: l.activeSeconds + 5 });
    }, 5000);
    return () => clearInterval(timer);
  }, [id]);
  const audio = async (url = data.audioUrl, audioKey=key, round=lesson.round) => {
    if (!url) throw new Error('unavailable');
    const token=operation.current;
    const checkpoint=store().data.profiles[id]?.active?.playback;
    const startAt=checkpoint?.kind==='audio'&&checkpoint.key===audioKey&&checkpoint.step===lesson.step&&checkpoint.round===round?checkpoint.position:0;
    return playResource(url,audioKey,profile.settings.speed,{startAt,onPosition:position=>{if(token===operation.current)patch({playback:{key:audioKey,step:lesson.step,round,kind:'audio',position}});}});
  };
  const perform = async () => {
    if (busy) {
      await pausePracticeAudio();
      operation.current++;
      patch({ phase: 'ready' });
      setBusy(false);
      return;
    }
    const token = ++operation.current;
    const current = () => {
      if (token !== operation.current) throw new Error('cancelled');
    };
    setBusy(true);
    setError('');
    try {
      if (lesson.step === 'listen') {
        patch({ phase: 'listening' });
        await audio();
        current();
        patch({ step: 'repeat', phase: 'ready',playback:undefined });
      } else if (lesson.step === 'repeat') {
        for (let round = lesson.round; round < lesson.repeats; round++) {
          const saved=store().data.profiles[id]?.active?.playback;
          let gap=saved?.kind==='gap'&&saved.key===key&&saved.step==='repeat'&&saved.round===round?saved.remaining:undefined;
          if(gap===undefined){patch({phase:'listening',round});current();const duration=await audio(data.audioUrl,key,round);current();gap=Math.max(3,duration+2);}
          patch({phase:'yourTurn',round});
          await waitForTurn(gap,remaining=>{if(token===operation.current)patch({playback:{key,step:'repeat',round,kind:'gap',position:0,remaining}});});
          current();patch({round:round+1,playback:undefined});
        }
        patch({ step: 'recall', phase: 'ready' });
        setShowHint(false);
      } else if (lesson.step === 'connect') {
        const connectKeys=lesson.keys.slice(0,lesson.index+1);const resumeIndex=lesson.playback?.step==='connect'?Math.max(0,connectKeys.indexOf(lesson.playback.key)):0;
        for (const k of connectKeys.slice(resumeIndex)) {
          const v = await verse(k, profile.settings.reciter);
          current();
          if (!v.audioUrl) throw new Error('unavailable');
          patch({ phase: 'listening' });
          await audio(v.audioUrl,k,0);
          patch({playback:undefined});
          current();
        }
        patch({ phase: 'yourTurn' });
        setShowHint(false);
      }
    } catch (e) {
      if(token!==operation.current)return;
      patch({ phase: 'ready' });
      if ((e as Error).message !== 'cancelled')
        setError(
          t(
            'Audio could not play. Check your connection or download this surah, then try again.',
            'تعذّر تشغيل الصوت. تحقّق من الاتصال أو نزّل السورة ثم حاول مجددًا.',
          ),
        );
    } finally {
      if(token===operation.current)setBusy(false);
    }
  };
  const report = (outcome: Recall) => {
    operation.current++;
    cancelPracticeAudio();
    setBusy(false);
    store().recall(id, outcome);
    patch({
      step: outcome === 'again' ? 'repeat' : 'connect',
      round: 0,
      phase: 'ready',playback:undefined,
    });
  };
  const next = () => {
    operation.current++;
    cancelPracticeAudio();
    if (lesson.index + 1 < lesson.keys.length) {
      patch({
        index: lesson.index + 1,
        step: 'understand',
        round: 0,
        hinted: false,
        phase: 'ready',playback:undefined,
      });
    } else {
      store().finish(id, true);
      if (lesson.assignmentId)
        useAssignmentStore
          .getState()
          .completeAssignment(lesson.assignmentId, id);
      sessionCompleted(lesson.id);
      track('lesson_complete', { durationSeconds: lesson.activeSeconds });
      AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
        if (!reduced) Vibration.vibrate(40);
      });
    }
  };
  const title =
    lesson.step === 'listen'
      ? t('First, listen closely', 'أولًا، استمع بتركيز')
      : lesson.step === 'repeat'
      ? t('Listen. Then your turn.', 'استمع، ثم ردّد بنفسك')
      : lesson.step === 'recall'
      ? t('What can you remember?', 'ماذا تتذكّر؟')
      : lesson.step === 'connect'
      ? t('Bring the ayahs together', 'صِل الآيات ببعضها')
      : t('A little closer, every day', 'خطوة أقرب، كل يوم');
  const hidden =
    (lesson.step === 'recall' ||
      (lesson.step === 'connect' && lesson.phase === 'yourTurn')) &&
    !showHint;
  const activeSegment = data.segments.find(
    s =>
      progress.position * 1000 >= s.startMs &&
      progress.position * 1000 < s.endMs,
  );
  if (lesson.step === 'understand')
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Save and leave lesson', 'حفظ الدرس والخروج')}
            style={styles.circle}
            onPress={() => {
              operation.current++;
              cancelPracticeAudio();
              store().finish(id, false);
              onClose();
            }}
          >
            <Icon name="back" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Label style={styles.eyebrow}>
              {t('MEANING BEFORE MEMORY', 'الفهم قبل الحفظ')}
            </Label>
            <Label muted style={styles.small}>
              {surahName(Number(key.split(':')[0]), ar)} · {key}
            </Label>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <UnderstandingPanel
            key={key}
            verseKey={key}
            onReflection={outcome =>
              patch({
                step: 'listen',
                understanding: { ...lesson.understanding, [key]: outcome },
              })
            }
          />
        </ScrollView>
      </View>
    );
  if (lesson.step === 'summary')
    return (
      <ScrollView contentContainerStyle={styles.body}>
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Icon name="sun" size={64} color={palette.gold} />
        </View>
        <Label style={styles.title}>{title}</Label>
        <Label muted>
          {t(
            'Your practice is saved. Come back tomorrow to strengthen your recall.',
            'حُفظ تدريبك. عد غدًا لتقوية تذكّرك.',
          )}
        </Label>
        <Card>
          <Label style={styles.subtitle}>
            {t('Today’s practice', 'تدريب اليوم')}
          </Label>
          <Label>
            {Object.keys(lesson.outcomes).length}{' '}
            {t('ayahs practiced', 'آيات تدربت عليها')}
          </Label>
          <Label>
            {
              Object.values(lesson.outcomes).filter(v => v === 'remembered')
                .length
            }{' '}
            {t('recalled without help', 'تذكّرتها دون مساعدة')}
          </Label>
          <Label>
            {
              Object.values(lesson.understanding ?? {}).filter(
                value => value !== 'later',
              ).length
            }{' '}
            {t('ayah meanings explored', 'معاني آيات استكشفتها')}
          </Label>
        </Card>
        <Button
          label={t('Return to Learn', 'العودة إلى التعلّم')}
          onPress={onClose}
        />
      </ScrollView>
    );
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t('Save and leave lesson', 'حفظ الدرس والخروج')}
          onPress={async () => {
            await pausePracticeAudio();
            operation.current++;
            store().finish(id, false);
            onClose();
          }}
          style={styles.circle}
        >
          <Icon name="back" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Label style={styles.small}>
            {surahName(Number(key.split(':')[0]), ar)} · {key}
          </Label>
          <Label style={styles.eyebrow}>
            {t('YOUR PRACTICE', 'تدريبك')} · {lesson.index + 1}/
            {lesson.keys.length}
          </Label>
        </View>
        <Pressable
          accessibilityLabel={t('Practice settings', 'إعدادات التدريب')}
          style={styles.circle}
          onPress={async () => {
            await pausePracticeAudio();
            operation.current++;
            setBusy(false);
            patch({ phase: 'ready' });
            onSettings();
          }}
        >
          <Text style={{ color: palette.green, fontSize: 22 }}>☷</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.progress}>
          <View
            style={{
              height: 5,
              backgroundColor: palette.green,
              width: `${
                (['listen', 'repeat', 'recall', 'connect'].indexOf(
                  lesson.step,
                ) +
                  1) *
                25
              }%`,
            }}
          />
        </View>
        <Label style={styles.title}>{title}</Label>
        <Label muted>
          {lesson.step === 'listen'
            ? t(
                'Follow the reciter. Notice how the words join.',
                'تابع القارئ وانتبه إلى اتصال الكلمات.',
              )
            : lesson.step === 'repeat'
            ? t(
                'After each recitation, say the ayah aloud in the quiet space.',
                'بعد كل تلاوة، ردّد الآية بصوتك في فترة الصمت.',
              )
            : lesson.step === 'recall'
            ? t(
                'Recite aloud before checking. This is your own reflection, not a pronunciation score.',
                'اتلُ بصوتك قبل التقييم. هذا تقييمك لنفسك، وليس درجة للنطق.',
              )
            : t(
                'Listen to the passage, then recite it as one connected piece.',
                'استمع إلى المقطع، ثم اتله كاملًا مترابطًا.',
              )}
        </Label>
        <MushafFrame>
          <SurahOrnament title={surahName(Number(key.split(':')[0]), true)} />
          {!hidden && data.openingBasmala && (
            <Text
              style={[styles.arabic, { textAlign: 'center', fontSize: 23 }]}
            >
              {data.openingBasmala}
            </Text>
          )}
          {hidden ? (
            <View
              style={{ alignItems: 'center', gap: 16, paddingVertical: 25 }}
            >
              <Icon name="quran" size={40} />
              <Label style={{ textAlign: 'center' }}>
                {t(
                  'The words are hidden. Take your time.',
                  'الكلمات مخفية. خذ وقتك.',
                )}
              </Label>
            </View>
          ) : lesson.step === 'connect' ? (
            lesson.keys.slice(0, lesson.index + 1).map(k => (
              <Text key={k} style={styles.arabic}>
                {bundledVerse(k).arabic}
              </Text>
            ))
          ) : (
            <>
              <Text
                style={[
                  styles.arabic,
                  { fontSize: 30 * useLearning.getState().data.fontScale },
                ]}
              >
                {data.words.length
                  ? data.words.map(w => (
                      <Text
                        key={w.position}
                        onPress={() => setHelp(w.position)}
                        style={{
                          color: palette.ink,
                          backgroundColor:
                            busy &&
                            activeSegment &&
                            w.position >= activeSegment.word &&
                            w.position <=
                              (activeSegment.endWord ?? activeSegment.word)
                              ? '#CDEDB6'
                              : 'transparent',
                        }}
                      >
                        {w.text}{' '}
                      </Text>
                    ))
                  : data.arabic}
              </Text>
              {profile.settings.pronunciation && data.transliteration && (
                <Label muted>{data.transliteration}</Label>
              )}
              {profile.settings.meaning && data.meaning && (
                <Label muted>{data.meaning}</Label>
              )}
            </>
          )}
        </MushafFrame>
        {help !== null && (
          <Card>
            <Label>
              {data.words.find(w => w.position === help)?.transliteration ??
                t('Word pronunciation', 'نطق الكلمة')}
            </Label>
            <Button
              label={t('Hear this word', 'استمع إلى الكلمة')}
              disabled={!data.words.find(w => w.position === help)?.audioUrl}
              onPress={() => {
                const url = data.words.find(w => w.position === help)?.audioUrl;
                if (url)
                  playResource(url, key).catch(() =>
                    setError(
                      t('Word audio unavailable', 'صوت الكلمة غير متاح'),
                    ),
                  );
              }}
            />
            <Button
              quiet
              label={t('Return to the ayah', 'العودة إلى الآية')}
              onPress={() => {
                operation.current++;
                cancelPracticeAudio();
                setHelp(null);
              }}
            />
          </Card>
        )}
        {error ? <Label style={styles.notice}>{error}</Label> : null}
        {lesson.step === 'recall' ? (
          <>
            <Pressable
              style={styles.link}
              onPress={() => {
                patch({ hinted: true });
                setShowHint(true);
              }}
            >
              <Label style={{ textAlign: 'center', color: palette.green }}>
                {t('Show a text hint', 'إظهار تلميح نصي')}
              </Label>
            </Pressable>
            <Button
              label={t('Remembered', 'تذكّرت')}
              onPress={() => report('remembered')}
            />
            <Button
              quiet
              label={t('Needed help', 'احتجت مساعدة')}
              onPress={() => report('help')}
            />
            <Button
              quiet
              label={t('Practice again', 'أتدرّب مجددًا')}
              onPress={() => report('again')}
            />
          </>
        ) : (
          <>
            {lesson.step === 'repeat' && (
              <Label
                style={{
                  textAlign: 'center',
                  fontWeight: '700',
                  color: palette.gold,
                }}
              >
                {lesson.phase === 'yourTurn'
                  ? t('Your turn — recite aloud', 'دورك — ردّد بصوتك')
                  : t('Repetition', 'التكرار')}{' '}
                · {Math.min(lesson.round + 1, lesson.repeats)}/{lesson.repeats}
              </Label>
            )}
            {lesson.step === 'connect' && lesson.phase === 'yourTurn' ? (
              <Button
                label={t('I’ve recited the passage', 'أتممت تلاوة المقطع')}
                onPress={next}
              />
            ) : (
              <Button
                label={
                  busy
                    ? t('Pause practice', 'إيقاف التدريب مؤقتًا')
                    : lesson.step === 'listen'
                    ? t('Listen to the ayah', 'استمع إلى الآية')
                    : lesson.step === 'repeat'
                    ? t('Begin repetition', 'ابدأ التكرار')
                    : t('Listen to the passage', 'استمع إلى المقطع')
                }
                onPress={perform}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
