# Task: Multi-Tournament Platform

**Objective:** Update the UI to resemble/display original tournament information page. From the main branch, the original home page had a lot of nice features such as a nice tournament format section, and tournament rules section. From the original home page, the header/landing page section was split between the title of the page and the registration. I want to bring that back instead of the registration link at the bottom of the page. but I want it to also contain links for the standings and pods list (teams), and schedule. The tournament landing page will resemble closely to the original homepage. since essentially that was the tournament landing page before when this website was for a single tournament.

---

## 1. Core Technologies

- **Framework:** Next.js 15.3 (App Router)
- **Language:** TypeScript (Strict Mode)
- **UI:** Tailwind CSS with shadcn/ui
- **Linting & Formatting:** ESLint & Prettier
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Authentication:** Supabase Auth (Google OAuth)

---

## 2. Key Requirements

### Design Cohesion

### Readable

### Branding

---

## 3. Implementation Plan

This plan is divided into 1 phase. restore tournament landing page.

---

### **PHASE 1: Restoration**

**Objective:** Restore the layout from original homepage (if not saved, findable in main branch of repo).


## 4. Acceptance Criteria

**Phase 1-3 (Foundation):**
- [ ] All tables have tournament_id foreign key
- [ ] tournament_roles table created and working
- [ ] Organizer whitelist table functional
- [ ] Slug generation works correctly
- [ ] All queries accept tournamentId parameter
- [ ] Route structure in place with [slug] dynamic routes

**Phase 4-6 (Pages):**
- [ ] Tournament browser page functional
- [ ] Tournament detail page shows correct data
- [ ] All tournament pages (standings, schedule, bracket) work
- [ ] Registration works for specific tournaments
- [ ] Navigation updates based on context
- [ ] Scorekeeper restricted to organizers

**Phase 7-8 (APIs & Migration):**
- [ ] All API routes handle tournament context
- [ ] Access control working correctly
- [ ] Tournament creation API functional
- [ ] Migration script runs successfully
- [ ] All existing data preserved and working

**Phase 9 (Polish):**
- [ ] Empty states implemented
- [ ] Loading states smooth
- [ ] Error messages helpful
- [ ] Status badges display correctly

**General:**
- [ ] No linting or TypeScript errors
- [ ] Build succeeds
- [ ] All shadcn/ui components used properly
- [ ] Responsive design maintained
- [ ] Performance acceptable (sub-second page loads)
- [ ] Maintain consistent styling
- [ ] Keep files smaller, preferring to break into components when it makes sense.
- [ ] Employ software development design patterns where necessary/it makes sense.(eg. creational, structural, behavioral)
- [ ] Ask any necessary questions if there are any
- [ ] Ensure that the flow is still easy for the user and accessible. Aiming for zero bounce rate. we don't want people to not sign up for the tournament because the flow is annoying or complicated. 

## 7. Future Enhancements (Out of Scope for Now)

**Post-Launch Features:**
- User profiles with tournament history
- Tournament search and filters
- Custom tournament branding/themes
- Tournament analytics and stats
- Email notifications for tournament updates
- Social media sharing
- Tournament chat/announcements
- Mobile app
- Tournament templates
- Recurring tournaments
- Multiple tournament formats (4v4, 6v6, etc.)
- Advanced scheduling algorithms
- Referee/volunteer management
- Custom tournament rules per event

## Ansering Questions:
1. I want it to be embedded in the hero like the original. There can also be a link for the registration. 
2. Right now Let's hard code it. I'm currently working on documentation for tournament options and information. 
3. I honestly spent a lot of time on those images, so lets reuse that photos forever. make it easier. no need to update those. I can make future images that the organizer can choose. That can be a future feature. "Theme"
4. The quick action links are nice. but maybe let's make a "sub footer" component where all those exist. Actually I like how you wrote it up in the implementation plan. 
5. Answered previously. 