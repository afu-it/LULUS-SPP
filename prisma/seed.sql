-- prisma/seed.sql
-- Seed data: admin user, default tip labels, default bidang list
-- Admin password: admin

-- ─── Admin ────────────────────────────────────────────────────────────────────
INSERT INTO "Admin" ("id", "username", "passwordHash")
VALUES ('admin_seed_001', 'admin', '$2a$10$QG5n/k3wHyA5oQpGZQbUtOfLLQus8ZqFYhQCbSO14xUkbUXCWBd9Va')
ON CONFLICT("username") DO UPDATE
SET "passwordHash" = excluded."passwordHash";

-- ─── Default TipLabels ────────────────────────────────────────────────────────
INSERT INTO "TipLabel" ("id", "name") VALUES ('label_01', 'Pemakaian');
INSERT INTO "TipLabel" ("id", "name") VALUES ('label_02', 'Tepati Masa');
INSERT INTO "TipLabel" ("id", "name") VALUES ('label_03', 'Tips Hotel / Parking');
INSERT INTO "TipLabel" ("id", "name") VALUES ('label_04', 'Cara Bercakap');
INSERT INTO "TipLabel" ("id", "name") VALUES ('label_05', 'Intonasi');
INSERT INTO "TipLabel" ("id", "name") VALUES ('label_06', 'Persediaan Dokumen');
INSERT INTO "TipLabel" ("id", "name") VALUES ('label_07', 'Keyakinan Diri');
INSERT INTO "TipLabel" ("id", "name") VALUES ('label_08', 'Penampilan');
INSERT INTO "TipLabel" ("id", "name") VALUES ('label_09', 'Soal Jawab');
INSERT INTO "TipLabel" ("id", "name") VALUES ('label_10', 'Lain-lain');

-- ─── Default Bidang ───────────────────────────────────────────────────────────
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_01', 'Bahasa Melayu');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_02', 'Bahasa Inggeris');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_03', 'Matematik');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_04', 'Sains');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_05', 'Pendidikan Islam');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_06', 'Sejarah');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_07', 'Geografi');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_08', 'Pendidikan Moral');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_09', 'Reka Bentuk & Teknologi (RBT)');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_10', 'Pendidikan Jasmani & Kesihatan (PJK)');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_11', 'Pendidikan Seni Visual');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_12', 'Muzik');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_13', 'Teknologi Maklumat & Komunikasi (TMK)');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_14', 'Bahasa Arab');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_15', 'Bahasa Tamil');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_16', 'Bahasa Cina');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_17', 'Prasekolah');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_18', 'Pendidikan Khas');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_19', 'Bimbingan & Kaunseling');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_20', 'Fizik');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_21', 'Kimia');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_22', 'Biologi');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_23', 'Perdagangan');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_24', 'Ekonomi');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_25', 'Perakaunan');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_26', 'Sains Komputer');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_27', 'Sains Sukan');
INSERT INTO "Bidang" ("id", "name") VALUES ('bidang_28', 'TVET');
