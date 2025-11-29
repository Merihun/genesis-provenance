# Genesis Provenance - Phase 1

AI-powered provenance vault for luxury assets. This repository contains the Phase 1 implementation of Genesis Provenance, including the marketing site, authentication system, and dashboard foundation.

## Overview

**Company**: GildedGenesis Provenance Vault (Genesis Provenance)  
**Domain**: genesisprovenance.com  
**Version**: Phase 1 (Foundation)

### What's Included in Phase 1

- **Marketing Site**: Complete public-facing website with:
  - Home, Product, How It Works, Pricing, Use Cases, Security, About, Contact pages
  - Responsive design with modern UI
  - Contact form with database storage
  
- **Authentication System**:
  - Email/password authentication with NextAuth.js
  - Secure password hashing (bcrypt)
  - Multi-role support (collector, reseller, partner, admin)
  - Multi-tenant organization model
  
- **Dashboard Application**:
  - Protected dashboard with role-based access control
  - User profile and settings management
  - Admin console for user/organization management
  - Placeholder pages for future features (My Vault, asset uploads)
  
- **Database Schema**:
  - PostgreSQL with Prisma ORM
  - Tables: users, organizations, items, item_categories, contact_submissions
  - Proper relations and indexes

### Deferred to Future Phases

- **Phase 2**: Asset onboarding wizard, file uploads (S3), document storage
- **Phase 3**: n8n webhooks, AI service integration for authentication
- **Phase 4**: Stripe payment processing, subscription management
- **Phase 5**: Advanced admin features, virtual roles configuration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js v4
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation

## Prerequisites

- Node.js 18+ and Yarn
- PostgreSQL 14+
- Git

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd genesis_provenance/nextjs_space
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for local dev)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

### 4. Set Up Database

Generate Prisma client:
```bash
npx prisma generate
```

Push schema to database:
```bash
npx prisma db push
```

Seed database with initial data:
```bash
yarn prisma db seed
```

This will create:
- Item categories (Watch, Handbag, Jewelry, Art, Collectible, Other)
- Default admin user: `john@doe.com` / `johndoe123`

### 5. Start Development Server

```bash
yarn dev
```

The application will be available at http://localhost:3000

## Project Structure

```
nextjs_space/
├── app/
│   ├── (marketing)/          # Public marketing site pages
│   ├── (dashboard)/          # Protected dashboard pages
│   ├── auth/                 # Login/signup pages
│   ├── api/                  # API routes
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── marketing/            # Marketing site components
│   ├── dashboard/            # Dashboard components
│   └── ui/                   # Shared UI components (shadcn)
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── auth-options.ts       # NextAuth configuration
│   └── utils.ts              # Utility functions
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/
│   └── seed.ts               # Database seeding script
├── public/                   # Static assets
├── .env.example              # Environment variables template
├── Dockerfile                # Docker configuration
└── README.md                 # This file
```

## Building for Production

```bash
yarn build
```

This will create an optimized production build in the `.next` directory.

To start the production server:

```bash
yarn start
```

## Docker Deployment

See `Dockerfile` for containerized deployment.

Build image:
```bash
docker build -t genesis-provenance .
```

Run container:
```bash
docker run -p 3000:3000 -e DATABASE_URL="your-db-url" -e NEXTAUTH_URL="your-url" -e NEXTAUTH_SECRET="your-secret" genesis-provenance
```

## DNS & Email Setup

See [DNS_SETUP.md](./DNS_SETUP.md) for detailed instructions on:
- Configuring DNS records in GoDaddy
- Setting up Microsoft 365 email
- SSL/TLS certificates

## Database Schema

### Users
- Multi-role support: collector, reseller, partner, admin
- Belongs to organizations (optional for collectors)
- Secure password hashing

### Organizations
- Multi-tenant isolation
- Types: individual, reseller, partner, enterprise

### Items
- Provenance records for luxury assets
- Categories: Watch, Handbag, Jewelry, Art, Collectible, Other
- Status tracking: pending, verified, flagged, rejected
- Risk scoring (0-100)

### Contact Submissions
- Captures waitlist/contact form submissions
- Status tracking: new, contacted, converted, archived

## Authentication

The app uses NextAuth.js with email/password credentials:

- **Sign Up**: `/auth/signup`
- **Sign In**: `/auth/login`
- **Dashboard**: `/dashboard` (protected)

Default admin credentials (for testing):
- Email: `john@doe.com`
- Password: `johndoe123`

## Environment-Specific Configuration

### Development
```bash
NEXTAUTH_URL=http://localhost:3000
```

### Production
```bash
NEXTAUTH_URL=https://app.genesisprovenance.com
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Verify database exists and user has proper permissions

### Authentication Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your deployment URL
- Verify database schema is up to date with `npx prisma db push`

### Build Errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && yarn install`
- Regenerate Prisma client: `npx prisma generate`

## Development Guidelines

- Use TypeScript for all new code
- Follow Next.js 14 App Router conventions
- Server components by default, use `'use client'` only when needed
- All API routes should include error handling
- Use Prisma for database operations
- Follow the existing component structure

## Support

For questions or issues:
- Email: contact@genesisprovenance.com
- Documentation: See [DNS_SETUP.md](./DNS_SETUP.md)

## License

Proprietary - All rights reserved by GildedGenesis Provenance Vault
