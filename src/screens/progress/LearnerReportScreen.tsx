import React from 'react';
import {View} from 'react-native';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {AppText} from '../../components/common/AppText';

export function LearnerReportScreen() {
  return (
    <ScreenWrapper>
      <AppText variant="heading" style={{marginBottom: 16}}>Learner Report</AppText>
      <AppText variant="body" style={{opacity: 0.7}}>Detailed learner report view. Use the main Progress screen to view all statistics and export reports.</AppText>
    </ScreenWrapper>
  );
}
