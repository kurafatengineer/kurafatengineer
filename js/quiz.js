document.addEventListener("DOMContentLoaded", () => {

const SHEET_ID = "1--MzYQ98U_dSVmdDwY-aGAxba2XgiLXJlttJvLPtQvU";
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=PYQs`;

let allQuestions = [];
let questions = [];
let index = 0;
let answered = false;

let stats = { c: 0, i: 0, s: 0, u: 0 };

/* ---------------- TOGGLES ---------------- */
toggleFilter.onclick = () =>
  filterPanel.classList.toggle("hidden");

toggleProgress.onclick = () =>
  progressPanel.classList.toggle("hidden");

/* ---------------- FILTER COLLAPSE ---------------- */
document.querySelectorAll(".filter-group h4").forEach(h => {
  h.onclick = () => h.parentElement.classList.toggle("open");
});

/* ---------------- FETCH DATA ---------------- */
fetch(URL)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));

    json.table.rows.forEach(row => {
      if (!row.c[4] || !row.c[11]) return;

      allQuestions.push({
        exam: row.c[0]?.v || "",
        year: row.c[1]?.v || "",
        paper: row.c[2]?.v || "",
        questionRaw: row.c[4].v,
        correct: row.c[11].v.toLowerCase(), // FIX
        subject: row.c[12]?.v || "",
        topic: row.c[13]?.v || ""
      });
    });

    populateFilters();
    applyFilters();   // IMPORTANT
  });

/* ---------------- FILTERS ---------------- */
function populateFilters() {
  ["exam","year","paper","subject","topic"].forEach(key => {
    const el = document.getElementById(`filter-${key}`);
    el.innerHTML = "";

    [...new Set(allQuestions.map(q => q[key]).filter(Boolean))]
      .sort()
      .forEach(val => {
        el.innerHTML += `
          <label>
            <input type="checkbox" value="${val}">
            ${val}
          </label>
        `;
      });
  });
}

document.addEventListener("change", e => {
  if (e.target.type === "checkbox") applyFilters();
});

function applyFilters() {
  const get = id =>
    [...document.querySelectorAll(`#filter-${id} input:checked`)]
      .map(i => i.value);

  const hasFilter =
    ["exam","year","paper","subject","topic"]
    .some(k => get(k).length);

  questions = hasFilter
    ? allQuestions.filter(q =>
        (!get("exam").length || get("exam").includes(q.exam)) &&
        (!get("year").length || get("year").includes(q.year)) &&
        (!get("paper").length || get("paper").includes(q.paper)) &&
        (!get("subject").length || get("subject").includes(q.subject)) &&
        (!get("topic").length || get("topic").includes(q.topic))
      )
    : [...allQuestions]; // FIX

  index = 0;
  stats = { c: 0, i: 0, s: 0, u: questions.length };
  updateStats();
  showQuestion();
}

/* ---------------- SHOW QUESTION ---------------- */
function showQuestion() {
  answered = false;

  if (!questions.length || index >= questions.length) {
    question.innerText = "No questions found.";
    options.innerHTML = "";
    return;
  }

  const q = questions[index];

  examCombined.innerText = `${q.exam} • ${q.year}`;
  examPaper.innerText = q.paper;

  /* Extract question text safely */
  const split = q.questionRaw.split(/\([A-Da-d]\)/);
  question.innerText = split[0].trim();

  options.innerHTML = "";

  /* Extract options */
  const regex = /\(([A-Da-d])\)\s*([^()]+)/g;
  let match;

  while ((match = regex.exec(q.questionRaw)) !== null) {
    const key = match[1].toLowerCase();
    const text = match[2].trim();

    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML = `<span class="key">${key.toUpperCase()}</span>${text}`;
    btn.onclick = () => answer(btn, key);
    options.appendChild(btn);
  }
}

/* ---------------- ANSWER ---------------- */
function answer(btn, key) {
  if (answered) return;
  answered = true;

  stats.u--;

  document.querySelectorAll(".option-btn").forEach(b => {
    const k = b.querySelector(".key").innerText.toLowerCase();
    if (k === questions[index].correct) b.classList.add("correct");
  });

  key === questions[index].correct ? stats.c++ : stats.i++;
  updateStats();

  setTimeout(() => {
    index++;
    showQuestion();
  }, 900);
}

/* ---------------- SKIP ---------------- */
skipBtn.onclick = () => {
  if (answered) return;
  stats.u--;
  stats.s++;
  index++;
  updateStats();
  showQuestion();
};

/* ---------------- STATS ---------------- */
function updateStats() {
  const total = stats.c + stats.i + stats.s + stats.u || 1;

  ["c","i","s","u"].forEach(k => {
    document.getElementById(`count-${k}`).innerText = stats[k];
    document.getElementById(`bar-${k}`).style.width =
      (stats[k] / total) * 100 + "%";
  });
}

});
