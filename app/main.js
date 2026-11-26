"use strict";
/* StatistikNusa — semua logika situs. Tanpa jaringan, tanpa pustaka luar.
   Angka-angka di bawah ini berasal dari publikasi BPS, Kementerian Kesehatan RI,
   dan Bank Dunia; sumber dan tahun dicantumkan di samping setiap angka. */

/* ---------------- Data ---------------- */
var YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

var TRENDS = {
  growth: {
    label: "Pertumbuhan PDB",
    unit: "%",
    values: [5.02, -2.07, 3.70, 5.31, 5.05, 5.03],
    source: "BPS"
  },
  inflation: {
    label: "Inflasi",
    unit: "%",
    values: [2.72, 1.68, 1.87, 5.51, 2.61, 1.57],
    source: "BPS"
  },
  unemployment: {
    label: "Pengangguran terbuka",
    unit: "%",
    values: [5.28, 7.07, 6.49, 5.86, 5.32, 4.91],
    source: "BPS"
  }
};

var AGE_GROUPS = [
  { label: "0–14 tahun", share: 24.1, note: "≈ 67,9 jt jiwa" },
  { label: "15–64 tahun", share: 69.3, note: "≈ 195,1 jt jiwa" },
  { label: "65+ tahun", share: 6.6, note: "≈ 18,6 jt jiwa" }
];

var SECTORS = [
  { label: "Industri pengolahan", share: 19 },
  { label: "Perdagangan", share: 13 },
  { label: "Pertanian, kehutanan, perikanan", share: 13 },
  { label: "Konstruksi", share: 10 },
  { label: "Pertambangan dan penggalian", share: 10 },
  { label: "Lapangan usaha lainnya", share: 35 }
];

/* Penduduk (juta jiwa) dan luas (km²) pertengahan 2024, BPS. */
var PROVINCES = [
  { name: "Jawa Barat", pop: 50.35, area: 35378 },
  { name: "Jawa Timur", pop: 41.81, area: 47803 },
  { name: "Jawa Tengah", pop: 37.89, area: 32801 },
  { name: "Sumatera Utara", pop: 15.59, area: 72981 },
  { name: "Banten", pop: 12.43, area: 9663 },
  { name: "DKI Jakarta", pop: 10.56, area: 664 },
  { name: "Sulawesi Selatan", pop: 9.34, area: 46717 },
  { name: "Lampung", pop: 9.24, area: 34624 },
  { name: "Sumatera Selatan", pop: 8.84, area: 91592 },
  { name: "Riau", pop: 6.87, area: 87024 }
];

