document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */
  const SHEET_ID = "1--MzYQ98U_dSVmdDwY-aGAxba2XgiLXJlttJvLPtQvU";
  const SHEET_NAME = "PYQs";
  const SHEET_URL =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

  /* ================= STATE ================= */
  let allQuestions = [];
  let questions = [];
  let index = 0;
  let answered = false;

  let stats = { c: 0, i: 0, s: 0, u: 0 };

  /* ================= FETCH DATA ================= */
  fetch(SHEET_URL)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text.substring(47).slice(0, -2));

      json.table.rows.forEach(row => {
        if (!row.c[4] || !row.c[11]) return;

        allQuestions.push({
          exam: row.c[0]?.v || "",
          year: row.c[1]?.v || "",
          paper: row.c[2]?.v || "",
          question: row.c[4].v,
          correct: row.c[11].v.toLowerCase(),
          subject: row.c[12]?.v || "",
          topic: row.c[13]?.v || ""
        });
      });

      questions = [...allQuestions];
      stats.u = questions.length;

      populateFilters();
      updateStats();
      showQuestion();
    });

  /* ================= FILTERS ================= */
  function populateFilters() {
    fillFilter("filter-exam", "exam");
    fillFilter("filter-year", "year");
    fillFilter("filter-paper", "paper");
    fillFilter("filter-subject", "subject");
    fillFilter("filter-topic", "topic");
  }

  function fillFilter(id, key) {
    const el = document.getElementById(id);
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
  }

  document.addEventListener("change", e => {
    if (e.target.type !== "checkbox") return;

    const get = id =>
      [...document.querySelectorAll(`#${id} input:checked`)]
        .map(i => i.value);

    questions = allQuestions.filter(q =>
      (!get("filter-exam").length || get("filter-exam").includes(q.exam)) &&
      (!get("filter-year").length || get("filter-year").includes(q.year)) &&
      (!get("filter-paper").length || get("filter-paper").includes(q.paper)) &&
      (!get("filter-subject").length || get("filter-subject").includes(q.subject)) &&
      (!get("filter-topic").length || get("filter-topic").includes(q.topic))
    );

    index = 0;
    stats = { c: 0, i: 0, s: 0, u: questions.length };
    updateStats();
    showQuestion();
  });

  /* ================= SHOW QUESTION ================= */
  function showQuestion() {
    answered = false;

    if (index >= questions.length) {
      showResult();
      return;
    }

    const q = questions[index];

    document.getElementById("exam-name").innerText = q.exam;
    document.getElementById("exam-year").innerText = q.year;
    document.getElementById("exam-paper").innerText = q.paper;

    const questionText = q.question.replace(/\([a-e]\)[\s\S]*/i, "").trim();
    document.getElementById("question").innerText = questionText;

    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";

    const regex = /\(([a-e])\)\s*([^()]+)/gi;
    [...q.question.matchAll(regex)].forEach(m => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.dataset.key = m[1].toLowerCase();
      btn.innerText = `${m[1].toUpperCase()}. ${m[2]}`;
      btn.onclick = () => answer(btn);
      optionsDiv.appendChild(btn);
    });
  }

  /* ================= ANSWER ================= */
  function answer(btn) {
    if (answered) return;
    answered = true;

    stats.u--;
    const correct = questions[index].correct;

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.dataset.key === correct) b.classList.add("correct");
      if (b === btn && b.dataset.key !== correct) b.classList.add("wrong");
    });

    btn.dataset.key === correct ? stats.c++ : stats.i++;
    updateStats();

    setTimeout(next, 1200);
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

  function next() {
    index++;
    showQuestion();
  }

  /* ================= STATS ================= */
  function updateStats() {
    const total = stats.c + stats.i + stats.s + stats.u || 1;

    ["c", "i", "s", "u"].forEach(k => {
      document.getElementById(`count-${k}`).innerText = stats[k];
      document.getElementById(`bar-${k}`).style.width =
        (stats[k] / total) * 100 + "%";
    });
  }

  /* ================= RESULT ================= */
  function showResult() {
    const total = stats.c + stats.i + stats.s + stats.u;

    const deg = v => (v / total) * 360;
    const c = deg(stats.c);
    const i = c + deg(stats.i);
    const s = i + deg(stats.s);

    document.getElementById("donutChart").style.background =
      `conic-gradient(
        #fff 0deg ${c}deg,
        #777 ${c}deg ${i}deg,
        #444 ${i}deg ${s}deg,
        #222 ${s}deg 360deg
      )`;

    document.getElementById("r-c").innerText = stats.c;
    document.getElementById("r-i").innerText = stats.i;
    document.getElementById("r-s").innerText = stats.s;
    document.getElementById("r-u").innerText = stats.u;

    document.getElementById("resultOverlay").style.display = "flex";
  }

});
