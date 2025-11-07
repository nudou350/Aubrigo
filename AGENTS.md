# Aubrigo - Team Agents Specification

## Document Overview

This document defines the roles, responsibilities, workflows, and collaboration patterns for the Aubrigo development team. Each agent has specific tasks, deliverables, and interaction protocols to ensure smooth project execution.

---

## Table of Contents

1. [Agent 1: Backend Developer (NestJS Specialist)](#agent-1-backend-developer)
2. [Agent 2: Frontend Developer (Angular Specialist)](#agent-2-frontend-developer)
3. [Agent 3: UI/UX Designer](#agent-3-uiux-designer)
4. [Agent 4: DevOps Engineer](#agent-4-devops-engineer)
5. [Agent 5: QA Engineer](#agent-5-qa-engineer)
6. [Agent 6: Product Manager](#agent-6-product-manager)
7. [Communication Protocols](#communication-protocols)
8. [Workflow & Ceremonies](#workflow--ceremonies)
9. [Dependencies Map](#dependencies-map)

---

# Agent 1: Backend Developer

## Role Overview

**Primary Responsibility:** Design, develop, and maintain the NestJS backend API, database, and all server-side logic.

**Expertise Required:**

- NestJS framework (decorators, modules, services, guards)
- TypeScript (advanced types, generics)
- PostgreSQL & TypeORM
- RESTful API design
- JWT authentication
- Payment gateway integration (Stripe)
- AWS S3 or cloud storage
- Email services (SendGrid)
- Security best practices

---

## Core Responsibilities

### 1. Project Setup & Architecture

**Tasks:**

- Initialize NestJS project with proper folder structure
- Configure TypeScript with strict mode
- Set up PostgreSQL database connection
- Configure environment variables
- Implement modular architecture (Auth, Users, Pets, Donations, Appointments)
- Set up logging system (Winston or built-in Logger)
- Configure CORS and security middleware

**Deliverables:**

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   ├── pets/
│   │   ├── pets.module.ts
│   │   ├── pets.service.ts
│   │   ├── pets.controller.ts
│   │   ├── entities/
│   │   │   ├── pet.entity.ts
│   │   │   └── pet-image.entity.ts
│   │   └── dto/
│   ├── donations/
│   ├── appointments/
│   ├── favorites/
│   ├── common/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── decorators/
│   │   └── utils/
│   ├── config/
│   │   └── database.config.ts
│   └── main.ts
├── test/
├── .env.example
├── package.json
└── tsconfig.json
```

**Timeline:** Week 1 (Days 1-3)

---

### 2. Database Design & Migrations

**Tasks:**

- Create all entity classes with TypeORM decorators
- Define relationships (OneToMany, ManyToOne)
- Create database migrations
- Implement seed scripts for development data
- Add proper indexes for performance
- Set up database connection pooling

**Key Entities:**

```typescript
// user.entity.ts
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  ongName: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  instagramHandle: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, type: "decimal" })
  latitude: number;

  @Column({ nullable: true, type: "decimal" })
  longitude: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Pet, (pet) => pet.ong)
  pets: Pet[];

  @OneToMany(() => Donation, (donation) => donation.ong)
  donations: Donation[];
}

// pet.entity.ts
@Entity("pets")
export class Pet {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.pets)
  @JoinColumn({ name: "ong_id" })
  ong: User;

  @Column()
  name: string;

  @Column()
  species: string; // dog, cat, fish, hamster

  @Column({ nullable: true })
  breed: string;

  @Column({ type: "int", nullable: true })
  age: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  color: string;

  @Column({ type: "decimal", nullable: true })
  weight: number;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: "available" })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PetImage, (image) => image.pet)
  images: PetImage[];
}
```

**Deliverables:**

- Migration files in `src/migrations/`
- All entity files
- Seed script: `npm run seed`
- Database documentation

**Timeline:** Week 1 (Days 4-5)

---

### 3. Authentication System

**Tasks:**

- Implement user registration with password hashing (bcrypt)
- Create login endpoint with JWT generation
- Implement JWT strategy and guards
- Create password reset flow (token generation, email, validation)
- Add refresh token mechanism (optional but recommended)
- Implement email verification (optional)

**Key Files:**

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async register(
    registerDto: RegisterDto
  ): Promise<{ user: User; accessToken: string }> {
    const { email, password, ongName } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      passwordHash: hashedPassword,
      ongName,
    });

    const accessToken = this.generateToken(user);

    return { user, accessToken };
  }

  async login(
    loginDto: LoginDto
  ): Promise<{ user: User; accessToken: string }> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const accessToken = this.generateToken(user);

    return { user, accessToken };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
```

**API Endpoints:**

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email` (optional)

**Timeline:** Week 2 (Days 1-3)

---

### 4. Pet Management API

**Tasks:**

- Create CRUD endpoints for pets
- Implement search and filtering logic
- Add pagination support
- Implement distance calculation for location-based search
- Create image upload handling (multipart/form-data)
- Integrate with S3/Cloudinary for image storage
- Add validation (DTOs with class-validator)

**Key Endpoints:**

```typescript
// pets.controller.ts
@Controller("api/pets")
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  async findAll(@Query() query: SearchPetsDto) {
    return this.petsService.search(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.petsService.findOneWithDetails(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor("images", 5))
  async create(
    @Body() createPetDto: CreatePetDto,
    @UploadedFiles() images: Express.Multer.File[],
    @Request() req
  ) {
    return this.petsService.create(createPetDto, images, req.user.id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() updatePetDto: UpdatePetDto,
    @Request() req
  ) {
    return this.petsService.update(id, updatePetDto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(@Param("id") id: string, @Request() req) {
    return this.petsService.remove(id, req.user.id);
  }
}

// DTOs
export class SearchPetsDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(["dog", "cat", "fish", "hamster"])
  species?: string;

  @IsOptional()
  @IsEnum(["small", "medium", "large"])
  size?: string;

  @IsOptional()
  @IsEnum(["male", "female"])
  gender?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ageMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ageMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}
```

**Timeline:** Week 2 (Days 4-5) + Week 3 (Days 1-3)

---

### 5. File Upload Service

**Tasks:**

- Create upload service for S3 or Cloudinary
- Implement image validation (size, format)
- Add image optimization/compression
- Generate thumbnails
- Handle multiple file uploads
- Secure file naming (UUID-based)

**Implementation:**

```typescript
// upload.service.ts
@Injectable()
export class UploadService {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async uploadPetImage(
    file: Express.Multer.File,
    petId: string
  ): Promise<string> {
    // Validate file
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      throw new BadRequestException("Invalid file type");
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      throw new BadRequestException("File too large");
    }

    // Generate unique filename
    const ext = file.originalname.split(".").pop();
    const fileName = `pets/${petId}/${uuidv4()}.${ext}`;

    // Upload to S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    await this.s3.upload(params).promise();

    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    const key = imageUrl.split(".com/")[1];
    await this.s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
      .promise();
  }
}
```

**Timeline:** Week 3 (Days 4-5)

---

### 6. Donation & Payment Integration

**Tasks:**

- Integrate Stripe SDK
- Create payment intent endpoint
- Implement webhook handler for payment events
- Store donation records
- Handle one-time and recurring payments
- Generate receipt emails
- Add refund capability (admin)

**Implementation:**

```typescript
// donations.service.ts
@Injectable()
export class DonationsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    private emailService: EmailService
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  }

  async createPaymentIntent(
    createDonationDto: CreateDonationDto
  ): Promise<any> {
    const { amount, donationType, ongId } = createDonationDto;

    // Create payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "eur",
      metadata: {
        donationType,
        ongId,
      },
    });

    // Save pending donation
    const donation = this.donationRepository.create({
      ...createDonationDto,
      stripePaymentId: paymentIntent.id,
      paymentStatus: "pending",
    });
    await this.donationRepository.save(donation);

    return {
      clientSecret: paymentIntent.client_secret,
      donationId: donation.id,
    };
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "payment_intent.succeeded":
        await this.handlePaymentSuccess(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await this.handlePaymentFailure(event.data.object);
        break;
    }
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    const donation = await this.donationRepository.findOne({
      where: { stripePaymentId: paymentIntent.id },
      relations: ["ong"],
    });

    if (donation) {
      donation.paymentStatus = "completed";
      await this.donationRepository.save(donation);

      // Send receipt email
      await this.emailService.sendDonationReceipt(donation);
    }
  }
}
```

**API Endpoints:**

- `POST /api/donations/create-payment-intent`
- `POST /api/donations/webhook`
- `GET /api/donations/ong/:ongId`

**Timeline:** Week 4 (Days 1-4)

---

### 7. Appointments System

**Tasks:**

- Create appointment CRUD endpoints
- Implement status management (pending, confirmed, completed, cancelled)
- Send email notifications to both parties
- Add validation (date/time, pet availability)
- Implement appointment history

**Timeline:** Week 4 (Day 5) + Week 5 (Days 1-2)

---

### 8. Additional Features

**Favorites System:**

- Add/remove favorites
- List user favorites

**User Profile:**

- Get/update profile
- Upload profile image

**Email Service:**

- Welcome emails
- Password reset emails
- Appointment confirmations
- Donation receipts

**Timeline:** Week 5 (Days 3-5)

---

## Testing Requirements

### Unit Tests

- Test all service methods
- Test authentication logic
- Test validation (DTOs)
- Target: 80%+ coverage

### Integration Tests

- Test API endpoints
- Test database operations
- Test file upload
- Test payment flow (use Stripe test mode)

### Example Test:

```typescript
describe("PetsService", () => {
  let service: PetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PetsService],
    }).compile();

    service = module.get<PetsService>(PetsService);
  });

  it("should create a pet", async () => {
    const petDto = {
      name: "Test Dog",
      species: "dog",
      age: 3,
    };

    const result = await service.create(petDto, [], "user-id");
    expect(result.name).toBe("Test Dog");
  });
});
```

**Timeline:** Ongoing (Week 6-8)

---

## Documentation Deliverables

1. **API Documentation** (Swagger)
2. **Database Schema Diagram**
3. **Setup Instructions** (README.md)
4. **Environment Variables Guide**
5. **Deployment Guide**

---

## Tools & Technologies

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 15+
- **ORM:** TypeORM
- **Authentication:** Passport-JWT
- **Validation:** class-validator, class-transformer
- **Testing:** Jest
- **Documentation:** Swagger/OpenAPI
- **Payment:** Stripe SDK
- **Storage:** AWS SDK (S3)
- **Email:** SendGrid or Nodemailer

---

## Communication Requirements

**Daily:**

- Update task status in project management tool
- Report blockers immediately
- Quick sync with Frontend Developer on API contracts

**Weekly:**

- Participate in sprint planning
- Demo completed features
- Code review for team members

**Artifacts to Share:**

- API endpoint documentation (Swagger URL)
- Database schema updates
- Migration files
- Postman collection for testing

---

## Success Metrics

- All API endpoints implemented and documented
- 80%+ test coverage
- API response time < 200ms (p95)
- Zero critical security vulnerabilities
- Database properly indexed and optimized

---

# Agent 2: Frontend Developer

## Role Overview

**Primary Responsibility:** Build responsive, performant Angular application with modern best practices.

**Expertise Required:**

- Angular 17+ (standalone components, Signals)
- TypeScript
- RxJS (Observables, operators)
- Angular Material or PrimeNG
- Responsive design (mobile-first)
- State management (Signals, Services)
- HTTP client & interceptors
- Form validation
- Accessibility (A11Y)

---

## Core Responsibilities

### 1. Project Setup

**Tasks:**

- Initialize Angular project with standalone components
- Configure Angular Material or PrimeNG
- Set up routing with lazy loading
- Configure environment files
- Set up SCSS with variables
- Configure HTTP interceptors (auth, error handling)
- Set up proxy configuration for local development

**Project Structure:**

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── api.service.ts
│   │   │   └── models/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   ├── home/
│   │   │   ├── pets/
│   │   │   │   ├── pet-list/
│   │   │   │   ├── pet-detail/
│   │   │   │   └── pet-form/
│   │   │   ├── donations/
│   │   │   └── profile/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── bottom-navigation/
│   │   │   │   ├── pet-card/
│   │   │   │   ├── button/
│   │   │   │   └── form-field/
│   │   │   ├── pipes/
│   │   │   └── directives/
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── assets/
│   ├── environments/
│   └── styles/
│       ├── _variables.scss
│       ├── _mixins.scss
│       └── styles.scss
├── angular.json
├── package.json
└── tsconfig.json
```

