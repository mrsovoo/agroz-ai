// Real Neon DB Snapshot (ep-steep-snow-b27sm8op-pooler.c-6.eu-central-1.aws.neon.tech/neondb)
// Preserves all registered BiznesGO stores, specialists, farmer/bot users, O'RQ-547 consents, and bot sessions.

const NEON_BIZNESGO_MERCHANTS = [
  {
    id: 19,
    telegram_id: "6724823030",
    phone: "+998 908383772",
    name: "Sohibjon Sulaymonov",
    owner_name: "Sohibjon Sulaymonov",
    shop_name: "Agroz Farm",
    organization_name: "Agroz Farm",
    merchant_type: "agro_shop",
    activity_type: "agro_vet",
    region: "Farg‘ona viloyati",
    district: "toshloq",
    address: "toshloq",
    latitude: null,
    longitude: null,
    working_hours: "08:00 - 18:00",
    delivery_available: false,
    status: "active",
    created_at: "2026-10-17T11:19:36.254Z",
    updated_at: "2026-10-17T11:19:36.254Z"
  },
  {
    id: 1,
    telegram_id: "8970822162",
    phone: "+998990390078",
    name: "Адхамжон",
    owner_name: "Адхамжон",
    shop_name: "VET FORMULA (Азия Агро Кимие Инвесть)",
    organization_name: "VET FORMULA",
    merchant_type: "veterinary_pharmacy",
    activity_type: "agro_vet",
    region: "Farg'ona viloyati",
    district: "Toshloq tumani",
    address: "Farg'ona Viloyati, Arabmozor, Toshloq tumani, Xonaqa ko'chasi",
    latitude: 40.549658,
    longitude: 71.785464,
    working_hours: "24/7",
    delivery_available: true,
    status: "active",
    created_at: "2026-09-24T07:39:44.850Z",
    updated_at: "2026-10-10T12:12:35.184Z"
  },
  {
    id: 2,
    telegram_id: "708982356",
    phone: "+998999694939",
    name: "Hasanov Shahzodbek",
    owner_name: "Hasanov Shahzodbek",
    shop_name: "Hasanov Shahzodbek (Agronom)",
    organization_name: "Hasanov Shahzodbek (Agronom)",
    merchant_type: "agro_shop",
    activity_type: "agro_vet",
    region: "Xorazm viloyati",
    district: "Urganch tumani",
    address: "Xorazm viloyati, G'aybu, Urganch Tumani",
    latitude: 41.522061,
    longitude: 60.576791,
    working_hours: "08:00 - 18:00",
    delivery_available: true,
    status: "active",
    created_at: "2026-10-09T07:19:10.919Z",
    updated_at: "2026-10-09T07:20:28.699Z"
  },
  {
    id: 3,
    telegram_id: "5983375830",
    phone: "+998931146489",
    name: "Mehmonov Xurshid",
    owner_name: "Mehmonov Xurshid",
    shop_name: "Erkin agro",
    organization_name: "Erkin agro",
    merchant_type: "agro_shop",
    activity_type: "agro_vet",
    region: "Buxoro viloyati",
    district: "Buxoro shahri",
    address: "Buxoro viloyati, Buxoro shahri",
    latitude: 39.788897,
    longitude: 64.447667,
    working_hours: "24/7",
    delivery_available: true,
    status: "active",
    created_at: "2026-10-11T07:56:20.545Z",
    updated_at: "2026-10-11T07:56:20.470Z"
  }
];

const NEON_LEGACY_MERCHANTS = [
  {
    id: 14,
    user_id: 8,
    store_name: "Азия Агро Кимие Инвесть",
    phone: "+998990390078",
    business_type: "agro_vet",
    address: "Xonaqa ko'chasi, Arabmozor, Toshloq tumani, Farg'ona Viloyati, 151501, Oʻzbekiston",
    lat: 40.549687,
    lng: 71.785389,
    delivery_available: false,
    is_active: true,
    created_at: "2026-10-19T12:25:02.474Z",
    updated_at: "2026-10-19T13:38:33.517Z",
    subscription_until: "2027-12-31T19:00:00.000Z",
    is_archived: false
  },
  {
    id: 13,
    user_id: 14,
    store_name: "Agroz Farm",
    phone: "+998908383772",
    business_type: "agro_vet",
    address: "tg:6724823030",
    lat: 41.333179,
    lng: 69.330828,
    delivery_available: false,
    is_active: true,
    created_at: "2026-10-19T07:01:14.144Z",
    updated_at: "2026-10-19T13:38:41.107Z",
    subscription_until: "2026-11-18T19:00:00.000Z",
    is_archived: false
  }
];

