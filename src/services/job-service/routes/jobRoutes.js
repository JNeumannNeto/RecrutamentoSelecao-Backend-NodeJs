const express = require('express');
const jobController = require('../controllers/jobController');
const authMiddleware = require('../../../middleware/authMiddleware');
const validationMiddleware = require('../../../middleware/validationMiddleware');

const router = express.Router();

router.get('/',
  jobController.getAllJobs
);

router.get('/search',
  jobController.searchJobs
);

router.get('/:id',
  jobController.getJobById
);

router.post('/',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  validationMiddleware.validateJobCreate,
  jobController.createJob
);

router.put('/:id',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  validationMiddleware.validateJobUpdate,
  jobController.updateJob
);

router.delete('/:id',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  jobController.deleteJob
);

router.patch('/:id/status',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  jobController.updateJobStatus
);

router.get('/:id/applications',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  jobController.getJobApplications
);

router.get('/stats/overview',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  jobController.getJobStats
);

module.exports = router;