**Timeline:** Week 1 (Days 1-2)

---

### 2. Shared Components Library

**Tasks:**

- Create reusable UI components
- Implement component variants
- Add proper inputs/outputs
- Style according to design system
- Make components accessible

**Key Components:**

```typescript
// button.component.ts
@Component({
  selector: "app-button",
  standalone: true,
  template: `
    <button
      [class]="buttonClass()"
      [disabled]="disabled()"
      [type]="type()"
      (click)="handleClick($event)"
    >
      @if (loading()) {
      <span class="spinner"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styleUrls: ["./button.component.scss"],
})
export class ButtonComponent {
  variant = input<"primary" | "secondary" | "text">("primary");
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  type = input<"button" | "submit">("button");

  clicked = output<Event>();

  buttonClass = computed(() => {
    return `btn btn-${this.variant()}`;
  });

  handleClick(event: Event) {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}

// form-field.component.ts
@Component({
  selector: "app-form-field",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-field">
      <label [for]="inputId" *ngIf="label()">{{ label() }}</label>
      <input
        [id]="inputId"
        [type]="type()"
        [placeholder]="placeholder()"
        [formControl]="control"
        [attr.aria-label]="label()"
        [attr.aria-required]="required()"
        class="form-input"
      />
      @if (control.invalid && (control.dirty || control.touched)) {
      <span class="error-message" role="alert">
        {{ getErrorMessage() }}
      </span>
      }
    </div>
  `,
  styleUrls: ["./form-field.component.scss"],
})
export class FormFieldComponent {
  label = input<string>("");
  type = input<string>("text");
  placeholder = input<string>("");
  required = input<boolean>(false);
  control = input.required<FormControl>();

  inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  getErrorMessage(): string {
    if (this.control.hasError("required")) {
      return "Este campo é obrigatório";
    }
    if (this.control.hasError("email")) {
      return "Email inválido";
    }
    if (this.control.hasError("minlength")) {
      const min = this.control.getError("minlength").requiredLength;
      return `Mínimo ${min} caracteres`;
    }
    return "Campo inválido";
  }
}

// pet-card.component.ts
@Component({
  selector: "app-pet-card",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pet-card" (click)="cardClicked.emit(pet())">
      <img [src]="pet().primaryImage" [alt]="pet().name" class="pet-image" />
      <div class="pet-info">
        <h3>{{ pet().name }}</h3>
        <div class="pet-details">
          <span class="location">
            <mat-icon>location_on</mat-icon>
            {{ pet().location }}
          </span>
          <span class="gender">
            <mat-icon>{{ genderIcon() }}</mat-icon>
            {{ pet().gender === "male" ? "Masculino" : "Feminino" }}
          </span>
          <span class="size">
            <mat-icon>pets</mat-icon>
            {{ pet().size }}
          </span>
          <span class="age">
            <mat-icon>sentiment_satisfied_alt</mat-icon>
            {{ pet().age }} anos
          </span>
        </div>
        <div class="ong-name">
          <mat-icon>home</mat-icon>
          {{ pet().ong.name }}
        </div>
        <p class="description">{{ pet().description | slice : 0 : 100 }}...</p>
        <button class="btn-learn-more">SABER MAIS</button>
      </div>
    </div>
  `,
  styleUrls: ["./pet-card.component.scss"],
})
export class PetCardComponent {
  pet = input.required<Pet>();
  cardClicked = output<Pet>();

