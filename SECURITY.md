# Security Features

This document outlines the security measures implemented in the Aubrigo platform.

## Backend Security

### 1. HTTP Security Headers (Helmet.js)

The application uses [Helmet.js](https://helmetjs.github.io/) to set secure HTTP headers automatically. This protects against common web vulnerabilities.

**Implemented Headers:**
- **Content-Security-Policy**: Controls which resources can be loaded
- **Strict-Transport-Security**: Enforces HTTPS connections (max-age: 1 year)
- **X-Content-Type-Options**: Prevents MIME-type sniffing (`nosniff`)
- **X-Frame-Options**: Prevents clickjacking attacks (`SAMEORIGIN`)
- **X-XSS-Protection**: Enables browser XSS filters
- **Cross-Origin-Opener-Policy**: Isolates browsing context
- **Cross-Origin-Resource-Policy**: Controls resource sharing

**Configuration:** `backend/src/main.ts`

**Content Security Policy (CSP):**
```typescript
{
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],  // Required for Swagger UI
  scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
  imgSrc: ["'self'", "data:", "https:"],    // Allow external images
}
```

### 2. Rate Limiting

Rate limiting prevents brute-force attacks and DDoS attempts by limiting the number of requests per IP address.

**General API Rate Limit:**
- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Applies to:** All `/api/*` endpoints
- **Response:** HTTP 429 "Too many requests from this IP, please try again later."

**Authentication Rate Limit (Stricter):**
- **Window:** 15 minutes
- **Max Attempts:**
  - **Production:** 5 per IP (strict security)
  - **Development:** 50 per IP (testing-friendly)
- **Applies to:**
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/auth/forgot-password`
  - `/api/auth/reset-password`
- **Response:** HTTP 429 "Too many authentication attempts, please try again later."
- **Skip Successful Requests:** Yes (only failed attempts count)

**Rate Limit Headers:**
- `RateLimit-Limit`: Maximum number of requests
- `RateLimit-Remaining`: Remaining requests in current window
- `RateLimit-Reset`: Seconds until limit resets

**Configuration:**
You can customize rate limits via environment variables in `.env`:
```bash
# General API rate limit
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes (default)
RATE_LIMIT_MAX=100             # Max requests per window (default)

# Auth endpoints rate limit
AUTH_RATE_LIMIT_MAX=5          # Max auth attempts (default)
```

### 3. Authentication & Authorization

**JWT (JSON Web Tokens):**
- Secure token-based authentication
- Token expiration: 7 days
- Secret key stored in environment variables
- Bearer token authentication required for protected routes

**Password Security:**
- Bcrypt hashing with cost factor 10
- Minimum password requirements enforced
- Password reset via secure email tokens
- Tokens expire after use or timeout

**Role-Based Access Control (RBAC):**
- Three roles: `admin`, `ong`, `user`
- Route guards prevent unauthorized access
- `@Roles()` decorator for endpoint protection
- `JwtAuthGuard` and `RoleGuard` middleware

### 4. Input Validation & Sanitization

**Validation Pipes:**
- Global validation enabled (`ValidationPipe`)
- `whitelist: true` - Strips unknown properties
- `forbidNonWhitelisted: true` - Rejects requests with unknown properties
- `transform: true` - Auto-transforms payloads to DTO types

**SQL Injection Prevention:**
- TypeORM with parameterized queries
- No raw SQL queries without sanitization
- Entity validation with class-validator decorators

**File Upload Security:**
- Whitelist file types: JPEG, PNG, WebP
- Maximum file size: 5MB
- File type validation by MIME type and extension
- Automatic image optimization/conversion

### 5. CORS (Cross-Origin Resource Sharing)

**Development Mode:**
- All origins allowed (`origin: true`)

**Production Mode:**
- Specific origins only (configured via `FRONTEND_URL`)
- Credentials allowed for authenticated requests
- Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Headers: Content-Type, Authorization, Accept

### 6. Environment Variables

All sensitive configuration stored in environment variables:
- Database credentials
- JWT secret keys
- API keys (Stripe, AWS, email)
- Never committed to version control (`.env` in `.gitignore`)

## Testing Security

### Manual Security Tests

**Test Helmet Headers:**
```bash
curl -I http://localhost:3002/api/pets
```
Look for headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, etc.

**Test Rate Limiting (General API):**
```bash
for i in {1..101}; do
  curl -s http://localhost:3002/api/pets -w "%{http_code}\n" -o /dev/null
done
```
Request #101 should return `429`.

**Test Rate Limiting (Auth Endpoints):**
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3002/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nHTTP Status: %{http_code}\n"
done
```
Request #6 should return `429 Too many authentication attempts`.

## Security Best Practices

### Recommended for Production

1. **HTTPS Only**
   - Configure HTTPS in production environment
   - Redirect all HTTP traffic to HTTPS
   - Use valid SSL/TLS certificates

2. **Database Security**
   - Use strong database passwords
   - Enable database connection encryption
   - Regular backups
   - Limit database user permissions

3. **Monitoring & Logging**
   - Implement logging for security events
   - Monitor failed authentication attempts
   - Set up alerts for unusual activity
   - Consider using Sentry or similar error tracking

4. **Regular Updates**
   - Keep dependencies up to date
   - Run `npm audit` regularly
   - Apply security patches promptly

5. **API Versioning**
   - Consider implementing API versioning
   - Allows deprecation without breaking changes

6. **Additional Security Measures (Future)**
   - Consider adding Redis for rate limiting store (more scalable)
   - Implement IP whitelisting for admin endpoints
   - Add CAPTCHA for registration/login forms
   - Implement 2FA (Two-Factor Authentication)
   - Add webhook signature verification for payment providers

## Reporting Security Vulnerabilities

If you discover a security vulnerability in Aubrigo, please email the development team immediately. Do not create public GitHub issues for security vulnerabilities.

**Contact:** [Your security contact email]

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)
- [NestJS Security Guide](https://docs.nestjs.com/security/authentication)

---

**Last Updated:** November 8, 2025
**Version:** 1.0
