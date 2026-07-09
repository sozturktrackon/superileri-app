/** Spanish mirror of content/diets.json (same shape; NutritionScreen picks by
 *  active language). Portions converted to metric, as used in Spanish-speaking
 *  kitchens. */
export const dietsEs = {
  goal: 'La fórmula es simple: un déficit calórico moderado y suficiente proteína, con el estilo de alimentación que de verdad puedas mantener. Apunta a perder un 0,5–1 % de tu peso corporal por semana; perder despacio conserva el músculo.',
  habits: [
    {
      icon: '🍗',
      title: 'Proteína primero, en cada comida',
      text: 'Apunta a ~1,6–2,2 g de proteína por kilo de peso corporal al día. Come la proteína y las verduras antes que los carbohidratos: te mantendrás saciado más tiempo y tu energía será más estable.',
    },
    {
      icon: '🚶',
      title: 'Muévete después de comer',
      text: 'Una caminata de 2 a 5 minutos después de comer reduce de forma notable el pico de azúcar en sangre. ¿Atado al escritorio? Haz elevaciones de talón sentado (sube y baja el talón con la punta del pie en el suelo). Funcionan incluso sentado.',
    },
    {
      icon: '🥤',
      title: 'Corta el azúcar y las calorías líquidas',
      text: 'Agua, café o té. Evita las bebidas azucaradas y el azúcar añadido. Este único cambio ya hace gran parte del trabajo.',
    },
    {
      icon: '🥦',
      title: 'Sobre todo alimentos naturales',
      text: 'Muchas verduras y comida poco procesada. Al dejar los ultraprocesados, la gente come notablemente menos sin proponérselo.',
    },
    {
      icon: '🔁',
      title: 'Elige un patrón que puedas mantener',
      text: 'Keto, ayuno intermitente o comidas fijas: todos funcionan SI se cumple lo de arriba. La mejor dieta es la que de verdad mantienes. La constancia vale más que la perfección.',
    },
    {
      icon: '😴',
      title: 'Sueño y pasos',
      text: 'Dormir de 7 a 9 horas y caminar a diario impulsan la pérdida de grasa sin que lo notes y frenan los antojos. No los subestimes.',
    },
  ],
  dinnerCarbNote:
    'Palanca opcional: reducir los carbohidratos en la cena ayuda a muchas personas a controlar el total de calorías. Es una táctica práctica, no una regla. Las calorías importan mucho más que el horario de los carbohidratos.',
  mealPlans: {
    lean: {
      name: 'Plantilla de comidas Lean',
      summary: '4 comidas + snacks · menos carbohidratos y grasa, más proteína · la cena va sin carbohidratos.',
      meals: [
        { name: 'Desayuno', items: '1 proteína + 1 carbohidrato + 1 fruta (p. ej. 2 huevos · ½ taza de avena o 1 rebanada de pan integral · 1 manzana)' },
        { name: 'Almuerzo (×2)', items: 'Cada uno: 1 proteína + 1 carbohidrato + 1 verdura' },
        { name: 'Cena', items: '1 proteína + 1 verdura (sin carbohidratos)' },
        { name: 'Snacks (todos, cada día)', items: '2 huevos duros · ½ aguacate · un puñado de almendras (o yogur griego) · 1 manzana/fruta' },
      ],
      carbs: 'Arroz integral ½ taza · Batata 115 g · Quinoa ½ taza · Pan integral 1½ rebanadas · Pasta integral ⅔ de taza (~22–25 g cada uno)',
    },
    bulk: {
      name: 'Plantilla de comidas Bulk',
      summary: '5 comidas + snacks · nivel medio-alto en todos los macros · incluye a diario 1 comida con carne magra de res o salmón.',
      meals: [
        { name: 'Desayuno', items: '1 proteína + 1 carbohidrato + 1 fruta (p. ej. 3 huevos · ½ taza de avena · 1 manzana)' },
        { name: 'Almuerzo (×3)', items: 'Cada uno: 1 proteína + 1 carbohidrato + 1 verdura' },
        { name: 'Cena', items: '1 proteína + 1 carbohidrato + 1 verdura' },
        { name: 'Snacks (todos, cada día)', items: '2 huevos duros · ½ aguacate · un puñado de almendras · 1 manzana/fruta' },
      ],
      carbs: 'Arroz integral ⅔ de taza · Batata 140 g · Quinoa ⅔ de taza · Pan integral 2 rebanadas · Pasta integral 1 taza (~30 g cada uno)',
    },
  },
  proteins: 'Pechuga de pollo 100 g · Pavo molido 155 g · Res magra 115 g · Salmón 155 g · Pescado blanco 115 g (~30 g de proteína cada uno)',
  veggies: '1 taza de cualquiera (5 tazas de hojas verdes = 1 taza): espárragos, brócoli, pimientos, coles de Bruselas, espinacas, kale, coliflor, calabacín, mezcla de hojas verdes',
  grocery: [
    { group: 'Proteína', items: 'Huevos · Pechuga de pollo · Pavo molido · Res magra · Salmón · Pescado blanco' },
    { group: 'Carbohidratos', items: 'Arroz integral · Batata · Avena · Quinoa · Pan integral · Pasta integral' },
    { group: 'Verduras', items: 'Espárragos · Brócoli · Pimientos · Coles de Bruselas · Espinacas · Kale · Coliflor · Calabacín · Mezcla de hojas verdes' },
    { group: 'Fruta', items: 'Manzanas · Plátanos · Frutos rojos · Melón · Piña · Toronja' },
    { group: 'Grasas saludables', items: 'Aguacate · Almendras · Aceite de aguacate · Aceite de oliva · Aceite de coco · Yogur griego · Semillas de chía' },
  ],
  rules: [
    'Pesa la comida ya cocinada (en gramos).',
    'Cocina solo con aceite de aguacate, de oliva o de coco.',
    'Nada de azúcar añadido. Modera la sal; usa pimienta, comino, curry y hierbas.',
    'Bebe solo agua (café o té sin azúcar están bien).',
    'Si el plan dice "o", elige una opción.',
    'Come todos tus snacks cada día, repartidos a lo largo del día.',
    'No importa lo tarde que sea tu última comida, siempre que encaje en el plan.',
  ],
};