  genderIcon = computed(() => {
    return this.pet().gender === "male" ? "male" : "female";
  });
}

// bottom-navigation.component.ts
@Component({
  selector: "app-bottom-navigation",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/home" routerLinkActive="active" class="nav-item">
        <mat-icon>home</mat-icon>
        <span>HOME</span>
      </a>
      <button
        class="nav-item center-button"
        (click)="centerButtonClicked.emit()"
      >
        <div class="paw-icon">
          <mat-icon>pets</mat-icon>
        </div>
      </button>
      <a routerLink="/doar" routerLinkActive="active" class="nav-item">
        <mat-icon>favorite</mat-icon>
        <span>DOAR</span>
      </a>
    </nav>
  `,
  styleUrls: ["./bottom-navigation.component.scss"],
})
export class BottomNavigationComponent {
  centerButtonClicked = output<void>();
}
```

**Timeline:** Week 1 (Days 3-5) + Week 2 (Days 1-2)

---

### 3. Authentication Module

**Tasks:**

- Create login page
- Create registration page
- Create forgot password page
- Implement form validation
- Create auth service
- Implement auth guard
- Add JWT token storage
- Create auth interceptor

**Implementation:**

```typescript
// auth.service.ts
@Injectable({
  providedIn: "root",
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSignal = signal<User | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  register(data: RegisterDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  logout(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    this.currentUserSignal.set(null);
    this.router.navigate(["/login"]);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("currentUser", JSON.stringify(response.user));
    this.currentUserSignal.set(response.user);
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem("currentUser");
    if (userJson) {
      this.currentUserSignal.set(JSON.parse(userJson));
    }
  }
}

// login.component.ts
@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, ButtonComponent],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = new FormGroup({
    email: new FormControl("", [Validators.required, Validators.email]),
    password: new FormControl("", [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value as LoginDto).subscribe({
      next: () => {
        this.router.navigate(["/home"]);
      },
      error: (error) => {
        this.errorMessage.set(error.error.message || "Erro ao fazer login");
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }
}

// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(["/login"], { queryParams: { returnUrl: state.url } });
  return false;
};
```

**Timeline:** Week 2 (Days 3-5)

---

### 4. Home & Pet Listing

**Tasks:**

- Create home page layout
- Implement pet list with filtering
- Add species filter tabs
- Implement location selector
- Add search functionality
- Implement infinite scroll or pagination
- Add loading states
- Add empty states

**Implementation:**

```typescript
// home.component.ts
@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, PetCardComponent, BottomNavigationComponent],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  private petsService = inject(PetsService);
  private authService = inject(AuthService);

  pets = signal<Pet[]>([]);
  loading = signal(true);
  selectedSpecies = signal<string>("dog");
  location = signal("Lisboa, Portugal");

  user = this.authService.currentUser;

  ngOnInit(): void {
    this.loadPets();
  }

  loadPets(): void {
    this.loading.set(true);

    this.petsService
      .searchPets({
        species: this.selectedSpecies(),
        location: this.location(),
      })
      .subscribe({
        next: (response) => {
          this.pets.set(response.data);
          this.loading.set(false);
        },
        error: (error) => {
          console.error("Error loading pets:", error);
          this.loading.set(false);
        },
      });
  }

  onSpeciesChange(species: string): void {
    this.selectedSpecies.set(species);
    this.loadPets();
  }

  onPetClick(pet: Pet): void {
    this.router.navigate(["/pets", pet.id]);
  }
}
```

**Timeline:** Week 3 (Days 1-4)

---

### 5. Pet Detail Page

**Tasks:**

- Create pet detail layout
- Implement image carousel
- Display pet information
- Show ONG contact details
- Add appointment booking button
- Add favorite/unfavorite functionality
- Add call/map actions

**Implementation:**

```typescript
// pet-detail.component.ts
@Component({
  selector: "app-pet-detail",
  standalone: true,
  imports: [CommonModule, CarouselModule],
  templateUrl: "./pet-detail.component.html",
  styleUrls: ["./pet-detail.component.scss"],
})
export class PetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private petsService = inject(PetsService);
  private dialog = inject(MatDialog);

  pet = signal<Pet | null>(null);
  loading = signal(true);
  isFavorite = signal(false);

  ngOnInit(): void {
    const petId = this.route.snapshot.paramMap.get("id");
    if (petId) {
      this.loadPet(petId);
    }
  }

  loadPet(id: string): void {
    this.petsService.getPetById(id).subscribe({
      next: (pet) => {
        this.pet.set(pet);
        this.loading.set(false);
      },
      error: (error) => {
        console.error("Error loading pet:", error);
        this.loading.set(false);
      },
    });
  }

  scheduleVisit(): void {
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: "400px",
      data: { pet: this.pet() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Show success message
      }
    });
  }

  callShelter(): void {
    window.location.href = `tel:${this.pet()?.ong.phone}`;
  }

  openMap(): void {
    const address = encodeURIComponent(this.pet()?.ong.location || "");
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${address}`,
      "_blank"
    );
  }

  toggleFavorite(): void {
    this.isFavorite.update((v) => !v);
    // Call API to save favorite
  }
}
```

**Timeline:** Week 3 (Day 5) + Week 4 (Days 1-2)

---

### 6. Pet Management (NGO Features)

**Tasks:**

- Create add pet form
- Create edit pet form
- Implement multi-image upload
- Add form validation
- Create pet management dashboard
- Add delete confirmation

**Implementation:**

```typescript
// pet-form.component.ts
@Component({
  selector: "app-pet-form",
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent],
  templateUrl: "./pet-form.component.html",
  styleUrls: ["./pet-form.component.scss"],
})
export class PetFormComponent implements OnInit {
  private petsService = inject(PetsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  uploadedImages = signal<File[]>([]);
  loading = signal(false);

  petForm = new FormGroup({
    name: new FormControl("", [Validators.required, Validators.minLength(2)]),
    species: new FormControl("dog", Validators.required),
    breed: new FormControl(""),
    age: new FormControl(null, [Validators.min(0), Validators.max(30)]),
    gender: new FormControl("", Validators.required),
    size: new FormControl("", Validators.required),
    color: new FormControl(""),
    weight: new FormControl(null),
    description: new FormControl("", Validators.maxLength(500)),
    location: new FormControl("", Validators.required),
  });

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files).slice(0, 5); // Max 5 images
      this.uploadedImages.set(files);
    }
  }

  onSubmit(): void {
    if (this.petForm.invalid) {
      this.petForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const formData = new FormData();
    Object.keys(this.petForm.value).forEach((key) => {
      formData.append(key, this.petForm.value[key]);
    });

    this.uploadedImages().forEach((image) => {
      formData.append("images", image);
    });

    this.petsService.createPet(formData).subscribe({
      next: (pet) => {
        this.router.navigate(["/pets", pet.id]);
      },
      error: (error) => {
        console.error("Error creating pet:", error);
        this.loading.set(false);
      },
    });
  }
}
```

**Timeline:** Week 4 (Days 3-5)

---

### 7. Donation Page

**Tasks:**

- Create donation form
- Integrate Stripe Elements
- Implement one-time/recurring toggle
- Add form validation
- Handle payment success/error
- Show confirmation screen

**Implementation:**

```typescript
// donation.component.ts
@Component({
  selector: "app-donation",
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent],
  templateUrl: "./donation.component.html",
  styleUrls: ["./donation.component.scss"],
})
export class DonationComponent implements OnInit {
  private donationsService = inject(DonationsService);

  stripe: any;
  cardElement: any;
  donationType = signal<"one_time" | "monthly">("one_time");
  loading = signal(false);

  donationForm = new FormGroup({
    amount: new FormControl(null, [Validators.required, Validators.min(5)]),
    donorName: new FormControl("", Validators.required),
    donorEmail: new FormControl("", [Validators.required, Validators.email]),
    donorCpf: new FormControl(""),
    donorBirthDate: new FormControl(""),
    donorGender: new FormControl(""),
    cardHolderName: new FormControl("", Validators.required),
  });

  async ngOnInit(): Promise<void> {
    this.stripe = await loadStripe(environment.stripePublicKey);
    const elements = this.stripe.elements();
    this.cardElement = elements.create("card");
    this.cardElement.mount("#card-element");
  }

