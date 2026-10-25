// Local fallback content — used only when Supabase env vars aren't set, so
// `npm run dev` works with zero setup. Content is identical to
// supabase/seed.sql; keep the two in sync if you edit either one.

import type { AboutSettings, ContactSettings, ContentItem, OrgSettings, Program, SocialSettings, TickerItem } from "@/lib/types";

export const SEED_PROGRAMS: Program[] = [
  {
    slug: "political-development",
    name: "Political Development",
    name_ur: "سیاسی ترقی",
    description: "Strengthening democratic practice, representation and civic participation in Jammu & Kashmir.",
    description_ur: "جموں و کشمیر میں جمہوری عمل، نمائندگی اور شہری شرکت کو مضبوط بنانا۔",
    long_description:
      "Work under Political Development supports inclusive political processes in Jammu & Kashmir — party dialogue, youth political literacy, election observation and constituency-level advocacy — with an emphasis on voices excluded from formal negotiation tracks.",
    long_description_ur:
      "یہ پروگرام جموں و کشمیر میں شامل سیاسی عمل کی حمایت کرتا ہے — جماعتی مکالمہ، نوجوانوں کی سیاسی خواندگی، انتخابی مشاہدہ اور حلقہ سطح پر وکالت — خاص طور پر ان آوازوں پر زور دیتے ہوئے جو رسمی مذاکرات سے باہر رہ جاتی ہیں۔",
    icon: "◆",
    image_url: "/photos/3_1623823321.jpg",
    sort_order: 1,
  },
  {
    slug: "media-development",
    name: "Media Development",
    name_ur: "میڈیا کی ترقی",
    description: "Training journalists and countering disinformation on the conflict.",
    description_ur: "صحافیوں کی تربیت اور تنازعے سے متعلق غلط معلومات کا مقابلہ۔",
    long_description:
      "Media Development builds the capacity of reporters, editors and citizen journalists covering the conflict: safety training, conflict-sensitive reporting standards, fact-checking labs and support for independent local outlets.",
    long_description_ur:
      "میڈیا ڈیولپمنٹ تنازعے کی کوریج کرنے والے رپورٹرز، ایڈیٹرز اور شہری صحافیوں کی استعداد بڑھاتا ہے: سیفٹی تربیت، تنازعہ حساس رپورٹنگ کے معیار، فیکٹ چیکنگ لیبز اور آزاد مقامی اداروں کی معاونت۔",
    icon: "▣",
    image_url: "/photos/4_1623823333.jpg",
    sort_order: 2,
  },
  {
    slug: "gender",
    name: "Gender",
    name_ur: "صنف",
    description: "Women, peace and security — documentation, leadership and redress.",
    description_ur: "خواتین، امن و سلامتی — دستاویز سازی، قیادت اور انصاف۔",
    long_description:
      "The Gender program documents conflict-related sexual violence, supports women-led peace committees, and advances the Women, Peace and Security agenda across our advocacy at the OIC, UN and national forums.",
    long_description_ur:
      "صنف پروگرام تنازعے سے جڑے تشدد کی دستاویز سازی کرتا ہے، خواتین کی زیرِ قیادت امن کمیٹیوں کی معاونت کرتا ہے اور او آئی سی، اقوام متحدہ اور قومی فورمز پر خواتین، امن و سلامتی کے ایجنڈے کو آگے بڑھاتا ہے۔",
    icon: "●",
    image_url: "/photos/1_1623823318.jpg",
    sort_order: 3,
  },
  {
    slug: "capacity-building-idps",
    name: "Capacity Building of IDPs",
    name_ur: "بے گھر افراد کی استعداد کاری",
    description: "Livelihoods, legal aid and skills for internally displaced families.",
    description_ur: "بے گھر خاندانوں کے لیے روزگار، قانونی معاونت اور ہنر۔",
    long_description:
      "Working with displaced communities along the Line of Control and in urban settlements, this program combines vocational training, legal aid clinics and documentation of displacement to support durable solutions.",
    long_description_ur:
      "لائن آف کنٹرول کے ساتھ اور شہری بستیوں میں بے گھر کمیونٹیز کے ساتھ کام کرتے ہوئے یہ پروگرام پیشہ ورانہ تربیت، قانونی امداد کے کلینک اور بے گھری کی دستاویز سازی کو یکجا کرتا ہے۔",
    icon: "◇",
    image_url: "/photos/3_1624254303.jpg",
    sort_order: 4,
  },
  {
    slug: "disaster-risk-reduction",
    name: "Disaster Risk Reduction",
    name_ur: "آفات کے خطرات میں کمی",
    description: "Community preparedness in a seismically and climatically fragile region.",
    description_ur: "زلزلوں اور موسمی خطرات کے شکار علاقے میں کمیونٹی کی تیاری۔",
    long_description:
      "Disaster Risk Reduction trains village committees in hazard mapping, early warning and evacuation planning, and advocates for conflict-sensitive humanitarian access in a region exposed to earthquakes, floods and glacial melt.",
    long_description_ur:
      "آفات کے خطرات میں کمی کا پروگرام گاؤں کمیٹیوں کو خطرات کی نقشہ سازی، ابتدائی وارننگ اور انخلا کی منصوبہ بندی کی تربیت دیتا ہے اور انسانی رسائی کی وکالت کرتا ہے۔",
    icon: "△",
    image_url: "/photos/5_1623823336.jpg",
    sort_order: 5,
  },
  {
    slug: "conflict-resolution",
    name: "Conflict Resolution",
    name_ur: "تنازعات کا حل",
    description: "Track-II dialogue, mediation research and confidence-building measures.",
    description_ur: "ٹریک ٹو مکالمہ، ثالثی پر تحقیق اور اعتماد سازی کے اقدامات۔",
    long_description:
      "Conflict Resolution convenes Track-II dialogues between scholars and former officials, researches applicable models of self-determination and mediation, and proposes practical confidence-building measures across the Line of Control.",
    long_description_ur:
      "یہ پروگرام ماہرین اور سابق حکام کے درمیان ٹریک ٹو مکالمے منعقد کرتا ہے، حقِ خود ارادیت اور ثالثی کے قابلِ عمل ماڈلز پر تحقیق کرتا ہے اور لائن آف کنٹرول پر عملی اعتماد سازی کی تجاویز دیتا ہے۔",
    icon: "⬡",
    image_url: "/photos/4_1624254303.jpg",
    sort_order: 6,
  },
  {
    slug: "human-rights",
    name: "Human Rights",
    name_ur: "انسانی حقوق",
    description: "Monitoring, documentation and international advocacy on violations.",
    description_ur: "خلاف ورزیوں کی نگرانی، دستاویز سازی اور بین الاقوامی وکالت۔",
    long_description:
      "Our largest program monitors and documents violations in Jammu & Kashmir, files submissions to UN treaty bodies and special procedures, and briefs parliaments and human rights councils on the ground situation.",
    long_description_ur:
      "ہمارا سب سے بڑا پروگرام جموں و کشمیر میں خلاف ورزیوں کی نگرانی و دستاویز سازی کرتا ہے، اقوام متحدہ کے اداروں کو رپورٹس جمع کراتا ہے اور پارلیمنٹس و انسانی حقوق کونسلز کو بریفنگ دیتا ہے۔",
    icon: "◈",
    image_url: "/photos/3_1624014649.jpg",
    sort_order: 7,
  },
];

