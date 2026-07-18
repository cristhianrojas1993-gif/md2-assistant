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
        '1',
        'Sin efecto.'
      ],
      [
        '2',
        'Sin efecto.'
      ],
      [
        '3',
        'Aparece 1 monstruo errante en el portal del nivel de mazmorra.'
      ],
      [
        '4',
        'Añade 1 Tesoro Raro.'
      ],
      [
        '5',
        'Aparece 1 cuadrilla en el portal del nivel de mazmorra.'
      ],
      [
        '6',
        'Añade 1 Tesoro Épico.'
      ],
      [
        '7',
        'Aparece 1 cuadrilla en el portal del nivel de mazmorra.'
      ],
      [
        '8',
        'Añade 1 Tesoro Épico.'
      ],
      [
        '9',
        'Aparece 1 monstruo errante en el portal del nivel de mazmorra.'
      ]
    ],
    'back': [
      [
        '1',
        'Sin efecto.'
      ],
      [
        '2',
        'Aparece 1 cuadrilla en el portal del nivel de mazmorra.'
      ],
      [
        '3',
        'Sin efecto.'
      ],
      [
        '4',
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
};MD2.missions = [
  {
    name: 'Carretera al Infierno',
    tiles: '1A, 3A, 5A',
    objectives: [
      'Abrir el Portón',
      'Entrar al Infierno'
    ],
    rules: 'El Portón (puerta con contorno blanco) deja pasar a los enemigos libremente, pero los héroes no pueden abrirlo por medios normales; bloquea la línea de visión. Hay 2 interruptores (fichas de Objetivo bocarriba): cualquier héroe en su zona gasta 1 punto de movimiento para activarlo y retirarlo, ganando 3 XP. Cuando ambos están activados, el Portón se abre y se revela la Cámara. Para terminar, cualquier héroe en la zona del Altar gasta 1 punto de movimiento para salir de la mazmorra; cuando todos salieron, victoria.'
  },
  {
    name: 'El Paso',
    tiles: '2A, 4A, 5A',
    objectives: [
      'Proteger al Invocador hasta la Grieta',
      'Entrar al Infierno por la Grieta'
    ],
    rules: 'En la preparación se usa una miniatura de héroe sobrante (sin peana) para representar al Invocador, colocada en la zona de inicio. Desde la segunda ronda, al inicio de cada Fase de Héroes, el Invocador se mueve solo 2 zonas hacia la puerta blanca por el camino más corto. No puede abrir puertas ni abandonar una zona con enemigos, cuenta como héroe para ser elegido como objetivo, pero no actúa ni lleva objetos. Al llegar a la puerta blanca la abre y revela la Cámara (o sigue avanzando si ya estaba abierta). Al llegar a la Grieta se retira al Invocador y cualquier héroe puede gastar 1 punto de movimiento ahí para salir de la mazmorra. Atributos del Invocador: Vida 8, Defensa 2 (azul).'
  },
  {
    name: 'El Artefacto Demoníaco',
    tiles: '1B, 3B, 5B, 7B',
    objectives: [
      'Reunir los 3 Fragmentos',
      'Forjar el Artefacto con Fuego Infernal'
    ],
    rules: 'Los Fragmentos son fichas de Objetivo bocarriba; cualquier héroe puede recogerlas interactuando en su zona, ganando 5 XP cada una. Una vez reunidos los 3, si todos los héroes que llevan al menos 1 Fragmento están en la zona de la Forja Demoníaca (ficha gris), cualquiera de ellos gasta 1 acción para forjar el Artefacto y ganar la misión.'
  },
  {
    name: 'La Espada Maldita',
    tiles: '1B, 2B, 5B, 6A',
    objectives: [
      'Destruir los 5 Cristales del Pecado',
      'No dejar que la Espada Maldita derrote a ningún héroe'
    ],
    rules: 'En la preparación se busca el "Espadón Enorme" en el mazo de Tesoro Común y se asigna a un héroe como arma inicial: es la Espada Maldita, que no puede guardarse en inventario. Quien la porta recibe heridas automáticas al inicio de cada Fase de Héroes según rondas consecutivas con ella: 1ª ronda 1 herida, 2ª ronda 2 heridas, 3ª ronda 3 heridas, 4ª ronda consecutiva = derrota inmediata de la misión (heridas antes que cualquier resurrección). Se usan fichas de Corrupción para contar las rondas; al pasar la espada a otro héroe con una acción de Intercambio, la cuenta se reinicia. Un héroe con la Espada en la zona de un Cristal del Pecado (ficha de Objetivo) gasta 1 acción para destruirlo, ganando 5 XP; al destruir los 5, victoria. La Espada gana dados de ataque según cristales destruidos: 1 cristal +1 amarillo, 2 cristales +2 amarillos, 3 cristales +2 amarillos y +1 rojo, 4 cristales +2 amarillos y +2 rojos. Modo Solitario: las heridas no son acumulativas (siempre 1 por ronda), el héroe no es derrotado tras 4 rondas, y puede elegir cualquier arma inicial como "Arma Maldita".'
  },
  {
    name: 'Laberinto Infernal',
    tiles: '3B, 4B, 5B, 6A (desconectadas)',
    objectives: [
      'Matar a las 4 Bestias Errantes especiales'
    ],
    rules: 'En la preparación se coloca 1 ficha de Corrupción en cada una de las 4 zonas indicadas. Las losetas no están conectadas: solo se accede mediante pasadizos mágicos (fichas de Objetivo); cualquier héroe en una zona con ficha de Objetivo gasta 1 punto de movimiento para moverse a otra zona con ficha de Objetivo. Al revelar una Cámara con ficha de Corrupción, además de lo habitual, aparece un Monstruo Errante (una Bestia) en la zona marcada. Cuadrillas y Monstruos Errantes también usan los pasadizos: en Fase de Enemigos, si no hay héroes en una loseta, se mueven a la zona de Objetivo más cercana (todas las zonas con Objetivo se consideran adyacentes entre sí para ellos, aunque no haya línea de visión real). Al morir las 4 Bestias, victoria.'
  },
  {
    name: 'La Bestia Terrorífica',
    tiles: '1B, 4B, 5B, 7B',
    objectives: [
      'Usar las Plumas de Ángel para volver vulnerable a la Bestia',
      'Derrotar a la Bestia'
    ],
    rules: 'En la preparación aparece un Monstruo Errante de Nivel 5 al azar en la zona indicada: es la Bestia. Se activa normalmente en Fase de Enemigos pero es invulnerable por defecto (no puede ser objetivo de ataques, habilidades ni sufrir heridas). Las Plumas de Ángel son fichas de Objetivo: cualquier héroe en su zona gasta 1 punto de movimiento para recogerlas (puede llevar varias). Un héroe con una Pluma en la zona de la Bestia gasta 1 punto de movimiento para colocarla sobre ella. Mientras tenga al menos 1 Pluma encima, la Bestia es vulnerable. Al inicio de cada ronda se retiran todas las Plumas de la Bestia y vuelve a ser invulnerable. Al morir la Bestia, victoria.'
  },
  {
    name: 'Liberar a Miguel',
    tiles: '2B, 4B, 8A',
    objectives: [
      'Acceder a la Cámara de la Corrupción rompiendo todos los Sellos',
      'Liberar a Miguel'
    ],
    rules: 'Miguel está prisionero en la Loseta 8A (Cámara del Jefe), accesible solo por la puerta blanca, que se abre al romper todos los Sellos de Corrupción. Al abrirla no se revela carta de Puerta; al entrar un héroe comienza el Combate Final. Cada Sello es una ficha de Corrupción: romperlo cuesta 1 acción en su zona, da 5 XP por héroe y retira la ficha. Combate Final: al entrar un héroe, todos van a la Zona de Inicio del Combate Final; se retiran las losetas ajenas a la Cámara del Jefe con sus componentes, se retira el Medidor de Oscuridad y se coloca el Tablero de Jefe de Miguel; los héroes recuperan Vida y Maná al máximo. Se colocan 2 fichas de Corrupción por héroe en las Zonas de Sombras, repartidas parejo entre ellas (elegidas por los jugadores); luego se hace una Fase de Subida de Nivel y comienza nueva Fase de Héroes. Miguel es invulnerable mientras haya fichas de Corrupción en su loseta. Un héroe en zona con ficha de Corrupción gasta 1 acción para eliminarla, pero lanza 1 dado negro: garra = 1 herida, mano = 1 ficha de Corrupción en su propio tablero, ambos símbolos = ambas cosas. Si algún efecto agrega fichas de Corrupción a la loseta, Miguel vuelve a ser invulnerable. Al morir Miguel, victoria.'
  },
  {
    name: 'Recolector de Almas',
    tiles: '2B, 3B, 5B, 6B',
    objectives: [
      'Recolectar 10 Almas por héroe',
      'Salir por el Portón al Valle de las Almas'
    ],
    rules: 'Se ganan Almas matando enemigos: 1 Alma por Secuaz o Líder eliminado, 3 Almas por Monstruo Errante. Las fichas de Objetivo son Jaulas de Almas: destruirlas (1 acción en su zona) da 5 Almas y 5 XP al héroe. Se usan fichas de Vida en la zona del Portón (ficha gris) para llevar la cuenta de Almas recolectadas. Al reunir colectivamente 10 Almas por héroe, cualquier héroe en la zona del Portón gasta 1 punto de movimiento para salir; al salir todos, victoria.'
  },
  {
    name: 'Las Llaves del Alma',
    tiles: '6B, 7A, 8B',
    objectives: [
      'Recoger las Llaves del Alma antes de que desaparezcan',
      'Derrotar a la Parca'
    ],
    rules: 'La Parca espera en la Cámara del Tiempo (Loseta 8B, Cámara del Jefe), accesible solo por la puerta blanca, que se abre al reunir las 3 Llaves del Alma. Al abrirla no se revela carta de Puerta; al entrar un héroe comienza el Combate Final. En la preparación se colocan fichas de Tiempo sobre cada ficha de Objetivo según el mapa; en cada Fase de Oscuridad se retira 1 ficha de Tiempo de cada una. Si hay que retirar una ficha de Tiempo y no quedan, ese Objetivo desaparece y la misión termina en derrota. Cada Llave es una ficha de Objetivo: recogerla cuesta 1 acción en su zona y da 8 XP por héroe; si desaparece una sola Llave, derrota inmediata. Los enemigos se mueven libremente a través de puertas cerradas (Planos Etéreos); las puertas cerradas igual bloquean línea de visión. Combate Final: al entrar un héroe se agrupa a todos en la Zona de Inicio del Combate Final, se limpian las losetas ajenas y se coloca el Tablero de Jefe de la Parca; héroes recuperan Vida y Maná al máximo. Se colocan 2 fichas de Tiempo en cada Zona de Reloj de Arena, se hace una Fase de Subida de Nivel y comienza nueva Fase de Héroes. Un héroe en una Zona de Reloj de Arena gasta 1 acción para añadir 1 ficha de Tiempo a esa zona. Si hay que eliminar una ficha de Tiempo por habilidad de la Parca y no quedan en esa zona, derrota. Al matar a la Parca, victoria.'
  },
  {
    name: 'Hellscape',
    tiles: '2B, 3A, 5A, 6A, 7A',
    objectives: [
      'Todos los héroes deben llegar a la Loseta 5A',
      'Derrotar al Monstruo Errante Final'
    ],
    rules: 'Los héroes empiezan separados, cada uno en una Zona de Inicio distinta (con 5-6 héroes, 1 o 2 zonas pueden tener 2 héroes como máximo). A todos los efectos (cuadrillas con solo 2 secuaces y líder, monstruos errantes con vida de 2 héroes) se trata como partida de 2 héroes, excepto para el Monstruo Errante Final. Con menos de 4 héroes se retiran losetas de sobra, dejando la central más 1 loseta por héroe (nunca se retira la 5A). La Loseta central (5A) solo es accesible por Puertas Dimensionales (contorno blanco), inicialmente cerradas; una se abre sola cuando ya no quedan enemigos en su loseta y todas las Cámaras fueron reveladas (sin revelar carta de Puerta en la 5A). Una vez que un héroe abrió su Puerta Dimensional, puede moverse libremente por todas las demás sin abrirlas. Las puertas cerradas bloquean línea de visión. Cuando las 5 puertas de la Loseta 5A están abiertas, aparece un Monstruo Errante de Nivel 5 en su zona central; se roban cartas del mazo de Objetos de Cuadrilla de Nivel 5 hasta encontrar un arma con el mismo tipo de ataque que el Monstruo, y se le añade esa arma. A diferencia de otros Monstruos Errantes, este tiene vida equivalente al número de héroes en la partida. Al morir, victoria.'
  }
];