const NEON_SPECIALISTS = [
  {
    id: 6,
    telegram_id: "8970822162",
    name: "Адхамжон",
    phone: "+998990390078",
    role: "pharmacy",
    specialty: "Umumiy dorixona",
    bio: "Чорва хайвонларини барчасини уй парандалари хамда дехкончилик иссикхона йуналишида маслахат ва курсатмалар",
    helps_with: "both",
    experience_years: 12,
    organization: "VET FORMULA",
    region: "Farg'ona viloyati",
    district: "Toshloq tumani",
    address: "Farg'ona Viloyati, Arabmozor, Toshloq tumani, Xonaqa ko'chasi",
    work_hours: "24/7",
    is_active: true,
    created_at: "2026-09-24T07:39:44.850Z"
  },
  {
    id: 15,
    telegram_id: "708982356",
    name: "Hasanov Shahzodbek",
    phone: "+998999694939",
    role: "specialist",
    specialty: "Agronom",
    education: "Urganch Davlat Universiteti",
    bio: "Issiqxona agrotexnikasi parvarishi",
    helps_with: "crop",
    experience_years: 3,
    organization: "Hasanov Shahzodbek (Agronom)",
    region: "Xorazm viloyati",
    district: "Urganch tumani",
    address: "Xorazm viloyati, G'aybu, Urganch Tumani",
    work_hours: "08:00 - 18:00",
    is_active: true,
    created_at: "2026-10-09T07:19:10.919Z"
  },
  {
    id: 16,
    telegram_id: "5983375830",
    name: "Mehmonov Xurshid",
    phone: "+998931146489",
    role: "pharmacy",
    specialty: "Agro dorixona",
    helps_with: "both",
    experience_years: 5,
    organization: "Erkin agro",
    region: "Buxoro viloyati",
    district: "Buxoro shahri",
    address: "Buxoro viloyati, Buxoro shahri",
    work_hours: "24/7",
    is_active: true,
    created_at: "2026-10-11T07:56:20.545Z"
  }
];

