Wallet App API

A comprehensive, production-ready digital wallet backend application built with **Node.js**, **Express**, and **PostgreSQL**. Designed with financial security, regulatory compliance, and user experience at its core.

Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [API Documentation](#api-documentation)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [KYC & Transaction Limits](#kyc--transaction-limits)
- [Contributing](#contributing)
- [License](#license)


Overview

**Wallet App API** is a secure, scalable digital wallet platform that enables users to:

- Create and verify accounts with email/phone OTP verification
- Manage their financial profiles with PINs and device binding
- Complete KYC verification with 3-tier progressive identity verification
- Fund wallets via bank transfers or card payments
- Transfer money to other wallet users securely
- Withdraw funds to their bank accounts
- Track transaction history with detailed records

The API implements **database-level transaction locking** to prevent race conditions, **role-based access control** through KYC tiers, and comprehensive **regulatory compliance** features suitable for fintech applications.

Key Features

**User Management**

- **Email & Phone Registration** - Multiple verification methods
- **OTP Verification** - Email-based OTP for account verification
- **Secure Authentication** - JWT-based token system with password hashing (bcrypt)
- **Account Status Management** - ACTIVE, SUSPENDED, INACTIVE states
- **Password Reset** - Secure password recovery via OTP

### Wallet Operations

- ✅ **Fund Wallet** - Bank transfer and card payment methods
- ✅ **Peer-to-Peer Transfers** - Send money to other wallet users
- ✅ **Bank Withdrawals** - Withdraw to registered bank accounts
- ✅ **Transaction History** - Detailed transaction logs with pagination
- ✅ **Wallet Balance Management** - Real-time balance tracking

### Security & Compliance

- ✅ **Transaction PIN** - Additional layer of security for sensitive operations
- ✅ **Device Management** - Track trusted and untrusted devices
- ✅ **Device Fingerprinting** - Device binding for enhanced security
- ✅ **Rate Limiting** - 100 requests per 15 minutes per user
- ✅ **Input Validation** - Comprehensive validation on all endpoints

### KYC (Know Your Customer)

- ✅ **3-Tier KYC System** - Progressive identity verification
  - **TIER1**: Basic verification (email/phone) - Transfers up to ₦50,000 daily
  - **TIER2**: Government ID verification - Withdrawals up to ₦300,000 daily
  - **TIER3**: Advanced verification - Full access, ₦5M daily limit
- ✅ **Document Verification** - Support for ID documents, utility bills, selfies
- ✅ **Approval Workflow** - Admin approval/rejection with feedback
- ✅ **Transaction Limits** - Tier-based daily, monthly, and per-transaction limits

### Data Integrity

- ✅ **Database Transactions** - Serializable isolation level
- ✅ **Row-Level Locking** - Prevents concurrent modification issues
- ✅ **Balance Consistency** - Atomic balance updates
- ✅ **Audit Trail** - Complete transaction history

### Notifications

- ✅ **Email Notifications** - Transaction alerts and confirmations
- ✅ **OTP Email** - Verification codes and password reset
- ✅ **Welcome Email** - New user onboarding messages
- ✅ **Transaction Email** - Transaction status updates

---

## 🛠 Tech Stack

### Backend Framework

- **Node.js** (Runtime)
- **Express.js v4.18.2** (Web framework)
- **ES6+ Modules** (Modern JavaScript)

### Database & ORM

- **PostgreSQL** (Relational database)
- **Prisma v5.7.1** (Type-safe ORM)
- **Prisma Client** (Database queries)

### Authentication & Security

- **JWT (jsonwebtoken)** - Token-based authentication
- **bcryptjs** - Password hashing and salting
- **Helmet** - Security headers
- **express-rate-limit** - Request rate limiting
- **CORS** - Cross-Origin Resource Sharing
- **Morgan** - HTTP request logging

### Validation & Input Processing

- **express-validator** - Input validation
- **body-parser** - JSON/URL-encoded body parsing

### Email Service

- **Nodemailer** - Email delivery
- **Gmail SMTP** - Email provider integration

### Development Tools

- **Nodemon** - Auto-reload on file changes
- **dotenv** - Environment variable management

---

## API Documentation

### Swagger Documentation

[Swagger API Docs](#) - _Coming soon_

### Postman Collection

Import the collection below in Postman to test all endpoints:

**[Download Postman Collection](./API_EXAMPLES.md)**

Alternatively, use the REST Client examples in `API_EXAMPLES.md` for VS Code REST Client extension.

### Quick API Reference

**Base URL:** `http://localhost:5000/api`

#### Authentication Endpoints

- `POST /auth/register` - Create new account
- `POST /auth/login` - Login with email/phone
- `POST /auth/verifyemail` - Verify email with OTP
- `POST /auth/resend-otp` - Resend OTP code
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with OTP
- `GET /auth/me` - Get current user profile

#### Wallet Endpoints

- `GET /wallet` - Get wallet details
- `POST /wallet/fund/banktransfer` - Fund via bank transfer
- `POST /wallet/fund/card` - Fund via card
- `POST /wallet/transfer` - Send money to another user
- `POST /wallet/withdraw` - Withdraw to bank account
- `GET /wallet/transactions` - Get transaction history
- `GET /wallet/transactions/:reference` - Get transaction details

#### Profile Endpoints

- `PUT /profile/update` - Update user profile
- `POST /profile/pin/setup` - Setup transaction PIN
- `POST /profile/pin/change` - Change PIN
- `POST /profile/devices/register` - Register device
- `GET /profile/devices` - List trusted devices
- `PATCH /profile/devices/:deviceId/trust` - Trust/untrust device
- `DELETE /profile/devices/:deviceId` - Remove device

#### KYC Endpoints

- `GET /kyc/status` - Get KYC status
- `POST /kyc/tier1` - Submit Tier 1 KYC
- `POST /kyc/tier2` - Submit Tier 2 KYC
- `POST /kyc/tier3` - Submit Tier 3 KYC
- `POST /kyc/approve` - Approve KYC (Admin)
- `POST /kyc/reject` - Reject KYC (Admin)

---

## Quick Start

### Prerequisites

- Node.js >= 16.x
- PostgreSQL >= 12.x
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/isrealiyaji/Wallet-api
cd Wallet-api
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

4. **Configure `.env` file**

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wallet_db"

# JWT
JWT_SECRET=your_secret_key_here_min_32_chars
JWT_EXPIRE=7d

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@walletapp.com

# OTP
OTP_EXPIRY_MINUTES=10

# Transaction Limits
TIER1_DAILY_LIMIT=50000
TIER2_DAILY_LIMIT=300000
TIER3_DAILY_LIMIT=5000000
```

5. **Setup database**

```bash
npx prisma migrate dev --name init
```

6. **Start the server**

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

---

## Project Structure

```
wallet-app-api/
├── src/
│   ├── config/
│   │   └── database.js          # Prisma database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── profileController.js # User profile management
│   │   ├── kycController.js     # KYC verification
│   │   └── walletController.js  # Wallet operations
│   ├── middleware/
│   │   ├── auth.js              # Authentication & KYC middleware
│   │   ├── validate.js          # Input validation
│   │   ├── errorHandler.js      # Error handling
│   │   └── transactionLimits.js # Transaction limit validation
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── profileRoutes.js     # Profile endpoints
│   │   ├── kycRoutes.js         # KYC endpoints
│   │   └── walletRoutes.js      # Wallet endpoints
│   ├── services/
│   │   ├── emailService.js      # Email sending
│   │   └── otpService.js        # OTP generation & verification
│   ├── validators/
│   │   └── index.js             # Input validation schemas
│   ├── utils/
│   │   └── helpers.js           # Helper functions
│   └── server.js                # Express app setup
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## Environment Variables

| Variable             | Required | Default     | Description                          |
| -------------------- | -------- | ----------- | ------------------------------------ |
| `PORT`               | No       | 5000        | Server port                          |
| `NODE_ENV`           | No       | development | Environment (development/production) |
| `DATABASE_URL`       | Yes      | -           | PostgreSQL connection string         |
| `JWT_SECRET`         | Yes      | -           | JWT signing secret (min 32 chars)    |
| `JWT_EXPIRE`         | No       | 7d          | JWT token expiration                 |
| `EMAIL_HOST`         | Yes      | -           | SMTP server host                     |
| `EMAIL_PORT`         | Yes      | -           | SMTP server port                     |
| `EMAIL_USER`         | Yes      | -           | Email account username               |
| `EMAIL_PASSWORD`     | Yes      | -           | Email account password/app password  |
| `EMAIL_FROM`         | No       | -           | Sender email address                 |
| `OTP_EXPIRY_MINUTES` | No       | 10          | OTP validity period                  |
| `TIER1_DAILY_LIMIT`  | No       | 50000       | TIER1 daily limit                    |
| `TIER2_DAILY_LIMIT`  | No       | 300000      | TIER2 daily limit                    |
| `TIER3_DAILY_LIMIT`  | No       | 5000000     | TIER3 daily limit                    |

---

## Security Features

### Authentication

- **JWT Tokens** - Stateless authentication
- **Password Hashing** - bcrypt with salt rounds
- **Email Verification** - OTP-based verification
- **Token Expiration** - 7-day default expiration

### Data Protection

- **Helmet** - Security headers (CSP, X-Frame-Options, etc.)
- **CORS** - Cross-origin request control
- **Rate Limiting** - 100 req/15min per user
- **Input Validation** - Express-validator schemas
- **Encrypted Passwords** - Never stored in plain text

### Transaction Safety

- **Database Transactions** - Serializable isolation level
- **Row-Level Locking** - Prevent race conditions
- **Atomic Operations** - All-or-nothing transactions
- **Balance Verification** - Pre-debit balance checks

### Additional Security

- **Device Fingerprinting** - Track device usage
- **PIN Protection** - Additional transaction verification
- **Attempt Tracking** - Limit failed login attempts
- **Account Suspension** - Lock suspicious accounts

---

##  KYC & Transaction Limits

### TIER1 (Basic Verification)

- **Requirements**: Email verified
- **Account Balance Limit**: ₦300,000
- **Daily Transaction Limit**: ₦50,000
- **Single Transaction Max**: ₦25,000
- **Access**: Fund wallet, Peer-to-peer transfers

### TIER2 (Government ID)

- **Requirements**: TIER1 + Government ID
- **Account Balance Limit**: ₦500,000
- **Daily Transaction Limit**: ₦300,000
- **Single Transaction Max**: ₦100,000
- **Access**: TIER1 + Bank withdrawals

### TIER3 (Advanced Verification)

- **Requirements**: TIER2 + Utility bill + Selfie
- **Account Balance Limit**: Unlimited
- **Daily Transaction Limit**: ₦5,000,000
- **Single Transaction Max**: ₦3,000,000
- **Access**: Full platform access

---

##  API Statistics

- **28+ Endpoints** - Comprehensive API coverage
- **7 Database Models** - User, Wallet, Transaction, KYC, OTP, Device, etc.
- **4 Controllers** - Auth, Profile, KYC, Wallet
- **8+ Middleware** - Auth, validation, error handling, rate limiting
- **3+ Services** - Email, OTP, utilities
- **12+ Validation Schemas** - Input validation for all endpoints

---

##  Testing

### Using REST Client (VS Code)

Install "REST Client" extension and use examples in `API_EXAMPLES.md`

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "+2348012345678",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Using Postman

1. Import the Postman collection
2. Configure environment variables (email, password, token)
3. Run requests in sequence
4. Use pre-request scripts for dynamic token management

---

##  Deployment

### Prerequisites

- Heroku CLI or Render account
- PostgreSQL hosted database
- Gmail app password for email service

### Deploy to Render

```bash
# Connect your GitHub repository
# Create new Web Service on Render
# Add environment variables in Render dashboard
# Deploy!
```

### Deploy to Heroku

```bash
heroku create wallet-app-api
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET=your_secret_here
git push heroku main
```

---

##  API Examples

See [API_EXAMPLES.md](./API_EXAMPLES.md) for detailed examples using:

- **cURL** - Command-line HTTP client
- **Postman** - REST API client
- **REST Client** - VS Code extension

---

##  Troubleshooting

### Common Issues

**Database Connection Error**

- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify credentials

**Email not sending**

- Enable "Less secure apps" or use App Password for Gmail
- Check EMAIL_USER and EMAIL_PASSWORD
- Verify SMTP settings

**Token expiration**

- Re-login to get new token
- Check JWT_EXPIRE setting
- Tokens valid for 7 days by default

**Rate limit exceeded**

- Wait 15 minutes or change IP
- Default: 100 requests per 15 minutes

---

## Email Configuration (Gmail)

1. Enable 2-Factor Authentication on Google Account
2. Create App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use generated password in `.env`:
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=generated_app_password
   ```

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

##  Author

**Isreal Iyaji**

- GitHub: [@isrealiyaji](https://github.com/isrealiyaji)
- Email: isrealiyaji1@gmail.com

---

## Acknowledgments

- Express.js community
- Prisma team for amazing ORM
- PostgreSQL for reliable database
- Nodemailer for email service
- The open-source community

---
