// TodoFlow - Modern Task Manager
// Comprehensive JavaScript functionality with local storage, animations, and accessibility

class TodoFlow {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.selectedTodos = new Set();
        this.theme = this.loadTheme();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.renderTodos();
        this.updateStats();
        this.setupKeyboardShortcuts();
        this.setupDragAndDrop();
        this.setupServiceWorker();
    }

    // Theme Management
    loadTheme() {
        const savedTheme = localStorage.getItem('todoflow-theme');
        return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    saveTheme(theme) {
        localStorage.setItem('todoflow-theme', theme);
        this.theme = theme;
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', this.theme === 'dark');
        }
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.saveTheme(newTheme);
        this.applyTheme();
        this.showToast('Theme changed', `Switched to ${newTheme} mode`, 'success');
    }

    // Todo Management
    loadTodos() {
        try {
            const saved = localStorage.getItem('todoflow-todos');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading todos:', error);
            return [];
        }
    }

    saveTodos() {
        try {
            localStorage.setItem('todoflow-todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error saving todos:', error);
            this.showToast('Error', 'Failed to save todos', 'error');
        }
    }

    addTodo(text, priority = 'medium') {
        if (!text.trim()) {
            this.showToast('Error', 'Please enter a task', 'error');
            return;
        }

        const todo = {
            id: Date.now().toString(),
            text: text.trim(),
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        this.showToast('Success', 'Task added successfully', 'success');
        
        // Clear form
        document.getElementById('todoInput').value = '';
        document.getElementById('prioritySelect').value = 'medium';
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            const message = todo.completed ? 'Task completed!' : 'Task marked as active';
            this.showToast('Updated', message, 'success');
        }
    }

    deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.selectedTodos.delete(id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.updateBulkActions();
            this.showToast('Deleted', 'Task removed successfully', 'success');
        }
    }

    editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.renderTodos();
            this.showToast('Updated', 'Task edited successfully', 'success');
        }
    }

    // Filtering
    setFilter(filter) {
        this.currentFilter = filter;
        this.updateFilterTabs();
        this.renderTodos();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    updateFilterTabs() {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === this.currentFilter);
        });
    }

    // Selection Management
    toggleSelection(id) {
        if (this.selectedTodos.has(id)) {
            this.selectedTodos.delete(id);
        } else {
            this.selectedTodos.add(id);
        }
        this.updateBulkActions();
        this.renderTodos();
    }

    selectAll() {
        const filteredTodos = this.getFilteredTodos();
        filteredTodos.forEach(todo => this.selectedTodos.add(todo.id));
        this.updateBulkActions();
        this.renderTodos();
    }

    clearSelection() {
        this.selectedTodos.clear();
        this.updateBulkActions();
        this.renderTodos();
    }

    bulkComplete() {
        let completedCount = 0;
        this.selectedTodos.forEach(id => {
            const todo = this.todos.find(t => t.id === id);
            if (todo && !todo.completed) {
                todo.completed = true;
                todo.updatedAt = new Date().toISOString();
                completedCount++;
            }
        });
        
        if (completedCount > 0) {
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showToast('Success', `${completedCount} tasks completed`, 'success');
        }
        
        this.clearSelection();
    }

    bulkDelete() {
        const count = this.selectedTodos.size;
        this.todos = this.todos.filter(todo => !this.selectedTodos.has(todo.id));
        this.selectedTodos.clear();
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        this.updateBulkActions();
        this.showToast('Deleted', `${count} tasks removed`, 'success');
    }

    // Rendering
    renderTodos() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todoList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        todoList.style.display = 'block';
        emptyState.style.display = 'none';

        todoList.innerHTML = filteredTodos.map(todo => this.createTodoElement(todo)).join('');
    }

    createTodoElement(todo) {
        const isSelected = this.selectedTodos.has(todo.id);
        const priorityClass = `priority-${todo.priority}`;
        const completedClass = todo.completed ? 'completed' : '';
        const selectedClass = isSelected ? 'selected' : '';
        
        const createdDate = new Date(todo.createdAt).toLocaleDateString();
        const updatedDate = todo.updatedAt !== todo.createdAt ? 
            `Updated: ${new Date(todo.updatedAt).toLocaleDateString()}` : 
            `Created: ${createdDate}`;

        return `
            <li class="todo-item ${completedClass} ${selectedClass}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="todoFlow.toggleTodo('${todo.id}')"
                     role="checkbox"
                     aria-checked="${todo.completed}"
                     tabindex="0"
                     onkeydown="if(event.key==='Enter'||event.key===' ') {event.preventDefault(); todoFlow.toggleTodo('${todo.id}')}">
                </div>
                <div class="todo-content">
                    <div class="todo-text" 
                         contenteditable="${!todo.completed}"
                         onblur="todoFlow.editTodo('${todo.id}', this.textContent)"
                         onkeydown="if(event.key==='Enter') {event.preventDefault(); this.blur()}"
                         aria-label="Task text">
                        ${this.escapeHtml(todo.text)}
                    </div>
                    <div class="todo-meta">
                        <span class="todo-priority ${priorityClass}">${todo.priority}</span>
                        <span class="todo-date">${updatedDate}</span>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="todo-action" 
                            onclick="todoFlow.toggleSelection('${todo.id}')"
                            aria-label="${isSelected ? 'Deselect' : 'Select'} task"
                            title="${isSelected ? 'Deselect' : 'Select'} task">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </button>
                    <button class="todo-action delete" 
                            onclick="todoFlow.deleteTodo('${todo.id}')"
                            aria-label="Delete task"
                            title="Delete task">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                        </svg>
                    </button>
                </div>
            </li>
        `;
    }

    // Statistics
    updateStats() {
        const totalTasks = this.todos.length;
        const completedTasks = this.todos.filter(t => t.completed).length;
        const activeTasks = totalTasks - completedTasks;
        const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Update main stats
        const statsText = document.getElementById('todoStats');
        if (statsText) {
            const remainingText = activeTasks === 1 ? 'task' : 'tasks';
            statsText.textContent = `${activeTasks} ${remainingText} remaining`;
        }

        // Update modal stats
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('activeTasks').textContent = activeTasks;
        document.getElementById('productivityScore').textContent = `${productivityScore}%`;

        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill && progressText) {
            progressFill.style.width = `${productivityScore}%`;
            progressText.textContent = `${productivityScore}% Complete`;
        }
    }

    // Bulk Actions
    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const bulkCount = document.getElementById('bulkCount');
        
        if (this.selectedTodos.size > 0) {
            bulkActions.style.display = 'block';
            bulkCount.textContent = `${this.selectedTodos.size} selected`;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    // Modal Management
    showStatsModal() {
        this.updateStats();
        document.getElementById('statsModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const modal = document.querySelector('.modal');
        modal.focus();
    }

    hideStatsModal() {
        document.getElementById('statsModal').style.display = 'none';
        document.body.style.overflow = '';
        
        // Return focus to stats button
        document.getElementById('statsToggle').focus();
    }

    // Toast Notifications
    showToast(title, message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        const toastId = `toast-${Date.now()}`;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;
        
        const iconMap = {
            success: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
            error: '<path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
            warning: '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${iconMap[type]}
                </svg>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="todoFlow.hideToast('${toastId}')" aria-label="Close notification">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            this.hideToast(toastId);
        }, 4000);
    }

    hideToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Add todo form
        document.getElementById('addTodoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('todoInput');
            const priority = document.getElementById('prioritySelect').value;
            this.addTodo(input.value, priority);
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.setFilter(tab.dataset.filter);
            });
        });

        // Stats modal
        document.getElementById('statsToggle').addEventListener('click', () => {
            this.showStatsModal();
        });

        document.getElementById('closeStatsModal').addEventListener('click', () => {
            this.hideStatsModal();
        });

        // Modal overlay click to close
        document.getElementById('statsModal').addEventListener('click', (e) => {
            if (e.target.id === 'statsModal') {
                this.hideStatsModal();
            }
        });

        // Bulk actions
        document.getElementById('bulkComplete').addEventListener('click', () => {
            this.bulkComplete();
        });

        document.getElementById('bulkDelete').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete ${this.selectedTodos.size} tasks?`)) {
                this.bulkDelete();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to add todo
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const input = document.getElementById('todoInput');
                if (document.activeElement === input) {
                    e.preventDefault();
                    const priority = document.getElementById('prioritySelect').value;
                    this.addTodo(input.value, priority);
                }
            }
            
            // Escape to close modal
            if (e.key === 'Escape') {
                const modal = document.getElementById('statsModal');
                if (modal.style.display === 'flex') {
                    this.hideStatsModal();
                }
            }
        });
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + 1, 2, 3 for filters
            if (e.altKey && !e.ctrlKey && !e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.setFilter('all');
                        break;
                    case '2':
                        e.preventDefault();
                        this.setFilter('active');
                        break;
                    case '3':
                        e.preventDefault();
                        this.setFilter('completed');
                        break;
                }
            }
            
            // Alt + T for theme toggle
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Alt + S for stats
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                this.showStatsModal();
            }
        });
    }

    // Drag and Drop (for future enhancement)
    setupDragAndDrop() {
        // This could be implemented for reordering todos
        // For now, we'll keep it simple
    }

    // Service Worker
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }

    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export/Import functionality
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `todoflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Exported', 'Todos exported successfully', 'success');
    }

    importTodos(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTodos = JSON.parse(e.target.result);
                if (Array.isArray(importedTodos)) {
                    this.todos = importedTodos;
                    this.saveTodos();
                    this.renderTodos();
                    this.updateStats();
                    this.showToast('Imported', 'Todos imported successfully', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showToast('Error', 'Failed to import todos', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Search functionality
    searchTodos(query) {
        if (!query.trim()) {
            this.renderTodos();
            return;
        }
        
        const filteredTodos = this.todos.filter(todo => 
            todo.text.toLowerCase().includes(query.toLowerCase())
        );
        
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        
        if (filteredTodos.length === 0) {
            todoList.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                </div>
                <h3>No tasks found</h3>
                <p>No tasks match your search for "${query}".</p>
            `;
            return;
        }
        
        todoList.style.display = 'block';
        emptyState.style.display = 'none';
        todoList.innerHTML = filteredTodos.map(todo => this.createTodoElement(todo)).join('');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoFlow = new TodoFlow();
    
    // Add some helpful console messages
    console.log('🎉 TodoFlow loaded successfully!');
    console.log('💡 Keyboard shortcuts:');
    console.log('   Alt + 1/2/3: Switch filters');
    console.log('   Alt + T: Toggle theme');
    console.log('   Alt + S: Show statistics');
    console.log('   Ctrl/Cmd + Enter: Add todo');
    console.log('   Escape: Close modals');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.todoFlow) {
        // Refresh todos when page becomes visible
        window.todoFlow.renderTodos();
        window.todoFlow.updateStats();
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    if (window.todoFlow) {
        window.todoFlow.showToast('Online', 'Connection restored', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.todoFlow) {
        window.todoFlow.showToast('Offline', 'Working offline', 'warning');
    }
});