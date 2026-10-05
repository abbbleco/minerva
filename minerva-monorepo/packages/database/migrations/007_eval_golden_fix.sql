-- M2 eval: golden cases must be SELF-CONTAINED (budget+timeline+scope) or the
-- orchestrator correctly asks for clarification and the harness fails the
-- wrong thing. Drop the junk "t1" row (previous-session test artifact).

DELETE FROM eval_cases WHERE name = 't1';

UPDATE eval_cases SET brief = 'We run a mid-sized online fashion retailer in Johannesburg. We need a new storefront that feels premium but loads fast on mobile data. Support cart abandonment recovery with WhatsApp notifications, allow pay-by-instalment, and integrate stock from our existing ERP. The team is small — keep the backend simple. Budget R250k, timeline 6 weeks.'
WHERE name = 'golden_ecommerce_brief';

UPDATE eval_cases SET brief = 'A network of private clinics wants a patient booking system. Patients must book, reschedule and get reminders via SMS. Clinicians need a daily schedule view and waitlist management. Compliance: keep patient data in South Africa and log all access. Budget R180k, timeline 12 weeks.'
WHERE name = 'golden_healthcare_brief';

UPDATE eval_cases SET brief = 'A restaurant group with 6 branches needs a table booking system. Guests book online and get SMS confirmations, hosts manage tables on a floorplan, and management sees nightly covers and revenue per branch. Integrate with the existing POS for menu data. Budget R220k, timeline 10 weeks.'
WHERE name = 'golden_restaurant_brief';