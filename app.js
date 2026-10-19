const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let today = localDate(new Date());
const STORAGE_KEY = "daily-reset-v1";
const defaultData = () => ({
  habits: [
    {id:uid(),name:"Bangun tepat waktu",category:"Mindset",logs:{}},
    {id:uid(),name:"Olahraga / gerak 20 menit",category:"Health",logs:{}},
    {id:uid(),name:"Belajar skill 30 menit",category:"Growth",logs:{}},
    {id:uid(),name:"Deep work",category:"Work",logs:{}},
    {id:uid(),name:"Baca buku 10 halaman",category:"Growth",logs:{}},
    {id:uid(),name:"Review hari ini",category:"Mindset",logs:{}}
  ],
  tasks: [],
  goals: [
    {id:uid(),name:"Olahraga",target:20,current:0,unit:"sesi",month:monthKey(new Date())},
    {id:uid(),name:"Belajar skill",target:20,current:0,unit:"hari",month:monthKey(new Date())},
    {id:uid(),name:"Baca buku",target:1,current:0,unit:"buku",month:monthKey(new Date())}
  ],
  reviews: {},
  taskFilter:"all"
});
function uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4)}
function localDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function shiftDate(date,days){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+days);return localDate(d)}
function reviewWeekKey(date=today){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()-((d.getDay()+6)%7));return localDate(d)}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);return {...defaultData(),...parsed}}}catch(e){}return defaultData()}
let data=load();
let taskFilter="all";
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));renderStats();scheduleCloudSave()}catch(e){toast("Penyimpanan browser gagal. Coba ekspor backup data.")}}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2200)}
function currentMonth(){return $("#goalMonth").value||monthKey(new Date())}
function isDone(h,date=today){return !!h.logs?.[date]}
function renderHeader(){
  $("#todayLabel").textContent=new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date());
}
function renderHabits(){
  const list=$("#habitList");
  $("#habitCount").textContent=`${data.habits.length} habit`;
  list.innerHTML=data.habits.length?data.habits.map(h=>`<article class="habit-item ${isDone(h)?"checked":""}">
    <input class="check habit-check" type="checkbox" data-id="${h.id}" aria-label="Tandai ${escapeHTML(h.name)} selesai hari ini" ${isDone(h)?"checked":""}>
    <div class="item-main"><div class="item-title">${escapeHTML(h.name)}</div><div class="item-sub">${escapeHTML(h.category||"Personal")} · streak ${streak(h)} hari</div></div>
    <button class="icon-btn delete-habit" data-id="${h.id}" aria-label="Hapus habit">×</button>
  </article>`).join(""):`<p class="muted">Belum ada habit. Tambahkan kebiasaan pertamamu di bawah.</p>`;
  const count=data.habits.filter(h=>isDone(h)).length;
  $("#habitStat").textContent=`${count}/${data.habits.length}`;
  $("#habitProgress").style.width=`${data.habits.length?count/data.habits.length*100:0}%`;
}
function streak(h){
  let count=0, d=today;
  if(!isDone(h,d))d=shiftDate(d,-1);
  while(isDone(h,d)&&count<400){count++;d=shiftDate(d,-1)}
  return count;
}
function renderTasks(){
  const list=$("#taskList");
  const filtered=data.tasks.filter(t=>taskFilter==="all"||(taskFilter==="open"&&!t.done)||(taskFilter==="done"&&t.done));
  $("#taskCount").textContent=`${data.tasks.length} tugas`;
  list.innerHTML=filtered.length?filtered.sort((a,b)=>(a.done-b.done)||((a.due||"9999").localeCompare(b.due||"9999"))).map(t=>{
    const overdue=t.due&&t.due<today&&!t.done;
    let dueLabel=t.due?new Date(`${t.due}T12:00:00`).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):"Tanpa deadline";
    return `<article class="task-item ${t.done?"is-done":""}">
      <input class="check task-check" type="checkbox" data-id="${t.id}" aria-label="Tandai tugas selesai" ${t.done?"checked":""}>
      <div class="item-main"><div class="item-title">${escapeHTML(t.name)}</div><div class="due ${overdue?"overdue":""}">${overdue?"Terlambat · ":""}${escapeHTML(dueLabel)}</div></div>
      <span class="tag ${t.priority==="Tinggi"?"high":t.priority==="Rendah"?"low":""}">${escapeHTML(t.priority)}</span>
      <button class="icon-btn delete-task" data-id="${t.id}" aria-label="Hapus tugas">×</button>
    </article>`
  }).join(""):`<p class="muted">Tidak ada tugas di kategori ini. Nikmati ruang kosongmu atau tambahkan tugas baru.</p>`;
  const done=data.tasks.filter(t=>t.done).length;
  $("#taskStat").textContent=`${done}/${data.tasks.length}`;
  $("#taskProgress").style.width=`${data.tasks.length?done/data.tasks.length*100:0}%`;
}
function renderGoals(){
  const m=currentMonth();data.goals.forEach(g=>{if(!g.month)g.month=monthKey(new Date())});
  const goals=data.goals.filter(g=>g.month===m);
  $("#goalList").innerHTML=goals.length?goals.map(g=>{
    const pct=Math.min(100,Math.round(g.current/Math.max(1,g.target)*100));
    return `<article class="goal-item">
      <div class="goal-top"><div><div class="goal-name">${escapeHTML(g.name)}</div><div class="goal-meta">Target ${g.target} ${escapeHTML(g.unit)}</div></div><div class="goal-percent">${pct}%</div></div>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <div class="goal-controls"><span class="goal-current">${g.current} dari ${g.target} ${escapeHTML(g.unit)}</span><div class="goal-actions"><button class="goal-minus" data-id="${g.id}" aria-label="Kurangi progres" ${g.current<=0?"disabled":""}>−</button><button class="goal-plus" data-id="${g.id}" aria-label="Tambah progres">+</button><button class="icon-btn goal-delete" data-id="${g.id}" aria-label="Hapus target">×</button></div></div>
    </article>`
  }).join(""):`<p class="muted">Belum ada target untuk bulan ini. Tambahkan target pertamamu di bawah.</p>`;
}
function renderStats(){
  const dates=Array.from({length:7},(_,i)=>shiftDate(today,i-6));
  let total=0;
  const chart=$("#weekChart");
  if(chart){
    chart.innerHTML=dates.map(d=>{
      const n=data.habits.filter(h=>isDone(h,d)).length;total+=n;
      const pct=data.habits.length?n/data.habits.length*100:0;
      const day=new Intl.DateTimeFormat("id-ID",{weekday:"short"}).format(new Date(`${d}T12:00:00`)).replace(".","");
      return `<div class="day-bar"><div class="bar-track"><div class="bar-fill" style="height:${pct}%"></div></div><strong>${n}</strong><small>${day}</small></div>`
    }).join("");
  }
  $("#weekHabit").textContent=total;
  $("#weekTasks").textContent=data.tasks.filter(t=>t.done).length;
}
function renderAll(){const currentDate=localDate(new Date());if(currentDate!==today)today=currentDate;renderHeader();renderHabits();renderTasks();renderGoals();renderStats()}
function showView(view){
  if(view==="stats"){const review=data.reviews[reviewWeekKey(today)]||{};$("#reviewWin").value=review.win||"";$("#reviewImprove").value=review.improve||"";$("#reviewFocus").value=review.focus||"";$("#reviewSaved").textContent="";}
  $(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $$(".view").forEach(v=>v.classList.toggle("hidden",v.id!==`view-${view}`));
}
document.addEventListener("click",e=>{const b=e.target.closest(".tab[data-view]");if(b)showView(b.dataset.view)});
$("#habitForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("#habitInput").value.trim();if(!name)return;
  data.habits.push({id:uid(),name,category:"Personal",logs:{}});$("#habitInput").value="";save();renderAll();toast("Habit ditambahkan 🌱");
});
$("#habitList").addEventListener("change",e=>{
  if(!e.target.matches(".habit-check"))return;
  const h=data.habits.find(x=>x.id===e.target.dataset.id);if(!h)return;
  h.logs=h.logs||{};if(e.target.checked)h.logs[today]=true;else delete h.logs[today];
  save();renderAll();
});
$("#habitList").addEventListener("click",e=>{
  const b=e.target.closest(".delete-habit");if(!b)return;
  if(confirm("Hapus habit ini beserta riwayatnya?")){data.habits=data.habits.filter(h=>h.id!==b.dataset.id);save();renderAll();toast("Habit dihapus")}
});
$("#taskForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("#taskInput").value.trim();if(!name)return;
  data.tasks.push({id:uid(),name,due:$("#taskDue").value,priority:$("#taskPriority").value,done:false,created:today});
  $("#taskInput").value="";$("#taskDue").value="";save();renderTasks();toast("Tugas ditambahkan");
});
$("#taskList").addEventListener("change",e=>{
  if(!e.target.matches(".task-check"))return;
  const t=data.tasks.find(x=>x.id===e.target.dataset.id);if(t)t.done=e.target.checked;
  save();renderTasks();
});
$("#taskList").addEventListener("click",e=>{
  const b=e.target.closest(".delete-task");if(!b)return;
  data.tasks=data.tasks.filter(t=>t.id!==b.dataset.id);save();renderTasks();toast("Tugas dihapus");
});
$$(".filter").forEach(b=>b.addEventListener("click",()=>{
  taskFilter=b.dataset.filter;$$(".filter").forEach(x=>x.classList.toggle("active",x===b));renderTasks();
}));
$("#goalMonth").value=monthKey(new Date());
$("#goalMonth").addEventListener("change",renderGoals);
$("#goalForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("#goalInput").value.trim(),target=Number($("#goalTarget").value),unit=$("#goalUnit").value.trim()||"kali";
  if(!name||target<1)return;
  data.goals.push({id:uid(),name,target,current:0,unit,month:currentMonth()});
  $("#goalInput").value="";save();renderGoals();toast("Target ditambahkan 🎯");
});
$("#goalList").addEventListener("click",e=>{
  const plus=e.target.closest(".goal-plus"),minus=e.target.closest(".goal-minus"),del=e.target.closest(".goal-delete");
  if(plus||minus){const id=(plus||minus).dataset.id;const g=data.goals.find(x=>x.id===id);if(g)g.current=Math.max(0,g.current+(plus?1:-1));save();renderGoals()}
  if(del){data.goals=data.goals.filter(g=>g.id!==del.dataset.id);save();renderGoals();toast("Target dihapus")}
});
$("#reviewForm").addEventListener("submit",e=>{
  e.preventDefault();data.reviews[reviewWeekKey(today)]={win:$("#reviewWin").value,improve:$("#reviewImprove").value,focus:$("#reviewFocus").value};
  save();$("#reviewSaved").textContent="Review tersimpan di perangkat ini ✓";toast("Review tersimpan");
});
$("#exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`daily-reset-backup-${today}.json`;a.click();URL.revokeObjectURL(url);toast("Backup data dibuat");
});
$("#importBtn").addEventListener("click",()=>$("#importFile").click());
$("#importFile").addEventListener("change",async e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  try{
    const imported=JSON.parse(await file.text());
    if(!imported||!Array.isArray(imported.habits)||!Array.isArray(imported.tasks)||!Array.isArray(imported.goals)||!imported.reviews||typeof imported.reviews!=="object")throw new Error("Format backup tidak sesuai.");
    const validHabits=imported.habits.every(x=>x&&typeof x.id==="string"&&typeof x.name==="string"&&x.logs&&typeof x.logs==="object");
    const validTasks=imported.tasks.every(x=>x&&typeof x.id==="string"&&typeof x.name==="string"&&typeof x.done==="boolean");
    const validGoals=imported.goals.every(x=>x&&typeof x.id==="string"&&typeof x.name==="string"&&Number.isFinite(Number(x.target))&&Number.isFinite(Number(x.current)));
    if(!validHabits||!validTasks||!validGoals)throw new Error("Sebagian data backup tidak valid.");
    if(!confirm("Pulihkan "+imported.habits.length+" habit, "+imported.tasks.length+" tugas, dan "+imported.goals.length+" target? Data saat ini akan diganti."))return;
    data={...defaultData(),...imported,habits:imported.habits,tasks:imported.tasks,goals:imported.goals,reviews:imported.reviews};
    save();renderAll();toast("Backup berhasil dipulihkan ✓");
  }catch(err){toast(err.message||"File backup tidak bisa dibaca.")}
  finally{e.target.value=""}
});
let installPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("#installBtn").classList.remove("hidden")});
$("#installBtn").addEventListener("click",async()=>{
  if(!installPrompt){toast("Buka menu browser lalu pilih Tambahkan ke layar utama");return}
  installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("#installBtn").classList.add("hidden");
});
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}

