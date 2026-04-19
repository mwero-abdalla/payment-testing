# Pesapal Payment Flow

This document explains the Pesapal integration, including the checkout flow, callback verification, webhook/IPN handling, and the automated IPN sync process.

## Overview

The Pesapal integration in this app uses three related pieces:

1. A checkout page at `/pesalink`
2. A customer callback route at `/api/v1/pesapal/callback`
3. A server-to-server webhook/IPN route at `/api/v1/pesapal/webhook`

There is also a protected sync route:

- `POST /api/v1/pesapal/ipn/sync`

The goal is to keep the setup simple for development while still matching how Pesapal expects callbacks and IPN notifications to work.

## User-facing page

### `/pesalink`

The Pesapal checkout page:
- Displays the same static cart as the Paystack page
- Collects first name, last name, email, and phone number
- Sends payment data to `POST /api/v1/pesapal/initialize`
- Redirects the customer to the Pesapal redirect URL returned by the API

## API routes

### `POST /api/v1/pesapal/initialize`

Creates and starts a Pesapal transaction.

Request body:
- `email`
- `firstName`
- `lastName`
- `phoneNumber`
- `items`
- `currency` - optional, defaults to `KES`
- `callbackUrl` - optional override for the browser callback URL
- `description` - optional custom payment description

What it does:
- Validates the payload
- Calculates the cart total
- Creates a payment record with provider `pesapal`
- Creates a matching order record
- Resolves the Pesapal IPN ID from MongoDB first, then from env as fallback
- Initializes the payment with Pesapal
- Stores the provider response in MongoDB
- Returns the redirect URL and tracking details

### `GET /api/v1/pesapal/callback`

This is the browser redirect callback.

It is used when the customer returns from Pesapal after checkout.

What it does:
- Reads the tracking ID and merchant reference from the callback query
- Verifies the transaction with Pesapal
- Maps the provider status to local payment and order statuses
- Updates MongoDB records
- Returns a JSON response

### `POST /api/v1/pesapal/webhook`

This is the IPN/webhook route.

It handles server-to-server notifications from Pesapal.

What it does:
- Accepts JSON, form-encoded, or query-string payloads
- Extracts the tracking ID and merchant reference
- Verifies the transaction with Pesapal
- Updates the payment and order records
- Returns a JSON response

### `POST /api/v1/pesapal/ipn/sync`

This is a protected helper endpoint used to automate IPN registration.

How it works:
- Reads `PESAPAL_WEBHOOK_URL`
- Looks up an existing IPN registration for that URL
- Registers the webhook URL with Pesapal if no IPN entry exists
- Saves the returned `ipnId` in MongoDB
- Returns the synced IPN details in the response

## Callback vs webhook

These are intentionally separate:

- Callback URL: the customer-facing redirect after payment
- Webhook/IPN URL: the server-side notification URL Pesapal calls independently of the browser

They can point to the same endpoint in some setups, but this app keeps them separate so the flow is easier to reason about.

## IPN automation

You do not need to manually copy an IPN ID every time.

The recommended flow is:

1. Set `PESAPAL_WEBHOOK_URL` in your environment.
2. Set a strong `PESAPAL_SYNC_ADMIN_KEY`.
3. Call `POST /api/v1/pesapal/ipn/sync` once per environment.
4. Let the app store the returned IPN ID in MongoDB.
5. Let checkout initialization reuse the stored IPN ID automatically.

If the database does not yet contain an IPN ID, the app falls back to `PESAPAL_IPN_ID` from the environment.

## Environment variables

Use these values for Pesapal:

- `PESAPAL_CONSUMER_KEY` - Pesapal consumer key
- `PESAPAL_CONSUMER_SECRET` - Pesapal consumer secret
- `PESAPAL_BASE_URL` - Pesapal API base URL
- `PESAPAL_CALLBACK_URL` - browser callback URL
- `PESAPAL_WEBHOOK_URL` - IPN/webhook URL
- `PESAPAL_IPN_ID` - fallback notification ID
- `PESAPAL_SYNC_ADMIN_KEY` - protects the sync endpoint

Example local values:
```dotenv
PESAPAL_CALLBACK_URL=http://localhost:3000/api/v1/pesapal/callback
PESAPAL_WEBHOOK_URL=http://localhost:3000/api/v1/pesapal/webhook
```

Example production values:
```dotenv
PESAPAL_CALLBACK_URL=https://your-domain.example/api/v1/pesapal/callback
PESAPAL_WEBHOOK_URL=https://your-domain.example/api/v1/pesapal/webhook
```

## Sync endpoint example

```bash
curl -X POST http://localhost:3000/api/v1/pesapal/ipn/sync \
  -H "x-admin-key: YOUR_SYNC_KEY"
```

A successful response includes the Pesapal `ipnId` under `data.provider.ipnId` and also under `data.stored.ipnId`.

## Status mapping

Pesapal statuses are mapped into the app's internal statuses:

- Completed or success-like responses become `successful`
- Cancelled responses become `cancelled`
- Failed or invalid responses become `failed`
- Anything else remains `pending`

Order statuses follow the same mapping rules:

- `successful` payment becomes `paid`
- `failed` payment becomes `failed`
- `cancelled` payment becomes `cancelled`
- otherwise `pending`

## Testing checklist

1. Configure Pesapal credentials.
2. Set `PESAPAL_WEBHOOK_URL` to the correct public callback URL.
3. Set `PESAPAL_SYNC_ADMIN_KEY`.
4. Call `POST /api/v1/pesapal/ipn/sync` once.
5. Open `/pesalink` and complete a test payment.
6. Confirm the transaction appears in `/dashboard`.

## Troubleshooting

### Missing IPN ID
If checkout fails because the IPN ID is missing, run the sync endpoint again or set `PESAPAL_IPN_ID` manually as a fallback.

### Callback or webhook not firing
Make sure the Pesapal URLs are public HTTPS endpoints in production. Localhost URLs only work for local testing unless you use a tunnel.

### IPN sync unauthorized
Check that `PESAPAL_SYNC_ADMIN_KEY` matches the value you send in `x-admin-key` or as a Bearer token.
