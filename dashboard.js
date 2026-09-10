const STORAGE_KEY = 'taskManagerTasks';
const THEME_KEY = 'taskManagerTheme';
const taskStore = loadTasks();
let activeFilter = 'all';

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(taskStore));
}

function getElement(id) {
  return document.getElementById(id);
}

function setTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const toggle = getElement('theme-toggle');
  toggle.setAttribute('aria-pressed', String(isDark));
  toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  toggle.querySelector('.theme-toggle-label').textContent = isDark ? 'Light mode' : 'Dark mode';
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function getVisibleTasks() {
  const searchTerm = getElement('task-search').value.trim().toLowerCase();

  return taskStore.filter((task) => {
    const searchableText = `${task.title} ${task.category} ${task.priority}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm);
    const matchesFilter = activeFilter === 'all'
      || (activeFilter === 'completed' && task.completed)
      || (activeFilter === 'pending' && !task.completed);
    return matchesSearch && matchesFilter;
  });
}

function createTaskElement(task) {
  const item = document.createElement('li');
  item.className = `task-item${task.completed ? ' is-completed' : ''}`;

  const checkbox = document.createElement('input');
  checkbox.className = 'task-check';
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', `Mark ${task.title} as completed`);
  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    saveTasks();
    renderDashboard();
  });

  const title = document.createElement('span');
  title.className = 'task-name';
  title.textContent = task.title;

  const category = document.createElement('span');
  category.className = 'category';
  category.textContent = task.category;

  const priority = document.createElement('span');
  priority.className = `priority priority-${task.priority.toLowerCase()}`;
  priority.textContent = task.priority;

  const remove = document.createElement('button');
  remove.className = 'task-delete';
  remove.type = 'button';
  remove.textContent = 'Delete';
  remove.setAttribute('aria-label', `Delete ${task.title}`);
  remove.addEventListener('click', () => {
    const taskIndex = taskStore.indexOf(task);
    if (taskIndex !== -1) taskStore.splice(taskIndex, 1);
    saveTasks();
    renderDashboard();
  });

  item.append(checkbox, title, category, priority, remove);
  return item;
}

function renderDashboard() {
  const total = taskStore.length;
  const completed = taskStore.filter((task) => task.completed).length;
  const pending = total - completed;
  const highPriority = taskStore.filter((task) => task.priority === 'High' && !task.completed).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const visibleTasks = getVisibleTasks();

  getElement('total-tasks').textContent = total;
  getElement('completed-tasks').textContent = completed;
  getElement('pending-tasks').textContent = pending;
  getElement('high-priority-tasks').textContent = highPriority;
  getElement('completion-percentage').textContent = `${percentage}%`;
  getElement('progress-fill').style.width = `${percentage}%`;
  getElement('progress-track').setAttribute('aria-valuenow', percentage);
  getElement('progress-summary').textContent = total
    ? `${plural(completed, 'task')} complete out of ${total}`
    : 'No tasks yet';
  getElement('task-count').textContent = `${plural(visibleTasks.length, 'task')} shown`;
  getElement('empty-state').hidden = visibleTasks.length !== 0;
  getElement('clear-search').hidden = !getElement('task-search').value;
  getElement('focus-message').textContent = highPriority
    ? `${plural(highPriority, 'high-priority task')} still need${highPriority === 1 ? 's' : ''} your attention.`
    : 'No pending high-priority tasks. Nice work!';
  getElement('task-list').replaceChildren(...visibleTasks.map(createTaskElement));
}

getElement('current-date').textContent = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}).format(new Date());

setTheme(document.documentElement.dataset.theme || 'light');
getElement('theme-toggle').addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

getElement('task-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const titleInput = getElement('task-input');
  const title = titleInput.value.trim();

  if (!title) {
    getElement('form-error').textContent = 'Enter a task before adding it.';
    titleInput.focus();
    return;
  }

  taskStore.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    category: getElement('category-input').value,
    priority: getElement('priority-input').value,
    completed: false
  });
  saveTasks();
  event.currentTarget.reset();
  getElement('priority-input').value = 'Medium';
  getElement('form-error').textContent = '';
  titleInput.focus();
  renderDashboard();
});

getElement('task-input').addEventListener('input', () => {
  getElement('form-error').textContent = '';
});

getElement('task-search').addEventListener('input', renderDashboard);

getElement('clear-search').addEventListener('click', () => {
  getElement('task-search').value = '';
  getElement('task-search').focus();
  renderDashboard();
});

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((candidate) => {
      const selected = candidate === button;
      candidate.classList.toggle('is-active', selected);
      candidate.setAttribute('aria-pressed', String(selected));
    });
    renderDashboard();
  });
});

renderDashboard();
