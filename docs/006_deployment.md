# 006: Deploying to Vercel

## Overview
Step-by-step guide to deploy the tournament tracker application to Vercel with proper environment configuration and domain setup.

## Prerequisites

- [x] GitHub repository with all code pushed
- [x] Vercel account (sign up at https://vercel.com)
- [x] Domain registered (hewwopwincess.com)
- [x] All services configured:
  - Supabase database
  - Resend email service
  - Cloudflare Turnstile

## Deployment Steps

### 1. Connect to Vercel

1. Go to https://vercel.com/
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository
5. Click **"Import"**

### 2. Configure Project Settings

**Framework Preset**: Next.js (should auto-detect)

**Root Directory**: `./` (leave as default)

**Build Command**: `npm run build` (default)

**Output Directory**: `.next` (default)

**Install Command**: `npm install` (default)

### 3. Set Environment Variables

Click **"Environment Variables"** section and add all of the following:

#### Database Variables
```
DATABASE_URL
```
Value: Your Supabase pooler connection string
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

#### Supabase Variables
```
NEXT_PUBLIC_SUPABASE_URL
```
Value: `https://YOUR_PROJECT_REF.supabase.co`

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Value: Your Supabase anon key (from Supabase Dashboard → Settings → API)

#### Cloudflare Turnstile Variables
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY
```
Value: Your production Turnstile site key (starts with `0x...`)

**IMPORTANT**: Make sure this is your REAL site key, not the test key (`1x00000000000000000000AA`)

```
TURNSTILE_SECRET_KEY
```
Value: Your Turnstile secret key (from Cloudflare Dashboard)

#### Resend Email Variables
```
RESEND_API_KEY
```
Value: Your Resend API key (starts with `re_`)

### 4. Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Vercel will provide a URL: `https://your-project-name.vercel.app`

### 5. Configure Custom Domain

#### Add Domain to Vercel

1. Go to your project → **Settings** → **Domains**
2. Add `hewwopwincess.com`
3. Vercel will provide DNS records to configure

#### Update DNS Records

Go to your domain registrar (GoDaddy, Namecheap, etc.) and add these records:

**For root domain** (hewwopwincess.com):
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Wait time**: DNS propagation can take 5 minutes to 48 hours (usually ~30 minutes)

### 6. Update Cloudflare Turnstile Domains

1. Go to Cloudflare Dashboard → Turnstile → Your Widget
2. Under **Domains**, add:
   - `hewwopwincess.com`
   - `www.hewwopwincess.com` (if using www)
3. **Remove** `localhost` and `127.0.0.1` (or keep for future local testing)
4. Save changes

### 7. Verify Resend Domain

Make sure `hewwopwincess.com` is verified in Resend:

1. Go to Resend Dashboard → Domains
2. Confirm `hewwopwincess.com` shows as **Verified**
3. If not verified, add the DNS records Resend provides

## Post-Deployment Testing

### Test Registration Flow

1. Visit `https://hewwopwincess.com`
2. Fill out registration form
3. Complete CAPTCHA
4. Submit form
5. Verify:
   - Success message appears
   - Email arrives in inbox
   - Pod appears in Supabase database

### Test Registration Closed State

1. Register 9 pods (or manually insert into database)
2. Refresh homepage
3. Verify:
   - "Registration Closed" message shows
   - Form is hidden
   - Correct pod count displayed

### Check Analytics

**Cloudflare Turnstile**:
- Go to Dashboard → Turnstile → Analytics
- Should see much higher success rate than development (>90%)
- Monitor for any issues

**Resend**:
- Go to Dashboard → Emails
- Verify emails are sending successfully
- Check for any bounces or errors

## Troubleshooting

### Build Fails

**Error: Environment variable not found**
- **Solution**: Double-check all environment variables are set in Vercel
- Go to Settings → Environment Variables
- Make sure there are no typos in variable names

**Error: Module not found**
- **Solution**: Clear build cache
- Go to Settings → General → scroll to bottom
- Click "Clear Build Cache & Redeploy"

### CAPTCHA Not Working

**Error: Invalid domain**
- **Solution**: Make sure domain is added to Turnstile widget
- Cloudflare Dashboard → Turnstile → Your Widget → Domains
- Add your production domain

**Error: Invalid site key**
- **Solution**: Using test key in production
- Replace with real production site key in Vercel environment variables

### Email Not Sending

**Error: API key invalid**
- **Solution**: Regenerate API key in Resend
- Update in Vercel environment variables
- Redeploy

**Error: Domain not verified**
- **Solution**: Verify domain in Resend
- Add required DNS records (SPF, DKIM)
- Wait for verification (can take a few minutes)

### Database Connection Fails

**Error: Connection timeout**
- **Solution**: Use transaction pooler URL, not direct connection
- Format: `postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres`

**Error: SSL connection required**
- **Solution**: Add `?sslmode=require` to end of DATABASE_URL
- Example: `postgresql://...@pooler.supabase.com:6543/postgres?sslmode=require`

### 404 on Pages

**Issue**: Direct URLs return 404
- **Solution**: This shouldn't happen with App Router, but if it does:
- Check that files are in `src/app` directory
- Verify `next.config.ts` doesn't have redirects blocking routes

## Vercel CLI (Optional)

For faster deployments and testing, install Vercel CLI:

```bash
npm install -g vercel
```

### Deploy from Command Line

```bash
# First time setup
vercel login
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Pull Environment Variables

```bash
# Download production environment variables to .env.local
vercel env pull .env.local
```

## Monitoring

### Vercel Dashboard

Monitor your deployment:
- **Deployments**: See all builds and their status
- **Analytics**: Track page views and performance
- **Logs**: View real-time application logs
- **Speed Insights**: Monitor Core Web Vitals

### Set Up Alerts

1. Go to Settings → Notifications
2. Enable alerts for:
   - Failed deployments
   - High error rates
   - Slow page loads

## Updating the Site

### For Code Changes

1. Push changes to GitHub
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. Vercel automatically deploys when you push to main branch
3. Wait for build to complete (~2-5 minutes)
4. Changes go live automatically

### For Environment Variable Changes

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit the variable
3. Select which environments to update (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** for changes to take effect:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

## Security Best Practices

### Environment Variables
- ✅ Never commit `.env.local` to Git
- ✅ Use different keys for development and production
- ✅ Rotate API keys periodically
- ✅ Keep secret keys in Vercel only, never expose in code

### Database
- ✅ Use connection pooling (already configured)
- ✅ Don't expose direct database URLs
- ✅ Enable Row Level Security in Supabase (for future features)

### CAPTCHA
- ✅ Always verify CAPTCHA token on server-side
- ✅ Never skip verification
- ✅ Monitor success rates for unusual activity

## Cost Considerations

### Vercel
- **Hobby Plan**: Free
  - Includes: 100 GB bandwidth/month
  - Custom domains
  - Automatic HTTPS
  - Should be sufficient for small tournament

### Supabase
- **Free Tier**:
  - 500 MB database
  - 2 GB bandwidth
  - 50,000 monthly active users
  - More than enough for 9 pods

### Resend
- **Free Tier**:
  - 3,000 emails/month
  - 100 emails/day
  - Sufficient for registration confirmations

### Cloudflare Turnstile
- **Free**: Unlimited challenges
- No cost for any volume

**Total Monthly Cost**: $0 (all free tiers)

## Rollback Plan

If deployment has issues:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Previous version goes live immediately

## Next Steps After Deployment

1. **Share the Link**: Send tournament URL to participants
2. **Monitor Registrations**: Check Supabase database as pods register
3. **Test on Mobile**: Verify responsive design on actual devices
4. **Backup Database**: Set up regular Supabase backups
5. **Build Additional Pages**:
   - `/standings` - Show registered teams
   - `/schedule` - Tournament schedule
   - `/scoring` - Live score updates

## Helpful Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel Support**: https://vercel.com/support
- **Custom Domain Setup**: https://vercel.com/docs/projects/domains

## Success Checklist

- [ ] Site loads at hewwopwincess.com
- [ ] HTTPS is working (lock icon in browser)
- [ ] Registration form displays correctly
- [ ] CAPTCHA loads and works
- [ ] Form submission succeeds
- [ ] Email arrives in inbox
- [ ] Pod appears in Supabase database
- [ ] Registration closes at 9 pods
- [ ] Mobile responsive design works
- [ ] No console errors in browser
- [ ] All environment variables are set correctly

🎉 Once all items are checked, your tournament site is live!