  async onSubmit(): Promise<void> {
    if (this.donationForm.invalid) {
      this.donationForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    try {
      // Create payment intent
      const { clientSecret } = await this.donationsService
        .createPaymentIntent({
          ...this.donationForm.value,
          donationType: this.donationType(),
        })
        .toPromise();

      // Confirm payment
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.cardElement,
          billing_details: {
            name: this.donationForm.value.cardHolderName,
          },
        },
      });

      if (result.error) {
        // Show error
        console.error(result.error);
      } else {
        // Show success
        this.router.navigate(["/donation-success"]);
      }
    } catch (error) {
      console.error("Donation error:", error);
    } finally {
      this.loading.set(false);
    }
  }
}
```

**Timeline:** Week 5 (Days 1-4)

---

### 8. Additional Pages

**Tasks:**

- Profile page
- ONG information page
- Appointment scheduling modal
- Settings page
- About page

**Timeline:** Week 5 (Day 5) + Week 6 (Days 1-2)

---

## Styling & Theming

**Create SCSS variables:**

```scss
// _variables.scss
$primary-color: #5cb5b0;
$primary-light: #b8e3e1;
$secondary-color: #f5a623;
$text-dark: #2c2c2c;
$text-medium: #666666;
$background: #ffffff;
$error: #e74c3c;
$success: #27ae60;

$border-radius: 8px;
$border-radius-lg: 12px;

$spacing-xs: 8px;
$spacing-sm: 16px;
$spacing-md: 24px;
$spacing-lg: 32px;
$spacing-xl: 48px;

$breakpoint-tablet: 768px;
$breakpoint-desktop: 1024px;
```

**Timeline:** Week 6 (Days 3-5)

---

## Testing Requirements

### Unit Tests

- Test components
- Test services
- Test pipes
- Target: 70%+ coverage

### E2E Tests

- User registration flow
- Login flow
- Pet browsing
- Donation flow
- Appointment booking

**Timeline:** Week 7-8

---

## Communication Requirements

**Daily:**

- Update Frontend board
- Sync with Backend on API contracts
- Report UI/UX issues to Designer

**Weekly:**

- Demo new features
- Participate in code reviews
- Update component documentation

---

## Success Metrics

- All pages implemented and responsive
- Smooth animations and transitions
- Accessible (WCAG AA compliance)
- Fast load times (<2s on 3G)
- No console errors

---

# Agent 3: UI/UX Designer

## Role Overview

**Primary Responsibility:** Create beautiful, intuitive, and accessible user interfaces that delight users and drive adoption.

**Expertise Required:**

- UI/UX design principles
- Figma or Adobe XD
- User research methods
- Wireframing & prototyping
- Visual design
- Interaction design
- Accessibility standards (WCAG)
- Responsive design
- Design systems

---

## Core Responsibilities

### 1. Design System Creation

**Tasks:**

- Extract and document color palette from PDF
- Define typography scale
- Create spacing system
- Design component library
- Create icon set
- Define animation principles
- Document interaction patterns

**Deliverables:**

**Color Palette Documentation:**

```
Primary Colors:
- Teal: #5CB5B0 (Buttons, CTAs, Headers)
- Light Teal: #B8E3E1 (Inputs, Cards)
- White: #FFFFFF (Backgrounds)

Text Colors:
- Dark Gray: #2C2C2C (Primary text)
- Medium Gray: #666666 (Secondary text)

Accent Colors:
- Orange: #F5A623 (Stars, highlights)
- Red: #E74C3C (Errors)
- Green: #27AE60 (Success)

Usage Guidelines:
- Primary buttons: Teal background, white text
- Input fields: Light teal background, no border
- Cards: White with subtle shadow
```

**Typography Scale:**

```
Font Family: Roboto or Open Sans

Headings:
- H1: 32px / Bold / 1.2 line-height
- H2: 24px / Medium / 1.3 line-height
- H3: 20px / Medium / 1.4 line-height

Body:
- Large: 18px / Regular / 1.5 line-height
- Base: 16px / Regular / 1.5 line-height
- Small: 14px / Regular / 1.5 line-height
- Caption: 12px / Regular / 1.4 line-height
```

**Deliverable Format:** Figma design system file

**Timeline:** Week 1 (Days 1-3)

---

### 2. Wireframes & User Flows

**Tasks:**

- Create user journey maps
- Design low-fidelity wireframes
- Map user flows (registration, adoption, donation)
- Define navigation structure
- Create information architecture
- Get stakeholder approval

**Key User Flows to Design:**

1. **New NGO Onboarding:**

   - Landing → Register → Email Verification → First Pet Addition → Home

2. **Pet Adoption Journey:**

   - Home → Browse Pets → View Details → Schedule Visit → Confirmation

3. **Donation Flow:**

   - Home → Donate → Choose Amount → Enter Details → Payment → Success

4. **Pet Management:**
   - Login → Dashboard → Add Pet → Upload Images → Preview → Publish

**Deliverables:**

- User flow diagrams (Figma/Miro)
- Wireframe screens (low-fidelity)
- Navigation sitemap

**Timeline:** Week 1 (Days 4-5) + Week 2 (Days 1-2)

---

### 3. High-Fidelity Mockups

**Tasks:**

- Design all screens from PDF reference
- Add visual polish (shadows, gradients)
- Design loading states
- Design error states
- Design empty states
- Create mobile & desktop versions
- Add decorative elements (paw prints)

**Screen List (Priority Order):**

**Phase 1 - Authentication (Week 2, Days 3-5):**

1. Login screen
2. Registration screen
3. Forgot password screen
4. Email verification screen

**Phase 2 - Core Features (Week 3):** 5. Home/Feed screen 6. Pet detail screen 7. Pet listing with filters 8. Search results screen

**Phase 3 - NGO Features (Week 4, Days 1-3):** 9. Add pet form 10. Edit pet form 11. NGO profile screen 12. Pet management dashboard

**Phase 4 - Transactions (Week 4, Days 4-5):** 13. Donation form 14. Payment confirmation 15. Appointment booking modal 16. Success screens

**Phase 5 - Additional (Week 5, Days 1-2):** 17. User profile 18. ONG information page 19. Settings screen 20. About page

**Design Requirements:**

- Mobile: 375px width (iPhone SE)
- Desktop: 1440px width
- Include hover states for interactive elements
- Include focus states for accessibility
- Show validation states (error, success)

**Timeline:** Weeks 2-5 (ongoing)

---

### 4. Interactive Prototype

**Tasks:**

- Create clickable prototype in Figma
- Add micro-interactions
- Define transition animations
- Create animated loading states
- Test with stakeholders

**Prototype Flows:**

1. Complete registration → first login
2. Browse pets → view details → book visit
3. Make a donation
4. Add a new pet (NGO)

**Timeline:** Week 5 (Days 3-5)

---

### 5. Design Assets Export

**Tasks:**

- Export all assets (icons, images, illustrations)
- Create SVG icons
- Optimize images
- Create different sizes for responsive design
- Document asset naming conventions

**Asset Structure:**

```
assets/
├── icons/
│   ├── paw.svg
│   ├── home.svg
│   ├── heart.svg
│   └── ...
├── illustrations/
│   ├── empty-state-pets.svg
│   ├── success-donation.svg
│   └── ...
├── images/
│   ├── logo.png
│   ├── logo@2x.png
│   └── ...
└── decorative/
    └── paw-prints.svg
