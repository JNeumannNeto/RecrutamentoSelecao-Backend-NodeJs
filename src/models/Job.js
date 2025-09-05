const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  requirements: {
    type: DataTypes.TEXT,
  },
  location: {
    type: DataTypes.STRING,
  },
  salary_min: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0,
    },
  },
  salary_max: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0,
    },
  },
  status: {
    type: DataTypes.ENUM('open', 'closed', 'draft'),
    allowNull: false,
    defaultValue: 'open',
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  company_name: {
    type: DataTypes.STRING,
  },
  employment_type: {
    type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'freelance'),
    defaultValue: 'full-time',
  },
  experience_level: {
    type: DataTypes.ENUM('entry', 'junior', 'mid', 'senior', 'lead'),
    defaultValue: 'mid',
  },
  remote_work: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  benefits: {
    type: DataTypes.TEXT,
  },
  application_deadline: {
    type: DataTypes.DATE,
  },
  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  applications_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'jobs',
  indexes: [
    {
      fields: ['status'],
    },
    {
      fields: ['created_by'],
    },
    {
      fields: ['location'],
    },
    {
      fields: ['employment_type'],
    },
    {
      fields: ['experience_level'],
    },
  ],
  validate: {
    salaryRange() {
      if (this.salary_min && this.salary_max && this.salary_min > this.salary_max) {
        throw new Error('Salary minimum cannot be greater than salary maximum');
      }
    },
  },
});

// Instance methods
Job.prototype.isOpen = function() {
  return this.status === 'open';
};

Job.prototype.isClosed = function() {
  return this.status === 'closed';
};

Job.prototype.isDraft = function() {
  return this.status === 'draft';
};

Job.prototype.getSalaryRange = function() {
  if (this.salary_min && this.salary_max) {
    return `R$ ${this.salary_min.toFixed(2)} - R$ ${this.salary_max.toFixed(2)}`;
  } else if (this.salary_min) {
    return `A partir de R$ ${this.salary_min.toFixed(2)}`;
  } else if (this.salary_max) {
    return `Até R$ ${this.salary_max.toFixed(2)}`;
  }
  return 'Salário a combinar';
};

Job.prototype.incrementViews = async function() {
  this.views_count += 1;
  return this.save();
};

Job.prototype.incrementApplications = async function() {
  this.applications_count += 1;
  return this.save();
};

// Class methods
Job.findOpenJobs = function(options = {}) {
  return this.findAll({
    where: { status: 'open' },
    ...options,
  });
};

Job.findByCreator = function(createdBy, options = {}) {
  return this.findAll({
    where: { created_by: createdBy },
    ...options,
  });
};

Job.searchJobs = function(searchTerm, options = {}) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } },
        { location: { [Op.iLike]: `%${searchTerm}%` } },
      ],
      status: 'open',
    },
    ...options,
  });
};

module.exports = Job;
