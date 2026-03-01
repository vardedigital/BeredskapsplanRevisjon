# BeredskapsPlanRevisjon - Quick Start Guide

Get BeredskapsPlanRevisjon up and running in 30 minutes.

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Anthropic API key
- Git

## Step 1: Supabase Setup (5 minutes)

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Name: `beredskapsplan-revisjon`
4. Database password: (save this!)
5. Region: Frankfurt (closest to Norway)
6. Click "Create new project" (wait 2-3 minutes)

### 1.2 Get API Keys
1. Go to Project Settings > API
2. Copy these values:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJ...`
   - **service_role key**: `eyJ...` (keep secret!)

### 1.3 Run Database Schema
1. Go to SQL Editor in Supabase Dashboard
2. Click "New query"
3. Copy entire content of `supabase/schema.sql`
4. Paste into editor
5. Click "Run" button
6. Wait for "Success" message

### 1.4 Create Storage Bucket
1. Go to Storage in left sidebar
2. Click "Create a new bucket"
3. Name: `temp-documents`
4. Public bucket: No
5. Click "Create bucket"

## Step 2: Deploy Edge Functions (10 minutes)

### 2.1 Install Supabase CLI
```bash
npm install -g supabase
```

### 2.2 Login
```bash
supabase login
```
Follow the instructions to authenticate.

### 2.3 Link Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```
Get YOUR_PROJECT_REF from your Supabase project URL (the part before `.supabase.co`)

### 2.4 Set Environment Variables
In Supabase Dashboard:
1. Go to Edge Functions > Settings
2. Add these environment variables:
   ```
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### 2.5 Deploy Functions
```bash
# From project root
cd supabase/functions

# Deploy each function
supabase functions deploy compliance-sync
supabase functions deploy pre-revision-sync
supabase functions deploy analyze-documents
supabase functions deploy upload-document
supabase functions deploy cleanup-session
```

### 2.6 Verify Deployment
1. Go to Edge Functions in Supabase Dashboard
2. You should see all 5 functions listed
3. Click on each to check logs (should be empty or show successful deployment)

## Step 3: Frontend Setup (10 minutes)

### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

### 3.2 Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.3 Start Development Server
```bash
npm run dev
```

### 3.4 Test Application
1. Open http://localhost:3000
2. You should see the language selection screen
3. Select "Bokmål" or "Nynorsk"
4. Try uploading a test document (PDF or DOC)

## Step 4: Test Full Workflow (5 minutes)

### 4.1 Prepare Test Documents
You'll need:
- A ROS document (PDF/DOC)
- A beredskapsplan (PDF/DOC)

### 4.2 Run Test Revision
1. Select language
2. Upload both documents
3. Add custom instructions (optional)
4. Click "Start revisjon"
5. Wait for analysis (1-2 minutes)
6. Review results in dashboard
7. Download results
8. Verify cleanup message appears

### 4.3 Verify Database
1. Go to Supabase Dashboard > Table Editor
2. Check `revision_sessions` - should show your session
3. Check `revision_changes` - should show detected changes
4. Check `exercise_plans` - should show suggested exercises
5. Check `temp_documents` - should be empty (cleaned up)

## Step 5: Test Compliance Sync (Optional)

### 5.1 Manual Trigger
1. Go to Edge Functions in Supabase Dashboard
2. Click on `compliance-sync`
3. Click "Invoke" button
4. Wait for completion
5. Check response - should show updated sources

### 5.2 Verify Compliance Rules
1. Go to Table Editor > `compliance_rules`
2. You should see multiple rules loaded
3. Check `compliance_sources` - should show source metadata

## Common Issues & Solutions

### Issue: Edge Function Deployment Fails
**Solution**: 
- Check you're logged in: `supabase login`
- Verify project ref is correct
- Check Supabase status page

### Issue: Document Upload Fails
**Solution**:
- Check storage bucket exists: `temp-documents`
- Verify bucket is not public
- Check file size (should be < 10MB)
- Check RLS policies in database

### Issue: Analysis Times Out
**Solution**:
- Increase timeout in Supabase Edge Function settings
- Check ANTHROPIC_API_KEY is valid
- Verify document text extraction worked

### Issue: Compliance Sync Returns No Data
**Solution**:
- Check ANTHROPIC_API_KEY in Edge Function settings
- Verify network connectivity
- Check Edge Function logs for errors

### Issue: Frontend Won't Start
**Solution**:
- Verify Node.js version: `node --version` (should be 18+)
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check `.env.local` exists and has correct values

## Next Steps

### For Development
1. Read `ARCHITECTURE.md` for system overview
2. Review `frontend/README.md` for detailed documentation
3. Customize UI components as needed
4. Add more test cases

### For Production
1. Follow `DEPLOYMENT.md` for production deployment
2. Set up Stripe for payments
3. Configure custom domain
4. Set up monitoring and alerts
5. Enable SSL certificates

### For Customization
1. Modify compliance rules in database
2. Add new compliance sources
3. Customize Claude prompts
4. Adjust UI styling
5. Add new features

## Useful Commands

### Supabase CLI
```bash
# Link to project
supabase link --project-ref YOUR_REF

