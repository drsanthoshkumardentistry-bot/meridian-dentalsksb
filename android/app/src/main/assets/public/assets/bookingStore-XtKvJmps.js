import{b as $,f as S}from"./firebase-ByXbwHMx.js";import{u as N,d as m,s as w,o as T,q as C,w as M,c as B,g as L}from"./firebase-Dt8q7SXb.js";const E=[{id:"en",label:"English"},{id:"ta",label:"Tamil"},{id:"hi",label:"Hindi"}],G=e=>{const t=String((e==null?void 0:e.language)||"").trim().toLowerCase(),n=E.find(a=>a.id===t||a.label.toLowerCase()===t);return n?n.id:"en"},d=(e,t)=>e.clinicName||t,y={hi:{appointment:e=>`नमस्ते ${e.name},

${d(e,"आपके दंत क्लिनिक")} की ओर से आपके अपॉइंटमेंट की याद दिलाई जा रही है: ${e.sameDay?"आज":"कल"}, ${e.dateTime}${e.doctor?` (${e.doctor} के साथ)`:""}।

कृपया 10 मिनट पहले पहुँचें। समय बदलना हो तो इसी संदेश का जवाब दें।

धन्यवाद।`,payment:e=>`नमस्ते ${e.name},

${d(e,"आपके दंत क्लिनिक")} की ओर से एक विनम्र याद दिलाना: बिल ${e.invoiceId} पर ₹${e.amount} बाकी हैं।

`+(e.upiId?`आप UPI से ${e.upiId} पर भुगतान कर सकते हैं।

`:"")+"यदि आप भुगतान कर चुके हैं तो कृपया इस संदेश को अनदेखा करें। धन्यवाद।",recall:e=>`नमस्ते ${e.name},

${d(e,"हमारे दंत क्लिनिक")} में आपकी पिछली विज़िट को ${e.months} महीने हो गए हैं। नियमित जाँच और सफाई से समस्याएँ जल्दी पकड़ में आती हैं।

समय तय करने के लिए इस संदेश का जवाब दें${e.phone?` या ${e.phone} पर कॉल करें`:""}।

धन्यवाद।`,birthday:e=>`जन्मदिन मुबारक, ${e.firstName}! 🎂

${d(e,"आपके दंत क्लिनिक")} की ओर से आपके स्वस्थ और खुशहाल वर्ष की शुभकामनाएँ।

मुस्कुराते रहिए!`},ta:{appointment:e=>`வணக்கம் ${e.name},

${d(e,"உங்கள் பல் மருத்துவமனை")} சார்பில் உங்கள் அப்பாயின்ட்மெண்ட் நினைவூட்டல்: ${e.sameDay?"இன்று":"நாளை"}, ${e.dateTime}${e.doctor?` (${e.doctor})`:""}.

தயவுசெய்து 10 நிமிடம் முன்னதாக வரவும். நேரத்தை மாற்ற வேண்டுமெனில் இந்தச் செய்திக்குப் பதிலளிக்கவும்.

நன்றி.`,payment:e=>`வணக்கம் ${e.name},

${d(e,"உங்கள் பல் மருத்துவமனை")} சார்பில் ஒரு நினைவூட்டல்: பில் ${e.invoiceId}-ல் ₹${e.amount} நிலுவையில் உள்ளது.

`+(e.upiId?`UPI மூலம் ${e.upiId}-க்கு செலுத்தலாம்.

`:"")+"ஏற்கனவே செலுத்தியிருந்தால் இந்தச் செய்தியைப் புறக்கணிக்கவும். நன்றி.",recall:e=>`வணக்கம் ${e.name},

${d(e,"எங்கள் பல் மருத்துவமனை")}-க்கு நீங்கள் கடைசியாக வந்து ${e.months} மாதங்கள் ஆகிவிட்டன. வழக்கமான பரிசோதனையும் சுத்தம் செய்தலும் பிரச்சினைகளை ஆரம்பத்திலேயே கண்டறிய உதவும்.

நேரம் பதிவு செய்ய இந்தச் செய்திக்குப் பதிலளிக்கவும்${e.phone?` அல்லது ${e.phone} எண்ணில் அழைக்கவும்`:""}.

நன்றி.`,birthday:e=>`பிறந்தநாள் வாழ்த்துகள், ${e.firstName}! 🎂

${d(e,"உங்கள் பல் மருத்துவமனை")} சார்பில் உங்களுக்கு ஆரோக்கியமான, மகிழ்ச்சியான ஆண்டாக அமையட்டும்.

புன்னகையுடன் இருங்கள்!`}},p=(e,t,n)=>{const a=y[t]&&y[t][e];return a?a(n):null},l=e=>String(e).padStart(2,"0"),u=(e=new Date)=>`${e.getFullYear()}-${l(e.getMonth()+1)}-${l(e.getDate())}`,O=(e,t)=>{const n=new Date(e.getFullYear(),e.getMonth(),e.getDate(),12,0,0);return n.setDate(n.getDate()+t),n},g=e=>{let t=String(e||"").replace(/\D/g,"");return t.length===12&&t.startsWith("91")&&(t=t.slice(2)),t.length===11&&t.startsWith("0")&&(t=t.slice(1)),/^[6-9]\d{9}$/.test(t)?`91${t}`:""},K=(e,t)=>{const n=g(e);return n?`https://wa.me/${n}?text=${encodeURIComponent(t)}`:""},D=e=>{const t=/^(\d{1,2}):(\d{2})$/.exec(String(e||""));if(!t)return String(e||"");const n=Number(t[1]);return`${n%12===0?12:n%12}:${t[2]} ${n>=12?"PM":"AM"}`},b=e=>{const t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(e||""));return t?new Date(Number(t[1]),Number(t[2])-1,Number(t[3]),12).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"}):String(e||"")},k=e=>!e||!e.consent||e.consent.whatsapp!==!1,I=(e,t)=>t?k(e.find(n=>String(n.id)===String(t))):!0,P=new Set(["cancelled","canceled","completed","no show","no-show"]),W=(e=[],t=new Date,n=[])=>{const a=u(t),i=u(O(t,1)),s=`${l(t.getHours())}:${l(t.getMinutes())}`,c=[];for(const o of e){if(!o||P.has(String(o.status||"").toLowerCase())||!g(o.phone)||!I(n,o.patientId))continue;const r=o.reminders||{};o.date===i&&!r.dayBefore?c.push({appt:o,kind:"dayBefore"}):o.date===a&&String(o.time||"")>=s&&!r.sameDay&&c.push({appt:o,kind:"sameDay"})}return c.sort((o,r)=>`${o.appt.date} ${o.appt.time}`.localeCompare(`${r.appt.date} ${r.appt.time}`))},j=({clinicName:e,appt:t,kind:n,language:a})=>{const i=p("appointment",a,{clinicName:e,name:t.patientName,sameDay:n==="sameDay",dateTime:`${b(t.date)} ${D(t.time)}`,doctor:t.doctor});if(i)return i;const s=`${n==="sameDay"?"today":"tomorrow"}, ${b(t.date)} at ${D(t.time)}`;return`Hello ${t.patientName},

