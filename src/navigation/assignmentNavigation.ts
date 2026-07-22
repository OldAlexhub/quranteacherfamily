import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {
  Assignment,
  AssignmentType,
  HomeStackParamList,
  MainTabParamList,
  PracticeMode,
} from '../types';

type HomeNavigation = NativeStackNavigationProp<HomeStackParamList>;
type TabNavigation = BottomTabNavigationProp<MainTabParamList>;

export const ASSIGNMENT_ICONS: Record<AssignmentType, string> = {
  read_arabic: '📖',
  listen: '🔊',
  word_by_word: 'ا',
  memorization_review: '⭐',
  bookmark_review: '🔖',
  free_reading: '🌙',
};

const ACTION_LABELS: Record<AssignmentType, string> = {
  read_arabic: 'Read Assignment',
  listen: 'Start Listening',
  word_by_word: 'Practice Words',
  memorization_review: 'Start Review',
  bookmark_review: 'Open Bookmarks',
  free_reading: 'Start Reading',
};

export function getAssignmentActionLabel(type: AssignmentType): string {
  return ACTION_LABELS[type];
}

export function getAssignmentDetail(
  assignment: Assignment,
  surahName: string,
  includeDueDate = false,
): string {
  const range = assignment.startAyah === assignment.endAyah
    ? `Ayah ${assignment.startAyah}`
    : `Ayahs ${assignment.startAyah}–${assignment.endAyah}`;
  const details = assignment.type === 'bookmark_review'
    ? ['Saved ayahs']
    : [surahName, range];

  if (
    assignment.type === 'listen' ||
    assignment.type === 'word_by_word' ||
    assignment.type === 'memorization_review'
  ) {
    details.push(`${assignment.repeatCount ?? 3}× repeat`);
  }
  if (includeDueDate) {
    details.push(`Due ${assignment.dueDate.slice(0, 10)}`);
  }
  return details.join(' · ');
}

export function launchAssignment(
  navigation: HomeNavigation,
  assignment: Assignment,
): void {
  const launchKey = `${assignment.id}:${Date.now()}`;
  if (assignment.type === 'bookmark_review') {
    navigation.navigate('Bookmarks');
    return;
  }

  const tabs = navigation.getParent<TabNavigation>();
  if (!tabs) return;

  if (assignment.type === 'read_arabic' || assignment.type === 'free_reading') {
    tabs.navigate('QuranTab', {
      screen: 'QuranReader',
      params: {
        surahNumber: assignment.surahNumber,
        startAyah: assignment.startAyah,
        endAyah: assignment.endAyah,
        assignmentTitle: assignment.title,
        launchKey,
      },
    });
    return;
  }

  if (assignment.type === 'word_by_word') {
    tabs.navigate('QuranTab', {
      screen: 'WordTeacherMode',
      params: {
        surahNumber: assignment.surahNumber,
        ayahNumber: assignment.startAyah,
        endAyah: assignment.endAyah,
        repeatCount: assignment.repeatCount,
        assignmentTitle: assignment.title,
        launchKey,
      },
    });
    return;
  }

  const mode: PracticeMode = assignment.type === 'listen'
    ? 'listen_only'
    : 'memorization_review';
  tabs.navigate('MemorizeTab', {
    screen: 'RepeatPractice',
    params: {
      surahNumber: assignment.surahNumber,
      startAyah: assignment.startAyah,
      endAyah: assignment.endAyah,
      repeatCount: assignment.repeatCount,
      mode,
      assignmentTitle: assignment.title,
      launchKey,
    },
  });
}
