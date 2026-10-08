const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskStats,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus
} = require('../controllers/taskController');

// Route for task statistics
router.get('/stats', getTaskStats);

// Routes for /api/tasks
router.route('/')
  .get(getTasks)
  .post(createTask);

// Routes for /api/tasks/:id
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

// Route for PATCH /api/tasks/:id/status
router.patch('/:id/status', updateTaskStatus);

module.exports = router;
