# Wallet App API

A comprehensive wallet application API built with **Express.js**, **Node.js**, and **Prisma ORM** featuring authentication, KYC verification, wallet funding, and secure transactions with database locking.

## 🚀 Features

- ✅ **User Authentication**

  - Email/Phone registration and login
  - OTP verification for email and phone
  - JWT-based authentication
  - Password reset functionality

- ✅ **Profile Management**

  - User profile updates
  - Transaction PIN setup and management
  - Device binding (optional security feature)

- ✅ **KYC (Know Your Customer)**

  - Three-tier KYC system (TIER1, TIER2, TIER3)
  - Transaction limits based on KYC level
  - Document verification

- ✅ **Wallet Operations**

  - Automatic wallet creation on signup
  - Unique account number generation
  - Real-time balance tracking

- ✅ **Funding Methods**

  - Bank transfer funding
  - Card funding (Paystack integration ready)

- ✅ **Transactions**

  - Wallet-to-wallet transfers
  - Bank withdrawals
  - Database transactions with row-level locking
  - Transaction history and tracking
  - Email notifications

- ✅ **Security**
  - Password hashing with bcrypt
  - PIN protection for transactions
  - Rate limiting
  - Device tracking
  - Database transaction isolation

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd wallet-app-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/wallet_db"
   JWT_SECRET=your_secret_key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

4. **Setup database**

   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate
   ```

5. **Start the server**

   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Auth Endpoints

### 1. Register User

**POST** `/api/auth/register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "phone": "08012345678",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email with the OTP sent.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt-token"
  }
}
```

---

### 2. Login User

**POST** `/api/auth/login`

**Request Body:**

```json
{
  "emailOrPhone": "user@example.com",
  "password": "Password123"
}
```

---

### 3. Verify Email

**POST** `/api/auth/verify-email` 🔒

**Request Body:**

```json
{
  "otp": "123456"
}
```

---

### 4. Resend OTP

**POST** `/api/auth/resend-otp` 🔒

**Request Body:**

```json
{
  "type": "EMAIL_VERIFICATION"
}
```

---

### 5. Forgot Password

**POST** `/api/auth/forgot-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

---

### 6. Reset Password

**POST** `/api/auth/reset-password`

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123"
}
```

---

### 7. Get Current User

**GET** `/api/auth/me` 🔒

---

## 👤 Profile Endpoints

### 1. Update Profile

**PUT** `/api/profile/update` 🔒

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "08012345678"
}
```

---

### 2. Setup Transaction PIN

**POST** `/api/profile/pin/setup` 🔒

**Request Body:**

```json
{
  "pin": "1234",
  "password": "Password123"
}
```

---

### 3. Change Transaction PIN

**POST** `/api/profile/pin/change` 🔒

**Request Body:**

```json
{
  "oldPin": "1234",
  "newPin": "5678"
}
```

---

### 4. Register Device

**POST** `/api/profile/devices/register` 🔒

**Request Body:**

```json
{
  "deviceName": "iPhone 13",
  "deviceType": "mobile"
}
```

**Headers:**

```
x-device-id: unique-device-identifier
```

---

### 5. Get Devices

**GET** `/api/profile/devices` 🔒

---

### 6. Trust/Untrust Device

**PATCH** `/api/profile/devices/:deviceId/trust` 🔒

**Request Body:**

```json
{
  "isTrusted": true
}
```

---

### 7. Remove Device

**DELETE** `/api/profile/devices/:deviceId` 🔒

---

## 🎫 KYC Endpoints

### 1. Get KYC Status

**GET** `/api/kyc/status` 🔒

---

### 2. Submit Tier 1 KYC

**POST** `/api/kyc/tier1` 🔒

**Request Body:**

```json
{
  "bvn": "12345678901",
  "dateOfBirth": "1990-01-01",
  "address": "123 Main Street, Lagos"
}
```

**Tier 1 Limits:**

- Daily Limit: ₦50,000
- Transaction Limit: ₦50,000

---

### 3. Submit Tier 2 KYC

**POST** `/api/kyc/tier2` 🔒

**Request Body:**

```json
{
  "idType": "NIN",
  "idNumber": "12345678901",
  "idImageUrl": "https://example.com/id-image.jpg"
}
```

**Tier 2 Limits:**

- Daily Limit: ₦200,000
- Transaction Limit: ₦200,000

---

### 4. Submit Tier 3 KYC

**POST** `/api/kyc/tier3` 🔒

**Request Body:**

```json
{
  "utilityBillUrl": "https://example.com/utility-bill.pdf",
  "selfieUrl": "https://example.com/selfie.jpg"
}
```

**Tier 3 Limits:**

- Daily Limit: ₦1,000,000
- Transaction Limit: ₦1,000,000

