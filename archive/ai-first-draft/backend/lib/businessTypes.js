/**
 * Biznes turlari konfiguratsiyasi — backend validatsiyasi va frontend dinamik
 * formalari uchun YAGONA manba (GET /api/biznesgo/meta orqali frontendga beriladi).
 */
const ALL_UNITS = [
  'dona',
  'kg',
  'litr',
  'liter',
  'qop',
  'tonna',
  'pachka',
  'metr',
  'gram',
  'tup',
  'flakon',
  'kanistr',
  'rulon',
  'blok',
  'komplekt'
];

const SECTOR_CATEGORIES = {
  agro_vet: [
    'Insektitsidlar (Zararkunandalarga qarshi)',
    'Fungitsidlar (Zamburug‘ va kasalliklarga qarshi)',
    'Gerbitsidlar (Begona o‘tlarga qarshi)',
    'Akaritsidlar (Kanalarga qarshi)',
    'Mineral o‘g‘itlar (NPK, Selitra, Karbamid)',
    'Biostimulyatorlar va O‘sish regulyatorlari',
    'Mikroelementlar va Bargdan oziqlantirish',
    'Veterinariya dori-darmonlari (Antibiotiklar)',
    'Vaksinalar va Zardoblar',
    'Vitaminlar va Mineral premikslar',
    'Dezinfeksiya va Antiseptik vositalari',
    'Qashov va Veterinariya anjomlari',
  ],
  feed: [
    'Parranda omuxta yemi (Broyler, Tovuq)',
    'Qoramol omuxta yemi (Bordiqilik, Sog‘in)',
    'Qo‘y va echki omuxta yemi',
    'Baliq ozuqasi (Granula va Ekstrudirlangan)',
    'Bug‘doy va arpa kepagi',
    'Paxta kunjara va shrot',
    'Soya va kungaboqar shroti',
    'Makkajo‘xori va Don yemlari',
    'Premikslar va Ozuqa qo‘shimchalari',
    'Lizin, Metionin va Oqsil konsentratlari',
    'Tuz va Mineral ozuqalar',
  ],
  warehouse: [
    'Qopdagi don va un mahsulotlari',
    'Agro-plyonka va Issiqxona qoplamalari',
    'Tomchilatib sug‘orish quvurlari va fitingslar',
    'Qadoqlash qoplari va sabzavot to‘rlari (setka)',
    'Plastik yashiklar va taralar',
    'Geotekstil va Agrotola (Spunbond)',
    'Bog‘dorchilik iplari, simlari va tutqichlar',
    'Soyabon to‘rlar (Pritenyovka)',
    'Himoya kiyimlari va Respiratorlar',
    'Xo‘jalik va Qurilish mollari',
  ],
  seeds: [
    'Pomidor urug‘lari (Gibrid F1)',
    'Bodring urug‘lari (Gibrid F1)',
    'Qovun va Tarvuz urug‘lari',
    'Piyoz va Sabzi urug‘lari',
    'Karam, Gulkaram va Brokkoli urug‘lari',
    'Baqlajon va Qalampir urug‘lari',
    'Oshko‘klar va Ziravor urug‘lari',
    'Dukkakli ekinlar (Loviya, Mosh, No‘xat)',
    'Bug‘doy, Arpa va Paxta elita urug‘lari',
    'Meva va Tok ko‘chatlari',
    'Manzarali daraxt va Gul ko‘chatlari',
  ],
  machinery: [
    'Dvigatelli va Motorli purkagichlar',
    'Akkumulyatorli qo‘l purkagichlari',
    'Motobloklar, Kultivatorlar va Mini-traktorlar',
    'Suv nasoslari va Benzinli motorlar',
    'O‘t o‘rgichlar va Trimmerlar',
    'Dala va Bog‘ qaychilari (Sekatorlar, Pila)',
    'Purkagich naychalari, Shlanglar va Fitingslar',
    'Dvigatel ehtiyot qismlari (Karbyurator, Porshen)',
    'Filtrlar, Remenlar va Moylash moylari',
    'Qo‘l mehnat qurollari (Bel, Ketmon, Tirnoq)',
  ],
};

const BUSINESS_TYPES = {
  agro_vet: {
    label: "Agro-Vet do'kon / dorixona",
    icon: 'agro_vet',
    units: ALL_UNITS,
    defaultUnit: 'dona',
    categories: SECTOR_CATEGORIES.agro_vet,
    fields: { batch_number: false, expiry_date: true, wholesale: false },
    expiryLabel: 'Yaroqlilik muddati',
  },
  feed: {
    label: 'Yem-ozuqa sotuvchisi',
    icon: 'feed',
    units: ALL_UNITS,
    defaultUnit: 'qop',
    categories: SECTOR_CATEGORIES.feed,
    fields: { bag_weight_kg: true, batch_number: false, expiry_date: false, wholesale: true },
  },
  warehouse: {
    label: 'Ombor / Ulgurji sotuvchi',
    icon: 'warehouse',
    units: ALL_UNITS,
    defaultUnit: 'dona',
    categories: SECTOR_CATEGORIES.warehouse,
    fields: { batch_number: false, expiry_date: false, wholesale: true },
  },
  seeds: {
    label: "Urug' va ko'chat sotuvchisi",
    icon: 'seeds',
    units: ALL_UNITS,
    defaultUnit: 'pachka',
    categories: SECTOR_CATEGORIES.seeds,
    fields: { variety: true, ripening_period: true, season: true, batch_number: false, expiry_date: true, wholesale: false },
    expiryLabel: 'Unuvchanlik muddati',
  },
  machinery: {
    label: 'Jihoz va texnika sotuvchisi',
    icon: 'machinery',
    units: ALL_UNITS,
    defaultUnit: 'dona',
    categories: SECTOR_CATEGORIES.machinery,
    fields: { model: true, serial_number: true, warranty_months: true, wholesale: true, batch_number: false, expiry_date: false },
  },
};

const BUSINESS_TYPE_KEYS = Object.keys(BUSINESS_TYPES);

module.exports = { BUSINESS_TYPES, BUSINESS_TYPE_KEYS, ALL_UNITS, SECTOR_CATEGORIES };

