const STORAGE_KEY = "lead_records_demo_v7";
const TARGETS_KEY = "lead_targets_by_year_demo_v7";

const FIXED_CATEGORIES = ["Lug AM", "Lug MCC", "Paste"];

const departmentLineMap = {
  AM: ["COS8", "A line", "B line", "C line", "M line", "TB"],
  MCC: ["MCC#1", "MCC#2", "MCC#3", "MCC#4"],
  Paste: ["Paste1", "Paste2", "Paste3", "Paste4"]
};

let dailyChartInstance = null;
let monthlyChartInstance = null;
let departmentChartInstance = null;
let typeChartInstance = null;
let lineChartInstance = null;
let caTargetCompareChartInstance = null;
let sbTargetCompareChartInstance = null;

let drilldown = null;
let currentUsername = "";

/* =========================
   FORMATTERS
========================= */

const MONTH_SHORT_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonthLabel(monthKey) {
  const [, mon] = monthKey.split("-");
  return MONTH_SHORT_NAMES[Number(mon) - 1];
}

function formatDateLabel(dateKey) {
  const [, mon, day] = dateKey.split("-");
  return `${Number(day)} ${MONTH_SHORT_NAMES[Number(mon) - 1]}`;
}

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

/* =========================
   AUTH
========================= */

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("กรุณากรอก Username และ Password");
    return;
  }

  currentUsername = username;
  document.getElementById("currentUser").textContent = username;
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("appPage").classList.remove("hidden");

  initDashboard();
}

function logout() {
  currentUsername = "";
  document.getElementById("appPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

/* =========================
   INIT / SEED
========================= */

function initDashboard() {
  seedDemoDataIfEmpty();

  const now = new Date();
  document.getElementById("entryDate").value = formatDateKey(now);

  populateYearFilter();
  document.getElementById("filterYear").value = String(now.getFullYear());
  document.getElementById("filterMonth").value = "";
  document.getElementById("filterDepartment").value = "";
  document.getElementById("targetChartMode").value = "selected-year";

  updateEntryLineOptions();
  updateFilterLineOptions();
  loadCurrentYearTarget();
  renderAll();
}

function seedDemoDataIfEmpty() {
  const existingRecords = getRecords();
  const existingTargets = getTargetsByYear();

  if (!existingRecords.length) {
    const demoRecords = [
      { id: 1, date: "2025-01-05", time: "08:10:00", username: "thippapa", department: "AM", line: "COS8", type: "Ca", category: "Lug MCC", weight: 1200 },
      { id: 2, date: "2025-02-12", time: "09:20:00", username: "thippapa", department: "MCC", line: "MCC#1", type: "Sb", category: "Lug AM", weight: 850 },
      { id: 3, date: "2025-03-10", time: "10:05:00", username: "thippapa", department: "MCC", line: "MCC#2", type: "Ca", category: "Lug MCC", weight: 2100 },
      { id: 4, date: "2025-04-15", time: "11:30:00", username: "thippapa", department: "AM", line: "COS8", type: "Ca", category: "Lug AM", weight: 950 },
      { id: 5, date: "2025-05-03", time: "13:10:00", username: "thippapa", department: "Paste", line: "Paste1", type: "Sb", category: "Paste", weight: 760 },
      { id: 6, date: "2025-06-18", time: "14:00:00", username: "thippapa", department: "MCC", line: "MCC#4", type: "Ca", category: "Lug MCC", weight: 3050 },
      { id: 7, date: "2026-01-16", time: "08:30:00", username: "thippapa", department: "MCC", line: "MCC#2", type: "Ca", category: "Lug AM", weight: 23 },
      { id: 8, date: "2026-01-16", time: "08:31:00", username: "thippapa", department: "MCC", line: "MCC#2", type: "Sb", category: "Lug AM", weight: 43 },
      { id: 9, date: "2026-02-16", time: "08:32:00", username: "thippapa", department: "MCC", line: "MCC#1", type: "Ca", category: "Lug AM", weight: 12 },
      { id: 10, date: "2026-02-16", time: "08:33:00", username: "thippapa", department: "AM", line: "COS8", type: "Ca", category: "Lug MCC", weight: 432 },
      { id: 11, date: "2026-03-05", time: "09:15:00", username: "thippapa", department: "AM", line: "A line", type: "Sb", category: "Lug AM", weight: 620 },
      { id: 12, date: "2026-04-19", time: "10:45:00", username: "thippapa", department: "MCC", line: "MCC#3", type: "Ca", category: "Lug MCC", weight: 1780 },
      { id: 13, date: "2026-05-02", time: "15:20:00", username: "thippapa", department: "Paste", line: "Paste2", type: "Sb", category: "Paste", weight: 1100 },
      { id: 14, date: "2026-06-20", time: "16:00:00", username: "thippapa", department: "MCC", line: "MCC#4", type: "Ca", category: "Lug MCC", weight: 2400 }
    ];
    saveRecords(demoRecords);
  }

  if (!Object.keys(existingTargets).length) {
    saveTargetsByYear({
      "2025": 50000,
      "2026": 40000
    });
  }
}

/* =========================
   STORAGE
========================= */

function getRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getTargetsByYear() {
  return JSON.parse(localStorage.getItem(TARGETS_KEY) || "{}");
}

function saveTargetsByYear(targets) {
  localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
}

/* =========================
   FILTERS / TARGETS
========================= */

function populateYearFilter() {
  const yearSelect = document.getElementById("filterYear");
  const currentValue = yearSelect.value;

  const years = [...new Set(getRecords().map(r => r.date.slice(0, 4)))].sort();
  const targetYears = Object.keys(getTargetsByYear());
  const allYears = [...new Set([...years, ...targetYears])].sort();

  yearSelect.innerHTML = '<option value="">ทั้งหมด</option>';
  allYears.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });

  if (allYears.includes(currentValue)) {
    yearSelect.value = currentValue;
  }
}

