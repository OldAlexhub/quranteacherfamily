import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text, TextInput, Pressable } from 'react-native';
import { ReaderScreen } from '../src/learning/ReaderScreen';
import { useLearning } from '../src/learning/store';
import { newProfile } from '../src/learning/domain';
jest.mock('../src/learning/audio', () => ({
  cancelPracticeAudio: jest.fn(),
  playResource: jest.fn().mockResolvedValue(5),
}));

test('reader keeps Quran prominent and validates the passage before starting a lesson', async () => {
  useLearning.setState(s => ({
    data: { ...s.data, language: 'en', profiles: { reader: newProfile() } },
  }));
  const begin = jest.fn();
  let view!: Renderer.ReactTestRenderer;
  await act(async () => {
    view = Renderer.create(
      <ReaderScreen surah={1} id="reader" onBegin={begin} />,
    );
  });
  const button = (label: string) =>
    view.root.findAll(
      n =>
        n.props.accessibilityLabel === label &&
        typeof n.props.onPress === 'function',
    )[0];
  // Text inputs are in the unopened sheet, never stacked beneath every ayah.
  expect(view.root.findAllByType(TextInput)).toHaveLength(0);
  await act(async () => {
    button('Memorize').props.onPress();
  });
  const fields = view.root.findAllByType(TextInput);
  await act(async () => {
    fields[0].props.onChangeText('0');
  });
  await act(async () => {
    button('Begin memorizing').props.onPress();
  });
  expect(begin).not.toHaveBeenCalled();
  await act(async () => {
    fields[0].props.onChangeText('2');
    fields[1].props.onChangeText('3');
  });
  await act(async () => {
    button('Begin memorizing').props.onPress();
  });
  expect(begin).toHaveBeenCalledWith(['1:2', '1:3']);
  await act(async () => {
    view.unmount();
  });
});
