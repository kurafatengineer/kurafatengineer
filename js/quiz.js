document.addEventListener("DOMContentLoaded", () => {

/**************** CONFIG ****************/
const SHEET_ID = "1--MzYQ98U_dSVmdDwY-aGAxba2XgiLXJlttJvLPtQvU";
const SHEET_NAME = "PYQS";
const SHEET_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

/**************** STATE ****************/
let allQuestions = [];
let questions = [];
let index = 0;
let answered = false;

let stats = { c: 0, i: 0, s: 0, u: 0 };

/**************** DOM ****************/
const filterSidebar = document.getElementById("filter-sidebar");
const statsPanel = document.getElementById("stats-panel");

/**************** TOGGLES ****************/
document.getElementById("filterToggle").onclick = () => {
  filterSidebar.classList.toggle("open");
  document.querySelectorAll(".filter-content")
    .forEach(fc => fc.style.display = "none");
};

document.getElementById("statsToggle").onclick = () => {
  statsPanel.classList.toggle("open");
  document.body.classList.toggle("stats-open");
};

/**************** FETCH ****************/
fetch(SHEET_URL)
  .then(r => r.text())
  .then(t => {
    const json = JSON.parse(t.substring(47).slice(0, -2));

    json.table.rows.forEach(row => {
      if (!row.c[4] || !row.c[11]) return;

      allQuestions.push({
        year: String(row.c[1]?.v || ""),
        topic: String(row.c[13]?.v || ""),
        exam: String(row.c[0]?.v || ""),
        paper: String(row.c[2]?.v || ""),
        subject: String(row.c[12]?.v || ""),
        text: row.c[4].v,
        correct: row.c[11].v.toLowerCase()
      });
    });

    populateFilters();
    questions = [...allQuestions];
    stats.u = questions.length;
    updateStats();
    showQuestion();
  });

/**************** FILTERS ****************/
function populateFilters() {
  fill("yearList", "year");
  fill("topicList", "topic");
  fill("examList", "exam");
  fill("paperList", "paper");
  fill("subjectList", "subject");
}

function fill(id, key) {
  const el = document.getElementById(id);
  el.innerHTML = "";

  [...new Set(allQuestions.map(q => q[key]).filter(Boolean))]
    .sort()
    .forEach(v => {
      el.innerHTML +=
        `<label><input type="checkbox" value="${v}"> ${v}</label>`;
    });
}

document.addEventListener("change", e => {
  if (e.target.type !== "checkbox") return;

  const get = id =>
    [...document.querySelectorAll(`#${id} input:checked`)]
      .map(i => i.value);

  questions = allQuestions.filter(q =>
    (!get("yearList").length || get("yearList").includes(q.year)) &&
    (!get("topicList").length || get("topicList").includes(q.topic)) &&
    (!get("examList").length || get("examList").includes(q.exam)) &&
    (!get("paperList").length || get("paperList").includes(q.paper)) &&
    (!get("subjectList").length || get("subjectList").includes(q.subject))
  );

  index = 0;
  stats = { c: 0, i: 0, s: 0, u: questions.length };
  updateStats();
  showQuestion();
});

/**************** QUESTION ****************/
function showQuestion() {
  answered = false;
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  if (index >= questions.length) return;

  const q = questions[index];

  document.getElementById("question").innerText =
    q.text.replace(/\([a-eA-E]\)[\s\S]*/, "").trim();

  const regex = /\(([a-eA-E])\)\s*([^()]+)(?=\s*\([a-eA-E]\)|$)/g;

  [...q.text.matchAll(regex)].forEach(m => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.dataset.key = m[1].toLowerCase();

    btn.innerHTML = `
      <div class="option-left">
        <div class="option-circle">${m[1].toUpperCase()}</div>
        <div>${m[2]}</div>
      </div>
      <div class="icon"></div>
    `;

    btn.onclick = () => answer(btn);
    optionsDiv.appendChild(btn);
  });
}

/**************** ANSWER ****************/
function answer(btn) {
  if (answered) return;
  answered = true;

  stats.u--;

  const correct = questions[index].correct;

  document.querySelectorAll(".option-btn").forEach(b => {
    const opt = b.dataset.key;

    if (opt === correct) {
      b.classList.add("correct");
      b.querySelector(".icon").innerHTML = "✔";
    }

    if (b === btn && opt !== correct) {
      b.classList.add("wrong");
      b.querySelector(".icon").innerHTML = "✖";
    }

    b.disabled = true;
  });

  btn.dataset.key === correct ? stats.c++ : stats.i++;
  updateStats();

  setTimeout(next, 5000);
}

/**************** SKIP ****************/
document.getElementById("skipBtn").onclick = () => {
  if (answered) return;
  answered = true;

  stats.u--;
  stats.s++;
  updateStats();
  next();
};

function next() {
  index++;
  showQuestion();
}

/**************** STATS UI ****************/
function updateStats() {
  const total = stats.c + stats.i + stats.s + stats.u || 1;

  ["c", "i", "s", "u"].forEach(k => {
    document.getElementById(`count-${k}`).innerText = stats[k];
    document.getElementById(`bar-${k}`).style.width =
      (stats[k] / total) * 100 + "%";
  });
}

/**************** HELPERS ****************/
window.toggleSection = function(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === "block" ? "none" : "block";
};

window.filterList = function(input, id) {
  const v = input.value.toLowerCase();
  document.querySelectorAll(`#${id} label`)
    .forEach(l => {
      l.style.display =
        l.textContent.toLowerCase().includes(v) ? "" : "none";
    });
};

});
