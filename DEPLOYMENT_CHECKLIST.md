# BeredskapsPlanRevisjon - Complete Deployment Checklist

## 🎯 This checklist will guide you through EVERYTHING needed to deploy the app

### Prerequisites - What You Need Before Starting

- [ ] **Node.js 18+** installed on your computer
  - Check: `node --version` (should be 18.x or higher)
  - Download: https://nodejs.org/

- [ ] **Git** installed
  - Check: `git --version`
  - Download: https://git-scm.com/

- [ ] **Supabase account** (free tier works)
  - Sign up: https://supabase.com/signup
  - Verify email

- [ ] **Anthropic API key**
  - Sign up: https://console.anthropic.com/
  - Get API key from: https://console.anthropic.com/settings/keys
  - Save this key securely!

- [ ] **GitHub account** (for Vercel deployment)
  - Sign up: https://github.com/signup

---

## STEP 1: Supabase Setup (15 minutes)

### 1.1 Create Supabase Project
- [ ] Go to https://supabase.com
- [ ] Click "New Project"
- [ ] Fill in:
  - **Name**: `beredskapsplan-revisjon`
  - **Database Password**: (create strong password, SAVE IT!)
  - **Region**: Frankfurt (closest to Norway)
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for project to be ready

### 1.2 Get API Keys
- [ ] Go to Project Settings (gear icon) > API
- [ ] Copy and save these values:
  ```
  Project URL: https://xxxxxxxx.supabase.co
  anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- [ ] Keep these safe - you'll need them!

### 1.3 Run Database Schema
- [ ] Go to SQL Editor in left sidebar
- [ ] Click "New query"
- [ ] Open file: `supabase/schema.sql`
- [ ] Copy ALL content from schema.sql
- [ ] Paste into SQL Editor
- [ ] Click "Run" button
- [ ] Wait for "Success" message
- [ ] Verify tables created: Go to Table Editor, you should see:
  - tenants
  - users
  - compliance_sources
  - compliance_rules
  - temp_documents
  - revision_sessions
  - revision_results
  - revision_changes
  - exercise_plans
  - supervision_checklists
  - audit_log

### 1.4 Create Storage Bucket
- [ ] Go to Storage in left sidebar
- [ ] Click "Create a new bucket"
- [ ] Fill in:
  - **Name**: `temp-documents`
  - **Public bucket**: No (uncheck)
- [ ] Click "Create bucket"

### 1.5 Configure Edge Functions Environment Variables
- [ ] Go to Edge Functions in left sidebar
- [ ] Click "Settings" (gear icon)
- [ ] Add these environment variables:
  ```
  ANTHROPIC_API_KEY=your-actual-anthropic-api-key-here
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
  ```
- [ ] Click "Save"

---

## STEP 2: Deploy Edge Functions (10 minutes)

### 2.1 Install Supabase CLI
- [ ] Open terminal/command prompt
- [ ] Run: `npm install -g supabase`
- [ ] Verify: `supabase --version`

### 2.2 Login to Supabase
- [ ] Run: `supabase login`
- [ ] Follow instructions to authenticate
- [ ] You should see "Successfully logged in"

### 2.3 Link to Your Project
- [ ] Get your project ref from Supabase URL
  - Example: If URL is `https://abc123.supabase.co`, ref is `abc123`
- [ ] Run: `supabase link --project-ref YOUR_PROJECT_REF`
- [ ] Confirm when prompted

### 2.4 Deploy All Edge Functions
- [ ] Navigate to project root: `cd beredskapsplan-revisjon`
- [ ] Deploy each function:
  ```bash
  supabase functions deploy compliance-sync
  supabase functions deploy pre-revision-sync
  supabase functions deploy analyze-documents
  supabase functions deploy upload-document
  supabase functions deploy cleanup-session
  ```
- [ ] Wait for each to complete (should say "Deployed successfully")