const UN_HRC_BODY_EN = `
<p>The delegation opened by placing on record the volume of verified material gathered since the last review cycle: 1,240 individual case files, 96 direct testimonies, and a district-level dataset on communications restrictions maintained continuously since 2023.</p>
<p>Three recommendations followed. First, that unimpeded access be granted to independent monitors, including the Office of the High Commissioner. Second, that preventive detention provisions be reviewed against treaty obligations, with published statistics on their use. Third, that journalists working on the conflict be recognised as a category requiring specific protection.</p>
<p>Delegates from four member states referenced KIIR's quarterly detention monitor in their interventions, and two asked for the underlying methodology to be circulated to the Council secretariat.</p>
<blockquote>Documentation is not only a record. It is the evidentiary floor on which any future peace process will have to stand.</blockquote>
<p>A written version of the statement, together with annexes on methodology and a summary in Urdu, is available for download and may be republished with attribution.</p>
<p>KIIR will return to the Council in the March session with an updated dataset and a companion submission on the situation of internally displaced families.</p>
`.trim();

const UN_HRC_BODY_UR = `
<p>وفد نے گزشتہ جائزے کے بعد جمع کیے گئے مصدقہ مواد کی تفصیل پیش کی: 1,240 انفرادی مقدمات، 96 براہِ راست گواہیاں، اور مواصلاتی پابندیوں سے متعلق ضلعی سطح کا مسلسل ڈیٹا۔</p>
<p>تین سفارشات پیش کی گئیں: آزاد مبصرین کو بلا رکاوٹ رسائی، احتیاطی حراست کے قوانین کا بین الاقوامی معیارات کی روشنی میں جائزہ، اور تنازعے پر کام کرنے والے صحافیوں کے لیے مخصوص تحفظ۔</p>
<p>چار رکن ممالک کے مندوبین نے اپنے بیانات میں کے آئی آئی آر کے سہ ماہی حراستی مانیٹر کا حوالہ دیا۔</p>
<blockquote>دستاویز سازی صرف ریکارڈ نہیں؛ یہ مستقبل کے کسی بھی امن عمل کی بنیاد ہے۔</blockquote>
<p>بیان کا تحریری متن، طریقہ کار کے ضمیمے اور اردو خلاصہ ڈاؤن لوڈ کے لیے دستیاب ہے۔</p>
<p>کے آئی آئی آر مارچ کے اجلاس میں تازہ ڈیٹا کے ساتھ دوبارہ شریک ہوگا۔</p>
`.trim();

