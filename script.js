let completionChart, historyChart;
const today = new Date().toISOString().split("T")[0];

function addTask() {
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");

  if (input.value.trim() === "") return;

  const li = createTaskElement(input.value, 0);
  list.appendChild(li);
  input.value = "";
  saveTasks();
  updateCompletionChart();
  updateHistoryChart();
}

function createTaskElement(text, progressValue) {
  const li = document.createElement("li");

  const span = document.createElement("span");
  span.textContent = " " + text;

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "❌";
  removeBtn.className = "remove-btn";
  removeBtn.onclick = () => {
    li.remove();
    saveTasks();
    updateCompletionChart();
    updateHistoryChart();
  };

  const progress = document.createElement("progress");
  progress.max = 100;
  progress.value = progressValue;
  progress.className = "task-progress";

  const inputPercent = document.createElement("input");
  inputPercent.type = "number";
  inputPercent.min = 0;
  inputPercent.max = 100;
  inputPercent.value = progressValue;
  inputPercent.className = "percent-input";
  inputPercent.oninput = () => {
    progress.value = inputPercent.value;
    saveTasks();
    updateCompletionChart();
    updateHistoryChart();
  };

  li.appendChild(span);
  li.appendChild(inputPercent);
  li.appendChild(progress);
  li.appendChild(removeBtn);

  return li;
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll("#taskList li").forEach(li => {
    const text = li.querySelector("span").textContent.trim();
    const percent = parseInt(li.querySelector("input[type='number']").value);
    tasks.push({ text, percent });
  });

  const allData = JSON.parse(localStorage.getItem("taskHistory") || "{}");
  allData[today] = tasks;
  localStorage.setItem("taskHistory", JSON.stringify(allData));
}

function loadTasks() {
  const allData = JSON.parse(localStorage.getItem("taskHistory") || "{}");
  const tasks = allData[today] || [];
  const list = document.getElementById("taskList");
  list.innerHTML = "";
  tasks.forEach(task => {
    const li = createTaskElement(task.text, task.percent);
    list.appendChild(li);
  });
}

function updateCompletionChart() {
  const tasks = [];
  document.querySelectorAll("#taskList li").forEach(li => {
    const text = li.querySelector("span").textContent.trim();
    const percent = parseInt(li.querySelector("input[type='number']").value);
    if (percent > 0) tasks.push({ text, percent });
  });

  const labels = tasks.map(t => t.text);
  const data = tasks.map(t => t.percent);

  const ctx = document.getElementById("chart").getContext("2d");

  if (completionChart) completionChart.destroy();

  completionChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        label: "Task Completion (%)",
        data: data,
        backgroundColor: generateColors(data.length)
      }]
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed}%`;
            }
          }
        }
      }
    }
  });
}

function generateColors(n) {
  const colors = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#14b8a6", "#eab308"
  ];
  return Array.from({ length: n }, (_, i) => colors[i % colors.length]);
}

function updateHistoryChart() {
  const data = JSON.parse(localStorage.getItem("taskHistory") || "{}");
  const result = [];

  for (let date in data) {
    const tasks = data[date];
    const totalPercent = tasks.reduce((sum, t) => sum + t.percent, 0);
    const avg = tasks.length ? Math.round(totalPercent / tasks.length) : 0;
    result.push({ date, percent: avg });
  }

  result.sort((a, b) => new Date(a.date) - new Date(b.date));

  const ctx = document.getElementById("historyChart").getContext("2d");
  if (historyChart) historyChart.destroy();

  historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: result.map(r => r.date),
      datasets: [{
        label: "Average Completion %",
        data: result.map(r => r.percent),
        borderColor: "#6366f1",
        backgroundColor: "#6366f140",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}
function showHistory(range) {
  const allData = JSON.parse(localStorage.getItem("taskHistory") || "{}");
  const output = document.getElementById("historyOutput");
  output.innerHTML = "";

  const today = new Date();
  const selected = [];

  for (let dateStr in allData) {
    const date = new Date(dateStr);

    let include = false;
    if (range === "yesterday") {
      const yest = new Date(today);
      yest.setDate(today.getDate() - 1);
      include = date.toDateString() === yest.toDateString();
    } else if (range === "last7") {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      include = date >= past && date <= today;
    } else if (range === "last30") {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      include = date >= past && date <= today;
    } else if (range === "year") {
      include = date.getFullYear() === today.getFullYear();
    }

    if (include) selected.push({ date: dateStr, tasks: allData[dateStr] });
  }

  if (selected.length === 0) {
    output.innerHTML = "<p>No history found for this range.</p>";
    return;
  }

  selected.sort((a, b) => new Date(b.date) - new Date(a.date));

  selected.forEach(entry => {
    const header = document.createElement("h3");
    header.textContent = `📅 ${entry.date}`;
    output.appendChild(header);

    entry.tasks.forEach(task => {
      const p = document.createElement("p");
      p.textContent = `• ${task.text} – ${task.percent}%`;
      output.appendChild(p);
    });
  });
}


window.onload = function () {
  loadTasks();
  updateCompletionChart();
  updateHistoryChart();
};