function fmtId(n, decimals) {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/* ---------------- Routing ---------------- */
var PAGES = ["beranda", "penduduk", "ekonomi", "kesehatan", "pendidikan",
  "ketenagakerjaan", "provinsi"];

function currentPage() {
  var h = (location.hash || "#/beranda").replace(/^#\/?/, "");
  return PAGES.indexOf(h) === -1 ? "beranda" : h;
}

function route() {
  var page = currentPage();
  PAGES.forEach(function (p) {
    var el = document.getElementById("page-" + p);
    if (el) el.hidden = (p !== page);
  });
  document.querySelectorAll("[data-nav]").forEach(function (a) {
    a.classList.toggle("active", a.getAttribute("data-nav") === page);
  });
  document.title = "StatistikNusa — " +
    page.charAt(0).toUpperCase() + page.slice(1) + " | Portal Statistik Indonesia";
  window.scrollTo(0, 0);
  drawPageCharts(page);
}

window.addEventListener("hashchange", route);

/* ---------------- Canvas helpers ---------------- */
function ctx2d(id) {
  var c = document.getElementById(id);
  if (!c) return null;
  var ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  return { canvas: c, ctx: ctx };
}

var INK = "#1c2b2b", MUTED = "#5b6b6b", GRID = "#e3eae9",
    ACCENT = "#0b6e63", RED = "#b3261e", GOLD = "#d9a441";

/* Diagram garis dengan sumbu berlabel, garis grid, dan nilai tiap titik. */
function drawLineChart(id, labels, values, unit, highlightIndex, yLabel) {
  var g = ctx2d(id);
  if (!g) return;
  var c = g.canvas, ctx = g.ctx;
  var W = c.width, H = c.height;
  var padL = 56, padR = 24, padT = 26, padB = 38;
  var min = Math.min.apply(null, values.concat([0]));
  var max = Math.max.apply(null, values);
  if (min > 0) min = 0;
  var span = max - min || 1;
  min -= span * 0.12; max += span * 0.12; span = max - min;

  function X(i) { return padL + i * (W - padL - padR) / (labels.length - 1); }
  function Y(v) { return padT + (1 - (v - min) / span) * (H - padT - padB); }

  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  var ticks = 5;
  for (var t = 0; t <= ticks; t++) {
    var v = min + span * t / ticks;
    var y = Y(v);
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.fillText(fmtId(v, 1) + unit, padL - 8, y);
  }
  ctx.fillStyle = MUTED; ctx.textAlign = "left";
  ctx.fillText(yLabel, padL, 12);

  ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
  ctx.beginPath();
  values.forEach(function (v, i) { i === 0 ? ctx.moveTo(X(i), Y(v)) : ctx.lineTo(X(i), Y(v)); });
  ctx.stroke();

  ctx.textAlign = "center"; ctx.textBaseline = "top";
  values.forEach(function (v, i) {
    var x = X(i), y = Y(v);
    ctx.beginPath();
    ctx.arc(x, y, i === highlightIndex ? 7 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = i === highlightIndex ? RED : ACCENT;
    ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = i === highlightIndex ? RED : INK;
    ctx.font = (i === highlightIndex ? "bold 13px" : "12px") + " system-ui, sans-serif";
    var labelY = y - 24;
    if (v < 0) labelY = y + 12;
    /* Jepit label ke dalam kanvas: label titik pertama/terakhir yang
       berpusat di titiknya bisa terpotong di tepi kiri/kanan. */
    var labelX = Math.max(30, Math.min(W - 30, x));
    ctx.fillText(fmtId(v, 2) + unit, labelX, labelY);
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = MUTED;
    ctx.fillText(String(labels[i]), x, H - padB + 10);
  });
}

/* Diagram batang vertikal dengan nilai di atas batang. */
function drawBarChart(id, items, valueSuffix) {
  var g = ctx2d(id);
  if (!g) return;
  var c = g.canvas, ctx = g.ctx;
  var W = c.width, H = c.height;
  var padL = 56, padR = 20, padT = 26, padB = 44;
  var max = Math.max.apply(null, items.map(function (d) { return d.share; }));
  max = Math.ceil(max / 10) * 10;
  var plotW = W - padL - padR, plotH = H - padT - padB;
  var slot = plotW / items.length;
  var barW = Math.min(120, slot * 0.55);

  ctx.font = "12px system-ui, sans-serif";
  for (var t = 0; t <= 4; t++) {
    var v = max * t / 4;
    var y = padT + plotH * (1 - t / 4);
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillStyle = MUTED; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillText(fmtId(v, 0) + valueSuffix, padL - 8, y);
  }
  ctx.fillStyle = MUTED; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText("Pangsa penduduk (%)", padL, 12);

  items.forEach(function (d, i) {
    var x = padL + slot * i + (slot - barW) / 2;
    var h = plotH * d.share / max;
    var y = padT + plotH - h;
    ctx.fillStyle = i === 1 ? ACCENT : (i === 0 ? "#3d9b8f" : GOLD);
    ctx.fillRect(x, y, barW, h);
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText(fmtId(d.share, 1) + "%", x + barW / 2, y - 8);
    ctx.font = "12px system-ui, sans-serif"; ctx.fillStyle = MUTED;
    ctx.fillText(d.label, x + barW / 2, H - padB + 16);
    ctx.fillText(d.note, x + barW / 2, H - padB + 32);
  });
}

/* Diagram batang horizontal dengan nilai di ujung batang. */
function drawHBarChart(id, items) {
  var g = ctx2d(id);
  if (!g) return;
  var c = g.canvas, ctx = g.ctx;
  var W = c.width, H = c.height;
  var padL = 230, padR = 56, padT = 14, padB = 14;
  var max = Math.max.apply(null, items.map(function (d) { return d.share; }));
  var slot = (H - padT - padB) / items.length;
  var barH = Math.min(30, slot * 0.55);

  items.forEach(function (d, i) {
    var y = padT + slot * i + (slot - barH) / 2;
    var w = (W - padL - padR) * d.share / max;
    ctx.fillStyle = i === 0 ? ACCENT : "#3d9b8f";
    ctx.fillRect(padL, y, w, barH);
    ctx.fillStyle = INK; ctx.font = "13px system-ui, sans-serif";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillText(d.label, padL - 10, y + barH / 2);
    ctx.textAlign = "left"; ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText(d.share + "%", padL + w + 8, y + barH / 2);
  });
  /* Keterangan sumbu sudah ada di .chart-note HTML di bawah canvas,
     jadi tidak digambar lagi di dalam kanvas (sebelumnya terduplikasi). */
}

/* ---------------- Charts per page ---------------- */
function drawPageCharts(page) {
  if (page === "beranda") {
    drawLineChart("homeTrend", YEARS, TRENDS.growth.values, "%", 5, "Pertumbuhan PDB (%)");
  } else if (page === "penduduk") {
    drawBarChart("ageChart", AGE_GROUPS, "%");
  } else if (page === "ekonomi") {
    drawHBarChart("sectorChart", SECTORS);
    updateTrendChart();
  } else if (page === "ketenagakerjaan") {
    drawLineChart("unempChart", YEARS, TRENDS.unemployment.values, "%", 5,
      "Pengangguran terbuka (%)");
  }
}

/* ---------------- Trend chart controls ---------------- */
function updateTrendChart() {
  var metric = document.getElementById("trendMetric").value;
  var year = parseInt(document.getElementById("trendYear").value, 10);
  var t = TRENDS[metric];
  var idx = YEARS.indexOf(year);
  drawLineChart("trendChart", YEARS, t.values, t.unit, idx, t.label + " (%)");
  var detail = document.getElementById("trendDetail");
  detail.textContent = year + " — " + t.label + ": " + fmtId(t.values[idx], 2) +
    t.unit + ". Sumber: " + t.source + ".";
}

document.getElementById("trendMetric").addEventListener("change", updateTrendChart);
document.getElementById("trendYear").addEventListener("change", updateTrendChart);

/* ---------------- GDP unit toggle ---------------- */
var gdpUnit = "idr";
document.querySelectorAll("#gdpUnitToggle button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    gdpUnit = btn.getAttribute("data-unit");
    document.querySelectorAll("#gdpUnitToggle button").forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var total = document.getElementById("gdpTotal");
    var perCap = document.getElementById("gdpPerCapita");
    if (gdpUnit === "idr") {
      total.innerHTML = "Rp22.139 <span>triliun</span>";
      perCap.innerHTML = "Rp78,6 <span>juta</span>";
    } else {
      total.innerHTML = "US$1.396 <span>triliun</span>";
      perCap.innerHTML = "US$4.960";
    }
  });
});