export const SEED_ITEMS: ContentItem[] = [
  {
    slug: "un-hrc-58-oral-statement", type: "news_publication", is_featured: true, priority: 1,
    thumbnail_url: "/photos/img4_1623310502.jpg",
    title: "KIIR delivers oral statement at the 58th session of the UN Human Rights Council",
    title_ur: "کے آئی آئی آر نے اقوام متحدہ کی انسانی حقوق کونسل کے 58ویں اجلاس میں زبانی بیان دیا",
    short_description: "Our delegation presented three years of verified documentation on detentions, communications shutdowns and restrictions on assembly, and called for renewed monitoring access.",
    short_description_ur: "ہمارے وفد نے حراستوں، مواصلاتی بندش اور اجتماع پر پابندیوں سے متعلق تین سالہ مصدقہ دستاویزات پیش کیں اور نگرانی کی رسائی بحال کرنے کا مطالبہ کیا۔",
    body: UN_HRC_BODY_EN, body_ur: UN_HRC_BODY_UR,
    item_date: "2026-07-28", categories: ["human-rights", "political-development"],
  },
  {
    slug: "women-peace-committees-baseline", type: "publication", is_featured: true, priority: 2,
    thumbnail_url: "/photos/1_1623822608.jpg",
    title: "Baseline study: women-led peace committees across nine districts",
    title_ur: "بنیادی مطالعہ: نو اضلاع میں خواتین کی زیرِ قیادت امن کمیٹیاں",
    short_description: "A 64-page assessment of how local women's committees mediate disputes, and what recognition they still lack.",
    short_description_ur: "مقامی خواتین کی کمیٹیاں تنازعات میں کیسے ثالثی کرتی ہیں، اس پر 64 صفحات کا جائزہ۔",
    body: null, body_ur: null,
    item_date: "2026-07-19", categories: ["gender", "conflict-resolution"],
  },
  {
    slug: "safety-training-journalists-muzaffarabad", type: "activity", is_featured: true, priority: 3,
    thumbnail_url: "/photos/1_1623823647.jpg",
    title: "Three-day safety and verification training for 28 local journalists",
    title_ur: "28 مقامی صحافیوں کے لیے تین روزہ سیفٹی اور تصدیق کی تربیت",
    short_description: "Held in Muzaffarabad with a focus on digital security, sourcing under pressure and trauma-aware interviewing.",
    short_description_ur: "مظفرآباد میں ڈیجیٹل سیکیورٹی اور محفوظ انٹرویو پر مرکوز تربیت۔",
    body: null, body_ur: null,
    item_date: "2026-07-11", categories: ["media-development"],
  },
  {
    slug: "roundtable-loc-cbms", type: "event", is_featured: true, priority: 4,
    thumbnail_url: null,
    title: "Roundtable: reviving confidence-building measures across the Line of Control",
    title_ur: "گول میز: لائن آف کنٹرول پر اعتماد سازی کے اقدامات کی بحالی",
    short_description: "Former diplomats, traders and scholars assess which crossing-point and trade measures could realistically be restored.",
    short_description_ur: "سابق سفارت کار اور ماہرین قابلِ عمل اقدامات کا جائزہ لیں گے۔",
    body: null, body_ur: null,
    item_date: "2026-09-04", categories: ["conflict-resolution", "political-development"],
  },
  {
    slug: "idp-legal-aid-clinic", type: "activity", is_featured: true, priority: 5,
    thumbnail_url: "/photos/4_1623822611.jpg",
    title: "Mobile legal aid clinic reaches 340 displaced families",
    title_ur: "موبائل لیگل ایڈ کلینک 340 بے گھر خاندانوں تک پہنچا",
    short_description: "Documentation support for compensation claims, school enrolment and property records.",
    short_description_ur: "معاوضے کے دعووں اور جائیداد کے ریکارڈ کے لیے معاونت۔",
    body: null, body_ur: null,
    item_date: "2026-06-30", categories: ["capacity-building-idps", "human-rights"],
  },
  {
    slug: "youth-political-literacy-cohort-7", type: "activity", is_featured: false, priority: 10,
    thumbnail_url: "/photos/2_1623823647.jpg",
    title: "Seventh youth political literacy cohort graduates in Rawalakot",
    title_ur: "راولاکوٹ میں ساتویں نوجوان سیاسی خواندگی کورس کی تکمیل",
    short_description: "Forty-two participants completed eight weeks on constitutional frameworks, local governance and public deliberation, closing with mock council hearings.",
    short_description_ur: "بیالیس شرکاء نے آٹھ ہفتوں کا کورس مکمل کیا۔",
    body: null, body_ur: null,
    item_date: "2026-07-25", categories: ["political-development", "capacity-building-idps"],
  },
  {
    slug: "submission-cedaw-periodic-review", type: "news_publication", is_featured: false, priority: 11,
    thumbnail_url: null,
    title: "Shadow submission filed ahead of the CEDAW periodic review",
    title_ur: "سیڈا کے وقتی جائزے سے قبل شیڈو رپورٹ جمع کرائی گئی",
    short_description: "The 31-page submission compiles testimony from 96 women on access to justice, movement restrictions and the status of half-widows.",
    short_description_ur: "96 خواتین کی گواہی پر مشتمل 31 صفحات کی رپورٹ۔",
    body: null, body_ur: null,
    item_date: "2026-07-22", categories: ["gender", "human-rights"],
  },
  {
    slug: "flood-preparedness-neelum", type: "activity", is_featured: false, priority: 12,
    thumbnail_url: "/photos/5_1623823650.jpg",
    title: "Hazard mapping with eleven village committees in the Neelum valley",
    title_ur: "وادی نیلم میں گیارہ گاؤں کمیٹیوں کے ساتھ خطرات کی نقشہ سازی",
    short_description: "Participatory mapping produced evacuation routes and early-warning rosters ahead of the monsoon, coordinated with district authorities.",
    short_description_ur: "مون سون سے قبل انخلا کے راستے اور وارننگ رجسٹر تیار کیے گئے۔",
    body: null, body_ur: null,
    item_date: "2026-07-16", categories: ["disaster-risk-reduction"],
  },
  {
    slug: "fact-checking-lab-launch", type: "event", is_featured: false, priority: 13,
    thumbnail_url: "/photos/1_1624254300.jpg",
    title: "Launch of the Kashmir fact-checking lab with five partner newsrooms",
    title_ur: "پانچ نیوز رومز کے ساتھ کشمیر فیکٹ چیکنگ لیب کا آغاز",
    short_description: "A shared verification desk for claims circulating about the conflict, with a public methodology and a weekly bulletin.",
    short_description_ur: "عوامی طریقہ کار اور ہفتہ وار بلیٹن کے ساتھ مشترکہ تصدیقی ڈیسک۔",
    body: null, body_ur: null,
    item_date: "2026-08-21", categories: ["media-development", "human-rights"],
  },
  {
    slug: "quarterly-detention-monitor-q2", type: "publication", is_featured: false, priority: 14,
    thumbnail_url: null,
    title: "Quarterly detention monitor: April–June 2026",
    title_ur: "سہ ماہی حراستی مانیٹر: اپریل تا جون 2026",
    short_description: "Verified case data on preventive detentions, with methodology notes and a comparison against the preceding four quarters.",
    short_description_ur: "احتیاطی حراستوں کے مصدقہ اعداد و شمار اور طریقہ کار کے نوٹس۔",
    body: null, body_ur: null,
    item_date: "2026-07-08", categories: ["human-rights"],
  },
  {
    slug: "track-two-dialogue-round-nine", type: "activity", is_featured: false, priority: 15,
    thumbnail_url: "/photos/3_1623823648.jpg",
    title: "Ninth round of Track-II dialogue convened in Islamabad",
    title_ur: "اسلام آباد میں ٹریک ٹو مکالمے کا نواں دور",
    short_description: "Sixteen participants from both sides of the Line of Control discussed humanitarian access, prisoner releases and academic exchange.",
    short_description_ur: "سولہ شرکاء نے انسانی رسائی اور قیدیوں کی رہائی پر بات کی۔",
    body: null, body_ur: null,
    item_date: "2026-06-27", categories: ["conflict-resolution"],
  },
  {
    slug: "vocational-skills-idp-women", type: "activity", is_featured: false, priority: 16,
    thumbnail_url: "/photos/6_1623822611.jpg",
    title: "Vocational skills programme for displaced women concludes its second year",
    title_ur: "بے گھر خواتین کے لیے ہنر مندی پروگرام کا دوسرا سال مکمل",
    short_description: "Tailoring, embroidery and small-enterprise training for 210 women, with market linkage support in three towns.",
    short_description_ur: "210 خواتین کے لیے تربیت اور مارکیٹ روابط کی معاونت۔",
    body: null, body_ur: null,
    item_date: "2026-06-14", categories: ["capacity-building-idps", "gender"],
  },
  {
    slug: "oic-contact-group-briefing", type: "news_publication", is_featured: false, priority: 17,
    thumbnail_url: "/photos/5_1623822611.jpg",
    title: "Briefing to the OIC Contact Group on Jammu & Kashmir",
    title_ur: "او آئی سی کنٹیکٹ گروپ کو بریفنگ",
    short_description: "A summary of our recommendations on monitoring access, humanitarian corridors and the protection of journalists.",
    short_description_ur: "نگرانی کی رسائی اور صحافیوں کے تحفظ سے متعلق سفارشات کا خلاصہ۔",
    body: null, body_ur: null,
    item_date: "2026-05-30", categories: ["human-rights", "political-development"],
  },
  {
    slug: "annual-peacebuilding-symposium", type: "event", is_featured: false, priority: 18,
    thumbnail_url: "/photos/2_1624254300.jpg",
    title: "Annual peacebuilding symposium: registration opens",
    title_ur: "سالانہ امن سازی سمپوزیم: رجسٹریشن کا آغاز",
    short_description: "Two days of panels on self-determination, transitional justice and regional trade, with delegates from twelve countries.",
    short_description_ur: "بارہ ممالک کے مندوبین کے ساتھ دو روزہ اجلاس۔",
    body: null, body_ur: null,
    item_date: "2026-10-15", categories: ["conflict-resolution", "political-development"],
  },
  {
    slug: "community-radio-pilot", type: "activity", is_featured: false, priority: 19,
    thumbnail_url: "/photos/4_1623823649.jpg",
    title: "Community radio pilot brings local reporting to four valleys",
    title_ur: "کمیونٹی ریڈیو پائلٹ چار وادیوں تک",
    short_description: "Volunteer reporters produce weekly programming on service delivery, disaster preparedness and women's access to health care.",
    short_description_ur: "رضاکار رپورٹر ہفتہ وار پروگرام تیار کرتے ہیں۔",
    body: null, body_ur: null,
    item_date: "2026-05-18", categories: ["media-development", "disaster-risk-reduction"],
  },
];

