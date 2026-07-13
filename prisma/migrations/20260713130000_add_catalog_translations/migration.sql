-- Localized (fa) catalog content. The base `categories`/`products` rows stay the
-- canonical default-locale (English) copy; these side tables overlay Persian text,
-- resolved per request by the repositories (see PrismaProductRepository.localizeProducts
-- / PrismaCategoryRepository.localizeCategories). Adding a locale later is a data-only
-- change — no schema change. `*_id` are plain references (the schema's loose coupling),
-- so a translation for a since-deleted row is harmless (never read).

-- CreateTable
CREATE TABLE "category_translations" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_translations" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "description" TEXT,
    "nutrition" TEXT,
    "origin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_translations_category_id_idx" ON "category_translations"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_translations_category_id_locale_key" ON "category_translations"("category_id", "locale");

-- CreateIndex
CREATE INDEX "product_translations_product_id_idx" ON "product_translations"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_translations_product_id_locale_key" ON "product_translations"("product_id", "locale");

-- Seed: Persian (fa) category names.
INSERT INTO "category_translations" ("id", "category_id", "locale", "name", "updated_at") VALUES
  ('ct-1-fa',  '1',  'fa', 'سبزیجات',        CURRENT_TIMESTAMP),
  ('ct-2-fa',  '2',  'fa', 'لبنیات',          CURRENT_TIMESTAMP),
  ('ct-3-fa',  '3',  'fa', 'گوشت و ماهی',     CURRENT_TIMESTAMP),
  ('ct-4-fa',  '4',  'fa', 'غلات و حبوبات',   CURRENT_TIMESTAMP),
  ('ct-5-fa',  '5',  'fa', 'نوشیدنی‌ها',      CURRENT_TIMESTAMP),
  ('ct-6-fa',  '6',  'fa', 'میوه‌ها',          CURRENT_TIMESTAMP),
  ('ct-7-fa',  '7',  'fa', 'ادویه‌جات',        CURRENT_TIMESTAMP),
  ('ct-8-fa',  '8',  'fa', 'سس‌ها',            CURRENT_TIMESTAMP),
  ('ct-9-fa',  '9',  'fa', 'اسپاگتی',          CURRENT_TIMESTAMP),
  ('ct-10-fa', '10', 'fa', 'نان',              CURRENT_TIMESTAMP),
  ('ct-11-fa', '11', 'fa', 'شیرینی و شکلات',  CURRENT_TIMESTAMP),
  ('ct-12-fa', '12', 'fa', 'مربا',             CURRENT_TIMESTAMP),
  ('ct-13-fa', '13', 'fa', 'نوشیدنی الکلی',   CURRENT_TIMESTAMP),
  ('ct-14-fa', '14', 'fa', 'چای',              CURRENT_TIMESTAMP),
  ('ct-15-fa', '15', 'fa', 'سوسیس',            CURRENT_TIMESTAMP),
  ('ct-16-fa', '16', 'fa', 'آبنبات',           CURRENT_TIMESTAMP),
  ('ct-17-fa', '17', 'fa', 'صابون',            CURRENT_TIMESTAMP),
  ('ct-18-fa', '18', 'fa', 'روغن',             CURRENT_TIMESTAMP)
ON CONFLICT ("category_id", "locale") DO NOTHING;

-- Seed: Persian (fa) product names + units. description/nutrition/origin are NULL for
-- every row except the cage-free eggs (2-1) — the only genuinely authored copy; all
-- other products fall through to the localized accordion fallback (product.info*Fallback).
INSERT INTO "product_translations" ("id", "product_id", "locale", "name", "unit", "description", "nutrition", "origin", "updated_at") VALUES
  ('pt-1-1-fa',  '1-1',  'fa', 'اسفناج تازه ارگانیک',          'بسته ۲۰۰ گرمی',   NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-1-2-fa',  '1-2',  'fa', 'کلم بروکلی تازه',              '۵۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-1-3-fa',  '1-3',  'fa', 'گوجه‌فرنگی خوشه‌ای',           '۱ کیلوگرم',        NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-1-4-fa',  '1-4',  'fa', 'هویج تازه',                    'بسته ۱ کیلوگرمی',  NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-2-1-fa',  '2-1',  'fa', 'تخم‌مرغ قهوه‌ای درشت بدون قفس', '۱۲ عدد',
    'یک دوجین تخم‌مرغ درشت با پوستهٔ قهوه‌ای از مرغ‌های آزاد و بدون قفس. سفیدهٔ سفت و زردهٔ طلایی و خوش‌رنگ، مناسب برای هر کاری از شیرینی‌پزی تا صبحانهٔ آخر هفته.',
    'در هر تخم‌مرغ: ۷۲ کیلوکالری · ۶ گرم پروتئین · ۵ گرم چربی · ۰ گرم کربوهیدرات. منبعی طبیعی از ویتامین B12، کولین و سلنیوم.',
    'تولیدشده توسط مرغ‌های بدون قفس که با رژیم گیاهی در مزارع خانوادگی پرورش یافته‌اند، بدون هورمون یا آنتی‌بیوتیک افزوده.',
    CURRENT_TIMESTAMP),
  ('pt-2-2-fa',  '2-2',  'fa', 'ماست یونانی فاگه',             'ظرف ۵۰۰ گرمی',     NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-2-3-fa',  '2-3',  'fa', 'شیر پرچرب',                    'بطری ۲ لیتری',     NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-2-4-fa',  '2-4',  'fa', 'پنیر چدار کهنه',               '۴۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-2-5-fa',  '2-5',  'fa', 'کره نمکی',                     '۲۵۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-3-1-fa',  '3-1',  'fa', 'فیله ماهی سالمون نروژی',       '۵۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-3-2-fa',  '3-2',  'fa', 'فیله سینه مرغ',                '۱ کیلوگرم',        NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-3-3-fa',  '3-3',  'fa', 'گوشت چرخ‌کرده کم‌چرب',         '۵۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-3-4-fa',  '3-4',  'fa', 'فیله ماهی کاد اطلس',           '۴۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-4-1-fa',  '4-1',  'fa', 'برنج باسماتی',                 '۲ کیلوگرم',        NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-4-2-fa',  '4-2',  'fa', 'عدس قرمز',                     '۱ کیلوگرم',        NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-4-3-fa',  '4-3',  'fa', 'جو دوسر پرک',                  '۱ کیلوگرم',        NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-4-4-fa',  '4-4',  'fa', 'نخود',                         'قوطی ۴۰۰ گرمی',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-5-1-fa',  '5-1',  'fa', 'آب معدنی گازدار',              '۱ لیتر',           NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-5-2-fa',  '5-2',  'fa', 'آب‌پرتقال تازه',               '۱ لیتر',           NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-5-3-fa',  '5-3',  'fa', 'نوشابه کولا کلاسیک',           '۱.۵ لیتر',         NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-5-4-fa',  '5-4',  'fa', 'چای سرد لیمو',                 '۱ لیتر',           NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-6-1-fa',  '6-1',  'fa', 'موز',                          'دستهٔ ۱ کیلوگرمی', NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-6-2-fa',  '6-2',  'fa', 'سیب رویال گالا',               'بسته ۶ عددی',      NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-6-3-fa',  '6-3',  'fa', 'انگور بی‌دانه',                '۵۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-6-4-fa',  '6-4',  'fa', 'پرتقال ناف',                   '۱ کیلوگرم',        NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-7-1-fa',  '7-1',  'fa', 'پودر فلفل قرمز',               'شیشه ۴۵ گرمی',     NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-7-2-fa',  '7-2',  'fa', 'زیره سبز آسیاب‌شده',           'شیشه ۵۰ گرمی',     NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-7-3-fa',  '7-3',  'fa', 'پودر زردچوبه',                 'شیشه ۶۰ گرمی',     NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-7-4-fa',  '7-4',  'fa', 'فلفل سیاه خردشده',             'آسیاب ۵۰ گرمی',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-8-1-fa',  '8-1',  'fa', 'سس ماکارونی گوجه‌فرنگی',       'شیشه ۵۰۰ گرمی',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-8-2-fa',  '8-2',  'fa', 'سس سویا ملایم',                '۳۰۰ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-8-3-fa',  '8-3',  'fa', 'سس باربیکیو دودی',             '۴۵۰ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-8-4-fa',  '8-4',  'fa', 'سس تند سریراچا',               '۴۵۵ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-9-1-fa',  '9-1',  'fa', 'اسپاگتی گندم دوروم',           '۵۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-9-2-fa',  '9-2',  'fa', 'اسپاگتی سبوس‌دار',             '۵۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-9-3-fa',  '9-3',  'fa', 'اسپاگتی شماره ۵',              '۵۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-9-4-fa',  '9-4',  'fa', 'تالیاتله تخم‌مرغی',            '۲۵۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-10-1-fa', '10-1', 'fa', 'نان خمیرترش',                  '۴۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-10-2-fa', '10-2', 'fa', 'نان سبوس‌دار',                 '۸۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-10-3-fa', '10-3', 'fa', 'کروسان کره‌ای',                'بسته ۴ عددی',      NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-10-4-fa', '10-4', 'fa', 'بیگل کنجدی',                   'بسته ۵ عددی',      NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-11-1-fa', '11-1', 'fa', 'شکلات شیری تخته‌ای',           '۱۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-11-2-fa', '11-2', 'fa', 'پاستیل خرسی',                  '۲۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-11-3-fa', '11-3', 'fa', 'تافی کارامل',                  '۲۵۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-11-4-fa', '11-4', 'fa', 'بیسکویت کره‌ای',               '۳۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-12-1-fa', '12-1', 'fa', 'مربای توت‌فرنگی',              'شیشه ۳۴۰ گرمی',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-12-2-fa', '12-2', 'fa', 'مربای زردآلو',                 'شیشه ۳۴۰ گرمی',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-12-3-fa', '12-3', 'fa', 'مربای تمشک',                   'شیشه ۳۴۰ گرمی',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-12-4-fa', '12-4', 'fa', 'مارمالاد پرتقال',              'شیشه ۳۴۰ گرمی',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-13-1-fa', '13-1', 'fa', 'آبجو لاگر دست‌ساز',            '۴ عدد ۳۳۰ میلی‌لیتری', NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-13-2-fa', '13-2', 'fa', 'شراب قرمز کابرنه',             '۷۵۰ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-13-3-fa', '13-3', 'fa', 'شراب سفید سووینیون بلان',      '۷۵۰ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-13-4-fa', '13-4', 'fa', 'ویسکی سینگل مالت',             '۷۰۰ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-14-1-fa', '14-1', 'fa', 'چای ارل گری',                  '۴۰ عدد',           NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-14-2-fa', '14-2', 'fa', 'چای سبز خالص',                 '۴۰ عدد',           NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-14-3-fa', '14-3', 'fa', 'دمنوش بابونه',                 '۲۰ عدد',           NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-14-4-fa', '14-4', 'fa', 'چای انگلیسی صبحانه',           '۸۰ عدد',           NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-15-1-fa', '15-1', 'fa', 'سوسیس گوشت خوک',               'بسته ۶ عددی',      NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-15-2-fa', '15-2', 'fa', 'سوسیس مرغ',                    'بسته ۶ عددی',      NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-15-3-fa', '15-3', 'fa', 'چوریتسو تند',                  '۲۲۵ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-15-4-fa', '15-4', 'fa', 'براتوورست گوشت گاو',           'بسته ۴ عددی',      NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-16-1-fa', '16-1', 'fa', 'آبنبات چوبی رنگین‌کمانی',      'بسته ۱۰ عددی',     NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-16-2-fa', '16-2', 'fa', 'پاستیل کرمی ترش',              '۱۸۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-16-3-fa', '16-3', 'fa', 'آبنبات ژله‌ای',                '۲۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-16-4-fa', '16-4', 'fa', 'تافی نرم',                     '۲۵۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-17-1-fa', '17-1', 'fa', 'صابون اسطوخودوس',              '۱۰۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-17-2-fa', '17-2', 'fa', 'مایع دستشویی آلوئه‌ورا',       '۳۰۰ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-17-3-fa', '17-3', 'fa', 'صابون زغالی پاک‌کننده',        '۱۲۰ گرم',          NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-17-4-fa', '17-4', 'fa', 'شامپو بدن نارگیل',             '۴۰۰ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-18-1-fa', '18-1', 'fa', 'روغن زیتون فرابکر',            '۷۵۰ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-18-2-fa', '18-2', 'fa', 'روغن آفتابگردان',              '۱ لیتر',           NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-18-3-fa', '18-3', 'fa', 'روغن نارگیل بکر',              '۵۰۰ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('pt-18-4-fa', '18-4', 'fa', 'روغن کنجد بوداده',             '۲۵۰ میلی‌لیتر',    NULL, NULL, NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("product_id", "locale") DO NOTHING;
