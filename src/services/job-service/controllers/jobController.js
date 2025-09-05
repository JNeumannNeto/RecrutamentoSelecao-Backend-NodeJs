const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const Job = require('../../../models/Job');
const User = require('../../../models/User');
const logger = require('../../../utils/logger');

class JobController {
  async getAllJobs(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status = 'published',
        employmentType,
        experienceLevel,
        location,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const whereClause = { status };
      
      if (employmentType) {
        whereClause.employmentType = employmentType;
      }
      
      if (experienceLevel) {
        whereClause.experienceLevel = experienceLevel;
      }
      
      if (location) {
        whereClause.location = {
          [Op.iLike]: `%${location}%`
        };
      }

      const { count, rows: jobs } = await Job.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
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
      logger.error('Erro ao buscar vagas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async searchJobs(req, res) {
    try {
      const {
        q,
        page = 1,
        limit = 10,
        status = 'published',
        employmentType,
        experienceLevel,
        location,
        salaryMin,
        salaryMax,
        skills
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const whereClause = { status };
      
      if (q) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
          { requirements: { [Op.iLike]: `%${q}%` } }
        ];
      }
      
      if (employmentType) {
        whereClause.employmentType = employmentType;
      }
      
      if (experienceLevel) {
        whereClause.experienceLevel = experienceLevel;
      }
      
      if (location) {
        whereClause.location = {
          [Op.iLike]: `%${location}%`
        };
      }
      
      if (salaryMin) {
        whereClause.salaryMin = {
          [Op.gte]: parseFloat(salaryMin)
        };
      }
      
      if (salaryMax) {
        whereClause.salaryMax = {
          [Op.lte]: parseFloat(salaryMax)
        };
      }
      
      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : [skills];
        whereClause.skills = {
          [Op.overlap]: skillsArray
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
      logger.error('Erro ao pesquisar vagas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getJobById(req, res) {
    try {
      const { id } = req.params;

      const job = await Job.findByPk(id, {
        include: [{
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }]
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Vaga não encontrada'
        });
      }

      await job.increment('viewsCount');

      res.json({
        success: true,
        data: { job }
      });
    } catch (error) {
      logger.error('Erro ao buscar vaga:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async createJob(req, res) {
    try {
      const {
        title,
        description,
        requirements,
        location,
        employmentType,
        experienceLevel,
        salaryMin,
        salaryMax,
        skills = [],
        status = 'draft'
      } = req.body;

      const job = await Job.create({
        id: uuidv4(),
        title,
        description,
        requirements,
        location,
        employmentType,
        experienceLevel,
        salaryMin,
        salaryMax,
        skills,
        status,
        createdById: req.user.userId
      });

      const createdJob = await Job.findByPk(job.id, {
        include: [{
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }]
      });

      logger.info(`Nova vaga criada: ${title} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Vaga criada com sucesso',
        data: { job: createdJob }
      });
    } catch (error) {
      logger.error('Erro ao criar vaga:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const job = await Job.findByPk(id);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Vaga não encontrada'
        });
      }

      await job.update(updateData);

      const updatedJob = await Job.findByPk(id, {
        include: [{
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }]
      });

      logger.info(`Vaga atualizada: ${job.title} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Vaga atualizada com sucesso',
        data: { job: updatedJob }
      });
    } catch (error) {
      logger.error('Erro ao atualizar vaga:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async deleteJob(req, res) {
    try {
      const { id } = req.params;

      const job = await Job.findByPk(id);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Vaga não encontrada'
        });
      }

      await job.destroy();

      logger.info(`Vaga deletada: ${job.title} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Vaga deletada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao deletar vaga:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async updateJobStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['draft', 'published', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
      }

      const job = await Job.findByPk(id);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Vaga não encontrada'
        });
      }

      await job.update({ status });

      logger.info(`Status da vaga alterado: ${job.title} para ${status} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Status da vaga atualizado com sucesso',
        data: { job }
      });
    } catch (error) {
      logger.error('Erro ao atualizar status da vaga:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getJobApplications(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const job = await Job.findByPk(id);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Vaga não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Funcionalidade de candidaturas será implementada no Candidate Service',
        data: {
          jobId: id,
          jobTitle: job.title,
          applications: []
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

  async getJobStats(req, res) {
    try {
      const totalJobs = await Job.count();
      const publishedJobs = await Job.count({ where: { status: 'published' } });
      const draftJobs = await Job.count({ where: { status: 'draft' } });
      const closedJobs = await Job.count({ where: { status: 'closed' } });

      const jobsByEmploymentType = await Job.findAll({
        attributes: [
          'employmentType',
          [Job.sequelize.fn('COUNT', Job.sequelize.col('id')), 'count']
        ],
        group: ['employmentType'],
        raw: true
      });

      const jobsByExperienceLevel = await Job.findAll({
        attributes: [
          'experienceLevel',
          [Job.sequelize.fn('COUNT', Job.sequelize.col('id')), 'count']
        ],
        group: ['experienceLevel'],
        raw: true
      });

      const recentJobs = await Job.findAll({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }]
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalJobs,
            publishedJobs,
            draftJobs,
            closedJobs
          },
          distribution: {
            byEmploymentType: jobsByEmploymentType,
            byExperienceLevel: jobsByExperienceLevel
          },
          recentJobs
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
}

module.exports = new JobController();