```

**Timeline:** Week 6 (Days 1-2)

---

### 6. User Testing

**Tasks:**

- Create test plan
- Recruit test participants (5-8 users)
- Conduct usability testing sessions
- Document findings
- Create improvement recommendations
- Iterate on designs based on feedback

**Testing Scenarios:**

1. "You want to adopt a dog in Lisboa. Show me how you'd find one."
2. "You've found a dog you like. Schedule a visit to meet it."
3. "Make a monthly donation of €20."
4. "You run an animal shelter. Add a new pet to the platform."

**Metrics to Track:**

- Task completion rate
- Time to complete tasks
- Error rate
- User satisfaction (1-5 scale)
- Navigation confusion points

**Timeline:** Week 6 (Days 3-5)

---

### 7. Documentation

**Tasks:**

- Create design handoff documentation
- Write component usage guidelines
- Document interaction patterns
- Create style guide
- Provide developer notes

**Documentation Sections:**

1. **Design Principles:**

   - User-first approach
   - Emotional design for pet adoption
   - Trust and transparency
   - Accessibility for all

2. **Component Library:**

   - Buttons (primary, secondary, text)
   - Form inputs (text, email, password, dropdown)
   - Cards (pet card, info card, stat card)
   - Navigation (bottom nav, top bar)
   - Modals and dialogs

3. **Spacing & Layout:**

   - Grid system (12 columns)
   - Container widths
   - Section spacing
   - Component padding

4. **Motion & Animation:**
   - Page transitions (300ms ease-out)
   - Button hover effects
   - Loading animations
   - Micro-interactions

**Timeline:** Week 7

---

## Accessibility Checklist

### Visual Accessibility

- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Color is not the only indicator
- [ ] Focus indicators are visible
- [ ] Text is resizable up to 200%
- [ ] Icons have text alternatives

### Interaction Accessibility

- [ ] All features keyboard accessible
- [ ] Logical tab order
- [ ] Skip navigation links
- [ ] Form labels properly associated
- [ ] Error messages are descriptive

### Content Accessibility

- [ ] Alt text for all images
- [ ] Meaningful link text (not "click here")
- [ ] Headings used correctly (h1, h2, h3)
- [ ] Language attribute set
- [ ] ARIA labels where needed

---

## Tools & Technologies

- **Design:** Figma (primary), Adobe XD (alternative)
- **Prototyping:** Figma, Principle
- **User Testing:** Maze, UserTesting.com
- **Collaboration:** Figma comments, Slack
- **Version Control:** Figma version history
- **Handoff:** Figma Dev Mode, Zeplin

---

## Communication Requirements

**Daily:**

- Post design updates in Slack
- Respond to developer questions
- Review implementation in browser

**Weekly:**

- Present designs in team meeting
- Participate in design review
- Update stakeholders on progress

**Artifacts to Share:**

- Figma links (view access for all)
- PDF exports of key screens
- Design system documentation
- User testing reports

---

## Success Metrics

- 100% of screens designed and approved
- 90%+ user satisfaction in testing
- WCAG AA accessibility compliance
- Design handoff completed with no blockers
- <5% design change requests post-launch

---

# Agent 4: DevOps Engineer

## Role Overview

**Primary Responsibility:** Set up infrastructure, deployment pipelines, monitoring, and ensure system reliability.

**Expertise Required:**

- Cloud platforms (AWS, DigitalOcean, Railway)
- CI/CD (GitHub Actions, GitLab CI)
- Docker & containerization
- Database administration
- SSL/TLS certificates
- CDN configuration
- Monitoring & logging
- Security best practices

---

## Core Responsibilities

### 1. Infrastructure Setup

**Tasks:**

- Choose hosting platform
- Set up PostgreSQL database
- Configure S3 bucket for file storage
- Set up CDN (CloudFront)
- Configure DNS
- Set up SSL certificates

**Recommended Stack:**

**Option A - Railway (Simplest):**

```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/api/health"
healthcheckTimeout = 10
restartPolicyType = "ON_FAILURE"

[[services]]
name = "backend"
[services.env]
NODE_ENV = "production"

[[services]]
name = "database"
template = "postgres"
```

**Option B - AWS (Scalable):**

- EC2 or ECS for backend
- RDS PostgreSQL
- S3 for storage
- CloudFront for CDN
- Route 53 for DNS
- Certificate Manager for SSL

**Timeline:** Week 1 (Days 1-3)

---

### 2. Environment Configuration

**Tasks:**

- Set up development environment
- Set up staging environment
- Set up production environment
- Configure environment variables
- Set up secrets management
- Create environment documentation

**Environment Variables Template:**

```bash
# Development
DATABASE_URL=postgresql://user:pass@localhost:5432/petsos_dev
JWT_SECRET=dev_secret_change_me
STRIPE_SECRET_KEY=sk_test_...
AWS_BUCKET_NAME=petsos-dev
FRONTEND_URL=http://localhost:4200

# Staging
DATABASE_URL=postgresql://user:pass@staging-db/petsos_staging
JWT_SECRET=<secure_random_value>
STRIPE_SECRET_KEY=sk_test_...
AWS_BUCKET_NAME=petsos-staging
FRONTEND_URL=https://staging.petsos.com

# Production
DATABASE_URL=postgresql://user:pass@prod-db/petsos_production
JWT_SECRET=<very_secure_random_value>
STRIPE_SECRET_KEY=sk_live_...
AWS_BUCKET_NAME=petsos-production
FRONTEND_URL=https://petsos.com
SENTRY_DSN=...
```

**Timeline:** Week 1 (Days 4-5)

---

### 3. CI/CD Pipeline

**Tasks:**

- Set up GitHub Actions workflows
- Create build pipeline
- Create test pipeline
- Create deployment pipeline
- Set up automatic deployments
- Configure rollback mechanism

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Build backend
        run: |
          npm ci
          npm run build

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build:prod

      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Run database migrations
        run: npm run migration:run
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Aubrigo deployed to production successfully!"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

  post-deploy:
    needs: build-and-deploy
    runs-on: ubuntu-latest

    steps:
      - name: Health check
        run: |
          curl --fail https://api.petsos.com/health || exit 1

      - name: Create Sentry release
        run: |
          curl https://sentry.io/api/0/organizations/petsos/releases/ \
            -H "Authorization: Bearer ${{ secrets.SENTRY_AUTH_TOKEN }}" \
            -d "{\"version\": \"${{ github.sha }}\"}"
```

**Timeline:** Week 2 (Days 1-3)

---

### 4. Monitoring & Logging

**Tasks:**

- Set up application monitoring (Sentry)
- Configure uptime monitoring
- Set up log aggregation
- Create alerting rules
- Set up performance monitoring
- Create dashboards

**Sentry Integration:**

```typescript
// main.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error tracking
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Monitoring Checklist:**

- [ ] Application errors tracked
- [ ] API performance monitored
- [ ] Database performance monitored
- [ ] Disk space alerts
- [ ] Memory usage alerts
- [ ] SSL certificate expiration alerts
- [ ] Uptime monitoring (99.9% target)

**Timeline:** Week 2 (Days 4-5)

---

### 5. Database Management

**Tasks:**

- Set up automated backups
- Configure backup retention (30 days)
- Test restore procedures
- Set up read replicas (if needed)
- Configure connection pooling
- Add database indexes
- Monitor query performance

**Backup Script:**

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="petsos_backup_${DATE}.sql"

pg_dump $DATABASE_URL > /backups/$BACKUP_FILE

# Upload to S3
aws s3 cp /backups/$BACKUP_FILE s3://petsos-backups/

# Keep only last 30 days
find /backups -name "petsos_backup_*.sql" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Cron Job:**

```bash
# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup-database.sh
```

**Timeline:** Week 3 (Days 1-2)

---

### 6. Security Configuration

**Tasks:**

- Configure firewall rules
- Set up SSL/TLS
- Implement rate limiting
- Configure CORS
- Set up DDoS protection
- Security headers (Helmet.js)
- Regular security audits

**Security Checklist:**

- [ ] HTTPS enforced
- [ ] Strong SSL ciphers only
- [ ] HSTS enabled
- [ ] Rate limiting configured
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secrets rotated regularly
- [ ] Access logs enabled
- [ ] Failed login attempts monitored

**Timeline:** Week 3 (Days 3-5)

---

### 7. Performance Optimization

**Tasks:**

- Configure CDN
- Set up caching (Redis)
- Enable gzip compression
- Optimize database queries
- Configure connection pooling
- Set up load balancing (if needed)

**Redis Caching:**

```typescript
// cache.service.ts
@Injectable()
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

**Timeline:** Week 4

---

### 8. Documentation

**Tasks:**

- Create deployment runbook
- Document infrastructure architecture
- Create incident response plan
- Document backup/restore procedures
- Create monitoring guide

**Deliverables:**

- `docs/infrastructure.md`
- `docs/deployment.md`
- `docs/monitoring.md`
- `docs/incident-response.md`

