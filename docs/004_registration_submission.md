# 004: Registration Form Submission

## Overview

Wire up the registration form to actually save pods to the database, verify CAPTCHA tokens, and send confirmation emails to registrants.

## Prerequisites

- Cloudflare Turnstile account (free)
- Email service provider account (Resend recommended - free tier)
- Supabase database already configured

## Implementation Steps

### 1. Set Up Cloudflare Turnstile

**Get API Keys:**

1. Go to https://dash.cloudflare.com/
2. Navigate to Turnstile section
3. Create a new site widget
4. Copy both the Site Key and Secret Key

**Add to Environment Variables:**

```env
# .env.local
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

### 2. Choose and Set Up Email Provider

**Option A: Resend (Recommended)**

- Free tier: 3,000 emails/month, 100 emails/day
- Simple API, built for developers
- Great DX with TypeScript support

**Option B: SendGrid**

- Free tier: 100 emails/day
- More enterprise features
- Slightly more complex setup

**Option C: Postmark**

- Free tier: 100 emails/month
- Excellent deliverability
- Transaction-focused

**Recommended: Use Resend**

1. Sign up at https://resend.com/
2. Verify your domain (or use their dev domain for testing)
3. Get API key from dashboard
4. Add to `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
```

### 3. Install Dependencies

```bash
npm install resend
```

### 4. Create Form Submission API Endpoint

**File: `src/app/api/register-pod/route.ts`**

This endpoint will:

1. Validate incoming form data
2. Verify CAPTCHA token with Cloudflare
3. Check if registration is still open (< 9 pods)
4. Check for duplicate email addresses
5. Insert pod into database
6. Send confirmation email
7. Return success/error response

### 5. Create Email Template

**File: `src/lib/emails/registration-confirmation.tsx`**

Build a React email template using Resend's React Email library:

- Welcome message
- Tournament details (date, time, location)
- Pod/team information
- What to expect next
- Contact information

### 6. Update Registration Form

**File: `src/components/registration-form.tsx`**

Update the `handleSubmit` function to:

1. Call the new `/api/register-pod` endpoint
2. Handle loading states
3. Handle success (show success step)
4. Handle errors (display error messages to user)
5. Prevent duplicate submissions

### 7. Add Email Validation

Prevent duplicate registrations by:

1. Adding unique constraint to email field in database schema
2. Checking for existing email before insertion
3. Displaying helpful error if email already registered

### 8. Error Handling

Handle these scenarios:

- CAPTCHA verification fails
- Registration is full (9 pods already)
- Duplicate email address
- Database connection errors
- Email sending failures (don't block registration if email fails)

### 9. Testing Checklist

- [ ] Test form with valid data
- [ ] Test CAPTCHA verification (both success and failure)
- [ ] Test duplicate email prevention
- [ ] Test registration closing at 9 pods
- [ ] Test email delivery
- [ ] Test error messages display correctly
- [ ] Test mobile responsiveness
- [ ] Test with expired CAPTCHA token

## Security Considerations

1. **Server-side validation**: Never trust client data
2. **Rate limiting**: Consider adding rate limiting to prevent abuse
3. **CAPTCHA verification**: Always verify on server, never client
4. **Email sanitization**: Sanitize all user input before sending emails
5. **Environment variables**: Keep secret keys in `.env.local`, never commit

## Database Schema Updates

Add unique constraint to email field:

```typescript
// src/lib/db/schema.ts
export const pods = pgTable("pods", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // Add .unique()
  name: text("name").notNull(),
  player1: text("player1").notNull(),
  player2: text("player2").notNull(),
  teamName: text("team_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Success Criteria

- User can submit registration form successfully
- Pod data is saved to Supabase database
- Confirmation email is sent to user
- User sees success message with their registration details
- Duplicate registrations are prevented
- Registration closes automatically at 9 pods
- All errors are handled gracefully with user-friendly messages
- Note: can use agnone.anthony@gmail.com for testing

## Future Enhancements (Out of Scope)

- Email verification (click link to confirm email)
- Edit/cancel registration
- Waitlist functionality after 9 pods
- SMS notifications
- Payment integration
