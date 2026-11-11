import{_ as et,C as st,v as B,S as nt,F as at,x as rt,y as it,z as ot,A as j,B as ct,D as lt,E as q,G as ut,H as dt,I as ht,J as pt,K as mt,L as _t,M as ft,N as gt,O as bt,P as Rt,Q as Pt,R as Tt,U as It,V as Et,W as yt}from"./firebase-Dt8q7SXb.js";const At=[{id:"therapeutic",label:"Therapeutic (GST exempt)",rate:0},{id:"cosmetic",label:"Cosmetic / aesthetic (GST 18%)",rate:18}],C=t=>{const e=typeof t=="number"?t:parseFloat(String(t).replace(/,/g,""));return Number.isFinite(e)?Math.round(e*100):0},b=t=>(t/100).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}),kt=t=>{const e=At.find(s=>s.id===t);return e?e.rate:0},ce=20,xt=(t,e)=>{const s=e.reduce((r,o)=>r+o,0);if(t<=0||s<=0)return e.map(()=>0);const n=e.map(r=>t*r/s),a=n.map(Math.floor);let i=t-a.reduce((r,o)=>r+o,0);const c=n.map((r,o)=>({i:o,frac:r-Math.floor(r)})).sort((r,o)=>o.frac-r.frac||r.i-o.i);for(let r=0;i>0&&r<c.length;r+=1,i-=1)a[c[r].i]+=1;return a},le=({items:t=[],discount:e=0})=>{const s=t.map(u=>({description:String(u.description||"").trim(),taxCategory:u.taxCategory||"therapeutic",amountP:Math.max(0,C(u.amount))})),n=s.reduce((u,d)=>u+d.amountP,0),a=Math.min(n,Math.max(0,C(e))),i=xt(a,s.map(u=>u.amountP)),c=s.map((u,d)=>{const h=u.amountP-i[d],T=kt(u.taxCategory),_=Math.round(h*T/100),E=Math.floor(_/2);return{...u,discountP:i[d],taxableP:h,gstRate:T,taxP:_,cgstP:E,sgstP:_-E,totalP:h+_}}),r=u=>c.reduce((d,h)=>d+h[u],0),o=r("taxableP"),l=c.filter(u=>u.gstRate>0).reduce((u,d)=>u+d.taxableP,0);return{lines:c,subtotalP:n,discountP:a,taxableP:o,exemptP:o-l,taxableGstP:l,gstRate:c.reduce((u,d)=>Math.max(u,d.gstRate),0),cgstP:r("cgstP"),sgstP:r("sgstP"),taxP:r("taxP"),totalP:r("totalP")}},wt=t=>Array.isArray(t.lines)&&t.lines.length>0?t.lines:[{description:t.treatment||"",taxCategory:t.taxCategory||"therapeutic",amountP:t.subtotalP||0,discountP:t.discountP||0,taxableP:t.taxableP||0,gstRate:t.gstRate||0,taxP:t.taxP||0,cgstP:t.cgstP||0,sgstP:t.sgstP||0,totalP:t.totalP||0}],Nt=(t=new Date)=>{const e=t.getFullYear(),s=t.getMonth()>=3?e:e-1;return`${s}-${String(s+1).slice(-2)}`},ue=(t=[],e=new Date)=>{const n=`INV/${Nt(e)}/`;let a=0;for(const i of t)if(i&&typeof i.id=="string"&&i.id.startsWith(n)){const c=parseInt(i.id.slice(n.length),10);Number.isFinite(c)&&c>a&&(a=c)}return`${n}${String(a+1).padStart(4,"0")}`},de=t=>{if(!t)return t;if(typeof t.totalP=="number")return{...t,payments:t.payments||[]};const e=C(t.rawAmount??t.total??0),s=t.status==="Self-Pay Completed"||t.status==="Claim Settled";return{...t,subtotalP:e,discountP:0,taxableP:e,gstRate:0,cgstP:0,sgstP:0,taxP:0,totalP:e,taxCategory:"therapeutic",payments:s&&e>0?[{date:t.date||"",mode:t.paymentMode||"Cash",amountP:e}]:[]}},V=t=>(t.payments||[]).reduce((e,s)=>e+(s.amountP||0),0),Y=t=>Math.max(0,(t.totalP||0)-V(t)),he=t=>{const e=V(t);return(t.totalP||0)>0&&e>=t.totalP?"Paid":e>0?"Part paid":"Unpaid"},pe=(t,{amount:e,mode:s="Cash",date:n=new Date().toLocaleDateString("en-IN")})=>{const a=C(e);return a<=0?{ok:!1,error:"Enter an amount greater than zero"}:a>Y(t)?{ok:!1,error:"Payment is more than the balance due"}:{ok:!0,invoice:{...t,payments:[...t.payments||[],{date:n,mode:s,amountP:a}]}}},me=t=>/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(String(t||"").trim()),_e=({vpa:t,name:e,amountP:s,note:n})=>{const a=new URLSearchParams;return a.set("pa",String(t).trim()),e&&a.set("pn",e),s>0&&a.set("am",(s/100).toFixed(2)),a.set("cu","INR"),n&&a.set("tn",n),`upi://pay?${a.toString()}`},p=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),fe=(t,e={},{receipt:s=!1}={})=>{const n=V(t),a=Y(t),i=t.gstRate>0?`<tr><td>CGST @ ${t.gstRate/2}%</td><td class="r">₹${b(t.cgstP)}</td></tr>
         <tr><td>SGST @ ${t.gstRate/2}%</td><td class="r">₹${b(t.sgstP)}</td></tr>`:'<tr><td>GST</td><td class="r">Exempt (therapeutic dental service)</td></tr>',c=wt(t),r=c.length>1?`<h2>Treatments</h2><table>${c.map(l=>`<tr><td>${p(l.description)}</td><td class="muted">${l.gstRate>0?`GST ${l.gstRate}%`:"GST exempt"}</td><td class="r">₹${b(l.amountP)}</td></tr>`).join("")}</table>`:`<h2>Treatment</h2><div>${p(t.treatment)}</div>`,o=(t.payments||[]).map(l=>`<tr><td>${p(l.date)} · ${p(l.mode)}</td><td class="r">₹${b(l.amountP)}</td></tr>`).join("");return`<!doctype html><html><head><meta charset="utf-8"><title>${s?"Receipt":"Invoice"} ${p(t.id)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:32px;font-size:13px}
h1{font-size:20px;margin:0;color:#1d4ed8}h2{font-size:15px;margin:20px 0 6px}
.muted{color:#64748b}.head{display:flex;justify-content:space-between;border-bottom:2px solid #1d4ed8;padding-bottom:12px}
table{width:100%;border-collapse:collapse;margin-top:8px}td{padding:6px 0;border-bottom:1px solid #e2e8f0}.r{text-align:right}
.total td{font-weight:bold;font-size:15px;border-top:2px solid #0f172a}.badge{display:inline-block;padding:2px 10px;border:1px solid #1d4ed8;color:#1d4ed8;border-radius:99px;font-size:11px}
@media print{body{margin:12mm}}
</style></head><body>
<div class="head"><div><h1>${p(e.name||"Dental Clinic")}</h1>
<div class="muted">${p(e.tagline||"")}</div><div class="muted">${p(e.address||"")}</div>
<div class="muted">${p(e.phone||"")} ${e.email?"· "+p(e.email):""}</div>
${e.regNumber?`<div class="muted">Reg: ${p(e.regNumber)}</div>`:""}</div>
<div class="r"><div class="badge">${s?"PAYMENT RECEIPT":"TAX INVOICE"}</div>
<div><b>${p(t.id)}</b></div><div class="muted">${p(t.date)}</div></div></div>
<h2>Billed to</h2><div><b>${p(t.patient)}</b></div>
${r}
<table>
<tr><td>Amount</td><td class="r">₹${b(t.subtotalP)}</td></tr>
${t.discountP>0?`<tr><td>Discount</td><td class="r">− ₹${b(t.discountP)}</td></tr>`:""}
<tr><td>Taxable value</td><td class="r">₹${b(t.taxableP)}</td></tr>
${i}
<tr class="total"><td>Total</td><td class="r">₹${b(t.totalP)}</td></tr>
</table>
<h2>Payments received</h2>
<table>${o||'<tr><td class="muted">No payments yet</td><td></td></tr>'}
<tr><td><b>Paid</b></td><td class="r"><b>₹${b(n)}</b></td></tr>
<tr><td><b>Balance due</b></td><td class="r"><b>₹${b(a)}</b></td></tr></table>
<p class="muted" style="margin-top:28px">Computer generated by MeriDent. Therapeutic dental services are exempt from GST; cosmetic services attract 18% GST.</p>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const X="firebasestorage.googleapis.com",Ot="storageBucket",Dt=2*60*1e3,Ct=10*60*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class P extends at{constructor(e,s,n=0){super(F(e),`Firebase Storage: ${s} (${F(e)})`),this.status_=n,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,P.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return F(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var R;(function(t){t.UNKNOWN="unknown",t.OBJECT_NOT_FOUND="object-not-found",t.BUCKET_NOT_FOUND="bucket-not-found",t.PROJECT_NOT_FOUND="project-not-found",t.QUOTA_EXCEEDED="quota-exceeded",t.UNAUTHENTICATED="unauthenticated",t.UNAUTHORIZED="unauthorized",t.UNAUTHORIZED_APP="unauthorized-app",t.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",t.INVALID_CHECKSUM="invalid-checksum",t.CANCELED="canceled",t.INVALID_EVENT_NAME="invalid-event-name",t.INVALID_URL="invalid-url",t.INVALID_DEFAULT_BUCKET="invalid-default-bucket",t.NO_DEFAULT_BUCKET="no-default-bucket",t.CANNOT_SLICE_BLOB="cannot-slice-blob",t.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",t.NO_DOWNLOAD_URL="no-download-url",t.INVALID_ARGUMENT="invalid-argument",t.INVALID_ARGUMENT_COUNT="invalid-argument-count",t.APP_DELETED="app-deleted",t.INVALID_ROOT_OPERATION="invalid-root-operation",t.INVALID_FORMAT="invalid-format",t.INTERNAL_ERROR="internal-error",t.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(R||(R={}));function F(t){return"storage/"+t}function Ut(){const t="An unknown error occurred, please check the error payload for server response.";return new P(R.UNKNOWN,t)}function vt(){return new P(R.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function St(){return new P(R.CANCELED,"User canceled the upload/download.")}function $t(t){return new P(R.INVALID_URL,"Invalid URL '"+t+"'.")}function Mt(t){return new P(R.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+t+"'.")}function G(t){return new P(R.INVALID_ARGUMENT,t)}function Z(){return new P(R.APP_DELETED,"The Firebase app was deleted.")}function Ft(t){return new P(R.INVALID_ROOT_OPERATION,"The operation '"+t+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class g{constructor(e,s){this.bucket=e,this.path_=s}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,s){let n;try{n=g.makeFromUrl(e,s)}catch{return new g(e,"")}if(n.path==="")return n;throw Mt(e)}static makeFromUrl(e,s){let n=null;const a="([A-Za-z0-9.\\-_]+)";function i(f){f.path.charAt(f.path.length-1)==="/"&&(f.path_=f.path_.slice(0,-1))}const c="(/(.*))?$",r=new RegExp("^gs://"+a+c,"i"),o={bucket:1,path:3};function l(f){f.path_=decodeURIComponent(f.path)}const u="v[A-Za-z0-9_]+",d=s.replace(/[.]/g,"\\."),h="(/([^?#]*).*)?$",T=new RegExp(`^https?://${d}/${u}/b/${a}/o${h}`,"i"),_={bucket:1,path:3},E=s===X?"(?:storage.googleapis.com|storage.cloud.google.com)":s,m="([^?#]*)",N=new RegExp(`^https?://${E}/${a}/${m}`,"i"),y=[{regex:r,indices:o,postModify:i},{regex:T,indices:_,postModify:l},{regex:N,indices:{bucket:1,path:2},postModify:l}];for(let f=0;f<y.length;f++){const O=y[f],$=O.regex.exec(e);if($){const tt=$[O.indices.bucket];let M=$[O.indices.path];M||(M=""),n=new g(tt,M),O.postModify(n);break}}if(n==null)throw $t(e);return n}}class Lt{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vt(t,e,s){let n=1,a=null,i=null,c=!1,r=0;function o(){return r===2}let l=!1;function u(...m){l||(l=!0,e.apply(null,m))}function d(m){a=setTimeout(()=>{a=null,t(T,o())},m)}function h(){i&&clearTimeout(i)}function T(m,...N){if(l){h();return}if(m){h(),u.call(null,m,...N);return}if(o()||c){h(),u.call(null,m,...N);return}n<64&&(n*=2);let y;r===1?(r=2,y=0):y=(n+Math.random())*1e3,d(y)}let _=!1;function E(m){_||(_=!0,h(),!l&&(a!==null?(m||(r=2),clearTimeout(a),d(0)):m||(r=1)))}return d(0),i=setTimeout(()=>{c=!0,E(!0)},s),E}function Bt(t){t(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gt(t){return t!==void 0}function H(t,e,s,n){if(n<e)throw G(`Invalid value for '${t}'. Expected ${e} or greater.`);if(n>s)throw G(`Invalid value for '${t}'. Expected ${s} or less.`)}function Ht(t){const e=encodeURIComponent;let s="?";for(const n in t)if(t.hasOwnProperty(n)){const a=e(n)+"="+e(t[n]);s=s+a+"&"}return s=s.slice(0,-1),s}var U;(function(t){t[t.NO_ERROR=0]="NO_ERROR",t[t.NETWORK_ERROR=1]="NETWORK_ERROR",t[t.ABORT=2]="ABORT"})(U||(U={}));/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zt(t,e){const s=t>=500&&t<600,a=[408,429].indexOf(t)!==-1,i=e.indexOf(t)!==-1;return s||a||i}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wt{constructor(e,s,n,a,i,c,r,o,l,u,d,h=!0){this.url_=e,this.method_=s,this.headers_=n,this.body_=a,this.successCodes_=i,this.additionalRetryCodes_=c,this.callback_=r,this.errorCallback_=o,this.timeout_=l,this.progressCallback_=u,this.connectionFactory_=d,this.retry=h,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((T,_)=>{this.resolve_=T,this.reject_=_,this.start_()})}start_(){const e=(n,a)=>{if(a){n(!1,new D(!1,null,!0));return}const i=this.connectionFactory_();this.pendingConnection_=i;const c=r=>{const o=r.loaded,l=r.lengthComputable?r.total:-1;this.progressCallback_!==null&&this.progressCallback_(o,l)};this.progressCallback_!==null&&i.addUploadProgressListener(c),i.send(this.url_,this.method_,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&i.removeUploadProgressListener(c),this.pendingConnection_=null;const r=i.getErrorCode()===U.NO_ERROR,o=i.getStatus();if(!r||zt(o,this.additionalRetryCodes_)&&this.retry){const u=i.getErrorCode()===U.ABORT;n(!1,new D(!1,null,u));return}const l=this.successCodes_.indexOf(o)!==-1;n(!0,new D(l,i))})},s=(n,a)=>{const i=this.resolve_,c=this.reject_,r=a.connection;if(a.wasSuccessCode)try{const o=this.callback_(r,r.getResponse());Gt(o)?i(o):i()}catch(o){c(o)}else if(r!==null){const o=Ut();o.serverResponse=r.getErrorText(),this.errorCallback_?c(this.errorCallback_(r,o)):c(o)}else if(a.canceled){const o=this.appDelete_?Z():St();c(o)}else{const o=vt();c(o)}};this.canceled_?s(!1,new D(!1,null,!0)):this.backoffId_=Vt(e,s,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,this.backoffId_!==null&&Bt(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class D{constructor(e,s,n){this.wasSuccessCode=e,this.connection=s,this.canceled=!!n}}function Kt(t,e){e!==null&&e.length>0&&(t.Authorization="Firebase "+e)}function jt(t,e){t["X-Firebase-Storage-Version"]="webjs/"+(e??"AppManager")}function qt(t,e){e&&(t["X-Firebase-GMPID"]=e)}function Yt(t,e){e!==null&&(t["X-Firebase-AppCheck"]=e)}function Xt(t,e,s,n,a,i,c=!0){const r=Ht(t.urlParams),o=t.url+r,l=Object.assign({},t.headers);return qt(l,e),Kt(l,s),jt(l,i),Yt(l,n),new Wt(o,t.method,l,t.body,t.successCodes,t.additionalRetryCodes,t.handler,t.errorHandler,t.timeout,t.progressCallback,a,c)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zt(t){if(t.length===0)return null;const e=t.lastIndexOf("/");return e===-1?"":t.slice(0,e)}function Jt(t){const e=t.lastIndexOf("/",t.length-2);return e===-1?t:t.slice(e+1)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class v{constructor(e,s){this._service=e,s instanceof g?this._location=s:this._location=g.makeFromUrl(s,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,s){return new v(e,s)}get root(){const e=new g(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return Jt(this._location.path)}get storage(){return this._service}get parent(){const e=Zt(this._location.path);if(e===null)return null;const s=new g(this._location.bucket,e);return new v(this._service,s)}_throwIfRoot(e){if(this._location.path==="")throw Ft(e)}}function z(t,e){const s=e==null?void 0:e[Ot];return s==null?null:g.makeFromBucketSpec(s,t)}function Qt(t,e,s,n={}){t.host=`${e}:${s}`,t._protocol="http";const{mockUserToken:a}=n;a&&(t._overrideAuthToken=typeof a=="string"?a:ct(a,t.app.options.projectId))}class te{constructor(e,s,n,a,i){this.app=e,this._authProvider=s,this._appCheckProvider=n,this._url=a,this._firebaseVersion=i,this._bucket=null,this._host=X,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=Dt,this._maxUploadRetryTime=Ct,this._requests=new Set,a!=null?this._bucket=g.makeFromBucketSpec(a,this._host):this._bucket=z(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,this._url!=null?this._bucket=g.makeFromBucketSpec(this._url,e):this._bucket=z(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){H("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){H("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const s=await e.getToken();if(s!==null)return s.accessToken}return null}async _getAppCheckToken(){const e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new v(this,e)}_makeRequest(e,s,n,a,i=!0){if(this._deleted)return new Lt(Z());{const c=Xt(e,this._appId,n,a,s,this._firebaseVersion,i);return this._requests.add(c),c.getPromise().then(()=>this._requests.delete(c),()=>this._requests.delete(c)),c}}async makeRequestWithTokens(e,s){const[n,a]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,s,n,a).getPromise()}}const W="@firebase/storage",K="0.13.2";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const J="storage";function ee(t=j(),e){t=rt(t);const n=it(t,J).getImmediate({identifier:e}),a=ot("storage");return a&&se(n,...a),n}function se(t,e,s,n={}){Qt(t,e,s,n)}function ne(t,{instanceIdentifier:e}){const s=t.getProvider("app").getImmediate(),n=t.getProvider("auth-internal"),a=t.getProvider("app-check-internal");return new te(s,n,a,e,nt)}function ae(){et(new st(J,ne,"PUBLIC").setMultipleInstances(!0)),B(W,K,""),B(W,K,"esm2017")}ae();const re={},A=re,w={apiKey:A.VITE_FIREBASE_API_KEY,authDomain:A.VITE_FIREBASE_AUTH_DOMAIN,projectId:A.VITE_FIREBASE_PROJECT_ID,storageBucket:A.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:A.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:A.VITE_FIREBASE_APP_ID},ie=!!(w.apiKey&&w.authDomain&&w.projectId&&w.appId);let x=null,I=null,L=null,S=null;if(ie){x=ut().length?j():dt(w),I=ht(x);try{L=pt(x,{localCache:mt({tabManager:_t()})})}catch{L=ft(x)}ee(x),S=new gt,S.setCustomParameters({prompt:"select_account"})}const ge=I,be=L,k=()=>{if(!I)throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* environment variables.");return I},Re=async()=>{const t=k();try{return(await Rt(t,S)).user}catch(e){if(e&&(e.code==="auth/popup-blocked"||e.code==="auth/operation-not-supported-in-this-environment"))return await Pt(t,S),null;throw e}},Pe=async()=>{if(!I)return null;const t=await yt(I);return t?t.user:null},Te=async(t,e)=>(await Tt(k(),t,e)).user,Ie=async(t,e,s)=>{const n=await It(k(),e,s);if(t)try{await Et(n.user,{displayName:t})}catch{}return await q(n.user),n.user},Ee=async()=>{const t=k().currentUser;if(!t)throw new Error("Please sign in again.");await q(t)},ye=async()=>{const t=k().currentUser;return t?(await t.reload(),t.emailVerified&&await t.getIdToken(!0),!!t.emailVerified):!1},Ae=async t=>{await lt(k(),t)},ke=async()=>{I&&await bt(I)};export{ce as M,At as T,V as a,Y as b,me as c,_e as d,be as e,b as f,le as g,ye as h,wt as i,ue as j,pe as k,ke as l,fe as m,de as n,ge as o,he as p,ie as q,Ee as r,Ae as s,C as t,Re as u,Te as v,Ie as w,Pe as x};
