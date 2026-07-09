/** Filipino (Tagalog/Taglish) mirror of content/diets.json (same shape;
 *  NutritionScreen picks by active language). Food terms kept English where
 *  Filipino kitchens use them; ounces converted to grams. */
export const dietsTl = {
  goal: 'Simple lang ang formula: konting calorie deficit + sapat na protein, sa kahit anong eating style na kaya mong panindigan. Target na mabawasan ng mga 0.5–1% ng bodyweight mo kada linggo. Kapag dahan-dahan ang pagbaba, hindi nawawala ang muscle mo.',
  habits: [
    {
      icon: '🍗',
      title: 'Protein muna, bawat kain',
      text: 'Target na ~1.6–2.2 g ng protein kada kilo ng bodyweight mo araw-araw. Kainin muna ang protein at gulay bago ang carbs, para mas matagal kang busog at mas steady ang energy mo.',
    },
    {
      icon: '🚶',
      title: 'Gumalaw pagkatapos kumain',
      text: 'Ang 2–5 minutong lakad pagkatapos kumain ay kapansin-pansing nagpapababa ng blood-sugar spike. Nakaupo sa desk? Gawin ang seated soleus push-ups (itaas-baba ang sakong habang nakadikit sa sahig ang bola ng paa). Gumagana ito kahit nakaupo ka.',
    },
    {
      icon: '🥤',
      title: 'Alisin ang asukal at liquid calories',
      text: 'Tubig, kape, o tsaa. Iwasan ang matatamis na inumin at added sugar. Itong isang palit na ito, malaki na ang nagagawa.',
    },
    {
      icon: '🥦',
      title: 'Karamihan whole foods',
      text: 'Maraming gulay at minimally-processed na pagkain. Kapansin-pansing bumababa ang kinakain ng mga tao nang hindi nagpipilit kapag inalis nila ang ultra-processed food.',
    },
    {
      icon: '🔁',
      title: 'Pumili ng pattern na kaya mong panatilihin',
      text: 'Keto, intermittent fasting, o fixed meals, lahat gumagana KUNG nasusunod ang mga nasa itaas. Ang best diet ay yung talagang kaya mong panindigan. Mas mahalaga ang consistency kaysa sa "perfect".',
    },
    {
      icon: '😴',
      title: 'Tulog at steps',
      text: 'Ang 7–9 oras na tulog at araw-araw na steps ay tahimik na nagpapabilis ng fat loss at pumapatay ng cravings. Huwag mo silang maliitin.',
    },
  ],
  dinnerCarbNote:
    'Optional na diskarte: ang pagbabawas ng carbs sa hapunan ay nakakatulong sa maraming tao na kontrolin ang kabuuang kinakain. Kapaki-pakinabang na taktika ito, hindi patakaran. Mas mahalaga nang malayo ang calories kaysa sa carb timing.',
  mealPlans: {
    lean: {
      name: 'Lean meal template',
      summary: '4 meals + snacks · mas mababang carbs at fat, mas mataas na protein · walang carbs sa hapunan.',
      meals: [
        { name: 'Almusal', items: '1 protein + 1 carb + 1 prutas (hal. 2 itlog · ½ cup oats o 1 slice wheat bread · 1 mansanas)' },
        { name: 'Tanghalian (×2)', items: 'Bawat isa: 1 protein + 1 carb + 1 gulay' },
        { name: 'Hapunan', items: '1 protein + 1 gulay (walang carbs)' },
        { name: 'Snacks (lahat, araw-araw)', items: '2 nilagang itlog · ½ avocado · ⅓ cup almonds (o Greek yogurt) · 1 mansanas/prutas' },
      ],
      carbs: 'Brown rice ½ cup · Kamote 115 g · Quinoa ½ cup · Wheat bread 1½ slice · Wheat pasta ⅔ cup (~22–25 g bawat isa)',
    },
    bulk: {
      name: 'Bulk meal template',
      summary: '5 meals + snacks · moderate hanggang mataas sa lahat ng macros · isama ang 1 lean beef o salmon meal araw-araw.',
      meals: [
        { name: 'Almusal', items: '1 protein + 1 carb + 1 prutas (hal. 3 itlog · ½ cup oats · 1 mansanas)' },
        { name: 'Tanghalian (×3)', items: 'Bawat isa: 1 protein + 1 carb + 1 gulay' },
        { name: 'Hapunan', items: '1 protein + 1 carb + 1 gulay' },
        { name: 'Snacks (lahat, araw-araw)', items: '2 nilagang itlog · ½ avocado · ⅓ cup almonds · 1 mansanas/prutas' },
      ],
      carbs: 'Brown rice ⅔ cup · Kamote 140 g · Quinoa ⅔ cup · Wheat bread 2 slices · Wheat pasta 1 cup (~30 g bawat isa)',
    },
  },
  proteins: 'Chicken breast 100 g · Ground turkey 155 g · Lean beef 115 g · Salmon 155 g · White fish 115 g (~30 g protein bawat isa)',
  veggies: '1 cup ng kahit alin (5 cups leafy greens = 1 cup): asparagus, broccoli, bell pepper, Brussels sprouts, spinach, kale, cauliflower, zucchini, mixed greens',
  grocery: [
    { group: 'Protein', items: 'Itlog · Chicken breast · Ground turkey · Lean beef · Salmon · White fish' },
    { group: 'Carbs', items: 'Brown rice · Kamote · Oats · Quinoa · Wheat bread · Wheat pasta' },
    { group: 'Gulay', items: 'Asparagus · Broccoli · Bell pepper · Brussels sprouts · Spinach · Kale · Cauliflower · Zucchini · Mixed greens' },
    { group: 'Prutas', items: 'Mansanas · Saging · Berries · Melon · Pinya · Grapefruit' },
    { group: 'Healthy fats', items: 'Avocado · Almonds · Avocado oil · Olive oil · Coconut oil · Greek yogurt · Chia seeds' },
  ],
  rules: [
    'Timbangin ang pagkain nang luto na (sa gramo).',
    'Magluto lang gamit ang avocado, olive, o coconut oil.',
    'Walang added sugar. Bawasan ang asin; gumamit ng paminta, cumin, curry, at herbs.',
    'Tubig lang ang inumin (pwede ang black coffee/tsaa).',
    'Kung may nakasulat na "o" sa plan, pumili ng isa.',
    'Kainin lahat ng snacks mo araw-araw, ikalat sa buong araw.',
    'Hindi mahalaga kung gaano kagabi ang huling kain mo, basta pasok sa plan.',
  ],
};
