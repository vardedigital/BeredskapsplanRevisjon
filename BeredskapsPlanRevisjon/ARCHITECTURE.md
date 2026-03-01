# BeredskapsPlanRevisjon - Architecture Documentation

## System Overview

BeredskapsPlanRevisjon is a secure, AI-powered SaaS platform for reviewing Norwegian municipal emergency preparedness plans with 100% compliance against laws, regulations, and guidance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Language   │  │   Document   │  │  Revision Dashboard  │  │
│  │  Selector    │  │   Upload     │  │   (5 tabs)           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Upload     │  │   Analyze    │  │     Cleanup          │  │
│  │   Document   │  │   Documents  │  │     Session          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Supabase Edge Functions (Deno)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Upload     │  │   Analyze    │  │     Cleanup          │  │
│  │   Document   │  │   Documents  │  │     Session          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │   Compliance │  │   Pre-       │                           │
│  │     Sync     │  │   Revision   │                           │
│  │              │  │     Sync     │                           │
│  └──────────────┘  └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Services                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │   Storage    │  │      Auth            │  │
│  │   Database   │  │   (Temp)     │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │   pg_cron    │  │     RLS      │                           │
│  │   (Jobs)     │  │  (Security)  │                           │
│  └──────────────┘  └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Anthropic  │  │    Stripe    │  │   DSB / Gov / KS     │  │
│  │     Claude   │  │   Payments   │  │   (Compliance)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend (Next.js 14)

**Purpose**: User interface and client-side logic

**Key Components**:
- `LanguageSelector`: Bokmål/Nynorsk selection with Nynorsk style preferences
- `DocumentUpload`: Drag-and-drop file upload with progress tracking
- `RevisionDashboard`: Main dashboard with 5 tabs (Overview, Plan, Changes, Exercises, Supervision)
- API Routes: Proxy requests to Supabase Edge Functions

**State Management**:
- React hooks (useState, useEffect)
- Session-based state
- No global state management needed

**Styling**:
- Tailwind CSS
- Responsive design
- Accessible UI components

### 2. Supabase Edge Functions (Deno)

**Purpose**: Server-side logic and external API integration

**Functions**:

#### compliance-sync
- **Trigger**: Weekly via pg_cron or manual
- **Purpose**: Fetch latest compliance data from external sources
- **Process**:
  1. Fetch RSS/HTML from DSB, Regjeringen, KS, etc.
  2. Extract compliance rules
  3. Calculate content hash
  4. Update `compliance_sources` and `compliance_rules`
- **Output**: Updated compliance database

#### pre-revision-sync
- **Trigger**: Before each revision
- **Purpose**: Ensure compliance data is up-to-date
- **Process**:
  1. Check if sources are older than 7 days
  2. Trigger compliance-sync if needed
  3. Return version info and sources used
- **Output**: Compliance version metadata

#### analyze-documents
- **Trigger**: User clicks "Start revisjon"
- **Purpose**: Analyze ROS and plan against compliance rules
- **Process**:
  1. Fetch uploaded documents
  2. Fetch compliance rules
  3. Build Claude prompt with all context
  4. Call Anthropic Claude API
  5. Parse structured JSON response
  6. Store results in database
- **Output**: Compliance score, changes, updated plan, exercises, supervision data

#### upload-document
- **Trigger**: User uploads file
- **Purpose**: Handle file upload and text extraction
- **Process**:
  1. Receive file via FormData
  2. Upload to temporary storage bucket
  3. Extract text (PDF/DOC/TXT)
  4. Store metadata in `temp_documents`
  5. Set expiry time (10 minutes)
- **Output**: Document ID and metadata

#### cleanup-session
- **Trigger**: After user downloads results
- **Purpose**: Delete all temporary data
- **Process**:
  1. Delete files from storage
  2. Delete records from `temp_documents`
  3. Delete revision results
  4. Mark session as completed
- **Output**: Confirmation of cleanup

### 3. Supabase Database (PostgreSQL)

**Schema Design**:

#### Core Tables
- `tenants`: Multi-tenant configuration
- `users`: User management with roles
- `revision_sessions`: Revision workflow tracking

#### Compliance Tables
- `compliance_sources`: External compliance data sources
- `compliance_rules`: Destilled requirement texts

#### Temporary Tables (Ephemeral)
- `temp_documents`: Uploaded documents with TTL
- `revision_results`: Generated results
- `revision_changes`: Detailed change log
- `exercise_plans`: Generated exercise plans
- `supervision_checklists`: Supervision mode data

#### Audit Tables
- `audit_log`: All actions for compliance

**Security**:
- Row Level Security (RLS) on all tables
- Users can only access their own tenant's data
- Service role key for Edge Functions
- Anon key for frontend

**Automation**:
- pg_cron jobs for:
  - Daily cleanup of expired documents
  - Weekly compliance sync trigger
- Triggers for:
  - Updated timestamps
  - Audit logging

### 4. External Services

#### Anthropic Claude API
- **Purpose**: Document analysis and text generation
- **Model**: Claude 3.5 Sonnet (20241022)
- **Usage**:
  - Analyze ROS and plan documents
  - Compare against compliance rules
  - Generate updated plan
  - Create change log
  - Suggest exercises
  - Generate supervision checklist
