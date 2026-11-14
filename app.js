import {initializeApp} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,addDoc,setDoc,updateDoc,deleteDoc,onSnapshot,query,orderBy,serverTimestamp,arrayUnion,getDoc} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";
const $=id=>document.getElementById(id),ready=!firebaseConfig.apiKey.startsWith("在此填入");
let app,auth,db,user=null,tripId=null,tripInfo=null,trips=[],saved=[],budget={budgetJPY:0,rate:.22},unsubs=[],map=null,markers=[],picked=null;
const centers={東京:[35.6812,139.7671],京都:[35.0116,135.7681],大阪:[34.6937,135.5023],其他:[35.6812,139.7671]};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const yen=n=>"¥"+Number(n||0).toLocaleString("ja-JP"),gmap=q=>"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q);
function status(t){$("syncStatus").textContent=t}
function clearSubs(){unsubs.forEach(f=>f());unsubs=[]}
function stopTrip(){clearSubs();tripId=null;tripInfo=null;$("appArea").classList.add("hidden");$("authBox").classList.remove("hidden")}
function init(){
 if(!ready){$("loginBtn").disabled=true;$("authMessage").textContent="請先編輯 firebase-config.js 填入 Firebase Web App 設定。";return}
 app=initializeApp(firebaseConfig);auth=getAuth(app);
 try{db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})})}catch(e){console.warn(e);db=initializeFirestore(app)}
 onAuthStateChanged(auth,async u=>{
  user=u;$("loginBtn").classList.toggle("hidden",!!u);$("logoutBtn").classList.toggle("hidden",!u);$("userInfo").classList.toggle("hidden",!u);$("createTrip").disabled=!u;$("openTrip").disabled=!u;
  if(!u){stopTrip();status("尚未登入");return}
  $("userName").textContent=u.displayName||"Google 使用者";$("userEmail").textContent=u.email||"";$("myUid").textContent=u.uid;$("profileInfo").innerHTML=`<div>${esc(u.displayName||"")}</div><div class="uid">${esc(u.uid)}</div>`;
  const id=new URL(location.href).searchParams.get("trip")||localStorage.getItem("jtp_trip");if(id)openTrip(id,false);else status("已登入");
 });
}
$("loginBtn").onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){$("authMessage").textContent="登入失敗："+e.message}};
$("logoutBtn").onclick=()=>signOut(auth);
$("copyUid").onclick=()=>navigator.clipboard.writeText(user.uid).then(()=>$("authMessage").textContent="UID 已複製");
$("createTrip").onclick=async()=>{try{const r=await addDoc(collection(db,"trips"),{title:"日本自由行（東京・京都・大阪）",ownerId:user.uid,members:[user.uid],createdAt:serverTimestamp()});openTrip(r.id,true)}catch(e){alert(e.message)}};
$("openTrip").onclick=()=>openTrip($("joinTripId").value.trim(),true);
async function openTrip(id,announce=true){
 if(!id||!user)return;clearSubs();tripId=id;localStorage.setItem("jtp_trip",id);
 try{const s=await getDoc(doc(db,"trips",id));if(!s.exists())throw Error("旅程不存在，或你尚未被擁有者加入。");tripInfo=s.data();if(!tripInfo.members?.includes(user.uid))throw Error("你尚未加入此旅程，請先將 UID 傳給擁有者。");
 $("authBox").classList.add("hidden");$("appArea").classList.remove("hidden");$("tripTitle").textContent=tripInfo.title;$("tripMeta").textContent="旅程 ID："+id+"｜"+(tripInfo.ownerId===user.uid?"擁有者":"共同編輯者");
 watchTrip();if(announce)$("authMessage").textContent="旅程已開啟";
 }catch(e){$("authMessage").textContent=e.message;status("無法開啟旅程")}
}
function watchTrip(){
 const root=doc(db,"trips",tripId);
 unsubs.push(onSnapshot(root,{includeMetadataChanges:true},s=>{if(!s.exists())return;tripInfo=s.data();$("tripTitle").textContent=tripInfo.title;$("tripMeta").textContent="旅程 ID："+tripId+"｜"+(tripInfo.ownerId===user.uid?"擁有者":"共同編輯者")+(s.metadata.fromCache?"｜離線快取":"");renderMembers();status(s.metadata.hasPendingWrites?"等待同步":s.metadata.fromCache?"離線快取":"雲端已同步")},e=>status("同步錯誤")));
 unsubs.push(onSnapshot(query(collection(db,"trips",tripId,"itinerary"),orderBy("date"),orderBy("time")),{includeMetadataChanges:true},s=>{trips=s.docs.map(d=>({id:d.id,...d.data()}));renderTrips();renderBudget();renderMap()}));
 unsubs.push(onSnapshot(collection(db,"trips",tripId,"saved"),s=>{saved=s.docs.map(d=>({id:d.id,...d.data()}));renderSaved()}));
 unsubs.push(onSnapshot(doc(db,"trips",tripId,"settings","main"),s=>{budget=s.exists()?s.data():{budgetJPY:0,rate:.22};renderBudget()}));
}
const tripCol=()=>collection(db,"trips",tripId,"itinerary"),savedCol=()=>collection(db,"trips",tripId,"saved");
$("addTrip").onclick=async()=>{const name=$("tripName").value.trim(),lat=$("tripLat").value,lng=$("tripLng").value,cost=Number($("tripCost").value)||0;if(!name)return alert("請輸入景點名稱");if((lat&&!lng)||(!lat&&lng))return alert("緯度與經度需一起填寫");if(cost<0||cost>1e7)return alert("花費超出允許範圍");try{await addDoc(tripCol(),{date:$("tripDate").value,time:$("tripTime").value,city:$("tripCity").value,name,type:$("tripType").value,cost,lat:lat?Number(lat):null,lng:lng?Number(lng):null,note:$("tripNote").value.slice(0,1500),updatedAt:serverTimestamp()});["tripName","tripCost","tripLat","tripLng","tripNote"].forEach(x=>$(x).value="")}catch(e){alert(e.message)}};
window.delTrip=async id=>{if(confirm("刪除這筆行程？"))await deleteDoc(doc(db,"trips",tripId,"itinerary",id))};
window.delSaved=async id=>{if(confirm("刪除這筆收藏？"))await deleteDoc(doc(db,"trips",tripId,"saved",id))};
function renderTrips(){const filter=$("filterDate").value,city=$("filterCity").value,dates=[...new Set(trips.map(t=>t.date).filter(Boolean))].sort();$("filterDate").innerHTML='<option value="">全部日期</option>'+dates.map(d=>`<option>${esc(d)}</option>`).join("");$("filterDate").value=dates.includes(filter)?filter:"";const arr=trips.filter(t=>(!filter||t.date===filter)&&(!city||t.city===city));$("itineraryList").innerHTML=arr.length?arr.map(t=>`<div class="item"><div class="itemhead"><div><b>${esc(t.time)} ${esc(t.name)}</b><span class="tag">${esc(t.city)}・${esc(t.type)}</span><div class="muted">${esc(t.date)} ${t.cost?yen(t.cost):""}</div><div class="muted">${esc(t.note||"")}</div></div><button class="btn danger small" onclick="delTrip('${t.id}')">刪除</button></div><a class="btn small" target="_blank" rel="noopener" href="${gmap(t.lat!=null?t.lat+","+t.lng:t.name+" "+t.city)}">Google Maps</a></div>`).join(""):'<div class="empty">尚無行程</div>'}
$("filterDate").onchange=renderTrips;$("filterCity").onchange=renderTrips;
$("addSaved").onclick=async()=>{const name=$("saveName").value.trim();if(!name)return alert("請輸入名稱");try{await addDoc(savedCol(),{name,type:$("saveType").value,city:$("saveCity").value,address:$("saveAddress").value.slice(0,500),note:$("saveNote").value.slice(0,1500),createdAt:serverTimestamp()});["saveName","saveAddress","saveNote"].forEach(x=>$(x).value="")}catch(e){alert(e.message)}};
function renderSaved(){$("savedList").innerHTML=saved.length?saved.map(s=>`<div class="item"><div class="itemhead"><div><b>${esc(s.name)}</b><span class="tag">${esc(s.type)}・${esc(s.city)}</span><div class="muted">${esc(s.address||"")} ${esc(s.note||"")}</div></div><button class="btn danger small" onclick="delSaved('${s.id}')">刪除</button></div><a class="btn small" target="_blank" rel="noopener" href="${gmap((s.address||s.name)+" "+s.city)}">Google Maps 搜尋</a></div>`).join(""):'<div class="empty">尚無收藏</div>'}
$("saveBudget").onclick=async()=>{const budgetJPY=Number($("budgetLimit").value)||0,rate=Number($("exchangeRate").value)||.22;if(budgetJPY<0||budgetJPY>1e8||rate<=0||rate>100)return alert("請檢查預算與匯率");await setDoc(doc(db,"trips",tripId,"settings","main"),{budgetJPY,rate,updatedAt:serverTimestamp()})};
function renderBudget(){const spent=trips.reduce((a,t)=>a+(Number(t.cost)||0),0),limit=Number(budget.budgetJPY)||0,rate=Number(budget.rate)||.22;$("budgetLimit").value=limit||"";$("exchangeRate").value=rate;$("spentJPY").textContent=yen(spent);$("spentTWD").textContent="約 NT$"+Math.round(spent*rate).toLocaleString();$("remainingJPY").textContent=limit?yen(limit-spent):"尚未設定";$("remainingTWD").textContent=limit?"約 NT$"+Math.round((limit-spent)*rate).toLocaleString():"";$("costList").innerHTML=trips.filter(t=>t.cost>0).map(t=>`<div class="item">${esc(t.date)} ${esc(t.name)}：${yen(t.cost)}</div>`).join("")}
function initMap(){if(map||!window.L)return;map=L.map("map").setView(centers.東京,11);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);map.on("click",e=>picked=e.latlng)}
function renderMap(){if(!$("mapPanel").classList.contains("active"))return;initMap();if(!map)return;markers.forEach(m=>map.removeLayer(m));markers=[];trips.filter(t=>t.lat!=null&&t.lng!=null).forEach(t=>markers.push(L.marker([t.lat,t.lng]).addTo(map).bindPopup(`<b>${esc(t.name)}</b><br>${esc(t.date)}<br><a target="_blank" href="${gmap(t.lat+","+t.lng)}">Google Maps 導航</a>`)));$("mapItems").innerHTML=trips.map(t=>`<div class="item"><b>${esc(t.name)}</b><div class="muted">${esc(t.date)} ${esc(t.city)}</div>${t.lat!=null?`<button class="btn small" onclick="focusPoint('${t.id}')">地圖定位</button>`:"尚無座標"}</div>`).join("")}
window.focusPoint=id=>{const t=trips.find(x=>x.id===id);if(t?.lat!=null){map.setView([t.lat,t.lng],15)}};
$("mapCity").onchange=e=>{initMap();map?.setView(centers[e.target.value],12)};
$("showAll").onclick=()=>{initMap();const pts=trips.filter(t=>t.lat!=null).map(t=>[t.lat,t.lng]);if(pts.length)map.fitBounds(pts,{padding:[20,20],maxZoom:13});else alert("沒有景點座標")};
$("usePicked").onclick=()=>{if(!picked)return alert("先點擊地圖選取位置");document.querySelector('[data-tab="itinerary"]').click();$("tripLat").value=picked.lat.toFixed(6);$("tripLng").value=picked.lng.toFixed(6)};
function renderMembers(){const owner=tripInfo.ownerId===user.uid;$("memberUid").disabled=!owner;$("addMember").disabled=!owner;$("memberList").innerHTML=(tripInfo.members||[]).map(uid=>`<div class="item uid">${esc(uid)} ${uid===tripInfo.ownerId?"（擁有者）":""}</div>`).join("")}
$("addMember").onclick=async()=>{const uid=$("memberUid").value.trim();if(tripInfo.ownerId!==user.uid)return;if(!uid||uid.length<10)return alert("請輸入 UID");if(tripInfo.members.length>=10)return alert("最多 10 位成員");try{await updateDoc(doc(db,"trips",tripId),{members:arrayUnion(uid)});$("memberUid").value="";alert("已加入，請分享旅程網址")}catch(e){alert(e.message)}};
$("copyTripLink").onclick=()=>navigator.clipboard.writeText(location.origin+location.pathname+"?trip="+tripId).then(()=>alert("分享網址已複製"));
$("leaveTrip").onclick=()=>{localStorage.removeItem("jtp_trip");history.replaceState(null,"",location.pathname);stopTrip()};
$("exportBtn").onclick=()=>{const o={version:2,trips,saved,settings:budget},a=document.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify(o,null,2)],{type:"application/json"}));a.href=url;a.download="japan-trip-backup.json";a.click();URL.revokeObjectURL(url)};
$("importFile").onchange=async e=>{try{const o=JSON.parse(await e.target.files[0].text());if(!Array.isArray(o.trips)||!Array.isArray(o.saved))throw Error("JSON 格式不符");if(!confirm("匯入會新增資料，不會刪除現有資料。確定？"))return;for(const t of o.trips){const {id,...v}=t;await addDoc(tripCol(),v)}for(const s of o.saved){const {id,...v}=s;await addDoc(savedCol(),v)}if(o.settings)await setDoc(doc(db,"trips",tripId,"settings","main"),{budgetJPY:Number(o.settings.budgetJPY)||0,rate:Number(o.settings.rate)||.22});alert("匯入完成")}catch(e){alert("匯入失敗："+e.message)}e.target.value=""};
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button,.panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active");if(b.dataset.tab==="mapPanel"){initMap();setTimeout(()=>{map?.invalidateSize();renderMap()},100)}if(b.dataset.tab==="share")renderMembers()});
addEventListener("online",()=>status("網路恢復，正在同步"));addEventListener("offline",()=>status("離線：變更暫存中"));
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
init();
