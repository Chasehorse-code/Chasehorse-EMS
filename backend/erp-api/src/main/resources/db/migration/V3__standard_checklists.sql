-- V3__standard_checklists.sql
-- Seed standard production checklist templates and items into database
-- Replaces hardcoded client/server fallback templates

INSERT INTO checklist_templates (id, name, category, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Shelf audit', 'Shelf audit', now(), now()),
    ('22222222-2222-2222-2222-222222222222', 'Site survey', 'Site survey', now(), now()),
    ('33333333-3333-3333-3333-333333333333', 'Signage check', 'Signage check', now(), now()),
    ('44444444-4444-4444-4444-444444444444', 'Equipment inspection', 'Equipment inspection', now(), now()),
    ('55555555-5555-5555-5555-555555555555', 'Delivery proof', 'Delivery proof', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Items for 1: Shelf audit
INSERT INTO checklist_items (id, template_id, label, required, requires_photo, sort_order)
VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Exterior & store entrance photo', true, true, 0),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Verify shelf placement & SKU facing count', true, true, 1),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Inspect promotional standee and discount signage', true, true, 2),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Record product expiry date on top rack', true, false, 3),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Confirm competitor pricing tag', false, false, 4)
ON CONFLICT DO NOTHING;

-- Items for 2: Site survey
INSERT INTO checklist_items (id, template_id, label, required, requires_photo, sort_order)
VALUES
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Capture GPS geotagged perimeter photo', true, true, 0),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Verify property boundary and access road width', true, false, 1),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Inspect utility line proximity (power/water)', true, false, 2),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Record store manager contact & signature', true, false, 3)
ON CONFLICT DO NOTHING;

-- Items for 3: Signage check
INSERT INTO checklist_items (id, template_id, label, required, requires_photo, sort_order)
VALUES
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Photograph primary billboard / storefront sign', true, true, 0),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Verify illumination & electrical cabling', true, true, 1),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Report physical damage or vinyl peeling', false, false, 2)
ON CONFLICT DO NOTHING;

-- Items for 4: Equipment inspection
INSERT INTO checklist_items (id, template_id, label, required, requires_photo, sort_order)
VALUES
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Scan asset barcode / serial number', true, true, 0),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Inspect casing, lock & seal integrity', true, true, 1),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Record operating gauge / temperature reading', true, false, 2),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Confirm safety shutoff switch functionality', true, false, 3)
ON CONFLICT DO NOTHING;

-- Items for 5: Delivery proof
INSERT INTO checklist_items (id, template_id, label, required, requires_photo, sort_order)
VALUES
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Photograph package at delivery doorstep / loading bay', true, true, 0),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Verify recipient identity and signature', true, false, 1),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Confirm tamper-evident seal is intact', true, false, 2)
ON CONFLICT DO NOTHING;