function getSelectedYear() {
  return document.getElementById("filterYear").value || "";
}

function getSelectedMonth() {
  return document.getElementById("filterMonth").value || "";
}

function getTargetChartMode() {
  return document.getElementById("targetChartMode")?.value || "selected-year";
}

function getCurrentYearTarget() {
  const year = getSelectedYear();
  const targets = getTargetsByYear();
  return Number(targets[year] || 50000);
}

function loadCurrentYearTarget() {
  const targetInput = document.getElementById("yearTarget");
  const year = getSelectedYear();

  if (!year) {
    targetInput.value = "";
    targetInput.placeholder = "เลือกปีก่อน";
    return;
  }

  targetInput.placeholder = "เช่น 50000";
  targetInput.value = getCurrentYearTarget();
}

function saveCurrentYearTarget() {
  const year = getSelectedYear();
  const target = Number(document.getElementById("yearTarget").value);

  if (!year || !target || target <= 0) return;

  const targets = getTargetsByYear();
  targets[year] = target;
  saveTargetsByYear(targets);

  populateYearFilter();
  renderAll();
}

function onFilterDepartmentChange() {
  updateFilterLineOptions();
  clearDrilldown(false);
  onFilterChange();
}

function onFilterChange() {
  loadCurrentYearTarget();
  renderAll();
}

function resetFilters() {
  populateYearFilter();
  document.getElementById("filterYear").value = String(new Date().getFullYear());
  document.getElementById("filterMonth").value = "";
  document.getElementById("filterDepartment").value = "";
  document.getElementById("targetChartMode").value = "selected-year";
  updateFilterLineOptions();
  clearDrilldown(false);
  loadCurrentYearTarget();
  renderAll();
}

/* =========================
   ENTRY FORM
========================= */