This is a reminder from ${e||"your dental clinic"} about your appointment ${s}${t.doctor?` with ${t.doctor}`:""}${t.procedure?` (${t.procedure})`:""}.

Please arrive 10 minutes early. If you need to reschedule, just reply to this message.

Thank you.`},z=(e=[],t=[],n=new Date,a=3)=>{const i=new Map(t.map(o=>[String(o.id),o])),s=n.getTime()-a*24*60*60*1e3,c=[];for(const o of e){if(!o||$(o)<=0)continue;const r=(i.get(String(o.patientId))||{}).phone||o.phone||"";g(r)&&I(t,o.patientId)&&(o.lastReminderAt&&new Date(o.lastReminderAt).getTime()>s||c.push({inv:o,phone:r}))}return c},J=({clinicName:e,inv:t,upiId:n,language:a})=>p("payment",a,{clinicName:e,name:t.patient,invoiceId:t.id,amount:S($(t)),upiId:n})||`Hello ${t.patient},

A gentle reminder from ${e||"your dental clinic"}: ₹${S($(t))} is pending on invoice ${t.id}.

`+(n?`You can pay by UPI to ${n}.

`:"")+"If you have already paid, please ignore this message. Thank you.",Q=(e,t,n=new Date)=>({...e,reminders:{...e.reminders||{},[t]:n.toISOString()}}),X=(e,t=new Date)=>({...e,lastReminderAt:t.toISOString()}),x=[3,6,12],F=6,h=e=>{const t=String(e||"").trim();let n=/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);return n?new Date(Number(n[1]),Number(n[2])-1,Number(n[3]),12):(n=/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t),n?new Date(Number(n[3]),Number(n[2])-1,Number(n[1]),12):null)},U=(e,t)=>{let n=(t.getFullYear()-e.getFullYear())*12+(t.getMonth()-e.getMonth());return t.getDate()<e.getDate()&&(n-=1),n},q=(e,t=[],n=[],a=new Date)=>{const i=new Date(a.getFullYear(),a.getMonth(),a.getDate(),23,59,59);let s=null;const c=o=>{o&&o<=i&&(!s||o>s)&&(s=o)};for(const o of t){if(String(o.patientId)!==String(e.id))continue;const r=String(o.status||"").toLowerCase();r==="cancelled"||r==="canceled"||r==="no show"||r==="no-show"||c(h(o.date))}for(const o of n)String(o.patientId)===String(e.id)&&c(h(o.date));return s||c(h(e.registeredDate)),s},H=(e,t,n)=>{const a=u(n);return t.some(i=>{if(String(i.patientId)!==String(e.id))return!1;const s=String(i.status||"").toLowerCase();return s==="cancelled"||s==="canceled"?!1:String(i.date||"")>=a})},Z=(e=[],t=[],n=[],a=new Date,i=30)=>{const s=a.getTime()-i*24*60*60*1e3,c=[];for(const o of e){if(!o||!g(o.phone)||!k(o)||o.lastRecallAt&&new Date(o.lastRecallAt).getTime()>s||H(o,t,a))continue;const r=q(o,t,n,a);if(!r)continue;const f=U(r,a),A=x.includes(Number(o.recallMonths))?Number(o.recallMonths):F;f>=A&&c.push({patient:o,lastVisit:r,months:f})}return c.sort((o,r)=>o.lastVisit-r.lastVisit)},v=({clinicName:e,clinicPhone:t,patient:n,months:a,language:i})=>p("recall",i,{clinicName:e,phone:t,name:n.name,months:a})||`Hello ${n.name},

