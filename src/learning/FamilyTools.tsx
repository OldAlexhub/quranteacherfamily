import React,{useState} from 'react';
import {Pressable,TextInput,View} from 'react-native';
import {useAssignmentStore} from '../store/useAssignmentStore';
import {useBookmarkStore} from '../store/useBookmarkStore';
import {counts,surahName} from './content';
import {dayKey} from './domain';
import {Button,Card,Label,styles,useWords} from './ui';
export function FamilyTools({id,begin,openSurah}:{id:string;begin:(keys:string[],assignment?:string)=>void;openSurah:(surah:number)=>void}){
 const {ar,t}=useWords(),assignmentMap=useAssignmentStore(s=>s.assignments),bookmarks=useBookmarkStore(s=>s.bookmarks);
 const assignments=assignmentMap[id]??[];
 const [editing,setEditing]=useState(false),[surah,setSurah]=useState('1'),[first,setFirst]=useState('1'),[last,setLast]=useState('3'),[due,setDue]=useState(dayKey()),[error,setError]=useState('');
 return <><Label style={styles.subtitle}>{t('Saved ayahs','الآيات المحفوظة')}</Label>{bookmarks.filter(b=>!b.learnerId||b.learnerId===id).map(b=><Pressable key={b.id} style={styles.link} onPress={()=>openSurah(b.surahNumber)}><Label>{surahName(b.surahNumber,ar)} · {b.ayahNumber}  ›</Label></Pressable>)}<Label style={styles.subtitle}>{t('Family assignments','تكليفات الأسرة')}</Label>
 {assignments.map(a=><Card key={a.id}><Label>{surahName(a.surahNumber,ar)} · {a.startAyah}–{a.endAyah}</Label><Label muted style={styles.small}>{a.status==='completed'?t('Completed','مكتمل'):a.dueDate.slice(0,10)}</Label>{a.parentNote?<Label muted>{a.parentNote}</Label>:null}<Button quiet label={t('Practice assignment','التدرّب على التكليف')} onPress={()=>begin(Array.from({length:a.endAyah-a.startAyah+1},(_,i)=>`${a.surahNumber}:${a.startAyah+i}`),a.id)}/></Card>)}
 <Button quiet label={t('Set a practice assignment','إنشاء تكليف للتدريب')} onPress={()=>setEditing(!editing)}/>
 {editing&&<Card><Label>{t('Surah number','رقم السورة')}</Label><TextInput style={styles.input} keyboardType="number-pad" value={surah} onChangeText={setSurah}/><Label>{t('Ayah range','نطاق الآيات')}</Label><View style={styles.row}><TextInput accessibilityLabel={t('First ayah','أول آية')} style={[styles.input,{flex:1}]} keyboardType="number-pad" value={first} onChangeText={setFirst}/><TextInput accessibilityLabel={t('Last ayah','آخر آية')} style={[styles.input,{flex:1}]} keyboardType="number-pad" value={last} onChangeText={setLast}/></View><Label>{t('Review date (YYYY-MM-DD)','تاريخ المراجعة (YYYY-MM-DD)')}</Label><TextInput style={styles.input} value={due} onChangeText={setDue}/>{error?<Label>{error}</Label>:null}<Button label={t('Save assignment','حفظ التكليف')} onPress={async()=>{const s=Number(surah),a=Number(first),b=Number(last);if(!counts[s]||!Number.isInteger(a)||!Number.isInteger(b)||a<1||b<a||b>counts[s]||!/^\d{4}-\d{2}-\d{2}$/.test(due)||Number.isNaN(Date.parse(due))){setError(t('Check the passage and date.','تحقّق من المقطع والتاريخ.'));return;}await useAssignmentStore.getState().createAssignment({learnerId:id,title:`${s}:${a}-${b}`,type:'memorization_review',surahNumber:s,startAyah:a,endAyah:b,dueDate:due});setEditing(false);setError('');}}/></Card>}
 </>;
}
