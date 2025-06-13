let tasks = [];
let history = JSON.parse(localStorage.getItem('history')) || {};

function addTask() {
  const input = document.getElementById("taskInput");
  const taskName = input.value.trim();
  if (!taskName) return;

  const task = {
    name: taskName,
    completed: false,
    percent: 0,
  };
  tasks.push(task);
  input.value = "";
  renderTasks();
  updateChart();
  updateHistory();
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.onchange = () => {
      task.completed = checkbox.checked;
      updateChart();
      updateHistory();
    };

    const span = document.createElement("span");
    span.textContent = task.name;

    const input = document.createElement("input");
    input.type = "number";
    input.className = "percent-input";
    input.value = task.percent;
    input.oninput = () => {
      task.percent = parseInt(input.value) || 0;
      updateChart();
      updateHistory();
    };

    const progress = document.createElement("progress");
    progress.className = "task-progress";
    progress.value = task.percent;
    progress.max = 100;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove-btn";
    removeBtn.onclick = () => {
      tasks.splice(index, 1);
      renderTasks();
      updateChart();
      updateHistory();
    };

    li.append(checkbox, span, input, progress, removeBtn);
    taskList.appendChild(li);
  });
}

let chart = new Chart(document.getElementById("chart"), {
  type: "doughnut",
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ["#4ade80", "#f87171", "#60a5fa", "#facc15", "#a78bfa"]
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  }
});

let historyChart = new Chart(document.getElementById("historyChart"), {
  type: "bar",
  data: {
    labels: [],
    datasets: [{
      label: "Avg Completion %",
      backgroundColor: "#6366f1",
      data: []
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

function updateChart() {
  const labels = tasks.map(t => t.name);
  const data = tasks.map(t => t.percent);
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}

function updateHistory() {
  const today = new Date();
  const dateKey = today.toISOString().split('T')[0];
  const avg = tasks.length ? Math.round(tasks.reduce((acc, t) => acc + t.percent, 0) / tasks.length) : 0;

  history[dateKey] = avg;
  localStorage.setItem('history', JSON.stringify(history));
  renderHistoryChart();
  renderSummaryStats();
}

function renderHistoryChart() {
  const keys = Object.keys(history).slice(-7);
  const values = keys.map(k => history[k]);

  historyChart.data.labels = keys;
  historyChart.data.datasets[0].data = values;
  historyChart.update();
}

// 📊 Summary Calculation Functions
function renderSummaryStats() {
  const today = getTodayAvg();
  const week = getTimeFrameAvg(7);
  const month = getTimeFrameAvg(30);
  const year = getTimeFrameAvg(365);

  document.getElementById("summary-today").textContent = today + "%";
  document.getElementById("summary-week").textContent = week + "%";
  document.getElementById("summary-month").textContent = month + "%";
  document.getElementById("summary-year").textContent = year + "%";
}

  // You can add these to the DOM instead of console if needed.


function getTodayAvg() {
  const today = new Date().toISOString().split('T')[0];
  return history[today] || 0;
}

function getTimeFrameAvg(days) {
  const today = new Date();
  const dates = Object.keys(history).filter(dateStr => {
    const date = new Date(dateStr);
    const diff = (today - date) / (1000 * 60 * 60 * 24);
    return diff <= days;
  });

  const values = dates.map(d => history[d]);
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

window.onload = () => {
  renderTasks();
  updateChart();
  renderHistoryChart();
  renderSummaryStats();
};
