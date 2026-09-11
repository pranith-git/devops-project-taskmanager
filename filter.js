const STORAGE_KEY = 'taskManagerTasks';
let tasks = loadTasks();

const taskList = document.querySelector('#task-list');
const taskSearch = document.querySelector('#task-search');
const clearSearch = document.querySelector('#clear-search');
const taskCount = document.querySelector('#task-count');
const emptyState = document.querySelector('#empty-state');
const filterButtons = document.querySelectorAll('[data-filter]');

let activeFilter = 'all';

function loadTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(storedTasks) ? storedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function getVisibleTasks() {
  const searchTerm = taskSearch.value.trim().toLowerCase();

  return tasks.filter((task) => {
    const searchableText = `${task.title} ${task.category} ${task.priority}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm);
    const matchesFilter = activeFilter === 'all'
      || (activeFilter === 'completed' && task.completed)
      || (activeFilter === 'pending' && !task.completed);

    return matchesSearch && matchesFilter;
  });
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  taskList.innerHTML = visibleTasks.map((task) => `
    <li class="task-item${task.completed ? ' completed' : ''}" data-id="${task.id}">
      <button class="status-mark" type="button" aria-label="Mark ${escapeHtml(task.title)} as ${task.completed ? 'pending' : 'completed'}">${task.completed ? '&#10003;' : ''}</button>
      <span class="task-name">${escapeHtml(task.title)}</span>
      <span class="task-status">${task.completed ? 'Completed' : task.priority || 'Pending'}</span>
    </li>
  `).join('');

  taskList.querySelectorAll('.status-mark').forEach((button) => {
    button.addEventListener('click', () => {
      const task = tasks.find((candidate) => candidate.id === button.closest('.task-item').dataset.id);
      if (!task) return;
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    });
  });

  taskCount.textContent = `${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'}`;
  emptyState.hidden = visibleTasks.length > 0;
  clearSearch.hidden = taskSearch.value.length === 0;
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle('is-active', isActive);
      filterButton.setAttribute('aria-pressed', String(isActive));
    });
    renderTasks();
  });
});

taskSearch.addEventListener('input', renderTasks);

clearSearch.addEventListener('click', () => {
  taskSearch.value = '';
  taskSearch.focus();
  renderTasks();
});

renderTasks();
