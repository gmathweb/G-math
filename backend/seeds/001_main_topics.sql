-- G-mathPOC: Seed data for the 9 main math topics
-- Run after initial migration to populate the topic hierarchy

-- ============================================================
-- Level 1: 9 Main Math Topics
-- ============================================================

INSERT INTO topics (id, slug, sort_order, is_published) VALUES
    ('10000000-0000-0000-0000-000000000001', 'about-mathematics',    1, true),
    ('10000000-0000-0000-0000-000000000002', 'algebra',              2, true),
    ('10000000-0000-0000-0000-000000000003', 'trigonometry',         3, true),
    ('10000000-0000-0000-0000-000000000004', 'calculus',             4, true),
    ('10000000-0000-0000-0000-000000000005', 'spatial-engineering',  5, true),
    ('10000000-0000-0000-0000-000000000006', 'analytic',             6, true),
    ('10000000-0000-0000-0000-000000000007', 'vectors',              7, true),
    ('10000000-0000-0000-0000-000000000008', 'geometry',             8, true),
    ('10000000-0000-0000-0000-000000000009', 'probability',          9, true);

-- Hebrew translations (primary language)
INSERT INTO topic_translations (topic_id, locale, title, description) VALUES
    ('10000000-0000-0000-0000-000000000001', 'he', 'על המתמטיקה',     'מבוא כללי לעולם המתמטיקה'),
    ('10000000-0000-0000-0000-000000000002', 'he', 'אלגברה',          'משוואות, פונקציות וביטויים אלגבריים'),
    ('10000000-0000-0000-0000-000000000003', 'he', 'טריגונומטריה',    'פונקציות טריגונומטריות, זהויות ומשוואות'),
    ('10000000-0000-0000-0000-000000000004', 'he', 'חדו״א',           'חשבון דיפרנציאלי ואינטגרלי'),
    ('10000000-0000-0000-0000-000000000005', 'he', 'הנדסת המרחב',     'גיאומטריה תלת-ממדית וגופים במרחב'),
    ('10000000-0000-0000-0000-000000000006', 'he', 'אנליטית',         'גיאומטריה אנליטית במישור'),
    ('10000000-0000-0000-0000-000000000007', 'he', 'וקטורים',         'חשבון וקטורי ופעולות על וקטורים'),
    ('10000000-0000-0000-0000-000000000008', 'he', 'גיאומטריה',       'גיאומטריה מישורית, משפטים והוכחות'),
    ('10000000-0000-0000-0000-000000000009', 'he', 'הסתברות',         'תורת ההסתברות, קומבינטוריקה וסטטיסטיקה');

-- English translations
INSERT INTO topic_translations (topic_id, locale, title, description) VALUES
    ('10000000-0000-0000-0000-000000000001', 'en', 'About Mathematics',                       'General introduction to the world of mathematics'),
    ('10000000-0000-0000-0000-000000000002', 'en', 'Algebra',                                 'Equations, functions, and algebraic expressions'),
    ('10000000-0000-0000-0000-000000000003', 'en', 'Trigonometry',                             'Trigonometric functions, identities, and equations'),
    ('10000000-0000-0000-0000-000000000004', 'en', 'Differential and Integral Calculus',       'Differential and integral calculus'),
    ('10000000-0000-0000-0000-000000000005', 'en', 'Spatial Engineering',                      '3D geometry and spatial objects'),
    ('10000000-0000-0000-0000-000000000006', 'en', 'Analytic',                                 'Analytic geometry in the plane'),
    ('10000000-0000-0000-0000-000000000007', 'en', 'Vectors',                                  'Vector calculus and vector operations'),
    ('10000000-0000-0000-0000-000000000008', 'en', 'Geometry',                                 'Planar geometry, theorems, and proofs'),
    ('10000000-0000-0000-0000-000000000009', 'en', 'Probability',                              'Probability theory, combinatorics, and statistics');
