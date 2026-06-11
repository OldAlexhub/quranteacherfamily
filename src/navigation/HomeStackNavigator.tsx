import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../types';
import {useTheme} from '../theme';
import {HomeScreen} from '../screens/home/HomeScreen';
import {ParentDashboardScreen} from '../screens/home/ParentDashboardScreen';
import {LearnerProfilesScreen} from '../screens/settings/LearnerProfilesScreen';
import {CreateLearnerScreen} from '../screens/settings/CreateLearnerScreen';
import {EditLearnerScreen} from '../screens/settings/EditLearnerScreen';
import {AssignmentsScreen} from '../screens/assignments/AssignmentsScreen';
import {CreateAssignmentScreen} from '../screens/assignments/CreateAssignmentScreen';
import {EditAssignmentScreen} from '../screens/assignments/EditAssignmentScreen';
import {BookmarksScreen} from '../screens/bookmarks/BookmarksScreen';
import {NotesScreen} from '../screens/notes/NotesScreen';
import {SearchScreen} from '../screens/search/SearchScreen';
import {AchievementsScreen} from '../screens/achievements/AchievementsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  const theme = useTheme();
  const c = theme.colors;
  const headerStyle = {backgroundColor: c.surface, headerTintColor: c.primary, headerTitleStyle: {color: c.textPrimary, fontWeight: '600' as const}};
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="Home" component={HomeScreen} options={{headerShown: false}} />
      <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} options={{title: 'Parent Dashboard'}} />
      <Stack.Screen name="LearnerProfiles" component={LearnerProfilesScreen} options={{title: 'Learner Profiles'}} />
      <Stack.Screen name="CreateLearner" component={CreateLearnerScreen} options={{title: 'New Learner'}} />
      <Stack.Screen name="EditLearner" component={EditLearnerScreen} options={{title: 'Edit Learner'}} />
      <Stack.Screen name="Assignments" component={AssignmentsScreen} options={{title: 'Assignments'}} />
      <Stack.Screen name="CreateAssignment" component={CreateAssignmentScreen} options={{title: 'New Assignment'}} />
      <Stack.Screen name="EditAssignment" component={EditAssignmentScreen} options={{title: 'Edit Assignment'}} />
      <Stack.Screen name="Bookmarks" component={BookmarksScreen} options={{title: 'Bookmarks'}} />
      <Stack.Screen name="Notes" component={NotesScreen} options={{title: 'Notes'}} />
      <Stack.Screen name="Search" component={SearchScreen} options={{title: 'Search Quran'}} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} options={{title: 'Achievements'}} />
    </Stack.Navigator>
  );
}
