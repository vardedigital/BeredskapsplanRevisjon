-- ============================================
-- BeredskapsPlanRevisjon - Complete Schema
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ============================================
-- TENANT MANAGEMENT
-- ============================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    municipality_name TEXT NOT NULL,
    logo_url TEXT,
    contact_email TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER MANAGEMENT
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('beredskapskoordinator', 'beredskapsradgiver', 'admin', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- ============================================
-- COMPLIANCE SOURCES
-- ============================================

CREATE TYPE source_type AS ENUM ('lov', 'forskrift', 'dsb', 'ks', 'regjering', 'tilsyn', 'annet');

CREATE TABLE compliance_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    source_type source_type NOT NULL,
    url TEXT NOT NULL,
    rss_url TEXT,
    description TEXT,
    last_checked_at TIMESTAMPTZ,
    content_hash TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLIANCE RULES
-- ============================================

CREATE TABLE compliance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES compliance_sources(id) ON DELETE CASCADE,
    rule_key TEXT NOT NULL UNIQUE,
    rule_text TEXT NOT NULL,
    rule_version TEXT NOT NULL,
    category TEXT,
    priority TEXT CHECK (priority IN ('MUST', 'SHOULD', 'COULD')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TEMPORARY DOCUMENTS (EPHEMERAL)
-- ============================================

CREATE TABLE temp_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN ('ros', 'plan_administrativ', 'plan_operativ', 'plan_integrert')),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    extracted_text TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_processed BOOLEAN DEFAULT false
);

-- ============================================
-- REVISION SESSIONS
-- ============================================

CREATE TABLE revision_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL UNIQUE,
    language TEXT CHECK (language IN ('bokmal', 'nynorsk')) DEFAULT 'bokmal',
    nynorsk_preferences JSONB,
    custom_instructions TEXT,
    compliance_version TEXT,
    compliance_sources_used JSONB,
    compliance_score INTEGER,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- REVISION RESULTS
-- ============================================

CREATE TABLE revision_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES revision_sessions(id) ON DELETE CASCADE,
    result_type TEXT CHECK (result_type IN ('updated_plan', 'change_log', 'exercise_plan', 'supervision_checklist', 'supervision_report')),
    content TEXT NOT NULL,
    content_json JSONB,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVISION CHANGES
-- ============================================

CREATE TABLE revision_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES revision_sessions(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    action TEXT CHECK (action IN ('delete', 'modify', 'add')) NOT NULL,
    old_text TEXT,
    new_text TEXT NOT NULL,
    source TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('MUST', 'SHOULD', 'COULD')) NOT NULL,
    chapter_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXERCISE PLANS
-- ============================================

CREATE TABLE exercise_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES revision_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    scenario TEXT NOT NULL,
    main_goal TEXT NOT NULL,
    suggested_frequency TEXT,
    responsible_role TEXT,
    evaluation_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUPERVISION CHECKLISTS
-- ============================================

CREATE TABLE supervision_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES revision_sessions(id) ON DELETE CASCADE,
    requirement_area TEXT NOT NULL,
    source TEXT NOT NULL,
    requirement_text TEXT NOT NULL,
    ai_assessment TEXT CHECK (ai_assessment IN ('covered', 'partially_covered', 'not_covered')),
    chapter_reference TEXT,
    manual_check BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_temp_documents_session ON temp_documents(session_id);
