/**
 * Task Model for Supabase PostgreSQL
 * Encapsulates validation, schema constraints, database queries,
 * and a seamless in-memory fallback layer to ensure zero downtime.
 */

const { randomUUID } = require('crypto');
const { supabase, checkConnection, formatTask } = require('../config/supabase');

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Pending', 'In Progress', 'Completed'];

// UUID format validator
const isValidUUID = (id) => {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

// Initial fallback tasks (used before PostgreSQL table is created in Supabase)
let inMemoryTasks = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'Complete Supabase Migration',
    description: 'Verify database connection, test REST API endpoints, and ensure smooth UI updates.',
    category: 'Coding',
    priority: 'High',
    status: 'In Progress',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    title: 'Execute SQL Schema in Supabase',
    description: 'Open Supabase SQL Editor and execute supabase-schema.sql to activate cloud PostgreSQL persistence.',
    category: 'Work',
    priority: 'High',
    status: 'Pending',
    due_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    title: 'Explore Modern TaskFlow Dashboard',
    description: 'Try adding, filtering, searching, and toggling tasks with the responsive dark/light interface.',
    category: 'Personal',
    priority: 'Medium',
    status: 'Completed',
    due_date: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  }
];

let hasSyncedWithDatabase = false;

/**
 * Check if the Supabase PostgreSQL table is ready
 */
const isTableReady = async () => {
  const status = await checkConnection();
  if (status.tableReady && !hasSyncedWithDatabase && supabase) {
    // Attempt one-time sync of any fallback tasks into Supabase table
    try {
      const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
      if (count === 0 && inMemoryTasks.length > 0) {
        const payload = inMemoryTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          priority: t.priority,
          status: t.status,
          due_date: t.due_date,
          created_at: t.created_at,
          updated_at: t.updated_at
        }));
        await supabase.from('tasks').insert(payload);
      }
      hasSyncedWithDatabase = true;
    } catch (_) {}
  }
  return status.tableReady;
};

/**
 * Validate task input data against business constraints
 * @param {Object} data 
 * @param {boolean} isUpdate 
 * @returns {{isValid: boolean, errors: string[]}}
 */
