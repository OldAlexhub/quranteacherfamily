import {INTERSTITIAL_MIN_INTERVAL_MS,INTERSTITIAL_MAX_PER_SESSION,INTERSTITIAL_MIN_SESSION_DURATION_MS,INTERSTITIAL_EVENTS_REQUIRED} from '../config/adsConfig';
export interface AdContext{route:string;unfinished:boolean;playing:boolean;returningHome:boolean}
export interface AdLimits{started:number;lastShown:number;shown:number;completed:number}
export function canShowSessionAd(context:AdContext,limits:AdLimits,now:number){
 return context.route==='learn'&&context.returningHome&&!context.unfinished&&!context.playing&&limits.completed>0&&limits.completed%INTERSTITIAL_EVENTS_REQUIRED===0&&limits.shown<INTERSTITIAL_MAX_PER_SESSION&&now-limits.started>=INTERSTITIAL_MIN_SESSION_DURATION_MS&&now-limits.lastShown>=INTERSTITIAL_MIN_INTERVAL_MS;
}
