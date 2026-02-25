-- prisma/seed.demo.sql
-- Idempotent demo dataset for local testing (Phase 4)

-- Announcement
INSERT OR IGNORE INTO "Announcement" ("id", "content", "isActive", "createdAt", "updatedAt")
VALUES (
  'announcement_demo_01',
  'Semakan jadual temuduga SPP minggu ini: sila semak e-mel rasmi anda.',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Home posts
INSERT OR IGNORE INTO "Post" ("id", "content", "authorName", "authorToken", "isPinned", "likes", "createdAt", "updatedAt")
VALUES (
  'post_demo_01',
  'Saya baru selesai temuduga. Fokus kepada struktur jawapan: pengenalan, isi utama, kesimpulan.',
  'Cikgu Hani',
  'demo-author-001',
  1,
  7,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO "Post" ("id", "content", "authorName", "authorToken", "isPinned", "likes", "createdAt", "updatedAt")
VALUES (
  'post_demo_02',
  'Bawa salinan dokumen lebih daripada satu set. Sangat membantu jika ada semakan terakhir.',
  'Ustaz Firdaus',
  'demo-author-002',
  0,
  3,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO "Comment" ("id", "content", "authorName", "authorToken", "postId", "createdAt")
VALUES
  ('comment_demo_01', 'Terima kasih, tips ini memang praktikal!', 'Aina', 'demo-commenter-001', 'post_demo_01', CURRENT_TIMESTAMP),
  ('comment_demo_02', 'Betul, saya pun bawa 3 salinan dokumen.', 'Rashid', 'demo-commenter-002', 'post_demo_02', CURRENT_TIMESTAMP);

-- Notes
INSERT OR IGNORE INTO "Note" ("id", "title", "content", "link", "authorName", "authorToken", "createdAt", "updatedAt")
VALUES
  (
    'note_demo_01',
    'Struktur Jawapan STAR',
    'Gunakan Situation, Task, Action, Result untuk soalan pengalaman kerja.',
    'https://example.com/star-method',
    'Cikgu Fatin',
    'demo-note-001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'note_demo_02',
    'Checklist Dokumen',
    'Kad pengenalan, sijil akademik, surat panggilan, dan dokumen sokongan lain.',
    NULL,
    'Cikgu Hakim',
    'demo-note-002',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

-- Tips + labels
INSERT OR IGNORE INTO "Tip" ("id", "content", "authorName", "authorToken", "createdAt", "updatedAt")
VALUES
  (
    'tip_demo_01',
    'Datang 30 minit awal supaya sempat bertenang dan semak dokumen.',
    'Nadia',
    'demo-tip-001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'tip_demo_02',
    'Intonasi stabil dan jelas membantu panel faham isi jawapan dengan cepat.',
    'Azlan',
    'demo-tip-002',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT OR IGNORE INTO "TipToLabel" ("tipId", "labelId")
VALUES
  ('tip_demo_01', 'label_02'),
  ('tip_demo_01', 'label_06'),
  ('tip_demo_02', 'label_05'),
  ('tip_demo_02', 'label_09');

-- Soalan IV
INSERT OR IGNORE INTO "Soalan" ("id", "content", "bidangId", "authorName", "authorToken", "createdAt", "updatedAt")
VALUES
  (
    'soalan_demo_01',
    'Bagaimana anda mengurus kelas yang mempunyai tahap pencapaian murid berbeza?',
    'bidang_01',
    'Cikgu Mira',
    'demo-soalan-001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'soalan_demo_02',
    'Apakah pendekatan anda untuk meningkatkan penglibatan murid dalam PdP?',
    'bidang_04',
    'Cikgu Daniel',
    'demo-soalan-002',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

-- Cara daftar steps
INSERT OR IGNORE INTO "CaraDaftarStep" ("id", "stepNo", "title", "content", "linkUrl", "createdAt", "updatedAt")
VALUES
  (
    'step_demo_01',
    1,
    'Buka Portal SPP',
    'Log masuk ke portal rasmi SPP dan pastikan maklumat profil asas anda lengkap.',
    'https://www.spp.gov.my/',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'step_demo_02',
    2,
    'Semak Iklan Jawatan',
    'Pilih jawatan yang sepadan dengan opsyen dan kelayakan akademik anda.',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'step_demo_03',
    3,
    'Hantar Permohonan',
    'Muat naik dokumen, semak semula borang, dan hantar sebelum tarikh tutup.',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
