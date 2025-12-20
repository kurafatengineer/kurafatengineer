/* ================= SOUNDS ================= */
const correctSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
);
const wrongSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
);
let soundEnabled = true;

/* ================= MEDIUM ================= */
let currentMedium = "en";

/* ================= DOM READY ================= */
document.addEventListener("DOMContentLoaded", () => {

  mediumToggleSwitch.onchange = e => {
    currentMedium = e.target.checked ? "hi" : "en";
    loadQuestion();
  };

  soundSwitch.onchange = e => {
    soundEnabled = e.target.checked;
  };

  filterToggleSwitch.onchange = e => {
    filters.style.display = e.target.checked ? "block" : "none";
  };

  progressToggleSwitch.onchange = e => {
    progress.style.display = e.target.checked ? "block" : "none";
  };

  document.querySelectorAll("#filters details").forEach(d => {
    d.addEventListener("toggle", () => {
      if (d.open) {
        document.querySelectorAll("#filters details")
          .forEach(o => o !== d && (o.open = false));
      }
    });
  });
});

/* ================= DATA ================= */
const sheetId = "1--MzYQ98U_dSVmdDwY-aGAxba2XgiLXJlttJvLPtQvU";
const sheetName = "PYQs";
const query = encodeURIComponent("SELECT A,B,C,E,K,L,M,N");
const url =
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}&tq=${query}`;

let allQuestions = [];
let questions = [];
let progressState = [];
let current = 0;

const filtersMap = {
  exam: "examBox",
  year: "yearBox",
  paper: "paperBox",
  subject: "subjectBox",
  topic: "topicBox"
};

/* ================= FETCH + NORMALISATION ================= */
fetch(url)
  .then(r => r.text())
  .then(t => {
    const json = JSON.parse(t.substring(47).slice(0, -2));
    allQuestions = [];

    json.table.rows.forEach(r => {

      const exams = String(r.c[0]?.v || "")
        .split(/\n+/).map(x => x.trim()).filter(Boolean);

      const years = String(r.c[1]?.v || "")
        .split(/\n+/).map(x => x.trim()).filter(Boolean);

      const paper = String(r.c[2]?.v || "");
      const en = r.c[3]?.v || "";
      const hi = r.c[4]?.v || "";
      const correct = r.c[5]?.v?.toLowerCase() || "";
      const subject = String(r.c[6]?.v || "");
      const topic = String(r.c[7]?.v || "");

      exams.forEach((exam, i) => {
        const year = years[i] || years[0] || "";
        allQuestions.push({
          exam, year, paper, en, hi, correct, subject, topic
        });
      });
    });

    updateAllFilters();
    applyFilters();
  });

/* ================= FILTER HELPERS ================= */
function getChecked(key) {
  return [...document.querySelectorAll(`#${filtersMap[key]} input:checked`)]
    .map(cb => cb.value);
}

function getActiveBase(except = null) {
  return allQuestions.filter(q =>
    Object.keys(filtersMap).every(k => {
      if (k === except) return true;
      const c = getChecked(k);
      return !c.length || c.includes(q[k]);
    })
  );
}

/* ================= FILTER UPDATE ================= */
function updateAllFilters() {
  Object.keys(filtersMap).forEach(updateFilter);
}

function updateFilter(key) {
  const box = document.getElementById(filtersMap[key]);
  const checked = getChecked(key);
  const values = [...new Set(
    getActiveBase(key).map(q => q[key]).filter(Boolean)
  )];

  values.sort((a, b) =>
    checked.includes(a) === checked.includes(b)
      ? a.localeCompare(b)
      : checked.includes(a) ? -1 : 1
  );

  box.innerHTML = "";
  values.forEach(v => {
    const label = document.createElement("label");
    label.dataset.value = v.toLowerCase();

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = v;
    cb.checked = checked.includes(v);
    cb.onchange = () => {
      updateAllFilters();
      applyFilters();
    };

    label.append(cb, " " + v);
    box.append(label, document.createElement("br"));
  });
}

/* ================= SEARCH ================= */
function searchCheckbox(input, boxId) {
  const txt = input.value.toLowerCase();
  const box = document.getElementById(boxId);
  const labels = [...box.querySelectorAll("label")];

  const matched = labels.filter(l => l.dataset.value.includes(txt));
  const unmatched = labels.filter(l => !l.dataset.value.includes(txt));

  box.innerHTML = "";
  [...matched, ...unmatched].forEach(l => {
    l.style.display = matched.includes(l) ? "" : "none";
    box.append(l, document.createElement("br"));
  });
}

