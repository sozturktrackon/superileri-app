/** Brazilian Portuguese mirror of content/diets.json (same shape;
 *  NutritionScreen picks by active language). Food terms and measures
 *  localized to what Brazilian kitchens use (grams, xícaras). */
export const dietsPt = {
  goal: 'A fórmula é simples: um pequeno déficit calórico e proteína suficiente, no estilo de alimentação que você realmente vai conseguir manter. Tente perder de 0,5 a 1% do seu peso corporal por semana; emagrecer devagar preserva o músculo.',
  habits: [
    {
      icon: '🍗',
      title: 'Proteína primeiro, em toda refeição',
      text: 'Mire em cerca de 1,6 a 2,2 g de proteína por quilo de peso corporal por dia. Coma a proteína e os vegetais antes dos carboidratos: você fica satisfeito por mais tempo e sua energia se mantém mais estável.',
    },
    {
      icon: '🚶',
      title: 'Mexa-se depois de comer',
      text: 'Uma caminhada de 2 a 5 minutos depois da refeição reduz bem o pico de glicose no sangue. Não dá para levantar do trabalho? Sem problema: com a ponta do pé no chão, suba e desça o calcanhar. Elevação de panturrilha funciona até sentado na cadeira.',
    },
    {
      icon: '🥤',
      title: 'Corte o açúcar e as calorias líquidas',
      text: 'Água, café ou chá. Fuja de refrigerante, bebidas açucaradas e açúcar adicionado. Só essa troca já faz boa parte do trabalho.',
    },
    {
      icon: '🥦',
      title: 'Comida de verdade na maior parte do tempo',
      text: 'Bastante vegetal e alimentos pouco processados. Quem corta os ultraprocessados passa a comer bem menos sem nem perceber.',
    },
    {
      icon: '🔁',
      title: 'Escolha um padrão que você vai manter',
      text: 'Keto, jejum intermitente ou refeições fixas: tudo funciona SE os pontos acima forem cumpridos. A melhor dieta é a que você realmente segue. Constância vale mais que perfeição.',
    },
    {
      icon: '😴',
      title: 'Sono e passos',
      text: 'Dormir de 7 a 9 horas e caminhar todos os dias aceleram a queima de gordura sem você nem perceber e cortam a vontade de beliscar. Não subestime esses dois.',
    },
  ],
  dinnerCarbNote:
    'Tática opcional: pegar mais leve nos carboidratos do jantar ajuda muita gente a controlar o total de calorias. É uma ferramenta útil, não uma regra. As calorias importam muito mais do que o horário do carboidrato.',
  mealPlans: {
    lean: {
      name: 'Modelo de refeições Lean',
      summary: '4 refeições + lanches · menos carboidrato e gordura, mais proteína · jantar sem carboidrato.',
      meals: [
        { name: 'Café da manhã', items: '1 proteína + 1 carboidrato + 1 fruta (ex.: 2 ovos · meia xícara de aveia ou 1 fatia de pão integral · 1 maçã)' },
        { name: 'Almoço (×2)', items: 'Cada um: 1 proteína + 1 carboidrato + 1 vegetal' },
        { name: 'Jantar', items: '1 proteína + 1 vegetal (sem carboidrato)' },
        { name: 'Lanches (todos, diariamente)', items: '2 ovos cozidos · meio abacate · um punhado de amêndoas (ou iogurte grego) · 1 maçã/fruta' },
      ],
      carbs: 'Arroz integral meia xícara · Batata-doce 115 g · Quinoa meia xícara · Pão integral 1 fatia e meia · Macarrão integral 2/3 de xícara (~22–25 g cada)',
    },
    bulk: {
      name: 'Modelo de refeições Bulk',
      summary: '5 refeições + lanches · moderado a alto em todos os macros · inclua 1 refeição com carne magra ou salmão por dia.',
      meals: [
        { name: 'Café da manhã', items: '1 proteína + 1 carboidrato + 1 fruta (ex.: 3 ovos · meia xícara de aveia · 1 maçã)' },
        { name: 'Almoço (×3)', items: 'Cada um: 1 proteína + 1 carboidrato + 1 vegetal' },
        { name: 'Jantar', items: '1 proteína + 1 carboidrato + 1 vegetal' },
        { name: 'Lanches (todos, diariamente)', items: '2 ovos cozidos · meio abacate · um punhado de amêndoas · 1 maçã/fruta' },
      ],
      carbs: 'Arroz integral 2/3 de xícara · Batata-doce 140 g · Quinoa 2/3 de xícara · Pão integral 2 fatias · Macarrão integral 1 xícara (~30 g cada)',
    },
  },
  proteins: 'Peito de frango 100 g · Peru moído 155 g · Carne bovina magra 115 g · Salmão 155 g · Peixe branco 115 g (~30 g de proteína cada)',
  veggies: '1 xícara de qualquer um (5 xícaras de folhas verdes = 1 xícara): aspargos, brócolis, pimentão, couve-de-bruxelas, espinafre, couve, couve-flor, abobrinha, mix de folhas',
  grocery: [
    { group: 'Proteína', items: 'Ovos · Peito de frango · Peru moído · Carne bovina magra · Salmão · Peixe branco' },
    { group: 'Carboidratos', items: 'Arroz integral · Batata-doce · Aveia · Quinoa · Pão integral · Macarrão integral' },
    { group: 'Vegetais', items: 'Aspargos · Brócolis · Pimentão · Couve-de-bruxelas · Espinafre · Couve · Couve-flor · Abobrinha · Mix de folhas' },
    { group: 'Frutas', items: 'Maçã · Banana · Frutas vermelhas · Melão · Abacaxi · Toranja' },
    { group: 'Gorduras boas', items: 'Abacate · Amêndoas · Óleo de abacate · Azeite de oliva · Óleo de coco · Iogurte grego · Semente de chia' },
  ],
  rules: [
    'Pese os alimentos já cozidos (em gramas).',
    'Cozinhe só com óleo de abacate, azeite de oliva ou óleo de coco.',
    'Nada de açúcar adicionado. Maneire no sal; use pimenta, cominho, curry e ervas.',
    'Beba só água (café ou chá sem açúcar pode).',
    'Se o plano disser "ou", escolha uma das opções.',
    'Coma todos os lanches todos os dias, distribuídos ao longo do dia.',
    'Não importa o horário da sua última refeição, desde que ela caiba no plano.',
  ],
};
