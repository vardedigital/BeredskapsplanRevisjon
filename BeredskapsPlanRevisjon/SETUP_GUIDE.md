# 🚀 BeredskapsPlanRevisjon - Komplett Oppsettsguide

Denne guiden tar deg gjennom HELE prosessen for å sette opp og deploye appen. Følg stegene nøyaktig, og du vil ha en fungerende app på under 1 time!

---

## 📋 FORHÅNDSKRAV - Sjekkliste

Før du starter, må du ha:

- [ ] **Node.js 18+** installert
  - Sjekk: Åpne terminal og skriv `node --version`
  - Hvis ikke installert: Last ned fra https://nodejs.org/

- [ ] **Git** installert
  - Sjekk: Skriv `git --version`
  - Hvis ikke installert: Last ned fra https://git-scm.com/

- [ ] **Supabase-konto** (gratis)
  - Registrer deg: https://supabase.com/signup
  - Bekreft e-post

- [ ] **Anthropic API-nøkkel**
  - Registrer deg: https://console.anthropic.com/
  - Få API-nøkkel: https://console.anthropic.com/settings/keys
  - ⚠️ LAGRE DENNE NØKLEN SIKKERT!

- [ ] **GitHub-konto** (for Vercel)
  - Registrer deg: https://github.com/signup

---

## STEG 1: Supabase Oppsett (15 minutter)

### 1.1 Lag Supabase-prosjekt

1. Gå til https://supabase.com
2. Logg inn
3. Klikk "New Project"
4. Fyll inn:
   - **Name**: `beredskapsplan-revisjon`
   - **Database Password**: Lag et sterkt passord (LAGRE DET!)
   - **Region**: Frankfurt (nærmest Norge)
5. Klikk "Create new project"
6. Vent 2-3 minutter til prosjektet er klart

### 1.2 Hent API-nøkler

1. Gå til Project Settings (tannhjul-ikonet) > API
2. Kopier og lagre disse verdiene:
   ```
   Project URL: https://xxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. ⚠️ Oppbevar disse trygt - du trenger dem senere!

### 1.3 Kjør database schema

1. Gå til SQL Editor i venstre meny
2. Klikk "New query"
3. Åpne filen `supabase/schema.sql` i prosjektet
4. Kopier ALT innholdet fra schema.sql
5. Lim inn i SQL Editor
6. Klikk "Run"-knappen
7. Vent på "Success"-melding
8. Verifiser at tabeller er opprettet:
   - Gå til Table Editor
   - Du skal se disse tabellene:
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

### 1.4 Lag storage bucket

1. Gå til Storage i venstre meny
2. Klikk "Create a new bucket"
3. Fyll inn:
   - **Name**: `temp-documents`
   - **Public bucket**: Nei (fjern haken)
4. Klikk "Create bucket"

### 1.5 Konfigurer Edge Functions miljøvariabler

1. Gå til Edge Functions i venstre meny
2. Klikk "Settings" (tannhjul-ikonet)
3. Legg til disse miljøvariablene:
   ```
   ANTHROPIC_API_KEY=din-egentlige-anthropic-api-nøkkel
   SUPABASE_URL=https://ditt-projekt.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=din-service-role-key
   ```
4. Klikk "Save"

---

## STEG 2: Deploy Edge Functions (10 minutter)

### 2.1 Installer Supabase CLI

1. Åpne terminal/kommandolinje
2. Kjør: `npm install -g supabase`
3. Verifiser: `supabase --version`

### 2.2 Logg inn på Supabase

1. Kjør: `supabase login`
2. Følg instruksjonene for å autentisere
3. Du skal se "Successfully logged in"

### 2.3 Koble til prosjektet

1. Hent project ref fra Supabase URL
   - Eksempel: Hvis URL er `https://abc123.supabase.co`, er ref `abc123`
2. Kjør: `supabase link --project-ref DIN_PROJECT_REF`
3. Bekreft når du blir spurt

### 2.4 Deploy alle Edge Functions

1. Naviger til prosjektroten: `cd beredskapsplan-revisjon`
2. Deploy hver funksjon:
   ```bash
   supabase functions deploy compliance-sync
   supabase functions deploy pre-revision-sync
   supabase functions deploy analyze-documents
   supabase functions deploy upload-document
   supabase functions deploy cleanup-session
   ```
3. Vent til hver er ferdig (skal si "Deployed successfully")

### 2.5 Verifiser deploy

1. Gå til Edge Functions i Supabase Dashboard
2. Du skal se alle 5 funksjoner listet:
   - compliance-sync
   - pre-revision-sync
   - analyze-documents
   - upload-document
   - cleanup-session
3. Klikk på hver funksjon for å sjekke at det ikke er feil

---

## STEG 3: Frontend Oppsett (10 minutter)