/* ================= FINAL OPTION PARSER (YOUR RULE) ================= */
function parseQuestion(text) {
  if (!text) return { q: "", o: {} };

  const lines = text.replace(/\r/g, "").split("\n");

  let questionLines = [];
  let options = {};

  lines.forEach(line => {
    const m = line.match(/^\(([a-e])\)\s*(.*)$/);
    if (m) {
      options[m[1]] = m[2].trim();
    } else {
      questionLines.push(line);
    }
  });

  return {
    q: questionLines.join("\n").trim(), // KEEP LINE BREAKS
    o: options
  };
}

/* ================= QUIZ ================= */
function applyFilters() {
  questions = getActiveBase();
  current = 0;
  progressState = Array(questions.length).fill("U");

  progressBar.max = questions.length;
  progressBar.value = 0;

  loadQuestion();
  updateProgress();
}

function loadQuestion() {
  if (current >= questions.length) return;

  const qObj = questions[current];
  const parsed = parseQuestion(qObj[currentMedium]);

  quizMetaExam.innerText = `${qObj.exam} – ${qObj.year}`;
  quizMetaSubject.innerText = `${qObj.subject}`;
  quizMetaPaper.innerText = `${qObj.paper}`;

  question.innerText = parsed.q;
  options.innerHTML = "";

  Object.keys(parsed.o).forEach(k => {
    const b = document.createElement("button");
    b.innerText = `(${k}) ${parsed.o[k]}`;
    b.onclick = () => answerQuestion(k);
    options.append(b, document.createElement("br"));
  });
}

function answerQuestion(ans) {
  const isCorrect = ans === questions[current].correct;

  if (soundEnabled) {
    const s = isCorrect ? correctSound : wrongSound;
    s.currentTime = 0;
    s.play().catch(() => {});
  }

  progressState[current] = isCorrect ? "C" : "I";
  next();
}

function skipQuestion() {
  progressState[current] = "S";
  next();
}

function next() {
  current++;
  updateProgress();
  progressState.every(p => p !== "U")
    ? showResult()
    : loadQuestion();
}

/* ================= PROGRESS ================= */
function updateProgress() {
  let c = { C: 0, I: 0, S: 0, U: 0 };
  progressState.forEach(p => c[p]++);

  counts.innerText =
    `Correct: ${c.C} | Incorrect: ${c.I} | Skipped: ${c.S} | Unattempted: ${c.U}`;

  progressBar.value = c.C + c.I + c.S;
}

/* ================= RESULT ================= */
function showResult() {
  title.style.display = "none";
  controls.style.display = "none";
  filters.style.display = "none";
  quiz.style.display = "none";
  progress.style.display = "none";
  document.querySelectorAll("hr").forEach(hr => hr.style.display = "none");

  resultCard.style.display = "block";
  drawDonut();
}

resultCard.onclick = restartQuiz;

function restartQuiz() {
  resultCard.style.display = "none";

  title.style.display = "block";
  controls.style.display = "block";
  filters.style.display = filterToggleSwitch.checked ? "block" : "none";
  quiz.style.display = "block";
  progress.style.display = progressToggleSwitch.checked ? "block" : "none";
  document.querySelectorAll("hr").forEach(hr => hr.style.display = "block");

  currentMedium = "en";
  mediumToggleSwitch.checked = false;

  soundEnabled = true;
  soundSwitch.checked = true;

  document.querySelectorAll("#filters input")
    .forEach(i => i.type === "checkbox" ? i.checked = false : i.value = "");

  updateAllFilters();
  applyFilters();
}

/* ================= DONUT ================= */
function drawDonut() {
  const ctx = donut.getContext("2d");
  ctx.clearRect(0, 0, 220, 220);

  let c = { C: 0, I: 0, S: 0 };
  progressState.forEach(p => p !== "U" && c[p]++);

  const total = c.C + c.I + c.S;
  let angle = -Math.PI / 2;

  [
    { v: c.C, col: "#4CAF50" },
    { v: c.I, col: "#F44336" },
    { v: c.S, col: "#FFC107" }
  ].forEach(d => {
    const slice = (d.v / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(110, 110);
    ctx.arc(110, 110, 90, angle, angle + slice);
    ctx.fillStyle = d.col;
    ctx.fill();
    angle += slice;
  });
}
