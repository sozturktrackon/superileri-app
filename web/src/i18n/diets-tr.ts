/** Turkish mirror of content/diets.json (same shape; NutritionScreen picks by
 *  active language). Food terms localized to what Turkish kitchens use. */
export const dietsTr = {
  goal: 'Formül basit: küçük bir kalori açığı ve yeterli protein — bunu sürdürebileceğin herhangi bir beslenme tarzıyla uygula. Haftada vücut ağırlığının %0,5–1 kadarını vermeyi hedefle; yavaş kilo kaybı kası korur.',
  habits: [
    {
      icon: '🍗',
      title: 'Her öğünde önce protein',
      text: 'Günde kilogram başına ~1,6–2,2 g protein hedefle. Önce proteini ve sebzeleri, sonra karbonhidratı ye; daha uzun tok kalırsın ve enerjin dengeli olur.',
    },
    {
      icon: '🚶',
      title: 'Yemekten sonra biraz yürü',
      text: 'Yemekten sonra 2–5 dakikalık yürüyüş kan şekeri yükselmesini belirgin azaltır. Masa başında mısın? Oturarak soleus şınavı yap (ayak ucu yerde topuk kaldırma). Otururken bile işe yarar.',
    },
    {
      icon: '🥤',
      title: 'Şekeri ve sıvı kaloriyi kes',
      text: 'İçecek olarak su, kahve veya çay yeter. Şekerli içeceklerden ve ilave şekerden uzak dur; tek başına bu değişiklik bile işin büyük kısmını halleder.',
    },
    {
      icon: '🥦',
      title: 'Çoğunlukla doğal gıdalar',
      text: 'Bol sebze ve az işlenmiş gıda. İnsanlar aşırı işlenmiş gıdayı kesince farkında olmadan belirgin şekilde daha az yer.',
    },
    {
      icon: '🔁',
      title: 'Sürdürebileceğin düzeni seç',
      text: 'Ketojenik, aralıklı oruç veya düzenli öğünler; yukarıdakiler sağlandığı sürece hepsi çalışır. En iyi diyet, gerçekten sürdürebildiğindir. Devamlılık, mükemmellikten önemlidir.',
    },
    {
      icon: '😴',
      title: 'Uyku ve adım',
      text: '7–9 saat uyku ve günlük adımlar, yağ kaybını fark ettirmeden hızlandırır, tatlı krizlerini azaltır. Bu ikisini hafife alma.',
    },
  ],
  dinnerCarbNote:
    'İsteğe bağlı taktik: akşam yemeğinde karbonhidratı azaltmak birçok kişiye toplam alımı kontrol etmede yardımcı olur. Kural değil, pratik bir araç. Kalori, karbonhidrat zamanlamasından çok daha önemli.',
  mealPlans: {
    lean: {
      name: 'Lean yemek şablonu',
      summary: '4 öğün + atıştırmalıklar · düşük karbonhidrat ve yağ, yüksek protein · akşam yemeğinde karbonhidrat yok.',
      meals: [
        { name: 'Kahvaltı', items: '1 protein + 1 karbonhidrat + 1 meyve (örn. 2 yumurta · yarım su bardağı yulaf veya 1 dilim tam buğday ekmeği · 1 elma)' },
        { name: 'Öğle (×2)', items: 'Her biri: 1 protein + 1 karbonhidrat + 1 sebze' },
        { name: 'Akşam', items: '1 protein + 1 sebze (karbonhidrat yok)' },
        { name: 'Atıştırmalıklar (hepsi, her gün)', items: '2 haşlanmış yumurta · yarım avokado · bir avuç badem (veya süzme yoğurt) · 1 elma/meyve' },
      ],
      carbs: 'Esmer pirinç yarım bardak · Tatlı patates 115 g · Kinoa yarım bardak · Tam buğday ekmeği 1,5 dilim · Tam buğday makarna 2/3 bardak (her biri ~22–25 g)',
    },
    bulk: {
      name: 'Bulk yemek şablonu',
      summary: '5 öğün + atıştırmalıklar · tüm makrolarda orta-yüksek · her gün 1 öğün yağsız kırmızı et veya somon.',
      meals: [
        { name: 'Kahvaltı', items: '1 protein + 1 karbonhidrat + 1 meyve (örn. 3 yumurta · yarım bardak yulaf · 1 elma)' },
        { name: 'Öğle (×3)', items: 'Her biri: 1 protein + 1 karbonhidrat + 1 sebze' },
        { name: 'Akşam', items: '1 protein + 1 karbonhidrat + 1 sebze' },
        { name: 'Atıştırmalıklar (hepsi, her gün)', items: '2 haşlanmış yumurta · yarım avokado · bir avuç badem · 1 elma/meyve' },
      ],
      carbs: 'Esmer pirinç 2/3 bardak · Tatlı patates 140 g · Kinoa 2/3 bardak · Tam buğday ekmeği 2 dilim · Tam buğday makarna 1 bardak (her biri ~30 g)',
    },
  },
  proteins: 'Tavuk göğsü 100 g · Hindi kıyma 155 g · Yağsız dana 115 g · Somon 155 g · Beyaz balık 115 g (her biri ~30 g protein)',
  veggies: '1 su bardağı herhangi biri (5 bardak yeşil yapraklı = 1 bardak): kuşkonmaz, brokoli, biber, Brüksel lahanası, ıspanak, kara lahana, karnabahar, kabak, karışık yeşillik',
  grocery: [
    { group: 'Protein', items: 'Yumurta · Tavuk göğsü · Hindi kıyma · Yağsız dana · Somon · Beyaz balık' },
    { group: 'Karbonhidrat', items: 'Esmer pirinç · Tatlı patates · Yulaf · Kinoa · Tam buğday ekmeği · Tam buğday makarna' },
    { group: 'Sebze', items: 'Kuşkonmaz · Brokoli · Biber · Brüksel lahanası · Ispanak · Kara lahana · Karnabahar · Kabak · Karışık yeşillik' },
    { group: 'Meyve', items: 'Elma · Muz · Orman meyveleri · Kavun · Ananas · Greyfurt' },
    { group: 'Sağlıklı yağlar', items: 'Avokado · Badem · Avokado yağı · Zeytinyağı · Hindistan cevizi yağı · Süzme yoğurt · Chia tohumu' },
  ],
  rules: [
    'Yiyecekleri pişmiş halde tart (gram olarak).',
    'Sadece avokado, zeytin veya hindistan cevizi yağıyla pişir.',
    'İlave şeker yok. Tuzu azalt; karabiber, kimyon, köri ve baharatları kullan.',
    'Sadece su iç (sade kahve/çay olur).',
    'Planda "veya" yazıyorsa birini seç.',
    'Atıştırmalıkların hepsini her gün ye, güne yay.',
    'Son öğünün saati önemli değil; plana uyduğu sürece geç de olabilir.',
  ],
};
