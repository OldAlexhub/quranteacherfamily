import React, {useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../theme';
import {useLearnerStore} from '../../store/useLearnerStore';
import {
  useGamificationStore,
  ALL_BADGES,
  getLevelTitle,
  getXPForNextLevel,
  computeLevel,
} from '../../store/useGamificationStore';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {XPProgressBar} from '../../components/gamification/XPProgressBar';
import type {BadgeDefinition} from '../../types';

function BadgeDetailModal({
  badge,
  earned,
  visible,
  onClose,
}: {
  badge: BadgeDefinition | null;
  earned: boolean;
  visible: boolean;
  onClose: () => void;
}) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  if (!badge) {return null;}
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <TouchableOpacity
        style={[
          styles.modalOverlay,
          {
            backgroundColor: colors.modalBackground,
            paddingTop: Math.max(24, insets.top + 12),
            paddingRight: Math.max(24, insets.right + 12),
            paddingBottom: Math.max(24, insets.bottom + 12),
            paddingLeft: Math.max(24, insets.left + 12),
          },
        ]}
        onPress={onClose}
        activeOpacity={1}>
        <View style={[styles.modalCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <Text style={styles.modalEmoji}>{badge.icon}</Text>
          {!earned && <Text style={styles.lockOverlay}>🔒</Text>}
          <Text style={[styles.modalName, {color: colors.textPrimary}]}>{badge.name}</Text>
          <Text style={[styles.modalDesc, {color: colors.textSecondary}]}>
            {badge.description}
          </Text>
          <View style={[styles.modalXP, {backgroundColor: colors.accent + '20', borderColor: colors.accent + '44'}]}>
            <Text style={[styles.modalXPText, {color: colors.accent}]}>
              ⚡ +{badge.xpReward} XP reward
            </Text>
          </View>
          {earned && (
            <Text style={[styles.modalEarned, {color: colors.memorized}]}>
              ✅ You've earned this badge!
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function AchievementsScreen() {
  const {colors} = useTheme();
  const learner = useLearnerStore(s => s.getActiveLearner());
  const getProfile = useGamificationStore(s => s.getProfile);
  const profile = learner ? getProfile(learner.id) : null;

  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const earnedSet = new Set(profile?.earnedBadgeIds ?? []);
  const earnedBadges = ALL_BADGES.filter(b => earnedSet.has(b.id));
  const lockedBadges = ALL_BADGES.filter(b => !earnedSet.has(b.id));

  const xp = profile?.xp ?? 0;
  const level = computeLevel(xp);
  const {current, needed} = getXPForNextLevel(xp);
  const levelTitle = getLevelTitle(level);

  function openBadge(badge: BadgeDefinition) {
    setSelectedBadge(badge);
    setModalVisible(true);
  }

  function renderBadge(badge: BadgeDefinition, isEarned: boolean) {
    return (
      <TouchableOpacity
        key={badge.id}
        onPress={() => openBadge(badge)}
        accessibilityLabel={`${badge.name}: ${badge.description}`}
        style={[
          styles.badgeCell,
          {
            backgroundColor: isEarned ? colors.surfaceAlt : colors.surface,
            borderColor: isEarned ? colors.accent + '55' : colors.border,
            opacity: isEarned ? 1 : 0.5,
          },
        ]}>
        <View style={styles.badgeEmojiWrap}>
          <Text style={styles.badgeEmoji}>{badge.icon}</Text>
          {!isEarned && (
            <View style={[styles.lockBadge, {backgroundColor: colors.overlayDark}]}>
              <Text style={styles.lockText}>🔒</Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.badgeName, {color: isEarned ? colors.textPrimary : colors.textMuted}]}
          numberOfLines={2}>
          {badge.name}
        </Text>
        {isEarned && (
          <View style={[styles.earnedDot, {backgroundColor: colors.memorized}]} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <ScreenWrapper scrollable={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Level card */}
        <View style={[styles.levelCard, {backgroundColor: colors.primary}]}>
          <View style={styles.levelRow}>
            <View style={[styles.levelCircle, {borderColor: colors.accent}]}>
              <Text style={[styles.levelNumber, {color: colors.accent}]}>{level}</Text>
              <Text style={[styles.levelWord, {color: colors.textInverse + '88'}]}>level</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelTitleText, {color: colors.textInverse}]}>
                {levelTitle}
              </Text>
              <Text style={[styles.xpToNext, {color: colors.textInverse + '99'}]}>
                {current} / {needed} XP to Level {level + 1}
              </Text>
              <XPProgressBar xp={xp} level={level} showLabel={false} compact />
            </View>
          </View>

          {/* Stats row */}
          <View style={[styles.statsRow, {borderTopColor: colors.textInverse + '22'}]}>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, {color: colors.accent}]}>
                {profile?.streak ?? 0}🔥
              </Text>
              <Text style={[styles.statLabel, {color: colors.textInverse + '88'}]}>streak</Text>
            </View>
            <View style={[styles.statDivider, {backgroundColor: colors.textInverse + '22'}]} />
            <View style={styles.statCell}>
              <Text style={[styles.statValue, {color: colors.textInverse}]}>
                {profile?.totalAyahsMemorized ?? 0}
              </Text>
              <Text style={[styles.statLabel, {color: colors.textInverse + '88'}]}>ayahs</Text>
            </View>
            <View style={[styles.statDivider, {backgroundColor: colors.textInverse + '22'}]} />
            <View style={styles.statCell}>
              <Text style={[styles.statValue, {color: colors.textInverse}]}>
                {profile?.totalSessions ?? 0}
              </Text>
              <Text style={[styles.statLabel, {color: colors.textInverse + '88'}]}>sessions</Text>
            </View>
            <View style={[styles.statDivider, {backgroundColor: colors.textInverse + '22'}]} />
            <View style={styles.statCell}>
              <Text style={[styles.statValue, {color: colors.textInverse}]}>
                {profile?.longestStreak ?? 0}
              </Text>
              <Text style={[styles.statLabel, {color: colors.textInverse + '88'}]}>best streak</Text>
            </View>
          </View>
        </View>

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
                🏅 Earned ({earnedBadges.length})
              </Text>
            </View>
            <View style={styles.badgeGrid}>
              {earnedBadges.map(b => renderBadge(b, true))}
            </View>
          </>
        )}

        {/* Locked badges */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
            🔒 Locked ({lockedBadges.length})
          </Text>
          <Text style={[styles.sectionSub, {color: colors.textMuted}]}>
            Keep going to unlock these!
          </Text>
        </View>
        <View style={styles.badgeGrid}>
          {lockedBadges.map(b => renderBadge(b, false))}
        </View>

        {/* Total XP */}
        <View style={[styles.xpTotal, {backgroundColor: colors.surfaceAlt, borderColor: colors.border}]}>
          <Text style={[styles.xpTotalLabel, {color: colors.textMuted}]}>Total XP earned</Text>
          <Text style={[styles.xpTotalValue, {color: colors.accent}]}>⚡ {xp}</Text>
        </View>
      </ScrollView>

      <BadgeDetailModal
        badge={selectedBadge}
        earned={selectedBadge ? earnedSet.has(selectedBadge.id) : false}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12, paddingBottom: 32},

  // Level card
  levelCard: {borderRadius: 20, padding: 20, gap: 16},
  levelRow: {flexDirection: 'row', alignItems: 'center', gap: 16},
  levelCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {fontSize: 28, fontWeight: '900'},
  levelWord: {fontSize: 10, fontWeight: '600'},
  levelInfo: {flex: 1, gap: 4},
  levelTitleText: {fontSize: 22, fontWeight: '800'},
  xpToNext: {fontSize: 12},
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 14,
    justifyContent: 'space-around',
  },
  statCell: {alignItems: 'center', gap: 2},
  statValue: {fontSize: 18, fontWeight: '800'},
  statLabel: {fontSize: 10, fontWeight: '600', textTransform: 'uppercase'},
  statDivider: {width: 1, marginVertical: 2},

  // Section
  sectionHeader: {gap: 2, marginTop: 8},
  sectionTitle: {fontSize: 16, fontWeight: '700'},
  sectionSub: {fontSize: 12},

  // Badge grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCell: {
    width: '22%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  badgeEmojiWrap: {position: 'relative'},
  badgeEmoji: {fontSize: 30, lineHeight: 38},
  lockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 8,
    padding: 2,
  },
  lockText: {fontSize: 10},
  badgeName: {fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 13},
  earnedDot: {width: 6, height: 6, borderRadius: 3},

  // XP total
  xpTotal: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  xpTotalLabel: {fontSize: 14, fontWeight: '600'},
  xpTotalValue: {fontSize: 22, fontWeight: '800'},

  // Modal
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  modalEmoji: {fontSize: 52},
  lockOverlay: {fontSize: 20, position: 'absolute', top: 0, right: 0},
  modalName: {fontSize: 20, fontWeight: '800', textAlign: 'center'},
  modalDesc: {fontSize: 14, textAlign: 'center', lineHeight: 20},
  modalXP: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalXPText: {fontSize: 14, fontWeight: '700'},
  modalEarned: {fontSize: 14, fontWeight: '700'},
});
