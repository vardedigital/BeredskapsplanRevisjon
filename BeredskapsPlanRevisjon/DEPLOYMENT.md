# BeredskapsPlanRevisjon - Deployment Guide

## Complete Deployment Instructions

This guide covers the complete deployment of BeredskapsPlanRevisjon to production.

## Prerequisites

- Supabase account (free tier or paid)
- Anthropic Claude API key
- Stripe account
- Vercel account (or Netlify)
- Node.js 18+ installed locally
- Git

## Step 1: Supabase Setup

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Set project name: `beredskapsplan-revisjon`
5. Set database password (save it securely)
6. Choose region (e.g., Frankfurt for Norway)
7. Click "Create new project"

### 1.2 Create Storage Buckets
1. Go to Storage > Create a new bucket
2. Name: `temp-documents`
3. Make it Public: No
4. Enable File uploads: Yes
5. Click "Create bucket"

### 1.3 Run Database Schema
1. Go to SQL Editor in Supabase Dashboard
2. Create new query
3. Copy contents of `supabase/schema.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify all tables are created

### 1.4 Configure Environment Variables in Supabase
1. Go to Edge Functions > Settings
2. Add these environment variables:
   ```
   ANTHROPIC_API_KEY=your-anthropic-api-key
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 1.5 Get API Keys
1. Go to Project Settings > API
2. Copy:
   - Project URL
   - anon public key
   - service_role key (keep secret!)

## Step 2: Deploy Edge Functions

### 2.1 Install Supabase CLI
```bash
npm install -g supabase
```

### 2.2 Login to Supabase
```bash
supabase login
```

### 2.3 Link to Project
```bash
supabase link --project-ref your-project-ref
```

### 2.4 Deploy Functions
```bash
cd supabase/functions

# Deploy each function
supabase functions deploy compliance-sync
supabase functions deploy pre-revision-sync
supabase functions deploy analyze-documents
supabase functions deploy upload-document
supabase functions deploy cleanup-session
```

### 2.5 Verify Functions
1. Go to Edge Functions in Supabase Dashboard
2. Verify all 5 functions are deployed
3. Check logs for any errors

## Step 3: Stripe Setup

### 3.1 Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up or login
3. Go to Developers > API keys

### 3.2 Get API Keys
1. Copy:
   - Publishable key (pk_live_...)
   - Secret key (sk_live_...)
   - Webhook signing secret (set up later)

### 3.3 Create Product
1. Go to Products > Add product
2. Name: "BeredskapsPlanRevisjon - Engangsbetaling"
3. Description: "Full tilgang til BeredskapsPlanRevisjon for én kommune"
4. Price: 1995 NOK (one-time)
5. Click "Save product"

## Step 4: Frontend Deployment (Vercel)

### 4.1 Prepare Repository
```bash
# Initialize git if not already done
cd frontend
git init
git add .
git commit -m "Initial commit"
```

### 4.2 Push to GitHub
```bash
# Create repository on GitHub first
git remote add origin https://github.com/yourusername/beredskapsplan-revisjon.git
git branch -M main
git push -u origin main
```

### 4.3 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from GitHub
4. Select `beredskapsplan-revisjon` repository
5. Configure:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 4.4 Add Environment Variables in Vercel
1. In Vercel project settings > Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ANTHROPIC_API_KEY=your-anthropic-api-key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

### 4.5 Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Visit your deployed URL

## Step 5: Configure Stripe Webhooks

### 5.1 Create Webhook Endpoint
1. In Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Events to send:
   - checkout.session.completed
   - customer.subscription.created
5. Click "Add endpoint"

### 5.2 Get Webhook Secret
1. Copy the webhook signing secret
2. Add to Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 5.3 Create Webhook Handler
Create `frontend/app/api/stripe/webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      // Handle successful payment
      // Create tenant, activate subscription, etc.
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    )
  }
}
```

