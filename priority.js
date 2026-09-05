(() => {
  const form = document.getElementById('taskForm');
  const titleInput = document.getElementById('title');
  const categoryInput = document.getElementById('category');
  const priorityInput = document.getElementById('priority');
  const list = document.getElementById('taskList');
  const empty = document.getElementById('empty');
  const clearBtn = document.getElementById('clearBtn');

  const STORAGE_KEY = 'priorityTasks_v1';
  let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

  function createTaskHTML(t){
    const li = document.createElement('li');
    li.className = `task-item priority-${t.priority.toLowerCase()}`;

    li.innerHTML = `
      <div class="task-left">
        <div>
          <div class="task-title">${escapeHtml(t.title)}</div>
          <div class="meta">${new Date(t.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <div class="badges">
        <div class="badge priority-pill ${t.priority.toLowerCase()}">${t.priority}</div>
        <div class="badge category">${t.category}</div>
        <div class="task-actions">
          <button class="icon-btn" data-id="${t.id}" aria-label="Delete">Delete</button>
        </div>
      </div>
    `;

    const del = li.querySelector('.icon-btn');
    del.addEventListener('click', () => {
      tasks = tasks.filter(x => x.id !== t.id);
      save(); render();
    });

    return li;
  }

  function render(){
    list.innerHTML = '';
    if(tasks.length === 0){ empty.style.display = 'block'; return }
    empty.style.display = 'none';
    tasks.forEach(t => list.appendChild(createTaskHTML(t)));
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if(!title) return;
    const task = {
      id: Date.now().toString(36),
      title, category: categoryInput.value, priority: priorityInput.value,
      createdAt: Date.now()
    };
    tasks.unshift(task);
    save(); render();
    form.reset(); titleInput.focus();
  });

  clearBtn.addEventListener('click', () => {
    if(!confirm('Clear all tasks?')) return;
    tasks = []; save(); render();
  });

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

  // initial render
  render();
})();