const NEON_USERS = [
  { id: 2, phone: "+998930096139", telegram_id: "5540276741", name: "Shoxrux Doschanov", region: "Xorazm viloyati", district: null, consent_channel: "telegram_farmer_bot", created_at: "2026-09-24T00:14:28.532Z" },
  { id: 3, phone: "+998945359619", telegram_id: "1082821066", name: "Мамарасулов иброхим", region: "Samarqand viloyati", district: "Payariq tumani", consent_channel: "telegram_farmer_bot", created_at: "2026-09-24T01:37:20.888Z" },
  { id: 4, phone: "+998184672484", telegram_id: "8106442704", name: "Eraliev Ali", region: null, district: null, consent_channel: "telegram_farmer_bot", created_at: "2026-09-24T03:52:49.464Z" },
  { id: 5, phone: "+998995848636", telegram_id: "7375206559", name: "Ассалому алайкум", region: "Surxondaryo viloyati", district: "Denov Tumani", consent_channel: "telegram_farmer_bot", created_at: "2026-09-24T11:46:13.573Z" },
  { id: 6, phone: "+998900900099", telegram_id: "1622637520", name: "Бахром Ходжиматов", region: "Toshkent viloyati", district: null, consent_channel: "telegram_farmer_bot", created_at: "2026-09-24T12:36:23.367Z" },
  { id: 7, phone: "+998997601996", telegram_id: "5162180315", name: "Zokirov Abdulhay", region: "Farg'ona viloyati", district: null, consent_channel: "telegram_farmer_bot", created_at: "2026-09-25T04:05:08.418Z" },
  { id: 8, phone: "+998990390078", second_phone: "+998330390078", telegram_id: "8970822162", name: "Adhamjon", region: "Farg'ona", district: "Toshloq tumani", consent_channel: "telegram_farmer_bot", created_at: "2026-09-26T06:09:38.789Z" },
  { id: 9, phone: "+998942124442", telegram_id: "306276284", name: "Javlon Temirov", region: "Navoiy viloyati", district: null, consent_channel: "telegram_farmer_bot", created_at: "2026-09-26T15:22:46.672Z" },
  { id: 10, phone: "+998705081600", telegram_id: "7180060763", name: "Imona", region: "Toshkent viloyati", district: "Boʻka tumani", consent_channel: "telegram_farmer_bot", created_at: "2026-09-27T04:40:43.405Z" },
  { id: 14, phone: "+998908383772", telegram_id: "6724823030", name: "Sohibjon Sulaymonov (مالك)", region: "Toshkent shahri", district: "Mirzo Ulug‘bek Tumani", consent_channel: "telegram_farmer_bot", created_at: "2026-09-28T00:25:43.787Z" },
  { id: 15, phone: "+998507764000", telegram_id: "1380853940", name: "Djalilov Lazizxon Axmedovich", region: "Farg'ona Viloyati", district: null, consent_channel: "telegram_farmer_bot", created_at: "2026-09-29T08:32:12.449Z" },
  { id: 16, phone: "+998949426903", telegram_id: "7051582516", name: "Muzrob Abdakimov", region: "Toshkent viloyati", district: "Boʻka tumani", consent_channel: "telegram_farmer_bot", created_at: "2026-10-02T02:02:47.144Z" },
  { id: 18, phone: "+998338383772", telegram_id: "6424680270", name: "Sardor", region: null, district: null, consent_channel: "telegram_bot:@agrozai_bot", created_at: "2026-10-04T23:19:23.415Z" },
  { id: 19, phone: "+998997424167", telegram_id: "1119104263", name: "Жавлон", region: "Qashqadaryo viloyati", district: "Nishon tumani", consent_channel: "telegram_bot:@agrozai_bot", created_at: "2026-10-07T06:28:45.273Z" },
  { id: 20, phone: "+998934527875", telegram_id: "8081033490", name: "Dilrabo", region: null, district: null, consent_channel: "telegram_bot:@agrozai_bot", created_at: "2026-10-08T02:05:52.617Z" },
  { id: 21, phone: "+998934393499", telegram_id: "6981822554", name: "Hasanov Masud", region: "Jizzax viloyati", district: "Arnasoy Tumani", consent_channel: "telegram_bot:@agrozai_bot", created_at: "2026-10-08T05:16:45.602Z" },
  { id: 22, phone: "+998998581667", telegram_id: "830621180", name: "Шухрат Расулов", region: null, district: null, consent_channel: "telegram_bot:@agrozai_bot", created_at: "2026-10-13T07:09:00.110Z" },
  { id: 23, phone: "+998772489477", telegram_id: "8194099556", name: "Sanjar Maxmudov", region: null, district: null, consent_channel: "telegram_bot:@agrozai_bot", created_at: "2026-10-15T12:13:56.449Z" },
  { id: 24, phone: "+998333113772", telegram_id: "6728378751", name: "Sohibjon", region: "Farg‘ona viloyati", district: "Toshloq tumani", consent_channel: "telegram_farmer_bot", created_at: "2026-10-17T02:57:56.362Z" },
  { id: 25, phone: "+998333113882", telegram_id: null, name: "Sardor", region: "Toshkent viloyati", district: null, consent_channel: "telegram_farmer_bot", created_at: "2026-10-17T03:00:42.518Z" },
  { id: 26, phone: "+998958302233", telegram_id: "5969902338", name: "Rahimberdiev Shuhratjon", region: null, district: null, consent_channel: "telegram_bot:@agrozai_bot", created_at: "2026-10-18T03:34:59.877Z" },
  { id: 27, phone: "+998952571283", telegram_id: "8495995076", name: "Dilshod TaShanov", region: null, district: null, consent_channel: "telegram_bot:@agrozai_bot", created_at: "2026-10-18T04:18:18.119Z" },
  { id: 28, phone: "+998900012345", telegram_id: "12345", name: "Test", region: null, district: null, consent_channel: "telegram_farmer_bot", created_at: "2026-10-20T06:30:05.530Z" },
  { id: 29, phone: "+998908777691", telegram_id: "8777691838", name: "Shaxboz", region: null, district: null, consent_channel: "telegram_farmer_bot", created_at: "2026-10-20T06:55:31.822Z" },
  { id: 30, phone: "+998909999999", telegram_id: "999999999", name: "TestUser", region: null, district: null, consent_channel: "telegram_farmer_bot", created_at: "2026-10-20T07:06:37.902Z" }
];

