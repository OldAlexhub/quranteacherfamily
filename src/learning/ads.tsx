import React,{useEffect,useState} from 'react';
import {AppState,View,useWindowDimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MobileAds,{AdEventType,AdsConsent,BannerAd,BannerAdSize,InterstitialAd,MaxAdContentRating} from 'react-native-google-mobile-ads';
import TrackPlayer,{State} from 'react-native-track-player';
import {create} from 'zustand';
import {BANNER_AD_UNIT_ID,INTERSTITIAL_AD_UNIT_ID,ENABLE_BANNER_ADS,ENABLE_INTERSTITIAL_ADS} from '../config/adsConfig';
import {API_URL} from '../config/backend';
import {useLearning} from './store';
import {track} from './telemetry';
import {SessionAds} from './sessionAds';
import {revenueProperties} from './adRevenue';
import {Label,styles,useWords} from './ui';

const useAds=create<{ready:boolean;enabled:boolean}>(()=>({ready:false,enabled:true}));
let initializing=false,scene='learn',navigation=0,configReady:Promise<void>|undefined,lastConfig=0,configFetching=false;
const safeScene=()=>['learn','quran','progress','profile','settings'].includes(scene)&&AppState.currentState==='active';
const requestOptions={requestNonPersonalizedAdsOnly:true};
function paid(value:unknown,placement:'banner'|'session_end'){const properties=revenueProperties(value,placement);if(properties)track('ad_revenue',properties);}
const sessionAds=new SessionAds({
 create:()=>{const ad=InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID,requestOptions);return {load:()=>ad.load(),show:()=>ad.show(),on:(event,callback)=>ad.addAdEventListener(event as AdEventType,callback)};},
 read:()=>AsyncStorage.getItem('qtf:ad-limits'),write:value=>AsyncStorage.setItem('qtf:ad-limits',value),
 unfinished:()=>Object.values(useLearning.getState().data.profiles).some(p=>p.active&&p.active.step!=='summary'),
 playing:async()=>{try{const {state}=await TrackPlayer.getPlaybackState();return [State.Playing,State.Buffering,State.Loading].includes(state);}catch{return false;}},
 paid:value=>paid(value,'session_end'),event:name=>track(name,{placement:'session_end'}),
});
function enabled(value:boolean){useAds.setState({enabled:value});sessionAds.setEnabled(value&&useAds.getState().ready&&ENABLE_INTERSTITIAL_ADS);if(value&&!initializing&&safeScene())void initializeAds();}
async function refreshConfig(){
 if(configFetching||Date.now()-lastConfig<300000)return;configFetching=true;lastConfig=Date.now();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{const response=await fetch(`${API_URL}/api/config`,{signal:controller.signal});if(!response.ok)return;const data=await response.json();if(typeof data.adsEnabled!=='boolean'||!Number.isInteger(data.revision))return;enabled(data.adsEnabled);await AsyncStorage.setItem('qtf:ad-config',JSON.stringify({adsEnabled:data.adsEnabled}));}catch{}finally{clearTimeout(timer);configFetching=false;}
}
function prepareConfig(){
 if(!configReady)configReady=AsyncStorage.getItem('qtf:ad-config').then(raw=>{const data=JSON.parse(raw??'{}');if(typeof data.adsEnabled==='boolean')enabled(data.adsEnabled);}).catch(()=>{});
 return configReady;
}
export function setAdScene(route:string){scene=route;navigation++;sessionAds.setScene(route);if(safeScene()&&useLearning.getState().ready&&useLearning.getState().data.onboarded)void initializeAds();}
export async function initializeAds(){
 if(initializing||!safeScene())return;
 initializing=true;const start=navigation;
 try{
  await prepareConfig();void refreshConfig();
  if(!useAds.getState().enabled||start!==navigation||!safeScene())return;
  if(useAds.getState().ready){sessionAds.setEnabled(ENABLE_INTERSTITIAL_ADS);return;}
  await MobileAds().setRequestConfiguration({maxAdContentRating:MaxAdContentRating.G,tagForChildDirectedTreatment:true,tagForUnderAgeOfConsent:true});
  let consent;
  try{
   await AdsConsent.requestInfoUpdate({tagForUnderAgeOfConsent:true});
   if(start!==navigation||!safeScene())return;
   consent=await AdsConsent.loadAndShowConsentFormIfRequired();
  }catch{consent=await AdsConsent.getConsentInfo();}
  if(!consent.canRequestAds||start!==navigation||!safeScene())return;
  await MobileAds().initialize();useAds.setState({ready:true});sessionAds.setEnabled(useAds.getState().enabled&&ENABLE_INTERSTITIAL_ADS);
 }catch{}finally{initializing=false;}
}
export async function adPrivacyOptions(){
 if(!safeScene())return;
 await AdsConsent.showPrivacyOptionsForm();const info=await AdsConsent.getConsentInfo();
 if(!info.canRequestAds){useAds.setState({ready:false});sessionAds.setEnabled(false);}else void initializeAds();
}
export function sessionCompleted(id:string){void sessionAds.complete(id);}
export async function returningHomeAfterCompletion(){await sessionAds.returnHome();}

// The reproducible Android SDK patch exposes the actual impression callback.
const MeasuredBanner=BannerAd as React.ComponentType<React.ComponentProps<typeof BannerAd>&{onAdImpression?:()=>void}>;
export function LearningBanner(){
 const ready=useAds(s=>s.ready&&s.enabled),{t}=useWords(),{width}=useWindowDimensions();
 const [foreground,setForeground]=useState(AppState.currentState==='active');
 useEffect(()=>{
  sessionAds.setForeground(AppState.currentState==='active');void initializeAds();
  const subscription=AppState.addEventListener('change',state=>{const active=state==='active';setForeground(active);sessionAds.setForeground(active);if(active)void initializeAds();});
  return()=>subscription.remove();
 },[]);
 if(!ready||!foreground||!ENABLE_BANNER_ADS)return null;
 return <View style={{alignItems:'center',paddingTop:8,paddingBottom:12,borderTopWidth:1,borderColor:'#E2E4D8'}}>
  <Label muted style={styles.small}>{t('Advertisement','إعلان')}</Label>
  <MeasuredBanner key={Math.round(width)} unitId={BANNER_AD_UNIT_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={requestOptions}
   onAdLoaded={()=>track('ad_loaded',{placement:'banner'})} onAdFailedToLoad={()=>track('ad_failed',{placement:'banner'})}
   onAdImpression={()=>track('ad_impression',{placement:'banner'})} onPaid={event=>paid(event,'banner')}/>
 </View>;
}
