-- 0006_dummy_jobs_seed.sql
-- Seeds a dummy recruiter company and 15 handwerk-focused jobs so the seeker
-- feed has content to swipe on while the recruiter web-admin is not yet built.
-- Coordinates are approximate city centers.
-- All IDs deterministic so subsequent migrations can reference them.
--
-- The dummy recruiter profile has no matching auth.users row. That would
-- normally fail the profiles.id -> auth.users(id) FK. We bypass FK triggers
-- for this session so the seed can complete. The bypass is scoped to this
-- migration transaction; production writes are unaffected.

set session_replication_role = replica;

-- ============================================================================
-- Dummy company
-- ============================================================================

insert into companies (
  id, legal_name, display_name, pseudonym, industry, size_category,
  billing_email, show_anonymous
) values (
  '00000000-0000-0000-0000-000000000001',
  'Nexa Consulting Test GbR',
  'Nexa Consulting',
  'Kandidatensuche 001',
  'Handwerk',
  '11-50',
  'sales@nexa-consulting.de',
  true
) on conflict (id) do nothing;

-- ============================================================================
-- Dummy recruiter profile (no auth.users row; that comes with the web admin)
-- ============================================================================

insert into profiles (id, role, display_name)
values (
  '00000000-0000-0000-0000-000000000010',
  'recruiter',
  'Test Recruiter'
) on conflict (id) do nothing;

-- ============================================================================
-- Jobs: 15 across trade categories, spread across northern Germany.
-- ============================================================================

insert into jobs (
  id, company_id, created_by, title, description, status,
  match_threshold_pct, location_lat, location_lon, remote_ok,
  salary_min_eur, salary_max_eur
) values

('10000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Anlagenmechaniker SHK Hamburg',
 'Wartung, Reparatur und Instandsetzung von Sanitäranlagen. Dichtheitsprüfungen und Fehlersuche in Wassersystemen. Kundenberatung zu Nutzung, Pflege und Einsparpotenzialen.',
 'active', 65, 53.5511, 9.9937, false, 3200, 4200),

('10000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Elektroniker Betriebstechnik Kiel',
 'Instandhaltung und Wartung von Produktionsanlagen. SPS-Programmierung mit TIA Portal, Schaltschrankverdrahtung, DGUV-V3-Prüfungen.',
 'active', 65, 54.3233, 10.1394, false, 3400, 4400),

('10000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Wärmepumpen-Installateur Lübeck',
 'Installation und Inbetriebnahme von Wärmepumpen in Ein- und Mehrfamilienhäusern. Kundenberatung zu Fördermöglichkeiten und Betrieb.',
 'active', 65, 53.8654, 10.6866, false, 3300, 4300),

('10000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Metallbauer Konstruktionstechnik Bremen',
 'Fertigung von Stahlkonstruktionen im Werkstattbetrieb und Montage vor Ort. MAG-Schweißen, Blechbearbeitung, Baustellenkoordination.',
 'active', 65, 53.0793, 8.8017, false, 3000, 3900),

('10000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Zerspanungsmechaniker Hannover',
 'CNC-Fräsen und CNC-Drehen von Präzisionsteilen. Rüsten der Maschinen, Qualitätssicherung, Programmieren mit Fanuc-Steuerung.',
 'active', 65, 52.3759, 9.7320, false, 3100, 4000),

('10000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Elektroniker Energie- und Gebäudetechnik Berlin',
 'Elektroinstallationen in Neubau und Bestand. KNX-Bussysteme, Photovoltaik-Anlagen, Ladeinfrastruktur für E-Autos.',
 'active', 65, 52.5200, 13.4050, false, 3200, 4200),

('10000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Sanitärinstallateur Hamburg',
 'Neuinstallation und Renovierung von Bädern. Verlegen von Trinkwasser- und Abwasserleitungen, Installation von Armaturen und Sanitärobjekten.',
 'active', 60, 53.5511, 9.9937, false, 2900, 3700),

