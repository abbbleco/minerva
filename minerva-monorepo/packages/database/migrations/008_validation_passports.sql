-- M2 validation passport (§5.8): PRD -> vendor-agnostic prototype prompt-pack
-- + validation checklist + week-one gate. One passport per PRD (regenerated
-- on delta re-scope; a new revision overwrites the row).

CREATE TABLE IF NOT EXISTS validation_passports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id       uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'emitted', 'client_validated', 'superseded')),
  prompt_pack  jsonb NOT NULL,
  checklist    jsonb NOT NULL,
  week_one_gate jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prd_id)
);

ALTER TABLE validation_passports ENABLE ROW LEVEL SECURITY;

CREATE POLICY passports_operator_all ON validation_passports
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator'));

CREATE POLICY passports_client_read ON validation_passports
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prds p
    JOIN briefs b ON b.id = p.brief_id
    JOIN clients c ON c.id = b.client_id
    WHERE p.id = validation_passports.prd_id AND c.contact_email = auth.jwt() ->> 'email'
  ));