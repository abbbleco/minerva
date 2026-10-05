-- M2 eval: dedupe eval_cases (no unique constraint existed → seed dupes), lock
-- names, and add golden cases to reach the 5-case minimum (plan M2 gate).

-- Dedupe keeping the earliest row per name.
DELETE FROM eval_cases a
USING eval_cases b
WHERE a.name = b.name AND a.id > b.id;

ALTER TABLE eval_cases ADD CONSTRAINT eval_cases_name_key UNIQUE (name);

INSERT INTO eval_cases (name, brief, tags, fixture_only) VALUES
  ('golden_logistics_brief', 'A courier company with 40 drivers wants a dispatch app. Dispatchers assign jobs on a map, drivers get jobs on their phones with live ETAs, and clients get delivery notifications. Reporting: driver performance and on-time rate. Budget R320k, 8 weeks, must work on Android.', ARRAY['logistics', 'mobile', 'golden'], false),
  ('golden_restaurant_brief', 'A restaurant group with 6 branches needs a table booking system. Guests book online and get SMS confirmations, hosts manage tables on a floorplan, and management sees nightly covers and revenue per branch. Integrate with the existing POS for menu data.', ARRAY['hospitality', 'web', 'golden'], false),
  ('golden_edtech_brief', 'An edtech startup wants a learning platform for schools. Teachers create lessons with quizzes, students complete them on tablets, and parents get weekly progress emails. Offline support for rural areas. Budget R400k, 10 weeks.', ARRAY['edtech', 'platform', 'golden'], false);