export const SEED_ORG: OrgSettings = {
  name: "KASHMIR INSTITUTE OF INTERNATIONAL RELATIONS",
  name_ur: "کشمیر انسٹیٹیوٹ آف انٹرنیشنل ریلیشنز",
  tagline: "Peace Through Dialogue",
  tagline_ur: "مکالمے کے ذریعے امن",
  strapline: "Islamabad · Est. 1990 · Research, advocacy & peacebuilding on Kashmir",
  strapline_ur: "اسلام آباد · قائم 1990 · کشمیر پر تحقیق، وکالت اور امن سازی",
  blurb: "An independent think tank documenting the Kashmir conflict, human rights and pathways to peace.",
  blurb_ur: "ایک آزاد تھنک ٹینک جو کشمیر تنازعہ، انسانی حقوق اور امن کے راستوں کو دستاویز کرتا ہے۔",
  mission:
    "We document the human cost of the Kashmir conflict and build the local capacity — political, civic and media — needed for a just and durable peace.",
  mission_ur:
    "ہم کشمیر تنازعہ کی انسانی قیمت کو دستاویز کرتے ہیں اور ایک منصفانہ و پائیدار امن کے لیے درکار مقامی سیاسی، شہری اور میڈیا استعداد تعمیر کرتے ہیں۔",
  logo_url: "/logo/kiir-emblem.png",
};

