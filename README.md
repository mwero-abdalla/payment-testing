# Payment Testing App

A Next.js 16 payment testing app that demonstrates two payment providers side by side: Paystack and Pesapal. The app records orders and payments in MongoDB, provides checkout pages for each provider, and exposes a dashboard for reviewing transaction history.

## What this app includes

- Two checkout experiences:
  - [Paystack](docs/paystack/README.md)
  - [Pesapal](docs/pesapal/README.md)
- MongoDB-backed order and payment records
- A dashboard for viewing stored orders and payments
- API routes for initializing and verifying payments
- A Pesapal IPN sync endpoint for automating webhook registration

## Main routes

### Pages
- `/` - landing page
- `/paystack` - Paystack checkout form
- `/pesalink` - Pesapal checkout form
- `/dashboard` - orders and payments dashboard

### API routes
- `POST /api/v1/paystack/initialize`
- `POST /api/v1/paystack/verify`
- `GET /api/v1/paystack/verify`
- `POST /api/v1/pesapal/initialize`
- `POST /api/v1/pesapal/webhook`
- `GET /api/v1/pesapal/callback`
- `POST /api/v1/pesapal/ipn/sync`
- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `GET /api/v1/orders/[id]`
- `GET /api/v1/payments`
- `POST /api/v1/payments`
- `GET /api/v1/payments/[id]`
- `PATCH /api/v1/payments/[id]`

## Data flow

1. The user opens either `/paystack` or `/pesalink`.
2. The checkout page posts cart and customer data to the relevant initialize endpoint.
3. The API creates an order and a payment record in MongoDB.
4. The payment provider is called with the generated reference.
5. The customer is redirected to the provider checkout page.
6. The payment is later verified by callback, verify endpoint, or Pesapal webhook/IPN sync.
7. The order and payment records are updated with the final status.

## Local development

### Prerequisites
- Node.js 20+
- MongoDB running locally or a MongoDB Atlas connection string

### Install dependencies
```bash
npm install
```

### Environment variables
Copy the template values from [.env.example](.env.example) into [.env.local](.env.local) and fill in the provider credentials.

### Run the app
```bash
npm run dev
```

Then open:
- http://localhost:3000/paystack
- http://localhost:3000/pesalink
- http://localhost:3000/dashboard

### Validate the project
```bash
npm run lint
npm run build
```

## Environment summary

### Shared
- `MONGODB_URI`
- `MONGODB_DB_NAME`

### Paystack
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_BASE_URL`
- `PAYSTACK_CALLBACK_URL`

### Pesapal
- `PESAPAL_CONSUMER_KEY`
- `PESAPAL_CONSUMER_SECRET`
- `PESAPAL_BASE_URL`
- `PESAPAL_CALLBACK_URL`
- `PESAPAL_WEBHOOK_URL`
- `PESAPAL_IPN_ID`
- `PESAPAL_SYNC_ADMIN_KEY`

## Documentation

- [Paystack payment guide](docs/paystack/README.md)
- [Pesapal payment guide](docs/pesapal/README.md)

## Notes

- Paystack uses callback verification after the user returns from checkout.
- Pesapal uses both a callback route and a webhook/IPN route.
- The Pesapal IPN ID can be synced automatically with `POST /api/v1/pesapal/ipn/sync` once the admin key and webhook URL are configured.