function updateEntryLineOptions() {
  const department = document.getElementById("entryDepartment").value;
  const lineSelect = document.getElementById("entryLine");
  const currentValue = lineSelect.value;

  lineSelect.innerHTML = '<option value="">-- เลือกไลน์ผลิต --</option>';

  if (!department || !departmentLineMap[department]) return;

  departmentLineMap[department].forEach(line => {
    const option = document.createElement("option");
    option.value = line;
    option.textContent = line;
    lineSelect.appendChild(option);
  });

  if (departmentLineMap[department].includes(currentValue)) {
    lineSelect.value = currentValue;
  }
}

function updateFilterLineOptions() {
  const department = document.getElementById("filterDepartment").value;
  const lineSelect = document.getElementById("filterLine");
  const currentValue = lineSelect.value;

  lineSelect.innerHTML = '<option value="">ทั้งหมด</option>';

  let lines = [];
  if (department && departmentLineMap[department]) {
    lines = departmentLineMap[department];
  } else {
    lines = Object.values(departmentLineMap).flat();
  }

  [...new Set(lines)].forEach(line => {
    const option = document.createElement("option");
    option.value = line;
    option.textContent = line;
    lineSelect.appendChild(option);
  });

  if (lines.includes(currentValue)) {
    lineSelect.value = currentValue;
  } else {
    lineSelect.value = "";
  }
}

function addRecord() {
  const date = document.getElementById("entryDate").value;
  const department = document.getElementById("entryDepartment").value;
  const line = document.getElementById("entryLine").value;
  const type = document.getElementById("entryType").value;
  const category = document.getElementById("entryCategory").value;
  const weightText = document.getElementById("entryWeight").value;
  const weight = Number(weightText);

  if (!date || !department || !line || !type || !category || !weightText) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  if (weight <= 0) {
    alert("น้ำหนักต้องมากกว่า 0");
    return;
  }

  if (weight > 10000) {
    alert("น้ำหนักต้องไม่เกิน 10,000 kg");
    return;
  }

  const now = new Date();
  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const records = getRecords();
  records.push({
    id: Date.now(),
    date,
    time,
    username: currentUsername || "Unknown",
    department,
    line,
    type,
    category,
    weight
  });

  saveRecords(records);
  populateYearFilter();
  document.getElementById("entryWeight").value = "";

  renderAll();
  alert("บันทึกข้อมูลเรียบร้อย");
}

function clearAllData() {
  if (!confirm("ต้องการล้างข้อมูลทั้งหมดใช่หรือไม่?")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TARGETS_KEY);
  clearDrilldown(false);
  seedDemoDataIfEmpty();
  populateYearFilter();
  loadCurrentYearTarget();
  renderAll();
}

/* =========================
   DATA HELPERS
========================= */

function sumWeight(records) {
  return records.reduce((sum, item) => sum + Number(item.weight || 0), 0);
}

function groupSum(records, key) {
  const map = {};
  records.forEach(item => {
    const groupKey = item[key];
    map[groupKey] = (map[groupKey] || 0) + Number(item.weight || 0);
  });
  return map;
}

function groupMonthlySum(records) {
  const map = {};
  records.forEach(item => {
    const monthKey = item.date.slice(0, 7);
    map[monthKey] = (map[monthKey] || 0) + Number(item.weight || 0);
  });
  return map;
}

function buildMonthlyCategoryMapForType(typeName) {
  const records = getRecords().filter(r => r.type === typeName);
  const map = {};

  records.forEach(r => {
    const month = r.date.slice(0, 7);

    if (!map[month]) {
      map[month] = {
        "Lug AM": 0,
        "Lug MCC": 0,
        "Paste": 0
      };
    }

    if (FIXED_CATEGORIES.includes(r.category)) {
      map[month][r.category] += Number(r.weight || 0);
    }
  });

  return map;
}

function getBaseFilteredRecords() {
  const selectedYear = getSelectedYear();
  const selectedMonth = getSelectedMonth();
  const selectedDepartment = document.getElementById("filterDepartment").value;
  const selectedLine = document.getElementById("filterLine").value;

  return getRecords().filter(r => {
    const yearOk = !selectedYear || r.date.slice(0, 4) === selectedYear;
    const monthOk = !selectedMonth || r.date.slice(5, 7) === selectedMonth;
    const departmentOk = !selectedDepartment || r.department === selectedDepartment;
    const lineOk = !selectedLine || r.line === selectedLine;
    return yearOk && monthOk && departmentOk && lineOk;
  });
}

