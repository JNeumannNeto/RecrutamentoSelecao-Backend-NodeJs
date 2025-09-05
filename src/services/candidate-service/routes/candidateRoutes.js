const express = require('express');
const candidateController = require('../controllers/candidateController');
const authMiddleware = require('../../../middleware/authMiddleware');
const validationMiddleware = require('../../../middleware/validationMiddleware');

const router = express.Router();

router.get('/profile',
  authMiddleware.authenticate,
  authMiddleware.requireCandidate,
  candidateController.getProfile
);

router.post('/profile',
  authMiddleware.authenticate,
  authMiddleware.requireCandidate,
  candidateController.createProfile
);

router.put('/profile',
  authMiddleware.authenticate,
  authMiddleware.requireCandidate,
  candidateController.updateProfile
);

router.get('/applications',
  authMiddleware.authenticate,
  authMiddleware.requireCandidate,
  candidateController.getMyApplications
);

router.post('/applications',
  authMiddleware.authenticate,
  authMiddleware.requireCandidate,
  candidateController.applyToJob
);

router.get('/applications/:id',
  authMiddleware.authenticate,
  authMiddleware.requireCandidate,
  candidateController.getApplicationById
);

router.delete('/applications/:id',
  authMiddleware.authenticate,
  authMiddleware.requireCandidate,
  candidateController.withdrawApplication
);

router.get('/jobs/recommended',
  authMiddleware.authenticate,
  authMiddleware.requireCandidate,
  candidateController.getRecommendedJobs
);

router.get('/stats',
  authMiddleware.authenticate,
  authMiddleware.requireCandidate,
  candidateController.getCandidateStats
);

router.get('/',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  candidateController.getAllCandidates
);

router.get('/search',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  candidateController.searchCandidates
);

router.get('/:id',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  candidateController.getCandidateById
);

router.get('/:id/applications',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  candidateController.getCandidateApplications
);

router.patch('/applications/:id/status',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  candidateController.updateApplicationStatus
);

router.post('/applications/:id/interview',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  candidateController.scheduleInterview
);

router.get('/admin/stats',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  candidateController.getAdminStats
);

module.exports = router;
