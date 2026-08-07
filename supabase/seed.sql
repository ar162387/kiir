-- Starter content for the KIIR public site.
--
-- This is realistic placeholder editorial content (carried over from the
-- Claude Design mockup dataset), NOT a migration of the real 100 CMS
-- records recovered from the old AnywebCMS site. See PROJECT-NOTES.md §7 —
-- the real archive needs a human pass (33 unmatched records, messy/duplicated
-- category tags, embedded absolute image URLs from three different dead
-- domains) before it's safe to import wholesale. This seed exists so the
-- app has a full, working, bilingual homepage/program/article experience
-- out of the box; swap it for the real archive via the same table shape.
--
-- Run after 0001_public_site.sql:  supabase db execute -f supabase/seed.sql

-- ---------------------------------------------------------------------------
-- categories (the 7 KIIR program areas)
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, name_ur, description, description_ur, long_description, long_description_ur, icon, image_url, sort_order)
values
  ('political-development', 'Political Development', 'سیاسی ترقی',
   'Strengthening democratic practice, representation and civic participation in Jammu & Kashmir.',
   'جموں و کشمیر میں جمہوری عمل، نمائندگی اور شہری شرکت کو مضبوط بنانا۔',
   'Work under Political Development supports inclusive political processes in Jammu & Kashmir — party dialogue, youth political literacy, election observation and constituency-level advocacy — with an emphasis on voices excluded from formal negotiation tracks.',
   'یہ پروگرام جموں و کشمیر میں شامل سیاسی عمل کی حمایت کرتا ہے — جماعتی مکالمہ، نوجوانوں کی سیاسی خواندگی، انتخابی مشاہدہ اور حلقہ سطح پر وکالت — خاص طور پر ان آوازوں پر زور دیتے ہوئے جو رسمی مذاکرات سے باہر رہ جاتی ہیں۔',
   '◆', '/photos/3_1623823321.jpg', 1),
  ('media-development', 'Media Development', 'میڈیا کی ترقی',
   'Training journalists and countering disinformation on the conflict.',
   'صحافیوں کی تربیت اور تنازعے سے متعلق غلط معلومات کا مقابلہ۔',
   'Media Development builds the capacity of reporters, editors and citizen journalists covering the conflict: safety training, conflict-sensitive reporting standards, fact-checking labs and support for independent local outlets.',
   'میڈیا ڈیولپمنٹ تنازعے کی کوریج کرنے والے رپورٹرز، ایڈیٹرز اور شہری صحافیوں کی استعداد بڑھاتا ہے: سیفٹی تربیت، تنازعہ حساس رپورٹنگ کے معیار، فیکٹ چیکنگ لیبز اور آزاد مقامی اداروں کی معاونت۔',
   '▣', '/photos/4_1623823333.jpg', 2),
  ('gender', 'Gender', 'صنف',
   'Women, peace and security — documentation, leadership and redress.',
   'خواتین، امن و سلامتی — دستاویز سازی، قیادت اور انصاف۔',
   'The Gender program documents conflict-related sexual violence, supports women-led peace committees, and advances the Women, Peace and Security agenda across our advocacy at the OIC, UN and national forums.',
   'صنف پروگرام تنازعے سے جڑے تشدد کی دستاویز سازی کرتا ہے، خواتین کی زیرِ قیادت امن کمیٹیوں کی معاونت کرتا ہے اور او آئی سی، اقوام متحدہ اور قومی فورمز پر خواتین، امن و سلامتی کے ایجنڈے کو آگے بڑھاتا ہے۔',
   '●', '/photos/1_1623823318.jpg', 3),
  ('capacity-building-idps', 'Capacity Building of IDPs', 'بے گھر افراد کی استعداد کاری',
   'Livelihoods, legal aid and skills for internally displaced families.',
   'بے گھر خاندانوں کے لیے روزگار، قانونی معاونت اور ہنر۔',
   'Working with displaced communities along the Line of Control and in urban settlements, this program combines vocational training, legal aid clinics and documentation of displacement to support durable solutions.',
   'لائن آف کنٹرول کے ساتھ اور شہری بستیوں میں بے گھر کمیونٹیز کے ساتھ کام کرتے ہوئے یہ پروگرام پیشہ ورانہ تربیت، قانونی امداد کے کلینک اور بے گھری کی دستاویز سازی کو یکجا کرتا ہے۔',
   '◇', '/photos/3_1624254303.jpg', 4),
  ('disaster-risk-reduction', 'Disaster Risk Reduction', 'آفات کے خطرات میں کمی',
   'Community preparedness in a seismically and climatically fragile region.',
   'زلزلوں اور موسمی خطرات کے شکار علاقے میں کمیونٹی کی تیاری۔',
   'Disaster Risk Reduction trains village committees in hazard mapping, early warning and evacuation planning, and advocates for conflict-sensitive humanitarian access in a region exposed to earthquakes, floods and glacial melt.',
   'آفات کے خطرات میں کمی کا پروگرام گاؤں کمیٹیوں کو خطرات کی نقشہ سازی، ابتدائی وارننگ اور انخلا کی منصوبہ بندی کی تربیت دیتا ہے اور انسانی رسائی کی وکالت کرتا ہے۔',
   '△', '/photos/5_1623823336.jpg', 5),
  ('conflict-resolution', 'Conflict Resolution', 'تنازعات کا حل',
   'Track-II dialogue, mediation research and confidence-building measures.',
   'ٹریک ٹو مکالمہ، ثالثی پر تحقیق اور اعتماد سازی کے اقدامات۔',
   'Conflict Resolution convenes Track-II dialogues between scholars and former officials, researches applicable models of self-determination and mediation, and proposes practical confidence-building measures across the Line of Control.',
   'یہ پروگرام ماہرین اور سابق حکام کے درمیان ٹریک ٹو مکالمے منعقد کرتا ہے، حقِ خود ارادیت اور ثالثی کے قابلِ عمل ماڈلز پر تحقیق کرتا ہے اور لائن آف کنٹرول پر عملی اعتماد سازی کی تجاویز دیتا ہے۔',
   '⬡', '/photos/4_1624254303.jpg', 6),
  ('human-rights', 'Human Rights', 'انسانی حقوق',
   'Monitoring, documentation and international advocacy on violations.',
   'خلاف ورزیوں کی نگرانی، دستاویز سازی اور بین الاقوامی وکالت۔',
   'Our largest program monitors and documents violations in Jammu & Kashmir, files submissions to UN treaty bodies and special procedures, and briefs parliaments and human rights councils on the ground situation.',
   'ہمارا سب سے بڑا پروگرام جموں و کشمیر میں خلاف ورزیوں کی نگرانی و دستاویز سازی کرتا ہے، اقوام متحدہ کے اداروں کو رپورٹس جمع کراتا ہے اور پارلیمنٹس و انسانی حقوق کونسلز کو بریفنگ دیتا ہے۔',
   '◈', '/photos/3_1624014649.jpg', 7)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- content_items
