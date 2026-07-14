-- 0003_seeker_onboarding_schema.sql
-- Adds all fields the Nexa Consulting CV format requires (see docs/example_docs/*.pdf):
-- first/last name split, header table fields (drivers license, car, postal code,
-- city, availability, salary expectation, birth year, job title),
-- and two new tables for chronological work_experiences and educations.
-- Ends with ~150 seed skills covering trade + IT/office.

-- ============================================================================
-- profiles: split name into first/last (real_name stays for back-compat).
-- ============================================================================

alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name  text;

-- ============================================================================
-- seeker_profiles: add all CV header-table fields.
-- ============================================================================

alter table seeker_profiles add column if not exists job_title              text;
alter table seeker_profiles add column if not exists birth_year             int check (birth_year is null or (birth_year between 1900 and extract(year from now())::int));
alter table seeker_profiles add column if not exists has_driver_license     boolean;
alter table seeker_profiles add column if not exists has_car                boolean;
alter table seeker_profiles add column if not exists postal_code            text check (postal_code is null or postal_code ~ '^[0-9]{5}$');
alter table seeker_profiles add column if not exists city                   text;
alter table seeker_profiles add column if not exists available_from         date;
alter table seeker_profiles add column if not exists salary_expectation_eur int;

-- Enable RLS on seeker_profiles if not already enabled.
-- Own-row policies mirror the profiles policies from migration 0002.
alter table seeker_profiles enable row level security;

-- Seeker sees only their own seeker_profile row.
create policy select_own_seeker_profile on seeker_profiles
  for select
  using (auth.uid() = profile_id);

-- Seeker inserts their own seeker_profile row (during onboarding).
create policy insert_own_seeker_profile on seeker_profiles
  for insert
  with check (auth.uid() = profile_id);

-- Seeker updates their own seeker_profile row (during onboarding + edits).
create policy update_own_seeker_profile on seeker_profiles
  for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ============================================================================
-- work_experiences: chronological employment blocks.
-- Nullable end_year/end_month means the position is current.
-- ============================================================================

create table work_experiences (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  sort_order   int  not null default 0,
  start_year   int  not null check (start_year between 1950 and extract(year from now())::int + 1),
  start_month  int  not null check (start_month between 1 and 12),
  end_year     int  check (end_year is null or end_year between 1950 and extract(year from now())::int + 5),
  end_month    int  check (end_month is null or end_month between 1 and 12),
  title        text not null,
  subtitle     text,
  description  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index idx_work_experiences_profile on work_experiences(profile_id, sort_order);

alter table work_experiences enable row level security;

create policy select_own_work_experiences on work_experiences
  for select using (auth.uid() = profile_id);

create policy insert_own_work_experiences on work_experiences
  for insert with check (auth.uid() = profile_id);

create policy update_own_work_experiences on work_experiences
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy delete_own_work_experiences on work_experiences
  for delete using (auth.uid() = profile_id);

-- ============================================================================
-- educations: chronological education blocks.
-- Same time-range shape as work_experiences.
-- ============================================================================

create table educations (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  sort_order   int  not null default 0,
  start_year   int  not null check (start_year between 1950 and extract(year from now())::int + 1),
  start_month  int  not null check (start_month between 1 and 12),
  end_year     int  check (end_year is null or end_year between 1950 and extract(year from now())::int + 5),
  end_month    int  check (end_month is null or end_month between 1 and 12),
  title        text not null,
  description  text,
  status       text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index idx_educations_profile on educations(profile_id, sort_order);

alter table educations enable row level security;

create policy select_own_educations on educations
  for select using (auth.uid() = profile_id);

create policy insert_own_educations on educations
  for insert with check (auth.uid() = profile_id);

create policy update_own_educations on educations
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy delete_own_educations on educations
  for delete using (auth.uid() = profile_id);

-- ============================================================================
-- seeker_skills: enable RLS so the onboarding wizard can insert/delete.
-- Existing table from migration 0001 had no policies yet.
-- ============================================================================

alter table seeker_skills enable row level security;

create policy select_own_seeker_skills on seeker_skills
  for select using (auth.uid() = profile_id);

create policy insert_own_seeker_skills on seeker_skills
  for insert with check (auth.uid() = profile_id);

create policy update_own_seeker_skills on seeker_skills
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy delete_own_seeker_skills on seeker_skills
  for delete using (auth.uid() = profile_id);

-- skills table stays world-readable so the autocomplete works pre-auth-check.
alter table skills enable row level security;

create policy select_all_skills on skills
  for select using (true);

-- ============================================================================
-- Skill seed: ~150 skills, mixed trade + IT/office.
-- Categories: 'trade', 'certification', 'tool', 'programming', 'framework',
--             'cloud', 'language', 'soft'.
-- ============================================================================

insert into skills (slug, display_name, category) values
  -- Trade / Handwerk
  ('anlagenmechanik-shk',              'Anlagenmechanik SHK',                    'trade'),
  ('elektronik-betriebstechnik',       'Elektronik fuer Betriebstechnik',        'trade'),
  ('elektronik-energie-gebaeude',      'Elektronik fuer Energie- und Gebaeudetechnik', 'trade'),
  ('elektronik-automatisierung',       'Elektronik fuer Automatisierungstechnik','trade'),
  ('zerspanungsmechanik',              'Zerspanungsmechanik',                    'trade'),
  ('metallbau-konstruktion',           'Metallbau Konstruktionstechnik',         'trade'),
  ('zentralheizung-lueftungsbau',      'Zentralheizungs- und Lueftungsbau',      'trade'),
  ('gas-wasserinstallation',           'Gas- und Wasserinstallation',            'trade'),
  ('rohrleitungsbau',                  'Rohrleitungsbau',                        'trade'),
  ('sanitaerinstallation',             'Sanitaerinstallation',                   'trade'),
  ('heizungsinstallation',             'Heizungsinstallation',                   'trade'),
  ('klimatechnik',                     'Klimatechnik',                           'trade'),
  ('lueftungstechnik',                 'Lueftungstechnik',                       'trade'),
  ('kaeltetechnik',                    'Kaeltetechnik',                          'trade'),
  ('schweisstechnik-mag',              'Schweisstechnik MAG',                    'trade'),
  ('schweisstechnik-wig',              'Schweisstechnik WIG',                    'trade'),
  ('schweisstechnik-e-hand',           'Schweisstechnik E-Hand',                 'trade'),
  ('autogenschweissen',                'Autogenschweissen',                      'trade'),
  ('loeten',                           'Weich- und Hartloeten',                  'trade'),
  ('blechbearbeitung',                 'Blechbearbeitung',                       'trade'),
  ('metallbearbeitung',                'Metallbearbeitung',                      'trade'),
  ('cnc-fraesen',                      'CNC-Fraesen',                            'trade'),
  ('cnc-drehen',                       'CNC-Drehen',                             'trade'),
  ('schaltschrankbau',                 'Schaltschrankbau',                       'trade'),
  ('schaltschrankverdrahtung',         'Schaltschrankverdrahtung',               'trade'),
  ('lwl-kabelmontage',                 'LWL-Kabelmontage',                       'trade'),
  ('kupferkabelmontage',               'Kupferkabelmontage',                     'trade'),
  ('elektroinstallation',              'Elektroinstallation',                    'trade'),
  ('photovoltaik-installation',        'Photovoltaik-Installation',              'trade'),
  ('waermepumpen-installation',        'Waermepumpen-Installation',              'trade'),
  ('solaranlagen-installation',        'Solaranlagen-Installation',              'trade'),
  ('kabelmontage',                     'Kabelmontage',                           'trade'),
  ('mess-regeltechnik',                'Mess- und Regeltechnik',                 'trade'),
  ('hydraulik',                        'Hydraulik',                              'trade'),
  ('pneumatik',                        'Pneumatik',                              'trade'),
  ('anlagen-wartung',                  'Wartung von Produktionsanlagen',         'trade'),
  ('instandhaltung',                   'Instandhaltung',                         'trade'),
  ('fehlerdiagnose',                   'Fehlerdiagnose',                         'trade'),
  ('serviceeinsatz-dokumentation',     'Dokumentation von Serviceeinsaetzen',    'trade'),
  ('wartungsberichte',                 'Wartungsberichte',                       'trade'),
  ('baustellenkoordination',           'Baustellenkoordination',                 'trade'),
  ('rohrverstopfung',                  'Rohrverstopfungsbehebung',               'trade'),
  ('leckagenbehebung',                 'Leckagenbehebung',                       'trade'),
  ('dichtheitspruefung',               'Dichtheitspruefung',                     'trade'),
  ('kundenberatung-shk',               'Kundenberatung SHK',                     'trade'),
  ('armaturen-installation',           'Armaturen-Installation',                 'trade'),
  ('bosch-thermotechnik',              'Bosch Thermotechnik',                    'trade'),
  ('viessmann-anlagen',                'Viessmann-Anlagen',                      'trade'),
  ('buderus-systeme',                  'Buderus-Systeme',                        'trade'),
  ('vaillant-systeme',                 'Vaillant-Systeme',                       'trade'),
  ('grundfos-pumpen',                  'Grundfos-Pumpen',                        'trade'),
  ('wilo-pumpen',                      'Wilo-Pumpen',                            'trade'),
  ('waermepumpen-diagnose',            'Waermepumpen-Diagnose',                  'trade'),
  ('warmwasserbereitung',              'Warmwasserbereitung',                    'trade'),
  ('fussbodenheizung',                 'Fussbodenheizung',                       'trade'),
  ('heizkoerper-installation',         'Heizkoerper-Installation',               'trade'),
  ('sanitaerreparatur',                'Sanitaerreparatur',                      'trade'),
  ('waschbecken-installation',         'Waschbecken-Installation',               'trade'),
  ('wc-installation',                  'WC-Installation',                        'trade'),
  ('duschen-installation',             'Duschen-Installation',                   'trade'),

  -- Certifications
  ('dguv-v3',                          'DGUV V3',                                'certification'),
  ('meisterbrief-shk',                 'Meisterbrief SHK',                       'certification'),
  ('meisterbrief-elektro',             'Meisterbrief Elektro',                   'certification'),
  ('sachkunde-kaeltemittel',           'Sachkundenachweis Kaeltemittel',         'certification'),
  ('sicherheitsbeauftragter',          'Sicherheitsbeauftragter',                'certification'),
  ('erste-hilfe',                      'Erste Hilfe',                            'certification'),
  ('staplerschein',                    'Staplerschein',                          'certification'),
  ('kranschein',                       'Kranschein',                             'certification'),
  ('hubarbeitsbuehnen-schein',         'Hubarbeitsbuehnen-Schein',               'certification'),
  ('sachverstaendiger-elektro',        'Sachverstaendigenpruefung Elektrotechnik','certification'),
  ('ausbilder-eignung',                'IHK-Ausbilder-Eignung',                  'certification'),
  ('vde-pruefung',                     'VDE-Pruefung',                           'certification'),
  ('schweisserpruefung',               'Schweisserpruefung',                     'certification'),
  ('trgs-519-asbest',                  'TRGS 519 Asbest',                        'certification'),
  ('fluessiggas-sachkunde',            'Fluessiggas-Sachkunde',                  'certification'),
  ('trinkwasserverordnung',            'Trinkwasserverordnung',                  'certification'),
  ('enev-fachkraft',                   'EnEV-Fachkraft',                         'certification'),
  ('sachkunde-psa',                    'Sachkundenachweis PSA',                  'certification'),
  ('kettensaegen-schein',              'Kettensaegenschein',                     'certification'),
  ('baumeister',                       'Baumeister-Pruefung',                    'certification'),

  -- Tools / Software
  ('tia-portal',                       'TIA Portal',                             'tool'),
  ('s7-programmierung',                'S7 Programmierung',                      'tool'),
  ('siemens-simatic',                  'Siemens Simatic',                        'tool'),
  ('beckhoff-twincat',                 'Beckhoff TwinCAT',                       'tool'),
  ('autocad',                          'AutoCAD',                                'tool'),
  ('autocad-electrical',               'AutoCAD Electrical',                     'tool'),
  ('eplan',                            'EPLAN',                                  'tool'),
  ('solidworks',                       'Solidworks',                             'tool'),
  ('fusion-360',                       'Fusion 360',                             'tool'),
  ('rhino-3d',                         'Rhino 3D',                               'tool'),
  ('sketchup',                         'SketchUp',                               'tool'),
  ('excel',                            'Microsoft Excel',                        'tool'),
  ('word',                             'Microsoft Word',                         'tool'),
  ('powerpoint',                       'Microsoft PowerPoint',                   'tool'),
  ('outlook',                          'Microsoft Outlook',                      'tool'),
  ('sap-mm',                           'SAP MM',                                 'tool'),
  ('sap-pm',                           'SAP PM',                                 'tool'),
  ('sap-fi',                           'SAP FI',                                 'tool'),
  ('sap-hr',                           'SAP HR',                                 'tool'),
  ('datev',                            'DATEV',                                  'tool'),
  ('ms-project',                       'MS Project',                             'tool'),
  ('teams',                            'Microsoft Teams',                        'tool'),
  ('slack',                            'Slack',                                  'tool'),
  ('jira',                             'Jira',                                   'tool'),
  ('confluence',                       'Confluence',                             'tool'),
  ('notion',                           'Notion',                                 'tool'),
  ('trello',                           'Trello',                                 'tool'),
  ('figma',                            'Figma',                                  'tool'),
  ('photoshop',                        'Adobe Photoshop',                        'tool'),
  ('illustrator',                      'Adobe Illustrator',                      'tool'),

  -- Programming
  ('typescript',                       'TypeScript',                             'programming'),
  ('javascript',                       'JavaScript',                             'programming'),
  ('python',                           'Python',                                 'programming'),
  ('java',                             'Java',                                   'programming'),
  ('csharp',                           'C#',                                     'programming'),
  ('cplusplus',                        'C++',                                    'programming'),
  ('go',                               'Go',                                     'programming'),
  ('rust',                             'Rust',                                   'programming'),
  ('php',                              'PHP',                                    'programming'),
  ('ruby',                             'Ruby',                                   'programming'),
  ('sql',                              'SQL',                                    'programming'),
  ('bash',                             'Bash',                                   'programming'),
  ('powershell',                       'PowerShell',                             'programming'),
  ('kotlin',                           'Kotlin',                                 'programming'),
  ('swift',                            'Swift',                                  'programming'),

  -- Frameworks
  ('react',                            'React',                                  'framework'),
  ('vue',                              'Vue.js',                                 'framework'),
  ('angular',                          'Angular',                                'framework'),
  ('nextjs',                           'Next.js',                                'framework'),
  ('nodejs',                           'Node.js',                                'framework'),
  ('django',                           'Django',                                 'framework'),
  ('flask',                            'Flask',                                  'framework'),
  ('spring-boot',                      'Spring Boot',                            'framework'),
  ('dotnet',                           '.NET',                                   'framework'),
  ('rails',                            'Ruby on Rails',                          'framework'),

  -- Cloud / Infra
  ('aws',                              'AWS',                                    'cloud'),
  ('azure',                            'Microsoft Azure',                        'cloud'),
  ('gcp',                              'Google Cloud',                           'cloud'),
  ('docker',                           'Docker',                                 'cloud'),
  ('kubernetes',                       'Kubernetes',                             'cloud'),
  ('terraform',                        'Terraform',                              'cloud'),
  ('git',                              'Git',                                    'cloud'),

  -- Languages
  ('sprache-deutsch',                  'Deutsch',                                'language'),
  ('sprache-englisch',                 'Englisch',                               'language'),
  ('sprache-franzoesisch',             'Franzoesisch',                           'language'),
  ('sprache-spanisch',                 'Spanisch',                               'language'),
  ('sprache-tuerkisch',                'Tuerkisch',                              'language'),
  ('sprache-polnisch',                 'Polnisch',                               'language'),
  ('sprache-russisch',                 'Russisch',                               'language'),
  ('sprache-arabisch',                 'Arabisch',                               'language'),

  -- Soft skills
  ('teamfaehigkeit',                   'Teamfaehigkeit',                         'soft'),
  ('kommunikation',                    'Kommunikationsfaehigkeit',               'soft'),
  ('projektmanagement',                'Projektmanagement',                      'soft'),
  ('fuehrungskompetenz',               'Fuehrungskompetenz',                     'soft'),
  ('kundenorientierung',               'Kundenorientierung',                     'soft'),
  ('problemloesung',                   'Problemloesungsfaehigkeit',              'soft'),
  ('selbstorganisation',               'Selbstorganisation',                     'soft'),
  ('belastbarkeit',                    'Belastbarkeit',                          'soft'),
  ('zuverlaessigkeit',                 'Zuverlaessigkeit',                       'soft'),
  ('flexibilitaet',                    'Flexibilitaet',                          'soft');