('10000000-0000-0000-0000-000000000008',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Heizungsbauer Hamburg',
 'Installation und Wartung von Heizungsanlagen aller Art: Gas, Öl, Wärmepumpe. Kundenservice und Störungsbehebung im Notdienst.',
 'active', 65, 53.5511, 9.9937, false, 3100, 4000),

('10000000-0000-0000-0000-000000000009',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Anlagenmechaniker SHK Rostock',
 'Kundenservice im Sanitär- und Heizungsbereich. Rohrleitungsbau, Fehlerdiagnose an Wassersystemen, Dokumentation der Serviceeinsätze.',
 'active', 65, 54.0887, 12.1401, false, 3000, 3800),

('10000000-0000-0000-0000-000000000010',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Elektroniker Automatisierungstechnik Wolfsburg',
 'Automation in der Fahrzeugproduktion. Programmierung von Robotern und SPS, Inbetriebnahme neuer Linien, Fehlerdiagnose im Produktionsbetrieb.',
 'active', 70, 52.4227, 10.7865, false, 3800, 4500),

('10000000-0000-0000-0000-000000000011',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Kältetechniker Hamburg',
 'Wartung und Reparatur von Klima- und Kälteanlagen in Gewerbe und Industrie. Sachkundenachweis Kältemittel erforderlich.',
 'active', 70, 53.5511, 9.9937, false, 3400, 4300),

('10000000-0000-0000-0000-000000000012',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Schweißer MAG/WIG Bremen',
 'Schweißen von Baugruppen im Anlagenbau. MAG- und WIG-Verfahren, Baugruppenmontage, Prüfen nach DIN EN ISO.',
 'active', 65, 53.0793, 8.8017, false, 3200, 4100),

('10000000-0000-0000-0000-000000000013',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Servicetechniker Photovoltaik Kiel',
 'Wartung und Fehlerbehebung an PV-Anlagen. LWL-Kabelmontage, Elektroprüfung nach DGUV V3, Kundenkommunikation vor Ort.',
 'active', 65, 54.3233, 10.1394, false, 3200, 4000),

('10000000-0000-0000-0000-000000000014',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Zentralheizungs- und Lüftungsbauer Lübeck',
 'Neubau und Modernisierung von Heizungs- und Lüftungsanlagen. Rohrleitungsbau, Inbetriebnahme, Einweisung der Kunden.',
 'active', 60, 53.8654, 10.6866, false, 2900, 3700),

('10000000-0000-0000-0000-000000000015',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000010',
 'Meister SHK Hamburg (Führungsposition)',
 'Führung eines Serviceteams mit 6 Monteuren. Auftragsplanung, Kundenkommunikation, technische Verantwortung und Qualitätssicherung.',
 'active', 75, 53.5511, 9.9937, false, 4000, 5000)

on conflict (id) do nothing;

-- ============================================================================
-- Job criteria: 2-5 skills per job with weights, min_level, is_required flags.
-- Weights should sum roughly to 100 per job (not enforced, algorithm normalises).
-- ============================================================================

insert into job_criteria (job_id, skill_id, weight, min_level, is_required) values
-- Job 1: Anlagenmechaniker SHK Hamburg
('10000000-0000-0000-0000-000000000001',
 (select id from skills where slug = 'anlagenmechanik-shk'), 40, 'intermediate', true),
('10000000-0000-0000-0000-000000000001',
 (select id from skills where slug = 'sanitaerinstallation'), 25, 'intermediate', false),
('10000000-0000-0000-0000-000000000001',
 (select id from skills where slug = 'rohrverstopfung'), 15, 'beginner', false),
('10000000-0000-0000-0000-000000000001',
 (select id from skills where slug = 'dichtheitspruefung'), 20, 'intermediate', false),

-- Job 2: Elektroniker Betriebstechnik Kiel
('10000000-0000-0000-0000-000000000002',
 (select id from skills where slug = 'elektronik-betriebstechnik'), 40, 'intermediate', true),
('10000000-0000-0000-0000-000000000002',
 (select id from skills where slug = 'tia-portal'), 25, 'intermediate', false),
('10000000-0000-0000-0000-000000000002',
 (select id from skills where slug = 'schaltschrankverdrahtung'), 20, 'intermediate', false),
