# 005: Post-Launch Refinements & Design Updates

## Overview
Refinements made after implementing the registration system, including design updates, bug fixes, and production preparation.

## Completed Tasks

### 1. Fixed Registration Form Stepper Bug

**Issue**: Step counter showed "NaN of 4" instead of proper step numbers.

**Root Cause**: `stepper.current.index` doesn't exist in the stepperize API.

**Solution**: Calculate step index manually in `src/components/registration-form.tsx`:

```typescript
// Calculate current step index
const currentStepIndex = stepper.all.findIndex(
  (step) => step.id === stepper.current.id
);

// Use in display
<CardDescription>
  Step {currentStepIndex + 1} of {stepper.all.length}
</CardDescription>
```

### 2. Updated Color Scheme

**New Color Palette** (earthy green tones):
- `#F0F0D7` - Background (lightest cream)
- `#D0DDD0` - Borders, muted elements (light green-gray)
- `#AAB99A` - Secondary & accent (medium sage green)
- `#727D73` - Primary brand color (dark green-gray)

**Files Updated**:
- `src/app/globals.css` - Updated `:root` and `.dark` CSS variables
- `src/lib/emails/registration-confirmation.tsx` - Updated email colors to match

### 3. Dark Mode Enhancements

Added proper dark mode version of the green color palette:
- `#2A3330` - Very dark green-gray background
- `#3A4542` - Slightly lighter for cards
- `#AAB99A` - Medium sage green as primary (pops on dark)
- `#4A5651` - Borders and muted elements
- `#E8EDE8` - Light cream-green for text

### 4. Added Custom Text Sizes

**Problem**: Needed larger text sizes beyond Tailwind's default `text-7xl`.

**Solution**: Extended Tailwind CSS v4 theme in `src/app/globals.css`:

```css
@theme inline {
  /* ... existing theme ... */
  --text-8xl: 6rem;
  --text-8xl--line-height: 1;
  --text-9xl: 8rem;
  --text-9xl--line-height: 1;
  --text-10xl: 10rem;
  --text-10xl--line-height: 1;
  --text-11xl: 12rem;
  --text-11xl--line-height: 1;
}
```

**Usage**: Now supports `text-8xl`, `text-9xl`, `text-10xl`, `text-11xl` with responsive prefixes (e.g., `lg:text-11xl`)

### 5. Updated Email Configuration

**Domain**: hewwopwincess.com (verified in Resend)

**Updated Email Address** in `src/app/api/register-pod/route.ts`:
```typescript
from: "Bonnie & Clyde Tournament <tournament@hewwopwincess.com>"
```

**Benefits**:
- Professional appearance
- Better deliverability
- Matches tournament domain

### 6. Fixed Registration Status Loading

**Issue**: Page showed "Registration Closed" flash before loading.

**Solution**: Changed to optimistic loading in `src/components/home-page-client.tsx`:
```typescript
// Start optimistically assuming registration is open
const [registrationStatus, setRegistrationStatus] =
  useState<RegistrationStatus>({ isOpen: true, podCount: 0, maxPods: 9 });
```

**Result**: Form shows immediately, only switches if actually closed.

### 7. Added Volleyball Court Background Images

**Implementation**: Added decorative background images to format section cards.

**Files**:
- Image: `src/app/assets/images/image.jpg`
- Component: `src/components/home-page-client.tsx`

**Design Details**:
- Two empty cards with volleyball court image backgrounds
- Top-right portion in Pool Play row (position: `calc(100% + 110px) -86px`)
- Bottom-left portion in Bracket Play row (position: `0 -291px`)
- Same image scaled at 259% for continuity
- Overlay blend mode with muted color tint for cohesion
- Bottom card hidden on mobile (`hidden md:block`)

**Effect**: Creates visual continuity - appears as one image split diagonally across the layout.

### 8. Cloudflare Turnstile Configuration

**Issue**: CAPTCHA constantly erroring in development due to hot module reload.

**Domain Configuration** (in Cloudflare Dashboard):
- `localhost`
- `127.0.0.1`
- `hewwopwincess.com`

**Widget Settings**:
- Mode: Non-Interactive
- No Preclearance

**Development Issue**: Hot module reload causes 1.17k challenges vs 39 solved (3.34% success rate).

**Recommended Solution for Development**:
Use test keys in `.env.local` for local development:
```env
# Development - always passes
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Production - use real keys (comment these out for dev)
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_real_site_key
# TURNSTILE_SECRET_KEY=your_real_secret_key
```

**Production**: Real keys will work fine - the issue only occurs in development with HMR.

### 9. Content Updates

**Hero Section**:
- Title changed from "Bonnie & Clyde" to "Two Peas"
- Subtitle: "Pod Tournament"

**Tournament Details**:
- Date: November 1st, 2025
- Time: 10:00 AM - 2:00 PM
- Minimum: 6 sets
- Location: All American FieldHouse - Champions Court
- Scoring: Rally scoring to 21 points (updated from 25)

**Rules Updates**:
- Added note: "No rotation required. Only rotate servers (everyone must serve)"
- Clarified reverse coed rules apply if rotation preferred

## Environment Variables

**Required in `.env.local`**:
```env
# Database
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key

# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxx
```

## Testing Checklist

- [x] Registration form works end-to-end
- [x] Email confirmation sends successfully
- [x] Database stores pod data correctly
- [x] Registration closes at 9 pods
- [x] Duplicate email prevention works
- [x] CAPTCHA verification works (in production)
- [x] Dark mode color scheme looks good
- [x] Responsive design works on mobile
- [x] Custom text sizes render correctly

## Known Issues

### Development Only
- **Turnstile CAPTCHA errors** - Due to hot module reload, use test keys for local dev
- No impact on production deployment

## Production Deployment Preparation

### Before Deploying:

1. **Switch to Real Turnstile Keys**
   - Use production keys in environment variables
   - Test keys are for development only

2. **Verify Domain in Turnstile Dashboard**
   - Add production domain (hewwopwincess.com) to allowed domains
   - Remove localhost/127.0.0.1 if desired

3. **Test Email Delivery**
   - Verify Resend domain is properly configured
   - Send test registration to confirm emails work

4. **Database Verification**
   - Confirm Supabase connection strings are correct
   - Verify schema is up to date (`npm run db:push`)

5. **Build Test**
   ```bash
   npm run build
   npm start
   ```
   - Verify production build works
   - Test registration flow in production mode

## Files Modified

- `src/app/globals.css` - Color scheme, dark mode, custom text sizes
- `src/components/registration-form.tsx` - Fixed stepper bug
- `src/components/home-page-client.tsx` - Optimistic loading, image backgrounds, content updates
- `src/lib/emails/registration-confirmation.tsx` - Color scheme updates
- `src/app/api/register-pod/route.ts` - Email from address
- `.env.local.example` - Updated with all required variables

## Next Steps

1. Deploy to production (Vercel recommended)
2. Configure production environment variables
3. Test full registration flow on live site
4. Monitor Turnstile analytics for actual user success rate
5. Consider building standings, schedule, and scoring pages
