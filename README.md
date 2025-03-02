# Linkd Landing Page

A simple landing page for Linkd, connecting people through alumni networks.

## Development

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`

## Deployment on Railway

This project is configured for easy deployment on Railway.

### Deployment Steps

1. Sign up for a Railway account at [railway.app](https://railway.app)
2. Install the Railway CLI: `npm i -g @railway/cli`
3. Login to Railway: `railway login`
4. Initialize the project: `railway init`
5. Deploy: `railway up`

Alternatively, connect your GitHub repository to Railway for automatic deployments.

# Linkd Waitlist

A waitlist landing page for Linkd.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Run the development server: `npm run dev`

## Email Functionality

The application sends confirmation emails when users sign up for the waitlist. This is handled using the [Resend](https://resend.com) email service.

### Configuration

1. Sign up for a Resend account at [resend.com](https://resend.com)
2. Create an API key in the Resend dashboard
3. Add your API key to the `.env` file:
   ```
   RESEND_API_KEY=your_resend_api_key
   ```

### Testing Email Functionality

For development and testing, you can use the included email testing tool:

1. Start the development server: `npm run dev`
2. Visit [http://localhost:3001/email-test.html](http://localhost:3001/email-test.html)
3. Enter an email address and optionally a name and school
4. Click "Send Test Email" to send a test email

### Production Setup

For production deployment, make sure to:

1. Add your domain to the Resend dashboard and verify it
2. Set the `NODE_ENV` environment variable to `production`
3. Configure the proper `RESEND_API_KEY` in your production environment

## API Endpoints

- `POST /api/waitlist` - Register an email for the waitlist
- `GET /api/config` - Get public configuration (Supabase credentials)
- `GET /api/healthcheck` - Health check endpoint for monitoring
- `GET /api/diagnose` - Diagnostic endpoint (development only)

### Development Testing Endpoints

These endpoints are only available in development mode:

- `POST /api/test/clear-waitlist` - Clear all waitlist entries (for testing)
- `POST /api/test/send-email` - Send a test email
