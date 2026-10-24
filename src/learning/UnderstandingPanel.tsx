import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { bundledVerse, surahName } from './content';
import { tafsir, surahIntroduction } from './understanding';
import type {
  ExplanationBlock,
  SurahIntroduction,
  TafsirManifest,
} from './types';
import { Button, Card, Icon, Label, palette, styles, useWords } from './ui';

function SourceText({
  blocks,
  expanded,
}: {
  blocks: ExplanationBlock[];
  expanded: boolean;
}) {
  const { ar } = useWords();
  if (!expanded)
    return (
      <Text
        numberOfLines={7}
        style={[
          styles.text,
          {
            fontSize: 17,
            lineHeight: 29,
            writingDirection: ar ? 'rtl' : 'ltr',
            textAlign: ar ? 'right' : 'left',
          },
        ]}
      >
        {blocks.map(b => b.text).join('\n\n')}
      </Text>
    );
  return (
    <>
      {blocks.map((b, i) => (
        <Label
          key={i}
          style={
            b.kind === 'heading'
              ? styles.subtitle
              : { fontSize: 17, lineHeight: 29 }
          }
        >
          {b.text}
        </Label>
      ))}
    </>
  );
}
export function UnderstandingPanel({
  verseKey,
  initial = 'ayah',
  onReflection,
}: {
  verseKey: string;
  initial?: 'ayah' | 'surah';
  onReflection?: (outcome: 'explained' | 'together' | 'later') => void;
}) {
  const { ar, t } = useWords(),
    language = ar ? 'ar' : 'en',
    surah = Number(verseKey.split(':')[0]);
  const [tab, setTab] = useState<'ayah' | 'surah'>(initial),
    [data, setData] = useState<TafsirManifest>(),
    [intro, setIntro] = useState<SurahIntroduction>();
  const [loading, setLoading] = useState(true),
    [introLoading, setIntroLoading] = useState(false),
    [expanded, setExpanded] = useState(false),
    [retry, setRetry] = useState(0),
    [reflection, setReflection] = useState(false);
  useEffect(() => {
    let active = true;
    setData(undefined);
    setLoading(true);
    setExpanded(false);
    setReflection(false);
    tafsir(surah, language, retry > 0).then(result => {
      if (active) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [surah, language, retry]);
  useEffect(() => {
    setExpanded(false);
    setReflection(false);
  }, [verseKey]);
  useEffect(() => {
    if (tab !== 'surah') return;
    let active = true;
    setIntro(undefined);
    setIntroLoading(true);
    surahIntroduction(surah, language).then(result => {
      if (active) {
        setIntro(result);
        setIntroLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [surah, language, tab, retry]);
  const entry = data?.entries.find(e => e.id === data.byAyah[verseKey]);
  return (
    <View style={{ gap: 18 }}>
      <View
        style={[
          styles.row,
          {
            flexDirection: ar ? 'row-reverse' : 'row',
            backgroundColor: palette.light,
            padding: 5,
            borderRadius: 18,
          },
        ]}
      >
        {(['ayah', 'surah'] as const).map(value => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === value }}
            accessibilityLabel={
              value === 'ayah'
                ? t('Ayah explanation', 'تفسير الآية')
                : t('About this surah', 'عن السورة')
            }
            onPress={() => {
              setTab(value);
              setExpanded(false);
            }}
            style={{
              flex: 1,
              minHeight: 46,
              justifyContent: 'center',
              borderRadius: 14,
              backgroundColor: tab === value ? palette.white : 'transparent',
            }}
          >
            <Label style={{ textAlign: 'center', fontWeight: '700' }}>
              {value === 'ayah'
                ? t('This ayah', 'هذه الآية')
                : t('The surah', 'السورة')}
            </Label>
          </Pressable>
        ))}
      </View>
      {tab === 'ayah' ? (
        <>
          <Label style={styles.eyebrow}>
            {t('UNDERSTAND WHAT YOU RECITE', 'افهم ما تتلو')}
          </Label>
          <Text style={[styles.arabic, { fontSize: 25, lineHeight: 48 }]}>
            {bundledVerse(verseKey).arabic}
          </Text>
          {!ar && (
            <Card>
              <Label style={styles.small} muted>
                {t(
                  'Translation of the meaning · M. M. Pickthall',
                  'ترجمة المعنى',
                )}
              </Label>
              <Label style={{ fontSize: 17, lineHeight: 28 }}>
                {bundledVerse(verseKey).meaning}
              </Label>
            </Card>
          )}
          {loading ? (
            <ActivityIndicator
              accessibilityLabel={t(
                'Loading explanation',
                'جارٍ تحميل التفسير',
              )}
              color={palette.green}
            />
          ) : entry && data ? (
            <Card>
              <View style={styles.row}>
                <Icon name="quran" />
                <Label style={[styles.subtitle, { flex: 1 }]}>
                  {t('Read the explanation', 'اقرأ التفسير')}
                </Label>
              </View>
              {entry.from !== entry.to && (
                <Label muted style={styles.small}>
                  {t(
                    'This explanation covers ayahs',
                    'هذا التفسير يتناول الآيات',
                  )}{' '}
                  {entry.from}–{entry.to}
                </Label>
              )}
              <SourceText blocks={entry.blocks} expanded={expanded} />
              <Pressable
                accessibilityRole="button"
                style={styles.link}
                onPress={() => setExpanded(!expanded)}
              >
                <Label style={{ fontWeight: '700', color: palette.green }}>
                  {expanded
                    ? t('Show less', 'عرض أقل')
                    : t('Read the full explanation', 'قراءة التفسير كاملًا')}
                </Label>
              </Pressable>
              <View style={styles.rule} />
              <Label muted style={styles.small}>
                {data.source.name} · {data.source.author}
                {'\n'}
                {t('Provided by Quran Foundation', 'المصدر: مؤسسة القرآن')}
              </Label>
            </Card>
          ) : (
            <Card>
              <Label>
                {t(
                  'The explanation isn’t available on this device yet. You can keep practicing and return when connected.',
                  'التفسير غير متاح على هذا الجهاز بعد. يمكنك متابعة التدريب والعودة عند الاتصال.',
                )}
              </Label>
              <Button
                quiet
                label={t('Try again', 'حاول مجددًا')}
                onPress={() => setRetry(n => n + 1)}
              />
            </Card>
          )}
          {!!entry && (
            <Card style={{ backgroundColor: '#EDF1DC' }}>
              <Label style={styles.eyebrow}>
                {t('IN YOUR OWN WORDS', 'بكلماتك أنت')}
              </Label>
              <Label style={styles.subtitle}>
                {t('What is this ayah teaching you?', 'ماذا تعلّمك هذه الآية؟')}
              </Label>
              <Label>
                {t(
                  'Read it together if you like. Tell someone one thing you understood, and find the part of the explanation that helped you.',
                  'اقرأ مع أحد أفراد أسرتك إن أحببت. أخبره بشيء فهمته، وحدّد الجزء الذي ساعدك في التفسير.',
                )}
              </Label>
              <Pressable
                accessibilityRole="button"
                style={styles.link}
                onPress={() => setReflection(!reflection)}
              >
                <Label style={{ color: palette.green, fontWeight: '700' }}>
                  {t('A little help thinking', 'مساعدة صغيرة للتفكّر')}{' '}
                  {reflection ? '−' : '+'}
                </Label>
              </Pressable>
              {reflection && (
                <Label>
                  {t(
                    'Who or what does the passage talk about? Does it teach you something to believe, something to do, or something to remember? Use the explanation; it is okay to ask an adult.',
                    'عمّن أو عن ماذا يتحدث المقطع؟ هل يعلّمك شيئًا تؤمن به، أو عملًا تقوم به، أو أمرًا تتذكّره؟ استعن بالتفسير، ولا تتردد في سؤال شخص كبير.',
                  )}
                </Label>
              )}
              {onReflection && (
                <View style={{ gap: 10 }}>
                  <Button
                    label={t('I explained it in my words', 'شرحتها بكلماتي')}
                    onPress={() => onReflection('explained')}
                  />
                  <Button
                    quiet
                    label={t(
                      'I’d like to read it together',
                      'أريد قراءتها مع أحد',
                    )}
                    onPress={() => onReflection('together')}
                  />
                </View>
              )}
            </Card>
          )}
        </>
      ) : (
        <>
          <Label style={styles.eyebrow}>
            {t('THE BIGGER PICTURE', 'الصورة الكاملة')}
          </Label>
          <Label style={styles.title}>{surahName(surah, ar)}</Label>
          <Label muted>
            {t(
              'Discover the context of the surah. Younger learners can explore this with a parent or teacher.',
              'تعرّف إلى سياق السورة. يمكن للصغار استكشافه مع أحد الوالدين أو المعلّم.',
            )}
          </Label>
          {introLoading ? (
            <ActivityIndicator color={palette.green} />
          ) : intro ? (
            <Card>
              <SourceText blocks={intro.blocks} expanded={expanded} />
              <Pressable
                accessibilityRole="button"
                style={styles.link}
                onPress={() => setExpanded(!expanded)}
              >
                <Label style={{ fontWeight: '700', color: palette.green }}>
                  {expanded
                    ? t('Show less', 'عرض أقل')
                    : t('Read the full introduction', 'قراءة المقدمة كاملة')}
                </Label>
              </Pressable>
              <View style={styles.rule} />
              <Label muted style={styles.small}>
                {intro.source}
                {'\n'}
                {t('Provided by Quran Foundation', 'المصدر: مؤسسة القرآن')}
              </Label>
            </Card>
          ) : (
            <Card>
              <Label>
                {t(
                  'Connect to read this surah’s introduction. The saved ayah explanations remain available.',
                  'اتصل لقراءة مقدمة هذه السورة. تظل تفاسير الآيات المحفوظة متاحة.',
                )}
              </Label>
              <Button
                quiet
                label={t('Try again', 'حاول مجددًا')}
                onPress={() => setRetry(n => n + 1)}
              />
            </Card>
          )}
        </>
      )}
      {onReflection && (
        <Button
          quiet
          label={t('Continue to listening', 'تابع إلى الاستماع')}
          onPress={() => onReflection('later')}
        />
      )}
    </View>
  );
}
