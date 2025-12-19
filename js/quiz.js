document.addEventListener("DOMContentLoaded", () => {

  /* ================= FILTER TOGGLE ================= */
  document.querySelectorAll(".filter-group h4").forEach(h => {
    h.addEventListener("click", () => {
      h.parentElement.classList.toggle("open");
    });
  });

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

  /* ================= FETCH ================= */
  fetch(SHEET_URL)
    .then(r => r.text())
    .then(t => {
      const json = JSON.parse(t.substring(47).slice(0, -2));

      json.table.rows.forEach(r => {
        if (!r.c[4] || !r.c[11]) return;
        allQuestions.push({
          exam: r.c[0]?.v || "",
          year: r.c[1]?.v || "",
          paper: r.c[2]?.v || "",
          question: r.c[4].v,
          correct: r.c[11].v.toLowerCase(),
          subject: r.c[12]?.v || "",
          topic: r.c[13]?.v || ""
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
      .forEach(v => {
        el.innerHTML += `
          <label>
            <input type="checkbox" value="${v}"> ${v}
          </label>`;
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

  /* ================= QUESTION ================= */
  function showQuestion() {
    answered = false;
    if (index >= questions.length) return showResult();

    const q = questions[index];

    document.getElementById("exam-info").innerText =
      `${q.exam} ${q.year}`.trim();
    document.getElementById("exam-paper").innerText = q.paper;

    document.getElementById("question").innerText =
      q.question.replace(/\([a-e]\)[\s\S]*/i, "").trim();

    const opt = document.getElementById("options");
    opt.innerHTML = "";

    [...q.question.matchAll(/\(([a-e])\)\s*([^()]+)/gi)]
      .forEach(m => {
        const b = document.createElement("button");
        b.className = "option-btn";
        b.dataset.key = m[1].toLowerCase();
        b.innerText = `${m[1].toUpperCase()}. ${m[2]}`;
        b.onclick = () => answer(b);
        opt.appendChild(b);
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
    document.getElementById("resultOverlay").style.display = "flex";
  }

});
