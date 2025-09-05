const { DataTypes } = require('sequelize');
const database = require('../config/database');

const Candidate = database.define('Candidate', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  resume: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  experience: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  education: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  portfolio: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Portfolio deve ser uma URL válida'
      }
    }
  },
  linkedin: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'LinkedIn deve ser uma URL válida'
      }
    }
  },
  github: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'GitHub deve ser uma URL válida'
      }
    }
  },
  expectedSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Salário esperado deve ser um valor positivo'
      }
    }
  },
  availability: {
    type: DataTypes.ENUM('immediate', 'two-weeks', 'one-month', 'negotiable'),
    allowNull: true,
    defaultValue: 'negotiable'
  },
  workPreference: {
    type: DataTypes.ENUM('remote', 'onsite', 'hybrid'),
    allowNull: true,
    defaultValue: 'hybrid'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  profileCompleteness: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'candidates',
  timestamps: true,
  hooks: {
    beforeSave: (candidate) => {
      candidate.calculateProfileCompleteness();
    }
  }
});

Candidate.prototype.calculateProfileCompleteness = function() {
  let completeness = 0;
  const fields = [
    'resume', 'skills', 'experience', 'education', 
    'expectedSalary', 'availability', 'workPreference'
  ];
  
  fields.forEach(field => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
      completeness += Math.floor(100 / fields.length);
    }
  });
  
  this.profileCompleteness = Math.min(completeness, 100);
};

Candidate.prototype.isProfileComplete = function() {
  return this.profileCompleteness >= 80;
};

Candidate.prototype.getSkillsCount = function() {
  return this.skills ? this.skills.length : 0;
};

Candidate.prototype.hasSkill = function(skill) {
  return this.skills && this.skills.includes(skill.toLowerCase());
};

Candidate.prototype.addSkill = function(skill) {
  if (!this.skills) {
    this.skills = [];
  }
  
  const normalizedSkill = skill.toLowerCase();
  if (!this.skills.includes(normalizedSkill)) {
    this.skills.push(normalizedSkill);
  }
};

Candidate.prototype.removeSkill = function(skill) {
  if (this.skills) {
    const normalizedSkill = skill.toLowerCase();
    this.skills = this.skills.filter(s => s !== normalizedSkill);
  }
};

module.exports = Candidate;
