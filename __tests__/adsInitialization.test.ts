jest.mock('../src/learning/ui',()=>({Label:()=>null,styles:{small:{}},useWords:()=>({t:(en:string)=>en})}));
jest.mock('../src/learning/store',()=>({useLearning:{getState:()=>({ready:true,data:{onboarded:true,profiles:{},analytics:true}})}}));
jest.mock('../src/learning/telemetry',()=>({track:jest.fn()}));
const settle=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function setup(){
 jest.resetModules();
 const native=require('react-native');native.AppState.currentState='active';
 const sdk=require('react-native-google-mobile-ads');
 const storage=require('@react-native-async-storage/async-storage');
 storage.getItem.mockResolvedValue(null);
 globalThis.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({adsEnabled:true,revision:1})});
 const ads=require('../src/learning/ads');return {sdk,storage,ads};
}
beforeEach(()=>jest.useFakeTimers());
afterEach(()=>{jest.clearAllTimers();jest.useRealTimers();});
test('sets child-directed request configuration before initializing the SDK',async()=>{
 const {sdk,ads}=setup();await ads.initializeAds();await settle();
 const mobile=sdk.default();expect(mobile.setRequestConfiguration).toHaveBeenCalledWith({maxAdContentRating:'G',tagForChildDirectedTreatment:true,tagForUnderAgeOfConsent:true});
 expect(mobile.setRequestConfiguration.mock.invocationCallOrder[0]).toBeLessThan(mobile.initialize.mock.invocationCallOrder[0]);
 expect(sdk.InterstitialAd.createForAdRequest).toHaveBeenCalledWith(expect.any(String),{requestNonPersonalizedAdsOnly:true});
});
test('a consent update finishing after navigation cannot open a form over a lesson',async()=>{
 const {sdk,ads}=setup();let resolve!:()=>void;sdk.AdsConsent.requestInfoUpdate.mockImplementationOnce(()=>new Promise<void>(r=>{resolve=r;}));
 const pending=ads.initializeAds();await settle();ads.setAdScene('lesson');resolve();await pending;
 expect(sdk.AdsConsent.loadAndShowConsentFormIfRequired).not.toHaveBeenCalled();expect(sdk.default().initialize).not.toHaveBeenCalled();
});
test('uses SDK-confirmed prior consent after a network failure, but never invents permission',async()=>{
 const {sdk,ads}=setup();sdk.AdsConsent.requestInfoUpdate.mockRejectedValue(new Error('network'));
 sdk.AdsConsent.getConsentInfo.mockResolvedValueOnce({canRequestAds:false});await ads.initializeAds();expect(sdk.default().initialize).not.toHaveBeenCalled();
 sdk.AdsConsent.getConsentInfo.mockResolvedValueOnce({canRequestAds:true});await ads.initializeAds();expect(sdk.default().initialize).toHaveBeenCalledTimes(1);
});
test('a cached owner disable switch prevents SDK initialization during a server outage',async()=>{
 const {sdk,storage,ads}=setup();storage.getItem.mockImplementation(async(key:string)=>key==='qtf:ad-config'?JSON.stringify({adsEnabled:false}):null);(fetch as jest.Mock).mockRejectedValue(new Error('network'));
 await ads.initializeAds();await settle();expect(sdk.default().initialize).not.toHaveBeenCalled();expect(sdk.InterstitialAd.createForAdRequest).not.toHaveBeenCalled();
});
