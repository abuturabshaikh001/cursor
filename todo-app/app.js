'use strict';

(function initTodoApp() {
  const storageKey = 'todo-app:v1';
  const themeKey = 'todo-app:theme';

  /** @typedef {{ id: string, text: string, completed: boolean, createdAt: number }} Todo */

  /** @type {Todo[]} */
  let todos = [];
  /** @type {'all' | 'active' | 'completed'} */
  let currentFilter = 'all';

  const elements = {
    root: document.documentElement,
    form: document.getElementById('todo-form'),
    input: document.getElementById('todo-text'),
    list: document.getElementById('todo-list'),
    itemsLeft: document.getElementById('items-left'),
    filters: document.querySelectorAll('.filter'),
    toggleAll: document.getElementById('toggle-all'),
    clearCompleted: document.getElementById('clear-completed'),
    themeToggle: document.getElementById('theme-toggle'),
  };

  function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          todos = parsed.filter(Boolean);
        }
      }
    } catch (error) {
      console.error('Failed to load state', error);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(todos));
    } catch (error) {
      console.error('Failed to save state', error);
    }
  }

  function loadTheme() {
    const saved = localStorage.getItem(themeKey);
    if (saved === 'light') {
      document.body.setAttribute('data-theme', 'light');
    }
  }

  function toggleTheme() {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.body.removeAttribute('data-theme');
      localStorage.removeItem(themeKey);
    } else {
      document.body.setAttribute('data-theme', 'light');
      localStorage.setItem(themeKey, 'light');
    }
  }

  function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.filter === filter);
    });
    render();
  }

  function getFilteredTodos() {
    switch (currentFilter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }

  function updateItemsLeft() {
    const remaining = todos.filter((t) => !t.completed).length;
    elements.itemsLeft.textContent = `${remaining} item${remaining !== 1 ? 's' : ''} left`;
  }

  function createTodoItemElement(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', 'Toggle completed');

    const text = document.createElement('div');
    text.className = 'todo-text';
    text.textContent = todo.text;
    text.setAttribute('role', 'textbox');
    text.setAttribute('aria-label', 'Todo text');
    text.tabIndex = 0;

    const actions = document.createElement('div');
    const editButton = document.createElement('button');
    editButton.className = 'secondary';
    editButton.type = 'button';
    editButton.textContent = 'Edit';
    const deleteButton = document.createElement('button');
    deleteButton.className = 'danger';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(actions);

    checkbox.addEventListener('change', () => {
      todo.completed = checkbox.checked;
      saveState();
      render();
    });

    editButton.addEventListener('click', () => beginEdit(text, todo));
    text.addEventListener('dblclick', () => beginEdit(text, todo));

    deleteButton.addEventListener('click', () => {
      todos = todos.filter((t) => t.id !== todo.id);
      saveState();
      render();
    });

    return li;
  }

  function beginEdit(textElement, todo) {
    textElement.setAttribute('contenteditable', 'true');
    textElement.focus();
    placeCaretAtEnd(textElement);

    function commitEdit() {
      const newText = textElement.textContent.trim();
      textElement.removeAttribute('contenteditable');
      if (newText.length === 0) {
        // If cleared, delete the todo
        todos = todos.filter((t) => t.id !== todo.id);
      } else {
        todo.text = newText;
      }
      saveState();
      render();
    }

    function cancelEdit() {
      textElement.textContent = todo.text;
      textElement.removeAttribute('contenteditable');
    }

    function onKeydown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitEdit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
      }
    }

    textElement.addEventListener('keydown', onKeydown, { once: true });
    textElement.addEventListener('blur', commitEdit, { once: true });
  }

  function placeCaretAtEnd(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function render() {
    elements.list.innerHTML = '';
    const visible = getFilteredTodos();
    visible.forEach((todo) => {
      elements.list.appendChild(createTodoItemElement(todo));
    });
    updateItemsLeft();
  }

  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    todos.unshift({ id: generateId(), text: trimmed, completed: false, createdAt: Date.now() });
    saveState();
    render();
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.completed);
    saveState();
    render();
  }

  function toggleAll() {
    const hasActive = todos.some((t) => !t.completed);
    todos = todos.map((t) => ({ ...t, completed: hasActive }));
    saveState();
    render();
  }

  function attachEventListeners() {
    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      addTodo(elements.input.value);
      elements.input.value = '';
    });

    elements.filters.forEach((button) => {
      button.addEventListener('click', () => setFilter(button.dataset.filter));
    });

    elements.clearCompleted.addEventListener('click', clearCompleted);
    elements.toggleAll.addEventListener('click', toggleAll);
    elements.themeToggle.addEventListener('click', toggleTheme);
  }

  // Initialize
  loadState();
  loadTheme();
  attachEventListeners();
  render();
})();
