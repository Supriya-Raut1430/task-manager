const Task = require('../models/Task');

/**
 * @desc    Get all tasks with optional search, filter, and sort
 * @route   GET /api/tasks
 */
exports.getTasks = async (req, res) => {
  try {
    const { search, status, priority, category, filter, sortBy, order } = req.query;

    const tasks = await Task.find({
      search,
      status,
      priority,
      category,
      filter,
      sortBy,
      order
    });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error.message
    });
  }
};

/**
 * @desc    Get dashboard statistics & categories
 * @route   GET /api/tasks/stats
 */
exports.getTaskStats = async (req, res) => {
  try {
    const statsData = await Task.getStats();

    res.status(200).json({
      success: true,
      stats: statsData.stats,
      categories: statsData.categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 */
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Task.isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 */
exports.createTask = async (req, res) => {
  try {
    const { title, description, category, priority, status, dueDate } = req.body;

    // Backend validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    if (title.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 2 characters long'
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required'
      });
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid due date format'
      });
    }

    const validation = Task.validateTaskData(req.body, false);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    const savedTask = await Task.create({
      title,
      description,
      category,
      priority,
      status,
      dueDate
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: savedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating task',
      error: error.message
    });
  }
};

/**
 * @desc    Update an entire task
 * @route   PUT /api/tasks/:id
 */
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, status, dueDate } = req.body;

    if (!Task.isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Task title cannot be empty'
      });
    }

    if (dueDate !== undefined) {
      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date format'
        });
      }
    }

    const validation = Task.validateTaskData(req.body, true);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(id, {
      title,
      description,
      category,
      priority,
      status,
      dueDate
    });

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating task',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Task.isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: deletedTask.id, _id: deletedTask.id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle/Update task status
 * @route   PATCH /api/tasks/:id/status
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Task.isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }

    if (!status || !Task.VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${Task.VALID_STATUSES.join(', ')}`
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(id, { status });

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Task marked as ${status}`,
      data: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating status',
      error: error.message
    });
  }
};
