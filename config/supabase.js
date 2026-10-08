const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

let supabase = null;
let isConfigured = false;

if (
  SUPABASE_URL &&
  SUPABASE_KEY &&
  !SUPABASE_URL.includes('your-project-id') &&
  !SUPABASE_KEY.includes('your-anon-key')
) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    isConfigured = true;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
}

/**
 * Test connectivity with Supabase PostgreSQL database
 * @returns {Promise<{connected: boolean, tableReady: boolean, message?: string}>}
 */
const checkConnection = async () => {
  if (!supabase || !isConfigured) {
    return {
      connected: false,
      tableReady: false,
      message: 'Supabase credentials are not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.'
    };
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);

    if (error) {
      // PostgREST code PGRST205 or message indicates missing table
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        (error.message && error.message.includes('Could not find the table'))
      ) {
        return {
          connected: true,
          tableReady: false,
          message: 'Connected to Supabase project, but "tasks" table has not been created yet. Please execute "supabase-schema.sql" in your Supabase SQL Editor.'
        };
      }
      return {
        connected: false,
        tableReady: false,
        message: error.message || 'Error querying Supabase database'
      };
    }

    return {
      connected: true,
      tableReady: true,
      message: 'Supabase PostgreSQL connected successfully'
    };
  } catch (err) {
    return {
      connected: false,
      tableReady: false,
      message: err.message || 'Supabase connection failed'
    };
  }
};

/**
 * Format database row into standard API format matching frontend expectations
 * @param {Object} row 
 * @returns {Object}
 */
const formatTask = (row) => {
  if (!row) return null;
  const dueDate = row.due_date || row.dueDate;
  const isCompleted = row.status === 'Completed';
  const isOverdue = dueDate
    ? new Date(dueDate) < new Date() && !isCompleted
    : false;

  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'Personal',
    priority: row.priority || 'Medium',
    status: row.status || 'Pending',
    dueDate: dueDate,
    due_date: dueDate,
    createdAt: row.created_at || row.createdAt,
    created_at: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    updated_at: row.updated_at || row.updatedAt,
    isOverdue
  };
};

module.exports = {
  supabase,
  isConfigured,
  checkConnection,
  formatTask
};
