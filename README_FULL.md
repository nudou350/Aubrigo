# Aubrigo - Animal Adoption Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.io/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A Progressive Web App (PWA) connecting animal NGOs with potential pet adopters in Portugal. Built with Angular 17+ and NestJS.

## ✨ Features Implemented (90% Complete)

### Phase 1 ✅ Complete

- File Upload Service (local storage with validation)
- Complete Appointments API
- ONG Profile Management
- Frontend Appointment Scheduling

### Phase 2 ✅ Complete

- Favorites/Wishlist API
- Email Service (NodeMailer with templates)
- Password Reset Flow (forgot/reset)
- Users Profile Management API

## 🚀 Quick Start

\`\`\`bash

# Clone and setup

git clone https://github.com/nudou350/Aubrigo.git
cd Aubrigo

# Backend

cd backend
npm install
cp .env.example .env # Configure environment
npm run start:dev

# Frontend (new terminal)

cd frontend
npm install
npm start
\`\`\`

Visit: http://localhost:4200

## 📚 Full Documentation

See [CLAUDE.md](./CLAUDE.md) for complete specifications.
See [TODO.md](./TODO.md) for development roadmap.

## 🔑 Key Endpoints

- **Auth**: /api/auth/login, /api/auth/register, /api/auth/forgot-password
- **Pets**: /api/pets, /api/pets/:id
- **Appointments**: /api/appointments
- **Favorites**: /api/favorites
- **Profile**: /api/ongs/my-ong/profile, /api/users/profile

## 🛠 Built With

- Angular 17+ (Frontend PWA)
- NestJS (Backend API)
- PostgreSQL + TypeORM
- JWT Authentication
- NodeMailer (Emails)

## 📄 License

MIT License - Built with ❤️ to help animals find homes 🐕 🐈
