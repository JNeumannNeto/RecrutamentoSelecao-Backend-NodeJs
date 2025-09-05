const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { User, Job, Candidate, JobApplication } = require('../../../models');
const logger = require('../../../utils/logger');

class CandidateController {
  async getProfile(req, res) {
    try {
      const candidate = await Candidate.findOne({
        where: { userId: req.user.userId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'address', 'dateOfBirth']
        }]
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de candidato não encontrado'
        });
      }

      res.json({
        success: true,
        data: { candidate }
      });
    } catch (error) {
      logger.error('Erro ao buscar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async createProfile(req, res) {
    try {
      const existingCandidate = await Candidate.findOne({
        where: { userId: req.user.userId }
      });

      if (existingCandidate) {
        return res.status(409).json({
          success: false,
          message: 'Perfil de candidato já existe'
        });
      }

      const {
        resume,
        skills = [],
        experience,
        education,
        portfolio,
        linkedin,
        github,
        expectedSalary,
        availability,
        workPreference
      } = req.body;

      const candidate = await Candidate.create({
        id: uuidv4(),
        userId: req.user.userId,
        resume,
        skills,
        experience,
        education,
        portfolio,
        linkedin,
        github,
        expectedSalary,
        availability,
        workPreference
      });

      const createdCandidate = await Candidate.findByPk(candidate.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'address', 'dateOfBirth']
        }]
      });

      logger.info(`Perfil de candidato criado: ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Perfil criado com sucesso',
        data: { candidate: createdCandidate }
      });
    } catch (error) {
      logger.error('Erro ao criar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const candidate = await Candidate.findOne({
        where: { userId: req.user.userId }
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de candidato não encontrado'
        });
      }

      const updateData = req.body;
      await candidate.update(updateData);

      const updatedCandidate = await Candidate.findByPk(candidate.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'address', 'dateOfBirth']
        }]
      });

      logger.info(`Perfil atualizado: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: { candidate: updatedCandidate }
      });
    } catch (error) {
      logger.error('Erro ao atualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getMyApplications(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const candidate = await Candidate.findOne({
        where: { userId: req.user.userId }
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de candidato não encontrado'
        });
      }

      const whereClause = { candidateId: candidate.id };
      if (status) {
        whereClause.status = status;
      }

      const { count, rows: applications } = await JobApplication.findAndCountAll({
        where: whereClause,
        include: [{
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'location', 'employmentType', 'status']
        }],
        order: [['appliedAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          applications,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar candidaturas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async applyToJob(req, res) {
    try {
      const { jobId, coverLetter } = req.body;

      const candidate = await Candidate.findOne({
        where: { userId: req.user.userId }
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de candidato não encontrado'
        });
      }

      const job = await Job.findByPk(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Vaga não encontrada'
        });
      }

      if (job.status !== 'published') {
        return res.status(400).json({
          success: false,
          message: 'Esta vaga não está disponível para candidaturas'
        });
      }

      const existingApplication = await JobApplication.findOne({
        where: {
          jobId,
          candidateId: candidate.id
        }
      });

      if (existingApplication) {
        return res.status(409).json({
          success: false,
          message: 'Você já se candidatou a esta vaga'
        });
      }

      const application = await JobApplication.create({
        id: uuidv4(),
        jobId,
        candidateId: candidate.id,
        coverLetter
      });

      await job.increment('applicationsCount');

      const createdApplication = await JobApplication.findByPk(application.id, {
        include: [{
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'location', 'employmentType']
        }]
      });

      logger.info(`Nova candidatura: ${req.user.email} para vaga ${job.title}`);

      res.status(201).json({
        success: true,
        message: 'Candidatura enviada com sucesso',
        data: { application: createdApplication }
      });
    } catch (error) {
      logger.error('Erro ao candidatar-se:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getApplicationById(req, res) {
    try {
      const { id } = req.params;

      const candidate = await Candidate.findOne({
        where: { userId: req.user.userId }
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de candidato não encontrado'
        });
      }

      const application = await JobApplication.findOne({
        where: {
          id,
          candidateId: candidate.id
        },
        include: [{
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'description', 'location', 'employmentType', 'experienceLevel']
        }]
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Candidatura não encontrada'
        });
      }

      res.json({
        success: true,
        data: { application }
      });
    } catch (error) {
      logger.error('Erro ao buscar candidatura:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async withdrawApplication(req, res) {
    try {
      const { id } = req.params;

      const candidate = await Candidate.findOne({
        where: { userId: req.user.userId }
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de candidato não encontrado'
        });
      }

      const application = await JobApplication.findOne({
        where: {
          id,
          candidateId: candidate.id
        }
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Candidatura não encontrada'
        });
      }

      if (!['pending', 'reviewing'].includes(application.status)) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível retirar esta candidatura'
        });
      }

      await application.destroy();

      const job = await Job.findByPk(application.jobId);
      if (job) {
        await job.decrement('applicationsCount');
      }

      logger.info(`Candidatura retirada: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Candidatura retirada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao retirar candidatura:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getRecommendedJobs(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const candidate = await Candidate.findOne({
        where: { userId: req.user.userId }
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de candidato não encontrado'
        });
      }

      let whereClause = { status: 'published' };

      if (candidate.skills && candidate.skills.length > 0) {
        whereClause.skills = {
          [Op.overlap]: candidate.skills
        };
      }

      const { count, rows: jobs } = await Job.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar vagas recomendadas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getCandidateStats(req, res) {
    try {
      const candidate = await Candidate.findOne({
        where: { userId: req.user.userId }
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de candidato não encontrado'
        });
      }

      const totalApplications = await JobApplication.count({
        where: { candidateId: candidate.id }
      });

      const applicationsByStatus = await JobApplication.findAll({
        where: { candidateId: candidate.id },
        attributes: [
          'status',
          [JobApplication.sequelize.fn('COUNT', JobApplication.sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const recentApplications = await JobApplication.findAll({
        where: { candidateId: candidate.id },
        include: [{
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'location', 'employmentType']
        }],
        order: [['appliedAt', 'DESC']],
        limit: 5
      });

      res.json({
        success: true,
        data: {
          profileCompleteness: candidate.profileCompleteness,
          totalApplications,
          applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
            acc[item.status] = parseInt(item.count);
            return acc;
          }, {}),
          recentApplications
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getAllCandidates(req, res) {
    try {
      const { page = 1, limit = 10, skills, availability, workPreference } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = { isActive: true };

      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : [skills];
        whereClause.skills = {
          [Op.overlap]: skillsArray
        };
      }

      if (availability) {
        whereClause.availability = availability;
      }

      if (workPreference) {
        whereClause.workPreference = workPreference;
      }

      const { count, rows: candidates } = await Candidate.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          candidates,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar candidatos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async searchCandidates(req, res) {
    try {
      const { q, page = 1, limit = 10, skills, availability, workPreference } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = { isActive: true };

      if (q) {
        whereClause[Op.or] = [
          { resume: { [Op.iLike]: `%${q}%` } },
          { experience: { [Op.iLike]: `%${q}%` } },
          { education: { [Op.iLike]: `%${q}%` } }
        ];
      }

      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : [skills];
        whereClause.skills = {
          [Op.overlap]: skillsArray
        };
      }

      if (availability) {
        whereClause.availability = availability;
      }

      if (workPreference) {
        whereClause.workPreference = workPreference;
      }

      const { count, rows: candidates } = await Candidate.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          candidates,
          searchQuery: q,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao pesquisar candidatos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getCandidateById(req, res) {
    try {
      const { id } = req.params;

      const candidate = await Candidate.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'address', 'dateOfBirth']
        }]
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Candidato não encontrado'
        });
      }

      res.json({
        success: true,
        data: { candidate }
      });
    } catch (error) {
      logger.error('Erro ao buscar candidato:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getCandidateApplications(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const candidate = await Candidate.findByPk(id);
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Candidato não encontrado'
        });
      }

      const whereClause = { candidateId: id };
      if (status) {
        whereClause.status = status;
      }

      const { count, rows: applications } = await JobApplication.findAndCountAll({
        where: whereClause,
        include: [{
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'location', 'employmentType']
        }],
        order: [['appliedAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          applications,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar candidaturas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, score, rejectionReason } = req.body;

      if (!['pending', 'reviewing', 'interview', 'rejected', 'accepted'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
      }

      const application = await JobApplication.findByPk(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Candidatura não encontrada'
        });
      }

      const updateData = { status };
      
      if (status === 'reviewing') {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = req.user.userId;
        if (notes) updateData.notes = notes;
        if (score !== undefined) updateData.score = score;
      }
      
      if (status === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      await application.update(updateData);

      logger.info(`Status da candidatura alterado para ${status} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Status da candidatura atualizado com sucesso',
        data: { application }
      });
    } catch (error) {
      logger.error('Erro ao atualizar status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async scheduleInterview(req, res) {
    try {
      const { id } = req.params;
      const { interviewDate, interviewNotes } = req.body;

      const application = await JobApplication.findByPk(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Candidatura não encontrada'
        });
      }

      if (!application.canScheduleInterview()) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível agendar entrevista para esta candidatura'
        });
      }

      await application.update({
        status: 'interview',
        interviewDate: new Date(interviewDate),
        interviewNotes
      });

      logger.info(`Entrevista agendada por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Entrevista agendada com sucesso',
        data: { application }
      });
    } catch (error) {
      logger.error('Erro ao agendar entrevista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getAdminStats(req, res) {
    try {
      const totalCandidates = await Candidate.count({ where: { isActive: true } });
      const totalApplications = await JobApplication.count();

      const applicationsByStatus = await JobApplication.findAll({
        attributes: [
          'status',
          [JobApplication.sequelize.fn('COUNT', JobApplication.sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const candidatesByAvailability = await Candidate.findAll({
        where: { isActive: true },
        attributes: [
          'availability',
          [Candidate.sequelize.fn('COUNT', Candidate.sequelize.col('id')), 'count']
        ],
        group: ['availability'],
        raw: true
      });

      const recentApplications = await JobApplication.findAll({
        include: [
          {
            model: Candidate,
            as: 'candidate',
            include: [{
              model: User,
              as: 'user',
              attributes: ['name', 'email']
            }]
          },
          {
            model: Job,
            as: 'job',
            attributes: ['title', 'location']
          }
        ],
        order: [['appliedAt', 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalCandidates,
            totalApplications
          },
          distribution: {
            applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
              acc[item.status] = parseInt(item.count);
              return acc;
            }, {}),
            candidatesByAvailability: candidatesByAvailability.reduce((acc, item) => {
              acc[item.availability] = parseInt(item.count);
              return acc;
            }, {})
          },
          recentApplications
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas admin:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new CandidateController();
