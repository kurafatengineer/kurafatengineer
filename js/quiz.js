const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1--MzYQ98U_dSVmdDwY-aGAxba2XgiLXJlttJvLPtQvU/gviz/tq?tqx=out:csv";

const MAINS_PAPERS = [
    "GS Paper 01","GS Paper 02","GS Paper 03","GS Paper 04",
    "Essay","English","Optional 01","Optional 02"
];

let rawData = [];
let filteredData = [];
let currentIndex = 0;
let medium = "English";
let soundOn = true;

let progress = {
    C: 0,
    I: 0,
    S: 0,
    U: 0
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeaderFooter();
    await loadData();
    setupToggles();
    setupMediumToggle();
    initFilters();
    applyFilters();
});

async function loadHeaderFooter() {
    document.getElementById("header").innerHTML =
        await fetch("partials/header.html").then(r => r.text());
    document.getElementById("footer").innerHTML =
        await fetch("partials/footer.html").then(r => r.text());
}

async function loadData() {
    const csv = await fetch(SHEET_URL).then(r => r.text());
    const rows = csv.split("\n").map(r => r.split(","));
    const headers = rows.shift();

    rawData = rows.map(r => ({
        exam: r[0]?.replace(/"/g,"").split("\n"),
        year: r[1]?.replace(/"/g,"").split("\n"),
        paper: r[2]?.replace(/"/g,""),
        qEn: r[4]?.replace(/"/g,""),
        qHi: r[10]?.replace(/"/g,""),
        correct: r[11]?.replace(/"/g,""),
        subject: r[12]?.replace(/"/g,""),
        topic: r[13]?.replace(/"/g,""),
        status: "U"
    }));

    progress.U = rawData.length;
}

function setupToggles() {
    document.getElementById("filterToggle").onclick = () => {
        toggleDisplay("filters");
    };
    document.getElementById("progressToggle").onclick = () => {
        toggleDisplay("progress");
    };
    document.getElementById("soundToggle").onclick = (e) => {
        soundOn = !soundOn;
        e.target.textContent = soundOn ? "Sound: ON" : "Sound: OFF";
    };
}

function setupMediumToggle() {
    document.querySelectorAll("input[name='medium']").forEach(r => {
        r.onchange = () => {
            medium = r.value;
            renderQuestion();
        };
    });
}

function initFilters() {
    document.querySelectorAll(".filter").forEach(filter => {
        const type = filter.dataset.filter;
        const values = new Set();

        rawData.forEach(d => {
            if (type === "Year") d.year.forEach(v => values.add(v));
            if (type === "Exam") d.exam.forEach(v => values.add(v));
            if (type === "Paper") values.add(d.paper);
            if (type === "Subject") values.add(d.subject);
            if (type === "Topic") values.add(d.topic);
        });

        const optionsDiv = filter.querySelector(".options");
        [...values].sort().forEach(v => {
            const label = document.createElement("label");
            label.innerHTML = `<input type="checkbox" value="${v}"> ${v}`;
            optionsDiv.appendChild(label);
        });

        filter.querySelectorAll("input[type='checkbox']").forEach(cb => {
            cb.onchange = applyFilters;
        });

        filter.querySelector("input[type='text']").oninput = e => {
            const q = e.target.value.toLowerCase();
            optionsDiv.querySelectorAll("label").forEach(l => {
                l.style.display = l.textContent.toLowerCase().includes(q)
                    ? "block" : "none";
            });
        };
    });
}

function applyFilters() {
    filteredData = rawData.filter(d => {
        return matchFilter("Year", d.year) &&
               matchFilter("Exam", d.exam) &&
               matchFilter("Paper", [d.paper]) &&
               matchFilter("Subject", [d.subject]) &&
               matchFilter("Topic", [d.topic]);
    });

    resetProgress();
    currentIndex = 0;

    if (filteredData.length === 0) return;

    if (MAINS_PAPERS.includes(filteredData[0].paper)) {
        showMains();
    } else {
        showQuiz();
    }
}

function matchFilter(type, values) {
    const checked = [...document.querySelectorAll(`.filter[data-filter="${type}"] input[type="checkbox"]:checked`)]
        .map(cb => cb.value);
    if (checked.length === 0) return true;
    return values.some(v => checked.includes(v));
}

function showQuiz() {
    toggleDisplay("quiz", true);
    toggleDisplay("mains", false);
    toggleDisplay("progress", true);
    renderQuestion();
}

function showMains() {
    toggleDisplay("quiz", false);
    toggleDisplay("progress", false);
    toggleDisplay("result", false);
    toggleDisplay("mains", true);

    const div = document.getElementById("mainsContent");
    div.innerHTML = "";
    filteredData.forEach(d => {
        const p = document.createElement("p");
        p.textContent = d.qEn;
        div.appendChild(p);
    });
}

function renderQuestion() {
    if (!filteredData[currentIndex]) return;

    const q = filteredData[currentIndex];
    const text = medium === "English" ? q.qEn : q.qHi;

    const parts = splitQuestion(text);

    document.getElementById("quizMeta").textContent =
        `${q.exam.join(", ")} - ${q.year.join(", ")} | ${q.paper}`;

    document.getElementById("question").textContent = parts.question;

    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";

    parts.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.onclick = () => answer(opt[1].toLowerCase(), q.correct);
        optionsDiv.appendChild(btn);
    });

    document.getElementById("skipBtn").onclick = skip;
}

function splitQuestion(text) {
    const lines = text.split("\n");
    const qLines = [];
    const opts = [];

    lines.forEach(l => {
        if (l.trim().match(/^\([a-e]\)/i)) opts.push(l.trim());
        else qLines.push(l);
    });

    return {
        question: qLines.join("\n"),
        options: opts
    };
}

function answer(selected, correct) {
    const q = filteredData[currentIndex];
    q.status = selected === correct ? "C" : "I";
    next();
}

function skip() {
    filteredData[currentIndex].status = "S";
    next();
}

function next() {
    currentIndex++;
    updateProgress();

    if (progress.U === 0) {
        showResult();
    } else {
        renderQuestion();
    }
}

function resetProgress() {
    progress = { C:0, I:0, S:0, U:filteredData.length };
    filteredData.forEach(d => d.status = "U");
    updateProgress();
}

function updateProgress() {
    progress = { C:0, I:0, S:0, U:0 };
    filteredData.forEach(d => progress[d.status]++);
    document.getElementById("progressStats").textContent =
        `C:${progress.C} I:${progress.I} S:${progress.S} U:${progress.U}`;
}

function showResult() {
    ["filters","quiz","progress","mains","toggles"].forEach(id => toggleDisplay(id,false));
    toggleDisplay("result", true);
    drawChart();

    document.getElementById("restart").onclick = () => location.reload();
}

function drawChart() {
    const ctx = document.getElementById("resultChart").getContext("2d");
    const total = progress.C + progress.I + progress.S + progress.U;
    let start = 0;

    [["C","green"],["I","red"],["S","orange"],["U","gray"]].forEach(([k,color]) => {
        const val = progress[k] / total * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(150,150);
        ctx.arc(150,150,140,start,start+val);
        ctx.fillStyle = color;
        ctx.fill();
        start += val;
    });
}

function toggleDisplay(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = show === undefined
        ? (el.style.display === "none" ? "block" : "none")
        : (show ? "block" : "none");
}
