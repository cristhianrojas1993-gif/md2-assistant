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
MD2.rulesTopics = [
  {
    id: 'dados',
    keywords: ['dado', 'dados', 'colores de dado', 'dado amarillo', 'dado naranja', 'dado azul', 'dado negro', 'dado sombra'],
    text: 'Hay 5 tipos de dados. Amarillo y naranja son de Ataque (el amarillo tiende a dar más maná, el naranja más daño). El azul es de Defensa. El púrpura es el dado de Sombra, que solo usan los héroes al atacar desde una Zona de Sombra y da bonificaciones extra. El negro es el dado de Enemigo, usado solo por los enemigos tanto al atacar como al defender. Resultados: espada = 1 de daño (genera Heridas si no se bloquea), estrella = restaura 1 de maná al atacante, escudo = bloquea 1 de daño, símbolo de sombra = activa la Habilidad de Sombra del héroe, y el símbolo de garra del dado de enemigo siempre inflige 1 Herida sin poder bloquearse; el símbolo de mano activa las habilidades especiales del enemigo.'
  },
  {
    id: 'tablero_heroe',
    keywords: ['tablero de heroe', 'dashboard', 'ficha de heroe', 'slots de objeto', 'ranura'],
    text: 'Cada jugador tiene su propio tablero con la carta de Héroe, el seguimiento de experiencia y nivel, y 6 ranuras de objeto: Cabeza, Pecho, Piernas, Miscelánea y 2 para Manos (un objeto a dos manos ocupa ambas ranuras de mano). Solo los objetos colocados en estas ranuras están activos; el resto son inventario.'
  },
  {
    id: 'carta_heroe',
    keywords: ['carta de heroe', 'habilidad de heroe', 'habilidad de sombra propia'],
    text: 'La carta de cada Héroe muestra su nombre, clase, Vida y Maná iniciales, su Habilidad de Héroe (siempre disponible) y su Habilidad de Sombra (solo se activa cuando el dado de Sombra muestra ese símbolo).'
  },
  {
    id: 'carta_habilidad',
    keywords: ['carta de habilidad', 'skill', 'numeral romano', 'habilidad rango', 'mejorar habilidad'],
    text: 'Las habilidades con número romano (I, II...) son habilidades de rango: se pueden mejorar al subir de nivel, pero solo si ya tienes el rango anterior. Cada habilidad indica el nivel mínimo de héroe necesario para adquirirla.'
  },
  {
    id: 'bolsa_tesoro',
    keywords: ['bolsa de tesoro', 'treasure bag', 'ficha de tesoro', 'tesoro comun', 'tesoro raro', 'tesoro epico'],
    text: 'La Bolsa de Tesoro contiene fichas de tesoro Común, Raro y Épico. Cuando el juego indica sacar fichas de tesoro, se sacan al azar de la bolsa. Al recoger una ficha, se devuelve a la bolsa y se roba una carta del mazo de objetos correspondiente a su rareza. A medida que avanza la partida, se agregan más fichas de tesoros mejores a la bolsa.'
  },
  {
    id: 'cartas_objeto',
    keywords: ['carta de objeto', 'item', 'objeto comun', 'objeto raro', 'objeto epico', 'color de carta', 'arma', 'armadura'],
    text: 'Los objetos tienen 7 mazos distintos según su origen. El color de fondo indica su rareza: verde Común, azul Raro, púrpura Épico, beige objetos iniciales (cuentan como Común), gris Consumibles (cuentan como Común), y los objetos de Set tienen colores propios. Las armas suelen dar dados de Ataque; las armaduras, dados de Defensa.'
  },
  {
    id: 'enemigos_general',
    keywords: ['tipos de enemigo', 'cuadrilla', 'mob', 'monstruo errante', 'jefe', 'boss'],
    text: 'Hay 3 tipos de enemigos: Cuadrillas (un Líder más Secuaces, actúan como grupo), Monstruos Errantes (enemigos únicos y poderosos que recorren la mazmorra solos) y Jefes (con reglas únicas, normalmente ligados al objetivo de la misión).'
  },
  {
    id: 'cuadrillas_detalle',
    keywords: ['secuaz', 'lider de cuadrilla', 'vida de mob', 'recompensa de mob'],
    text: 'Una carta de Cuadrilla muestra la recompensa de tesoro (para quien mata al Líder), la vida de cada miniatura, los dados de Defensa que suma el grupo, y su habilidad especial (activada por el símbolo de mano en los dados de enemigo). El nivel de mazmorra determina qué cuadrillas aparecen.'
  },
  {
    id: 'errantes_detalle',
    keywords: ['monstruo errante detalle', 'patron de activacion', 'recompensa fija'],
    text: 'Los Monstruos Errantes tienen vida según la cantidad de héroes en la partida, y además de la recompensa normal de tesoro, entregan una Recompensa Fija (no se saca de la bolsa). Cada uno tiene su propio patrón de activación descrito en su carta.'
  },
  {
    id: 'jefes_detalle',
    keywords: ['pista de jefe', 'habilidad de combate del jefe', 'habilidad pasiva del jefe', 'dados de activacion'],
    text: 'Cada Jefe tiene: dados de Activación (cuántos dados de enemigo lanza por acción), número de Acciones por Fase de Enemigos, dados de Ataque/Defensa, Habilidades de Combate (efectos al atacar o defender), Habilidades Especiales (activadas por símbolos de mano) y Habilidades Pasivas (siempre activas, ligadas a la Pista de Jefe, que reemplaza al Medidor de Oscuridad durante el combate final).'
  },
  {
    id: 'losetas_zonas',
    keywords: ['loseta', 'zona', 'zona de sombra', 'zona de luz', 'pared'],
    text: 'Cada Loseta tiene 9 Zonas. Una Zona de aspecto oscuro es una Zona de Sombra (otorga ventajas al héroe); el resto son Zonas de Luz. Las Zonas son adyacentes si están pegadas ortogonalmente y no separadas por una pared o puerta cerrada. No hay límite de miniaturas por Zona.'
  },
  {
    id: 'camaras_corredores',
    keywords: ['camara', 'corredor', 'revelar camara'],
    text: 'Un Corredor es cualquier Zona que no forma parte de una Cámara (sin reglas especiales). Una Cámara es un grupo de Zonas rodeado de paredes, a la que se entra por puertas. Al abrir por primera vez una puerta de una Cámara, esta se revela: se resuelve la carta de Puerta, luego aparecen los enemigos, y por último se colocan los tesoros.'
  },
  {
    id: 'cartas_puerta',
    keywords: ['carta de puerta', 'door card', 'evento de puerta'],
    text: 'Las cartas de Puerta tienen un evento que se resuelve la primera vez que se abre la puerta de una Cámara, antes de que aparezcan enemigos o tesoros. Después se descarta, salvo que la carta diga lo contrario.'
  },
  {
    id: 'fases_ronda',
    keywords: ['fases de la ronda', 'orden de fases', 'ronda de juego'],
    text: 'Cada ronda tiene 4 fases en orden: 1) Fase de Héroes (cada héroe actúa), 2) Fase de Enemigos (los enemigos contraatacan), 3) Fase de Subida de Nivel (se gasta experiencia acumulada), 4) Fase de Oscuridad (el peligro aumenta). Al terminar las 4, empieza una ronda nueva.'
  },
  {
    id: 'accion_movimiento',
    keywords: ['accion de movimiento', 'puntos de movimiento', 'pm', 'dano de reaccion', 'moverse'],
    text: 'La Acción de Movimiento da 2 Puntos de Movimiento (PM). Cada PM sirve para: moverse a una Zona adyacente, abrir una puerta en la Zona actual, o interactuar con algo en la Zona actual. Los PM no gastados se pierden al final de la acción. Si un héroe sale de una Zona con enemigos, sufre Daño de Reacción: 1 Herida por cada miniatura enemiga presente.'
  },
  {
    id: 'abrir_puerta',
    keywords: ['abrir puerta', 'puerta cerrada', 'puerta abierta'],
    text: 'Un héroe en una Zona con una puerta cerrada puede gastar 1 PM para abrirla. Abrir una puerta no termina la Acción de Movimiento, así que los PM restantes se pueden seguir usando. Las puertas no se pueden volver a cerrar.'
  },
  {
    id: 'interactuar',
    keywords: ['interactuar', 'recoger tesoro', 'objetos en la zona'],
    text: 'Un héroe puede interactuar con 1 objeto en su Zona por cada PM que gaste, siempre que no haya enemigos presentes. Al interactuar con una ficha de tesoro, se recoge y se saca una carta del mazo correspondiente a su rareza. Al recoger objetos se pueden equipar de inmediato o repartir a otro héroe en la misma Zona.'
  },
  {
    id: 'linea_vision',
    keywords: ['linea de vision', 'ldv', 'line of sight', 'ver al enemigo'],
    text: 'Un atacante tiene línea de visión a su objetivo si no hay paredes ni puertas cerradas entre ambos en línea recta. Otros héroes y enemigos no bloquean la línea de visión. Los ataques Mágicos y a Distancia siempre requieren línea de visión; los Cuerpo a cuerpo no, porque exigen estar en la misma Zona.'
  },
  {
    id: 'accion_ataque',
    keywords: ['accion de ataque', 'tipo de ataque', 'cuerpo a cuerpo', 'melee', 'magico', 'a distancia', 'ranged'],
    text: 'Hay 3 tipos de ataque: Cuerpo a cuerpo (atacante y objetivo en la misma Zona), Mágico (misma Zona o 1 Zona de distancia con línea de visión) y A Distancia (1 o más Zonas de distancia, siempre con línea de visión, nunca contra alguien en la misma Zona). Los ataques y el movimiento siempre son ortogonales, nunca diagonales.'
  },
  {
    id: 'resolver_ataque',
    keywords: ['resolver ataque', 'reserva de dados', 'sumar espadas', 'restar escudos', 'lanzar dados'],
    text: 'Para resolver un ataque: 1) Reunir y lanzar todos los dados (ataque del atacante, defensa del defensor, dado de sombra si aplica, dados de enemigo según secuaces). 2) Aplicar habilidades y efectos en el orden que el jugador que tira los dados decida, sin poder re-tirar un dado ya resuelto. 3) Sumar todas las espadas y restar los escudos; el resultado son las Heridas infligidas. El máximo por tirada es 3 dados de cada color de ataque, 5 azules, 1 de sombra y 6 de enemigo.'
  },
  {
    id: 'experiencia_combate',
    keywords: ['xp por matar', 'experiencia por eliminar', 'ganar experiencia'],
    text: 'Por cada enemigo eliminado, el héroe que dio el golpe final gana 1 XP. Si es un Líder de Cuadrilla, todos los héroes ganan 2 XP adicionales; si es un Monstruo Errante, todos ganan 4 XP adicionales. Al matar un Líder o Errante también se recogen sus tesoros y objetos.'
  },
  {
    id: 'intercambiar_equipar',
    keywords: ['intercambiar y equipar', 'trade and equip', 'repartir objetos'],
    text: 'Gastando 1 acción, un héroe activa su Zona para comerciar: todos los héroes en esa Zona pueden intercambiar y equipar objetos libremente. Aunque solo se quiera equipar algo del propio inventario sin intercambiar con nadie, igual se necesita que un héroe gaste la acción de Intercambiar y Equipar.'
  },
  {
    id: 'recuperar',
    keywords: ['accion de recuperar', 'recover', 'recuperar vida o mana'],
    text: 'Gastando 1 acción de Recuperación, un héroe gana hasta 2 puntos entre Vida y Maná, en cualquier combinación (2 Vida, 2 Maná, o 1 de cada).'
  },
  {
    id: 'acciones_especiales',
    keywords: ['accion especial', 'accion action', 'gastar una accion'],
    text: 'Algunas habilidades u objetos indican "Acción": el héroe puede gastar 1 de sus 3 acciones del turno para activar ese efecto.'
  },
  {
    id: 'objetos_set',
    keywords: ['objeto de set', 'set item', 'shadowbane'],
    text: 'Los objetos de un mismo Set comparten nombre (por ejemplo, "Set Shadowbane"). Con al menos 2 piezas equipadas del mismo set se obtiene su poder Menor; con 4 o más, el poder Mayor. Si se quita una pieza y ya no se cumple el mínimo, se pierde el poder correspondiente.'
  },
  {
    id: 'consumibles',
    keywords: ['objeto consumible', 'pocion', 'consumable'],
    text: 'Los consumibles (pociones y similares) no ocupan ranuras de equipo; se guardan junto al tablero del héroe. Se pueden usar en cualquier momento, antes o después de una acción, incluso durante la Fase de Enemigos. Al usarse, se descartan.'
  },
  {
    id: 'fase_enemigos',
    keywords: ['fase de enemigos', 'enemy phase', 'contraataque'],
    text: 'En la Fase de Enemigos, cada Cuadrilla y Monstruo Errante en la mazmorra se activa por separado; los jugadores eligen el orden. Al terminar todos, la fase acaba.'
  },
  {
    id: 'activacion_mob',
    keywords: ['activacion de cuadrilla', 'mob attack', 'ataque de cuadrilla', 'movimiento de cuadrilla'],
    text: 'Cada Cuadrilla realiza 2 acciones al activarse. En cada una, ataca si puede (al héroe más cercano dentro de su rango, decidido por los jugadores en caso de empate); si no puede atacar, se mueve 1 Zona por el camino más corto hacia un héroe. Las Cuadrillas no abren puertas, no interactúan y no activan trampas.'
  },
  {
    id: 'activacion_errante',
    keywords: ['activacion de monstruo errante', 'roaming monster activation'],
    text: 'Cada Monstruo Errante sigue sus propias condiciones escritas en su carta: revisa la primera condición, y si se cumple, ejecuta ese efecto y termina. Si no, revisa la segunda condición. Si ninguna se cumple, actúa como una Cuadrilla normal con 2 acciones.'
  },
  {
    id: 'inconsciente',
    keywords: ['inconsciente', 'ko', 'knocked out', 'ficha de resurreccion', 'lifebringer'],
    text: 'Un héroe sin Vida queda Inconsciente (tumbar la miniatura, se descartan sus estados). Al inicio de cada ronda, si hay algún héroe Inconsciente, se gasta 1 Ficha de Resurrección para revivirlo con 3 de Vida (conserva el Maná que tenía). Si no quedan Fichas de Resurrección disponibles, la partida termina en derrota inmediata. Un héroe Inconsciente no actúa ni puede ser objetivo hasta que reviva.'
  },
  {
    id: 'fase_subida_nivel',
    keywords: ['fase de subida de nivel', 'level up', 'costo de nivel', 'subir de nivel'],
    text: 'Subir de nivel es obligatorio si se tiene la experiencia suficiente. Costos acumulados: nivel 1→2 cuesta 5 XP, 2→3 cuesta 10 XP, 3→4 cuesta 12 XP, 4→5 cuesta 18 XP. Al subir: se descuenta la XP gastada, sube el marcador de nivel, aumenta Vida o Maná máximo (según el token de nivel) recibiendo esa cantidad de la reserva, se añaden fichas de tesoro a la bolsa según indique el token, y se gana una nueva habilidad de la clase (con requisito de nivel igual o menor al nuevo nivel).'
  },
  {
    id: 'fase_oscuridad',
    keywords: ['fase de oscuridad', 'medidor de oscuridad', 'darkness phase', 'darkness track'],
    text: 'Cada Fase de Oscuridad avanza el marcador 1 casilla. Al llegar a una casilla de Cuadrilla, aparece una Cuadrilla en cada Zona con Portal. Al llegar a una de Monstruo Errante, aparece uno en la Zona de Portal de Monstruo Errante. Al llegar a una de tesoro, se añade una ficha de esa rareza a la bolsa. Al superar la última casilla, el medidor se voltea a su reverso y continúa desde ahí.'
  },
  {
    id: 'sombra_luz',
    keywords: ['sombra y luz', 'zona de sombra regla', 'ventaja de sombra'],
    text: 'Estar en una Zona de Sombra se considera "estar en Sombra"; algunas habilidades solo se activan así. Al atacar en Sombra se suma el dado de Sombra, fuente de maná o espadas extra, y que además activa la Habilidad de Sombra propia del héroe cuando muestra su símbolo especial. Estar en Zona de Luz se considera "estar en Luz"; otras habilidades requieren esta condición.'
  },
  {
    id: 'nivel_mazmorra',
    keywords: ['nivel de mazmorra', 'dungeon level'],
    text: 'El Nivel de Mazmorra determina qué enemigos y objetos aparecen, y es igual al nivel del héroe con el nivel más alto del grupo.'
  },
  {
    id: 'habilidades_especiales_formato',
    keywords: ['formato de habilidad', 'condicion de tiempo', 'costo de habilidad', 'requisito de habilidad'],
    text: 'Las habilidades siguen el formato [Tipo/Condición de tiempo/Costo/Requisito]: [Efecto]. Condiciones de tiempo comunes: Ataque (solo el atacante, 1 vez por combate), Defensa (solo el defensor), Combate (cualquiera de los dos), Movimiento (1 vez por Acción de Movimiento), Cualquier momento. Costos comunes: gastar 1 acción, estar en Sombra o en Luz, descartar maná, haber recibido X Heridas. Salvo que se indique lo contrario, una habilidad se puede usar en cualquier momento del turno del héroe, antes o después de una acción.'
  },
  {
    id: 'tokens_condicion',
    keywords: ['ficha de fuego', 'ficha de escarcha', 'condition token', 'quemado', 'congelado'],
    text: 'Fuego: al activarse un héroe o enemigo con fichas de fuego, se quita 1 ficha y se lanza 1 dado amarillo; cada espada inflige 1 Herida, repitiendo hasta agotar las fichas. Escarcha: si un héroe o Cuadrilla va a realizar una acción y tiene fichas de escarcha, se quita 1 en vez de realizarla; un Monstruo Errante con 2 o más fichas pierde toda su activación (con solo 1, la pierde sin efecto). Los Jefes quitan todas sus fichas de escarcha sin efecto al activarse.'
  },
  {
    id: 'pilar',
    keywords: ['pilar', 'pilares', 'columna'],
    text: 'Sí, un Pilar afecta tu ataque, pero solo si es un ataque Mágico o a Distancia (los ataques Cuerpo a cuerpo no se ven afectados). El efecto se aplica cuando atacas hacia o a través de una Zona que contiene un Pilar, desde otra Zona: restas 1 dado amarillo de tu reserva de ataque. Si tu ataque no incluye dados amarillos, el Pilar no tiene ningún efecto. El Pilar no bloquea la línea de visión.'
  },
  {
    id: 'tokens_especiales',
    keywords: ['trampa de pinchos', 'trampa de oso', 'fuente', 'cofre', 'forja', 'puente', 'abismo'],
    text: 'Trampa de Pinchos: al entrar en su Zona, se voltea y se sufren las Heridas indicadas. Trampa de Oso: al entrar, si muestra "pierde 1 acción" se pierde esa acción y termina el movimiento; si es en blanco, no pasa nada. Fuente: gastando 1 PM se voltea y se cura la cantidad indicada. Cofre Normal: gastando 1 PM se obtienen 2 objetos de la rareza mostrada; Cofre Mayor da 3. Forja: gastando 1 PM se puede descartar 3 cartas de objeto y robar 1 objeto de una rareza superior a la más baja descartada. Puente: funciona como una Zona extra de Sombra, adyacente a una Zona de la Loseta. Abismo: Zona infranqueable, ni héroes ni enemigos pueden entrar.'
  },
  {
    id: 'modo_solitario',
    keywords: ['modo solitario', 'single player', 'un jugador', 'un heroe'],
    text: 'En modo solitario, el único héroe recibe 4 acciones por turno en vez de 3, y el resto de reglas (vida de Monstruos Errantes, secuaces en Cuadrillas) se calculan como si hubiera 2 héroes.'
  },
  {
    id: 'hellbreaker',
    keywords: ['hellbreaker', 'desafio hellbreaker', 'aumentar dificultad'],
    text: 'El Desafío Hellbreaker aumenta la dificultad de cualquier misión reduciendo en 1 la cantidad de Fichas de Resurrección disponibles.'
  },
  {
    id: 'romper_empates',
    keywords: ['romper empate', 'breaking ties', 'empate de regla'],
    text: 'Salvo que se indique lo contrario, cuando un efecto de juego tiene más de una opción válida, los propios jugadores eligen cuál aplicar.'
  },
  {
    id: 'clases_general',
    keywords: ['clases de heroe', 'hero classes', 'clase de personaje'],
    text: 'Hay 6 clases: Mago, Paladín, Berserker, Pícaro, Chamán y Explorador. Cada una trae componentes y una mecánica exclusiva propia.'
  },
  {
    id: 'clase_mago',
    keywords: ['mago', 'wizard', 'amuleto de hechizos', 'marcador listo'],
    text: 'El Mago usa un Amuleto de Hechizos dividido en 4 cuadrantes, cada uno con un hechizo básico que se va mejorando con las habilidades de nivel. Solo puede lanzar el hechizo que señala el Marcador Listo; tras lanzarlo, el marcador rota al siguiente cuadrante en sentido horario. Puede forzar la rotación gastando 1 maná por cada cuadrante que avance. Para beneficiarse de un hechizo de ataque, necesita un arma equipada con ataque Mágico.'
  },
  {
    id: 'clase_paladin',
    keywords: ['paladin', 'consagracion', 'bendicion', 'zona consagrada'],
    text: 'El Paladín coloca Fichas de Consagración (gastando 1 maná, sin costar una acción) en Zonas dentro de su línea de visión; los héroes en esa Zona reciben los beneficios de las habilidades asociadas a esa ficha. Solo 1 Consagración por Zona a la vez. Al inicio de cada ronda puede además "bendecir" 1 habilidad volteando su carta, aumentando su poder hasta el final de la ronda.'
  },
  {
    id: 'clase_berserker',
    keywords: ['berserker', 'furia', 'postura', 'sangre furiosa', 'temerario', 'provocador'],
    text: 'El Berserker tiene 3 posturas: Furia Sangrienta (más poder de ataque), Temerario (más movilidad) y Provocador (castiga a quien lo ataca). Al recibir Heridas, puede mover esas fichas de Vida perdida a su Reserva de Furia (máximo 7); gastar Furia (siempre de a 1 por costo) activa habilidades de su postura actual. Cambiar de postura cuesta 1 Furia, antes o después de una acción.'
  },
  {
    id: 'clase_picaro',
    keywords: ['picaro', 'rogue', 'bolsa de herramientas', 'ficha de picaro', 'token rojo azul verde'],
    text: 'El Pícaro extrae 3 fichas al azar de su Bolsa de Herramientas al inicio de cada ronda. Cada acción realizada obliga a voltear 1 ficha: si su color coincide con el tipo de acción (rojo=Ataque, azul=Movimiento, verde=cualquiera), se obtiene el beneficio indicado; si no coincide, la acción se resuelve igual mente pero sin bonificación.'
  },
  {
    id: 'clase_chaman',
    keywords: ['chaman', 'shaman', 'elemento', 'fuego agua aire naturaleza', 'espiritu de fuego', 'espiritu de hielo'],
    text: 'El Chamán tiene 4 pistas de Elemento (Fuego, Agua, Aire, Naturaleza). En vez de ganar maná, puede subir cualquier pista de elemento por esa cantidad. Al llegar una pista a su máximo, puede gastarla entera para obtener una habilidad pasiva permanente para el resto de la misión. También puede invocar un Espíritu de Fuego y uno de Hielo mediante habilidades; cada uno puede activarse una vez gratis por turno del Chamán (acciones adicionales sí cuestan 1 acción), y solo pueden Mover o Atacar (no interactúan, no abren puertas, no recuperan).'
  },
  {
    id: 'clase_explorador',
    keywords: ['explorador', 'ranger', 'mazo de flechas', 'carta de flecha', 'rebote'],
    text: 'El Explorador revela cartas de su mazo de Flechas una por una al hacer un ataque a distancia, hasta decidir parar o hasta acumular 7 o más espadas. Con menos de 7, aplica el efecto central (tiro rápido); con exactamente 7, el efecto especial de "Blanco perfecto"; con más de 7, el efecto negativo de "Sobrecarga". Luego se descartan las cartas reveladas.'
  },
  {
    id: 'ganar_perder',
    keywords: ['ganar la partida', 'perder la partida', 'condicion de victoria', 'condicion de derrota'],
    text: 'Se gana al cumplir el objetivo de la misión elegida. Se pierde si se cumple alguna condición de derrota específica de la misión, o si hay que gastar una Ficha de Resurrección y ya no queda ninguna.'
  }
];
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
    id: 'road_to_hell',
    name: 'Carretera al Infierno',
    tiles: '1A, 3A, 5A',
    objectives: [
      'Abrir el Portón',
      'Entrar al Infierno'
    ],
    rules: 'El Portón (puerta con contorno blanco) deja pasar a los enemigos libremente, pero los héroes no pueden abrirlo por medios normales; bloquea la línea de visión. Hay 2 interruptores (fichas de Objetivo bocarriba): cualquier héroe en su zona gasta 1 punto de movimiento para activarlo y retirarlo, ganando 3 XP. Cuando ambos están activados, el Portón se abre y se revela la Cámara. Para terminar, cualquier héroe en la zona del Altar gasta 1 punto de movimiento para salir de la mazmorra; cuando todos salieron, victoria.'
  },
  {
    id: 'the_step',
    name: 'El Paso',
    tiles: '2A, 4A, 5A',
    objectives: [
      'Proteger al Invocador hasta la Grieta',
      'Entrar al Infierno por la Grieta'
    ],
    rules: 'En la preparación se usa una miniatura de héroe sobrante (sin peana) para representar al Invocador, colocada en la zona de inicio. Desde la segunda ronda, al inicio de cada Fase de Héroes, el Invocador se mueve solo 2 zonas hacia la puerta blanca por el camino más corto. No puede abrir puertas ni abandonar una zona con enemigos, cuenta como héroe para ser elegido como objetivo, pero no actúa ni lleva objetos. Al llegar a la puerta blanca la abre y revela la Cámara (o sigue avanzando si ya estaba abierta). Al llegar a la Grieta se retira al Invocador y cualquier héroe puede gastar 1 punto de movimiento ahí para salir de la mazmorra. Atributos del Invocador: Vida 8, Defensa 2 (azul).'
  },
  {
    id: 'demonic_artifact',
    name: 'El Artefacto Demoníaco',
    tiles: '1B, 3B, 5B, 7B',
    objectives: [
      'Reunir los 3 Fragmentos',
      'Forjar el Artefacto con Fuego Infernal'
    ],
    rules: 'Los Fragmentos son fichas de Objetivo bocarriba; cualquier héroe puede recogerlas interactuando en su zona, ganando 5 XP cada una. Una vez reunidos los 3, si todos los héroes que llevan al menos 1 Fragmento están en la zona de la Forja Demoníaca (ficha gris), cualquiera de ellos gasta 1 acción para forjar el Artefacto y ganar la misión.'
  },
  {
    id: 'cursed_sword',
    name: 'La Espada Maldita',
    tiles: '1B, 2B, 5B, 6A',
    objectives: [
      'Destruir los 5 Cristales del Pecado',
      'No dejar que la Espada Maldita derrote a ningún héroe'
    ],
    rules: 'En la preparación se busca el "Espadón Enorme" en el mazo de Tesoro Común y se asigna a un héroe como arma inicial: es la Espada Maldita, que no puede guardarse en inventario. Quien la porta recibe heridas automáticas al inicio de cada Fase de Héroes según rondas consecutivas con ella: 1ª ronda 1 herida, 2ª ronda 2 heridas, 3ª ronda 3 heridas, 4ª ronda consecutiva = derrota inmediata de la misión (heridas antes que cualquier resurrección). Se usan fichas de Corrupción para contar las rondas; al pasar la espada a otro héroe con una acción de Intercambio, la cuenta se reinicia. Un héroe con la Espada en la zona de un Cristal del Pecado (ficha de Objetivo) gasta 1 acción para destruirlo, ganando 5 XP; al destruir los 5, victoria. La Espada gana dados de ataque según cristales destruidos: 1 cristal +1 amarillo, 2 cristales +2 amarillos, 3 cristales +2 amarillos y +1 rojo, 4 cristales +2 amarillos y +2 rojos. Modo Solitario: las heridas no son acumulativas (siempre 1 por ronda), el héroe no es derrotado tras 4 rondas, y puede elegir cualquier arma inicial como "Arma Maldita".'
  },
  {
    id: 'infernal_labyrinth',
    name: 'Laberinto Infernal',
    tiles: '3B, 4B, 5B, 6A (desconectadas)',
    objectives: [
      'Matar a las 4 Bestias Errantes especiales'
    ],
    rules: 'En la preparación se coloca 1 ficha de Corrupción en cada una de las 4 zonas indicadas. Las losetas no están conectadas: solo se accede mediante pasadizos mágicos (fichas de Objetivo); cualquier héroe en una zona con ficha de Objetivo gasta 1 punto de movimiento para moverse a otra zona con ficha de Objetivo. Al revelar una Cámara con ficha de Corrupción, además de lo habitual, aparece un Monstruo Errante (una Bestia) en la zona marcada. Cuadrillas y Monstruos Errantes también usan los pasadizos: en Fase de Enemigos, si no hay héroes en una loseta, se mueven a la zona de Objetivo más cercana (todas las zonas con Objetivo se consideran adyacentes entre sí para ellos, aunque no haya línea de visión real). Al morir las 4 Bestias, victoria.'
  },
  {
    id: 'terrifying_beast',
    name: 'La Bestia Terrorífica',
    tiles: '1B, 4B, 5B, 7B',
    objectives: [
      'Usar las Plumas de Ángel para volver vulnerable a la Bestia',
      'Derrotar a la Bestia'
    ],
    rules: 'En la preparación aparece un Monstruo Errante de Nivel 5 al azar en la zona indicada: es la Bestia. Se activa normalmente en Fase de Enemigos pero es invulnerable por defecto (no puede ser objetivo de ataques, habilidades ni sufrir heridas). Las Plumas de Ángel son fichas de Objetivo: cualquier héroe en su zona gasta 1 punto de movimiento para recogerlas (puede llevar varias). Un héroe con una Pluma en la zona de la Bestia gasta 1 punto de movimiento para colocarla sobre ella. Mientras tenga al menos 1 Pluma encima, la Bestia es vulnerable. Al inicio de cada ronda se retiran todas las Plumas de la Bestia y vuelve a ser invulnerable. Al morir la Bestia, victoria.'
  },
  {
    id: 'free_michael',
    name: 'Liberar a Miguel',
    tiles: '2B, 4B, 8A',
    objectives: [
      'Acceder a la Cámara de la Corrupción rompiendo todos los Sellos',
      'Liberar a Miguel'
    ],
    rules: 'Miguel está prisionero en la Loseta 8A (Cámara del Jefe), accesible solo por la puerta blanca, que se abre al romper todos los Sellos de Corrupción. Al abrirla no se revela carta de Puerta; al entrar un héroe comienza el Combate Final. Cada Sello es una ficha de Corrupción: romperlo cuesta 1 acción en su zona, da 5 XP por héroe y retira la ficha. Combate Final: al entrar un héroe, todos van a la Zona de Inicio del Combate Final; se retiran las losetas ajenas a la Cámara del Jefe con sus componentes, se retira el Medidor de Oscuridad y se coloca el Tablero de Jefe de Miguel; los héroes recuperan Vida y Maná al máximo. Se colocan 2 fichas de Corrupción por héroe en las Zonas de Sombras, repartidas parejo entre ellas (elegidas por los jugadores); luego se hace una Fase de Subida de Nivel y comienza nueva Fase de Héroes. Miguel es invulnerable mientras haya fichas de Corrupción en su loseta. Un héroe en zona con ficha de Corrupción gasta 1 acción para eliminarla, pero lanza 1 dado negro: garra = 1 herida, mano = 1 ficha de Corrupción en su propio tablero, ambos símbolos = ambas cosas. Si algún efecto agrega fichas de Corrupción a la loseta, Miguel vuelve a ser invulnerable. Al morir Miguel, victoria.'
  },
  {
    id: 'soul_collector',
    name: 'Recolector de Almas',
    tiles: '2B, 3B, 5B, 6B',
    objectives: [
      'Recolectar 10 Almas por héroe',
      'Salir por el Portón al Valle de las Almas'
    ],
    rules: 'Se ganan Almas matando enemigos: 1 Alma por Secuaz o Líder eliminado, 3 Almas por Monstruo Errante. Las fichas de Objetivo son Jaulas de Almas: destruirlas (1 acción en su zona) da 5 Almas y 5 XP al héroe. Se usan fichas de Vida en la zona del Portón (ficha gris) para llevar la cuenta de Almas recolectadas. Al reunir colectivamente 10 Almas por héroe, cualquier héroe en la zona del Portón gasta 1 punto de movimiento para salir; al salir todos, victoria.'
  },
  {
    id: 'soul_keys',
    name: 'Las Llaves del Alma',
    tiles: '6B, 7A, 8B',
    objectives: [
      'Recoger las Llaves del Alma antes de que desaparezcan',
      'Derrotar a la Parca'
    ],
    rules: 'La Parca espera en la Cámara del Tiempo (Loseta 8B, Cámara del Jefe), accesible solo por la puerta blanca, que se abre al reunir las 3 Llaves del Alma. Al abrirla no se revela carta de Puerta; al entrar un héroe comienza el Combate Final. En la preparación se colocan fichas de Tiempo sobre cada ficha de Objetivo según el mapa; en cada Fase de Oscuridad se retira 1 ficha de Tiempo de cada una. Si hay que retirar una ficha de Tiempo y no quedan, ese Objetivo desaparece y la misión termina en derrota. Cada Llave es una ficha de Objetivo: recogerla cuesta 1 acción en su zona y da 8 XP por héroe; si desaparece una sola Llave, derrota inmediata. Los enemigos se mueven libremente a través de puertas cerradas (Planos Etéreos); las puertas cerradas igual bloquean línea de visión. Combate Final: al entrar un héroe se agrupa a todos en la Zona de Inicio del Combate Final, se limpian las losetas ajenas y se coloca el Tablero de Jefe de la Parca; héroes recuperan Vida y Maná al máximo. Se colocan 2 fichas de Tiempo en cada Zona de Reloj de Arena, se hace una Fase de Subida de Nivel y comienza nueva Fase de Héroes. Un héroe en una Zona de Reloj de Arena gasta 1 acción para añadir 1 ficha de Tiempo a esa zona. Si hay que eliminar una ficha de Tiempo por habilidad de la Parca y no quedan en esa zona, derrota. Al matar a la Parca, victoria.'
  },
  {
    id: 'hellscape',
    name: 'Hellscape',
    tiles: '2B, 3A, 5A, 6A, 7A',
    objectives: [
      'Todos los héroes deben llegar a la Loseta 5A',
      'Derrotar al Monstruo Errante Final'
    ],
    rules: 'Los héroes empiezan separados, cada uno en una Zona de Inicio distinta (con 5-6 héroes, 1 o 2 zonas pueden tener 2 héroes como máximo). A todos los efectos (cuadrillas con solo 2 secuaces y líder, monstruos errantes con vida de 2 héroes) se trata como partida de 2 héroes, excepto para el Monstruo Errante Final. Con menos de 4 héroes se retiran losetas de sobra, dejando la central más 1 loseta por héroe (nunca se retira la 5A). La Loseta central (5A) solo es accesible por Puertas Dimensionales (contorno blanco), inicialmente cerradas; una se abre sola cuando ya no quedan enemigos en su loseta y todas las Cámaras fueron reveladas (sin revelar carta de Puerta en la 5A). Una vez que un héroe abrió su Puerta Dimensional, puede moverse libremente por todas las demás sin abrirlas. Las puertas cerradas bloquean línea de visión. Cuando las 5 puertas de la Loseta 5A están abiertas, aparece un Monstruo Errante de Nivel 5 en su zona central; se roban cartas del mazo de Objetos de Cuadrilla de Nivel 5 hasta encontrar un arma con el mismo tipo de ataque que el Monstruo, y se le añade esa arma. A diferencia de otros Monstruos Errantes, este tiene vida equivalente al número de héroes en la partida. Al morir, victoria.'
  }
];