export const SEED_CONTACT: ContactSettings = {
  address: "House 12, Street 42, F-8/1, Islamabad, Pakistan",
  phone: "+92 51 000 0000",
  email: "info@kiir.org",
};

// No verified real handles were found in the source material this site was
// migrated from (see PROJECT-NOTES.md §5) — left blank rather than guessed.
// Fill in via the `social` site_setting once the client provides them.
export const SEED_SOCIAL: SocialSettings = {
  x: "",
  facebook: "",
  instagram: "",
  linkedin: "",
};

export const SEED_TICKER: TickerItem[] = [
  {
    text: "KIIR statement: monitoring access to Jammu & Kashmir must be restored ahead of the March review",
    text_ur: "کے آئی آئی آر کا بیان: مارچ کے جائزے سے قبل جموں و کشمیر تک نگرانی کی رسائی بحال کی جائے",
    slug: "un-hrc-58-oral-statement",
  },
  {
    text: "Registration open — Annual peacebuilding symposium, 15–16 October, Islamabad",
    text_ur: "رجسٹریشن کھلی ہے — سالانہ امن سازی سمپوزیم، 15 تا 16 اکتوبر، اسلام آباد",
    slug: "annual-peacebuilding-symposium",
  },
  {
    text: "New: Quarterly detention monitor for April–June 2026 is now available to download",
    text_ur: "نئی اشاعت: اپریل تا جون 2026 کا سہ ماہی حراستی مانیٹر ڈاؤن لوڈ کے لیے دستیاب",
    slug: "quarterly-detention-monitor-q2",
  },
  {
    text: "Call for applications: conflict-sensitive reporting fellowship for AJK journalists",
    text_ur: "درخواستیں طلب: آزاد کشمیر کے صحافیوں کے لیے تنازعہ حساس رپورٹنگ فیلوشپ",
    slug: "safety-training-journalists-muzaffarabad",
  },
];

