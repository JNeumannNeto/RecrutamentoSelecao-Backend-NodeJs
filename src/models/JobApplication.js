const { DataTypes } = require('sequelize');
const database = require('../config/database');

const JobApplication = database.define('JobApplication', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'jobs',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'candidates',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewing', 'interview', 'rejected', 'accepted'),
    allowNull: false,
    defaultValue: 'pending'
  },
  appliedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  interviewDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  interviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'job_applications',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['jobId', 'candidateId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['appliedAt']
    }
  ]
});

JobApplication.prototype.isPending = function() {
  return this.status === 'pending';
};

JobApplication.prototype.isReviewing = function() {
  return this.status === 'reviewing';
};

JobApplication.prototype.isInterview = function() {
  return this.status === 'interview';
};

JobApplication.prototype.isRejected = function() {
  return this.status === 'rejected';
};

JobApplication.prototype.isAccepted = function() {
  return this.status === 'accepted';
};

JobApplication.prototype.canBeReviewed = function() {
  return ['pending', 'reviewing'].includes(this.status);
};

JobApplication.prototype.canScheduleInterview = function() {
  return ['reviewing'].includes(this.status);
};

JobApplication.prototype.markAsReviewed = function(reviewerId, notes = null, score = null) {
  this.status = 'reviewing';
  this.reviewedAt = new Date();
  this.reviewedBy = reviewerId;
  if (notes) this.notes = notes;
  if (score !== null) this.score = score;
};

JobApplication.prototype.scheduleInterview = function(interviewDate, notes = null) {
  this.status = 'interview';
  this.interviewDate = interviewDate;
  if (notes) this.interviewNotes = notes;
};

JobApplication.prototype.reject = function(reason = null) {
  this.status = 'rejected';
  if (reason) this.rejectionReason = reason;
};

JobApplication.prototype.accept = function() {
  this.status = 'accepted';
};

JobApplication.getStatusCounts = async function() {
  const counts = await this.findAll({
    attributes: [
      'status',
      [database.fn('COUNT', database.col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });
  
  return counts.reduce((acc, item) => {
    acc[item.status] = parseInt(item.count);
    return acc;
  }, {});
};

JobApplication.getApplicationsByDateRange = async function(startDate, endDate) {
  return await this.findAll({
    where: {
      appliedAt: {
        [database.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    order: [['appliedAt', 'DESC']]
  });
};

module.exports = JobApplication;
