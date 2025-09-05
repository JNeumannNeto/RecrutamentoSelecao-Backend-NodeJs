# RecrutamentoSelecao-Backend-NodeJs

Sistema de Recrutamento e Seleção desenvolvido em Node.js com arquitetura de microserviços.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução](#execução)
- [API Documentation](#api-documentation)
- [Docker](#docker)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Contribuição](#contribuição)

## 🎯 Visão Geral

Este projeto implementa um sistema completo de recrutamento e seleção com as seguintes funcionalidades:

- **Autenticação e Autorização**: Sistema JWT com refresh tokens
- **Gestão de Vagas**: CRUD completo de vagas de emprego
- **Gestão de Candidatos**: Perfis de candidatos e candidaturas
- **Sistema de Aplicações**: Processo completo de candidatura a vagas
- **Dashboard Administrativo**: Estatísticas e relatórios

## 🏗️ Arquitetura

O sistema utiliza arquitetura de microserviços com os seguintes serviços:

### Auth Service (Porta 8083)
- Autenticação de usuários
- Gestão de tokens JWT
- Perfis de usuário
- Recuperação de senha

### Job Service (Porta 8084)
- CRUD de vagas
- Busca e filtros avançados
- Estatísticas de vagas
- Gestão de status

### Candidate Service (Porta 8085)
- Perfis de candidatos
- Sistema de candidaturas
- Recomendações de vagas
- Gestão de entrevistas

## 🛠️ Tecnologias

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis
- **ORM**: Sequelize
- **Autenticação**: JWT
- **Validação**: Express Validator
- **Logs**: Winston
- **Containerização**: Docker & Docker Compose
- **Proxy**: Nginx

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (opcional)

### Instalação Local

```bash
# Clone o repositório
git clone <repository-url>
cd RecrutamentoSelecao-Backend-NodeJs

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Ambiente
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recrutamento_selecao
DB_USER=postgres
DB_PASSWORD=postgres123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Serviços
AUTH_SERVICE_PORT=8083
JOB_SERVICE_PORT=8084
CANDIDATE_SERVICE_PORT=8085

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Logs
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 🚀 Execução

### Desenvolvimento Local

```bash
# Executar Auth Service
npm run dev:auth

# Executar Job Service
npm run dev:job

# Executar Candidate Service
npm run dev:candidate

# Executar todos os serviços
npm run dev:all
```

### Produção

```bash
# Executar Auth Service
npm run start:auth

# Executar Job Service
npm run start:job

# Executar Candidate Service
npm run start:candidate
```

## 📚 API Documentation

### Auth Service (http://localhost:8083)

#### Autenticação

**POST /api/auth/register**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "MinhaSenh@123",
  "role": "candidate"
}
```

**POST /api/auth/login**
```json
{
  "email": "joao@email.com",
  "password": "MinhaSenh@123"
}
```

**POST /api/auth/refresh**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**POST /api/auth/logout**
```
Headers: Authorization: Bearer <token>
```

#### Perfil

**GET /api/auth/profile**
```
Headers: Authorization: Bearer <token>
```

**PUT /api/auth/profile**
```json
{
  "name": "João Silva Santos",
  "phone": "(11) 99999-9999",
  "address": "Rua das Flores, 123",
  "dateOfBirth": "1990-01-01"
}
```

### Job Service (http://localhost:8084)

#### Vagas

**GET /api/jobs**
```
Query Params:
- page: número da página (default: 1)
- limit: itens por página (default: 10)
- status: published, draft, closed
- employmentType: full-time, part-time, contract, internship
- experienceLevel: entry, mid, senior, lead
- location: filtro por localização
- sortBy: campo para ordenação (default: createdAt)
- sortOrder: ASC ou DESC (default: DESC)
```

**GET /api/jobs/search**
```
Query Params:
- q: termo de busca
- page, limit, status, employmentType, experienceLevel, location
- salaryMin: salário mínimo
- salaryMax: salário máximo
- skills: array de habilidades
```

**GET /api/jobs/:id**

**POST /api/jobs** (Admin apenas)
```json
{
  "title": "Desenvolvedor Full Stack",
  "description": "Vaga para desenvolvedor com experiência em Node.js e React",
  "requirements": "Experiência mínima de 2 anos",
  "location": "São Paulo, SP",
  "employmentType": "full-time",
  "experienceLevel": "mid",
  "salaryMin": 5000.00,
  "salaryMax": 8000.00,
  "skills": ["javascript", "nodejs", "react"],
  "status": "published"
}
```

**PUT /api/jobs/:id** (Admin apenas)

**DELETE /api/jobs/:id** (Admin apenas)

**PATCH /api/jobs/:id/status** (Admin apenas)
```json
{
  "status": "published"
}
```

### Candidate Service (http://localhost:8085)

#### Perfil do Candidato

**GET /api/candidates/profile**
```
Headers: Authorization: Bearer <token>
```

**POST /api/candidates/profile**
```json
{
  "resume": "Desenvolvedor com 3 anos de experiência...",
  "skills": ["javascript", "nodejs", "react"],
  "experience": "Trabalhou na empresa X por 2 anos...",
  "education": "Bacharel em Ciência da Computação",
  "portfolio": "https://meuportfolio.com",
  "linkedin": "https://linkedin.com/in/joao",
  "github": "https://github.com/joao",
  "expectedSalary": 6000.00,
  "availability": "two-weeks",
  "workPreference": "hybrid"
}
```

**PUT /api/candidates/profile**

#### Candidaturas

**GET /api/candidates/applications**
```
Query Params:
- page: número da página
- limit: itens por página
- status: pending, reviewing, interview, rejected, accepted
```

**POST /api/candidates/applications**
```json
{
  "jobId": "uuid-da-vaga",
  "coverLetter": "Carta de apresentação..."
}
```

**GET /api/candidates/applications/:id**

**DELETE /api/candidates/applications/:id**

#### Vagas Recomendadas

**GET /api/candidates/jobs/recommended**
```
Query Params:
- page: número da página
- limit: itens por página
```

#### Estatísticas

**GET /api/candidates/stats**

### Endpoints Administrativos

#### Gestão de Candidatos (Admin)

**GET /api/candidates**
```
Query Params:
- page, limit
- skills: filtro por habilidades
- availability: immediate, two-weeks, one-month, negotiable
- workPreference: remote, onsite, hybrid
```

**GET /api/candidates/search**
```
Query Params:
- q: termo de busca
- page, limit, skills, availability, workPreference
```

**GET /api/candidates/:id**

**GET /api/candidates/:id/applications**

#### Gestão de Candidaturas (Admin)

**PATCH /api/candidates/applications/:id/status**
```json
{
  "status": "reviewing",
  "notes": "Candidato interessante",
  "score": 85,
  "rejectionReason": "Não atende aos requisitos"
}
```

**POST /api/candidates/applications/:id/interview**
```json
{
  "interviewDate": "2024-01-15T10:00:00Z",
  "interviewNotes": "Entrevista técnica"
}
```

## 🐳 Docker

### Execução com Docker Compose

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Rebuild e restart
docker-compose up -d --build
```

### Serviços Docker

- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Auth Service**: localhost:8083
- **Job Service**: localhost:8084
- **Candidate Service**: localhost:8085
- **Nginx**: localhost:80

## 📁 Estrutura do Projeto

```
RecrutamentoSelecao-Backend-NodeJs/
├── src/
│   ├── config/
│   │   ├── config.js
│   │   └── database.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── validationMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Job.js
│   │   ├── Candidate.js
│   │   ├── JobApplication.js
│   │   └── index.js
│   ├── services/
│   │   ├── auth-service/
│   │   │   ├── server.js
│   │   │   ├── routes/
│   │   │   └── controllers/
│   │   ├── job-service/
│   │   │   ├── server.js
│   │   │   ├── routes/
│   │   │   └── controllers/
│   │   └── candidate-service/
│   │       ├── server.js
│   │       ├── routes/
│   │       └── controllers/
│   └── utils/
│       └── logger.js
├── database/
│   └── init.sql
├── logs/
├── nginx/
├── docker-compose.yml
├── Dockerfile.auth
├── Dockerfile.job
├── Dockerfile.candidate
├── package.json
├── .env.example
└── README.md
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no repositório ou entre em contato através do email: suporte@recrutamento.com

---

Desenvolvido com ❤️ pela equipe de desenvolvimento
