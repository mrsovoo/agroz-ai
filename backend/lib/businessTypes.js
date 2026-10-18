/**
 * Biznes turlari konfiguratsiyasi — backend validatsiyasi va frontend dinamik
 * formalari uchun YAGONA manba (GET /api/biznesgo/meta orqali frontendga beriladi).
 */
const ALL_UNITS = ['dona', 'kg', 'liter', 'qop', 'tonna', 'pachka', 'metr', 'gram', 'tup'];

const BUSINESS_TYPES = {
  agro_vet: {
    label: "Agro-Vet do'kon / dorixona",
    icon: 'agro_vet',
    units: ['dona', 'liter', 'kg', 'pachka'],
    defaultUnit: 'dona',
    categories: ['Fungitsid', 'Insektitsid', 'Gerbitsid', "O'g'it", 'Vet-preparat', 'Vitamin', 'Vaksina', 'Boshqa'],
    fields: { batch_number: true, expiry_date: true, wholesale: false },
    expiryLabel: 'Yaroqlilik muddati',
  },
  feed: {
    label: 'Yem-ozuqa sotuvchisi',
    icon: 'feed',
    units: ['qop', 'tonna', 'kg'],
    defaultUnit: 'qop',
    categories: ['Omuxta yem', 'Kepak', 'Arpa', "Makkajo'xori", 'Kunjara', 'Premiks', 'Vitamin/Mineral', 'Boshqa'],
    fields: { bag_weight_kg: true, batch_number: false, expiry_date: false, wholesale: true },
  },
  warehouse: {
    label: 'Ombor / Ulgurji sotuvchi',
    icon: 'warehouse',
    units: ALL_UNITS,
    defaultUnit: 'dona',
    categories: ['Agrokimyo', "O'g'it", 'Yem', 'Urug\'', 'Jihoz', 'Qadoq/Tara', 'Boshqa'],
    fields: { batch_number: true, expiry_date: false, wholesale: true },
  },
  seeds: {
    label: "Urug' va ko'chat sotuvchisi",
    icon: 'seeds',
    units: ['pachka', 'kg', 'gram', 'dona', 'tup'],
    defaultUnit: 'pachka',
    categories: ["Sabzavot urug'i", "G'alla urug'i", "Poliz urug'i", "Ko'chat", 'Gul urug\'i', 'Meva ko\'chati', 'Manzarali daraxt', 'Boshqa'],
    fields: { variety: true, ripening_period: true, season: true, batch_number: true, expiry_date: true, wholesale: false },
    expiryLabel: 'Unuvchanlik muddati',
  },
  machinery: {
    label: 'Jihoz va texnika sotuvchisi',
    icon: 'machinery',
    units: ['dona', 'metr'],
    defaultUnit: 'dona',
    categories: ["Sug'orish tizimi", 'Purkagich', 'Motoblok', 'Nasos', 'Ehtiyot qism', 'Asbob-uskuna', 'Boshqa'],
    fields: { model: true, serial_number: true, warranty_months: true, wholesale: true, batch_number: false, expiry_date: false },
  },
};

const BUSINESS_TYPE_KEYS = Object.keys(BUSINESS_TYPES);

module.exports = { BUSINESS_TYPES, BUSINESS_TYPE_KEYS, ALL_UNITS };

