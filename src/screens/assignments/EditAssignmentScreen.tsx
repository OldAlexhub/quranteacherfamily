import React from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {AppText} from '../../components/common/AppText';
import {AppButton} from '../../components/common/AppButton';

export function EditAssignmentScreen() {
  const navigation = useNavigation();
  return (
    <ScreenWrapper>
      <AppText variant="heading" style={{marginBottom: 16}}>Edit Assignment</AppText>
      <AppText variant="body" style={{marginBottom: 16, opacity: 0.7}}>Assignment editing uses the same form as creation. Select the assignment from the list and modify it.</AppText>
      <AppButton label="Go Back" onPress={() => navigation.goBack()} variant="secondary" />
    </ScreenWrapper>
  );
}
