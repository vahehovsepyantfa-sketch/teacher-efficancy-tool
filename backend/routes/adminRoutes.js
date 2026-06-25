const express = require('express');
const { listUsers, createUser, updateUser, deactivateUser, deleteUser } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect, allowRoles('admin'));

router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deactivateUser);
router.delete('/users/:id/permanent', deleteUser);

module.exports = router;