### 2.5 Verify Deployment
- [ ] Go to Edge Functions in Supabase Dashboard
- [ ] You should see all 5 functions listed:
  - compliance-sync
  - pre-revision-sync
  - analyze-documents
  - upload-document
  - cleanup-session
- [ ] Click on each function to verify no errors

---

## STEP 3: Frontend Setup (10 minutes)

### 3.1 Navigate to Frontend Directory
- [ ] Run: `cd frontend`

### 3.2 Install Dependencies
- [ ] Run: `npm install`
- [ ] Wait for installation to complete

### 3.3 Create Environment File
- [ ] Run: `cp .env.local.example .env.local`
- [ ] Open `.env.local` in text editor
- [ ] Replace with your actual values:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ANTHROPIC_API_KEY=your-anthropic-api-key-here
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```
- [ ] Save the file

### 3.4 Test Local Development
- [ ] Run: `npm run dev`
- [ ] Wait for "Ready" message
- [ ] Open browser: http://localhost:3000
- [ ] You should see the language selection screen!
- [ ] Test: Select "Bokmål" or "Nynorsk"
- [ ] Verify: You can proceed to upload screen

### 3.5 Stop Development Server
- [ ] Press `Ctrl+C` in terminal

---

## STEP 4: Deploy to Vercel (10 minutes)

### 4.1 Prepare Git Repository
- [ ] Initialize git (if not already):
  ```bash
  cd frontend
  git init
  git add .
  git commit -m "Initial commit"
  ```
- [ ] Create repository on GitHub:
  - Go to https://github.com/new
  - Name: `beredskapsplan-revisjon`
  - Click "Create repository"
- [ ] Push to GitHub:
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/beredskapsplan-revisjon.git
  git branch -M main
  git push -u origin main
  ```

### 4.2 Deploy to Vercel
- [ ] Go to https://vercel.com
- [ ] Sign up/login with GitHub
- [ ] Click "Add New Project"
- [ ] Select `beredskapsplan-revisjon` repository
- [ ] Configure:
  - **Framework Preset**: Next.js
  - **Root Directory**: `frontend`
  - **Build Command**: `npm run build`
  - **Output Directory**: `.next`
- [ ] Click "Continue"