function applyDrilldown(records) {
  if (!drilldown) return records;

  return records.filter(r => {
    if (drilldown.kind === "date") return r.date === drilldown.value;
    if (drilldown.kind === "department") return r.department === drilldown.value;
    if (drilldown.kind === "type") return r.type === drilldown.value;
    if (drilldown.kind === "line") return r.line === drilldown.value;
    return true;
  });
}

function getFilteredRecords() {
  return applyDrilldown(getBaseFilteredRecords());
}

function getCategoriesForType() {
  return FIXED_CATEGORIES;
}

function getCategoryColor(category, typeName) {

  // สีหลักตาม type
  if (typeName === "Ca") {
    if (category === "Lug AM") return { bg: "rgba(236,72,153,0.9)", border: "#db2777" };
    if (category === "Lug MCC") return { bg: "rgba(236,72,153,0.7)", border: "#db2777" };
    if (category === "Paste") return { bg: "rgba(236,72,153,0.5)", border: "#db2777" };
  }

  if (typeName === "Sb") {
    if (category === "Lug AM") return { bg: "rgba(34,197,94,0.9)", border: "#16a34a" };
    if (category === "Lug MCC") return { bg: "rgba(34,197,94,0.7)", border: "#16a34a" };
    if (category === "Paste") return { bg: "rgba(34,197,94,0.5)", border: "#16a34a" };
  }

  // fallback (กันพัง)
  return {
    bg: "rgba(96,165,250,0.85)",
    border: "rgba(59,130,246,1)"
  };
}

/* =========================
   DRILLDOWN
========================= */

function setDrilldown(kind, value, label) {
  drilldown = { kind, value, label };
  document.getElementById("drilldownLabel").textContent = label;
  document.getElementById("drilldownBox").classList.remove("hidden");
  renderAll();
}

function clearDrilldown(shouldRender = true) {
  drilldown = null;
  document.getElementById("drilldownBox").classList.add("hidden");
  document.getElementById("drilldownLabel").textContent = "";
  if (shouldRender) renderAll();
}

/* =========================
   KPI / TABLE
========================= */

function updateTargetChartVisibility() {
  const caCard = document.getElementById("caTargetCard");
  const sbCard = document.getElementById("sbTargetCard");

  if (!drilldown || drilldown.kind !== "type") {
    caCard.style.display = "";
    sbCard.style.display = "";
    return;
  }

  if (drilldown.value === "Ca") {
    caCard.style.display = "";
    sbCard.style.display = "none";
    return;
  }

  if (drilldown.value === "Sb") {
    caCard.style.display = "none";
    sbCard.style.display = "";
    return;
  }

  caCard.style.display = "";
  sbCard.style.display = "";
}

function updateTargetChartTitles() {
  const mode = getTargetChartMode();
  const selectedYear = getSelectedYear();

  const caTitle = document.querySelector("#caTargetCard .chart-title");
  const sbTitle = document.querySelector("#sbTargetCard .chart-title");

  if (!caTitle || !sbTitle) return;

  if (mode === "selected-year" && selectedYear) {
    caTitle.textContent = `Receive Ca lead recycle / Target (${selectedYear})`;
    sbTitle.textContent = `Receive Sb lead recycle / Target (${selectedYear})`;
  } else {
    caTitle.textContent = "Receive Ca lead recycle / Target";
    sbTitle.textContent = "Receive Sb lead recycle / Target";
  }
}

