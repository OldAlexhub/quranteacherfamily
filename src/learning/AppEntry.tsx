import React,{useEffect,useState} from 'react';
import {StatusBar,Text,View,Pressable} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {track,flushTelemetry} from './telemetry';
import {LearningApp} from './LearningApp';
import {useLearning} from './store';
import {useBookmarkStore} from '../store/useBookmarkStore';
import {useAssignmentStore} from '../store/useAssignmentStore';
export default function App(){
 const [error,setError]=useState(false);
 const load=()=>{setError(false);useLearning.getState().load().then(()=>track('app_open')).catch(()=>setError(true));useBookmarkStore.getState().loadBookmarks();useAssignmentStore.getState().loadAssignments();};
 useEffect(load,[]);
 useEffect(()=>{const timer=setInterval(flushTelemetry,60000);return()=>clearInterval(timer);},[]);
 return <SafeAreaProvider><StatusBar barStyle="dark-content" backgroundColor="#F8F5ED"/>{error?<View style={{flex:1,justifyContent:'center',padding:30}}><Text>We couldn’t open your saved learning data. Your original data is preserved.</Text><Pressable onPress={load}><Text style={{padding:20}}>Try again · حاول مجددًا</Text></Pressable></View>:<LearningApp/>}</SafeAreaProvider>;
}
