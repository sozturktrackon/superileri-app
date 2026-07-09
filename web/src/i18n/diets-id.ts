/** Indonesian mirror of content/diets.json (same shape; NutritionScreen picks by
 *  active language). Measures converted to grams; food terms localized to what
 *  Indonesian kitchens actually use. */
export const dietsId = {
  goal: 'Rumusnya sederhana: defisit kalori ringan + protein yang cukup, dengan pola makan apa pun yang benar-benar bisa kamu jalani. Targetkan turun sekitar 0,5–1% berat badan per minggu; penurunan yang pelan menjaga ototmu tetap utuh.',
  habits: [
    {
      icon: '🍗',
      title: 'Protein duluan, di setiap makan',
      text: 'Targetkan sekitar 1,6–2,2 g protein per kg berat badan per hari. Makan protein dan sayur sebelum karbohidrat; kamu bakal kenyang lebih lama dan energimu lebih stabil.',
    },
    {
      icon: '🚶',
      title: 'Bergerak setelah makan',
      text: 'Jalan kaki 2-5 menit setelah makan terbukti menurunkan lonjakan gula darah. Seharian terpaku di meja kerja? Coba soleus push-up sambil duduk: ujung kaki tetap di lantai, angkat lalu turunkan tumit. Tetap efektif meski dilakukan sambil duduk.',
    },
    {
      icon: '🥤',
      title: 'Stop gula & kalori cair',
      text: 'Cukup air putih, kopi, atau teh. Hindari minuman manis dan gula tambahan. Satu perubahan ini saja dampaknya sudah sangat besar.',
    },
    {
      icon: '🥦',
      title: 'Utamakan makanan alami',
      text: 'Perbanyak sayur dan makanan yang minim olahan. Begitu berhenti makan makanan ultra-proses, orang otomatis makan jauh lebih sedikit tanpa terasa.',
    },
    {
      icon: '🔁',
      title: 'Pilih pola yang bisa kamu pertahankan',
      text: 'Keto, puasa intermiten, atau jadwal makan biasa semuanya berhasil, ASAL poin-poin di atas terpenuhi. Diet terbaik adalah diet yang benar-benar kamu jalani terus. Konsisten mengalahkan "sempurna".',
    },
    {
      icon: '😴',
      title: 'Tidur & langkah harian',
      text: 'Tidur 7-9 jam dan rutin jalan kaki setiap hari diam-diam mempercepat pembakaran lemak dan meredam keinginan ngemil. Jangan remehkan keduanya.',
    },
  ],
  dinnerCarbNote:
    'Trik opsional: mengurangi karbohidrat saat makan malam membantu banyak orang mengontrol total kalorinya. Ini taktik praktis, bukan aturan. Kalori jauh lebih penting daripada kapan kamu makan karbohidrat.',
  mealPlans: {
    lean: {
      name: 'Template makan Lean',
      summary: '4 kali makan + camilan · karbohidrat & lemak lebih rendah, protein lebih tinggi · makan malam tanpa karbohidrat.',
      meals: [
        { name: 'Sarapan', items: '1 protein + 1 karbohidrat + 1 buah (mis. 2 telur · ½ cangkir oatmeal atau 1 lembar roti gandum · 1 apel)' },
        { name: 'Makan siang (×2)', items: 'Masing-masing: 1 protein + 1 karbohidrat + 1 sayur' },
        { name: 'Makan malam', items: '1 protein + 1 sayur (tanpa karbohidrat)' },
        { name: 'Camilan (semuanya, tiap hari)', items: '2 telur rebus · ½ alpukat · segenggam almond (atau Greek yogurt) · 1 apel/buah' },
      ],
      carbs: 'Nasi merah ½ cangkir · Ubi jalar 115 g · Kinoa ½ cangkir · Roti gandum 1½ lembar · Pasta gandum ⅔ cangkir (masing-masing ~22–25 g karbo)',
    },
    bulk: {
      name: 'Template makan Bulk',
      summary: '5 kali makan + camilan · semua makro sedang sampai tinggi · sertakan 1 porsi daging sapi tanpa lemak atau salmon setiap hari.',
      meals: [
        { name: 'Sarapan', items: '1 protein + 1 karbohidrat + 1 buah (mis. 3 telur · ½ cangkir oatmeal · 1 apel)' },
        { name: 'Makan siang (×3)', items: 'Masing-masing: 1 protein + 1 karbohidrat + 1 sayur' },
        { name: 'Makan malam', items: '1 protein + 1 karbohidrat + 1 sayur' },
        { name: 'Camilan (semuanya, tiap hari)', items: '2 telur rebus · ½ alpukat · segenggam almond · 1 apel/buah' },
      ],
      carbs: 'Nasi merah ⅔ cangkir · Ubi jalar 140 g · Kinoa ⅔ cangkir · Roti gandum 2 lembar · Pasta gandum 1 cangkir (masing-masing ~30 g karbo)',
    },
  },
  proteins: 'Dada ayam 100 g · Kalkun giling 155 g · Daging sapi tanpa lemak 115 g · Salmon 155 g · Ikan berdaging putih 115 g (masing-masing ~30 g protein)',
  veggies: '1 cangkir sayur apa pun (5 cangkir sayuran hijau = 1 cangkir): asparagus, brokoli, paprika, kubis Brussel, bayam, kale, kembang kol, zukini, campuran sayuran hijau',
  grocery: [
    { group: 'Protein', items: 'Telur · Dada ayam · Kalkun giling · Daging sapi tanpa lemak · Salmon · Ikan berdaging putih' },
    { group: 'Karbohidrat', items: 'Beras merah · Ubi jalar · Oatmeal · Kinoa · Roti gandum · Pasta gandum' },
    { group: 'Sayur', items: 'Asparagus · Brokoli · Paprika · Kubis Brussel · Bayam · Kale · Kembang kol · Zukini · Campuran sayuran hijau' },
    { group: 'Buah', items: 'Apel · Pisang · Aneka beri · Melon · Nanas · Grapefruit' },
    { group: 'Lemak sehat', items: 'Alpukat · Almond · Minyak alpukat · Minyak zaitun · Minyak kelapa · Greek yogurt · Biji chia' },
  ],
  rules: [
    'Timbang makanan dalam keadaan matang (dalam gram).',
    'Masak hanya dengan minyak alpukat, minyak zaitun, atau minyak kelapa.',
    'Tanpa gula tambahan. Kurangi garam; pakai merica, jintan, bumbu kari, dan rempah-rempah.',
    'Minumnya air putih saja (kopi/teh tanpa gula boleh).',
    'Kalau di rencana tertulis "atau", pilih salah satu.',
    'Habiskan semua camilanmu setiap hari, sebar sepanjang hari.',
    'Jam makan terakhir bebas semalam apa pun, asalkan masih sesuai rencana.',
  ],
};