**Timeline:** Week 5

---

## On-Call Responsibilities

- Monitor alerts 24/7 (during production)
- Respond to incidents within 15 minutes
- Perform root cause analysis
- Implement fixes and preventive measures
- Conduct post-mortems

---

## Tools & Technologies

- **Hosting:** Railway, AWS, or DigitalOcean
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry, UptimeRobot
- **Logging:** CloudWatch, Papertrail
- **Database:** PostgreSQL (RDS or managed)
- **Cache:** Redis
- **CDN:** CloudFront, Cloudflare
- **SSL:** Let's Encrypt, AWS Certificate Manager

---

## Success Metrics

- 99.9% uptime
- <5 minute deployment time
- Zero-downtime deployments
- <1 hour incident response time
- Daily automated backups
- All security vulnerabilities patched within 48 hours

---

# Agent 5: QA Engineer

## Role Overview

**Primary Responsibility:** Ensure product quality through comprehensive testing and automation.

**Expertise Required:**

- Manual testing
- Test automation (Cypress, Playwright)
- API testing (Postman, REST Assured)
- Performance testing
- Accessibility testing
- Mobile testing
- Test planning & documentation

---

## Core Responsibilities

### 1. Test Planning

**Tasks:**

- Create comprehensive test plan
- Define test scenarios
- Create test cases
- Set up test environments
- Define acceptance criteria
- Create test data

**Test Plan Outline:**

```markdown
# Aubrigo Test Plan

## 1. Scope

- Frontend (Angular)
- Backend API (NestJS)
- Database
- Third-party integrations (Stripe, AWS S3)

## 2. Test Types

- Unit tests (developers)
- Integration tests (developers)
- E2E tests (QA)
- API tests (QA)
- Performance tests (QA)
- Accessibility tests (QA)
- Security tests (DevOps + QA)

## 3. Test Environments

- Local development
- Staging
- Production (smoke tests only)

## 4. Entry/Exit Criteria

- Entry: Feature deployed to staging
- Exit: All test cases passed, no critical bugs

## 5. Defect Management

- Critical: Fix immediately
- High: Fix within 24 hours
- Medium: Fix within sprint
- Low: Fix in future sprint
```

**Timeline:** Week 1

---

### 2. Test Case Creation

**Tasks:**

- Write detailed test cases
- Create test data sets
- Document expected results
- Organize test suite
- Review with team

**Sample Test Cases:**

**TC001: User Registration - Happy Path**

```
Title: Successful NGO Registration
Priority: High
Type: Functional

Preconditions:
- User is on registration page
- Email is not already registered

Steps:
1. Enter ONG name: "Test Animal Shelter"
2. Enter email: "test@shelter.com"
3. Enter password: "SecurePass123"
4. Enter password confirmation: "SecurePass123"
5. Click "CADASTRAR" button

Expected Results:
- User is registered successfully
- Confirmation email is sent
- User is redirected to login or home page
- Success message is displayed

Test Data:
- ongName: "Test Animal Shelter"
- email: "test@shelter.com"
- password: "SecurePass123"
```

**TC002: User Registration - Invalid Email**

```
Title: Registration with Invalid Email
Priority: Medium
Type: Negative

Steps:
1. Enter ONG name: "Test Shelter"
2. Enter email: "invalid-email"
3. Enter password: "SecurePass123"
4. Enter password confirmation: "SecurePass123"
5. Click "CADASTRAR" button

Expected Results:
- Error message displayed: "Email inválido"
- Registration form is not submitted
- User remains on registration page
```

**Total Test Cases to Create:** ~200-300

**Timeline:** Weeks 2-3

---

### 3. Manual Testing

**Tasks:**

- Execute test cases
- Perform exploratory testing
- Test on multiple devices/browsers
- Verify UI/UX matches designs
- Report bugs
- Verify bug fixes

**Testing Matrix:**

**Browsers:**

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Devices:**

- Desktop (1920x1080, 1440x900)
- Tablet (iPad, Android tablet)
- Mobile (iPhone 12, Samsung Galaxy S21)

**Test Scenarios (Priority):**

**P0 (Critical):**

1. User registration
2. User login
3. View pet listings
4. View pet details
5. Make donation
6. Schedule appointment

**P1 (High):** 7. Add new pet (NGO) 8. Edit pet (NGO) 9. Delete pet (NGO) 10. Search/filter pets 11. Forgot password 12. Update profile

**P2 (Medium):** 13. Add to favorites 14. View ONG information 15. Contact shelter 16. View donation history 17. View appointment history

**Timeline:** Weeks 4-7 (ongoing)

---

### 4. API Testing

**Tasks:**

- Test all API endpoints
- Verify request/response formats
- Test error handling
- Test authentication/authorization
- Performance testing
- Create Postman collections

**Postman Test Script Example:**

```javascript
// Test: POST /api/auth/register
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

pm.test("Response has user and token", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("user");
  pm.expect(jsonData).to.have.property("accessToken");
});

pm.test("User has correct properties", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.user).to.have.property("id");
  pm.expect(jsonData.user).to.have.property("email");
  pm.expect(jsonData.user).to.have.property("ongName");
});

// Save token for subsequent requests
if (pm.response.code === 201) {
  pm.environment.set("accessToken", pm.response.json().accessToken);
}
```

**API Test Coverage:**

- ✅ All endpoints tested
- ✅ Happy path scenarios
- ✅ Error scenarios (400, 401, 403, 404, 500)
- ✅ Data validation
- ✅ Authentication
- ✅ Rate limiting

**Timeline:** Weeks 3-4

---

### 5. Automated E2E Testing

**Tasks:**

- Set up Cypress or Playwright
- Automate critical user flows
- Create test fixtures
- Set up CI integration
- Maintain test suite

**Cypress Test Example:**

```typescript
// cypress/e2e/registration.cy.ts
describe("User Registration", () => {
  beforeEach(() => {
    cy.visit("/cadastrar");
  });

  it("should register new NGO successfully", () => {
    const timestamp = Date.now();
    const email = `test${timestamp}@shelter.com`;

    cy.get('input[name="ongName"]').type("Test Animal Shelter");
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type("SecurePass123");
    cy.get('input[name="confirmPassword"]').type("SecurePass123");

    cy.get('button[type="submit"]').click();

    cy.url().should("include", "/home");
    cy.contains("Hello").should("be.visible");
  });

  it("should show error for existing email", () => {
    cy.get('input[name="ongName"]').type("Test Shelter");
    cy.get('input[name="email"]').type("existing@shelter.com");
    cy.get('input[name="password"]').type("SecurePass123");
    cy.get('input[name="confirmPassword"]').type("SecurePass123");

    cy.get('button[type="submit"]').click();

    cy.contains("Email already registered").should("be.visible");
  });

  it("should validate password match", () => {
    cy.get('input[name="ongName"]').type("Test Shelter");
    cy.get('input[name="email"]').type("test@shelter.com");
    cy.get('input[name="password"]').type("SecurePass123");
    cy.get('input[name="confirmPassword"]').type("DifferentPass123");

    cy.get('button[type="submit"]').click();

    cy.contains("Passwords must match").should("be.visible");
  });
});

// cypress/e2e/pet-adoption.cy.ts
describe("Pet Adoption Flow", () => {
  beforeEach(() => {
    cy.login("test@shelter.com", "SecurePass123");
    cy.visit("/home");
  });

  it("should browse and view pet details", () => {
    cy.contains("Plutão").click();

    cy.url().should("include", "/pets/");
    cy.contains("Border collie").should("be.visible");
    cy.contains("3 anos").should("be.visible");
    cy.contains("6 kg").should("be.visible");
  });

  it("should schedule a visit", () => {
    cy.visit("/pets/123");

    cy.contains("AGENDAR VISITA").click();

    cy.get('input[name="visitorName"]').type("Maria Santos");
    cy.get('input[name="visitorEmail"]').type("maria@example.com");
    cy.get('input[name="visitorPhone"]').type("912345678");
    cy.get('input[name="preferredDate"]').type("2025-12-01");
    cy.get('input[name="preferredTime"]').type("14:00");

    cy.get('button[type="submit"]').click();

    cy.contains("Appointment request sent").should("be.visible");
  });
});
```