-- ---------------------------------------------------------------------------
insert into public.content_items
  (slug, type, title, title_ur, short_description, short_description_ur, item_date, priority, is_featured, thumbnail_url)
values
  ('un-hrc-58-oral-statement', 'news_publication',
   'KIIR delivers oral statement at the 58th session of the UN Human Rights Council',
   'کے آئی آئی آر نے اقوام متحدہ کی انسانی حقوق کونسل کے 58ویں اجلاس میں زبانی بیان دیا',
   'Our delegation presented three years of verified documentation on detentions, communications shutdowns and restrictions on assembly, and called for renewed monitoring access.',
   'ہمارے وفد نے حراستوں، مواصلاتی بندش اور اجتماع پر پابندیوں سے متعلق تین سالہ مصدقہ دستاویزات پیش کیں اور نگرانی کی رسائی بحال کرنے کا مطالبہ کیا۔',
   '2026-07-28', 1, true, '/photos/img4_1623310502.jpg'),
  ('women-peace-committees-baseline', 'publication',
   'Baseline study: women-led peace committees across nine districts',
   'بنیادی مطالعہ: نو اضلاع میں خواتین کی زیرِ قیادت امن کمیٹیاں',
   'A 64-page assessment of how local women''s committees mediate disputes, and what recognition they still lack.',
   'مقامی خواتین کی کمیٹیاں تنازعات میں کیسے ثالثی کرتی ہیں، اس پر 64 صفحات کا جائزہ۔',
   '2026-07-19', 2, true, '/photos/1_1623822608.jpg'),
  ('safety-training-journalists-muzaffarabad', 'activity',
   'Three-day safety and verification training for 28 local journalists',
   '28 مقامی صحافیوں کے لیے تین روزہ سیفٹی اور تصدیق کی تربیت',
   'Held in Muzaffarabad with a focus on digital security, sourcing under pressure and trauma-aware interviewing.',
   'مظفرآباد میں ڈیجیٹل سیکیورٹی اور محفوظ انٹرویو پر مرکوز تربیت۔',
   '2026-07-11', 3, true, '/photos/1_1623823647.jpg'),
  ('roundtable-loc-cbms', 'event',
   'Roundtable: reviving confidence-building measures across the Line of Control',
   'گول میز: لائن آف کنٹرول پر اعتماد سازی کے اقدامات کی بحالی',
   'Former diplomats, traders and scholars assess which crossing-point and trade measures could realistically be restored.',
   'سابق سفارت کار اور ماہرین قابلِ عمل اقدامات کا جائزہ لیں گے۔',
   '2026-09-04', 4, true, null),
  ('idp-legal-aid-clinic', 'activity',
   'Mobile legal aid clinic reaches 340 displaced families',
   'موبائل لیگل ایڈ کلینک 340 بے گھر خاندانوں تک پہنچا',
   'Documentation support for compensation claims, school enrolment and property records.',
   'معاوضے کے دعووں اور جائیداد کے ریکارڈ کے لیے معاونت۔',
   '2026-06-30', 5, true, '/photos/4_1623822611.jpg'),

  ('youth-political-literacy-cohort-7', 'activity',
   'Seventh youth political literacy cohort graduates in Rawalakot',
   'راولاکوٹ میں ساتویں نوجوان سیاسی خواندگی کورس کی تکمیل',
   'Forty-two participants completed eight weeks on constitutional frameworks, local governance and public deliberation, closing with mock council hearings.',
   'بیالیس شرکاء نے آٹھ ہفتوں کا کورس مکمل کیا۔',
   '2026-07-25', 10, false, '/photos/2_1623823647.jpg'),
  ('submission-cedaw-periodic-review', 'news_publication',
   'Shadow submission filed ahead of the CEDAW periodic review',
   'سیڈا کے وقتی جائزے سے قبل شیڈو رپورٹ جمع کرائی گئی',
   'The 31-page submission compiles testimony from 96 women on access to justice, movement restrictions and the status of half-widows.',
   '96 خواتین کی گواہی پر مشتمل 31 صفحات کی رپورٹ۔',
   '2026-07-22', 11, false, null),
  ('flood-preparedness-neelum', 'activity',
   'Hazard mapping with eleven village committees in the Neelum valley',
   'وادی نیلم میں گیارہ گاؤں کمیٹیوں کے ساتھ خطرات کی نقشہ سازی',
   'Participatory mapping produced evacuation routes and early-warning rosters ahead of the monsoon, coordinated with district authorities.',
   'مون سون سے قبل انخلا کے راستے اور وارننگ رجسٹر تیار کیے گئے۔',
   '2026-07-16', 12, false, '/photos/5_1623823650.jpg'),
  ('fact-checking-lab-launch', 'event',
   'Launch of the Kashmir fact-checking lab with five partner newsrooms',
   'پانچ نیوز رومز کے ساتھ کشمیر فیکٹ چیکنگ لیب کا آغاز',
   'A shared verification desk for claims circulating about the conflict, with a public methodology and a weekly bulletin.',
   'عوامی طریقہ کار اور ہفتہ وار بلیٹن کے ساتھ مشترکہ تصدیقی ڈیسک۔',
   '2026-08-21', 13, false, '/photos/1_1624254300.jpg'),
  ('quarterly-detention-monitor-q2', 'publication',
   'Quarterly detention monitor: April–June 2026',
   'سہ ماہی حراستی مانیٹر: اپریل تا جون 2026',
   'Verified case data on preventive detentions, with methodology notes and a comparison against the preceding four quarters.',
   'احتیاطی حراستوں کے مصدقہ اعداد و شمار اور طریقہ کار کے نوٹس۔',
   '2026-07-08', 14, false, null),
  ('track-two-dialogue-round-nine', 'activity',
   'Ninth round of Track-II dialogue convened in Islamabad',
   'اسلام آباد میں ٹریک ٹو مکالمے کا نواں دور',
   'Sixteen participants from both sides of the Line of Control discussed humanitarian access, prisoner releases and academic exchange.',
   'سولہ شرکاء نے انسانی رسائی اور قیدیوں کی رہائی پر بات کی۔',
   '2026-06-27', 15, false, '/photos/3_1623823648.jpg'),
  ('vocational-skills-idp-women', 'activity',
   'Vocational skills programme for displaced women concludes its second year',
   'بے گھر خواتین کے لیے ہنر مندی پروگرام کا دوسرا سال مکمل',
   'Tailoring, embroidery and small-enterprise training for 210 women, with market linkage support in three towns.',
   '210 خواتین کے لیے تربیت اور مارکیٹ روابط کی معاونت۔',
   '2026-06-14', 16, false, '/photos/6_1623822611.jpg'),
  ('oic-contact-group-briefing', 'news_publication',
   'Briefing to the OIC Contact Group on Jammu & Kashmir',
   'او آئی سی کنٹیکٹ گروپ کو بریفنگ',
   'A summary of our recommendations on monitoring access, humanitarian corridors and the protection of journalists.',
   'نگرانی کی رسائی اور صحافیوں کے تحفظ سے متعلق سفارشات کا خلاصہ۔',
   '2026-05-30', 17, false, '/photos/5_1623822611.jpg'),
  ('annual-peacebuilding-symposium', 'event',
   'Annual peacebuilding symposium: registration opens',
   'سالانہ امن سازی سمپوزیم: رجسٹریشن کا آغاز',
   'Two days of panels on self-determination, transitional justice and regional trade, with delegates from twelve countries.',
   'بارہ ممالک کے مندوبین کے ساتھ دو روزہ اجلاس۔',
   '2026-10-15', 18, false, '/photos/2_1624254300.jpg'),
  ('community-radio-pilot', 'activity',
   'Community radio pilot brings local reporting to four valleys',
   'کمیونٹی ریڈیو پائلٹ چار وادیوں تک',
   'Volunteer reporters produce weekly programming on service delivery, disaster preparedness and women''s access to health care.',
   'رضاکار رپورٹر ہفتہ وار پروگرام تیار کرتے ہیں۔',
   '2026-05-18', 19, false, '/photos/4_1623823649.jpg')
