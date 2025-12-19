document.addEventListener("DOMContentLoaded", () => {

/* ================= CONFIG ================= */
const SHEET_ID = "1--MzYQ98U_dSVmdDwY-aGAxba2XgiLXJlttJvLPtQvU";
const SHEET_NAME = "PYQS";
const SHEET_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

/* ================= STATE ================= */
let allQuestions = [];
let questions = [];
let index = 0;
let answered = false;

let stats = { c: 0, i: 0, s: 0, u: 0 };

/* ================= FETCH ================= */
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

    questions = [...allQuestions];
    stats.u = questions.length;
    updateStats();
    showQuestion();
  });

/* ================= QUESTION ================= */
function showQuestion() {
  answered = false;
  if (index >= questions.length) return;

  const q = questions[index];
  document.getElementById("question").innerText =
    q.text.replace(/\([a-eA-E]\)[\s\S]*/, "").trim();
}

/* ================= ANSWER ================= */
function answer(isCorrect) {
  if (answered) return;
  answered = true;

  stats.u--;
  isCorrect ? stats.c++ : stats.i++;

  updateStats();
  next();
}

/* ================= SKIP ================= */
document.getElementById("skipBtn").onclick = () => {
  if (answered) return;
  answered = true;

  stats.u--;
  stats.s++;
  updateStats();
  next();
};

/* ================= NEXT ================= */
function next() {
  index++;
  showQuestion();
  checkCompletion();
}

/* ================= STATS ================= */
function updateStats() {
  ["c", "i", "s", "u"].forEach(k => {
    document.getElementById(`count-${k}`).innerText = stats[k];
  });
}

/* ================= COMPLETION ================= */
function checkCompletion() {
  if (stats.u === 0) {
    showResult();
    setTimeout(resetQuiz, 10000);
  }
}

/* ================= RESULT ================= */
function showResult() {
  document.getElementById("resultOverlay").style.display = "flex";
}

/* ================= RESET ================= */
function resetQuiz() {
  document.getElementById("resultOverlay").style.display = "none";

  index = 0;
  answered = false;
  stats = { c: 0, i: 0, s: 0, u: questions.length };

  updateStats();
  showQuestion();
}

});
