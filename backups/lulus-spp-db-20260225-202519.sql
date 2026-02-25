PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "Admin" VALUES('admin_seed_001','admin','$2a$10$sJ2giydQ3nqkqVk8/N5AyO/Zh59jC8eZubZT7tiaiSloh17NpQaLq','2026-02-25 10:10:45');
CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorToken" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "Post" VALUES('post_demo_01','Saya baru selesai temuduga. Fokus kepada struktur jawapan: pengenalan, isi utama, kesimpulan.','Cikgu Hani','demo-author-001',1,7,'2026-02-25 11:17:43','2026-02-25 11:17:43');
INSERT INTO "Post" VALUES('post_demo_02','Bawa salinan dokumen lebih daripada satu set. Sangat membantu jika ada semakan terakhir.','Ustaz Firdaus','demo-author-002',0,3,'2026-02-25 11:17:43','2026-02-25T11:19:04.116Z');
INSERT INTO "Post" VALUES('f724b7d4-c554-4fed-89fb-be7d3c79b514','Test','Tetamu','7611d256-6fbe-4bbd-9911-a763d18d2091',0,0,'2026-02-25T11:19:20.088Z','2026-02-25T11:19:20.088Z');
CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorToken" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "Comment" VALUES('comment_demo_01','Terima kasih, tips ini memang praktikal!','Aina','demo-commenter-001','post_demo_01','2026-02-25 11:17:43');
INSERT INTO "Comment" VALUES('comment_demo_02','Betul, saya pun bawa 3 salinan dokumen.','Rashid','demo-commenter-002','post_demo_02','2026-02-25 11:17:43');
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "Announcement" VALUES('announcement_demo_01','Semakan jadual temuduga SPP minggu ini: sila semak e-mel rasmi anda.',1,'2026-02-25 11:17:43','2026-02-25 11:17:43');
CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "link" TEXT,
    "authorName" TEXT NOT NULL,
    "authorToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "Note" VALUES('note_demo_01','Struktur Jawapan STAR','Gunakan Situation, Task, Action, Result untuk soalan pengalaman kerja.','https://example.com/star-method','Cikgu Fatin','demo-note-001','2026-02-25 11:17:43','2026-02-25 11:17:43');
