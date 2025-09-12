class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.taskCount = document.getElementById('taskCount');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.filterBtns = document.querySelectorAll('.filter-btn');
    }

    bindEvents() {
        // Add todo
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        // Prevent form submission on Enter in input
        this.todoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.todoInput.value = '';
        this.saveTodos();
        this.render();
        this.todoInput.focus();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingId = id;
        this.render();
        
        // Focus on the edit input
        setTimeout(() => {
            const editInput = document.querySelector(`[data-edit-id="${id}"]`);
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 0);
    }

    saveEdit(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.saveTodos();
        }
        this.editingId = null;
        this.render();
    }

    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    deleteTodo(id) {
        const todoElement = document.querySelector(`[data-todo-id="${id}"]`);
        if (todoElement) {
            todoElement.classList.add('removing');
            setTimeout(() => {
                this.todos = this.todos.filter(t => t.id !== id);
                this.saveTodos();
                this.render();
            }, 300);
        }
    }

    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        
        // Update task count
        const activeCount = this.todos.filter(t => !t.completed).length;
        this.taskCount.textContent = `${activeCount} task${activeCount !== 1 ? 's' : ''} remaining`;

        // Update clear completed button
        const completedCount = this.todos.filter(t => t.completed).length;
        this.clearCompletedBtn.disabled = completedCount === 0;

        // Show/hide empty state
        if (filteredTodos.length === 0) {
            this.todoList.style.display = 'none';
            this.emptyState.style.display = 'block';
            
            // Update empty state message based on filter
            const emptyMessage = this.getEmptyMessage();
            this.emptyState.innerHTML = `
                <i class="fas fa-clipboard-list"></i>
                <h3>${emptyMessage.title}</h3>
                <p>${emptyMessage.description}</p>
            `;
        } else {
            this.todoList.style.display = 'block';
            this.emptyState.style.display = 'none';
        }

        // Render todos
        this.todoList.innerHTML = filteredTodos.map(todo => this.renderTodo(todo)).join('');
    }

    getEmptyMessage() {
        switch (this.currentFilter) {
            case 'active':
                return {
                    title: 'No active tasks',
                    description: 'All tasks are completed! Great job!'
                };
            case 'completed':
                return {
                    title: 'No completed tasks',
                    description: 'Complete some tasks to see them here.'
                };
            default:
                return {
                    title: 'No tasks yet',
                    description: 'Add a task above to get started!'
                };
        }
    }

    renderTodo(todo) {
        if (this.editingId === todo.id) {
            return this.renderEditTodo(todo);
        }

        return `
            <div class="todo-item" data-todo-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="todoApp.toggleTodo('${todo.id}')">
                </div>
                <div class="todo-text ${todo.completed ? 'completed' : ''}">
                    ${this.escapeHtml(todo.text)}
                </div>
                <div class="todo-actions">
                    <button class="todo-btn edit-btn" onclick="todoApp.editTodo('${todo.id}')" 
                            title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="todo-btn delete-btn" onclick="todoApp.deleteTodo('${todo.id}')" 
                            title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderEditTodo(todo) {
        return `
            <div class="todo-item" data-todo-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="todoApp.toggleTodo('${todo.id}')">
                </div>
                <div class="todo-text">
                    <input type="text" 
                           data-edit-id="${todo.id}"
                           value="${this.escapeHtml(todo.text)}" 
                           class="edit-input"
                           maxlength="100"
                           onkeypress="if(event.key==='Enter') todoApp.saveEdit('${todo.id}', this.value)"
                           onblur="todoApp.saveEdit('${todo.id}', this.value)"
                           onkeydown="if(event.key==='Escape') todoApp.cancelEdit()">
                </div>
                <div class="todo-actions">
                    <button class="todo-btn edit-btn" onclick="todoApp.saveEdit('${todo.id}', document.querySelector('[data-edit-id=\\'${todo.id}\\']').value)" 
                            title="Save changes">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="todo-btn delete-btn" onclick="todoApp.cancelEdit()" 
                            title="Cancel editing">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadTodos() {
        const saved = localStorage.getItem('todos');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});

// Add some sample todos for demonstration (only if no todos exist)
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('todos') === null) {
        const sampleTodos = [
            {
                id: '1',
                text: 'Welcome to your Todo App!',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                text: 'Click the checkbox to mark tasks as complete',
                completed: true,
                createdAt: new Date().toISOString()
            },
            {
                id: '3',
                text: 'Use the edit button to modify tasks',
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('todos', JSON.stringify(sampleTodos));
        if (window.todoApp) {
            window.todoApp.todos = sampleTodos;
            window.todoApp.render();
        }
    }
});