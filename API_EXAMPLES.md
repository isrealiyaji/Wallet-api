# API Testing Examples

## Using cURL

### 1. Health Check

```bash
curl http://localhost:5000/api/health
```

### 2. Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johndoe@example.com",
    "phone": "08012345678",
    "password": "Test123456",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "johndoe@example.com",
    "password": "Test123456"
  }'
```

### 4. Get Current User

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Verify Email

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456"
  }'
```

### 6. Setup PIN

```bash
curl -X POST http://localhost:5000/api/profile/pin/setup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pin": "1234",
    "password": "Test123456"
  }'
```

### 7. Get Wallet

```bash
curl http://localhost:5000/api/wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Fund Wallet (Bank Transfer)

```bash
curl -X POST http://localhost:5000/api/wallet/fund/bank-transfer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000
  }'
```

### 9. Submit KYC Tier 1

```bash
curl -X POST http://localhost:5000/api/kyc/tier1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bvn": "12345678901",
    "dateOfBirth": "1990-01-01",
    "address": "123 Main Street, Lagos, Nigeria"
  }'
```

### 10. Wallet Transfer

```bash
curl -X POST http://localhost:5000/api/wallet/transfer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAccountNumber": "2087654321",
    "amount": 1000,
    "pin": "1234",
    "description": "Payment for services"
  }'
```

### 11. Get Transaction History

```bash
curl "http://localhost:5000/api/wallet/transactions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 12. Withdraw to Bank

```bash
curl -X POST http://localhost:5000/api/wallet/withdraw \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "pin": "1234",
    "bankCode": "058",
    "accountNumber": "0123456789",
    "accountName": "John Doe"
  }'
```

---

## Using Postman

### Environment Variables

Create these variables in Postman:

- `base_url`: `http://localhost:5000/api`
- `token`: (will be set after login)

### Pre-request Script (for authenticated requests)

```javascript
pm.environment.set("token", pm.environment.get("token"));
```

### Test Script (after login)

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("token", response.data.token);
}
```

---

## Using VS Code REST Client

Create a file named `api.http`:

```http
### Variables
@baseUrl = http://localhost:5000/api
@token = your_jwt_token_here

### Health Check
GET {{baseUrl}}/health

### Register User
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "email": "johndoe@example.com",
  "phone": "08012345678",
  "password": "Test123456",
  "firstName": "John",
  "lastName": "Doe"
}

### Login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "emailOrPhone": "johndoe@example.com",
  "password": "Test123456"
}

### Get Current User
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}

### Verify Email
POST {{baseUrl}}/auth/verify-email
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "otp": "123456"
}

### Setup PIN
POST {{baseUrl}}/profile/pin/setup
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "pin": "1234",
  "password": "Test123456"
}

### Get Wallet
GET {{baseUrl}}/wallet
Authorization: Bearer {{token}}

### Fund Wallet
POST {{baseUrl}}/wallet/fund/bank-transfer
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "amount": 10000
}

### Wallet Transfer
POST {{baseUrl}}/wallet/transfer
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "recipientAccountNumber": "2087654321",
  "amount": 1000,
  "pin": "1234",
  "description": "Test transfer"
}

### Get Transactions
GET {{baseUrl}}/wallet/transactions?page=1&limit=10
Authorization: Bearer {{token}}
```

---

## Testing Flow

### Complete User Journey:

1. **Register** → Get token
2. **Verify Email** → Use OTP from email/console
3. **Setup PIN** → Required for transactions
4. **Submit KYC** → Increase transaction limits
5. **Fund Wallet** → Add money
6. **Transfer Money** → Send to another user
7. **Check History** → View all transactions

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., user already exists)
- `500` - Internal Server Error

---

## Tips

1. **Save the token** from login response for subsequent requests
2. **OTP codes** are logged to console if email is not configured
3. **Test with two users** to properly test wallet transfers
4. **Use Prisma Studio** to view database changes in real-time
5. **Check console logs** for detailed error messages during development
