// Reproducible fixes for the pinned SDK 14.11.0 Android event bridge.
// Standard InterstitialAd was missing its paid listener; banner impressions
// were not forwarded separately from paid events. Reassess when upgrading SDK.
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'../node_modules/react-native-google-mobile-ads');
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
if(version!=='14.11.0')throw new Error('Review ad bridge patches before upgrading react-native-google-mobile-ads');
function patch(file,before,after){
 const target=path.join(root,file);const source=fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n');
 if(source.includes(after))return;
 if(!source.includes(before))throw new Error(`Ad bridge patch no longer matches ${file}`);
 fs.writeFileSync(target,source.replace(before,after));
}
const native='android/src/main/java/io/invertase/googlemobileads/';
patch(native+'ReactNativeGoogleMobileAdsFullScreenAdModule.kt',
 'is AdManagerInterstitialAd -> ad.onPaidEventListener = paidEventListener',
 'is AdManagerInterstitialAd -> ad.onPaidEventListener = paidEventListener\n          is com.google.android.gms.ads.interstitial.InterstitialAd -> ad.onPaidEventListener = paidEventListener');
patch(native+'ReactNativeGoogleMobileAdsBannerAdViewManager.java',
 '          @Override\n          public void onAdOpened() {',
 '          @Override\n          public void onAdImpression() {\n            sendEvent(reactViewGroup, "onAdImpression", null);\n          }\n\n          @Override\n          public void onAdOpened() {');
patch('src/types/BannerAdProps.ts','  onAdOpened?: () => void;','  onAdOpened?: () => void;\n\n  /** Actual SDK impression callback (Android bridge patch). */\n  onAdImpression?: () => void;');
patch('src/ads/BaseAd.tsx',"type: 'onAdOpened' | 'onAdClosed'", "type: 'onAdOpened' | 'onAdClosed' | 'onAdImpression'");
console.log('Verified Android ad revenue and impression bridge patches.');