('10000000-0000-0000-0000-000000000002',
 (select id from skills where slug = 'dguv-v3'), 15, 'beginner', true),

-- Job 3: Wärmepumpen-Installateur Lübeck
('10000000-0000-0000-0000-000000000003',
 (select id from skills where slug = 'waermepumpen-installation'), 45, 'intermediate', true),
('10000000-0000-0000-0000-000000000003',
 (select id from skills where slug = 'anlagenmechanik-shk'), 25, 'intermediate', false),
('10000000-0000-0000-0000-000000000003',
 (select id from skills where slug = 'kundenberatung-shk'), 15, 'beginner', false),
('10000000-0000-0000-0000-000000000003',
 (select id from skills where slug = 'waermepumpen-diagnose'), 15, 'beginner', false),

-- Job 4: Metallbauer Bremen
('10000000-0000-0000-0000-000000000004',
 (select id from skills where slug = 'metallbau-konstruktion'), 40, 'intermediate', true),
('10000000-0000-0000-0000-000000000004',
 (select id from skills where slug = 'schweisstechnik-mag'), 25, 'intermediate', true),
('10000000-0000-0000-0000-000000000004',
 (select id from skills where slug = 'blechbearbeitung'), 20, 'intermediate', false),
('10000000-0000-0000-0000-000000000004',
 (select id from skills where slug = 'baustellenkoordination'), 15, 'beginner', false),

-- Job 5: Zerspanungsmechaniker Hannover
('10000000-0000-0000-0000-000000000005',
 (select id from skills where slug = 'zerspanungsmechanik'), 40, 'intermediate', true),
('10000000-0000-0000-0000-000000000005',
 (select id from skills where slug = 'cnc-fraesen'), 30, 'advanced', true),
('10000000-0000-0000-0000-000000000005',
 (select id from skills where slug = 'cnc-drehen'), 30, 'advanced', true),

-- Job 6: Elektroniker EG-Technik Berlin
('10000000-0000-0000-0000-000000000006',
 (select id from skills where slug = 'elektronik-energie-gebaeude'), 40, 'intermediate', true),
('10000000-0000-0000-0000-000000000006',
 (select id from skills where slug = 'elektroinstallation'), 25, 'intermediate', true),
('10000000-0000-0000-0000-000000000006',
 (select id from skills where slug = 'photovoltaik-installation'), 20, 'beginner', false),
('10000000-0000-0000-0000-000000000006',
 (select id from skills where slug = 'dguv-v3'), 15, 'beginner', false),

-- Job 7: Sanitärinstallateur Hamburg
('10000000-0000-0000-0000-000000000007',
 (select id from skills where slug = 'sanitaerinstallation'), 45, 'intermediate', true),
('10000000-0000-0000-0000-000000000007',
 (select id from skills where slug = 'rohrleitungsbau'), 25, 'intermediate', false),
('10000000-0000-0000-0000-000000000007',
 (select id from skills where slug = 'armaturen-installation'), 15, 'beginner', false),
('10000000-0000-0000-0000-000000000007',
 (select id from skills where slug = 'wc-installation'), 15, 'beginner', false),

-- Job 8: Heizungsbauer Hamburg
('10000000-0000-0000-0000-000000000008',
 (select id from skills where slug = 'heizungsinstallation'), 40, 'intermediate', true),
('10000000-0000-0000-0000-000000000008',
 (select id from skills where slug = 'anlagenmechanik-shk'), 25, 'intermediate', false),
('10000000-0000-0000-0000-000000000008',
 (select id from skills where slug = 'fehlerdiagnose'), 20, 'intermediate', false),
('10000000-0000-0000-0000-000000000008',
 (select id from skills where slug = 'waermepumpen-installation'), 15, 'beginner', false),

-- Job 9: Anlagenmechaniker Rostock
('10000000-0000-0000-0000-000000000009',
 (select id from skills where slug = 'anlagenmechanik-shk'), 45, 'intermediate', true),
('10000000-0000-0000-0000-000000000009',
 (select id from skills where slug = 'rohrleitungsbau'), 20, 'intermediate', false),
