/* eslint-env jest */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const {View} = require('react-native');
  const insets = {top: 0, right: 0, bottom: 0, left: 0};
  const frame = {x: 0, y: 0, width: 390, height: 844};
  const SafeAreaInsetsContext = React.createContext(insets);
  const SafeAreaFrameContext = React.createContext(frame);

  return {
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    SafeAreaProvider: ({children}) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({children, edges, ...props}) => React.createElement(View, props, children),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: {insets, frame},
  };
});

jest.mock('react-native-google-mobile-ads', () => {
  const mobileAds = {
    initialize: jest.fn().mockResolvedValue(undefined),
    setRequestConfiguration: jest.fn().mockResolvedValue(undefined),
  };
  const interstitial = {
    addAdEventListener: jest.fn(() => jest.fn()),
    load: jest.fn(),
    show: jest.fn().mockResolvedValue(undefined),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mobileAds),
    MaxAdContentRating: {G: 'G'},
    BannerAd: () => null,
    BannerAdSize: {BANNER: 'BANNER'},
    TestIds: {BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial'},
    AdEventType: {LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed'},
    InterstitialAd: {createForAdRequest: jest.fn(() => interstitial)},
  };
});

jest.mock('react-native-track-player', () => {
  const player = {
    setupPlayer: jest.fn().mockResolvedValue(undefined),
    updateOptions: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    skipToNext: jest.fn().mockResolvedValue(undefined),
    skipToPrevious: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(() => jest.fn()),
    registerPlaybackService: jest.fn(),
  };

  return {
    __esModule: true,
    default: player,
    Capability: {
      Play: 'play',
      Pause: 'pause',
      Stop: 'stop',
      SkipToNext: 'next',
      SkipToPrevious: 'previous',
    },
    State: {Playing: 'playing', Paused: 'paused', Stopped: 'stopped'},
    RepeatMode: {Off: 'off', Track: 'track', Queue: 'queue'},
    Event: {
      PlaybackQueueEnded: 'playback-queue-ended',
      PlaybackError: 'playback-error',
      RemotePlay: 'remote-play',
      RemotePause: 'remote-pause',
      RemoteStop: 'remote-stop',
      RemoteNext: 'remote-next',
      RemotePrevious: 'remote-previous',
    },
    useTrackPlayerEvents: jest.fn(),
    useActiveTrack: jest.fn(() => undefined),
    useProgress: jest.fn(() => ({position: 0, duration: 0, buffered: 0})),
  };
});