### 3.1 Naviger til frontend-katalogen

1. Kjør: `cd frontend`

### 3.2 Installer avhengigheter

1. Kjør: `npm install`
2. Vent til installasjonen er ferdig

### 3.3 Lag miljøfil

1. Kjør: `cp .env.local.example .env.local`
2. Åpne `.env.local` i en teksteditor
3. Erstatt med dine faktiske verdier:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ditt-projekt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
   ANTHROPIC_API_KEY=din-anthropic-api-nøkkel
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Lagre filen

### 3.4 Test lokal utvikling

1. Kjør: `npm run dev`
2. Vent på "Ready"-melding
3. Åpne nettleser: http://localhost:3000
4. Du skal nå se språkvalg-skjermen!
5. Test: Velg "Bokmål" eller "Nynorsk"
6. Verifiser: Du kan gå videre til opplastingsskjermen

### 3.5 Stopp utviklingsserver

1. Trykk `Ctrl+C` i terminalen

---

## STEG 4: Deploy til Vercel (10 minutter)

### 4.1 Forbered Git-repository

1. Initialiser git (hvis ikke allerede):
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Lag repository på GitHub:
   - Gå til https://github.com/new
   - Name: `beredskapsplan-revisjon`
   - Klikk "Create repository"
3. Push til GitHub:
   ```bash
   git remote add origin https://github.com/DITT_BRUKERNAVN/beredskapsplan-revisjon.git
   git branch -M main
   git push -u origin main
   ```

### 4.2 Deploy til Vercel

1. Gå til https://vercel.com
2. Logg inn/registrer deg med GitHub
3. Klikk "Add New Project"
4. Velg `beredskapsplan-revisjon` repository
5. Konfigurer:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Klikk "Continue"

### 4.3 Legg til miljøvariabler i Vercel

1. I Vercel prosjektinnstillinger, gå til "Environment Variables"
2. Legg til disse variablene:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ditt-projekt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
   ANTHROPIC_API_KEY=din-anthropic-api-nøkkel
   NEXT_PUBLIC_APP_URL=https://ditt-domene.vercel.app
   ```
3. Klikk "Save"
4. Klikk "Redeploy" (hvis nødvendig)

### 4.4 Vent på deploy

1. Vent til deploy er ferdig
2. Du skal se et grønt hake når det er ferdig
3. Klikk på deploy-URLen for å besøke appen din!

---

## STEG 5: Test Produksjonsdeploy (5 minutter)

### 5.1 Test full arbeidsflyt

1. Åpne din deployede Vercel URL
2. Test språkvalg
3. Test dokumentopplasting (bruk en test-PDF)
4. Test "Start revisjon"-knappen
5. Vent på at analysen er ferdig
6. Se gjennom dashboard-resultater
7. Test nedlastingsknapper
8. Verifiser at oppryddingsmelding vises

### 5.2 Sjekk Supabase logger

1. Gå til Supabase Dashboard > Edge Functions
2. Sjekk logger for feil
3. Verifiser at `analyze-documents` funksjonen kjørte vellykket

### 5.3 Verifiser database

1. Gå til Table Editor i Supabase
2. Sjekk `revision_sessions` - skal vise din test-sesjon
3. Sjekk `revision_changes` - skal vise oppdagede endringer
4. Sjekk `temp_documents` - skal være tom (ryddet opp)

---

## STEG 6: Valgfritt - Stripe Oppsett (for betaling)

### 6.1 Lag Stripe-konto

1. Gå til https://stripe.com
2. Logg inn/registrer deg
3. Gå til Developers > API keys

### 6.2 Hent Stripe-nøkler

1. Kopier:
   - Publishable key (pk_test_... eller pk_live_...)
   - Secret key (sk_test_... eller sk_live_...)

### 6.3 Legg til i Vercel miljøvariabler

1. Legg til i Vercel:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

### 6.4 Lag webhook (for produksjon)

1. I Stripe Dashboard > Developers > Webhooks
2. Legg til endpoint: `https://ditt-domene.vercel.app/api/stripe/webhook`
3. Velg events: `checkout.session.completed`
4. Kopier webhook secret
5. Legg til i Vercel: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## STEG 7: Sikkerhet & Overvåkning (5 minutter)

### 7.1 Verifiser sikkerhet

- [ ] Sjekk at RLS er aktivert på alle tabeller i Supabase
- [ ] Verifiser at storage bucket ikke er offentlig
- [ ] Sjekk at miljøvariabler er satt korrekt
- [ ] Sørg for at HTTPS er aktivert (automatisk på Vercel)

### 7.2 Sett opp overvåkning

- [ ] Aktiver e-postvarsler i Supabase Dashboard
- [ ] Sett opp deploy-varsler i Vercel
- [ ] Overvåk Edge Function logger regelmessig

