const tasks = [
  { title: 'Prepare sprint planning notes', category: 'Project', priority: 'High', completed: true },
  { title: 'Review design handoff', category: 'Project', priority: 'High', completed: false },
  { title: 'Update project documentation', category: 'Project', priority: 'Medium', completed: false },
  { title: 'Reply to stakeholder feedback', category: 'Personal', priority: 'Medium', completed: true },
  { title: 'Organise research references', category: 'Study', priority: 'Low', completed: true },
  { title: "Plan next week's priorities", category: 'Personal', priority: 'Low', completed: false }
];
const $ = (id) => document.getElementById(id);
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
let activeFilter = 'all';

function visibleTasks() {
  const term = $('task-search').value.trim().toLowerCase();
  return tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(term) || task.category.toLowerCase().includes(term) || task.priority.toLowerCase().includes(term);
    const matchesFilter = activeFilter === 'all' || (activeFilter === 'completed' && task.completed) || (activeFilter === 'pending' && !task.completed);
    return matchesSearch && matchesFilter;
  });
}
function renderDashboard() {
  const total = tasks.length, completed = tasks.filter((task) => task.completed).length, pending = total - completed;
  const highPriority = tasks.filter((task) => task.priority === 'High' && !task.completed).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0, displayed = visibleTasks();
  $('total-tasks').textContent = total; $('completed-tasks').textContent = completed; $('pending-tasks').textContent = pending; $('high-priority-tasks').textContent = highPriority;
  $('completion-percentage').textContent = `${percentage}%`; $('progress-fill').style.width = `${percentage}%`; $('progress-track').setAttribute('aria-valuenow', percentage);
  $('progress-summary').textContent = `${plural(completed, 'task')} complete out of ${total}`;
  $('task-count').textContent = `${plural(displayed.length, 'task')} shown`; $('empty-state').hidden = displayed.length !== 0; $('clear-search').hidden = !$('task-search').value;
  $('focus-message').textContent = highPriority ? `${plural(highPriority, 'high-priority task')} still need${highPriority === 1 ? 's' : ''} your attention.` : 'No pending high-priority tasks. Nice work!';
  $('task-list').replaceChildren(...displayed.map((task) => taskElement(task)));
}
function taskElement(task) {
  const item = document.createElement('li'); item.className = `task-item${task.completed ? ' is-completed' : ''}`;
  const check = document.createElement('input'); check.className = 'task-check'; check.type = 'checkbox'; check.checked = task.completed; check.setAttribute('aria-label', `Mark ${task.title} as completed`);
  const title = document.createElement('span'); title.className = 'task-name'; title.textContent = task.title;
  const category = document.createElement('span'); category.className = 'category'; category.textContent = task.category;
  const priority = document.createElement('span'); priority.className = `priority priority-${task.priority.toLowerCase()}`; priority.textContent = task.priority;
  const remove = document.createElement('button'); remove.className = 'task-delete'; remove.type = 'button'; remove.textContent = 'Delete';
  check.addEventListener('change', () => { task.completed = !task.completed; renderDashboard(); });
  remove.addEventListener('click', () => { tasks.splice(tasks.indexOf(task), 1); renderDashboard(); });
  item.append(check, title, category, priority, remove); return item;
}
$('current-date').textContent = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
$('task-form').addEventListener('submit', (event) => { event.preventDefault(); const title = $('task-input').value.trim(); if (!title) { $('form-error').textContent = 'Enter a task before adding it.'; $('task-input').focus(); return; } tasks.unshift({ title, category: $('category-input').value, priority: $('priority-input').value, completed: false }); event.currentTarget.reset(); $('priority-input').value = 'Medium'; $('form-error').textContent = ''; $('task-input').focus(); renderDashboard(); });
$('task-input').addEventListener('input', () => { $('form-error').textContent = ''; });
$('task-search').addEventListener('input', renderDashboard);
$('clear-search').addEventListener('click', () => { $('task-search').value = ''; $('task-search').focus(); renderDashboard(); });
document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach((candidate) => { const selected = candidate === button; candidate.classList.toggle('is-active', selected); candidate.setAttribute('aria-pressed', String(selected)); }); renderDashboard(); }));
renderDashboard();