on conflict (slug) do nothing;

-- article body copy for the one item the design gives full long-form text to
update public.content_items set
  body = '<p>The delegation opened by placing on record the volume of verified material gathered since the last review cycle: 1,240 individual case files, 96 direct testimonies, and a district-level dataset on communications restrictions maintained continuously since 2023.</p>' ||
         '<p>Three recommendations followed. First, that unimpeded access be granted to independent monitors, including the Office of the High Commissioner. Second, that preventive detention provisions be reviewed against treaty obligations, with published statistics on their use. Third, that journalists working on the conflict be recognised as a category requiring specific protection.</p>' ||
         '<p>Delegates from four member states referenced KIIR''s quarterly detention monitor in their interventions, and two asked for the underlying methodology to be circulated to the Council secretariat.</p>' ||
         '<blockquote>Documentation is not only a record. It is the evidentiary floor on which any future peace process will have to stand.</blockquote>' ||
         '<p>A written version of the statement, together with annexes on methodology and a summary in Urdu, is available for download and may be republished with attribution.</p>' ||
         '<p>KIIR will return to the Council in the March session with an updated dataset and a companion submission on the situation of internally displaced families.</p>',
  body_ur = '<p>وفد نے گزشتہ جائزے کے بعد جمع کیے گئے مصدقہ مواد کی تفصیل پیش کی: 1,240 انفرادی مقدمات، 96 براہِ راست گواہیاں، اور مواصلاتی پابندیوں سے متعلق ضلعی سطح کا مسلسل ڈیٹا۔</p>' ||
            '<p>تین سفارشات پیش کی گئیں: آزاد مبصرین کو بلا رکاوٹ رسائی، احتیاطی حراست کے قوانین کا بین الاقوامی معیارات کی روشنی میں جائزہ، اور تنازعے پر کام کرنے والے صحافیوں کے لیے مخصوص تحفظ۔</p>' ||
            '<p>چار رکن ممالک کے مندوبین نے اپنے بیانات میں کے آئی آئی آر کے سہ ماہی حراستی مانیٹر کا حوالہ دیا۔</p>' ||
            '<blockquote>دستاویز سازی صرف ریکارڈ نہیں؛ یہ مستقبل کے کسی بھی امن عمل کی بنیاد ہے۔</blockquote>' ||
            '<p>بیان کا تحریری متن، طریقہ کار کے ضمیمے اور اردو خلاصہ ڈاؤن لوڈ کے لیے دستیاب ہے۔</p>' ||
            '<p>کے آئی آئی آر مارچ کے اجلاس میں تازہ ڈیٹا کے ساتھ دوبارہ شریک ہوگا۔</p>'