**Automated Test Coverage:**

- User registration & login
- Pet browsing & filtering
- Pet detail view
- Appointment scheduling
- Donation flow
- Pet management (NGO)

**Timeline:** Weeks 5-6

---

### 6. Accessibility Testing

**Tasks:**

- Test keyboard navigation
- Test screen reader compatibility
- Verify color contrast
- Check ARIA labels
- Test with accessibility tools

**Tools:**

- axe DevTools
- WAVE
- Lighthouse
- NVDA screen reader

**Accessibility Checklist:**

- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order
- [ ] Skip to content link
- [ ] Form labels properly associated
- [ ] Color contrast ≥ 4.5:1
- [ ] Alt text for images
- [ ] ARIA labels where needed
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Error messages announced

**Timeline:** Week 7

---

### 7. Performance Testing

**Tasks:**

- Test page load times
- Test API response times
- Stress test donation flow
- Test with slow network
- Identify bottlenecks

**Performance Targets:**

- Page load: < 2 seconds
- API response: < 200ms (p95)
- Time to Interactive: < 3 seconds
- Lighthouse score: > 90

**Tools:**

- Lighthouse
- WebPageTest
- Chrome DevTools
- Apache JMeter (load testing)

**Timeline:** Week 8

---

### 8. Bug Reporting

**Tasks:**

- Document bugs clearly
- Assign priority/severity
- Provide reproduction steps
- Attach screenshots/videos
- Track bug lifecycle

**Bug Report Template:**

```markdown
# Bug Report

**Title:** Login button not working on mobile

**Environment:**

- Device: iPhone 12
- OS: iOS 16.5
- Browser: Safari
- App Version: 1.0.0

**Priority:** High
**Severity:** Critical

**Description:**
When attempting to log in on mobile Safari, the login button does not respond to clicks.

**Steps to Reproduce:**

1. Open app on iPhone 12 Safari
2. Navigate to login page
3. Enter valid credentials
4. Tap "LOGIN" button
5. Observe: Nothing happens

**Expected Result:**
User should be logged in and redirected to home page

**Actual Result:**
Button does not respond, user remains on login page

**Screenshots:**
[Attach screenshot]

**Video:**
[Attach screen recording]

**Console Errors:**
None visible

**Additional Notes:**
Works fine on desktop Chrome and Firefox
```

**Timeline:** Ongoing

---

## Testing Deliverables

1. **Test Plan Document**
2. **Test Cases Spreadsheet** (200-300 cases)
3. **Postman Collection** (all API endpoints)
4. **Automated Test Suite** (Cypress)
5. **Bug Reports** (Jira/GitHub Issues)
6. **Test Summary Report** (weekly)
7. **Regression Test Suite**
8. **Release Testing Checklist**

---

## Communication Requirements

**Daily:**

- Update test execution status
- Report critical bugs immediately
- Update test metrics dashboard

**Weekly:**

- Present test summary report
- Demo automated tests
- Participate in bug triage

**Artifacts to Share:**

- Test execution results
- Bug reports
- Test coverage metrics
- Performance test results

---

## Success Metrics

- 95%+ test case pass rate
- All critical bugs fixed before release
- 80%+ automated test coverage
- Zero production incidents from missed bugs
- <5% regression rate

---

# Agent 6: Product Manager

## Role Overview

**Primary Responsibility:** Define product vision, prioritize features, and ensure successful delivery.

**Expertise Required:**

- Product strategy
- User research
- Roadmap planning
- Stakeholder management
- Agile methodologies
- Data analysis
- Market research

---

## Core Responsibilities

### 1. Product Vision & Strategy

**Tasks:**

- Define product vision
- Identify target users
- Create user personas
- Define success metrics
- Competitive analysis
- Create product roadmap

**Product Vision:**

```
"Aubrigo connects homeless animals with loving families by empowering
NGOs with a modern, user-friendly platform that makes adoption
transparent, accessible, and joyful."
```

**Target Users:**

**Primary Persona - Ana (Potential Adopter):**

- Age: 28-35
- Location: Lisbon
- Occupation: Marketing professional
- Goals: Adopt a dog, support animal welfare
- Pain Points: Hard to find available pets, adoption process unclear
- Tech-savvy, uses mobile apps daily

**Secondary Persona - Carlos (NGO Manager):**

- Age: 35-50
- Role: Animal shelter manager
- Goals: Find homes for animals, increase donations, raise awareness
- Pain Points: Limited resources, manual processes, low visibility
- Moderate tech skills

**Success Metrics:**

- 100+ NGOs onboarded (3 months)
- 1000+ pets listed (3 months)
- 500+ appointments booked (3 months)
- €10,000+ donations (6 months)
- 50% conversion (view → appointment)

**Timeline:** Week 1

---

### 2. Requirements Gathering

**Tasks:**

- Conduct stakeholder interviews
- Define user stories
- Create acceptance criteria
- Prioritize features (MoSCoW)
- Create PRD (Product Requirements Document)

**Feature Prioritization:**

**Must Have (MVP):**

1. User authentication (NGO accounts)
2. Pet CRUD operations
3. Pet listing with filters
4. Pet detail page
5. Donation processing
6. Appointment booking
7. Email notifications

**Should Have (Phase 2):** 8. Favorites/wishlist 9. Advanced search 10. Photo gallery (multiple images) 11. ONG profile pages 12. User reviews/ratings

**Could Have (Phase 3):** 13. Social media sharing 14. Success stories 15. Blog/content section 16. Volunteer management 17. Mobile app (native)

**Won't Have (Not in scope):**

- Live chat
- Video calls
- E-commerce (pet supplies)
- Pet medical records

**User Story Example:**

```
As an NGO manager,
I want to add a new pet with photos and details,
So that potential adopters can find and learn about the animal.

Acceptance Criteria:
- Can upload 1-5 photos
- Can enter name, age, breed, size, gender, description
- Can select location
- Form validation works correctly
- Pet appears in listings immediately after saving
- Receive confirmation notification
```

**Timeline:** Weeks 1-2

---

### 3. Roadmap Planning

**Tasks:**

- Create sprint plan
- Define release schedule
- Identify dependencies
- Set milestones
- Communicate timeline

**Release Roadmap:**

**Sprint 1-2 (Weeks 1-4): Foundation**

- Project setup
- Authentication
- Database design
- Basic UI components

**Sprint 3-4 (Weeks 5-8): Core Features**

- Pet listing
- Pet detail
- Search & filters
- Pet management

**Sprint 5-6 (Weeks 9-12): Transactions**

- Donation integration
- Appointment booking
- Email notifications
- NGO profiles

**Sprint 7-8 (Weeks 13-16): Polish & Launch**

- Bug fixes
- Performance optimization
- User testing
- Documentation
- Marketing prep

**Post-Launch (Ongoing):**

- Feature enhancements
- User feedback implementation
- Analytics review
- Growth initiatives

**Timeline:** Week 2

---

### 4. Sprint Planning & Management

**Tasks:**

- Run sprint planning meetings
- Create/refine user stories
- Conduct daily standups
- Remove blockers
- Track sprint progress
- Conduct sprint reviews
- Facilitate retrospectives

**Sprint Ceremonies:**

**Sprint Planning (Week start):**

- Duration: 2 hours
- Review backlog
- Select sprint items
- Define sprint goal
- Estimate story points

**Daily Standup (Daily):**

- Duration: 15 minutes
- What did you do yesterday?
- What will you do today?
- Any blockers?

**Sprint Review (Week end):**

- Duration: 1 hour
- Demo completed features
- Gather feedback
- Update backlog

**Retrospective (Week end):**

- Duration: 1 hour
- What went well?
- What can improve?
- Action items for next sprint

**Timeline:** Ongoing

---

### 5. Stakeholder Communication

**Tasks:**

- Weekly status updates
- Monthly executive reports
- Demo sessions
- Gather feedback
- Manage expectations
- Risk management

**Weekly Status Report Template:**