---

## 💰 Wallet Endpoints

### 1. Get Wallet Details

**GET** `/api/wallet` 🔒

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "accountNumber": "2012345678",
    "balance": "5000.00",
    "currency": "NGN"
  }
}
```

---

### 2. Fund via Bank Transfer

**POST** `/api/wallet/fund/bank-transfer` 🔒

**Request Body:**

```json
{
  "amount": 5000
}
```

---

### 3. Fund via Card

**POST** `/api/wallet/fund/card` 🔒

**Request Body:**

```json
{
  "amount": 5000,
  "reference": "paystack-reference"
}
```

---

### 4. Wallet Transfer

**POST** `/api/wallet/transfer` 🔒

**Request Body:**

```json
{
  "recipientAccountNumber": "2087654321",
  "amount": 1000,
  "pin": "1234",
  "description": "Payment for services"
}
```

**Features:**

- ✅ Database transactions
- ✅ Row-level locking
- ✅ PIN verification
- ✅ KYC limit checks
- ✅ Insufficient balance checks
- ✅ Email notifications

---

### 5. Withdraw to Bank

**POST** `/api/wallet/withdraw` 🔒

**Request Body:**

```json
{
  "amount": 5000,
  "pin": "1234",
  "bankCode": "058",
  "accountNumber": "0123456789",
  "accountName": "John Doe"
}
```

---

### 6. Get Transaction History

**GET** `/api/wallet/transactions` 🔒

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): CREDIT or DEBIT
- `category` (optional): Transaction category
- `status` (optional): Transaction status

**Response:**

```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

### 7. Get Transaction by Reference

**GET** `/api/wallet/transactions/:reference` 🔒

---

## 🗄️ Database Schema

### Models

- **User**: User accounts with authentication
- **Wallet**: User wallet with balance and account number
- **Transaction**: All transaction records with locking support
- **KYC**: KYC verification data (3 tiers)
- **OTP**: One-time passwords for verification
- **Device**: Registered devices for security

### Transaction Isolation

The API uses **Serializable** isolation level for critical transactions to ensure:

- No race conditions
- Consistent balance updates
- Atomic operations
- Row-level locking

## 🔒 Security Features

1. **Password Security**

   - Bcrypt hashing
   - Minimum password requirements

2. **Transaction Security**

   - PIN verification
   - Database transactions
   - Row-level locking
   - KYC-based limits

3. **API Security**

   - JWT authentication
   - Rate limiting
   - Helmet.js security headers
   - CORS configuration

4. **Device Security**
   - Device tracking
   - Trusted device management

## 📊 Transaction Flow

### Wallet Transfer Flow:

1. Verify user authentication
2. Validate PIN
3. Check KYC limits
4. Find recipient wallet
5. Begin database transaction
6. Lock both wallets
7. Verify sender balance
8. Update sender balance (debit)
9. Update receiver balance (credit)
10. Create transaction record
11. Commit transaction
12. Send email notifications

## 🧪 Testing

```bash
# Run Prisma Studio to view database
npm run prisma:studio
```

## 📝 Environment Variables

| Variable            | Description                  | Required           |
| ------------------- | ---------------------------- | ------------------ |
| PORT                | Server port                  | No (default: 5000) |
| DATABASE_URL        | PostgreSQL connection string | Yes                |
| JWT_SECRET          | Secret for JWT signing       | Yes                |
| JWT_EXPIRE          | JWT expiration time          | No (default: 7d)   |
| EMAIL_HOST          | SMTP host                    | Yes                |
| EMAIL_PORT          | SMTP port                    | Yes                |
| EMAIL_USER          | SMTP username                | Yes                |
| EMAIL_PASSWORD      | SMTP password                | Yes                |
| OTP_EXPIRY_MINUTES  | OTP validity period          | No (default: 10)   |
| PAYSTACK_SECRET_KEY | Paystack secret key          | Optional           |

## 🚧 Development

```bash
# Watch mode with nodemon
npm run dev

# Generate Prisma client after schema changes
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

## 📦 Project Structure

```
wallet-app-api/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   └── database.js        # Prisma client setup
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── kycController.js
│   │   └── walletController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validate.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── kycRoutes.js
│   │   └── walletRoutes.js
│   ├── services/
│   │   ├── emailService.js
│   │   └── otpService.js
│   ├── utils/
│   │   └── helpers.js
│   ├── validators/
│   │   └── index.js
│   └── server.js              # Express app entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Built with ❤️ using Express.js, Prisma ORM, and PostgreSQL

## 🔗 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Note:** This is a demo/educational project. For production use, ensure proper security audits, add comprehensive testing, and implement additional security measures.
#   W a l l e t - a p i  
 