function renderKPI() {
  const allRecords = getRecords();
  const filteredRecords = getFilteredRecords();
  const today = formatDateKey(new Date());
  const todayRecords = allRecords.filter(r => r.date === today);

  const target = getSelectedYear() ? getCurrentYearTarget() : 0;
  const actual = sumWeight(getBaseFilteredRecords());
  const achievement = target > 0 ? (actual / target) * 100 : 0;

  document.getElementById("kpiToday").textContent =
    sumWeight(todayRecords).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " kg";

  document.getElementById("kpiFilter").textContent =
    sumWeight(filteredRecords).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " kg";

  document.getElementById("kpiTarget").textContent =
    target.toLocaleString("en-US") + " kg";

  document.getElementById("kpiAchievement").textContent =
    achievement.toLocaleString("en-US", { maximumFractionDigits: 1 }) + "%";
}

function renderTable() {
  const records = getFilteredRecords().sort((a, b) => {
    const dateTimeA = `${a.date} ${a.time || "00:00:00"}`;
    const dateTimeB = `${b.date} ${b.time || "00:00:00"}`;
    return dateTimeB.localeCompare(dateTimeA);
  });

  const tbody = document.getElementById("detailTableBody");
  tbody.innerHTML = "";

  if (!records.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;color:#7a89a3;padding:24px;">
          ยังไม่มีข้อมูลตาม filter ที่เลือก
        </td>
      </tr>
    `;
    return;
  }

  records.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.date}</td>
        <td>${item.time || "-"}</td>
        <td>${item.username || "-"}</td>
        <td>${item.department}</td>
        <td>${item.line}</td>
        <td>${item.type}</td>
        <td>${item.category}</td>
        <td>${Number(item.weight).toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  });
}

function exportCSV() {
  const records = getFilteredRecords().sort((a, b) => {
    const dateTimeA = `${a.date} ${a.time || "00:00:00"}`;
    const dateTimeB = `${b.date} ${b.time || "00:00:00"}`;
    return dateTimeA.localeCompare(dateTimeB);
  });

  if (!records.length) {
    alert("ไม่มีข้อมูลสำหรับ Export");
    return;
  }

  const rows = [
    ["Date", "Time", "Username", "Department", "Line", "Type", "Category", "Weight(kg)"]
  ];

  records.forEach(item => {
    rows.push([
      item.date,
      item.time || "",
      item.username || "",
      item.department,
      item.line,
      item.type,
      item.category,
      item.weight
    ]);
  });

  const csvContent = rows
    .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const year = getSelectedYear() || "all-years";
  const month = getSelectedMonth() || "all-months";
  link.href = URL.createObjectURL(blob);
  link.download = `lead-weight-${year}-${month}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/* =========================
   CHART BUILDERS
========================= */

function buildBarChart(chartInstance, canvasId, labels, data, datasetLabel, bgColor, borderColor, onClickHandler) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  if (chartInstance) chartInstance.destroy();

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: datasetLabel,
        data,
        backgroundColor: bgColor,
        borderColor,
        borderWidth: 1.5,
        borderRadius: 10,
        maxBarThickness: 52,
        categoryPercentage: 0.72,
        barPercentage: 0.82
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: onClickHandler,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#66738c" },
          grid: { color: "rgba(226, 232, 240, 0.6)" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#66738c" },
          grid: { color: "rgba(226, 232, 240, 0.6)" }
        }
      }
    }
  });
}

function buildPieLikeChart(chartInstance, canvasId, chartType, labels, data, backgroundColor, borderColor, onClickHandler) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  if (chartInstance) chartInstance.destroy();

  return new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderColor: "#ffffff",
        borderWidth: 3,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: onClickHandler,
      plugins: {
        legend: {
          display: true,
          labels: { color: "#66738c" }
        }
      }
    }
  });
}

