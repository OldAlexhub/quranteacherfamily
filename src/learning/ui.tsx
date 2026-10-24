import React from 'react';
import {Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle} from 'react-native';
import Svg,{Circle,Path,Rect,G} from 'react-native-svg';
import {useLearning} from './store';
export const palette={paper:'#F8F5ED',ink:'#173E35',muted:'#65776E',green:'#216450',light:'#E8EEE2',gold:'#B47B2E',line:'#E2E4D8',white:'#FFFDF8'};
export function useWords(){const ar=useLearning(s=>s.data.language==='ar');return {ar,t:(en:string,arabic:string)=>ar?arabic:en};}
export function Label({children,style,muted=false}:{children:React.ReactNode;style?:TextStyle|TextStyle[];muted?:boolean}){
 const {ar}=useWords();return <Text style={[styles.text,{textAlign:ar?'right':'left',writingDirection:ar?'rtl':'ltr'},muted&&{color:palette.muted},style]}>{children}</Text>;
}
export function Button({label,onPress,quiet=false,disabled=false}:{label:string;onPress:()=>void;quiet?:boolean;disabled?:boolean}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({pressed})=>[styles.button,quiet&&styles.quiet,pressed&&{opacity:.75},disabled&&{opacity:.45}]}><Label style={{fontSize:16,fontWeight:'700',color:quiet?palette.green:palette.white,textAlign:'center'}}>{label}</Label></Pressable>;
}
export function Card({children,style}:{children:React.ReactNode;style?:ViewStyle}){return <View style={[styles.card,style]}>{children}</View>;}
export function Icon({name,size=24,color=palette.green}:{name:'learn'|'quran'|'progress'|'profile'|'back'|'play'|'check'|'sun';size?:number;color?:string}){
 const paths={learn:'M3 19L8 9l5 6 4-11 4 15M4 21h16',quran:'M12 5v16M12 6C8 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-6-1-10 2',progress:'M5 20v-6m7 6V9m7 11V3',profile:'M7 7a5 5 0 1010 0A5 5 0 007 7M3 22v-2a9 9 0 0118 0v2',back:'M15 4l-8 8 8 8',play:'M7 4l14 8-14 8z',check:'M4 12l5 5L20 6',sun:'M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2'};
 return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d={paths[name]} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none"/>{name==='sun'&&<Circle cx="12" cy="12" r="5" stroke={color} fill="none" strokeWidth="1.8"/>}</Svg>;
}
export function Landscape(){return <Svg width="100%" height={180} viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" accessibilityElementsHidden>
 <Rect width="400" height="180" fill="#E9EBD9"/><Circle cx="302" cy="43" r="23" fill="#E9BE70"/>
 <Path d="M0 100Q70 45 130 87T260 85T400 64V180H0Z" fill="#C5D5B4"/>
 <Path d="M0 132Q90 68 180 126T400 100V180H0Z" fill="#90B397"/>
 <Path d="M0 154Q90 117 198 149T400 131V180H0Z" fill="#497E68"/>
 <Path d="M264 180Q186 151 236 134Q288 115 216 102" fill="none" stroke="#F3E6C4" strokeWidth="16"/>
 <G fill="#2A5A47"><Path d="M49 146V82h3v64M31 117l20-39 21 39zM337 151V94h3v57M320 127l18-39 19 39z"/></G>
 <G fill="#F7F2DF"><Rect x="126" y="89" width="43" height="37" rx="2"/><Path d="M124 89q24-35 47 0z"/><Rect x="176" y="71" width="8" height="55"/><Path d="M174 71l6-13 6 13z"/></G>
 <Path d="M143 126v-17q5-10 10 0v17" fill="#739E82"/><Path d="M78 43q6-6 12 0m0 0q6-6 12 0M191 31q4-4 8 0m0 0q4-4 8 0" stroke="#759282" fill="none" strokeWidth="2"/>
 </Svg>;}
export const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:palette.paper},body:{padding:22,paddingBottom:32,gap:18},text:{fontSize:15,lineHeight:23,color:palette.ink},title:{fontSize:30,lineHeight:38,fontWeight:'700',letterSpacing:-.6},subtitle:{fontSize:20,lineHeight:28,fontWeight:'700'},eyebrow:{fontSize:11,lineHeight:17,letterSpacing:1.6,fontWeight:'700',color:palette.gold},card:{backgroundColor:palette.white,borderRadius:24,padding:22,borderWidth:1,borderColor:palette.line,gap:12},button:{backgroundColor:palette.green,minHeight:54,paddingHorizontal:20,paddingVertical:14,borderRadius:16,justifyContent:'center'},quiet:{backgroundColor:palette.light},row:{flexDirection:'row',alignItems:'center',gap:12},rule:{height:1,backgroundColor:palette.line},input:{borderWidth:1,borderColor:palette.line,borderRadius:14,padding:14,color:palette.ink,backgroundColor:palette.white,fontSize:16},arabic:{fontSize:30,lineHeight:60,textAlign:'right',writingDirection:'rtl',color:palette.ink},badge:{backgroundColor:palette.light,borderRadius:14,padding:10},tab:{flex:1,alignItems:'center',gap:5,paddingVertical:12,minHeight:64},header:{paddingHorizontal:22,paddingVertical:15,flexDirection:'row',alignItems:'center',gap:14},circle:{width:44,height:44,borderRadius:22,backgroundColor:palette.light,alignItems:'center',justifyContent:'center'},link:{minHeight:48,justifyContent:'center',paddingVertical:10},small:{fontSize:12,lineHeight:18},hero:{overflow:'hidden',borderRadius:26,borderWidth:1,borderColor:palette.line,backgroundColor:palette.white},progress:{height:5,borderRadius:4,backgroundColor:palette.line,overflow:'hidden'},notice:{backgroundColor:'#F9E8C6',padding:14,borderRadius:14},
});
