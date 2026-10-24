import {SessionAds,type SessionAd} from '../src/learning/sessionAds';
import {revenueProperties} from '../src/learning/adRevenue';
const settle=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
let controllers:SessionAds[]=[];
function setup(saved:unknown={completed:3,ids:[]}){
 let persisted=JSON.stringify(saved);
 const ads:{ad:SessionAd;emit:(event:string,value?:unknown)=>void;callbacks:Map<string,(value?:unknown)=>void>}[]=[];
 const deps={
  create:jest.fn(()=>{const callbacks=new Map<string,(value?:unknown)=>void>();const ad:SessionAd={on:(event,fn)=>{callbacks.set(event,fn);return()=>callbacks.delete(event);},load:jest.fn(),show:jest.fn().mockResolvedValue(undefined)};ads.push({ad,callbacks,emit:(event,value)=>callbacks.get(event)?.(value)});return ad;}),
  read:jest.fn(async()=>persisted),write:jest.fn(async(value:string)=>{persisted=value;}),
  unfinished:jest.fn(()=>false),playing:jest.fn(async()=>false),paid:jest.fn(),event:jest.fn(),
 };
 const controller=new SessionAds(deps);controllers.push(controller);controller.setEnabled(true);
 return {controller,deps,ads,saved:()=>JSON.parse(persisted)};
}
beforeEach(()=>{jest.useFakeTimers();jest.setSystemTime(1_000_000);});
afterEach(()=>{controllers.forEach(c=>c.dispose());controllers=[];jest.useRealTimers();});
test('counts actual displays once, preserves paid values and prevents reuse of the same completion',async()=>{
 const {controller,deps,ads,saved}=setup();await settle();ads[0].emit('loaded');jest.advanceTimersByTime(180000);
 await Promise.all([controller.returnHome(),controller.returnHome()]);expect(ads[0].ad.show).toHaveBeenCalledTimes(1);
 expect(saved().lastShown).toBeUndefined(); // A show request is not an impression.
 ads[0].emit('opened');ads[0].emit('opened');const value={currency:'USD',value:0.000125,precision:1};ads[0].emit('paid',value);await settle();
 expect(deps.event.mock.calls.filter(([name])=>name==='ad_impression')).toHaveLength(1);expect(deps.paid).toHaveBeenCalledWith(value);expect(saved().consumed).toBe(3);
 ads[0].emit('closed');expect(ads[0].callbacks.size).toBe(0);ads[1].emit('loaded');jest.advanceTimersByTime(600000);await controller.returnHome();expect(ads[1].ad.show).not.toHaveBeenCalled();
});
test('deduplicates completion reports while persisted limits are still loading',async()=>{
 const {controller,saved}=setup({completed:2,ids:['old']});await Promise.all([controller.complete('new'),controller.complete('new')]);expect(saved().completed).toBe(3);expect(saved().ids).toEqual(['old','new']);
});
test('late async checks cannot display after navigating into a lesson or returning again',async()=>{
 const {controller,deps,ads}=setup();await settle();ads[0].emit('loaded');jest.advanceTimersByTime(180000);
 let release!:(value:boolean)=>void;deps.playing.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
 const attempt=controller.returnHome();await settle();controller.setScene('lesson');controller.setScene('learn');release(false);await attempt;expect(ads[0].ad.show).not.toHaveBeenCalled();
});
test('mounting the home banner with unchanged foreground state preserves an eligible return',async()=>{
 const {controller,deps,ads}=setup();await settle();ads[0].emit('loaded');jest.advanceTimersByTime(180000);
 let release!:(value:boolean)=>void;deps.playing.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
 const attempt=controller.returnHome();await settle();controller.setForeground(true);release(false);await attempt;expect(ads[0].ad.show).toHaveBeenCalledTimes(1);
});
test('blocks playback, unfinished lessons, background and the remote disable switch',async()=>{
 const {controller,deps,ads}=setup();await settle();ads[0].emit('loaded');jest.advanceTimersByTime(180000);
 deps.playing.mockResolvedValueOnce(true);await controller.returnHome();
 deps.unfinished.mockReturnValueOnce(true);await controller.returnHome();
 controller.setForeground(false);await controller.returnHome();controller.setForeground(true);
 controller.setEnabled(false);await controller.returnHome();expect(ads[0].ad.show).not.toHaveBeenCalled();expect(ads[0].callbacks.size).toBe(0);
});
test('load failures retry with backoff and clean up stale event listeners',async()=>{
 const {ads}=setup();ads[0].emit('error');expect(ads[0].callbacks.size).toBe(0);jest.advanceTimersByTime(29999);expect(ads).toHaveLength(1);jest.advanceTimersByTime(1);expect(ads).toHaveLength(2);
 ads[1].emit('error');jest.advanceTimersByTime(59999);expect(ads).toHaveLength(2);jest.advanceTimersByTime(1);expect(ads).toHaveLength(3);
});
test('expired inventory refreshes, but a late load never triggers an automatic display',async()=>{
 const {controller,ads}=setup();await settle();ads[0].emit('loaded');controller.setScene('lesson');jest.advanceTimersByTime(55*60000);expect(ads).toHaveLength(1);
 controller.setScene('learn');expect(ads).toHaveLength(2);await controller.returnHome();ads[1].emit('loaded');expect(ads[1].ad.show).not.toHaveBeenCalled();expect(ads[0].callbacks.size).toBe(0);
});
test('failed display does not consume the cooldown or the completed-session slot',async()=>{
 const {controller,ads,saved}=setup();await settle();ads[0].emit('loaded');(ads[0].ad.show as jest.Mock).mockRejectedValueOnce(new Error('unavailable'));jest.advanceTimersByTime(180000);await controller.returnHome();expect(saved().consumed).toBeUndefined();expect(saved().lastShown).toBeUndefined();jest.advanceTimersByTime(30000);ads[1].emit('loaded');await controller.returnHome();expect(ads[1].ad.show).toHaveBeenCalledTimes(1);
});
test('normalizes paid currency units once and rejects malformed revenue',()=>{
 expect(revenueProperties({value:0.000125,currency:'USD',precision:1},'banner')).toEqual({placement:'banner',valueMicros:125,currency:'USD',precision:'estimated'});
 for(const value of [NaN,Infinity,-1,1e10])expect(revenueProperties({value,currency:'USD'},'banner')).toBeNull();
 expect(revenueProperties({value:1,currency:'private-data'},'banner')).toBeNull();
});