function buildStackedTargetCompareChart(chartInstance, canvasId, labels, stackedDatasets, targetData, targetColor) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  if (chartInstance) chartInstance.destroy();

  return new Chart(ctx, {
    data: {
      labels,
      datasets: [
        ...stackedDatasets,
        {
          type: "line",
          label: "Target",
          data: targetData,
          borderColor: targetColor,
          backgroundColor: targetColor,
          borderWidth: 4,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
          fill: false,
          order: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: {
            color: "#333",
            boxWidth: 28
          }
        },
        tooltip: {
          callbacks: {
            footer: function(items) {
              const total = items
                .filter(item => item.dataset.type === "bar")
                .reduce((sum, item) => sum + Number(item.raw || 0), 0);
              return "Actual Total: " + total.toLocaleString("en-US", { maximumFractionDigits: 2 });
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: "#333",
            maxRotation: 0,
            minRotation: 0
          },
          grid: {
            display: false
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            color: "#333",
            callback: function(value) {
              return Number(value).toLocaleString("en-US");
            }
          },
          grid: {
            color: "#e9eef7"
          }
        }
      }
    }
  });
}

/* =========================
   TARGET CHARTS
========================= */

function getMonthsForTargetCharts() {
  const records = getRecords();
  const targetsByYear = getTargetsByYear();
  const mode = getTargetChartMode();
  const selectedYear = getSelectedYear();

  if (mode === "selected-year" && selectedYear) {
    const recordMonths = records
      .map(r => r.date.slice(0, 7))
      .filter(month => month.startsWith(selectedYear + "-"));

    const targetMonths = Array.from({ length: 12 }, (_, i) =>
      `${selectedYear}-${String(i + 1).padStart(2, "0")}`
    );

    return [...new Set([...recordMonths, ...targetMonths])].sort();
  }

  const recordMonths = records.map(r => r.date.slice(0, 7));
  const targetMonths = Object.keys(targetsByYear).flatMap(year =>
    Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`)
  );

  return [...new Set([...recordMonths, ...targetMonths])].sort();
}

function buildYearlyTargetLine(allMonths, targetsByYear) {
  return allMonths.map(month => {
    const year = month.slice(0, 4);
    return Number(targetsByYear[year] || 50000);
  });
}

function renderTypeTargetCompareChart(typeName, canvasId, chartRefName) {
  const targetsByYear = getTargetsByYear();
  const allMonths = getMonthsForTargetCharts();
  const labels = allMonths.map(formatMonthLabel);
  const monthlyCategoryMap = buildMonthlyCategoryMapForType(typeName);
  const categories = getCategoriesForType();
  const targetColor = "#ef4444"; // สีแดง

  const stackedDatasets = categories.map(category => {
    const colors = getCategoryColor(category, typeName);
    return {
      type: "bar",
      label: category,
      data: allMonths.map(month => Number(monthlyCategoryMap[month]?.[category] || 0)),
      backgroundColor: colors.bg,
      borderColor: colors.border,
      borderWidth: 1,
      stack: "actual",
      order: 1
    };
  });

  const targetData = buildYearlyTargetLine(allMonths, targetsByYear);

  if (chartRefName === "ca") {
    caTargetCompareChartInstance = buildStackedTargetCompareChart(
      caTargetCompareChartInstance,
      canvasId,
      labels,
      stackedDatasets,
      targetData,
      targetColor
    );
  } else {
    sbTargetCompareChartInstance = buildStackedTargetCompareChart(
      sbTargetCompareChartInstance,
      canvasId,
      labels,
      stackedDatasets,
      targetData,
      targetColor
    );
  }
}

function renderCaTargetCompareChart() {
  renderTypeTargetCompareChart("Ca", "caTargetCompareChart", "ca");
}

function renderSbTargetCompareChart() {
  renderTypeTargetCompareChart("Sb", "sbTargetCompareChart", "sb");
}

/* =========================
   MAIN CHART RENDER
========================= */

function renderCharts() {
  const baseFiltered = getBaseFilteredRecords();

const selectedYear = getSelectedYear();
const selectedMonth = getSelectedMonth();

const dailyMap = groupSum(baseFiltered, "date");

let dailyKeys = [];

if (selectedYear && selectedMonth) {
  const lastDay = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();

  dailyKeys = Array.from({ length: lastDay }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    return `${selectedYear}-${selectedMonth}-${day}`;
  });
} else {
  dailyKeys = Object.keys(dailyMap).sort();
}

const dailyLabels = dailyKeys.map(formatDateLabel);
const dailyData = dailyKeys.map(key => dailyMap[key] || 0);

  const monthlyMap = groupMonthlySum(baseFiltered);
  const monthlyKeys = Object.keys(monthlyMap).sort();
  const monthlyLabels = monthlyKeys.map(formatMonthLabel);
  const monthlyData = monthlyKeys.map(key => monthlyMap[key]);

  const departmentMap = groupSum(baseFiltered, "department");
  const departmentLabels = Object.keys(departmentMap);
  const departmentData = departmentLabels.map(label => departmentMap[label]);
  const departmentColors = departmentLabels.map(label => {
    if (label === "AM") return "#60a5fa";
    if (label === "MCC") return "#f59e0b";
    if (label === "Paste") return "#8b5cf6";
    return "#94a3b8";
  });

  const typeMap = groupSum(baseFiltered, "type");
  const typeLabels = Object.keys(typeMap);
  const typeData = typeLabels.map(label => typeMap[label]);
  const typeColors = typeLabels.map(label => {
    if (label === "Ca") return "#f9a8d4";
    if (label === "Sb") return "#86efac";
    return "#93c5fd";
  });
  const typeBorderColors = typeLabels.map(label => {
    if (label === "Ca") return "#ec4899";
    if (label === "Sb") return "#22c55e";
    return "#60a5fa";
  });

  const lineMap = groupSum(baseFiltered, "line");
  const lineLabels = Object.keys(lineMap);
  const lineData = lineLabels.map(label => lineMap[label]);

  dailyChartInstance = buildBarChart(
    dailyChartInstance,
    "dailyChart",
    dailyLabels,
    dailyData,
    "น้ำหนักรายวัน",
    "rgba(79, 125, 240, 0.75)",
    "rgba(47, 99, 224, 1)",
    (evt, elements) => {
      if (!elements.length) return;
      const rawDate = dailyKeys[elements[0].index];
      setDrilldown("date", rawDate, `วันที่: ${rawDate}`);
    }
  );

  monthlyChartInstance = buildBarChart(
    monthlyChartInstance,
    "monthlyChart",
    monthlyLabels,
    monthlyData,
    "น้ำหนักรายเดือน",
    "rgba(79, 125, 240, 0.75)",
    "rgba(47, 99, 224, 1)"
  );

  departmentChartInstance = buildPieLikeChart(
    departmentChartInstance,
    "departmentChart",
    "pie",
    departmentLabels,
    departmentData,
    departmentColors,
    departmentColors,
    (evt, elements) => {
      if (!elements.length) return;
      const label = departmentLabels[elements[0].index];
      setDrilldown("department", label, `หน่วยงาน: ${label}`);
    }
  );

  typeChartInstance = buildPieLikeChart(
    typeChartInstance,
    "typeChart",
    "doughnut",
    typeLabels,
    typeData,
    typeColors,
    typeBorderColors,
    (evt, elements) => {
      if (!elements.length) return;
      const label = typeLabels[elements[0].index];
      setDrilldown("type", label, `ชนิดตะกั่ว: ${label}`);
    }
  );

  lineChartInstance = buildBarChart(
    lineChartInstance,
    "lineChart",
    lineLabels,
    lineData,
    "น้ำหนักตามไลน์ผลิต",
    "rgba(59, 130, 246, 0.9)",
    "rgba(37, 99, 235, 1)",
    (evt, elements) => {
      if (!elements.length) return;
      const label = lineLabels[elements[0].index];
      setDrilldown("line", label, `ไลน์ผลิต: ${label}`);
    }
  );

  renderCaTargetCompareChart();
  renderSbTargetCompareChart();
}

function renderAll() {
  renderKPI();
  renderTable();
  renderCharts();
  updateTargetChartVisibility();
  updateTargetChartTitles();
}