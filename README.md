# Instant Service Booking System

A full-stack demo that lets users instantly book house help services and automatically assigns the nearest available provider with a 15-minute guarantee.

## Folder Structure

```
backend/   Express + MongoDB API
frontend/  React + Tailwind UI
```

## Tech Stack

- Frontend: React, Tailwind CSS, Vite
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)
- Auth: JWT + bcrypt

## Setup Instructions

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed:demo
npm run dev
```

Backend runs at `http://localhost:4000`.
Socket.IO uses the same backend port for real-time chat.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Sample Mock Data

`npm run seed:demo` wipes and recreates demo data with:
- 1 platform admin
- 2 customers
- 5 service providers
- 1 pending booking with notification events ready for testing

## Database Schemas (Mongoose)

**User**
- `name` (String, required)
- `email` (String, required, unique)
- `phone` (String, required)
- `passwordHash` (String, required)
- `role` (CUSTOMER | PROVIDER | ADMIN)
- `addresses[]` (label, line1, line2, city, state, zip, latitude, longitude)

**Provider**
- `name` (String, required)
- `user` (ObjectId -> User)
- `serviceType` (String, required)
- `rating` (Number)
- `availability` (Boolean)
- `location` (latitude, longitude)
- `imageUrl` (String)

**Booking**
- `bookingId` (String, unique)
- `user` (ObjectId -> User)
- `provider` (ObjectId -> Provider)
- `serviceType` (String)
- `status` (PENDING | ACTIVE | REJECTED | COMPLETED | CANCELLED)
- `etaAt` (Date)
- `etaMinutes` (Number)
- `distanceKm` (Number)
- `price` (Number)
- `isEmergency` (Boolean)
- `paymentMethod` (String)
- `paymentStatus` (PENDING | PAID)
- `paymentTxnId` (String, optional)
- `paidAt` (Date, optional)
- `messages[]` (senderRole, senderId, senderName, text, sentAt)
- `rating` (Number, optional)
- `review` (String, optional)

**Notification**
- `recipient` (ObjectId -> User)
- `bookingId` (String, optional)
- `type` (String)
- `title` (String)
- `message` (String)
- `actionType` (String, optional)
- `read` (Boolean)

## API Endpoints

- `POST /register`
- `POST /login`
- `GET /services`
- `POST /book` (auth)
- `GET /booking/:id` (auth)
- `GET /history` (auth)
- `POST /booking/:id/cancel` (auth)
- `POST /booking/:id/rate` (auth)
- `GET /booking/:id/messages` (auth)
- `POST /booking/:id/message` (auth)
- `POST /booking/:id/pay` (auth)
- `GET /provider/assignments` (auth, provider)
- `POST /provider/availability` (auth, provider)
- `POST /provider/booking/:id/action` (auth, provider)
- `GET /notifications` (auth)
- `POST /notifications/:id/read` (auth)
- `GET /admin/overview` (auth, admin)

## Booking Flow

1. Register -> Login -> Select Service
2. Booking request uses nearest available provider
3. Provider is marked unavailable immediately
4. ETA calculated by distance or 15-minute guarantee
5. Live countdown + provider tracking UI

## Real-Time Chat Test

1. Register a Service Provider with a specific service type.
2. Register a Customer and book the same service type.
3. Open the Customer tracking page and the Provider dashboard in two sessions.
4. Send messages from either side to see real-time chat updates.

## Notes

- Emergency booking mode applies 1.5x surge pricing and 5-minute priority.
- ETA is `max(15 minutes, distance / average speed)` or 5 minutes for emergency.
- Chat is real-time via Socket.IO. Payment uses a test endpoint for demo UX.
- Notifications are persisted in DB and delivered in real time to logged-in users.
- Providers select service type and location during signup to receive real bookings.
- Select a role during registration to see different dashboards:
  - Customer: booking history and active tracking
  - Service Provider: assignments and availability toggle
  - Platform Admin: KPI overview and dispatch queue (admin is set manually)