/* Optional Supabase cloud sync. Local mode remains available until configured. */
let supabaseClient=null, cloudUser=null, cloudSyncEnabled=false, cloudApplyingRemote=false, cloudSaveTimer=null, cloudSessionHandled="", cloudChannel=null, lastCloudUpdatedAt="";
function setCloudStatus(label,message,kind=""){
  const badge=$("#cloudBadge"),msg=$("#cloudMessage");
  if(badge){badge.textContent=label;badge.className="cloud-badge"+(kind?" "+kind:"")}
  if(msg)msg.textContent=message;
  const appStatus=$("#appSyncStatus"),appMessage=$("#appSyncMessage");
  if(appStatus){appStatus.textContent=label;appStatus.className="app-sync-status"+(kind?" "+kind:"")}
  if(appMessage)appMessage.textContent=message;
}
function setCloudSignedIn(user){
  $("#loginScreen").classList.toggle("hidden",!!user);
  $("#appShell").classList.toggle("hidden",!user);
  $("#appAccountBar").classList.toggle("hidden",!user);
  $("#appUserEmail").textContent=user?.email||"";
}
function scheduleCloudSave(){
  if(!supabaseClient||!cloudUser||!cloudSyncEnabled||cloudApplyingRemote)return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(()=>pushCloudData(false),900);
}
async function pushCloudData(manual){
  if(!supabaseClient||!cloudUser)return;
  if(!cloudSyncEnabled){
    if(!confirm("Akun ini belum memiliki backup cloud. Unggah data yang saat ini tersimpan di browser ke akun ini?"))return;
    cloudSyncEnabled=true;
  }
  setCloudStatus("Menyinkronkan…","Menyimpan perubahan ke cloud secara otomatis.","busy");
  const payload=JSON.parse(JSON.stringify(data));
  const updatedAt=new Date().toISOString();
  try{
    const {error}=await supabaseClient.from("daily_reset_data").upsert({user_id:cloudUser.id,data:payload,updated_at:updatedAt},{onConflict:"user_id"});
    if(error){setCloudStatus("Belum sinkron","Cloud belum menerima perubahan: "+error.message+". Data lokal tetap tersimpan; coba lagi saat koneksi pulih.");if(manual)toast("Sinkronisasi gagal");return}
    lastCloudUpdatedAt=updatedAt;
    setCloudStatus("Tersinkron","Perubahan terakhir berhasil disimpan ke cloud.","online");
    if(manual)toast("Data berhasil disinkronkan ✓");
  }catch(error){
    setCloudStatus("Belum sinkron","Koneksi terputus saat menyimpan. Data lokal tetap tersimpan; ubah data lagi atau tekan Sinkronkan untuk mencoba ulang.");
    if(manual)toast("Sinkronisasi gagal");
  }
}
async function handleCloudSession(user){
  cloudUser=user||null;
  setCloudSignedIn(cloudUser);
  if(!cloudUser){
    if(cloudChannel&&supabaseClient){supabaseClient.removeChannel(cloudChannel);cloudChannel=null}
    cloudSyncEnabled=false;cloudSessionHandled="";lastCloudUpdatedAt="";
    setCloudStatus(supabaseClient?"Lokal":"Belum disetel",supabaseClient?"Kamu keluar. Data lokal di browser ini tidak dihapus.":"Tambahkan URL dan publishable key Supabase untuk mengaktifkan sinkronisasi.");
    return;
  }
  if(cloudSessionHandled===cloudUser.id)return;
  cloudSessionHandled=cloudUser.id;
  cloudSyncEnabled=false;
  setCloudStatus("Memuat…","Memeriksa data cloud akun kamu.","busy");
  const {data:row,error}=await supabaseClient.from("daily_reset_data").select("data").eq("user_id",cloudUser.id).maybeSingle();
  if(error){setCloudStatus("Perlu konfigurasi","Tidak bisa membaca database: "+error.message+". Pastikan SQL schema sudah dijalankan dan RLS aktif.");return}
  if(row&&row.data&&Array.isArray(row.data.habits)&&Array.isArray(row.data.tasks)&&Array.isArray(row.data.goals)){
    cloudApplyingRemote=true;
    data={...defaultData(),...row.data};
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}catch(e){}
    cloudApplyingRemote=false;
    cloudSyncEnabled=true;lastCloudUpdatedAt=row.updated_at||"";
    renderAll();subscribeCloudChanges();
    setCloudStatus("Tersinkron","Data cloud akun ini berhasil dimuat. Perubahan akan tersimpan otomatis.","online");
  }else{
    // First login on an account without a cloud backup: automatically seed it from this browser.
    cloudSyncEnabled=true;
    setCloudStatus("Menyinkronkan…","Membuat backup cloud pertama secara otomatis.","busy");
    await pushCloudData(false);
    subscribeCloudChanges();
  }
}
function subscribeCloudChanges(){
  if(!supabaseClient||!cloudUser)return;
  if(cloudChannel)supabaseClient.removeChannel(cloudChannel);
  const userId=cloudUser.id;
  cloudChannel=supabaseClient.channel("daily-reset-sync-"+userId)
    .on("postgres_changes",{event:"*",schema:"public",table:"daily_reset_data",filter:"user_id=eq."+userId},payload=>{
      if(!cloudUser||cloudUser.id!==userId||!payload.new||payload.new.updated_at===lastCloudUpdatedAt)return;
      if(!payload.new.data||!Array.isArray(payload.new.data.habits))return;
      clearTimeout(cloudSaveTimer);
      cloudApplyingRemote=true;data={...defaultData(),...payload.new.data};
      try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}catch(e){}
      lastCloudUpdatedAt=payload.new.updated_at||"";cloudApplyingRemote=false;renderAll();
      setCloudStatus("Tersinkron","Perubahan dari perangkat lain sudah diterima.","online");
    }).subscribe();
}
function initSupabase(){
  const form=$("#cloudAuthForm"),loginBtn=$("#cloudLoginBtn"),signupBtn=$("#cloudSignupBtn");
  const emailInput=$("#cloudEmail"),passwordInput=$("#cloudPassword");
  const explainMissingConfig=()=>{
    setCloudStatus("Login belum aktif","Koneksi Supabase belum siap. Muat ulang halaman; jika tetap sama, periksa koneksi internet dan konfigurasi Supabase.");
  };

  // Handle both actions through the form submit event for reliable keyboard and mouse behavior.
  form.noValidate=true;
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const isSignup=e.submitter?.id==="cloudSignupBtn";
    const email=emailInput.value.trim(),password=passwordInput.value;
    if(!emailInput.checkValidity()||!email){
      setCloudStatus("Periksa email","Masukkan alamat email yang valid terlebih dahulu.");emailInput.focus();return;
    }
    if(password.length<6){
      setCloudStatus("Periksa password","Password harus berisi minimal 6 karakter.");passwordInput.focus();return;
    }
    if(!supabaseClient){explainMissingConfig();return}
    loginBtn.disabled=true;signupBtn.disabled=true;
    setCloudStatus(isSignup?"Membuat akun…":"Memproses…",isSignup?"Sedang mendaftarkan akun.":"Sedang masuk ke akun Supabase.","busy");
    try{
      if(isSignup){
        const {data:result,error}=await supabaseClient.auth.signUp({
          email,password,options:{emailRedirectTo:location.origin+location.pathname}
        });
        if(error){setCloudStatus("Gagal membuat akun",error.message);return}
        if(result.session){await handleCloudSession(result.user)}
        else setCloudStatus("Cek email","Permintaan pendaftaran berhasil diproses. Buka email konfirmasi Supabase, lalu kembali ke halaman ini untuk login.");
      }else{
        const {error}=await supabaseClient.auth.signInWithPassword({email,password});
        if(error)setCloudStatus("Gagal masuk",error.message);
      }
    }catch(error){
      setCloudStatus("Koneksi bermasalah",error?.message||"Tidak dapat menghubungi Supabase. Periksa internet lalu coba lagi.");
    }finally{loginBtn.disabled=false;signupBtn.disabled=false}
  });

  $("#cloudLogoutBtn").addEventListener("click",async()=>{
    if(!supabaseClient)return;
    try{
      const {error}=await supabaseClient.auth.signOut();
      if(error)setCloudStatus("Gagal keluar",error.message);
      else toast("Kamu sudah keluar. Data lokal tetap tersimpan.");
    }catch(error){setCloudStatus("Gagal keluar",error?.message||"Tidak dapat menghubungi Supabase.")}
  });
  $("#cloudSyncBtn").addEventListener("click",()=>pushCloudData(true));

  const url=window.DAILY_RESET_SUPABASE_URL||"";
  const key=window.DAILY_RESET_SUPABASE_PUBLISHABLE_KEY||"";
  if(!window.supabase){
    setCloudStatus("SDK belum termuat","Library login belum berhasil dimuat dari CDN. Periksa internet lalu muat ulang halaman.");
    setCloudSignedIn(null);return;
  }
  if(!url.startsWith("https://")||!key||key.includes("YOUR_SUPABASE")){
    setCloudStatus("Belum disetel","Konfigurasi Supabase belum lengkap. Mode lokal tetap bisa dipakai.");
    setCloudSignedIn(null);return;
  }
  try{supabaseClient=window.supabase.createClient(url,key)}
  catch(error){setCloudStatus("Konfigurasi error",error?.message||"Konfigurasi Supabase tidak valid.");return}

  supabaseClient.auth.onAuthStateChange((event,session)=>{
    if(event==="SIGNED_OUT"){handleCloudSession(null);return}
    if(session?.user)handleCloudSession(session.user);
  });
  supabaseClient.auth.getSession().then(({data:sessionData,error})=>{
    if(error){setCloudStatus("Auth error",error.message);return}
    handleCloudSession(sessionData.session?.user||null);
  }).catch(error=>setCloudStatus("Auth error",error?.message||"Gagal memeriksa sesi login."));
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)renderAll()});
initSupabase();
renderAll();
