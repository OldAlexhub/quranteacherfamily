export function revenueProperties(value:unknown,placement:'banner'|'session_end'){
 if(!value||typeof value!=='object')return null;
 const event=value as {value?:unknown;currency?:unknown;precision?:unknown};
 // The installed RN bridge converts native micros into currency units.
 if(typeof event.value!=='number'||!Number.isFinite(event.value)||event.value<0||typeof event.currency!=='string'||!/^[A-Z]{3}$/.test(event.currency))return null;
 const valueMicros=Math.round(event.value*1e6);if(!Number.isSafeInteger(valueMicros)||valueMicros>1e12)return null;
 return {placement,currency:event.currency,valueMicros,precision:({0:'unknown',1:'estimated',2:'publisher_provided',3:'precise'} as Record<string,string>)[String(event.precision)]??'unknown'};
}