('10000000-0000-0000-0000-000000000009',
 (select id from skills where slug = 'fehlerdiagnose'), 20, 'intermediate', false),
('10000000-0000-0000-0000-000000000009',
 (select id from skills where slug = 'serviceeinsatz-dokumentation'), 15, 'beginner', false),

-- Job 10: Elektroniker Automatisierung Wolfsburg
('10000000-0000-0000-0000-000000000010',
 (select id from skills where slug = 'elektronik-automatisierung'), 40, 'advanced', true),
('10000000-0000-0000-0000-000000000010',
 (select id from skills where slug = 'tia-portal'), 25, 'advanced', true),
('10000000-0000-0000-0000-000000000010',
 (select id from skills where slug = 's7-programmierung'), 20, 'intermediate', false),
('10000000-0000-0000-0000-000000000010',
 (select id from skills where slug = 'siemens-simatic'), 15, 'intermediate', false),

-- Job 11: Kältetechniker Hamburg
('10000000-0000-0000-0000-000000000011',
 (select id from skills where slug = 'kaeltetechnik'), 40, 'advanced', true),
('10000000-0000-0000-0000-000000000011',
 (select id from skills where slug = 'sachkunde-kaeltemittel'), 30, 'intermediate', true),
('10000000-0000-0000-0000-000000000011',
 (select id from skills where slug = 'klimatechnik'), 20, 'intermediate', false),
('10000000-0000-0000-0000-000000000011',
 (select id from skills where slug = 'fehlerdiagnose'), 10, 'intermediate', false),

-- Job 12: Schweißer Bremen
('10000000-0000-0000-0000-000000000012',
 (select id from skills where slug = 'schweisstechnik-mag'), 40, 'advanced', true),
('10000000-0000-0000-0000-000000000012',
 (select id from skills where slug = 'schweisstechnik-wig'), 30, 'advanced', true),
('10000000-0000-0000-0000-000000000012',
 (select id from skills where slug = 'schweisserpruefung'), 20, 'intermediate', false),
('10000000-0000-0000-0000-000000000012',
 (select id from skills where slug = 'metallbearbeitung'), 10, 'intermediate', false),

-- Job 13: Servicetechniker PV Kiel
('10000000-0000-0000-0000-000000000013',
 (select id from skills where slug = 'photovoltaik-installation'), 40, 'intermediate', true),
('10000000-0000-0000-0000-000000000013',
 (select id from skills where slug = 'elektroinstallation'), 25, 'intermediate', true),
('10000000-0000-0000-0000-000000000013',
 (select id from skills where slug = 'lwl-kabelmontage'), 20, 'intermediate', false),
('10000000-0000-0000-0000-000000000013',
 (select id from skills where slug = 'dguv-v3'), 15, 'beginner', false),

-- Job 14: Zentralheizungs- und Lüftungsbauer Lübeck
('10000000-0000-0000-0000-000000000014',
 (select id from skills where slug = 'zentralheizung-lueftungsbau'), 40, 'intermediate', true),
('10000000-0000-0000-0000-000000000014',
 (select id from skills where slug = 'rohrleitungsbau'), 25, 'intermediate', false),
('10000000-0000-0000-0000-000000000014',
 (select id from skills where slug = 'heizungsinstallation'), 20, 'intermediate', false),
('10000000-0000-0000-0000-000000000014',
 (select id from skills where slug = 'lueftungstechnik'), 15, 'intermediate', false),

-- Job 15: Meister SHK Hamburg (Führung)
('10000000-0000-0000-0000-000000000015',
 (select id from skills where slug = 'meisterbrief-shk'), 40, 'expert', true),
('10000000-0000-0000-0000-000000000015',
 (select id from skills where slug = 'anlagenmechanik-shk'), 25, 'expert', true),
('10000000-0000-0000-0000-000000000015',
 (select id from skills where slug = 'fuehrungskompetenz'), 20, 'advanced', true),
('10000000-0000-0000-0000-000000000015',
 (select id from skills where slug = 'projektmanagement'), 15, 'intermediate', false)

on conflict (job_id, skill_id) do nothing;

set session_replication_role = origin;