export const SEED_ABOUT: AboutSettings = {
  founded: "1990",
  history_en:
    "KIIR was founded in Islamabad in 1990 as an independent research body focused on the Kashmir conflict. Over three decades, its work has grown from published research into direct programming — training, legal aid, dialogue facilitation and international advocacy — carried out with communities on both sides of the Line of Control.",
  history_ur:
    "کے آئی آئی آر 1990 میں اسلام آباد میں کشمیر تنازعہ پر تحقیق کے لیے ایک آزاد ادارے کے طور پر قائم کیا گیا۔ تین دہائیوں کے دوران اس کا کام تحقیق سے بڑھ کر براہ راست پروگرامنگ تک پھیل گیا — تربیت، قانونی امداد، مکالمے کی سہولت کاری اور بین الاقوامی وکالت — جو لائن آف کنٹرول کے دونوں اطراف کی کمیونٹیز کے ساتھ کی جاتی ہے۔",
  principles: [
    {
      title_en: "Independence",
      title_ur: "آزادی",
      body_en: "KIIR does not represent any government, party or armed group. Findings are published regardless of which side they implicate.",
      body_ur: "کے آئی آئی آر کسی حکومت، جماعت یا مسلح گروہ کی نمائندگی نہیں کرتا۔ نتائج کسی بھی فریق کے حق میں ہوں، شائع کیے جاتے ہیں۔",
    },
    {
      title_en: "Documentation first",
      title_ur: "پہلے دستاویز سازی",
      body_en: "Advocacy is built on verified, sourced case data — not anecdote — maintained to a standard that can withstand scrutiny by UN mechanisms.",
      body_ur: "وکالت مصدقہ اور ماخذ شدہ ڈیٹا پر مبنی ہوتی ہے، سنی سنائی باتوں پر نہیں — ایسا معیار جو اقوام متحدہ کے میکانزم کی جانچ پر پورا اترے۔",
    },
    {
      title_en: "Local leadership",
      title_ur: "مقامی قیادت",
      body_en: "Programs are designed and delivered with local committees, journalists and civic groups, not parachuted in from outside.",
      body_ur: "پروگرام مقامی کمیٹیوں، صحافیوں اور شہری گروہوں کے ساتھ مل کر ڈیزائن اور فراہم کیے جاتے ہیں۔",
    },
  ],
};