where slug = 'un-hrc-58-oral-statement';

-- ---------------------------------------------------------------------------
-- content_item_categories tag map
-- ---------------------------------------------------------------------------
insert into public.content_item_categories (content_item_id, category_id)
select ci.id, c.id
from (values
  ('un-hrc-58-oral-statement', 'human-rights'),
  ('un-hrc-58-oral-statement', 'political-development'),
  ('women-peace-committees-baseline', 'gender'),
  ('women-peace-committees-baseline', 'conflict-resolution'),
  ('safety-training-journalists-muzaffarabad', 'media-development'),
  ('roundtable-loc-cbms', 'conflict-resolution'),
  ('roundtable-loc-cbms', 'political-development'),
  ('idp-legal-aid-clinic', 'capacity-building-idps'),
  ('idp-legal-aid-clinic', 'human-rights'),
  ('youth-political-literacy-cohort-7', 'political-development'),
  ('youth-political-literacy-cohort-7', 'capacity-building-idps'),
  ('submission-cedaw-periodic-review', 'gender'),
  ('submission-cedaw-periodic-review', 'human-rights'),
  ('flood-preparedness-neelum', 'disaster-risk-reduction'),
  ('fact-checking-lab-launch', 'media-development'),
  ('fact-checking-lab-launch', 'human-rights'),
  ('quarterly-detention-monitor-q2', 'human-rights'),
  ('track-two-dialogue-round-nine', 'conflict-resolution'),
  ('vocational-skills-idp-women', 'capacity-building-idps'),
  ('vocational-skills-idp-women', 'gender'),
  ('oic-contact-group-briefing', 'human-rights'),
  ('oic-contact-group-briefing', 'political-development'),
  ('annual-peacebuilding-symposium', 'conflict-resolution'),
  ('annual-peacebuilding-symposium', 'political-development'),
  ('community-radio-pilot', 'media-development'),
  ('community-radio-pilot', 'disaster-risk-reduction')
) as tag(item_slug, cat)
join public.content_items ci on ci.slug = tag.item_slug
join public.categories c on c.slug = tag.cat
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- site_settings
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value) values
  ('org', jsonb_build_object(
    'name', 'Kashmir Institute of International Relations',
    'name_ur', 'کشمیر انسٹیٹیوٹ آف انٹرنیشنل ریلیشنز',
    'tagline', 'Peace through dialogue',
    'tagline_ur', 'مکالمے کے ذریعے امن',
    'strapline', 'Islamabad · Est. 1990 · Research, advocacy & peacebuilding on Kashmir',
    'strapline_ur', 'اسلام آباد · قائم 1990 · کشمیر پر تحقیق، وکالت اور امن سازی',
    'blurb', 'An independent think tank documenting the Kashmir conflict, human rights and pathways to peace.',
    'blurb_ur', 'ایک آزاد تھنک ٹینک جو کشمیر تنازعہ، انسانی حقوق اور امن کے راستوں کو دستاویز کرتا ہے۔',
    'mission', 'We document the human cost of the Kashmir conflict and build the local capacity — political, civic and media — needed for a just and durable peace.',
    'mission_ur', 'ہم کشمیر تنازعہ کی انسانی قیمت کو دستاویز کرتے ہیں اور ایک منصفانہ و پائیدار امن کے لیے درکار مقامی سیاسی، شہری اور میڈیا استعداد تعمیر کرتے ہیں۔',
    'logo_url', '/logo/kiir-logo.png'
  )),
  ('contact', jsonb_build_object(
    'address', 'House 12, Street 42, F-8/1, Islamabad, Pakistan',
    'phone', '+92 51 000 0000',
    'email', 'info@kiir.org'
  )),
  ('social', jsonb_build_object(
    'x', '', 'facebook', '', 'linkedin', '', 'youtube', ''
  )),
  ('ticker', jsonb_build_array(
    jsonb_build_object('text', 'KIIR statement: monitoring access to Jammu & Kashmir must be restored ahead of the March review', 'text_ur', 'کے آئی آئی آر کا بیان: مارچ کے جائزے سے قبل جموں و کشمیر تک نگرانی کی رسائی بحال کی جائے', 'slug', 'un-hrc-58-oral-statement'),
    jsonb_build_object('text', 'Registration open — Annual peacebuilding symposium, 15–16 October, Islamabad', 'text_ur', 'رجسٹریشن کھلی ہے — سالانہ امن سازی سمپوزیم، 15 تا 16 اکتوبر، اسلام آباد', 'slug', 'annual-peacebuilding-symposium'),
    jsonb_build_object('text', 'New: Quarterly detention monitor for April–June 2026 is now available to download', 'text_ur', 'نئی اشاعت: اپریل تا جون 2026 کا سہ ماہی حراستی مانیٹر ڈاؤن لوڈ کے لیے دستیاب', 'slug', 'quarterly-detention-monitor-q2'),
    jsonb_build_object('text', 'Call for applications: conflict-sensitive reporting fellowship for AJK journalists', 'text_ur', 'درخواستیں طلب: آزاد کشمیر کے صحافیوں کے لیے تنازعہ حساس رپورٹنگ فیلوشپ', 'slug', 'safety-training-journalists-muzaffarabad')
  )),
  ('about', jsonb_build_object(
    'founded', '1990',
    'history_en', 'KIIR was founded in Islamabad in 1990 as an independent research body focused on the Kashmir conflict. Over three decades, its work has grown from published research into direct programming — training, legal aid, dialogue facilitation and international advocacy — carried out with communities on both sides of the Line of Control.',
    'history_ur', 'کے آئی آئی آر 1990 میں اسلام آباد میں کشمیر تنازعہ پر تحقیق کے لیے ایک آزاد ادارے کے طور پر قائم کیا گیا۔ تین دہائیوں کے دوران اس کا کام تحقیق سے بڑھ کر براہ راست پروگرامنگ تک پھیل گیا — تربیت، قانونی امداد، مکالمے کی سہولت کاری اور بین الاقوامی وکالت — جو لائن آف کنٹرول کے دونوں اطراف کی کمیونٹیز کے ساتھ کی جاتی ہے۔',
    'principles', jsonb_build_array(
      jsonb_build_object('title_en', 'Independence', 'title_ur', 'آزادی', 'body_en', 'KIIR does not represent any government, party or armed group. Findings are published regardless of which side they implicate.', 'body_ur', 'کے آئی آئی آر کسی حکومت، جماعت یا مسلح گروہ کی نمائندگی نہیں کرتا۔ نتائج کسی بھی فریق کے حق میں ہوں، شائع کیے جاتے ہیں۔'),
      jsonb_build_object('title_en', 'Documentation first', 'title_ur', 'پہلے دستاویز سازی', 'body_en', 'Advocacy is built on verified, sourced case data — not anecdote — maintained to a standard that can withstand scrutiny by UN mechanisms.', 'body_ur', 'وکالت مصدقہ اور ماخذ شدہ ڈیٹا پر مبنی ہوتی ہے، سنی سنائی باتوں پر نہیں۔'),
      jsonb_build_object('title_en', 'Local leadership', 'title_ur', 'مقامی قیادت', 'body_en', 'Programs are designed and delivered with local committees, journalists and civic groups, not parachuted in from outside.', 'body_ur', 'پروگرام مقامی کمیٹیوں، صحافیوں اور شہری گروہوں کے ساتھ مل کر ڈیزائن اور فراہم کیے جاتے ہیں۔')
    )
  ))
on conflict (key) do update set value = excluded.value;
