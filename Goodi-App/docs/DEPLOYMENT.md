# Deployment Guide

## Prerequisites

- Node.js 18+
- Firebase CLI installed
- Firebase project configured

## Build Process

### 1. Development Build
```bash
cd Goodi-App
npm run dev
```
Starts Vite dev server at `http://localhost:5173`

### 2. Production Build
```bash
cd Goodi-App
npm run build
```
Generates optimized build in `Goodi-App/dist/`

**Build Output:**
- Minified JavaScript bundles
- Optimized CSS
- Asset optimization
- Code splitting

## Deployment Steps

### Option 1: Full Deployment
```bash
firebase deploy
```
Deploys everything (Hosting, Firestore Rules, Functions)

### Option 2: Selective Deployment

#### Hosting Only
```bash
firebase deploy --only hosting
```

#### Firestore Rules Only
```bash
firebase deploy --only firestore
```

#### Functions Only (if applicable)
```bash
firebase deploy --only functions
```

## Pre-Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Test locally with `npm run preview`
- [ ] Verify all environment variables
- [ ] Check Firestore Security Rules
- [ ] Review recent code changes
- [ ] Backup current production data

## Post-Deployment Verification

1. **Functional Tests:**
   - [ ] Login/Logout
   - [ ] Task creation and completion
   - [ ] Payment flow (if applicable)
   - [ ] API Key management (lifetime users)
   - [ ] Promo code validation

2. **Performance:**
   - [ ] Page load times < 3s
   - [ ] Bundle size within limits
   - [ ] No console errors

3. **Security:**
   - [ ] Firestore Rules working
   - [ ] No API keys in client code
   - [ ] HTTPS only

## Rollback Procedure

If deployment fails:

```bash
# Revert to previous version
firebase hosting:clone goodi-5ec49:PREVIOUS_VERSION goodi-5ec49:live
```

Or manually deploy a previous commit:
```bash
git checkout <previous-commit-hash>
npm run build
firebase deploy --only hosting
```

## Environment Variables

**Required:**
- `VITE_GEMINI_API_KEY` - Gemini API Key (for monthly users)

**Setup:**
```bash
# .env.production
VITE_GEMINI_API_KEY=your_api_key_here
```

## Deployment URL

**Production:** https://goodi-5ec49.web.app

## Monitoring

**After deployment, monitor:**
- Firebase Console → Performance
- Firebase Console → Crashlytics
- User feedback

## Automated Deployment (Future)

Consider setting up GitHub Actions:
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
```
