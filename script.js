const STORAGE_KEY = "todo-app-beginner-version";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const priorityInput = document.getElementById("priorityInput");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const message = document.getElementById("message");
const storageInfo = document.getElementById("storageInfo");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");

let tasks = [];
let editTaskId = null;

startApp();

taskForm.addEventListener("submit", addOrUpdateTask);
cancelEditBtn.addEventListener("click", resetForm);
clearCompletedBtn.addEventListener("click", clearCompletedTasks);
searchInput.addEventListener("input", showTasks);
statusFilter.addEventListener("change", showTasks);

function startApp() {
  if (storageAvailable()) {
    storageInfo.textContent = "Tasks are saved in your browser using localStorage.";
    tasks = getTasksFromStorage();
  } else {
    storageInfo.textContent = "localStorage is not available in this browser.";
  }

  updateCounts();
  showTasks();
}

function addOrUpdateTask(event) {
  event.preventDefault();

  const taskName = taskInput.value.trim();
  const category = categoryInput.value.trim() || "General";
  const priority = priorityInput.value;

  if (taskName === "") {
    showMessage("Please enter a task name.", true);
    taskInput.focus();
    return;
  }

  if (taskName.length < 3) {
    showMessage("Task name must have at least 3 characters.", true);
    taskInput.focus();
    return;
  }

  if (editTaskId !== null) {
    tasks = tasks.map(function (task) {
      if (task.id === editTaskId) {
        task.name = taskName;
        task.category = category;
        task.priority = priority;
        task.updatedAt = new Date().toISOString();
      }
      return task;
    });

    saveTasksToStorage();
    updateCounts();
    showTasks();
    resetForm();
    showMessage("Task updated successfully.", false);
    return;
  }

  const newTask = {
    id: "task-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
    name: taskName,
    category: category,
    priority: priority,
    completed: false,
    updatedAt: new Date().toISOString()
  };

  tasks.unshift(newTask);

  saveTasksToStorage();
  updateCounts();
  showTasks();
  resetForm();
  showMessage("Task added successfully.", false);
}

function showTasks() {
  taskList.innerHTML = "";

  const filterValue = statusFilter.value;
  const searchValue = searchInput.value.trim().toLowerCase();

  const filteredTasks = tasks.filter(function (task) {
    const matchesStatus =
      filterValue === "all" ||
      (filterValue === "pending" && task.completed === false) ||
      (filterValue === "completed" && task.completed === true);

    const matchesSearch =
      task.name.toLowerCase().includes(searchValue) ||
      task.category.toLowerCase().includes(searchValue) ||
      task.priority.toLowerCase().includes(searchValue);

    return matchesStatus && matchesSearch;
  });

  if (filteredTasks.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  filteredTasks.forEach(function (task) {
    const listItem = document.createElement("li");
    listItem.className = "task-item";

    if (task.completed) {
      listItem.classList.add("completed");
    }

    const leftSide = document.createElement("div");
    leftSide.className = "task-left";

    const toggleButton = document.createElement("button");
    toggleButton.className = "toggle-btn";
    toggleButton.type = "button";
    toggleButton.addEventListener("click", function () {
      toggleTask(task.id);
    });

    const content = document.createElement("div");

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.name;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const categoryBadge = document.createElement("span");
    categoryBadge.className = "badge category-badge";
    categoryBadge.textContent = task.category;

    const priorityBadge = document.createElement("span");
    priorityBadge.className = "badge " + getPriorityClass(task.priority);
    priorityBadge.textContent = task.priority + " Priority";

    const dateBadge = document.createElement("span");
    dateBadge.className = "badge date-badge";
    dateBadge.textContent = formatDate(task.updatedAt);

    meta.appendChild(categoryBadge);
    meta.appendChild(priorityBadge);
    meta.appendChild(dateBadge);

    content.appendChild(title);
    content.appendChild(meta);

    leftSide.appendChild(toggleButton);
    leftSide.appendChild(content);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.className = "edit-btn";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", function () {
      editTask(task.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
      deleteTask(task.id);
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    listItem.appendChild(leftSide);
    listItem.appendChild(actions);

    taskList.appendChild(listItem);
  });
}

function toggleTask(taskId) {
  tasks = tasks.map(function (task) {
    if (task.id === taskId) {
      task.completed = !task.completed;
      task.updatedAt = new Date().toISOString();
    }
    return task;
  });

  saveTasksToStorage();
  updateCounts();
  showTasks();
}

function editTask(taskId) {
  const selectedTask = tasks.find(function (task) {
    return task.id === taskId;
  });

  if (!selectedTask) {
    return;
  }

  editTaskId = taskId;
  taskInput.value = selectedTask.name;
  categoryInput.value = selectedTask.category === "General" ? "" : selectedTask.category;
  priorityInput.value = selectedTask.priority;
  submitBtn.textContent = "Update Task";
  cancelEditBtn.classList.remove("hidden");
  showMessage("You are editing a task now.", false);
}

function deleteTask(taskId) {
  tasks = tasks.filter(function (task) {
    return task.id !== taskId;
  });

  saveTasksToStorage();
  updateCounts();
  showTasks();
  showMessage("Task deleted.", false);

  if (editTaskId === taskId) {
    resetForm();
  }
}

function clearCompletedTasks() {
  const hasCompletedTasks = tasks.some(function (task) {
    return task.completed;
  });

  if (!hasCompletedTasks) {
    showMessage("There are no completed tasks to clear.", true);
    return;
  }

  tasks = tasks.filter(function (task) {
    return task.completed === false;
  });

  saveTasksToStorage();
  updateCounts();
  showTasks();
  showMessage("Completed tasks removed.", false);
}

function updateCounts() {
  const completedCount = tasks.filter(function (task) {
    return task.completed;
  }).length;

  totalTasks.textContent = tasks.length;
  completedTasks.textContent = completedCount;
  pendingTasks.textContent = tasks.length - completedCount;
}

function saveTasksToStorage() {
  if (storageAvailable()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
}

function getTasksFromStorage() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (savedTasks) {
    return JSON.parse(savedTasks);
  }

  return [];
}

function storageAvailable() {
  try {
    const testKey = "test-storage";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

function resetForm() {
  editTaskId = null;
  taskForm.reset();
  priorityInput.value = "Medium";
  submitBtn.textContent = "Add Task";
  cancelEditBtn.classList.add("hidden");
}

function showMessage(text, isError) {
  message.textContent = text;

  if (isError) {
    message.style.color = "#dc2626";
  } else {
    message.style.color = "#15803d";
  }
}

function getPriorityClass(priority) {
  if (priority === "High") {
    return "priority-high";
  }

  if (priority === "Low") {
    return "priority-low";
  }

  return "priority-medium";
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
