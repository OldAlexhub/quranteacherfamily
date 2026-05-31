const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ttf', 'otf', 'mp3', 'ogg', 'wav', 'json'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