# Deploy function
supabase functions deploy FUNCTION_NAME

# View logs
supabase functions logs FUNCTION_NAME

# Delete function
supabase functions delete FUNCTION_NAME
```

### Frontend
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Database
```bash
# Connect to database
psql -h db.xxx.supabase.co -U postgres -d postgres

# Run SQL file
psql -h db.xxx.supabase.co -U postgres -d postgres < schema.sql

# Backup database
pg_dump -h db.xxx.supabase.co -U postgres postgres > backup.sql
```

## Environment Variables Reference

### Frontend (.env.local)
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-key

# Optional (for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Supabase Edge Functions
```env
# Required
ANTHROPIC_API_KEY=your-anthropic-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing Checklist

- [ ] Supabase project created
- [ ] Database schema applied
- [ ] Storage bucket created
- [ ] Edge Functions deployed (5/5)
- [ ] Frontend starts without errors
- [ ] Can select language
- [ ] Can upload documents
- [ ] Revision analysis completes
- [ ] Results display correctly
- [ ] Can download results
- [ ] Data cleanup works
- [ ] Compliance sync runs successfully

## Support Resources

### Documentation
- `README.md` - Project overview
- `ARCHITECTURE.md` - System architecture
- `DEPLOYMENT.md` - Production deployment
- `frontend/README.md` - Frontend details

### External Links
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Stripe Documentation](https://stripe.com/docs)

### Getting Help
1. Check this guide first
2. Review error logs in Supabase and Vercel
3. Search existing issues
4. Contact support

## Cost Estimate (Development)

- Supabase (Free Tier): $0/month
- Vercel (Hobby): $0/month
- Anthropic Claude: ~$10-30/month (depending on usage)
- **Total**: ~$10-30/month

## Cost Estimate (Production)

- Supabase (Pro): $25/month
- Vercel (Pro): $20/month
- Anthropic Claude: ~$50-100/month
- Domain: ~$15/year
- **Total**: ~$95-145/month + Stripe fees (2.9% + 2 NOK)

## Security Reminders

⚠️ **Important Security Notes**:

1. Never commit `.env.local` to git
2. Never share `service_role_key` publicly
3. Use environment variables for all secrets
4. Enable RLS on all database tables
5. Use HTTPS in production
6. Keep dependencies updated
7. Monitor for security vulnerabilities

## What's Next?

Congratulations! You now have BeredskapsPlanRevisjon running locally. Here's what you can do:

1. **Customize**: Modify the UI, add features, adjust compliance rules
2. **Test**: Run more test revisions with different documents
3. **Deploy**: Follow DEPLOYMENT.md to go to production
4. **Scale**: Add more municipalities, optimize performance
5. **Monitor**: Set up logging, alerts, and analytics

Happy coding! 🚀