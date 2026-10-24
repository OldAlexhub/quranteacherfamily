import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLearning} from '../src/learning/store';
test('analytics defaults on for a new installation and preserves a stored opt-out',async()=>{
 expect(useLearning.getState().data.analytics).toBe(true);
 await AsyncStorage.setItem('qtf:learning',JSON.stringify({...useLearning.getState().data,analytics:false}));
 await useLearning.getState().load();
 expect(useLearning.getState().data.analytics).toBe(false);
});
