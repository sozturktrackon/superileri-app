/** Italian mirror of content/diets.json (same shape; NutritionScreen picks by
 *  active language). Food terms and portions localized to Italian kitchens
 *  (cups and ounces converted to grams). */
export const dietsIt = {
  goal: 'La formula è semplice: un deficit calorico moderato e abbastanza proteine, nello stile alimentare che riuscirai davvero a mantenere. Punta a perdere circa lo 0,5-1% del tuo peso corporeo a settimana: perdere piano vuol dire proteggere il muscolo.',
  habits: [
    {
      icon: '🍗',
      title: 'Proteine prima di tutto, a ogni pasto',
      text: 'Punta a circa 1,6-2,2 g di proteine per chilo di peso corporeo al giorno. Mangia proteine e verdure prima dei carboidrati: resterai sazio più a lungo e la tua energia sarà più stabile.',
    },
    {
      icon: '🚶',
      title: 'Muoviti dopo mangiato',
      text: 'Una camminata di 2-5 minuti dopo il pasto abbassa in modo evidente il picco glicemico. Bloccato alla scrivania? Fai sollevamenti dei talloni da seduto: avampiede a terra, alza e abbassa il tallone. Funzionano anche stando seduti.',
    },
    {
      icon: '🥤',
      title: 'Taglia zucchero e calorie liquide',
      text: 'Acqua, caffè o tè, nient\'altro. Evita le bevande zuccherate e lo zucchero aggiunto: questo cambiamento da solo fa già gran parte del lavoro.',
    },
    {
      icon: '🥦',
      title: 'Soprattutto cibi non lavorati',
      text: 'Tante verdure e alimenti poco trasformati. Quando si elimina l\'ultra-processato, si mangia molto meno senza nemmeno accorgersene.',
    },
    {
      icon: '🔁',
      title: 'Scegli uno schema che manterrai',
      text: 'Keto, digiuno intermittente o pasti classici: funziona tutto se i principi qui sopra sono rispettati. La dieta migliore è quella che segui davvero. Essere costanti conta più che essere perfetti.',
    },
    {
      icon: '😴',
      title: 'Sonno e passi quotidiani',
      text: '7-9 ore di sonno e camminare ogni giorno accelerano in silenzio la perdita di grasso e spengono le voglie improvvise. Non sottovalutarli.',
    },
  ],
  dinnerCarbNote:
    'Leva facoltativa: alleggerire i carboidrati a cena aiuta molte persone a controllare l\'apporto totale. È un trucco pratico, non una regola. Le calorie contano molto più del timing dei carboidrati.',
  mealPlans: {
    lean: {
      name: 'Piano pasti Lean',
      summary: '4 pasti + spuntini · meno carboidrati e grassi, più proteine · niente carboidrati a cena.',
      meals: [
        { name: 'Colazione', items: '1 proteina + 1 carboidrato + 1 frutto (per es. 2 uova · 40 g di fiocchi d\'avena o 1 fetta di pane integrale · 1 mela)' },
        { name: 'Pranzo (×2)', items: 'Ogni volta: 1 proteina + 1 carboidrato + 1 verdura' },
        { name: 'Cena', items: '1 proteina + 1 verdura (niente carboidrati)' },
        { name: 'Spuntini (tutti, ogni giorno)', items: '2 uova sode · ½ avocado · una manciata di mandorle (o yogurt greco) · 1 mela o un frutto' },
      ],
      carbs: 'Riso integrale 100 g (cotto) · Patata dolce 115 g · Quinoa 90 g (cotta) · Pane integrale 1 fetta e mezza · Pasta integrale 90 g (cotta) (~22-25 g di carboidrati ciascuno)',
    },
    bulk: {
      name: 'Piano pasti Bulk',
      summary: '5 pasti + spuntini · da moderato ad alto su tutti i macro · ogni giorno 1 pasto con manzo magro o salmone.',
      meals: [
        { name: 'Colazione', items: '1 proteina + 1 carboidrato + 1 frutto (per es. 3 uova · 40 g di fiocchi d\'avena · 1 mela)' },
        { name: 'Pranzo (×3)', items: 'Ogni volta: 1 proteina + 1 carboidrato + 1 verdura' },
        { name: 'Cena', items: '1 proteina + 1 carboidrato + 1 verdura' },
        { name: 'Spuntini (tutti, ogni giorno)', items: '2 uova sode · ½ avocado · una manciata di mandorle · 1 mela o un frutto' },
      ],
      carbs: 'Riso integrale 130 g (cotto) · Patata dolce 140 g · Quinoa 120 g (cotta) · Pane integrale 2 fette · Pasta integrale 140 g (cotta) (~30 g di carboidrati ciascuno)',
    },
  },
  proteins: 'Petto di pollo 100 g · Tacchino macinato 155 g · Manzo magro 115 g · Salmone 155 g · Pesce bianco 115 g (~30 g di proteine ciascuno)',
  veggies: 'Una porzione abbondante a scelta (per le verdure a foglia contane 5 volte tanto): asparagi, broccoli, peperoni, cavoletti di Bruxelles, spinaci, cavolo nero, cavolfiore, zucchine, misticanza',
  grocery: [
    { group: 'Proteine', items: 'Uova · Petto di pollo · Tacchino macinato · Manzo magro · Salmone · Pesce bianco' },
    { group: 'Carboidrati', items: 'Riso integrale · Patata dolce · Fiocchi d\'avena · Quinoa · Pane integrale · Pasta integrale' },
    { group: 'Verdure', items: 'Asparagi · Broccoli · Peperoni · Cavoletti di Bruxelles · Spinaci · Cavolo nero · Cavolfiore · Zucchine · Misticanza' },
    { group: 'Frutta', items: 'Mele · Banane · Frutti di bosco · Melone · Ananas · Pompelmo' },
    { group: 'Grassi buoni', items: 'Avocado · Mandorle · Olio di avocado · Olio d\'oliva · Olio di cocco · Yogurt greco · Semi di chia' },
  ],
  rules: [
    'Pesa gli alimenti da cotti (in grammi).',
    'Cucina solo con olio di avocado, d\'oliva o di cocco.',
    'Niente zucchero aggiunto. Vacci piano col sale; usa pepe, cumino, curry ed erbe aromatiche.',
    'Bevi solo acqua (caffè o tè senza zucchero vanno bene).',
    'Quando il piano dice "o", scegli una sola opzione.',
    'Mangia tutti gli spuntini ogni giorno, distribuendoli nella giornata.',
    'Non importa a che ora fai l\'ultimo pasto, basta che rispetti il piano.',
  ],
};
