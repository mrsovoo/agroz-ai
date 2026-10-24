// BiznesGO B2B Core — 5 Sector Definitions & Configuration
// Har bir sektor umumiy B2B yadrosiga ulanadi va o'ziga xos maydonlarni taqdim etadi.

const SECTORS = {
  agro_vet: {
    id: 'agro_vet',
    code: 'agro_vet',
    name: 'Agro-Vet Dorixona',
    subtitle: 'Veterinariya dorilari, premikslar va o\'simlik himoyasi',
    icon: 'Pill',
    defaultUnits: ['dona', 'flakon', 'ampula', 'litr', 'kg', 'qadoq'],
    categories: [
      'Antibiotiklar (Vet)',
      'Antiparasitik preparatlar',
      'Premikslar va vitaminlar',
      'Vaksinalar va zardoblar',
      'Dezinfeksiya vositalari',
      'Insektitsid va Gerbitsidlar',
      'Mineral o\'g\'itlar'
    ],
    fields: [
      { name: 'active_ingredient', label: 'Faol Moddasi & Dozasi', type: 'string', required: true, placeholder: 'Masalan: Oksitetratsiklin 200 mg/ml' },
      { name: 'batch_number', label: 'Partiya / Seriya Raqami', type: 'string', required: true, placeholder: 'OKS-2401' },
      { name: 'expiry_date', label: 'Yaroqlilik Muddati', type: 'date', required: true },
      { name: 'prescription_required', label: 'Retsept talab etiladi', type: 'boolean', default: false }
    ],
    rules: {
      enforceFEFO: true,
      trackBatch: true,
      trackExpiry: true,
      hasRecall: true
    }
  },

  feed_nutrition: {
    id: 'feed_nutrition',
    code: 'feed_nutrition',
    name: 'Yem va Ozuqa',
    subtitle: 'Chorva va parrandalar uchun to\'yimli yem, silos va qo\'shimchalar',
    icon: 'Wheat',
    defaultUnits: ['qop', 'kg', 'tonna', 'dona'],
    categories: [
      'Kombikorm (Parranda)',
      'Kombikorm (Qoramol)',
      'Beda va silos granulalari',
      'Shrot va jmih',
      'Kepak va yorma',
      'Mineral qo\'shimchalar',
      'Tuz bloklari'
    ],
    fields: [
      { name: 'protein_percentage', label: 'Protein (Oqsil) Miqdori %', type: 'number', required: false, placeholder: 'Masalan: 18.5%' },
      { name: 'energy_kcal', label: 'Energiya Qiymati (kKal)', type: 'number', required: false, placeholder: 'Masalan: 2900' },
      { name: 'moisture_percentage', label: 'Namlik Chegarasi %', type: 'number', required: false, placeholder: 'Masalan: 12%' },
      { name: 'animal_target', label: 'Mo\'ljallangan Hayvon Turi', type: 'string', required: false, placeholder: 'Sog\'in sigirlar, Broyler jo\'ja, Buzoq' },
      { name: 'batch_number', label: 'Ishlab Chiqarish Partiyasi', type: 'string', required: true, placeholder: 'YEM-2026-04' }
    ],
    rules: {
      enforceFEFO: false,
      trackBatch: true,
      trackExpiry: true,
      bulkWeightConversion: true
    }
  },

  seeds_seedlings: {
    id: 'seeds_seedlings',
    code: 'seeds_seedlings',
    name: 'Urug\' va Ko\'chat',
    subtitle: 'Meva, sabzavot, poliz va g\'alla ekinlari urug\'lari',
    icon: 'Sprout',
    defaultUnits: ['qadoq', 'dona', 'kg', 'quti', 'bog\'lam'],
    categories: [
      'Issiqxona pomidor & bodring urug\'lari',
      'Ochiq dala sabzavot urug\'lari',
      'G\'alla va boshoqli urug\'lar',
      'Meva ko\'chatlari',
      'Manzarali daraxtlar',
      'Gullar urug\'lari'
    ],
    fields: [
      { name: 'crop_variety', label: 'Ekin Navi / Duragay (F1)', type: 'string', required: true, placeholder: 'Masalan: Bella F1, Krasnodar 99' },
      { name: 'germination_rate', label: 'Unib Chiqish Qobiliyati (Germinatsiya %)', type: 'number', required: false, placeholder: 'Masalan: 96%' },
      { name: 'lot_number', label: 'Urug\'lik Lot / Sertifikat Raqami', type: 'string', required: true, placeholder: 'LOT-9921-UZ' },
      { name: 'season', label: 'Mavsum', type: 'string', required: false, placeholder: 'Bahorgi, Kuzgi, Ertapishar' },
      { name: 'origin_country', label: 'Kelib Chiqish Mamlakati', type: 'string', required: false, placeholder: 'Gollandiya, Turkiya, O\'zbekiston' }
    ],
    rules: {
      enforceFEFO: false,
      trackBatch: true,
      trackLot: true,
      seasonalDemand: true
    }
  },

  greenhouse_livestock_eq: {
    id: 'greenhouse_livestock_eq',
    code: 'greenhouse_livestock_eq',
    name: 'Issiqxona va Chorva Jihozlari',
    subtitle: 'Tomchilatib sug\'orish, ventilyatsiya, isitgich va ferma jihozlari',
    icon: 'Building2',
    defaultUnits: ['dona', 'komplekt', 'metr', 'm2', 'rulon'],
    categories: [
      'Tomchilatib sug\'orish quvurlari & filtrlar',
      'Issiqxona plyonkalari va soyabon to\'rlar',
      'Isitish va iqlim nazorati (Termostatlar)',
      'Sog\'ish apparatlari va sut sovutkichlar',
      'Avtomatik sug\'orish va oziqlantirish oxurlari',
      'Elektr cho\'pon tizimlari'
    ],
    fields: [
      { name: 'model_number', label: 'Model / Markasi', type: 'string', required: true, placeholder: 'Masalan: AgroDrop-200, Dairymaster 500' },
      { name: 'dimensions', label: 'O\'lchamlari / Maydon qamrovi', type: 'string', required: false, placeholder: 'Masalan: 16mm x 500m, 1 gektar uchun' },
      { name: 'warranty_months', label: 'Kafolat Muddati (oy)', type: 'number', required: false, placeholder: '12' },
      { name: 'assembly_required', label: 'Montaj va O\'rnatish talab etiladi', type: 'boolean', default: false }
    ],
    rules: {
      enforceFEFO: false,
      trackBatch: false,
      trackWarranty: true,
      serviceSupport: true
    }
  },

  agro_machinery: {
    id: 'agro_machinery',
    code: 'agro_machinery',
    name: 'Agro va Chorva Texnikalari',
    subtitle: 'Mini traktorlar, motobloklar, tirkamalar va ehtiyot qismlar',
    icon: 'Tractor',
    defaultUnits: ['dona', 'komplekt'],
    categories: [
      'Mini traktorlar va traktorlar',
      'Motobloklar va kultivatorlar',
      'Omoch, boron va purkagich agregatlari',
      'Yem maydalagich va silos presslar',
      'Dvigatellar va transmissiya ehtiyot qismlari',
      'Tirkamalar va transport vositalari'
    ],
    fields: [
      { name: 'model_number', label: 'Texnika Modeli', type: 'string', required: true, placeholder: 'Masalan: Lovol 504, Dongfeng 404' },
      { name: 'vin_serial', label: 'Shassi / VIN / Seriya Raqami', type: 'string', required: true, placeholder: 'LV-504-2026-88192' },
      { name: 'engine_power_hp', label: 'Dvigatel Quvvati (Ot Kuchi)', type: 'number', required: false, placeholder: '50' },
      { name: 'fuel_type', label: 'Yoqilg\'i Turi', type: 'string', required: false, placeholder: 'Dizel, Benzin, Elektr' },
      { name: 'warranty_months', label: 'Kafolat (oy)', type: 'number', required: false, placeholder: '24' },
      { name: 'service_hours_interval', label: 'Texnik Ko\'rik Oralig\'i (Motosoat)', type: 'number', required: false, placeholder: '250' }
    ],
    rules: {
      enforceFEFO: false,
      trackSerial: true,
      trackWarranty: true,
      leaseSupported: true
    }
  }
};

function getSector(sectorId) {
  return SECTORS[sectorId] || SECTORS.agro_vet;
}

function getAllSectors() {
  return Object.values(SECTORS);
}

function isValidSector(sectorId) {
  return Boolean(SECTORS[sectorId]);
}

module.exports = {
  SECTORS,
  getSector,
  getAllSectors,
  isValidSector
};

