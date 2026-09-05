const tasks = [
  { name: 'Plan the project kickoff', completed: true },
  { name: 'Review the design notes', completed: false },
  { name: 'Set up the deployment pipeline', completed: false },
  { name: 'Share the weekly progress update', completed: true },
  { name: 'Write acceptance criteria', completed: false },
  { name: 'Archive completed tickets', completed: true }
];

const taskList = document.querySelector('#task-list');
const taskSearch = document.querySelector('#task-search');
const clearSearch = document.querySelector('#clear-search');
const taskCount = document.querySelector('#task-count');
const emptyState = document.querySelector('#empty-state');
const filterButtons = document.querySelectorAll('[data-filter]');

let activeFilter = 'all';

function getVisibleTasks() {
  const searchTerm = taskSearch.value.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm);
    const matchesFilter = activeFilter === 'all'
      || (activeFilter === 'completed' && task.completed)
      || (activeFilter === 'pending' && !task.completed);

    return matchesSearch && matchesFilter;
  });
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  taskList.innerHTML = visibleTasks.map((task) => `
    <li class="task-item${task.completed ? ' completed' : ''}">
      <span class="status-mark" aria-hidden="true">${task.completed ? '&#10003;' : ''}</span>
      <span class="task-name">${task.name}</span>
      <span class="task-status">${task.completed ? 'Completed' : 'Pending'}</span>
    </li>
  `).join('');

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