/* ---------------- Province table ---------------- */
var provSort = { key: "pop", dir: -1 };
var provUnit = "jt";
var provQuery = "";

function density(p) { return p.pop * 1e6 / p.area; }

function renderProvTable() {
  var tbody = document.querySelector("#provTable tbody");
  var q = provQuery.trim().toLowerCase();
  var rows = PROVINCES.filter(function (p) {
    return !q || p.name.toLowerCase().indexOf(q) !== -1;
  });
  rows.sort(function (a, b) {
    var ka = provSort.key === "name" ? a.name : (provSort.key === "density" ? density(a) : a[provSort.key]);
    var kb = provSort.key === "name" ? b.name : (provSort.key === "density" ? density(b) : b[provSort.key]);
    if (ka < kb) return -1 * provSort.dir;
    if (ka > kb) return 1 * provSort.dir;
    return 0;
  });
  tbody.innerHTML = rows.map(function (p) {
    var popText = provUnit === "jt"
      ? fmtId(p.pop, 2)
      : fmtId(Math.round(p.pop * 1000), 0);
    return "<tr><td>" + p.name + "</td><td class=\"num\">" + popText + "</td>" +
      "<td class=\"num\">" + fmtId(p.area, 0) + "</td>" +
      "<td class=\"num\">" + fmtId(Math.round(density(p)), 0) + "</td></tr>";
  }).join("") || "<tr><td colspan=\"4\">Tidak ada provinsi yang cocok dengan pencarian.</td></tr>";

  document.getElementById("provCount").textContent =
    "Menampilkan " + rows.length + " dari 10 provinsi" +
    (q ? " untuk pencarian “" + provQuery.trim() + "”" : "") +
    ". Penduduk dalam " + (provUnit === "jt" ? "juta jiwa" : "ribu jiwa") + ".";

  document.querySelectorAll("#provTable th[data-sort]").forEach(function (th) {
    var ind = th.querySelector(".sort-ind");
    ind.textContent = th.getAttribute("data-sort") === provSort.key
      ? (provSort.dir === 1 ? " ▲" : " ▼") : "";
  });
}

document.querySelectorAll("#provTable th[data-sort]").forEach(function (th) {
  th.addEventListener("click", function () {
    var key = th.getAttribute("data-sort");
    if (provSort.key === key) provSort.dir *= -1;
    else provSort = { key: key, dir: key === "name" ? 1 : -1 };
    renderProvTable();
  });
});

document.getElementById("provSearch").addEventListener("input", function (e) {
  provQuery = e.target.value;
  renderProvTable();
});

document.querySelectorAll("#popUnitToggle button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    provUnit = btn.getAttribute("data-unit");
    document.querySelectorAll("#popUnitToggle button").forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    renderProvTable();
  });
});

/* ---------------- Init ---------------- */
renderProvTable();
route();
