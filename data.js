const MD2 = {
  'phases': [
    'Héroes',
    'Enemigos',
    'Subida de nivel',
    'Oscuridad'
  ],
  'levelCosts': {
    '1': 5,
    '2': 10,
    '3': 12,
    '4': 18
  },
  'levelGains': {
    '2': {
      'hp': 1,
      'mana': 0,
      'treasure': 'Añade 1 Tesoro Raro.'
    },
    '3': {
      'hp': 1,
      'mana': 1,
      'treasure': 'Añade 1 Tesoro Épico.'
    },
    '4': {
      'hp': 2,
      'mana': 1,
      'treasure': 'Añade 1 Tesoro Épico.'
    },
    '5': {
      'hp': 2,
      'mana': 1,
      'treasure': 'Añade 1 Tesoro Épico.'
    }
  },
  'darkness': {
    'front': [
      [
        'A1',
        'Sin efecto.'
      ],
      [
        'A2',
        'Sin efecto.'
      ],
      [
        'A3',
        'Aparece 1 monstruo errante en el portal del nivel de mazmorra.'
      ],
      [
        'A4',
        'Añade 1 Tesoro Raro.'
      ],
      [
        'A5',
        'Aparece 1 cuadrilla en el portal del nivel de mazmorra.'
      ],
      [
        'A6',
        'Añade 1 Tesoro Épico.'
      ],
      [
        'A7',
        'Aparece 1 cuadrilla en el portal del nivel de mazmorra.'
      ],
      [
        'A8',
        'Añade 1 Tesoro Épico.'
      ],
      [
        'A9',
        'Aparece 1 monstruo errante en el portal del nivel de mazmorra.'
      ]
    ],
    'back': [
      [
        'R1',
        'Sin efecto.'
      ],
      [
        'R2',
        'Aparece 1 cuadrilla en el portal del nivel de mazmorra.'
      ],
      [
        'R3',
        'Sin efecto.'
      ],
      [
        'R4',
        'Aparece 1 monstruo errante en el portal del nivel de mazmorra.'
      ]
    ]
  },
  'classes': {
    'rogue': {
      'label': 'Pícaro',
      'hp': 5,
      'mana': 3,
      'ability': 'Combate \xB7 1 maná: relanza 1 dado cualquiera.',
      'shadow': 'Sombras: roba 1 ficha de Pícaro.',
      'skills': [
        [
          'Mixtura Mortal I',
          1,
          'mixtura',
          1
        ],
        [
          'Celeridad a Medida I',
          1,
          'celeridad',
          1
        ],
        [
          'Forma Sombría I',
          1,
          'forma',
          1
        ],
        [
          'Trucos Ensayados I',
          2,
          'trucos',
          1
        ],
        [
          'Kit de Herramientas I',
          2,
          'kit',
          1
        ],
        [
          'Mixtura Mortal II',
          3,
          'mixtura',
          2
        ],
        [
          'Forma Sombría II',
          3,
          'forma',
          2
        ],
        [
          'Celeridad a Medida II',
          3,
          'celeridad',
          2
        ],
        [
          'Kit de Herramientas II',
          4,
          'kit',
          2
        ],
        [
          'Trucos Ensayados II',
          4,
          'trucos',
          2
        ],
        [
          'Celeridad a Medida III',
          5,
          'celeridad',
          3
        ],
        [
          'Forma Sombría III',
          5,
          'forma',
          3
        ],
        [
          'Mixtura Mortal III',
          5,
          'mixtura',
          3
        ]
      ]
    },
    'ranger': {
      'label': 'Explorador',
      'hp': 5,
      'mana': 2,
      'ability': 'Movimiento: +1 PM.',
      'shadow': 'Sombras: roba y descarta 1 carta de Flecha y aplica Certero (=7).',
      'skills': [
        [
          'Flecha Incendiaria I',
          1,
          'incendiaria',
          1
        ],
        [
          'Flecha Perforante I',
          1,
          'perforante',
          1
        ],
        [
          'Volea de Flechas I',
          1,
          'volea',
          1
        ],
        [
          'Cuerdas Mejoradas I',
          2,
          'cuerdas',
          1
        ],
        [
          'Flecha con Arpeo I',
          2,
          'arpeo',
          1
        ],
        [
          'Volea de Flechas II',
          3,
          'volea',
          2
        ],
        [
          'Flecha Perforante II',
          3,
          'perforante',
          2
        ],
        [
          'Flecha Incendiaria II',
          3,
          'incendiaria',
          2
        ],
        [
          'Cuerdas Mejoradas II',
          4,
          'cuerdas',
          2
        ],
        [
          'Flecha con Arpeo II',
          4,
          'arpeo',
          2
        ],
        [
          'Volea de Flechas III',
          5,
          'volea',
          3
        ],
        [
          'Flecha Perforante III',
          5,
          'perforante',
          3
        ],
        [
          'Flecha Incendiaria III',
          5,
          'incendiaria',
          3
        ]
      ]
    },
    'shaman': {
      'label': 'Chamán',
      'hp': 4,
      'mana': 3,
      'ability': 'Al principio del turno, aumenta cualquier Elemento en 1.',
      'shadow': 'Sombras: aumenta cualquier Elemento al Máx.',
      'skills': [
        [
          'Tormenta de Fuego I',
          1,
          'tormenta',
          1
        ],
        [
          'Onda Curativa I',
          1,
          'onda',
          1
        ],
        [
          'Avalancha I',
          1,
          'avalancha',
          1
        ],
        [
          'Espíritu de Fuego I',
          2,
          'efuego',
          1
        ],
        [
          'Espíritu de Escarcha I',
          2,
          'ehielo',
          1
        ],
        [
          'Tormenta de Fuego II',
          3,
          'tormenta',
          2
        ],
        [
          'Onda Curativa II',
          3,
          'onda',
          2
        ],
        [
          'Avalancha II',
          3,
          'avalancha',
          2
        ],
        [
          'Espíritu de Fuego II',
          4,
          'efuego',
          2
        ],
        [
          'Espíritu de Escarcha II',
          4,
          'ehielo',
          2
        ],
        [
          'Tormenta de Fuego III',
          5,
          'tormenta',
          3
        ],
        [
          'Onda Curativa III',
          5,
          'onda',
          3
        ],
        [
          'Avalancha III',
          5,
          'avalancha',
          3
        ]
      ]
    },
    'paladin': {
      'label': 'Paladín',
      'hp': 6,
      'mana': 4,
      'ability': 'Ignora 1 Garra en cada ataque.',
      'shadow': 'Sombras: cada héroe en una Zona Consagrada realiza una Recuperación gratuita después del combate.',
      'skills': [
        [
          'Audacia I',
          1,
          'audacia',
          1
        ],
        [
          'Vínculo Vital I',
          1,
          'vinculo',
          1
        ],
        [
          'Desterrar I',
          1,
          'desterrar',
          1
        ],
        [
          'Proyección Divina I',
          2,
          'proyeccion',
          1
        ],
        [
          'Ecos Sagrados I',
          2,
          'ecos',
          1
        ],
        [
          'Audacia II',
          3,
          'audacia',
          2
        ],
        [
          'Vínculo Vital II',
          3,
          'vinculo',
          2
        ],
        [
          'Desterrar II',
          3,
          'desterrar',
          2
        ],
        [
          'Proyección Divina II',
          4,
          'proyeccion',
          2
        ],
        [
          'Ecos Sagrados II',
          4,
          'ecos',
          2
        ],
        [
          'Audacia III',
          5,
          'audacia',
          3
        ],
        [
          'Vínculo Vital III',
          5,
          'vinculo',
          3
        ],
        [
          'Desterrar III',
          5,
          'desterrar',
          3
        ]
      ]
    },
    'mage': {
      'label': 'Mago',
      'hp': 4,
      'mana': 5,
      'ability': 'Gira el Amuleto Mágico para cambiar su bonificación.',
      'shadow': 'Sombras: revisa la habilidad de Sombras de la carta del héroe.',
      'skills': [
        [
          'Surco de Fuego I',
          1,
          'surco',
          1
        ],
        [
          'Magia Oscura I',
          1,
          'oscura',
          1
        ],
        [
          'Armadura de Hielo I',
          1,
          'armadura',
          1
        ],
        [
          'Paso Temporal I',
          2,
          'paso',
          1
        ],
        [
          'Mago de Batalla I',
          2,
          'batalla',
          1
        ],
        [
          'Surco de Fuego II',
          3,
          'surco',
          2
        ],
        [
          'Magia Oscura II',
          3,
          'oscura',
          2
        ],
        [
          'Armadura de Hielo II',
          3,
          'armadura',
          2
        ],
        [
          'Paso Temporal II',
          4,
          'paso',
          2
        ],
        [
          'Mago de Batalla II',
          4,
          'batalla',
          2
        ],
        [
          'Surco de Fuego III',
          5,
          'surco',
          3
        ],
        [
          'Magia Oscura III',
          5,
          'oscura',
          3
        ],
        [
          'Armadura de Hielo III',
          5,
          'armadura',
          3
        ]
      ]
    },
    'berserker': {
      'label': 'Berserker',
      'hp': 7,
      'mana': 2,
      'ability': 'Las fichas de vida perdidas pueden pasar a la reserva de Furia (máximo 7).',
      'shadow': 'Sombras: revisa la habilidad de Sombras de la carta del héroe.',
      'skills': [
        [
          'Furia Letal I',
          1,
          'letal',
          1
        ],
        [
          'Calmante I',
          1,
          'calmante',
          1
        ],
        [
          'Luchador Enfurecido I',
          1,
          'luchador',
          1
        ],
        [
          'Carga I',
          2,
          'carga',
          1
        ],
        [
          'Revancha I',
          2,
          'revancha',
          1
        ],
        [
          'Furia Letal II',
          3,
          'letal',
          2
        ],
        [
          'Calmante II',
          3,
          'calmante',
          2
        ],
        [
          'Luchador Enfurecido II',
          3,
          'luchador',
          2
        ],
        [
          'Carga II',
          4,
          'carga',
          2
        ],
        [
          'Revancha II',
          4,
          'revancha',
          2
        ],
        [
          'Furia Letal III',
          5,
          'letal',
          3
        ],
        [
          'Carga III',
          5,
          'carga',
          3
        ],
        [
          'Revancha III',
          5,
          'revancha',
          3
        ]
      ]
    }
  }
};
MD2.shamanBlessings = {
  fire: {
    name: 'Bendición de Fuego',
    effect: 'Ataque: +1 dado amarillo.'
  },
  water: {
    name: 'Bendición de Agua',
    effect: 'Ataque: mueve al defensor 1 Zona.'
  },
  air: {
    name: 'Bendición de Aire',
    effect: 'Movimiento: +1 PM.'
  },
  nature: {
    name: 'Bendición de Naturaleza',
    effect: 'Los Espíritus tienen +1 Vida.'
  }
};
MD2.classColors = {
  rogue: '#8b5cf6',
  ranger: '#22c55e',
  shaman: '#f59e0b',
  paladin: '#3b82f6',
  mage: '#06b6d4',
  berserker: '#ef4444'
};
MD2.talismanDefaults = [
  {
    name: 'Ataque 1: +1 Espada',
    manaCost: 1,
    type: 'ataque'
  },
  {
    name: 'Cura 3',
    manaCost: 2,
    type: 'curacion'
  },
  {
    name: 'Combate 1: relanza 1 dado',
    manaCost: 1,
    type: 'combate'
  },
  {
    name: 'Mueve 1',
    manaCost: 1,
    type: 'movimiento'
  }
];
MD2.rules = {
  'linea de vision': 'La línea de visión se comprueba entre la Zona de origen y la Zona objetivo. Paredes y puertas cerradas bloquean la LdV. La app no conoce la geometría del escenario, por lo que el jugador debe verificarla en el tablero físico.',
  'puertas': 'Una puerta cerrada bloquea movimiento y línea de visión. Abrirla cuesta 1 PM durante una Acción de Movimiento, salvo una regla específica.',
  'ataque': 'Orden: formar reserva, lanzar dados, aplicar habilidades y efectos \u2014incluidos dados negros\u2014, sumar espadas y restar escudos.',
  'defensa': 'Forma la reserva de dados azules, lanza, aplica habilidades y efectos, y resta los escudos a las espadas enemigas.',
  'movimiento': 'Una Acción de Movimiento entrega 2 PM. Cada PM permite moverse, abrir una puerta o interactuar. El Explorador obtiene +1 PM.',
  'inventario': 'Al obtener un objeto puedes equiparlo inmediatamente. Si lo guardas, necesitas Intercambiar y equipar para colocarlo después. Los consumibles usados y objetos reemplazados pueden eliminarse.',
  'oscuridad': 'Al atacar en Oscuridad añade el dado de Oscuridad y revisa la habilidad de Sombras.',
  'experiencia': 'Secuaz: +1 XP al héroe que lo elimina. Líder: +2 XP a cada héroe. Errante: +4 XP a cada héroe.'
};
MD2.shamanElements = {
  fire: '\uD83D\uDD25 Fuego',
  water: '\uD83D\uDCA7 Agua',
  air: '\uD83D\uDCA8 Aire',
  nature: '\uD83C\uDF3F Naturaleza'
};
MD2.shamanAbilities = {
  basicAttack: {
    name: 'Hechizo básico de ataque',
    kind: 'attack',
    cost: {
      fire: 1,
      air: 1
    },
    effect: 'Añade 1 dado naranja al ataque.'
  },
  basicHeal: {
    name: 'Hechizo básico de curación',
    kind: 'heal',
    cost: {
      water: 1,
      nature: 1
    },
    effect: 'Cura 2 a un Héroe.'
  },
  'Tormenta de Fuego I': {
    kind: 'attack',
    cost: {
      fire: 2,
      air: 1
    },
    effect: 'Lanza 1 dado naranja. Inflige a cada Enemigo en alcance mágico tantas Heridas como espadas; +1 espada por ficha de Fuego en el objetivo, máximo 3.'
  },
  'Tormenta de Fuego II': {
    kind: 'attack',
    cost: {
      fire: 2,
      air: 1
    },
    effect: 'Lanza 2 dados naranjas. Inflige a cada Enemigo en alcance mágico tantas Heridas como espadas; +1 espada por ficha de Fuego en el objetivo, máximo 3.'
  },
  'Tormenta de Fuego III': {
    kind: 'attack',
    cost: {
      fire: 2,
      air: 1
    },
    optional: { air: 2 },
    effect: 'Lanza 3 dados naranjas. Inflige a cada Enemigo en alcance mágico tantas Heridas como espadas; +1 espada por ficha de Fuego en el objetivo, máximo 3. Puedes gastar 2 Aire adicionales para usar alcance de línea de visión en su lugar.'
  },
  'Onda Curativa I': {
    kind: 'heal',
    cost: {
      water: 1,
      air: 1
    },
    effect: 'Lanza 1 dado naranja. Cura a cada Héroe en alcance mágico tantos puntos como espadas.'
  },
  'Onda Curativa II': {
    kind: 'heal',
    cost: {
      water: 1,
      air: 1
    },
    effect: 'Lanza 2 dados naranjas. Cura a cada Héroe en alcance mágico tantos puntos como espadas.'
  },
  'Onda Curativa III': {
    kind: 'heal',
    cost: {
      water: 1,
      air: 2
    },
    optional: { nature: 2 },
    effect: 'Lanza 3 dados naranjas. Cura a cada Héroe en alcance mágico tantos puntos como espadas. Puedes gastar 2 Naturaleza adicionales para curar en su lugar a cada Héroe de tu loseta.'
  },
  'Avalancha I': {
    kind: 'attack',
    cost: {
      water: 1,
      nature: 2
    },
    effect: 'Añade 1 ficha de Escarcha a 1 Enemigo en alcance mágico.'
  },
  'Avalancha II': {
    kind: 'attack',
    cost: {
      water: 1,
      nature: 2
    },
    optional: { air: 1 },
    effect: 'Añade 1 ficha de Escarcha a 1 Enemigo en alcance mágico. Puedes gastar 1 Aire adicional para infligir 2 Heridas a 1 Enemigo con Escarcha en alcance mágico.'
  },
  'Avalancha III': {
    kind: 'attack',
    cost: {
      water: 1,
      nature: 2
    },
    optional: { air: 2 },
    effect: 'Añade 1 ficha de Escarcha a 1 Enemigo en alcance mágico. Puedes gastar 2 Aire para infligir 3 Heridas a 1 Enemigo con Escarcha; o 3 Aire para que cada Enemigo con Escarcha sufra 3 Heridas.'
  },
  'Espíritu de Fuego I': {
    kind: 'summon',
    cost: {
      fire: 2,
      nature: 2
    },
    spirit: 'fire1',
    effect: 'Coloca al Espíritu de Fuego I en tu Zona.'
  },
  'Espíritu de Fuego II': {
    kind: 'summon',
    cost: {
      fire: 2,
      nature: 2
    },
    spirit: 'fire2',
    effect: 'Coloca al Espíritu de Fuego II en tu Zona. Después añade 1 ficha de Fuego a cada Enemigo de tu Zona.'
  },
  'Espíritu de Escarcha I': {
    kind: 'summon',
    cost: {
      water: 2,
      nature: 2
    },
    spirit: 'ice1',
    effect: 'Coloca al Espíritu de Escarcha I en tu Zona.'
  },
  'Espíritu de Escarcha II': {
    kind: 'summon',
    cost: {
      water: 2,
      nature: 2
    },
    spirit: 'ice2',
    effect: 'Coloca al Espíritu de Escarcha II en tu Zona. Después añade 1 ficha de Escarcha a cada Enemigo de tu Zona.'
  }
};
MD2.shamanSpirits = {
  fire1: {
    name: 'Espíritu de Fuego I',
    hp: 3,
    defense: 0,
    attack: '1 dado naranja',
    effect: 'Ataque: el defensor recibe 1 ficha de Fuego.'
  },
  fire2: {
    name: 'Espíritu de Fuego II',
    hp: 5,
    defense: 1,
    attack: '2 dados naranjas',
    effect: 'Ataque: el defensor recibe 2 fichas de Fuego.'
  },
  ice1: {
    name: 'Espíritu de Escarcha I',
    hp: 3,
    defense: 1,
    attack: '1 dado amarillo',
    effect: 'Ataque: el defensor recibe 1 ficha de Escarcha.'
  },
  ice2: {
    name: 'Espíritu de Escarcha II',
    hp: 5,
    defense: 2,
    attack: '3 dados amarillos',
    effect: 'Ataque: el defensor recibe 1 ficha de Escarcha.'
  }
};