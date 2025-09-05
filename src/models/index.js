const User = require('./User');
const Job = require('./Job');
const Candidate = require('./Candidate');
const JobApplication = require('./JobApplication');

User.hasMany(Job, {
  foreignKey: 'createdById',
  as: 'createdJobs'
});

Job.belongsTo(User, {
  foreignKey: 'createdById',
  as: 'createdBy'
});

User.hasOne(Candidate, {
  foreignKey: 'userId',
  as: 'candidateProfile'
});

Candidate.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Candidate.hasMany(JobApplication, {
  foreignKey: 'candidateId',
  as: 'applications'
});

JobApplication.belongsTo(Candidate, {
  foreignKey: 'candidateId',
  as: 'candidate'
});

Job.hasMany(JobApplication, {
  foreignKey: 'jobId',
  as: 'applications'
});

JobApplication.belongsTo(Job, {
  foreignKey: 'jobId',
  as: 'job'
});

User.hasMany(JobApplication, {
  foreignKey: 'reviewedBy',
  as: 'reviewedApplications'
});

JobApplication.belongsTo(User, {
  foreignKey: 'reviewedBy',
  as: 'reviewer'
});

module.exports = {
  User,
  Job,
  Candidate,
  JobApplication
};
