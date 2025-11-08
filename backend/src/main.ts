import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { AppModule } from "./app.module";
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Check environment
  const isDevelopment = process.env.NODE_ENV === "development";
  // Security: Helmet.js for HTTP headers protection
  app.use(
    helmet({
      contentSecurityPolicy: isDevelopment
        ? {
            // More permissive CSP for development (allows Swagger UI)
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:"],
            },
          }
        : {
            // Strict CSP for production
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'"],
              scriptSrc: ["'self'"],
              imgSrc: [
                "'self'",
                "data:",
                "https:", // Allow HTTPS images (S3, Cloudinary, etc.)
              ],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          },
      crossOriginEmbedderPolicy: false, // Disable for file uploads to work properly
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      frameguard: { action: "deny" },
      xssFilter: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
    })
  );
  // Security: Rate limiting to prevent DDoS attacks
  // More permissive in development to avoid blocking during testing
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Default: 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || (isDevelopment ? 1000 : 300), // Dev: 1000, Prod: 300 requests per 15min
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  // Apply rate limiting to all API routes
  app.use("/api/", limiter);
  // Stricter rate limiting for authentication endpoints
  // In development: 50 attempts to avoid blocking during testing
  // In production: 5 attempts for security
  const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Default: 15 minutes
    max:
      parseInt(process.env.AUTH_RATE_LIMIT_MAX) || (isDevelopment ? 100 : 10),
    message: "Too many authentication attempts, please try again later.",
    skipSuccessfulRequests: true, // Don't count successful requests
  });
  // Apply stricter rate limiting to auth routes
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
  app.use("/api/auth/reset-password", authLimiter);
  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
  });
  // Enable CORS
  app.enableCors({
    origin: isDevelopment
      ? true // Allow all origins in development
      : (process.env.FRONTEND_URL || "http://localhost:4200").split(","), // Specific origins in production
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );
  // API prefix
  app.setGlobalPrefix("api");
  // Swagger documentation (only in development)
  if (isDevelopment) {
    const config = new DocumentBuilder()
      .setTitle("Aubrigo API")
      .setDescription("API for Aubrigo - Animal Adoption Platform")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }
  const port = process.env.PORT || 3002;
  await app.listen(port);
}
bootstrap();