It has been ${a} months since your last visit to ${e||"our dental clinic"}. A routine check-up and cleaning helps catch problems early.

Reply to this message${t?` or call ${t}`:""} to book a convenient time.

Thank you.`,ee=(e,t=new Date)=>({...e,lastRecallAt:t.toISOString()}),R=["Check-up and consultation","Scaling and polishing","Tooth pain","Filling","Root canal","Braces enquiry","Other"],te=(e,t)=>`${String(e).replace(/\/$/,"")}/?book=${encodeURIComponent(t)}`,ne=(e={},t,n={})=>({clinicId:t,enabled:!!n.enabled,name:String(e.name||"").slice(0,80),address:String(e.address||"").slice(0,200),phone:String(e.phone||"").slice(0,20),doctor:String(e.drName||"").slice(0,80),services:R}),oe=(e={},t=new Date)=>{const n=String(e.name||"").trim(),a=String(e.phone||"").replace(/\D/g,"").slice(-10);return n?n.length>80?{ok:!1,error:"Name is too long"}:/^[6-9]\d{9}$/.test(a)?!/^\d{4}-\d{2}-\d{2}$/.test(e.date||"")||e.date<u(t)?{ok:!1,error:"Choose today or a later date"}:["Morning","Afternoon","Evening"].includes(e.slot)?{ok:!0,request:{name:n,phone:a,date:e.date,slot:e.slot,service:R.includes(e.service)?e.service:"Other",note:String(e.note||"").trim().slice(0,300)}}:{ok:!1,error:"Choose a time of day"}:{ok:!1,error:"Enter a valid 10-digit mobile number"}:{ok:!1,error:"Enter your name"}},ae=(e,t,n=new Date)=>({...e,clinicId:t,status:"new",createdAt:n.toISOString()}),V={Morning:"10:00",Afternoon:"14:00",Evening:"17:30"},se=(e,{newId:t,doctor:n,chair:a,patients:i=[]})=>{const s=i.find(o=>String(o.phone||"").replace(/\D/g,"").slice(-10)===e.phone);return{patient:s||null,appointment:{id:t("APT"),patientId:s?s.id:"",patientName:e.name,phone:e.phone,date:e.date,time:V[e.slot]||"10:00",chair:a,doctor:n,procedure:e.service,status:"Confirmed",source:"online"}}},ie=async(e,t)=>{const n=await L(m(e,"bookingPages",t));return n.exists()?n.data():null},re=(e,t,n)=>w(m(e,"bookingPages",t),n),ce=(e,t,n)=>w(m(e,"bookingRequests",t),n),de=(e,t,n,a)=>T(C(B(e,"bookingRequests"),M("clinicId","==",t)),i=>n(i.docs.map(s=>({...s.data(),id:s.id}))),a),le=(e,t,n)=>N(m(e,"bookingRequests",t),{status:n,handledAt:new Date().toISOString()});export{oe as A,R as B,ae as C,F as D,ce as E,ie as F,x as R,K as a,b,O as c,u as d,H as e,D as f,W as g,k as h,Z as i,z as j,te as k,p as l,le as m,j as n,G as o,h as p,Q as q,se as r,J as s,X as t,v as u,ee as v,g as w,re as x,ne as y,de as z};