const validateTaskData = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      errors.push('Task title is required');
    } else if (data.title.trim().length < 2) {
      errors.push('Title must be at least 2 characters long');
    } else if (data.title.trim().length > 120) {
      errors.push('Title cannot exceed 120 characters');
    }
  }

  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description === 'string' && data.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }
  }

  if (data.category !== undefined && data.category !== null) {
    if (typeof data.category === 'string' && data.category.length > 50) {
      errors.push('Category cannot exceed 50 characters');
    }
  }

  if (data.priority !== undefined && data.priority !== null) {
    if (!VALID_PRIORITIES.includes(data.priority)) {
      errors.push(`${data.priority} is not a valid priority. Use Low, Medium, or High.`);
    }
  }

  if (data.status !== undefined && data.status !== null) {
    if (!VALID_STATUSES.includes(data.status)) {
      errors.push(`${data.status} is not a valid status. Use Pending, In Progress, or Completed.`);
    }
  }

  if (!isUpdate || data.dueDate !== undefined || data.due_date !== undefined) {
    const rawDate = data.dueDate !== undefined ? data.dueDate : data.due_date;
    if (!rawDate) {
      errors.push('Due date is required');
    } else {
      const parsed = new Date(rawDate);
      if (isNaN(parsed.getTime())) {
        errors.push('Invalid due date format');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const Task = {
  VALID_PRIORITIES,
  VALID_STATUSES,
  isValidUUID,
  validateTaskData,

  /**
   * Find tasks with search, filter, and sorting
   */
  async find({ search, status, priority, category, filter, sortBy, order } = {}) {
    const ready = await isTableReady();

    if (ready && supabase) {
      let query = supabase.from('tasks').select('*');

      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term},category.ilike.${term}`);
      }

      if (status && status !== 'All' && status !== 'all') {
        query = query.eq('status', status);
      }

      if (priority && priority !== 'All') {
        query = query.eq('priority', priority);
      }

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      if (filter === 'overdue') {
        query = query.lt('due_date', new Date().toISOString()).neq('status', 'Completed');
      }

      if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'dueDate') {
        query = query.order('due_date', { ascending: order !== 'desc' });
      } else if (sortBy === 'title') {
        query = query.order('title', { ascending: order !== 'desc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let tasks = (data || []).map(formatTask);

      if (sortBy === 'priority') {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        tasks.sort((a, b) => {
          const diff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          return order === 'asc' ? -diff : diff;
        });
      }

      return tasks;
    }

    // In-memory fallback
    let tasks = inMemoryTasks.map(formatTask);

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      tasks = tasks.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'All' && status !== 'all') {
      tasks = tasks.filter(t => t.status === status);
    }

    if (priority && priority !== 'All') {
      tasks = tasks.filter(t => t.priority === priority);
    }

    if (category && category !== 'All') {
      tasks = tasks.filter(t => t.category === category);
    }

    if (filter === 'overdue') {
      const now = new Date();
      tasks = tasks.filter(t => new Date(t.dueDate) < now && t.status !== 'Completed');
    }

    // Sorting
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    tasks.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'dueDate') {
        const diff = new Date(a.dueDate) - new Date(b.dueDate);
        return order === 'desc' ? -diff : diff;
      } else if (sortBy === 'title') {
        const diff = a.title.localeCompare(b.title);
        return order === 'desc' ? -diff : diff;
      } else if (sortBy === 'priority') {
        const diff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        return order === 'asc' ? -diff : diff;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return tasks;
  },

  /**
   * Find a single task by ID
   */
  async findById(id) {
    if (!isValidUUID(id)) return null;

    const ready = await isTableReady();
    if (ready && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return formatTask(data);
    }

    const found = inMemoryTasks.find(t => t.id === id);
    return formatTask(found);
  },

  /**
   * Create a new task
   */
  async create(taskInput) {
    const rawDate = taskInput.dueDate || taskInput.due_date;
    const item = {
      id: randomUUID(),
      title: taskInput.title.trim(),
      description: taskInput.description ? taskInput.description.trim() : '',
      category: taskInput.category && taskInput.category.trim() !== '' ? taskInput.category.trim() : 'Personal',
      priority: taskInput.priority || 'Medium',
      status: taskInput.status || 'Pending',
      due_date: new Date(rawDate).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const ready = await isTableReady();
    if (ready && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          priority: item.priority,
          status: item.status,
          due_date: item.due_date
        }])
        .select()
        .single();

      if (error) throw error;
      return formatTask(data);
    }

    inMemoryTasks.unshift(item);
    return formatTask(item);
  },

  /**
   * Update task by ID
   */
  async findByIdAndUpdate(id, updateData) {
    if (!isValidUUID(id)) return null;

    const ready = await isTableReady();
    if (ready && supabase) {
      const updateFields = {};
      if (updateData.title !== undefined) updateFields.title = updateData.title.trim();
      if (updateData.description !== undefined) updateFields.description = updateData.description.trim();
      if (updateData.category !== undefined) updateFields.category = updateData.category.trim();
      if (updateData.priority !== undefined) updateFields.priority = updateData.priority;
      if (updateData.status !== undefined) updateFields.status = updateData.status;
      if (updateData.dueDate !== undefined || updateData.due_date !== undefined) {
        const rawDate = updateData.dueDate !== undefined ? updateData.dueDate : updateData.due_date;
        updateFields.due_date = new Date(rawDate).toISOString();
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateFields)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return formatTask(data);
    }

    const index = inMemoryTasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const current = inMemoryTasks[index];
    if (updateData.title !== undefined) current.title = updateData.title.trim();
    if (updateData.description !== undefined) current.description = updateData.description.trim();
    if (updateData.category !== undefined) current.category = updateData.category.trim();
    if (updateData.priority !== undefined) current.priority = updateData.priority;
    if (updateData.status !== undefined) current.status = updateData.status;
    if (updateData.dueDate !== undefined || updateData.due_date !== undefined) {
      const rawDate = updateData.dueDate !== undefined ? updateData.dueDate : updateData.due_date;
      current.due_date = new Date(rawDate).toISOString();
    }
    current.updated_at = new Date().toISOString();

    return formatTask(current);
  },

  /**
   * Delete task by ID
   */
  async findByIdAndDelete(id) {
    if (!isValidUUID(id)) return null;

    const ready = await isTableReady();
    if (ready && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return formatTask(data);
    }

    const index = inMemoryTasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const [deleted] = inMemoryTasks.splice(index, 1);
    return formatTask(deleted);
  },

  /**
   * Get task statistics & distinct categories
   */
  async getStats() {
    const ready = await isTableReady();

    if (ready && supabase) {
      const now = new Date().toISOString();

      const [totalRes, pendingRes, progressRes, completedRes, overdueRes, categoriesRes] = await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'In Progress'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'Completed'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).lt('due_date', now).neq('status', 'Completed'),
        supabase.from('tasks').select('category')
      ]);

      if (totalRes.error) throw totalRes.error;
      if (pendingRes.error) throw pendingRes.error;
      if (progressRes.error) throw progressRes.error;
      if (completedRes.error) throw completedRes.error;
      if (overdueRes.error) throw overdueRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const categories = [...new Set((categoriesRes.data || []).map(item => item.category).filter(Boolean))];

      return {
        stats: {
          total: totalRes.count || 0,
          pending: pendingRes.count || 0,
          inProgress: progressRes.count || 0,
          completed: completedRes.count || 0,
          overdue: overdueRes.count || 0
        },
        categories
      };
    }

    // In-memory fallback stats
    const now = new Date();
    const total = inMemoryTasks.length;
    const pending = inMemoryTasks.filter(t => t.status === 'Pending').length;
    const inProgress = inMemoryTasks.filter(t => t.status === 'In Progress').length;
    const completed = inMemoryTasks.filter(t => t.status === 'Completed').length;
    const overdue = inMemoryTasks.filter(t => new Date(t.due_date) < now && t.status !== 'Completed').length;
    const categories = [...new Set(inMemoryTasks.map(t => t.category).filter(Boolean))];

    return {
      stats: { total, pending, inProgress, completed, overdue },
      categories
    };
  }
};

module.exports = Task;
