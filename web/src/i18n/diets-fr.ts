/** French mirror of content/diets.json (same shape; NutritionScreen picks by
 *  active language). Food terms and portions localized to French kitchens
 *  (ounces converted to grams). */
export const dietsFr = {
  goal: 'La formule est simple : un déficit calorique modéré et assez de protéines, dans le style d\'alimentation que tu arriveras vraiment à tenir. Vise une perte d\'environ 0,5 à 1 % de ton poids de corps par semaine : perdre lentement, c\'est préserver ton muscle.',
  habits: [
    {
      icon: '🍗',
      title: 'Des protéines d\'abord, à chaque repas',
      text: 'Vise environ 1,6 à 2,2 g de protéines par kilo de poids de corps et par jour. Mange les protéines et les légumes avant les glucides : tu resteras rassasié plus longtemps et ton énergie sera plus stable.',
    },
    {
      icon: '🚶',
      title: 'Bouge après avoir mangé',
      text: 'Une marche de 2 à 5 minutes après le repas réduit nettement le pic de glycémie. Coincé au bureau ? Fais des extensions de mollets assis : pointe de pied au sol, tu lèves et tu baisses le talon. Ça marche même assis.',
    },
    {
      icon: '🥤',
      title: 'Coupe le sucre et les calories liquides',
      text: 'De l\'eau, du café ou du thé, rien d\'autre. Évite les boissons sucrées et le sucre ajouté : ce seul changement fait déjà une grosse partie du travail.',
    },
    {
      icon: '🥦',
      title: 'Surtout des aliments bruts',
      text: 'Beaucoup de légumes et des aliments peu transformés. Quand on supprime l\'ultra-transformé, on mange nettement moins sans même s\'en rendre compte.',
    },
    {
      icon: '🔁',
      title: 'Choisis un rythme que tu vas garder',
      text: 'Kéto, jeûne intermittent ou repas classiques : tout fonctionne si les principes ci-dessus sont respectés. Le meilleur régime, c\'est celui que tu tiens vraiment. La régularité bat la perfection.',
    },
    {
      icon: '😴',
      title: 'Sommeil et pas quotidiens',
      text: '7 à 9 heures de sommeil et des pas chaque jour accélèrent discrètement la perte de gras et calment les fringales. Ne les sous-estime pas.',
    },
  ],
  dinnerCarbNote:
    'Levier facultatif : alléger les glucides au dîner aide beaucoup de gens à contrôler leur apport total. C\'est une astuce pratique, pas une règle. Les calories comptent bien plus que l\'horaire des glucides.',
  mealPlans: {
    lean: {
      name: 'Plan de repas Lean',
      summary: '4 repas + collations · moins de glucides et de lipides, plus de protéines · pas de glucides au dîner.',
      meals: [
        { name: 'Petit-déjeuner', items: '1 protéine + 1 glucide + 1 fruit (par ex. 2 œufs · ½ tasse de flocons d\'avoine ou 1 tranche de pain complet · 1 pomme)' },
        { name: 'Déjeuner (×2)', items: 'À chaque fois : 1 protéine + 1 glucide + 1 légume' },
        { name: 'Dîner', items: '1 protéine + 1 légume (pas de glucides)' },
        { name: 'Collations (toutes, chaque jour)', items: '2 œufs durs · ½ avocat · une poignée d\'amandes (ou du yaourt grec) · 1 pomme ou un fruit' },
      ],
      carbs: 'Riz complet ½ tasse · Patate douce 115 g · Quinoa ½ tasse · Pain complet 1 tranche et demie · Pâtes complètes ⅔ tasse (~22 à 25 g chacun)',
    },
    bulk: {
      name: 'Plan de repas Bulk',
      summary: '5 repas + collations · modéré à élevé sur tous les macros · chaque jour, 1 repas avec du bœuf maigre ou du saumon.',
      meals: [
        { name: 'Petit-déjeuner', items: '1 protéine + 1 glucide + 1 fruit (par ex. 3 œufs · ½ tasse de flocons d\'avoine · 1 pomme)' },
        { name: 'Déjeuner (×3)', items: 'À chaque fois : 1 protéine + 1 glucide + 1 légume' },
        { name: 'Dîner', items: '1 protéine + 1 glucide + 1 légume' },
        { name: 'Collations (toutes, chaque jour)', items: '2 œufs durs · ½ avocat · une poignée d\'amandes · 1 pomme ou un fruit' },
      ],
      carbs: 'Riz complet ⅔ tasse · Patate douce 140 g · Quinoa ⅔ tasse · Pain complet 2 tranches · Pâtes complètes 1 tasse (~30 g chacun)',
    },
  },
  proteins: 'Blanc de poulet 100 g · Dinde hachée 155 g · Bœuf maigre 115 g · Saumon 155 g · Poisson blanc 115 g (~30 g de protéines chacun)',
  veggies: '1 tasse au choix (5 tasses de feuilles vertes = 1 tasse) : asperges, brocoli, poivrons, choux de Bruxelles, épinards, chou kale, chou-fleur, courgette, jeunes pousses',
  grocery: [
    { group: 'Protéines', items: 'Œufs · Blanc de poulet · Dinde hachée · Bœuf maigre · Saumon · Poisson blanc' },
    { group: 'Glucides', items: 'Riz complet · Patate douce · Flocons d\'avoine · Quinoa · Pain complet · Pâtes complètes' },
    { group: 'Légumes', items: 'Asperges · Brocoli · Poivrons · Choux de Bruxelles · Épinards · Chou kale · Chou-fleur · Courgette · Jeunes pousses' },
    { group: 'Fruits', items: 'Pommes · Bananes · Fruits rouges · Melon · Ananas · Pamplemousse' },
    { group: 'Bonnes graisses', items: 'Avocat · Amandes · Huile d\'avocat · Huile d\'olive · Huile de coco · Yaourt grec · Graines de chia' },
  ],
  rules: [
    'Pèse les aliments une fois cuits (en grammes).',
    'Cuisine uniquement à l\'huile d\'avocat, d\'olive ou de coco.',
    'Pas de sucre ajouté. Vas-y doucement sur le sel ; mise sur le poivre, le cumin, le curry et les herbes.',
    'Bois uniquement de l\'eau (café ou thé sans sucre, ça passe).',
    'Quand le plan dit « ou », choisis une seule option.',
    'Mange toutes tes collations chaque jour, en les répartissant.',
    'Peu importe l\'heure de ton dernier repas, tant qu\'il respecte le plan.',
  ],
};