### 4.3 Add Environment Variables in Vercel
- [ ] In Vercel project settings, go to "Environment Variables"
- [ ] Add these variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ANTHROPIC_API_KEY=your-anthropic-api-key-here
  NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
  ```
- [ ] Click "Save"
- [ ] Click "Redeploy" (if needed)

### 4.4 Wait for Deployment
- [ ] Wait for deployment to complete
- [ ] You'll see a green checkmark when done
- [ ] Click the deployed URL to visit your app!

---

## STEP 5: Test Production Deployment (5 minutes)

### 5.1 Test Full Workflow
- [ ] Open your deployed Vercel URL
- [ ] Test language selection
- [ ] Test document upload (use a test PDF)
- [ ] Test "Start revisjon" button
- [ ] Wait for analysis to complete
- [ ] Review dashboard results
- [ ] Test download buttons
- [ ] Verify cleanup message appears

### 5.2 Check Supabase Logs
- [ ] Go to Supabase Dashboard > Edge Functions
- [ ] Check logs for any errors
- [ ] Verify `analyze-documents` function ran successfully

### 5.3 Verify Database
- [ ] Go to Table Editor in Supabase
- [ ] Check `revision_sessions` - should show your test session
- [ ] Check `revision_changes` - should show detected changes
- [ ] Check `temp_documents` - should be empty (cleaned up)

---

## STEP 6: Optional - Stripe Setup (for payments)

### 6.1 Create Stripe Account
- [ ] Go to https://stripe.com
- [ ] Sign up/login
- [ ] Go to Developers > API keys

### 6.2 Get Stripe Keys
- [ ] Copy:
  - Publishable key (pk_test_... or pk_live_...)
  - Secret key (sk_test_... or sk_live_...)

### 6.3 Add to Vercel Environment Variables
- [ ] Add to Vercel:
  ```
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_SECRET_KEY=sk_test_...
  ```

### 6.4 Create Webhook (for production)
- [ ] In Stripe Dashboard > Developers > Webhooks
- [ ] Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
- [ ] Select events: `checkout.session.completed`
- [ ] Copy webhook secret
- [ ] Add to Vercel: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## STEP 7: Security & Monitoring (5 minutes)

### 7.1 Verify Security
- [ ] Check RLS is enabled on all tables in Supabase
- [ ] Verify storage bucket is not public
- [ ] Check environment variables are set correctly
- [ ] Ensure HTTPS is enabled (automatic on Vercel)

### 7.2 Set Up Monitoring
- [ ] Enable email alerts in Supabase Dashboard
- [ ] Set up deployment notifications in Vercel
- [ ] Monitor Edge Function logs regularly

### 7.3 Test Compliance Sync
- [ ] Go to Edge Functions in Supabase
- [ ] Click on `compliance-sync`
- [ ] Click "Invoke" button
- [ ] Wait for completion
- [ ] Check response shows updated sources

---

## ✅ Final Verification Checklist

Before considering deployment complete:

- [ ] Supabase project created and running
- [ ] Database schema applied successfully
- [ ] All 10+ tables visible in Table Editor
- [ ] Storage bucket `temp-documents` created
- [ ] All 5 Edge Functions deployed
- [ ] Edge Functions have correct environment variables
- [ ] Frontend deployed to Vercel
- [ ] Vercel has correct environment variables
- [ ] App loads without errors in browser
- [ ] Can select language
- [ ] Can upload documents
- [ ] Revision analysis completes successfully
- [ ] Results display correctly
- [ ] Can download results
- [ ] Data cleanup works
- [ ] No errors in Supabase logs
- [ ] No errors in Vercel logs

---

## 🎉 Deployment Complete!

Your BeredskapsPlanRevisjon app is now live and ready to use!

### What You Have Now:
- ✅ Fully functional SaaS platform
- ✅ AI-powered document analysis
- ✅ 100% legal compliance checking
- ✅ Multi-tenant architecture
- ✅ Secure ephemeral data handling
- ✅ Bokmål and Nynorsk support
- ✅ Production-ready deployment

### Next Steps:
1. **Customize branding** - Add your logo, colors
2. **Set up Stripe** - Enable payments (if needed)
3. **Add custom domain** - Use your own domain name
4. **Monitor performance** - Check logs and metrics
5. **Gather feedback** - Test with real users

### Important URLs to Save:
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your App URL**: https://your-domain.vercel.app

### Support Resources:
- **Documentation**: Check README.md files
- **Logs**: Supabase Edge Functions logs, Vercel logs
- **Troubleshooting**: See QUICK_START.md common issues section

---

## 📞 Need Help?

If you encounter any issues:

1. **Check logs** - Supabase Edge Functions logs and Vercel logs
2. **Review documentation** - QUICK_START.md, DEPLOYMENT.md
3. **Verify environment variables** - All keys must be correct
4. **Check network** - Ensure all services are accessible

### Common Issues:
- **Edge Function timeout**: Increase timeout in Supabase settings
- **Upload fails**: Check storage bucket permissions and RLS policies
- **Analysis fails**: Verify ANTHROPIC_API_KEY is correct
- **App won't load**: Check Vercel environment variables

---

## 🎯 Success Metrics

Your deployment is successful when:
- ✅ App loads without errors
- ✅ Can complete full revision workflow
- ✅ Results are accurate and useful
- ✅ Data cleanup works properly
- ✅ No security vulnerabilities
- ✅ Performance is acceptable (< 3 seconds)

Congratulations! You now have a fully deployed BeredskapsPlanRevisjon platform! 🚀