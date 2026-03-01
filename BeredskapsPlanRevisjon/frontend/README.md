# BeredskapsPlanRevisjon

En sikker, AI-drevet SaaS-plattform for revisjon av kommunale beredskapsplaner med 100% compliance mot norsk lov, forskrift, DSB-veiledere og tilsynskrav.

## Funksjoner

### 🛡️ 100% Compliance
- Automatisk synkronisering mot siste versjon av:
  - Sivilbeskyttelsesloven §§14-15
  - Forskrift om kommunal beredskapsplikt §§2-9
  - DSB-veiledere (beredskapsplikt, evakueringsplanverk, felles tilsyn, krisekommunikasjon, kontinuitet)
  - Regjeringsveiledninger (Totalberedskapsmeldingen)
  - KS best practice for systematisk beredskapsarbeid
  - Typiske tilsynsfunn fra Statsforvalter/Helsetilsynet

### 📄 Dokumentanalyse
- Opplasting av ROS og beredskapsplan (PDF, DOC, DOCX)
- AI-drevet analyse med Anthropic Claude
- Ephemeral behandling - ingen permanent lagring av dokumenter

### 📊 Revisjonsresultater
- Compliance-score (0-100%)
- MUST-endringer (påkrevd av lov/forskrift)
- SHOULD/COULD-endringer (beste praksis)
- Oppdatert plan med endringssporing
- Detaljert endringslogg

### 🎯 Øvingsplan
- Automatisk generering basert på ROS-risikoer
- Forslag til scenarioer, mål og frekvens
- Evaluering og erfaringsoppsummering

### 🔍 Tilsynsmodus
- Sjekkliste basert på tilsynskriterier
- AI-vurdering av dekningsgrad
- Tilsynsrapport-utkast
- Manuell avkryssing

### 🌐 Språkstøtte
- Bokmål og Nynorsk
- Tilpassbare Nynorsk-stilinnstillinger
- Konsistent språkbruk

### 🔒 Sikkerhet & Personvern
- Ephemeral dokumentbehandling
- Automatisk sletting etter revisjon
- GDPR-kompatibel
- EU AI Act-kompatibel
- Row Level Security (RLS)

## Tech Stack

### Backend
- **Supabase**: Postgres, Auth, Storage, RLS, pg_cron, Edge Functions
- **Anthropic Claude**: Dokumentanalyse og tekstgenerering
- **Stripe**: Betalingshåndtering

### Frontend
- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Ikoner
- **Recharts**: Visualiseringer

## Installasjon

### Forutsetninger
- Node.js 18+
- Supabase-konto
- Anthropic API-nøkkel
- Stripe-konto

### 1. Klon repository
```bash
git clone <repository-url>
cd beredskapsplan-revisjon
```

### 2. Installer avhengigheter
```bash
cd frontend
npm install
```

### 3. Konfigurer miljøvariabler
```bash
cp .env.local.example .env.local
```

Rediger `.env.local` med dine API-nøkler:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
```

### 4. Set opp Supabase database

Kjør SQL-skriptet:
```bash
# Via Supabase Dashboard > SQL Editor
# Eller via CLI:
psql -h <your-db-host> -U postgres -d postgres < supabase/schema.sql
```

### 5. Deploy Edge Functions

```bash
# Via Supabase CLI
supabase functions deploy compliance-sync
supabase functions deploy pre-revision-sync
supabase functions deploy analyze-documents
supabase functions deploy upload-document
supabase functions deploy cleanup-session
```

### 6. Set miljøvariabler i Supabase

Via Supabase Dashboard > Edge Functions > Settings:
```env
ANTHROPIC_API_KEY=your-anthropic-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 7. Start utviklingsserver
```bash
npm run dev
```

Åpne http://localhost:3000

## Database Schema

### Hovedtabeller
- `tenants`: Multi-tenant konfigurasjon
- `users`: Brukeradministrasjon med roller
- `compliance_sources`: Kilder til compliance-regler
- `compliance_rules`: Destillerte kravtekster
- `temp_documents`: Midlertidige dokumenter (ephemeral)
- `revision_sessions`: Revisjonssesjoner
- `revision_results`: Revisjonsresultater
- `revision_changes`: Endringslogg
- `exercise_plans`: Øvingsplaner
- `supervision_checklists`: Tilsynssjekklister
- `audit_log`: Audit logging

## Edge Functions

### compliance-sync
- Synkroniserer compliance-data fra eksterne kilder
- Kjøres ukentlig via pg_cron
- Oppdaterer `compliance_sources` og `compliance_rules`

### pre-revision-sync
- Sjekker om compliance-data trenger oppdatering
- Triggers sync hvis nødvendig
- Returnerer versjonsinfo

### analyze-documents
- Henter dokumenter og compliance-regler
- Bygger Claude-prompt
- Kaller Anthropic Claude API
- Lagrer resultater i database

### upload-document
- Håndterer filopplasting
- Ekstraherer tekst fra PDF/DOC
- Lagrer i midlertidig storage
- Setter TTL (10 minutter)

### cleanup-session
- Sletter midlertidige filer
- Rydder opp i database
- Bekrefter sletting

## Deployment

### Vercel (Frontend)
```bash
npm install -g vercel
vercel
```

### Supabase (Backend)
- Database og Edge Functions hostes på Supabase
- Automatisk skalering
- Built-in sikkerhet

## Sikkerhet

### Ephemeral Data Handling
- Dokumenter lagres midlertidig (10 minutter TTL)
- Automatisk sletting via pg_cron
- Ingen permanent lagring av rått dokumentinnhold

### GDPR Compliance
- Dataminimering
- Innebygd personvern
- RLS på alle tabeller
- Audit logging

### AI Act Compliance
- Høyrisiko beslutningsstøtte
- Tydelig ansvarsfraskrivelse
- Manuell juridisk kontroll ved usikkerhet
- Ingen bruk av data for modelltrening

## Lisens

Proprietær SaaS - © 2026 BeredskapsPlanRevisjon

## Support

For support og spørsmål:
- E-post: support@beredskapsplanrevisjon.no
- Dokumentasjon: docs.beredskapsplanrevisjon.no

## Ansvarsfraskrivelse

Dette verktøyet gir AI-støttede forslag. Kommunen og beredskapsledelsen har alltid det endelige ansvaret for innhold og lovsamsvar. Manuell juridisk kontroll anbefales før endelig godkjenning.