const NEON_DATA_CONSENTS = [
  { id: 1, subject_type: "specialist", subject_id: 13, telegram_id: "6724823030", phone: "+998908383772", full_name: "Sardorbek", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agroz_auth_bot", consented_at: "2026-10-02T13:57:37.830Z" },
  { id: 2, subject_type: "pharmacy", subject_id: 14, telegram_id: "6728378751", phone: "+998333113772", full_name: "Sohibjon", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agroz_auth_bot", consented_at: "2026-10-02T14:06:14.645Z" },
  { id: 3, subject_type: "user", subject_id: 18, telegram_id: "6424680270", phone: "+998338383772", full_name: "Sardor", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agrozai_bot", consented_at: "2026-10-04T23:19:24.599Z" },
  { id: 4, subject_type: "user", subject_id: 19, telegram_id: "1119104263", phone: "+998997424167", full_name: "Жавлон", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agrozai_bot", consented_at: "2026-10-07T06:28:46.721Z" },
  { id: 5, subject_type: "user", subject_id: 20, telegram_id: "8081033490", phone: "+998934527875", full_name: "Dilrabo", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agrozai_bot", consented_at: "2026-10-08T02:05:54.140Z" },
  { id: 6, subject_type: "user", subject_id: 21, telegram_id: "6981822554", phone: "+998934393499", full_name: "Hasanov Masud", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agrozai_bot", consented_at: "2026-10-08T05:16:47.448Z" },
  { id: 7, subject_type: "specialist", subject_id: 15, telegram_id: "708982356", phone: "+998999694939", full_name: "Hasanov Shahzodbek", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agroz_auth_bot", consented_at: "2026-10-09T07:19:10.993Z" },
  { id: 8, subject_type: "pharmacy", subject_id: 16, telegram_id: "5983375830", phone: "+998931146489", full_name: "Mehmonov Xurshid", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agroz_auth_bot", consented_at: "2026-10-11T07:56:20.621Z" },
  { id: 9, subject_type: "user", subject_id: 22, telegram_id: "830621180", phone: "+998998581667", full_name: "Шухрат Расулов", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agrozai_bot", consented_at: "2026-10-13T07:09:01.582Z" },
  { id: 10, subject_type: "user", subject_id: 23, telegram_id: "8194099556", phone: "+998772489477", full_name: "Sanjar Maxmudov", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agrozai_bot", consented_at: "2026-10-15T12:13:58.116Z" },
  { id: 11, subject_type: "pharmacy", subject_id: 13, telegram_id: null, phone: "+998908383772", full_name: "Sohibjon Sulaymonov", policy_version: "v1.0 (2026)", consent_channel: "web_registration_contract", consented_at: "2026-10-16T11:14:37.289Z" },
  { id: 14, subject_type: "specialist", subject_id: 19, telegram_id: "6728378751", phone: "+998338383772", full_name: "Sardorbek", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agroz_auth_bot", consented_at: "2026-10-17T01:04:11.764Z" },
  { id: 15, subject_type: "pharmacy", subject_id: 20, telegram_id: null, phone: "+998333113772", full_name: "Sohibjon", policy_version: "v1.0 (2026)", consent_channel: "web_registration_contract", consented_at: "2026-10-17T02:57:55.263Z" },
  { id: 16, subject_type: "pharmacy", subject_id: 21, telegram_id: null, phone: "+998333113882", full_name: "Sardor", policy_version: "v1.0 (2026)", consent_channel: "web_registration_contract", consented_at: "2026-10-17T03:00:42.296Z" },
  { id: 24, subject_type: "user", subject_id: 26, telegram_id: "5969902338", phone: "+998958302233", full_name: "Rahimberdiev Shuhratjon", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agrozai_bot", consented_at: "2026-10-18T03:35:00.838Z" },
  { id: 25, subject_type: "user", subject_id: 27, telegram_id: "8495995076", phone: "+998952571283", full_name: "Dilshod TaShanov", policy_version: "v1.0 (2026)", consent_channel: "telegram_bot:@agrozai_bot", consented_at: "2026-10-18T04:18:19.028Z" }
];

const NEON_BOT_STATES = [
  { chat_id: "1248842950", telegram_id: "1248842950", flow: "auth", step: "work_hours", data: { name: "Sobirjonov Ogʻabek", phone: "+998882951982", role: "specialist", specialty: "Agronom", helpsWith: "crop", experienceYears: 1, bio: "Isiqxona" }, updated_at: "2026-10-14T05:21:07.812Z" },
  { chat_id: "6981822554", telegram_id: "6981822554", flow: "auth", step: "confirm", data: { name: "Hasanov Masud", phone: "+998508040107", role: "specialist", specialty: "Agronom" }, updated_at: "2026-10-08T05:23:22.873Z" },
  { chat_id: "8735776594", telegram_id: "8735776594", flow: "auth", step: "experience", data: { name: "Naimjonov Shuhrat", phone: "+998952775777", role: "specialist", specialty: "Agronom", helpsWith: "crop" }, updated_at: "2026-10-17T15:42:55.741Z" },
  { chat_id: "7507317803", telegram_id: "7507317803", flow: "auth", step: "experience", data: { name: "Муборак кутлимуротова", phone: "+998185956921", role: "specialist", specialty: "Agronom", helpsWith: "crop" }, updated_at: "2026-10-03T09:03:32.675Z" },
  { chat_id: "5540276741", telegram_id: "5540276741", flow: "auth", step: "phone", data: { role: "specialist", name: "Shoxrux Doschanov", phone: "+998930096139" }, updated_at: "2026-09-24T00:15:20.213Z" },
  { chat_id: "6777011690", telegram_id: "6777011690", flow: "auth", step: "phone", data: { name: "Sarvar" }, updated_at: "2026-10-17T06:26:56.592Z" }
];

module.exports = {
  NEON_BIZNESGO_MERCHANTS,
  NEON_LEGACY_MERCHANTS,
  NEON_SPECIALISTS,
  NEON_USERS,
  NEON_DATA_CONSENTS,
  NEON_BOT_STATES
};