INSERT INTO "Note" VALUES('note_demo_02','Checklist Dokumen','Kad pengenalan, sijil akademik, surat panggilan, dan dokumen sokongan lain.',NULL,'Cikgu Hakim','demo-note-002','2026-02-25 11:17:43','2026-02-25 11:17:43');
CREATE TABLE IF NOT EXISTS "Tip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "Tip" VALUES('tip_demo_01','Datang 30 minit awal supaya sempat bertenang dan semak dokumen.','Nadia','demo-tip-001','2026-02-25 11:17:43','2026-02-25 11:17:43');
INSERT INTO "Tip" VALUES('tip_demo_02','Intonasi stabil dan jelas membantu panel faham isi jawapan dengan cepat.','Azlan','demo-tip-002','2026-02-25 11:17:43','2026-02-25 11:17:43');
CREATE TABLE IF NOT EXISTS "TipLabel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "TipLabel" VALUES('label_01','Pemakaian');
INSERT INTO "TipLabel" VALUES('label_02','Tepati Masa');
INSERT INTO "TipLabel" VALUES('label_03','Tips Hotel / Parking');
INSERT INTO "TipLabel" VALUES('label_04','Cara Bercakap');
INSERT INTO "TipLabel" VALUES('label_05','Intonasi');
INSERT INTO "TipLabel" VALUES('label_06','Persediaan Dokumen');
INSERT INTO "TipLabel" VALUES('label_07','Keyakinan Diri');
INSERT INTO "TipLabel" VALUES('label_08','Penampilan');
INSERT INTO "TipLabel" VALUES('label_09','Soal Jawab');
INSERT INTO "TipLabel" VALUES('label_10','Lain-lain');
CREATE TABLE IF NOT EXISTS "TipToLabel" (
    "tipId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    PRIMARY KEY ("tipId", "labelId"),
    CONSTRAINT "TipToLabel_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "Tip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TipToLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "TipLabel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "TipToLabel" VALUES('tip_demo_01','label_02');
INSERT INTO "TipToLabel" VALUES('tip_demo_01','label_06');
INSERT INTO "TipToLabel" VALUES('tip_demo_02','label_05');
INSERT INTO "TipToLabel" VALUES('tip_demo_02','label_09');
CREATE TABLE IF NOT EXISTS "Soalan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "bidangId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Soalan_bidangId_fkey" FOREIGN KEY ("bidangId") REFERENCES "Bidang" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "Soalan" VALUES('soalan_demo_01','Bagaimana anda mengurus kelas yang mempunyai tahap pencapaian murid berbeza?','bidang_01','Cikgu Mira','demo-soalan-001','2026-02-25 11:17:43','2026-02-25 11:17:43');
INSERT INTO "Soalan" VALUES('soalan_demo_02','Apakah pendekatan anda untuk meningkatkan penglibatan murid dalam PdP?','bidang_04','Cikgu Daniel','demo-soalan-002','2026-02-25 11:17:43','2026-02-25 11:17:43');
CREATE TABLE IF NOT EXISTS "Bidang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "Bidang" VALUES('bidang_01','Bahasa Melayu');
INSERT INTO "Bidang" VALUES('bidang_02','Bahasa Inggeris');
INSERT INTO "Bidang" VALUES('bidang_03','Matematik');
INSERT INTO "Bidang" VALUES('bidang_04','Sains');
INSERT INTO "Bidang" VALUES('bidang_05','Pendidikan Islam');
INSERT INTO "Bidang" VALUES('bidang_06','Sejarah');
INSERT INTO "Bidang" VALUES('bidang_07','Geografi');
INSERT INTO "Bidang" VALUES('bidang_08','Pendidikan Moral');
INSERT INTO "Bidang" VALUES('bidang_09','Reka Bentuk & Teknologi (RBT)');
INSERT INTO "Bidang" VALUES('bidang_10','Pendidikan Jasmani & Kesihatan (PJK)');
INSERT INTO "Bidang" VALUES('bidang_11','Pendidikan Seni Visual');
INSERT INTO "Bidang" VALUES('bidang_12','Muzik');
INSERT INTO "Bidang" VALUES('bidang_13','Teknologi Maklumat & Komunikasi (TMK)');
INSERT INTO "Bidang" VALUES('bidang_14','Bahasa Arab');
INSERT INTO "Bidang" VALUES('bidang_15','Bahasa Tamil');
INSERT INTO "Bidang" VALUES('bidang_16','Bahasa Cina');
INSERT INTO "Bidang" VALUES('bidang_17','Prasekolah');
INSERT INTO "Bidang" VALUES('bidang_18','Pendidikan Khas');
INSERT INTO "Bidang" VALUES('bidang_19','Bimbingan & Kaunseling');
INSERT INTO "Bidang" VALUES('bidang_20','Fizik');
INSERT INTO "Bidang" VALUES('bidang_21','Kimia');
INSERT INTO "Bidang" VALUES('bidang_22','Biologi');
INSERT INTO "Bidang" VALUES('bidang_23','Perdagangan');
INSERT INTO "Bidang" VALUES('bidang_24','Ekonomi');
INSERT INTO "Bidang" VALUES('bidang_25','Perakaunan');
INSERT INTO "Bidang" VALUES('bidang_26','Sains Komputer');
INSERT INTO "Bidang" VALUES('bidang_27','Sains Sukan');
INSERT INTO "Bidang" VALUES('bidang_28','TVET');
CREATE TABLE IF NOT EXISTS "CaraDaftarStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepNo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "linkUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "CaraDaftarStep" VALUES('step_demo_01',1,'Buka Portal SPP','Log masuk ke portal rasmi SPP dan pastikan maklumat profil asas anda lengkap.','https://www.spp.gov.my/','2026-02-25 11:17:43','2026-02-25 11:17:43');
INSERT INTO "CaraDaftarStep" VALUES('step_demo_02',2,'Semak Iklan Jawatan','Pilih jawatan yang sepadan dengan opsyen dan kelayakan akademik anda.',NULL,'2026-02-25 11:17:43','2026-02-25 11:17:43');
INSERT INTO "CaraDaftarStep" VALUES('step_demo_03',3,'Hantar Permohonan','Muat naik dokumen, semak semula borang, dan hantar sebelum tarikh tutup.',NULL,'2026-02-25 11:17:43','2026-02-25 11:17:43');
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");
CREATE UNIQUE INDEX "TipLabel_name_key" ON "TipLabel"("name");
CREATE UNIQUE INDEX "Bidang_name_key" ON "Bidang"("name");
