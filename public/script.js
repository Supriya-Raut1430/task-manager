/**
 * TaskFlow — Frontend Application Logic (Vanilla JavaScript)
 * Communicates with Express REST API and manages UI state.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. Application State
  // ==========================================
  const state = {
    tasks: [],
    stats: { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 },
    categories: ['Personal', 'College', 'Work', 'Coding', 'GATE', 'DSA', 'Other'],
    filters: {
      search: '',
      status: 'all',
      category: 'All',
      priority: 'All',
      sortBy: 'newest'
    },
    editingTaskId: null,
    deletingTaskId: null,
    isDbConnected: true
  };

  // ==========================================
  // 2. DOM Elements
  // ==========================================
  // Theme & DB status
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const dbStatusBadge = document.getElementById('dbStatusBadge');
  const dbStatusText = document.getElementById('dbStatusText');
  const dbWarningBanner = document.getElementById('dbWarningBanner');
  const btnRetryDb = document.getElementById('btnRetryDb');

  // Stats
  const statTotalCount = document.getElementById('statTotalCount');
  const statPendingCount = document.getElementById('statPendingCount');
  const statProgressCount = document.getElementById('statProgressCount');
  const statCompletedCount = document.getElementById('statCompletedCount');
  const statOverdueCount = document.getElementById('statOverdueCount');

  // Filter & Search Controls
  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const statusFilterPills = document.getElementById('statusFilterPills');
  const categoryFilter = document.getElementById('categoryFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const sortBySelect = document.getElementById('sortBySelect');
  const btnResetFilters = document.getElementById('btnResetFilters');

  // Task Grid & States
  const taskGrid = document.getElementById('taskGrid');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const emptyState = document.getElementById('emptyState');
  const btnEmptyAddTask = document.getElementById('btnEmptyAddTask');

  // Task Modal Form
  const taskModal = document.getElementById('taskModal');
  const modalTitle = document.getElementById('modalTitle');
  const taskForm = document.getElementById('taskForm');
  const taskIdInput = document.getElementById('taskIdInput');
  const taskTitleInput = document.getElementById('taskTitleInput');
  const taskDescInput = document.getElementById('taskDescInput');
  const taskCategorySelect = document.getElementById('taskCategorySelect');
  const customCategoryInput = document.getElementById('customCategoryInput');
  const taskPrioritySelect = document.getElementById('taskPrioritySelect');
  const taskDueDateInput = document.getElementById('taskDueDateInput');
  const taskStatusSelect = document.getElementById('taskStatusSelect');
  const titleError = document.getElementById('titleError');
  const dueDateError = document.getElementById('dueDateError');
  const btnOpenNewTaskModal = document.getElementById('btnOpenNewTaskModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const btnSubmitTask = document.getElementById('btnSubmitTask');

  // Delete Modal
  const deleteModal = document.getElementById('deleteModal');
  const deleteTaskTitle = document.getElementById('deleteTaskTitle');
  const btnCancelDelete = document.getElementById('btnCancelDelete');
  const btnConfirmDelete = document.getElementById('btnConfirmDelete');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // ==========================================
  // 3. Theme Initialization & Management
  // ==========================================
  const initTheme = () => {
    const savedTheme = localStorage.getItem('taskflow_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  };

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('taskflow_theme', newTheme);
  };

  themeToggleBtn.addEventListener('click', toggleTheme);

  // ==========================================
  // 4. Toast Notifications
  // ==========================================
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '✅';
    } else if (type === 'error') {
      iconSvg = '❌';
    } else {
      iconSvg = 'ℹ️';
    }

    toast.innerHTML = `<span>${iconSvg}</span> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  };

  // Helper to escape HTML characters
  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // 5. Database Connection Status Checker
  // ==========================================
  const checkDatabaseHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (data.database === 'connected') {
        setDbStatus('connected', data);
      } else if (data.database === 'table_pending') {
        setDbStatus('table_pending', data);
      } else {
        setDbStatus('disconnected', data);
      }
    } catch (err) {
      setDbStatus('disconnected', { message: 'Server is not responding' });
    }
  };

  const setDbStatus = (statusState, info = {}) => {
    state.isDbConnected = statusState === 'connected' || statusState === 'table_pending';
    const bannerText = document.getElementById('dbBannerText');
    const sqlEditorLink = document.getElementById('btnOpenSqlEditor');

    if (info.sqlEditorUrl && sqlEditorLink) {
      sqlEditorLink.href = info.sqlEditorUrl;
    }

    if (statusState === 'connected') {
      dbStatusBadge.className = 'status-indicator-badge connected';
      dbStatusText.textContent = 'Supabase Connected';
      dbStatusBadge.setAttribute('title', 'Supabase PostgreSQL Database Connected');
      dbWarningBanner.classList.add('hidden');
    } else if (statusState === 'table_pending') {
      dbStatusBadge.className = 'status-indicator-badge connected';
      dbStatusText.textContent = 'Setup Pending';
      dbStatusBadge.setAttribute('title', 'Connected to Supabase project. Table "tasks" not created yet.');
      dbWarningBanner.classList.remove('hidden');
      if (bannerText) {
        bannerText.innerHTML = `<strong>Supabase Connected:</strong> Run <code>supabase-schema.sql</code> in the SQL Editor to activate PostgreSQL storage.`;
      }
    } else {
      dbStatusBadge.className = 'status-indicator-badge disconnected';
      dbStatusText.textContent = 'Disconnected';
      dbStatusBadge.setAttribute('title', info.message || 'Database disconnected');
      dbWarningBanner.classList.remove('hidden');
      if (bannerText) {
        bannerText.innerHTML = `<strong>Database Notice:</strong> ${escapeHtml(info.message || 'Supabase credentials missing or invalid in .env.')}`;
      }
    }
  };

  btnRetryDb.addEventListener('click', () => {
    checkDatabaseHealth();
    fetchTasksAndStats();
  });

  // ==========================================
  // 6. API Service (Fetch Implementation)
  // ==========================================
  const fetchTasks = async () => {
    try {
      // Build query string
      const params = new URLSearchParams();
      if (state.filters.search.trim()) params.append('search', state.filters.search.trim());
      
      if (state.filters.status === 'overdue') {
        params.append('filter', 'overdue');
      } else if (state.filters.status !== 'all') {
        params.append('status', state.filters.status);
      }

      if (state.filters.category !== 'All') params.append('category', state.filters.category);
      if (state.filters.priority !== 'All') params.append('priority', state.filters.priority);
      if (state.filters.sortBy) params.append('sortBy', state.filters.sortBy);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      
      if (response.status === 503) {
        let errMessage = 'Database service unavailable. Check your Supabase configuration.';
        try {
          const errData = await response.json();
          if (errData && errData.message) errMessage = errData.message;
        } catch (_) {}
        setDbStatus('disconnected', { message: errMessage });
        throw new Error(errMessage);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch tasks');
      }

      const result = await response.json();
      state.tasks = result.data || [];
      return state.tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showToast(error.message, 'error');
      return [];
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tasks/stats');
      if (response.ok) {
        const result = await response.json();
        state.stats = result.stats;
        updateStatsUI();

        // Dynamically add any newly discovered custom categories
        if (result.categories && Array.isArray(result.categories)) {
          result.categories.forEach(cat => {
            if (cat && !state.categories.includes(cat)) {
              state.categories.push(cat);
            }
          });
          populateCategoryDropdowns();
        }
      }
    } catch (err) {
      console.warn('Could not update stats:', err);
    }
  };

  const fetchTasksAndStats = async () => {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchStats()]);
    setLoading(false);
    renderTasks();
  };

  // ==========================================
  // 7. Render Functions
  // ==========================================
  const setLoading = (isLoading) => {
    if (isLoading) {
      loadingIndicator.classList.remove('hidden');
      taskGrid.classList.add('hidden');
      emptyState.classList.add('hidden');
    } else {
      loadingIndicator.classList.add('hidden');
      taskGrid.classList.remove('hidden');
    }
  };

  const updateStatsUI = () => {
    statTotalCount.textContent = state.stats.total || 0;
    statPendingCount.textContent = state.stats.pending || 0;
    statProgressCount.textContent = state.stats.inProgress || 0;
    statCompletedCount.textContent = state.stats.completed || 0;
    statOverdueCount.textContent = state.stats.overdue || 0;
  };

  const populateCategoryDropdowns = () => {
    const currentFilterVal = categoryFilter.value;
    
    // Populate filter dropdown
    categoryFilter.innerHTML = '<option value="All">All Categories</option>';
    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
    categoryFilter.value = state.categories.includes(currentFilterVal) ? currentFilterVal : 'All';

    // Populate modal select
    const currentModalVal = taskCategorySelect.value;
    taskCategorySelect.innerHTML = '';
    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      taskCategorySelect.appendChild(opt);
    });
    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = '➕ Add Custom Category...';
    taskCategorySelect.appendChild(customOpt);

    if (state.categories.includes(currentModalVal)) {
      taskCategorySelect.value = currentModalVal;
    }
  };

  // Helper date formatter
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  // Render Task Cards Grid
  const renderTasks = () => {
    taskGrid.innerHTML = '';

    if (!state.tasks || state.tasks.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    state.tasks.forEach(task => {
      const card = createTaskCardElement(task);
      taskGrid.appendChild(card);
    });
  };

  // Build Individual Task Card DOM
  const createTaskCardElement = (task) => {
    const card = document.createElement('article');
    
    const isCompleted = task.status === 'Completed';
    const isOverdue = task.isOverdue || (new Date(task.dueDate) < new Date() && !isCompleted);

    card.className = `task-card priority-${task.priority} ${isCompleted ? 'is-completed' : ''} ${isOverdue ? 'is-overdue' : ''}`;
    card.setAttribute('data-id', task._id);

    const formattedDueDate = formatDate(task.dueDate, true);
    const formattedCreatedDate = formatDate(task.createdAt);

    card.innerHTML = `
      <div class="card-header-row">
        <div class="title-checkbox-wrap">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            title="Mark as ${isCompleted ? 'Pending' : 'Completed'}"
            ${isCompleted ? 'checked' : ''} 
            data-action="toggle-status" 
            data-id="${task._id}"
          />
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
        </div>
      </div>

      ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}

      <div class="card-badges-row">
        <span class="badge badge-category">📁 ${escapeHtml(task.category)}</span>
        <span class="badge badge-priority-${task.priority}">${task.priority}</span>
        <span class="badge badge-status-${task.status.replace(/\s+/g, '-')}">${task.status}</span>
        ${isOverdue ? `<span class="badge badge-overdue">⚠️ Overdue</span>` : ''}
      </div>

      <div class="card-dates-row">
        <div class="date-item due-date ${isOverdue ? 'is-overdue' : ''}" title="Due Date">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Due: ${formattedDueDate}</span>
        </div>
        <div class="date-item created-date" title="Created on">
          <span>Created: ${formattedCreatedDate}</span>
        </div>
      </div>

      <div class="card-actions-row">
        <button 
          class="btn-icon btn-icon-complete" 
          title="${isCompleted ? 'Mark Pending' : 'Mark Completed'}" 
          data-action="toggle-status" 
          data-id="${task._id}"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>

        <button 
          class="btn-icon btn-icon-edit" 
          title="Edit task" 
          data-action="edit" 
          data-id="${task._id}"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </button>

        <button 
          class="btn-icon btn-icon-delete" 
          title="Delete task" 
          data-action="delete" 
          data-id="${task._id}"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    return card;
  };

  // ==========================================
  // 8. Event Delegations for Task Actions
  // ==========================================
  taskGrid.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    const taskId = target.getAttribute('data-id');
    const task = state.tasks.find(t => t._id === taskId);

    if (!task) return;

    if (action === 'toggle-status') {
      const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await handleToggleStatus(taskId, nextStatus);
    } else if (action === 'edit') {
      openEditModal(task);
    } else if (action === 'delete') {
      openDeleteModal(task);
    }
  });

  // Toggle Task Status (PATCH /api/tasks/:id/status)
  const handleToggleStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      showToast(`Task status updated to "${newStatus}"`, 'success');
      await fetchTasksAndStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // 9. Modal Management (Add / Edit)
  // ==========================================
  const openNewTaskModal = () => {
    state.editingTaskId = null;
    modalTitle.textContent = 'Create New Task';
    taskForm.reset();
    taskIdInput.value = '';
    titleError.textContent = '';
    dueDateError.textContent = '';
    taskCategorySelect.value = 'Personal';
    customCategoryInput.classList.add('hidden');
    customCategoryInput.value = '';
    taskPrioritySelect.value = 'Medium';
    taskStatusSelect.value = 'Pending';

    // Default due date: tomorrow at 23:59
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    taskDueDateInput.value = formatDateTimeLocal(tomorrow);

    taskModal.classList.remove('hidden');
    taskTitleInput.focus();
  };

  const openEditModal = (task) => {
    state.editingTaskId = task._id;
    modalTitle.textContent = 'Edit Task';
    taskIdInput.value = task._id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    
    // Category check
    if (state.categories.includes(task.category)) {
      taskCategorySelect.value = task.category;
      customCategoryInput.classList.add('hidden');
      customCategoryInput.value = '';
    } else {
      taskCategorySelect.value = '__custom__';
      customCategoryInput.classList.remove('hidden');
      customCategoryInput.value = task.category;
    }

    taskPrioritySelect.value = task.priority;
    taskStatusSelect.value = task.status;
    taskDueDateInput.value = formatDateTimeLocal(new Date(task.dueDate));

    titleError.textContent = '';
    dueDateError.textContent = '';

    taskModal.classList.remove('hidden');
    taskTitleInput.focus();
  };

  const closeModal = () => {
    taskModal.classList.add('hidden');
    taskForm.reset();
    state.editingTaskId = null;
  };

  // Format date for datetime-local input
  function formatDateTimeLocal(date) {
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Toggle custom category input when dropdown changes
  taskCategorySelect.addEventListener('change', () => {
    if (taskCategorySelect.value === '__custom__') {
      customCategoryInput.classList.remove('hidden');
      customCategoryInput.focus();
    } else {
      customCategoryInput.classList.add('hidden');
      customCategoryInput.value = '';
    }
  });

  // Form Submit Handler (Create or Update Task)
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validation
    const titleVal = taskTitleInput.value.trim();
    const dueDateVal = taskDueDateInput.value;

    let hasError = false;
    titleError.textContent = '';
    dueDateError.textContent = '';

    if (!titleVal) {
      titleError.textContent = 'Please enter a task title.';
      hasError = true;
    } else if (titleVal.length < 2) {
      titleError.textContent = 'Title must be at least 2 characters long.';
      hasError = true;
    }

    if (!dueDateVal) {
      dueDateError.textContent = 'Please select a due date.';
      hasError = true;
    }

    if (hasError) return;

    // Resolve Category
    let categoryVal = taskCategorySelect.value;
    if (categoryVal === '__custom__') {
      categoryVal = customCategoryInput.value.trim() || 'General';
      if (!state.categories.includes(categoryVal)) {
        state.categories.push(categoryVal);
        populateCategoryDropdowns();
      }
    }

    const payload = {
      title: titleVal,
      description: taskDescInput.value.trim(),
      category: categoryVal,
      priority: taskPrioritySelect.value,
      status: taskStatusSelect.value,
      dueDate: new Date(dueDateVal).toISOString()
    };

    btnSubmitTask.disabled = true;

    try {
      let response;
      if (state.editingTaskId) {
        // PUT /api/tasks/:id
        response = await fetch(`/api/tasks/${state.editingTaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // POST /api/tasks
        response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save task');
      }

      const result = await response.json();
      showToast(result.message || 'Task saved successfully!', 'success');
      closeModal();
      await fetchTasksAndStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnSubmitTask.disabled = false;
    }
  });

  // Modal open/close listeners
  btnOpenNewTaskModal.addEventListener('click', openNewTaskModal);
  btnEmptyAddTask.addEventListener('click', openNewTaskModal);
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);

  // Close modal when clicking backdrop
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeModal();
  });

  // ==========================================
  // 10. Delete Confirmation Modal
  // ==========================================
  const openDeleteModal = (task) => {
    state.deletingTaskId = task._id;
    deleteTaskTitle.textContent = `"${task.title}"`;
    deleteModal.classList.remove('hidden');
  };

  const closeDeleteModal = () => {
    deleteModal.classList.add('hidden');
    state.deletingTaskId = null;
  };

  btnCancelDelete.addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  btnConfirmDelete.addEventListener('click', async () => {
    if (!state.deletingTaskId) return;

    btnConfirmDelete.disabled = true;

    try {
      const response = await fetch(`/api/tasks/${state.deletingTaskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete task');
      }

      showToast('Task deleted successfully', 'success');
      closeDeleteModal();
      await fetchTasksAndStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnConfirmDelete.disabled = false;
    }
  });

  // Escape key closes open modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!taskModal.classList.contains('hidden')) closeModal();
      if (!deleteModal.classList.contains('hidden')) closeDeleteModal();
    }
  });

  // ==========================================
  // 11. Search, Filtering, and Sorting Handlers
  // ==========================================
  let searchDebounceTimer = null;
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    state.filters.search = val;

    if (val.trim()) {
      btnClearSearch.classList.remove('hidden');
    } else {
      btnClearSearch.classList.add('hidden');
    }

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      fetchTasksAndStats();
    }, 300);
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    state.filters.search = '';
    btnClearSearch.classList.add('hidden');
    fetchTasksAndStats();
  });

  // Status Filter Pills
  statusFilterPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;

    document.querySelectorAll('#statusFilterPills .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    state.filters.status = pill.getAttribute('data-filter');
    fetchTasksAndStats();
  });

  // Dashboard Stats card click also applies quick filter
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.getAttribute('data-filter');
      const targetPill = document.querySelector(`#statusFilterPills .pill[data-filter="${filter === 'in_progress' ? 'In Progress' : filter === 'all' ? 'all' : filter === 'pending' ? 'Pending' : filter === 'completed' ? 'Completed' : 'overdue'}"]`);
      
      if (targetPill) {
        targetPill.click();
      }
    });
  });

  // Category Filter
  categoryFilter.addEventListener('change', () => {
    state.filters.category = categoryFilter.value;
    fetchTasksAndStats();
  });

  // Priority Filter
  priorityFilter.addEventListener('change', () => {
    state.filters.priority = priorityFilter.value;
    fetchTasksAndStats();
  });

  // Sort By
  sortBySelect.addEventListener('change', () => {
    state.filters.sortBy = sortBySelect.value;
    fetchTasksAndStats();
  });

  // Reset All Filters
  btnResetFilters.addEventListener('click', () => {
    state.filters.search = '';
    state.filters.status = 'all';
    state.filters.category = 'All';
    state.filters.priority = 'All';
    state.filters.sortBy = 'newest';

    searchInput.value = '';
    btnClearSearch.classList.add('hidden');
    categoryFilter.value = 'All';
    priorityFilter.value = 'All';
    sortBySelect.value = 'newest';

    document.querySelectorAll('#statusFilterPills .pill').forEach(p => p.classList.remove('active'));
    const defaultPill = document.querySelector('#statusFilterPills .pill[data-filter="all"]');
    if (defaultPill) defaultPill.classList.add('active');

    fetchTasksAndStats();
  });

  // ==========================================
  // 12. User Authentication State in Dashboard
  // ==========================================
  const userProfileWidget = document.getElementById('userProfileWidget');

  const updateUserWidgetUI = () => {
    if (!userProfileWidget) return;

    const rawUser = localStorage.getItem('taskflow_user');
    if (!rawUser) {
      userProfileWidget.innerHTML = `
        <a href="/login" id="btnHeaderAuth" class="btn-header-auth" title="Sign In to your account">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Sign In</span>
        </a>
      `;
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      const displayName = user.fullName || user.email?.split('@')[0] || 'User';
      const initial = displayName.charAt(0).toUpperCase();

      userProfileWidget.innerHTML = `
        <div class="user-badge" title="Logged in as ${escapeHtml(user.email || displayName)}">
          <div class="user-avatar">${escapeHtml(initial)}</div>
          <span>${escapeHtml(displayName)}</span>
        </div>
        <button id="btnHeaderLogout" class="btn-header-logout" title="Log Out">Log Out</button>
      `;

      const btnLogout = document.getElementById('btnHeaderLogout');
      if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch (_) {}
          localStorage.removeItem('taskflow_user');
          localStorage.removeItem('taskflow_token');
          showToast('Logged out successfully.', 'info');
          updateUserWidgetUI();
        });
      }
    } catch (_) {
      localStorage.removeItem('taskflow_user');
      updateUserWidgetUI();
    }
  };

  // ==========================================
  // 13. App Bootstrapping
  // ==========================================
  initTheme();
  updateUserWidgetUI();
  populateCategoryDropdowns();
  checkDatabaseHealth();
  fetchTasksAndStats();

  // Periodic health check every 15 seconds
  setInterval(checkDatabaseHealth, 15000);
});
