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
  businessIdeas: [],
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
  const formattedDate=new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date());
  $("#todayLabel").textContent=formattedDate;
  const habitDateLabel=$("#habitDateLabel");
  if(habitDateLabel)habitDateLabel.textContent=formattedDate;
}
function renderHabits(){
  const list=$("#habitList");
  $("#habitCount").textContent=`${data.habits.length} habit`;
  list.innerHTML=data.habits.length?data.habits.map(h=>`<article class="habit-item ${isDone(h)?"checked":""}" data-habit-id="${h.id}">
    <button class="habit-drag-handle" type="button" aria-label="Tahan lalu geser ${escapeHTML(h.name)}" title="Tahan lalu geser">⠿</button><div class="habit-order-controls" aria-label="Atur urutan habit"><button type="button" class="habit-move-up" data-id="${h.id}" aria-label="Pindahkan ${escapeHTML(h.name)} ke atas" ${data.habits[0]?.id===h.id?"disabled":""}>↑</button><button type="button" class="habit-move-down" data-id="${h.id}" aria-label="Pindahkan ${escapeHTML(h.name)} ke bawah" ${data.habits[data.habits.length-1]?.id===h.id?"disabled":""}>↓</button></div>
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
  const priorityRank={Tinggi:0,Sedang:1,Rendah:2};
  list.innerHTML=filtered.length?filtered.sort((a,b)=>(Number(a.done)-Number(b.done))||((priorityRank[a.priority]??1)-(priorityRank[b.priority]??1))||((a.due||"9999").localeCompare(b.due||"9999"))).map(t=>{
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
  const weekStart=reviewWeekKey(today);
  const dates=Array.from({length:7},(_,i)=>shiftDate(weekStart,i)).filter(d=>d<=today);
  const habitTotal=data.habits.length*dates.length;
  let completedHabitChecks=0;
  const chart=$("#weekChart");
  if(chart){
    chart.innerHTML=dates.map(d=>{
      const completed=data.habits.filter(h=>isDone(h,d)).length;
      const missed=Math.max(0,data.habits.length-completed);
      completedHabitChecks+=completed;
      const pct=data.habits.length?completed/data.habits.length*100:0;
      const day=new Intl.DateTimeFormat("id-ID",{weekday:"short"}).format(new Date(`${d}T12:00:00`)).replace(".","");
      return `<div class="day-bar"><div class="bar-track" title="${completed} habit selesai, ${missed} belum"><div class="bar-fill" style="height:${pct}%"></div></div><strong>${completed}/${data.habits.length}</strong><small>${day}</small></div>`;
    }).join("");
  }
  const habitPct=habitTotal?Math.round(completedHabitChecks/habitTotal*100):0;
  const doneTasks=data.tasks.filter(t=>t.done);
  const openTasks=data.tasks.filter(t=>!t.done);
  $("#weekHabit").textContent=completedHabitChecks;
  $("#weekTasks").textContent=doneTasks.length;
  const breakdown=$("#weekBreakdown");
  if(breakdown){
    const habitRows=data.habits.map(h=>{
      const done=dates.filter(d=>isDone(h,d)).length;
      const pct=dates.length?Math.round(done/dates.length*100):0;
      return `<div class="breakdown-row"><div class="breakdown-copy"><strong>${escapeHTML(h.name)}</strong><small>${done} dari ${dates.length} hari · ${pct}%</small></div><div class="mini-progress"><span style="width:${pct}%"></span></div></div>`;
    }).join("");
    const taskRows=list=>list.length?list.map(t=>`<li>${escapeHTML(t.name)}${t.due?` <small>· deadline ${escapeHTML(t.due)}</small>`:""}</li>`).join(""):'<li class="empty-detail">Tidak ada.</li>';
    breakdown.innerHTML=`
      <div class="detail-group"><h4>Habit — ${habitPct}% terlaksana</h4>${habitRows||'<p class="empty-detail">Belum ada habit.</p>'}</div>
      <div class="detail-columns">
        <div class="detail-group"><h4>Sudah dikerjakan (${doneTasks.length})</h4><ul>${taskRows(doneTasks)}</ul></div>
        <div class="detail-group"><h4>Belum selesai (${openTasks.length})</h4><ul>${taskRows(openTasks)}</ul></div>
      </div>`;
  }
  const goalProgress=$("#weeklyGoalProgress");
  if(goalProgress){
    const monthlyGoals=data.goals.filter(g=>g.month===monthKey(new Date()));
    goalProgress.innerHTML=monthlyGoals.length?monthlyGoals.map(g=>{
      const target=Math.max(1,Number(g.target)||1);
      const actual=Math.max(0,Number(g.current)||0);
      const pct=Math.round(actual/target*100);
      const barPct=Math.min(100,pct);
      const status=pct>=100?"Tercapai":pct>=70?"Hampir tercapai":"Dalam progres";
      return `<article class="goal-progress-item">
        <div class="goal-progress-head"><strong>${escapeHTML(g.name)}</strong><span class="goal-progress-pct">${pct}%</span></div>
        <div class="goal-progress-bar"><span style="width:${barPct}%"></span></div>
        <div class="goal-progress-metrics"><span><small>Goal</small><b>${target} ${escapeHTML(g.unit)}</b></span><span><small>Aktual</small><b>${actual} ${escapeHTML(g.unit)}</b></span><span><small>Progres</small><b>${Math.max(0,target-actual)} ${escapeHTML(g.unit)} lagi</b></span></div>
        <p class="goal-progress-status">${status}</p>
      </article>`;
    }).join(""):'<p class="muted tiny">Belum ada target bulan ini. Tambahkan target di menu Target untuk melihat goal, aktual, dan persentase progresnya.</p>';
  }
  const insights=$("#weekInsights");
  if(insights){
    const ranked=data.habits.map(h=>({name:h.name,done:dates.filter(d=>isDone(h,d)).length,pct:dates.length?Math.round(dates.filter(d=>isDone(h,d)).length/dates.length*100):0})).sort((a,b)=>a.pct-b.pct);
    const lowest=ranked[0];
    const strongest=[...ranked].sort((a,b)=>b.pct-a.pct)[0];
    const tips=[];
    if(!data.habits.length)tips.push("Tambahkan 1–3 habit utama agar progres mingguan bisa diukur.");
    else if(lowest&&lowest.pct<70)tips.push(`Mulai dari habit “${escapeHTML(lowest.name)}” (${lowest.pct}%): kecilkan targetnya jadi langkah 5–10 menit dan pasang pemicu waktu yang jelas.`);
    else tips.push("Pertahankan rutinitas yang sudah berjalan; pilih satu habit untuk dinaikkan sedikit demi sedikit.");
    if(openTasks.length)tips.push(`Pilih maksimal 3 tugas dari ${openTasks.length} tugas yang belum selesai sebagai prioritas minggu depan.`);
    else tips.push("Daftar tugas saat ini sudah tuntas—buat prioritas baru hanya jika memang perlu.");
    if(strongest&&strongest.name!==lowest?.name)tips.push(`Pertahankan pola yang membantu “${escapeHTML(strongest.name)}” (${strongest.pct}%) dan coba terapkan pada habit lain.`);
    insights.innerHTML=`<ul>${tips.map(t=>`<li>${t}</li>`).join("")}</ul>`;
  }
  const history=$("#reviewHistory");
  if(history){
    const entries=Object.entries(data.reviews||{}).filter(([,v])=>v&&[v.win,v.improve,v.focus].some(x=>String(x||"").trim())).sort(([a],[b])=>b.localeCompare(a));
    history.innerHTML=entries.length?entries.map(([week,v])=>{
      const label=new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric"}).format(new Date(`${week}T12:00:00`));
      return `<article class="review-entry"><strong>Minggu mulai ${label}</strong>${v.win?`<p><b>Berjalan baik:</b> ${escapeHTML(v.win)}</p>`:""}${v.improve?`<p><b>Perlu diperbaiki:</b> ${escapeHTML(v.improve)}</p>`:""}${v.focus?`<p><b>Fokus berikutnya:</b> ${escapeHTML(v.focus)}</p>`:""}</article>`;
    }).join(""):'<p class="muted tiny">Review yang disimpan akan muncul di sini.</p>';
  }
}
const IDEA_STAGES=[
  {id:"capture",label:"Baru dicatat"},{id:"validate",label:"Validasi masalah"},{id:"testing",label:"Sedang diuji"},{id:"evaluate",label:"Evaluasi data"},{id:"scale",label:"Siap scale"},{id:"improve",label:"Perlu diperbaiki"},{id:"stop",label:"Dihentikan"}
];
function ideaProgress(idea){
  const checks=[idea.problem,idea.customer,idea.hypothesis,idea.experiment,idea.hasMetrics,idea.decision].filter(Boolean).length;
  return Math.round(checks/6*100);
}
function renderIdeas(){
  const list=$("#ideaList");if(!list)return;
  const ideas=Array.isArray(data.businessIdeas)?data.businessIdeas:[];
  const filter=$("#ideaFilter")?.value||"all";
  const visible=ideas.filter(i=>filter==="all"||i.stage===filter);
  $("#ideaCount").textContent=ideas.length+" ide";
  $("#ideaActiveCount").textContent=ideas.filter(i=>!["scale","stop"].includes(i.stage)).length;
  $("#ideaTestingCount").textContent=ideas.filter(i=>["testing","evaluate"].includes(i.stage)).length;
  $("#ideaScaleCount").textContent=ideas.filter(i=>i.stage==="scale").length;
  list.innerHTML=visible.length?visible.slice().reverse().map(i=>{
    const progress=ideaProgress(i),leads=Number(i.leads)||0,sales=Number(i.sales)||0,revenue=Number(i.revenue)||0,cost=Number(i.cost)||0,budget=Number(i.budget)||0;
    const conversion=leads?Math.round(sales/leads*100):0,profit=revenue-cost;
    const stageOptions=IDEA_STAGES.map(s=>'<option value="'+s.id+'" '+(i.stage===s.id?'selected':'')+'>'+s.label+'</option>').join("");
    return '<article class="idea-card" data-idea-id="'+i.id+'">'+
      '<div class="idea-card-top"><div><p class="eyebrow">IDEA • '+escapeHTML(new Date(i.createdAt||Date.now()).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}))+'</p><h3>'+escapeHTML(i.title)+'</h3></div><button type="button" class="icon-btn idea-delete" data-id="'+i.id+'" aria-label="Hapus ide">×</button></div>'+
      '<label class="idea-field-label" for="ideaStage-'+i.id+'">Tahap ide</label><select id="ideaStage-'+i.id+'" class="idea-stage" data-id="'+i.id+'">'+stageOptions+'</select>'+
      '<div class="idea-progress-head"><span>Progres validasi</span><strong>'+progress+'%</strong></div><div class="idea-progress"><span style="width:'+progress+'%"></span></div>'+
      '<p class="idea-problem">'+escapeHTML(i.problem||"Tambahkan masalah/peluang yang ingin diselesaikan.")+'</p><p class="idea-customer"><strong>Calon pembeli:</strong> '+escapeHTML(i.customer||"Belum ditentukan")+'</p>'+
      '<details class="idea-details"><summary>Rencana eksperimen & data aktual</summary>'+
      '<form class="idea-data-form" data-id="'+i.id+'">'+
      '<label for="hyp-'+i.id+'">Hipotesis yang mau dibuktikan</label><textarea id="hyp-'+i.id+'" name="hypothesis" rows="2" maxlength="500" placeholder="Contoh: 20% orang yang ditawari akan membeli">'+escapeHTML(i.hypothesis||"")+'</textarea>'+
      '<label for="exp-'+i.id+'">Eksperimen / langkah berikutnya</label><textarea id="exp-'+i.id+'" name="experiment" rows="2" maxlength="500" placeholder="Contoh: tawarkan pre-order ke 30 calon pembeli">'+escapeHTML(i.experiment||"")+'</textarea>'+
      '<div class="form-row"><div class="field-grow"><label for="budget-'+i.id+'">Batas modal (Rp)</label><input id="budget-'+i.id+'" name="budget" type="number" min="0" value="'+(budget||"")+'" placeholder="500000"></div><div class="field-grow"><label for="cost-'+i.id+'">Biaya aktual (Rp)</label><input id="cost-'+i.id+'" name="cost" type="number" min="0" value="'+(cost||"")+'" placeholder="100000"></div></div>'+
      '<div class="form-row"><div class="field-grow"><label for="leads-'+i.id+'">Calon pembeli / leads</label><input id="leads-'+i.id+'" name="leads" type="number" min="0" value="'+(leads||"")+'" placeholder="30"></div><div class="field-grow"><label for="sales-'+i.id+'">Pesanan / penjualan</label><input id="sales-'+i.id+'" name="sales" type="number" min="0" value="'+(sales||"")+'" placeholder="6"></div></div>'+
      '<label for="revenue-'+i.id+'">Omzet aktual (Rp)</label><input id="revenue-'+i.id+'" name="revenue" type="number" min="0" value="'+(revenue||"")+'" placeholder="600000">'+
      '<label for="notes-'+i.id+'">Hasil / feedback pelanggan</label><textarea id="notes-'+i.id+'" name="notes" rows="2" maxlength="1000" placeholder="Apa yang berhasil, gagal, atau mengejutkan?">'+escapeHTML(i.notes||"")+'</textarea>'+
      '<label for="decision-'+i.id+'">Keputusan setelah tes</label><textarea id="decision-'+i.id+'" name="decision" rows="2" maxlength="500" placeholder="Scale, ubah penawaran, tes lagi, atau stop — berdasarkan data apa?">'+escapeHTML(i.decision||"")+'</textarea>'+
      '<button class="primary-btn" type="submit">Simpan hasil eksperimen</button></form></details>'+
      '<div class="idea-metrics"><div><span>Konversi</span><strong>'+conversion+'%</strong></div><div><span>Omzet</span><strong>'+formatRupiah(revenue)+'</strong></div><div><span>Estimasi laba*</span><strong class="'+(profit<0?"metric-negative":"")+'">'+formatRupiah(profit)+'</strong></div></div>'+
      '<p class="muted tiny">*Estimasi sederhana: omzet dikurangi biaya yang dicatat, belum termasuk biaya lain yang belum dimasukkan.</p>'+
      '<button type="button" class="text-btn idea-delete-text" data-id="'+i.id+'">Hapus ide</button></article>';
  }).join(""):'<div class="idea-empty"><strong>Belum ada ide di sini.</strong><p class="muted">Catat ide spontan di atas. Mulai kecil, lalu kumpulkan bukti dari calon pembeli.</p></div>';
}
function formatRupiah(value){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(value)||0)}
function ideaById(id){return (data.businessIdeas||[]).find(i=>i.id===id)}
function renderAll(){const currentDate=localDate(new Date());if(currentDate!==today)today=currentDate;renderHeader();renderHabits();renderTasks();renderGoals();renderIdeas();renderStats()}
function showView(view,updateHash=true){
  if(!["today","tasks","goals","stats","ideas"].includes(view))return;
  if(view==="stats"){const review=data.reviews[reviewWeekKey(today)]||{};$("#reviewWin").value=review.win||"";$("#reviewImprove").value=review.improve||"";$("#reviewFocus").value=review.focus||"";$("#reviewSaved").textContent=Object.values(review).some(v=>String(v||"").trim())?"Review minggu ini sudah tersimpan ✓":"";}
  $$(".tab[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $$(".view").forEach(v=>{
    const active=v.id===`view-${view}`;
    v.classList.toggle("hidden",!active);
    v.setAttribute("aria-hidden",String(!active));
  });
  if(updateHash&&location.hash!==`#view-${view}`)location.hash=`view-${view}`;
}
window.showView=showView;
document.addEventListener("click",e=>{
  const b=e.target.closest(".tab[data-view]");
  if(!b)return;
  e.preventDefault();
  showView(b.dataset.view);
});
window.addEventListener("hashchange",()=>{
  const view=location.hash.replace("#view-","");
  if(["today","tasks","goals","stats","ideas"].includes(view))showView(view,false);
});
const initialView=location.hash.replace("#view-","");
if(["today","tasks","goals","stats"].includes(initialView))showView(initialView,false);
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
/* Reliable habit reordering: pointer drag plus explicit up/down controls. */
let pointerDragState=null;
function reorderHabitBefore(dragId,targetId,after=false){
  if(!dragId||!targetId||dragId===targetId)return false;
  const from=data.habits.findIndex(h=>h.id===dragId);
  if(from<0||data.habits.findIndex(h=>h.id===targetId)<0)return false;
  const [moved]=data.habits.splice(from,1);
  let insertAt=data.habits.findIndex(h=>h.id===targetId);
  if(insertAt<0){data.habits.splice(from,0,moved);return false}
  if(after)insertAt++;
  data.habits.splice(insertAt,0,moved);
  save();renderAll();
  return true;
}
function moveHabitBy(id,delta){
  const from=data.habits.findIndex(h=>h.id===id);
  const to=from+delta;
  if(from<0||to<0||to>=data.habits.length)return;
  const [item]=data.habits.splice(from,1);
  data.habits.splice(to,0,item);
  save();renderAll();
}
$("#habitList").addEventListener("click",e=>{
  const up=e.target.closest(".habit-move-up");
  const down=e.target.closest(".habit-move-down");
  if(up){e.preventDefault();moveHabitBy(up.dataset.id,-1);return}
  if(down){e.preventDefault();moveHabitBy(down.dataset.id,1)}
});
$("#habitList").addEventListener("pointerdown",e=>{
  const handle=e.target.closest(".habit-drag-handle");
  const item=handle?.closest(".habit-item");
  if(!item||e.button!==0)return;
  e.preventDefault();
  pointerDragState={id:item.dataset.habitId,pointerId:e.pointerId,x:e.clientX,y:e.clientY,active:false};
  try{handle.setPointerCapture(e.pointerId)}catch(_){}
});
document.addEventListener("pointermove",e=>{
  if(!pointerDragState||e.pointerId!==pointerDragState.pointerId)return;
  if(!pointerDragState.active&&Math.hypot(e.clientX-pointerDragState.x,e.clientY-pointerDragState.y)<5)return;
  pointerDragState.active=true;
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest("#habitList .habit-item");
  $$("#habitList .habit-item").forEach(el=>{
    el.classList.toggle("is-dragging",el.dataset.habitId===pointerDragState.id);
    el.classList.toggle("drop-target",!!target&&el===target&&el.dataset.habitId!==pointerDragState.id);
  });
});
function finishHabitPointerDrag(e){
  if(!pointerDragState||e.pointerId!==pointerDragState.pointerId)return;
  const state=pointerDragState;pointerDragState=null;
  $$("#habitList .habit-item").forEach(el=>el.classList.remove("is-dragging","drop-target"));
  if(!state.active)return;
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest("#habitList .habit-item");
  if(target&&target.dataset.habitId!==state.id){
    const rect=target.getBoundingClientRect();
    reorderHabitBefore(state.id,target.dataset.habitId,e.clientY>rect.top+rect.height/2);
  }
}
document.addEventListener("pointerup",finishHabitPointerDrag);
document.addEventListener("pointercancel",e=>{
  if(pointerDragState&&e.pointerId===pointerDragState.pointerId){
    pointerDragState=null;
    $$("#habitList .habit-item").forEach(el=>el.classList.remove("is-dragging","drop-target"));
  }
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
  save();$("#reviewSaved").textContent="Review tersimpan ✓";renderStats();toast("Review tersimpan");
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
  const togglePassword=$("#togglePassword");
  if(togglePassword&&!togglePassword.dataset.ready){
    togglePassword.dataset.ready="true";
    togglePassword.addEventListener("click",()=>{
      const show=passwordInput.type==="password";
      passwordInput.type=show?"text":"password";
      togglePassword.setAttribute("aria-pressed",String(show));
      togglePassword.setAttribute("aria-label",show?"Sembunyikan password":"Tampilkan password");
      togglePassword.querySelector("span").textContent=show?"Sembunyikan":"Tampilkan";
      passwordInput.focus({preventScroll:true});
    });
  }
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
$("#ideaForm")?.addEventListener("submit",e=>{
  e.preventDefault();const title=$("#ideaTitle").value.trim();if(!title)return;
  data.businessIdeas=Array.isArray(data.businessIdeas)?data.businessIdeas:[];
  data.businessIdeas.push({id:uid(),title,problem:$("#ideaProblem").value.trim(),customer:$("#ideaCustomer").value.trim(),hypothesis:"",experiment:"",stage:"capture",budget:0,cost:0,leads:0,sales:0,revenue:0,notes:"",decision:"",hasMetrics:false,createdAt:new Date().toISOString()});
  e.target.reset();save();renderAll();toast("Ide bisnis tersimpan 💡");
});
$("#ideaFilter")?.addEventListener("change",renderIdeas);
$("#ideaList")?.addEventListener("change",e=>{
  const select=e.target.closest(".idea-stage");if(!select)return;
  const idea=ideaById(select.dataset.id);if(!idea)return;
  idea.stage=select.value;save();renderIdeas();toast("Tahap ide diperbarui");
});
$("#ideaList")?.addEventListener("submit",e=>{
  const form=e.target.closest(".idea-data-form");if(!form)return;
  e.preventDefault();const idea=ideaById(form.dataset.id);if(!idea)return;
  const values=new FormData(form);
  ["hypothesis","experiment","notes","decision"].forEach(k=>idea[k]=String(values.get(k)||"").trim());
  ["budget","cost","leads","sales","revenue"].forEach(k=>idea[k]=Math.max(0,Number(values.get(k))||0));
  idea.hasMetrics=idea.leads>0||idea.sales>0||idea.revenue>0||idea.cost>0;
  save();renderAll();toast("Hasil eksperimen tersimpan");
});
$("#ideaList")?.addEventListener("click",e=>{
  const btn=e.target.closest(".idea-delete,.idea-delete-text");if(!btn)return;
  const idea=ideaById(btn.dataset.id);if(!idea)return;
  if(confirm('Hapus ide "'+idea.title.replace(/"/g,"")+'"?')){data.businessIdeas=data.businessIdeas.filter(i=>i.id!==idea.id);save();renderAll();toast("Ide dihapus")}
});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)renderAll()});
initSupabase();
renderAll();
