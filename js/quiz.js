document.addEventListener("DOMContentLoaded", () => {

const SHEET_ID = "1--MzYQ98U_dSVmdDwY-aGAxba2XgiLXJlttJvLPtQvU";
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=PYQs`;

let all=[], list=[], i=0, stats={c:0,i:0,s:0,u:0};

fetch(URL).then(r=>r.text()).then(t=>{
  const j=JSON.parse(t.substr(47).slice(0,-2));
  j.table.rows.forEach(r=>{
    if(!r.c[4])return;
    all.push({
      exam:r.c[0]?.v||"",
      year:r.c[1]?.v||"",
      paper:r.c[2]?.v||"",
      q:r.c[4].v,
      a:r.c[11]?.v.toLowerCase(),
      subject:r.c[12]?.v||"",
      topic:r.c[13]?.v||""
    });
  });
  list=[...all]; stats.u=list.length;
  renderFilters(); show();
});

function renderFilters(){
  ["exam","year","paper","subject","topic"].forEach(k=>{
    const el=document.getElementById("filter-"+k);
    [...new Set(all.map(q=>q[k]))].forEach(v=>{
      el.innerHTML+=`<label><input type=checkbox value="${v}">${v}</label>`;
    });
  });
}

document.addEventListener("change",e=>{
  if(e.target.type!=="checkbox")return;
  list=all.filter(q=>
    ["exam","year","paper","subject","topic"].every(k=>{
      const c=[...document.querySelectorAll(`#filter-${k} input:checked`)].map(i=>i.value);
      return !c.length||c.includes(q[k]);
    })
  );
  i=0; stats={c:0,i:0,s:0,u:list.length}; show();
});

function show(){
  if(i>=list.length)return;
  const q=list[i];
  examMeta.innerText=`${q.exam} ${q.year}`;
  examPaper.innerText=q.paper;
  question.innerText=q.q.replace(/\([a-e]\).*/i,"");
  options.innerHTML="";
  [...q.q.matchAll(/\(([a-e])\)\s*([^()]+)/gi)].forEach(m=>{
    const b=document.createElement("button");
    b.className="option-btn";
    b.innerHTML=`<span class="opt-key">${m[1]}</span>${m[2]}`;
    b.onclick=()=>answer(b,m[1]);
    options.appendChild(b);
  });
}

function answer(btn,k){
  const c=list[i].a;
  document.querySelectorAll(".option-btn").forEach(b=>{
    if(b.querySelector(".opt-key").innerText.toLowerCase()===c)b.classList.add("correct");
  });
  if(k!==c)btn.classList.add("wrong");
  i++; setTimeout(show,1000);
}

filterToggle.onclick=()=>filterPanel.classList.toggle("open");
progressToggle.onclick=()=>progressPanel.classList.toggle("open");

});