CREATE INDEX idx_temp_documents_expires ON temp_documents(expires_at);
CREATE INDEX idx_revision_sessions_tenant ON revision_sessions(tenant_id);
CREATE INDEX idx_revision_sessions_user ON revision_sessions(user_id);
CREATE INDEX idx_revision_results_session ON revision_results(session_id);
CREATE INDEX idx_revision_changes_session ON revision_changes(session_id);
CREATE INDEX idx_compliance_rules_source ON compliance_rules(source_id);
CREATE INDEX idx_compliance_rules_active ON compliance_rules(is_active);
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Tenants RLS
CREATE POLICY "Tenants can view own tenant" ON tenants
    FOR SELECT USING (id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users RLS
CREATE POLICY "Users can view own tenant users" ON users
    FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Temp Documents RLS
CREATE POLICY "Users can view own session documents" ON temp_documents
    FOR SELECT USING (session_id IN (SELECT session_id FROM revision_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own documents" ON temp_documents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documents" ON temp_documents
    FOR DELETE USING (user_id = auth.uid());

-- Revision Sessions RLS
CREATE POLICY "Users can view own sessions" ON revision_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" ON revision_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Revision Results RLS
CREATE POLICY "Users can view own session results" ON revision_results
    FOR SELECT USING (session_id IN (SELECT id FROM revision_sessions WHERE user_id = auth.uid()));

-- Revision Changes RLS
CREATE POLICY "Users can view own session changes" ON revision_changes
    FOR SELECT USING (session_id IN (SELECT id FROM revision_sessions WHERE user_id = auth.uid()));

-- Exercise Plans RLS
CREATE POLICY "Users can view own exercise plans" ON exercise_plans
    FOR SELECT USING (session_id IN (SELECT id FROM revision_sessions WHERE user_id = auth.uid()));

-- Supervision Checklists RLS
CREATE POLICY "Users can view own supervision checklists" ON supervision_checklists
    FOR SELECT USING (session_id IN (SELECT id FROM revision_sessions WHERE user_id = auth.uid()));

-- Audit Log RLS
CREATE POLICY "Users can view own tenant audit log" ON audit_log
    FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_sources_updated_at BEFORE UPDATE ON compliance_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_rules_updated_at BEFORE UPDATE ON compliance_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revision_sessions_updated_at BEFORE UPDATE ON revision_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details)
    VALUES (
        NEW.tenant_id,
        NEW.user_id,
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        jsonb_build_object(
            'old_data', row_to_json(OLD),
            'new_data', row_to_json(NEW)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PG_CRON JOBS
-- ============================================

-- Daily cleanup of expired temporary documents
SELECT cron.schedule(
    'daily-temp-purge',
    '0 2 * * *',
    $$DELETE FROM temp_documents WHERE expires_at < NOW();$$
);

-- Weekly compliance data refresh trigger
CREATE OR REPLACE FUNCTION refresh_compliance_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- This will be called by Edge Function
    PERFORM net.http_post(
        url := current_setting('app.compliance_sync_url')::text,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key')::text
        ),
        body := jsonb_build_object(
            'trigger', 'cron',
            'time', NOW()
        )
    );
END;
$$;

-- Schedule weekly compliance sync (Sunday 03:30 UTC)
SELECT cron.schedule(
    'weekly-compliance-sync',
    '30 3 * * 0',
    $$SELECT refresh_compliance_data();$$
);

-- ============================================
-- INITIAL COMPLIANCE SOURCES
-- ============================================

INSERT INTO compliance_sources (name, source_type, url, rss_url, description) VALUES
('Sivilbeskyttelsesloven', 'lov', 'https://lovdata.no/dokument/NL/lov/2010-06-18-45', NULL, 'Lov om sivilt beredskap'),
('Forskrift om kommunal beredskapsplikt', 'forskrift', 'https://lovdata.no/dokument/SF/forskrift/2011-08-26-910', NULL, 'Forskrift om kommunal beredskapsplikt'),
('DSB - Kommunal beredskapsplikt', 'dsb', 'https://www.dsb.no/beredskap/kommunal-beredskap/', 'https://www.dsb.no/rss/', 'DSB veiledning om kommunal beredskapsplikt'),
('DSB - Evakueringsplanverk', 'dsb', 'https://www.dsb.no/beredskap/evakuering/', 'https://www.dsb.no/rss/', 'Veileder for kommunenes arbeid med evakueringsplanverk'),
('DSB - Felles tilsyn', 'dsb', 'https://www.dsb.no/tilsyn/felles-tilsyn/', 'https://www.dsb.no/rss/', 'Veileder for felles tilsyn'),
('DSB - Krisekommunikasjon', 'dsb', 'https://www.dsb.no/beredskap/krisekommunikasjon/', 'https://www.dsb.no/rss/', 'Veileder krisekommunikasjon'),
('DSB - Kontinuitet', 'dsb', 'https://www.dsb.no/beredskap/kontinuitet/', 'https://www.dsb.no/rss/', 'Kontinuitetsveileder'),
('Regjeringen - Totalberedskap', 'regjering', 'https://www.regjeringen.no/no/dokumenter/meld.-st.-34-20162017/id2548465/', NULL, 'Totalberedskapsmeldingen'),
('KS - Systematisk beredskapsarbeid', 'ks', 'https://www.ks.no/fagomrader/beredskap-og-sikkerhet/', NULL, 'KS råd om systematisk beredskapsarbeid'),
('Statsforvalter - Tilsyn', 'tilsyn', 'https://www.statsforvalteren.no/beredskap-og-krisehandtering/', NULL, 'Tilsynsrapporter og opplegg');

-- ============================================
-- INITIAL COMPLIANCE RULES
-- ============================================

INSERT INTO compliance_rules (source_id, rule_key, rule_text, rule_version, category, priority) VALUES
-- Sivilbeskyttelsesloven
((SELECT id FROM compliance_sources WHERE name = 'Sivilbeskyttelsesloven'), 'lov_14_ros', 'Kommunen skal ha en helhetlig og oppdatert risiko- og sårbarhetsanalyse (ROS) som politisk er behandlet og ligger til grunn for beredskapsplanen.', '2026-02', 'ROS', 'MUST'),
((SELECT id FROM compliance_sources WHERE name = 'Sivilbeskyttelsesloven'), 'lov_15_plan', 'Kommunen skal ha en overordnet beredskapsplan som omfatter hele kommunens beredskap.', '2026-02', 'Plan', 'MUST'),

-- Forskrift om kommunal beredskapsplikt
((SELECT id FROM compliance_sources WHERE name = 'Forskrift om kommunal beredskapsplikt'), 'forskrift_2_ros', 'ROS skal være helhetlig, dekke alle sektorer og være politisk behandlet.', '2026-02', 'ROS', 'MUST'),
((SELECT id FROM compliance_sources WHERE name = 'Forskrift om kommunal beredskapsplikt'), 'forskrift_3_plan_innhold', 'Overordnet beredskapsplan skal minst omfatte: kriseledelse, varslingslister, ressursoversikt, evakueringsplanverk, plan for krisekommunikasjon.', '2026-02', 'Plan', 'MUST'),
((SELECT id FROM compliance_sources WHERE name = 'Forskrift om kommunal beredskapsplikt'), 'forskrift_4_organisasjon', 'Planen skal beskrive kriseorganisasjon med klare roller og fullmakter.', '2026-02', 'Organisasjon', 'MUST'),
((SELECT id FROM compliance_sources WHERE name = 'Forskrift om kommunal beredskapsplikt'), 'forskrift_5_varsling', 'Planen skal ha klare varslingsrutiner for både internt og eksternt.', '2026-02', 'Varsling', 'MUST'),
((SELECT id FROM compliance_sources WHERE name = 'Forskrift om kommunal beredskapsplikt'), 'forskrift_6_ovinger', 'Kommunen skal gjennomføre øvelser og evaluere disse.', '2026-02', 'Øvelser', 'MUST'),
((SELECT id FROM compliance_sources WHERE name = 'Forskrift om kommunal beredskapsplikt'), 'forskrift_7_revisjon', 'Planen skal revideres minst hvert fjerde år eller ved vesentlige endringer.', '2026-02', 'Revisjon', 'MUST'),

-- DSB Veiledere
((SELECT id FROM compliance_sources WHERE name = 'DSB - Evakueringsplanverk'), 'dsb_evakuering', 'Evakueringsplanen skal være konkret, praktisk og testet gjennom øvelser.', '2026-02', 'Evakuering', 'MUST'),
((SELECT id FROM compliance_sources WHERE name = 'DSB - Krisekommunikasjon'), 'dsb_krisekommunikasjon', 'Planen skal ha tydelig strategi for krisekommunikasjon mot innbyggere, media og samarbeidspartnere.', '2026-02', 'Krisekommunikasjon', 'MUST'),
((SELECT id FROM compliance_sources WHERE name = 'DSB - Kontinuitet'), 'dsb_kontinuitet', 'Planen skal omfatte kontinuitetsplanlegging for kritiske funksjoner og IKT-systemer.', '2026-02', 'Kontinuitet', 'SHOULD'),

-- KS Best Practice
((SELECT id FROM compliance_sources WHERE name = 'KS - Systematisk beredskapsarbeid'), 'ks_beredskapsrad', 'Kommunen bør ha et beredskapsråd med representasjon fra ulike sektorer.', '2026-02', 'Organisasjon', 'SHOULD'),
((SELECT id FROM compliance_sources WHERE name = 'KS - Systematisk beredskapsarbeid'), 'ks_samhandling', 'Planen skal beskrive samhandling med nabokommuner, fylkesmann, helseforetak og andre aktører.', '2026-02', 'Samhandling', 'SHOULD'),

-- Tilsynsfunn
((SELECT id FROM compliance_sources WHERE name = 'Statsforvalter - Tilsyn'), 'tilsyn_ros_oppdatert', 'ROS skal være oppdatert og faktisk brukt som grunnlag for planen.', '2026-02', 'ROS', 'MUST'),
((SELECT id FROM compliance_sources WHERE name = 'Statsforvalter - Tilsyn'), 'tilsyn_helseberedskap', 'Planen skal omfatte helseberedskap der relevant.', '2026-02', 'Helseberedskap', 'MUST'),
((SELECT id FROM compliance_sources WHERE name = 'Statsforvalter - Tilsyn'), 'tilsyn_digital_beredskap', 'Planen skal omfatte digital beredskap og cybersikkerhet.', '2026-02', 'Digital beredskap', 'SHOULD');