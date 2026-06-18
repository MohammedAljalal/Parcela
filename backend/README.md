# Parcela Backend

E-commerce and delivery backend API for the Parcela app (Cape Verde islands).
Built with Node.js, Express, and MongoDB.

## Project Idea

Parcela lets customers browse products by category, manage a cart, check out
with island-based delivery pricing, pay via Vinti4/Multibanco, track orders,
leave verified reviews, and manage a wishlist. Authentication is phone+OTP
based, with Google login as an alternative.

## Tech Stack

- Node.js + Express.js (CommonJS)
- MongoDB + Mongoose
- JWT authentication
- Joi validation
- Cloudinary (image uploads)
- Vinti4/Multibanco payment gateway integration
- express-rate-limit, helmet, cors

## Requirements

- Node.js 18+
- MongoDB 6+ (replica set required for order checkout transactions)
- Cloudinary account (for product/banner image uploads)
- Google OAuth Client ID (for Google login)
- Vinti4/Multibanco merchant credentials (for live payments)

## Installation

```bash
npm install
```

## Environment Setup

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port |
| `CLIENT_URL` | Frontend URL, used for CORS and payment redirect |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VINTI4_MERCHANT_ID` / `VINTI4_POS_ID` / `VINTI4_POS_AUTH_CODE` | Vinti4 merchant credentials |
| `VINTI4_WEBHOOK_SECRET` | Secret used to sign/verify payment webhooks - keep as secret as `JWT_SECRET` |
| `VINTI4_GATEWAY_URL` | Vinti4 payment gateway base URL |

## Running the Server

Development (auto-restart on changes):

```bash
npm run dev
```

Production:

```bash
npm start
```

Health check: `GET /health`

## Project Structure

```
backend/
├── server.js
├── package.json
├── .env.example
└── src/
    ├── config/        # env, database, jwt, constants
    ├── controllers/    # business logic per module
    ├── routes/         # endpoint definitions
    ├── models/         # Mongoose schemas + index.js loader
    ├── middleware/      # auth, validation, error handling, upload, rate limit
    ├── services/        # cart, order, coupon, notification logic
    ├── lib/             # external integrations (SMS, Cloudinary, Vinti4)
    ├── utils/           # response helpers, generators
    └── validators/       # Joi schemas
```

## Notes on Architecture

- All `process.env` access goes through `src/config/env.js`. No other file
  reads `process.env` directly.
- All API responses follow one shape: `sendSuccess`, `sendError`,
  `sendPaginated` from `src/utils/response.js`.
- All models are loaded once through `src/models/index.js` in a fixed order
  to avoid `MissingSchemaError` from cross-model hooks.
- Order checkout uses a MongoDB transaction (`src/services/order.service.js`)
  to keep stock deduction, coupon usage, and cart clearing atomic. This
  requires MongoDB running as a replica set, even a single-node one for
  local development.
- The payment webhook route (`POST /api/payments/webhook`) has no JWT
  protection by design - it is called directly by the payment gateway and
  authenticated via HMAC signature instead.

## Documentation

See `API_DOCUMENTATION.md` for the full endpoint reference.