## Step 6: Post-Deployment Configuration

### 6.1 Test Compliance Sync
1. Go to Supabase Edge Functions
2. Test `compliance-sync` function
3. Verify `compliance_sources` and `compliance_rules` are populated

### 6.2 Test Document Upload
1. Visit your deployed site
2. Test uploading a PDF document
3. Verify it appears in `temp_documents` table
4. Verify file is in `temp-documents` storage bucket

### 6.3 Test Full Workflow
1. Complete full revision workflow
2. Verify all results are stored correctly
3. Test document download
4. Verify cleanup works

### 6.4 Monitor Logs
1. Check Supabase logs for Edge Functions
2. Check Vercel logs for API routes
3. Set up error tracking (e.g., Sentry)

## Step 7: Security Hardening

### 7.1 Enable RLS
Verify all tables have RLS policies enabled:
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 7.2 Configure CORS
Update Edge Functions to restrict CORS in production:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### 7.3 Set Up Rate Limiting
Implement rate limiting on API routes to prevent abuse.

### 7.4 Enable Audit Logging
Verify audit_log table is populated with all actions.

## Step 8: Monitoring & Maintenance

### 8.1 Set Up Alerts
- Supabase: Enable email alerts for errors
- Vercel: Set up deployment notifications
- Stripe: Enable payment failure alerts

### 8.2 Monitor Storage Usage
- Check `temp-documents` bucket size
- Verify pg_cron cleanup is working
- Monitor database size

### 8.3 Regular Backups
- Enable daily database backups in Supabase
- Test restore procedure

### 8.4 Update Compliance Data
- Compliance sync runs weekly automatically
- Monitor for failed syncs
- Manually trigger if needed

## Step 9: Custom Domain (Optional)

### 9.1 Purchase Domain
- Buy domain from registrar (e.g., beredskapsplanrevisjon.no)

### 9.2 Configure DNS
1. In Vercel project settings > Domains
2. Add custom domain
3. Update DNS records as instructed

### 9.3 SSL Certificate
- Vercel automatically provisions SSL
- Verify certificate is valid

## Step 10: Launch Checklist

- [ ] All Edge Functions deployed and tested
- [ ] Database schema applied
- [ ] Storage buckets created
- [ ] Environment variables configured
- [ ] Stripe integration tested
- [ ] Full workflow tested end-to-end
- [ ] Security measures enabled
- [ ] Monitoring set up
- [ ] Backups enabled
- [ ] Custom domain configured (optional)
- [ ] Documentation updated
- [ ] Support contact configured

## Troubleshooting

### Common Issues

**Edge Function Timeout**
- Increase timeout in Supabase settings
- Optimize Claude prompt size

**Document Upload Fails**
- Check file size limits
- Verify storage bucket permissions
- Check RLS policies

**Compliance Sync Fails**
- Check ANTHROPIC_API_KEY is set
- Verify network connectivity
- Check Supabase logs

**Stripe Webhook Not Received**
- Verify webhook URL is correct
- Check webhook secret matches
- Ensure endpoint is accessible

## Support

For deployment issues:
- Check Supabase logs
- Check Vercel logs
- Review this guide
- Contact support

## Cost Estimates

### Supabase (Free Tier)
- 500 MB database
- 1 GB storage
- 2GB bandwidth/month
- 500k Edge Function invocations/month

### Vercel (Hobby)
- Free for personal projects
- 100GB bandwidth/month
- Unlimited deployments

### Anthropic Claude
- Pay per token usage
- Estimated: $10-50/month depending on usage

### Stripe
- 2.9% + 2 NOK per transaction
- No monthly fees

### Total Monthly Cost: ~$20-70

## Scaling Considerations

When scaling to more municipalities:
- Upgrade Supabase plan for more storage/bandwidth
- Optimize Edge Functions for performance
- Implement caching for compliance rules
- Consider CDN for static assets
- Set up load balancing if needed