```markdown
# Aubrigo - Weekly Status Report

Week of: November 4-8, 2025

## Summary

This week we completed the authentication system and began work on
pet listing features. We're on track for MVP launch in 12 weeks.

## Completed This Week

✅ User registration and login
✅ JWT authentication system
✅ Database migrations
✅ Login/register UI designs

## In Progress

🔄 Pet listing API
🔄 Home page UI
🔄 Pet card component

## Planned for Next Week

📅 Complete pet listing
📅 Start pet detail page
📅 Design pet add/edit forms

## Blockers

⚠️ Waiting for Stripe test account approval

## Metrics

- Story points completed: 21/25 (84%)
- Bugs found: 3 (all fixed)
- Test coverage: 75%

## Risks

- Payment integration delay may push donation feature by 1 week
- Mitigation: Using Stripe test mode to proceed with development
```

**Timeline:** Ongoing (weekly)

---

### 6. User Testing & Feedback

**Tasks:**

- Organize user testing sessions
- Collect and analyze feedback
- Prioritize improvements
- Validate assumptions
- Iterate on features

**User Testing Plan:**

**Phase 1: Prototype Testing (Week 6)**

- 5 potential adopters
- 3 NGO managers
- Test key flows
- Gather usability feedback

**Phase 2: Beta Testing (Week 14)**

- 3-5 real NGOs
- 20-30 real users
- 2-week beta period
- Monitor usage metrics
- Collect bug reports

**Phase 3: Soft Launch (Week 16)**

- Launch to limited audience
- Monitor metrics closely
- Quick iterations
- Prepare for full launch

**Feedback Collection Methods:**

- In-app surveys
- User interviews
- Analytics (Mixpanel/Google Analytics)
- Support tickets
- Social media monitoring

**Timeline:** Weeks 6, 14, 16

---

### 7. Go-to-Market Strategy

**Tasks:**

- Define launch strategy
- Create marketing plan
- Prepare press materials
- Train NGO partners
- Set up support channels

**Launch Checklist:**

**Pre-Launch (Week 15):**

- [ ] All MVP features complete
- [ ] Zero critical bugs
- [ ] User documentation ready
- [ ] Marketing website live
- [ ] Social media accounts created
- [ ] Press release drafted
- [ ] 10 NGO partners confirmed
- [ ] Support email set up

**Launch Week (Week 16):**

- [ ] Deploy to production
- [ ] Send launch emails
- [ ] Post on social media
- [ ] Submit to app directories
- [ ] Monitor metrics hourly
- [ ] Quick bug fixes

**Post-Launch (Week 17+):**

- [ ] Daily metric reviews
- [ ] Weekly user interviews
- [ ] Monthly feature updates
- [ ] Quarterly strategy review

**Timeline:** Weeks 15-17

---

### 8. Analytics & Metrics

**Tasks:**

- Define KPIs
- Set up analytics tracking
- Create dashboards
- Weekly metric reviews
- Data-driven decisions

**Key Metrics:**

**Acquisition:**

- New NGOs registered
- New visitors
- Traffic sources

**Activation:**

- NGOs who add first pet
- Users who view pet details
- Users who schedule appointments

**Retention:**

- Weekly active NGOs
- Returning visitors
- Email open rates

**Revenue:**

- Total donations
- Average donation
- Monthly recurring donations

**Referral:**

- Social shares
- Referral traffic
- Word-of-mouth

**Analytics Tools:**

- Google Analytics 4
- Mixpanel (user behavior)
- Stripe Dashboard (donations)
- Custom admin dashboard

**Timeline:** Week 3 (setup), Ongoing (monitoring)

---

## Documentation Deliverables

1. **Product Vision Document**
2. **Product Requirements Document (PRD)**
3. **User Personas**
4. **Product Roadmap**
5. **Sprint Plans**
6. **Weekly Status Reports**
7. **User Testing Reports**
8. **Go-to-Market Plan**
9. **Metrics Dashboard**

---

## Communication Requirements

**Daily:**

- Run standup meetings
- Review and prioritize bugs
- Respond to team questions

**Weekly:**

- Sprint planning/review
- Status report to stakeholders
- Backlog grooming

**Monthly:**

- Executive presentation
- Roadmap updates
- Strategic planning

---

## Success Metrics

- 100% sprint goals achieved
- 90%+ stakeholder satisfaction
- On-time MVP delivery
- Product-market fit validated
- User retention > 40%

---

# Communication Protocols

## Daily Communication

### Morning Standup (9:30 AM, 15 minutes)

**Attendees:** All team members
**Format:**

- Each person: Yesterday, Today, Blockers
- PM notes blockers and follows up
- Keep it brief and focused

**Example:**

```
Backend Dev: "Yesterday I completed the pet listing API. Today I'll
start on image upload. No blockers."

Frontend Dev: "Yesterday I finished the home page UI. Today I'll
integrate with the pet API. Blocked on API documentation."

PM: "I'll make sure API docs are updated by noon."
```

### Slack Channels

**#pet-sos-general**

- Team announcements
- General questions
- Casual conversation

**#pet-sos-dev**

- Technical discussions
- Code reviews
- Deployment notifications

**#pet-sos-design**

- Design reviews
- UI/UX feedback
- Asset sharing

**#pet-sos-bugs**

- Bug reports
- Bug triage
- Bug fixes

**#pet-sos-ci-cd**

- Automated build notifications
- Deployment status
- Error alerts

---

## Weekly Communication

### Sprint Planning (Monday, 2 hours)

- Review last sprint
- Plan current sprint
- Estimate stories
- Set sprint goal

### Sprint Review (Friday, 1 hour)

- Demo completed features
- Gather feedback
- Update backlog

### Sprint Retrospective (Friday, 1 hour)

- What went well?
- What needs improvement?
- Action items

---

## Tools

**Project Management:** Jira or Linear
**Communication:** Slack
**Documentation:** Notion or Confluence
**Design:** Figma
**Code:** GitHub
**Meetings:** Google Meet or Zoom

---

# Dependencies Map

```
Product Manager
    ↓ (Requirements, Priorities)
    ├→ UI/UX Designer
    │       ↓ (Designs, Assets)
    │       ├→ Frontend Developer
    │       └→ Backend Developer (API contracts)
    │
    ├→ Backend Developer
    │       ↓ (API, Database)
    │       ├→ Frontend Developer (Integration)
    │       ├→ DevOps (Deployment)
    │       └→ QA (Testing)
    │
    ├→ Frontend Developer
    │       ↓ (Application)
    │       ├→ QA (Testing)
    │       └→ DevOps (Deployment)
    │
    ├→ DevOps Engineer
    │       ↓ (Infrastructure, CI/CD)
    │       └→ All Developers (Platform)
    │
    └→ QA Engineer
            ↓ (Test Results, Bug Reports)
            └→ All Developers (Fixes)
```

**Critical Path:**

1. Backend API → Frontend Integration
2. Design → Frontend Implementation
3. Backend → Database → DevOps
4. All → QA Testing → Production

---

## Conflict Resolution

**Technical Disagreements:**

1. Present both options
2. List pros/cons
3. Product Manager makes final call
4. Document decision

**Missed Deadlines:**

1. Identify reason
2. Reassess timeline
3. Reprioritize if needed
4. Communicate to stakeholders

**Quality Issues:**

1. QA documents issues
2. Triage by severity
3. Assign to appropriate developer
4. PM decides if blocks release

---

## Onboarding New Team Members

**Day 1:**

- Welcome meeting
- Access to all tools
- Codebase walkthrough
- Review documentation

**Week 1:**

- Pair programming sessions
- Attend all ceremonies
- Complete first small task
- Ask lots of questions

**Month 1:**

- Own a feature
- Participate in code reviews
- Contribute to documentation

---

## Knowledge Sharing

**Tech Talks (Monthly):**

- Team members present learnings
- Share best practices
- Demo cool features

**Documentation:**

- All code documented
- Architecture decisions recorded
- Onboarding guide updated

**Pairing:**

- Junior/Senior pairing
- Cross-functional pairing
- Rotate pairs weekly

---

This concludes the comprehensive agents specification document. Each agent has clear responsibilities, deliverables, timelines, and communication requirements to ensure smooth collaboration and successful project delivery.
