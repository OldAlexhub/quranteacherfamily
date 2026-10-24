import {canShowSessionAd} from '../src/learning/adPolicy';
test('interstitial requires explicit completed-session return and every limit',()=>{
 const context={route:'learn',unfinished:false,playing:false,returningHome:true},limits={started:0,lastShown:0,shown:0,completed:3};
 expect(canShowSessionAd(context,limits,700000)).toBe(true);
 for(const patch of [{route:'lesson'},{unfinished:true},{playing:true},{returningHome:false}])expect(canShowSessionAd({...context,...patch},limits,700000)).toBe(false);
 for(const patch of [{completed:2},{completed:0},{shown:3},{lastShown:600000},{started:600000}])expect(canShowSessionAd(context,{...limits,...patch},700000)).toBe(false);
});
