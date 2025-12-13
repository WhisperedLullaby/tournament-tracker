# TODO - Tournament Tracker

## High Priority - Authentication Issue

### Fix Google OAuth Sign-In Flow
**Status**: Needs Investigation
**Priority**: High (before public release)
**Issue**: Users can complete OAuth flow but session isn't being recognized after redirect.

**Current Workaround**: Scorekeeper is publicly accessible (no auth required)

**Symptoms**:
- User clicks "Sign In" → completes Google OAuth
- Gets redirected back to tournament page correctly
- But UI still shows "Sign In" button (not "Sign Out")
- User role isn't detected (no organizer/participant status)
- Page reload after auth callback (`?auth=success`) doesn't help

**What We've Tried**:
1. ✅ Fixed auth callback to use redirect parameter
2. ✅ Added automatic page reload after OAuth
3. ✅ Updated callback to properly set cookies using `createServerClient`
4. ✅ Verified middleware is refreshing sessions
5. ✅ Verified layout is calling `getUser()` server-side

**Next Steps to Investigate**:
1. Check Supabase project settings for redirect URL configuration
2. Verify cookies are actually being set in browser (check DevTools)
3. Add logging to auth callback to see if `exchangeCodeForSession` succeeds
4. Check if there's a cookie domain/path issue
5. Test if session works when manually calling `/api/tournaments/[id]/role`
6. Consider using Supabase's `onAuthStateChange` listener in client
7. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

**Files Involved**:
- `src/app/auth/callback/route.ts` - OAuth callback handler
- `src/middleware.ts` - Session refresh middleware
- `src/app/tournaments/[slug]/layout.tsx` - Server-side user fetch
- `src/contexts/tournament-context.tsx` - Client-side role management
- `src/lib/auth/server.ts` - Server auth client
- `src/lib/supabase.ts` - Client auth client

**When to Fix**: Before public release / when adding auth-protected features back

---

## Other TODOs

(Add other todos here as needed)
