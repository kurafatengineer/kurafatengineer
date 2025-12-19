document.addEventListener("DOMContentLoaded", () => {

const SHEET_ID="1--MzYQ98U_dSVmdDwY-aGAxba2XgiLXJlttJvLPtQvU";
const URL=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=PYQs`;

let all=[], filtered=[], idx=0;
let stats={c:0,i:0,s:0,u:0};
let answered=false;

/* TOGGLES */
toggleFilter.onclick=()=>filterPanel.classList.toggle("hidden");
toggleProgress.onclick=()=>progressPanel.classList.toggle("hidden");

/* FILTER COLLAPSE */
document.querySelectorAll(".filter-group h4").forEach(h=>{
  h.onclick=()=>h.parentElement.classList.toggle("open");
});

/* FETCH */
fetch(URL).then(r=>r.text()).then(t=>{
  const j=JSON.parse(t.substr(47).slice(0,-2));
  j.table.rows.forEach(r=>{
    if(!r.c[4])return;
    all.push({
      exam:r.c[0]?.v,
      year:r.c[1]?.v,
      paper:r.c[2]?.v,
      question:r.c[4].v,
      correct:r.c[11].v,
      subject:r.c[12]?.v,
      topic:r.c[13]?.v
    });
  });
  populateFilters();
  applyFilters();
});

/* FILTERS */
function populateFilters(){
["exam","year","paper","subject","topic"].forEach(k=>{
  const el=document.getElementById("filter-"+k);
  [...new Set(all.map(q=>q[k]).filter(Boolean))].sort()
  .forEach(v=>{
    el.innerHTML+=`<label><input type="checkbox" value="${v}">${v}</label>`;
  });
});
}

document.addEventListener("change",e=>{
 if(e.target.type==="checkbox") applyFilters();
});

function applyFilters(){
 const get=id=>[...document.querySelectorAll(`#filter-${id} input:checked`)].map(i=>i.value);
 filtered=all.filter(q=>
  (!get("exam").length||get("exam").includes(q.exam)) &&
  (!get("year").length||get("year").includes(q.year)) &&
  (!get("paper").length||get("paper").includes(q.paper)) &&
  (!get("subject").length||get("subject").includes(q.subject)) &&
  (!get("topic").length||get("topic").includes(q.topic))
 );
 idx=0;
 stats={c:0,i:0,s:0,u:filtered.length};
 updateStats();
 show();
}

/* SHOW QUESTION */
function show(){
 answered=false;
 if(idx>=filtered.length)return;
 const q=filtered[idx];
 examCombined.innerText=`${q.exam} • ${q.year}`;
 examPaper.innerText=q.paper;
 question.innerText=q.question.replace(/\([a-d]\).*/i,"");
 options.innerHTML="";
 const reg=/\(([a-d])\)\s*([^()]+)/gi;
 [...q.question.matchAll(reg)].forEach(m=>{
  const b=document.createElement("button");
  b.className="option-btn";
  b.innerHTML=`<span class="key">${m[1]}</span>${m[2]}`;
  b.onclick=()=>answer(b,m[1].toLowerCase());
  options.appendChild(b);
 });
}

/* ANSWER */
function answer(btn,key){
 if(answered)return;
 answered=true;
 stats.u--;
 const cor=filtered[idx].correct;
 document.querySelectorAll(".option-btn").forEach(b=>{
  if(b.querySelector(".key").innerText.toLowerCase()===cor)b.classList.add("correct");
 });
 key===cor?stats.c++:stats.i++;
 updateStats();
 setTimeout(()=>{idx++;show();},800);
}

/* SKIP */
skipBtn.onclick=()=>{
 if(answered)return;
 stats.s++;stats.u--;idx++;updateStats();show();
};

/* STATS */
function updateStats(){
 const t=stats.c+stats.i+stats.s+stats.u||1;
 ["c","i","s","u"].forEach(k=>{
  document.getElementById("count-"+k).innerText=stats[k];
  document.getElementById("bar-"+k).style.width=(stats[k]/t*100)+"%";
 });
}

});
