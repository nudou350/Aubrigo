# Pet SOS - Animal Adoption Platform (PWA)

A comprehensive Progressive Web App designed to connect animal NGOs with potential pet adopters in Portugal. Built with modern technologies, it delivers a native app-like experience while maintaining the accessibility and reach of a web application.

## 🌟 Features

### For Adopters:
- 🔍 Browse available pets with advanced filtering (species, size, gender, age, location)
- 📱 Mobile-first PWA - Install to home screen for app-like experience
- ❤️ Favorite pets and save them for later
- 📅 Schedule visits to meet pets
- 💰 Make donations via **MB Way QR Code**, Stripe, or Multibanco (one-time or recurring)
- 📲 **MB Way Integration**: Scan QR code to donate instantly
- 🗺️ View shelter locations and contact information

### For NGOs:
- 🐕 Manage pet listings (add, edit, delete)
- 📸 Upload multiple images per pet
- 📊 View donation history and statistics
- 📧 Receive appointment notifications
- 👤 Manage organization profile

## 🛠️ Technology Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT with bcrypt
- **API Documentation**: Swagger/OpenAPI
- **Payment**:
  - **MB Way** ✅ (with QR code generation)
  - Stripe (ready for integration)
  - Multibanco (ready for integration)
- **QR Code**: qrcode library for MB Way payments
- **File Storage**: AWS S3 (ready for integration)
- **Email**: SendGrid/NodeMailer (ready for integration)

### Frontend
- **Framework**: Angular 17+ (standalone components)
- **PWA**: Angular Service Worker
- **State Management**: Angular Signals
- **Styling**: SCSS with design system
- **HTTP Client**: Angular HttpClient with interceptors
- **Forms**: Reactive Forms

## 📁 Project Structure

```
Aubrigo/
├── backend/                  # NestJS Backend
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   ├── users/           # User management
│   │   ├── pets/            # Pet CRUD operations
│   │   ├── donations/       # Donation processing
│   │   ├── appointments/    # Visit scheduling
│   │   ├── favorites/       # Favorites/wishlist
│   │   ├── common/          # Shared utilities
│   │   ├── config/          # Configuration
│   │   └── main.ts          # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                # Angular Frontend (PWA)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Core services, guards, interceptors
│   │   │   ├── features/   # Feature modules (auth, home, pets, etc.)
│   │   │   ├── shared/     # Shared components, pipes, directives
│   │   │   ├── app.component.ts
│   │   │   └── app.routes.ts
│   │   ├── assets/         # Static assets
│   │   ├── environments/   # Environment configs
│   │   ├── styles.scss     # Global styles
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── manifest.webmanifest  # PWA manifest
│   ├── ngsw-config.json    # Service Worker config
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
├── CLAUDE.md               # Project specification
├── AGENTS.md               # Team roles & responsibilities
├── THEME-GUIDELINE.md      # Design system
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **PostgreSQL**: 15.x or higher

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Configure database:**
   - Create a PostgreSQL database
   - Update `DATABASE_URL` in `.env`

5. **Run database migrations:**
   ```bash
   npm run migration:run
   ```

6. **Start development server:**
   ```bash
   npm run start:dev
   ```

   Backend will be running at `http://localhost:3000`
   API Documentation at `http://localhost:3000/api/docs`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update environment:**
   Edit `src/environments/environment.ts` if needed

4. **Start development server:**
   ```bash
   npm start
   ```

   Frontend will be running at `http://localhost:4200`

5. **Build for production (with PWA):**
   ```bash
   npm run build:prod
   ```

## 🔐 Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:4200

DATABASE_URL=postgresql://user:pass@localhost:5432/petsos_dev

JWT_SECRET=your-secret-key-change-in-production

AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=petsos-dev
AWS_REGION=eu-west-1

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@petsos.com
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  stripePublicKey: 'pk_test_...',
};
```

## 📱 PWA Features

### Manifest Configuration
- App name, description, icons
- Theme colors matching brand (#4ca8a0)
- Display mode: standalone
- Shortcuts for quick actions

### Service Worker
- Caching strategies for API calls
- Offline support for core features
- Background sync
- Push notifications (ready for implementation)

### Installation
- Custom install prompt
- Works on iOS, Android, and Desktop
- Add to home screen functionality

## 🎨 Design System

The project follows a comprehensive design system documented in `THEME-GUIDELINE.md`:

**Colors:**
- Primary: #4ca8a0 (Teal)
- Secondary: #f4a3b8 (Pink)
- Background: #ffffff, #f5f5f5

**Typography:**
- Font Family: Inter
- Sizes: 12px - 24px
- Weights: 400, 500, 600

**Spacing:**
- Base unit: 4px
- Scale: 4px, 8px, 16px, 20px, 24px, 32px, 48px

**Components:**
- Buttons (primary, secondary, text)
- Cards
- Form elements
- Navigation

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- Interactive API documentation with try-it-out functionality

### Main Endpoints:

**Authentication:**
- `POST /api/auth/register` - Register NGO
- `POST /api/auth/login` - Login

**Pets:**
- `GET /api/pets` - List/search pets
- `GET /api/pets/:id` - Get pet details
- `POST /api/pets` - Create pet (auth required)
- `PUT /api/pets/:id` - Update pet (auth required)
- `DELETE /api/pets/:id` - Delete pet (auth required)

**Donations:** ✅
- `POST /api/donations` - Create donation (MB Way, Stripe, Multibanco)
- `GET /api/donations/:id/status` - Check payment status
- `POST /api/donations/mbway/confirm/:transactionId` - Confirm MB Way payment (webhook)
- `GET /api/donations/ong/:ongId` - Get NGO donations (auth required)

**Appointments:** (to be implemented)
- `POST /api/appointments` - Schedule visit
- `GET /api/appointments/ong` - Get NGO appointments

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test               # Unit tests
npm run test:headless  # CI tests
```

## 🚢 Deployment

### Backend (Railway/Render)
1. Connect repository
2. Set environment variables
3. Deploy automatically on push

### Frontend (Vercel/Netlify)
1. Connect repository
2. Set build command: `npm run build:prod`
3. Set output directory: `dist/pet-sos-frontend/browser`
4. Deploy automatically on push

### Database (Railway/Heroku)
- PostgreSQL managed database
- Automatic backups
- Connection pooling

## 📖 Documentation

- **CLAUDE.md** - Complete project specification
- **AGENTS.md** - Team roles and responsibilities
- **THEME-GUIDELINE.md** - Design system and UI guidelines
- **API Docs** - http://localhost:3000/api/docs

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🎯 Roadmap

### Phase 1 (MVP) ✅
- [x] Backend API (Auth, Pets)
- [x] Frontend (Auth, Home page)
- [x] PWA Setup
- [x] Design System
- [x] **MB Way Payment Integration** 🎉
- [x] Donation System with QR Code
- [ ] Database seeding
- [ ] Basic styling implementation

### Phase 2
- [ ] Complete all UI pages
- [ ] Stripe payment integration
- [ ] Multibanco integration
- [ ] Appointment booking
- [ ] Email notifications
- [ ] File upload (AWS S3)
- [ ] Advanced filtering
- [ ] Favorites system

### Phase 3
- [ ] Push notifications
- [ ] Social media sharing
- [ ] Success stories
- [ ] Admin dashboard
- [ ] Analytics
- [ ] Multi-language support

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Email: support@petsos.com

## 🙏 Acknowledgments

Built with ❤️ for animals in need.

---

**Note**: This MVP includes a fully functional **MB Way payment system with QR code generation**! Other payment methods (Stripe, Multibanco), AWS S3 file uploads, and email services are ready for integration with your API keys.
