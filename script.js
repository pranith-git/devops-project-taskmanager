/**
 * script.js — Task Manager
 *
 * Responsibilities:
 *  1. Add a new task (blocks empty submissions)
 *  2. Render tasks into the DOM
 *  3. Toggle a task's completed state
 *  4. Delete a task (with a short exit animation)
 *  5. Keep the stats bar and empty-state in sync
 *
 * How tasks are stored:
 *  Each task is a plain object: { id, text, completed }
 *  All tasks live in the `tasks` array in memory.
 *  (Extending this to localStorage is straightforward — see NOTE below.)
 */

// ── DOM references ──────────────────────────────────────────────────────────

const taskForm    = document.getElementById('task-form');
const taskInput   = document.getElementById('task-input');
const taskList    = document.getElementById('task-list');
const errorMsg    = document.getElementById('error-msg');
const emptyState  = document.getElementById('empty-state');
const statsTotal  = document.getElementById('stats-total');
const statsCompleted = document.getElementById('stats-completed');

// ── State ───────────────────────────────────────────────────────────────────

/**
 * Main data store.
 * NOTE: To persist tasks across page reloads, replace this line with:
 *   let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
 * and call saveTasks() after every mutation.
 */
let tasks = [];

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate a simple unique ID for each task.
 * Using Date.now() + a random suffix keeps it collision-free for typical use.
 * @returns {string}
 */
function generateId() {
  return `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Persist tasks to localStorage (optional extension point).
 * Uncomment this function and its call sites to enable persistence.
 */
// function saveTasks() {
//   localStorage.setItem('tasks', JSON.stringify(tasks));
// }

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Show an error message and apply the error style to the input.
 * The message is cleared automatically after 3 seconds.
 * @param {string} message
 */
function showError(message) {
  errorMsg.textContent = message;
  taskInput.classList.add('is-error');

  // Clear error after 3 s so the user isn't stuck seeing red forever
  setTimeout(clearError, 3000);
}

/** Remove the error message and reset the input's error style. */
function clearError() {
  errorMsg.textContent = '';
  taskInput.classList.remove('is-error');
}

// ── Stats / UI Sync ──────────────────────────────────────────────────────────

/**
 * Recount tasks and update the stats bar and empty-state visibility.
 * Call this after every mutation to keep the UI consistent.
 */
function updateUI() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;

  // Stats bar
  statsTotal.textContent     = `${total} ${total === 1 ? 'task' : 'tasks'}`;
  statsCompleted.textContent = `${completed} completed`;

  // Show/hide the empty state
  emptyState.style.display = total === 0 ? 'block' : 'none';
}

// ── DOM Builders ─────────────────────────────────────────────────────────────

/**
 * Build and return a <li> element for a given task object.
 * Keeps DOM creation isolated from business logic.
 * @param {{ id: string, text: string, completed: boolean }} task
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  // <li class="task-item [is-completed]">
  const li = document.createElement('li');
  li.classList.add('task-item');
  li.dataset.id = task.id;
  if (task.completed) li.classList.add('is-completed');

  // Checkbox — marks task complete/incomplete
  const checkbox = document.createElement('input');
  checkbox.type    = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.classList.add('task-checkbox');
  checkbox.setAttribute('aria-label', `Mark "${task.text}" as completed`);
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // Task text
  const span = document.createElement('span');
  span.classList.add('task-text');
  span.textContent = task.text;

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('btn-delete');
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  li.append(checkbox, span, deleteBtn);
  return li;
}

// ── Core Actions ─────────────────────────────────────────────────────────────

/**
 * Add a new task to the array and render it into the list.
 * Validates the input first and shows an error if empty.
 * @param {string} text - Raw input value from the user
 */
function addTask(text) {
  const trimmed = text.trim();

  // Guard: block empty or whitespace-only submissions
  if (!trimmed) {
    showError('Please enter a task before adding.');
    taskInput.focus();
    return;
  }

  // Build the task object
  const newTask = {
    id:        generateId(),
    text:      trimmed,
    completed: false,
  };

  // Add to the data store
  tasks.push(newTask);
  // saveTasks(); // ← uncomment to enable localStorage persistence

  // Render into the DOM
  const li = createTaskElement(newTask);
  taskList.appendChild(li);

  // Reset the input field
  taskInput.value = '';
  clearError();
  taskInput.focus();

  updateUI();
}

/**
 * Toggle the completed state of a task by its ID.
 * @param {string} id
 */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  // saveTasks(); // ← uncomment for persistence

  // Reflect the state change in the DOM without a full re-render
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (li) {
    li.classList.toggle('is-completed', task.completed);
    const checkbox = li.querySelector('.task-checkbox');
    if (checkbox) checkbox.checked = task.completed;
  }

  updateUI();
}

/**
 * Remove a task from the array and animate it out of the DOM.
 * @param {string} id
 */
function deleteTask(id) {
  // Remove from data store immediately
  tasks = tasks.filter(t => t.id !== id);
  // saveTasks(); // ← uncomment for persistence

  // Animate the list item out, then remove it from the DOM
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (li) {
    li.classList.add('removing');

    // Wait for the CSS transition to finish before removing the node
    li.addEventListener('transitionend', () => li.remove(), { once: true });
  }

  updateUI();
}

// ── Event Listeners ───────────────────────────────────────────────────────────

/**
 * Form submission — triggered by the "Add Task" button or pressing Enter.
 */
taskForm.addEventListener('submit', (event) => {
  event.preventDefault(); // prevent page reload
  addTask(taskInput.value);
});

/**
 * Clear the error as soon as the user starts typing again.
 */
taskInput.addEventListener('input', clearError);

// ── Initialise ────────────────────────────────────────────────────────────────

// Sync the stats bar and empty-state on first load
updateUI();
