# Quick Start Guide

## 🚀 Getting Started

### 1. Database Setup

First, ensure PostgreSQL is installed and running. Then create a database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE wallet_db;

# Exit
\q
```

### 2. Environment Configuration

Update the `.env` file with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/wallet_db?schema=public"
```

### 3. Run Database Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Or use this command
npx prisma migrate dev --name init
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev
```

The server will start at `http://localhost:5000`

---

## 📝 Testing the API

### Step 1: Register a User

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "phone": "08012345678",
  "password": "Test123456",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** You'll receive a JWT token and user details.

---

### Step 2: Verify Email

Check your email for the OTP (or check the console logs if email is not configured), then:

```bash
POST http://localhost:5000/api/auth/verify-email
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "otp": "123456"
}
```

---

### Step 3: Setup Transaction PIN

```bash
POST http://localhost:5000/api/profile/pin/setup
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "pin": "1234",
  "password": "Test123456"
}
```

---

### Step 4: Fund Your Wallet

```bash
POST http://localhost:5000/api/wallet/fund/bank-transfer
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 10000
}
```

---

### Step 5: Check Wallet Balance

```bash
GET http://localhost:5000/api/wallet
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### Step 6: Transfer Money

First, register a second user and get their account number. Then:

```bash
POST http://localhost:5000/api/wallet/transfer
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "recipientAccountNumber": "2012345678",
  "amount": 1000,
  "pin": "1234",
  "description": "Test transfer"
}
```

---

## 🧪 Using Prisma Studio

View and manage your database with Prisma Studio:

```bash
npm run prisma:studio
```

This will open a browser at `http://localhost:5555`

---

## 📋 Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

---

## 🔧 Troubleshooting

### Issue: Cannot connect to database

**Solution:**

- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Verify database exists

### Issue: Prisma Client not found

**Solution:**

```bash
npm run prisma:generate
```

### Issue: Migration errors

**Solution:**

```bash
# Reset database and migrations
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name init
```

---

## 📚 API Endpoints Summary

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `GET /api/auth/me` - Get current user

### Profile

- `PUT /api/profile/update` - Update profile
- `POST /api/profile/pin/setup` - Setup transaction PIN
- `POST /api/profile/pin/change` - Change PIN
- `POST /api/profile/devices/register` - Register device
- `GET /api/profile/devices` - Get all devices
- `PATCH /api/profile/devices/:deviceId/trust` - Trust/untrust device
- `DELETE /api/profile/devices/:deviceId` - Remove device

### KYC

- `GET /api/kyc/status` - Get KYC status
- `POST /api/kyc/tier1` - Submit Tier 1 KYC
- `POST /api/kyc/tier2` - Submit Tier 2 KYC
- `POST /api/kyc/tier3` - Submit Tier 3 KYC

### Wallet & Transactions

- `GET /api/wallet` - Get wallet details
- `POST /api/wallet/fund/bank-transfer` - Fund via bank transfer
- `POST /api/wallet/fund/card` - Fund via card
- `POST /api/wallet/transfer` - Transfer to another wallet
- `POST /api/wallet/withdraw` - Withdraw to bank
- `GET /api/wallet/transactions` - Get transaction history
- `GET /api/wallet/transactions/:reference` - Get transaction by reference

---

## 🎯 Next Steps

1. **Configure Email Service**

   - Update `EMAIL_*` variables in `.env`
   - Use Gmail with App Password or any SMTP service

2. **Integrate Payment Gateway**

   - Add Paystack API keys for card funding
   - Implement webhook for payment verification

3. **Add Tests**

   - Unit tests for controllers
   - Integration tests for API endpoints

4. **Deploy to Production**

   - Setup production database
   - Configure environment variables
   - Use a process manager like PM2

5. **Additional Features**
   - Add webhooks for real-time notifications
   - Implement transaction reversal
   - Add admin dashboard
   - Implement 2FA

---

For detailed documentation, see [README.md](README.md)