- **Configuration**:
  - Max tokens: 8192
  - System prompt: Expert role definition
  - User prompt: Documents + rules + instructions
  - Output: Structured JSON

#### Stripe
- **Purpose**: Payment processing
- **Model**: One-time payment (1995 NOK)
- **Flow**:
  1. User clicks "Purchase"
  2. Redirect to Stripe Checkout
  3. Complete payment
  4. Webhook activates tenant
- **Webhooks**:
  - checkout.session.completed
  - customer.subscription.created

#### Compliance Sources
- **DSB**: RSS feed for updates
- **Regjeringen.no**: HTML scraping
- **KS**: RSS/API
- **Statsforvalter**: Published reports
- **Lovdata**: Legal texts

## Data Flow

### Revision Workflow

```
1. User selects language
   ↓
2. User uploads ROS + plan
   ↓
3. Files stored in temp bucket (10 min TTL)
   ↓
4. User clicks "Start revisjon"
   ↓
5. Pre-revision sync checks compliance data
   ↓
6. If needed, trigger compliance-sync
   ↓
7. analyze-documents function:
   - Fetch documents
   - Fetch compliance rules
   - Build Claude prompt
   - Call Claude API
   - Parse JSON response
   - Store results
   ↓
8. Dashboard displays results
   ↓
9. User downloads results
   ↓
10. cleanup-session deletes all data
```

### Compliance Sync Workflow

```
1. pg_cron triggers weekly (Sunday 03:30 UTC)
   ↓
2. compliance-sync function:
   - Fetch RSS/HTML from sources
   - Extract rules
   - Calculate hash
   - Update database
   ↓
3. compliance_rules table updated
   ↓
4. Next revision uses latest rules
```

## Security Architecture

### 1. Authentication & Authorization
- Supabase Auth for user management
- Role-based access control (RBAC)
- JWT tokens for API access
- RLS policies on all tables

### 2. Data Protection
- Ephemeral document handling
- Automatic cleanup (10 min TTL)
- No permanent storage of raw documents
- Encrypted connections (HTTPS)

### 3. API Security
- CORS restrictions
- Rate limiting (to be implemented)
- Input validation
- SQL injection prevention (parameterized queries)

### 4. Compliance
- GDPR: Data minimization, right to deletion
- AI Act: High-risk decision support, transparency
- Norwegian law: Data processing agreements

## Performance Optimization

### 1. Database
- Indexes on frequently queried columns
- Connection pooling
- Query optimization
- Materialized views (if needed)

### 2. Edge Functions
- Async operations
- Streaming responses (if needed)
- Caching compliance rules
- Timeout handling

### 3. Frontend
- Code splitting
- Lazy loading
- Image optimization
- CDN for static assets

### 4. Storage
- Temporary bucket with TTL
- Automatic cleanup
- Compression

## Scalability Considerations

### Current Design Supports
- 100+ municipalities (tenants)
- 1000+ revisions per month
- 10+ concurrent analyses

### Scaling Strategies
1. **Database**: Upgrade Supabase plan, add read replicas
2. **Edge Functions**: Increase timeout, add caching
3. **Storage**: Upgrade storage limits, implement CDN
4. **Frontend**: Add load balancing, optimize bundle size

### Bottlenecks
- Claude API rate limits
- Large document processing time
- Database query performance

## Monitoring & Observability

### 1. Logging
- Supabase logs for Edge Functions
- Vercel logs for API routes
- Audit log table for compliance

### 2. Metrics
- Revision success rate
- Compliance sync success rate
- Average processing time
- Storage usage

### 3. Alerts
- Failed compliance syncs
- High error rates
- Storage approaching limits
- Payment failures

## Disaster Recovery

### 1. Backups
- Daily database backups (Supabase)
- Point-in-time recovery
- Export compliance rules regularly

### 2. Failover
- Supabase multi-region deployment
- Edge function retries
- Graceful degradation

### 3. Recovery Procedures
- Restore from backup
- Re-run compliance sync
- Notify affected users

## Future Enhancements

### Planned Features
1. Real-time collaboration
2. Version history for plans
3. Advanced analytics dashboard
4. Integration with municipal systems
5. Mobile app (PWA)
6. Multi-language support (beyond Norwegian)

### Technical Improvements
1. WebSocket for real-time updates
2. Advanced caching strategy
3. Machine learning for pattern detection
4. Automated testing pipeline
5. CI/CD automation

## Compliance References

### Legal Framework
- Sivilbeskyttelsesloven §§14-15
- Forskrift om kommunal beredskapsplikt §§2-9
- GDPR (EU 2016/679)
- EU AI Act

### Guidance Sources
- DSB veiledere
- Regjeringsmeldinger
- KS best practice
- Tilsynsrapporter

### Standards
- ISO 27001 (Information Security)
- ISO 22301 (Business Continuity)
- NIST Cybersecurity Framework

## Conclusion

This architecture provides a secure, scalable, and compliant foundation for BeredskapsPlanRevisjon. The system is designed to handle sensitive municipal data while ensuring 100% compliance with Norwegian emergency preparedness regulations.

The ephemeral data handling approach ensures privacy, while the automated compliance sync keeps the system up-to-date with the latest legal requirements. The modular design allows for easy maintenance and future enhancements.