/** German mirror of content/diets.json (same shape; NutritionScreen picks by
 *  active language). Amounts converted to what German kitchens use (grams). */
export const dietsDe = {
  goal: 'Die Formel ist simpel: ein moderates Kaloriendefizit plus genug Protein, in dem Essstil, den du wirklich durchhältst. Ziel: pro Woche etwa 0,5 bis 1 % deines Körpergewichts verlieren. Langsames Abnehmen schützt deine Muskeln.',
  habits: [
    {
      icon: '🍗',
      title: 'Protein zuerst, in jeder Mahlzeit',
      text: 'Peile etwa 1,6 bis 2,2 g Protein pro kg Körpergewicht am Tag an. Iss Protein und Gemüse vor den Kohlenhydraten: Du bleibst länger satt und deine Energie bleibt stabiler.',
    },
    {
      icon: '🚶',
      title: 'Nach dem Essen bewegen',
      text: 'Ein Spaziergang von 2 bis 5 Minuten nach dem Essen senkt den Blutzuckeranstieg spürbar. Am Schreibtisch festgenagelt? Mach Soleus-Push-ups im Sitzen: Fußballen am Boden lassen, Ferse heben und senken. Das wirkt sogar im Sitzen.',
    },
    {
      icon: '🥤',
      title: 'Zucker und flüssige Kalorien streichen',
      text: 'Wasser, Kaffee oder Tee reichen. Lass zuckerhaltige Getränke und zugesetzten Zucker weg; allein dieser Tausch erledigt einen großen Teil der Arbeit.',
    },
    {
      icon: '🥦',
      title: 'Überwiegend unverarbeitete Lebensmittel',
      text: 'Viel Gemüse und möglichst wenig verarbeitete Produkte. Wer hochverarbeitete Lebensmittel streicht, isst automatisch deutlich weniger, ganz ohne zu zählen.',
    },
    {
      icon: '🔁',
      title: 'Wähle ein Muster, das du durchhältst',
      text: 'Keto, Intervallfasten oder feste Mahlzeiten: Alles funktioniert, solange die Punkte oben stimmen. Die beste Diät ist die, die du wirklich durchziehst. Konstanz schlägt Perfektion.',
    },
    {
      icon: '😴',
      title: 'Schlaf und Schritte',
      text: '7 bis 9 Stunden Schlaf und tägliche Schritte treiben den Fettabbau ganz nebenbei voran und bremsen Heißhunger. Unterschätze beides nicht.',
    },
  ],
  dinnerCarbNote:
    'Optionaler Hebel: Weniger Kohlenhydrate am Abend helfen vielen, die Gesamtkalorien im Griff zu behalten. Ein praktischer Trick, keine Regel. Kalorien zählen weit mehr als das Timing der Kohlenhydrate.',
  mealPlans: {
    lean: {
      name: 'Lean Mahlzeiten-Vorlage',
      summary: '4 Mahlzeiten + Snacks · weniger Kohlenhydrate und Fett, mehr Protein · abends keine Kohlenhydrate.',
      meals: [
        { name: 'Frühstück', items: '1 Protein + 1 Kohlenhydrat + 1 Obst (z. B. 2 Eier · ½ Tasse Haferflocken oder 1 Scheibe Vollkorntoast · 1 Apfel)' },
        { name: 'Mittag (×2)', items: 'Jeweils: 1 Protein + 1 Kohlenhydrat + 1 Gemüse' },
        { name: 'Abendessen', items: '1 Protein + 1 Gemüse (keine Kohlenhydrate)' },
        { name: 'Snacks (alle, täglich)', items: '2 hartgekochte Eier · ½ Avocado · eine Handvoll Mandeln (oder griechischer Joghurt) · 1 Apfel/Obst' },
      ],
      carbs: 'Naturreis ½ Tasse · Süßkartoffel 115 g · Quinoa ½ Tasse · Vollkornbrot 1½ Scheiben · Vollkornnudeln ⅔ Tasse (je ca. 22–25 g)',
    },
    bulk: {
      name: 'Bulk Mahlzeiten-Vorlage',
      summary: '5 Mahlzeiten + Snacks · moderat bis hoch bei allen Makros · täglich 1 Mahlzeit mit magerem Rind oder Lachs.',
      meals: [
        { name: 'Frühstück', items: '1 Protein + 1 Kohlenhydrat + 1 Obst (z. B. 3 Eier · ½ Tasse Haferflocken · 1 Apfel)' },
        { name: 'Mittag (×3)', items: 'Jeweils: 1 Protein + 1 Kohlenhydrat + 1 Gemüse' },
        { name: 'Abendessen', items: '1 Protein + 1 Kohlenhydrat + 1 Gemüse' },
        { name: 'Snacks (alle, täglich)', items: '2 hartgekochte Eier · ½ Avocado · eine Handvoll Mandeln · 1 Apfel/Obst' },
      ],
      carbs: 'Naturreis ⅔ Tasse · Süßkartoffel 140 g · Quinoa ⅔ Tasse · Vollkornbrot 2 Scheiben · Vollkornnudeln 1 Tasse (je ca. 30 g)',
    },
  },
  proteins: 'Hähnchenbrust 100 g · Putenhack 155 g · Mageres Rind 115 g · Lachs 155 g · Weißer Fisch 115 g (je ca. 30 g Protein)',
  veggies: '1 Tasse nach Wahl (5 Tassen Blattgemüse = 1 Tasse): Spargel, Brokkoli, Paprika, Rosenkohl, Spinat, Grünkohl, Blumenkohl, Zucchini, gemischter Salat',
  grocery: [
    { group: 'Protein', items: 'Eier · Hähnchenbrust · Putenhack · Mageres Rind · Lachs · Weißer Fisch' },
    { group: 'Kohlenhydrate', items: 'Naturreis · Süßkartoffeln · Haferflocken · Quinoa · Vollkornbrot · Vollkornnudeln' },
    { group: 'Gemüse', items: 'Spargel · Brokkoli · Paprika · Rosenkohl · Spinat · Grünkohl · Blumenkohl · Zucchini · Gemischter Salat' },
    { group: 'Obst', items: 'Äpfel · Bananen · Beeren · Melone · Ananas · Grapefruit' },
    { group: 'Gesunde Fette', items: 'Avocado · Mandeln · Avocadoöl · Olivenöl · Kokosöl · Griechischer Joghurt · Chiasamen' },
  ],
  rules: [
    'Wiege dein Essen gegart (in Gramm).',
    'Koche nur mit Avocado-, Oliven- oder Kokosöl.',
    'Kein zugesetzter Zucker. Spar am Salz; würze mit Pfeffer, Kreuzkümmel, Curry und Kräutern.',
    'Trink nur Wasser (schwarzer Kaffee oder Tee ist okay).',
    'Steht im Plan "oder", wähle eine Option.',
    'Iss alle Snacks täglich und verteile sie über den Tag.',
    'Wie spät deine letzte Mahlzeit ist, spielt keine Rolle, solange sie in den Plan passt.',
  ],
};
