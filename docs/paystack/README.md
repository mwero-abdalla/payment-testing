# Paystack Payment Flow

This document explains how the Paystack integration works in this app, what it expects, and how the checkout lifecycle is handled end to end.

## Overview

The Paystack flow is designed around a single checkout journey:

1. A customer opens the `/paystack` page.
2. The page sends cart and customer data to `POST /api/v1/paystack/initialize`.
3. The backend creates an order and payment record in MongoDB.
4. The backend requests an authorization URL from Paystack.
5. The customer is redirected to Paystack to complete payment.
6. When payment is complete, the app verifies the transaction through `GET` or `POST /api/v1/paystack/verify`.
7. The payment and order records are updated based on the verified status.

## User-facing page

### `/paystack`

The Paystack checkout page:
- Displays a static cart
- Collects the customer email address
- Sends the order to the Paystack initialization endpoint
- Redirects the customer to the Paystack authorization URL

The page does not need a separate shipping form or complex cart state. It is intentionally minimal so the payment lifecycle is easy to test.

## API Implementation

The Paystack implementation is encapsulated in the `PaystackProvider` class and accessed through the `PaymentGateway`.

### `POST /api/v1/paystack/initialize`

This route uses `PaymentGateway.paystack().initialize()` to start a transaction.

What it does:
- Validates the payload using Zod.
- Calculates the total amount.
- Persists initial `Payment` and `Order` records in MongoDB.
- Calls the Paystack API via the provider.
- Returns the `authorizationUrl` for customer redirection.

### `GET /api/v1/paystack/verify` and `POST /api/v1/paystack/verify`

These routes handle the customer redirect back from Paystack or direct verification requests. They use `PaymentGateway.paystack().verify()` to check the final status.

What it does:
- Extracts the transaction reference.
- Queries Paystack via the provider for the latest status.
- Normalizes the status to the app's internal `PaymentStatus`.
- Updates the `Payment` and `Order` records in MongoDB.
- Redirects the user to a success or failure page in the frontend (for GET).

## Status mapping

The app stores payment states in its own internal vocabulary:

- `success` from Paystack becomes `successful`
- `abandoned` or `cancelled` becomes `cancelled`
- `failed` or `reversed` becomes `failed`
- anything else remains `pending`

Order statuses are mapped similarly:

- `successful` payment becomes `paid`
- `failed` payment becomes `failed`
- `cancelled` payment becomes `cancelled`
- otherwise `pending`

## Environment variables

Use these values for Paystack:

- `PAYSTACK_SECRET_KEY` - secret key used by the backend
- `PAYSTACK_BASE_URL` - Paystack API base URL
- `PAYSTACK_CALLBACK_URL` - callback/verify URL after checkout

Example local callback URL:
```dotenv
PAYSTACK_CALLBACK_URL=http://localhost:3000/api/v1/paystack/verify
```

Example production callback URL:
```dotenv
PAYSTACK_CALLBACK_URL=https://your-domain.example/api/v1/paystack/verify
```

## Common response shape

The initialize endpoint returns a response like this:

```json
{
  "success": true,
  "data": {
    "orderId": "...",
    "paymentId": "...",
    "reference": "...",
    "authorizationUrl": "..."
  }
}
```

The verify endpoint returns:

```json
{
  "success": true,
  "data": {
    "reference": "...",
    "paymentStatus": "successful",
    "orderStatus": "paid",
    "payment": {},
    "order": {}
  }
}
```

## When to use Paystack webhooks

This app does not require a separate Paystack webhook to complete the main checkout flow.

The current implementation relies on transaction verification after the customer returns to the app. A webhook can still be added later if you want asynchronous reconciliation, dispute handling, or refund tracking.

## Testing checklist

1. Start the app with `npm run dev`.
2. Open `/paystack`.
3. Enter a valid email address.
4. Complete checkout in Paystack test mode.
5. Confirm the payment appears in `/dashboard`.

## Troubleshooting

### Missing secret key
If the backend complains that `PAYSTACK_SECRET_KEY` is missing, check your `.env.local` file and restart the dev server.

### Redirect URL mismatch
Make sure the Paystack callback URL in your env file matches the route your app exposes.

### Payment not updating
If the verify route succeeds but the dashboard still shows stale data, refresh the page and check the MongoDB records directly.