### 7.3 Test compliance sync

1. Gå til Edge Functions i Supabase
2. Klikk på `compliance-sync`
3. Klikk "Invoke"-knappen
4. Vent på ferdigstillelse
5. Sjekk respons viser oppdaterte kilder

---

## ✅ Endelig Verifiseringssjekkliste

Før du anser deploy som ferdig:

- [ ] Supabase-prosjekt opprettet og kjører
- [ ] Database schema kjørt vellykket
- [ ] Alle 10+ tabeller synlige i Table Editor
- [ ] Storage bucket `temp-documents` opprettet
- [ ] Alle 5 Edge Functions deployet
- [ ] Edge Functions har korrekte miljøvariabler
- [ ] Frontend deployet til Vercel
- [ ] Vercel har korrekte miljøvariabler
- [ ] App laster uten feil i nettleser
- [ ] Kan velge språk
- [ ] Kan laste opp dokumenter
- [ ] Revisjonsanalyse fullføres vellykket
- [ ] Resultater vises korrekt
- [ ] Kan laste ned resultater
- [ ] Data opprydding fungerer
- [ ] Ingen feil i Supabase logger
- [ ] Ingen feil i Vercel logger

---

## 🎉 Deploy Fullført!

Din BeredskapsPlanRevisjon-app er nå live og klar til bruk!

### Hva du har nå:
- ✅ Fullt fungerende SaaS-plattform
- ✅ AI-drevet dokumentanalyse
- ✅ 100% juridisk compliance-sjekk
- ✅ Multi-tenant arkitektur
- ✅ Sikker ephemeral datahåndtering
- ✅ Bokmål og Nynorsk støtte
- ✅ Produksjonsklar deploy

### Neste steg:
1. **Tilpass branding** - Legg til logo, farger
2. **Sett opp Stripe** - Aktiver betaling (hvis nødvendig)
3. **Legg til custom domene** - Bruk ditt eget domenenavn
4. **Overvåk ytelse** - Sjekk logger og metrikker
5. **Samle tilbakemeldinger** - Test med ekte brukere

### Viktige URLer å lagre:
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Din App URL**: https://ditt-domene.vercel.app

### Støtteressurser:
- **Dokumentasjon**: Sjekk README.md filer
- **Logger**: Supabase Edge Functions logger, Vercel logger
- **Feilsøking**: Se QUICK_START.md vanlige problemer-seksjon

---

## 📞 Trenger du hjelp?

Hvis du opplever problemer:

1. **Sjekk logger** - Supabase Edge Functions logger og Vercel logger
2. **Gjennomgå dokumentasjon** - QUICK_START.md, DEPLOYMENT.md
3. **Verifiser miljøvariabler** - Alle nøkler må være korrekte
4. **Sjekk nettverk** - Sørg for at alle tjenester er tilgjengelige

### Vanlige problemer:
- **Edge Function timeout**: Øk timeout i Supabase innstillinger
- **Opplasting feiler**: Sjekk storage bucket tillatelser og RLS policies
- **Analyse feiler**: Verifiser ANTHROPIC_API_KEY er korrekt
- **App vil ikke laste**: Sjekk Vercel miljøvariabler

---

## 🎯 Suksesskriterier

Din deploy er vellykket når:
- ✅ App laster uten feil
- ✅ Kan fullføre full revisjonsarbeidsflyt
- ✅ Resultater er nøyaktige og nyttige
- ✅ Data opprydding fungerer korrekt
- ✅ Ingen sikkerhetssårbarheter
- ✅ Ytelse er akseptabel (< 3 sekunder)

Gratulerer! Du har nå en fullt deployert BeredskapsPlanRevisjon-plattform! 🚀

---

## 🤖 Automatisk Deploy (Alternativ)

Hvis du vil automatisere prosessen, kan du bruke skriptet `AUTOMATED_DEPLOYMENT.sh`:

```bash
# Gjør skriptet kjørbart
chmod +x AUTOMATED_DEPLOYMENT.sh

# Kjør skriptet
./AUTOMATED_DEPLOYMENT.sh
```

Skriptet vil:
- ✅ Sjekke forhåndskrav
- ✅ Samle konfigurasjon
- ✅ Sette opp frontend
- ✅ Deploye Edge Functions
- ✅ Sette opp Git repository
- ✅ Push til GitHub
- ✅ Gi instruksjoner for Vercel deploy

---

## 📚 Ytterligere Ressurser

- **DEPLOYMENT_CHECKLIST.md** - Detaljert sjekkliste for hver steg
- **ARCHITECTURE.md** - Systemarkitektur og dataflyt
- **PROJECT_SUMMARY.md** - Komplett prosjektoversikt
- **frontend/README.md** - Frontend-spesifikk dokumentasjon

Lykke til med deploy! 🇳🇴