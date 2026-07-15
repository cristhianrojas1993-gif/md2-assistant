const MD2_DATA = {
  levelCosts: {1:5, 2:10, 3:12, 4:18},
  levelGains: {
    2:{hp:1,mana:0,treasure:'Añade 1 ficha de Tesoro Raro a la bolsa.'},
    3:{hp:1,mana:1,treasure:'Añade 1 ficha de Tesoro Épico a la bolsa.'},
    4:{hp:2,mana:1,treasure:'Añade 1 ficha de Tesoro Épico a la bolsa.'},
    5:{hp:2,mana:1,treasure:'Añade 1 ficha de Tesoro Épico a la bolsa.'}
  },
  classes: {
    rogue: {
      label:'Pícaro',
      passives:[
        {name:'Sombras', text:'Al realizar una acción de Ataque con una ficha de Sombras, estás en las Sombras.'},
        {name:'Veneno', text:'Al realizar una acción de Ataque con una ficha de Veneno, colócala junto al enemigo defensor hasta que muera. Cuando muera, devuelve la ficha a la bolsa. Los enemigos con una ficha de Veneno están envenenados. Cada enemigo solo puede tener 1 ficha de Veneno al mismo tiempo.'}
      ],
      skills:[
        {name:'Mixtura Mortal I',level:1,branch:'mixtura',grade:1},
        {name:'Celeridad a Medida I',level:1,branch:'celeridad',grade:1},
        {name:'Forma Sombría I',level:1,branch:'forma',grade:1},
        {name:'Trucos Ensayados I',level:2,branch:'trucos',grade:1},
        {name:'Kit de Herramientas I',level:2,branch:'kit',grade:1},
        {name:'Mixtura Mortal II',level:3,branch:'mixtura',grade:2},
        {name:'Forma Sombría II',level:3,branch:'forma',grade:2},
        {name:'Celeridad a Medida II',level:3,branch:'celeridad',grade:2},
        {name:'Kit de Herramientas II',level:4,branch:'kit',grade:2},
        {name:'Trucos Ensayados II',level:4,branch:'trucos',grade:2},
        {name:'Celeridad a Medida III',level:5,branch:'celeridad',grade:3},
        {name:'Forma Sombría III',level:5,branch:'forma',grade:3},
        {name:'Mixtura Mortal III',level:5,branch:'mixtura',grade:3}
      ]
    },
    ranger: {
      label:'Explorador',
      passives:[
        {name:'Mazo de Flechas', text:'En un Ataque a Distancia, resuelve físicamente el mazo y selecciona si el resultado fue Tiro rápido, Tiro certero o Tiro fallido.'}
      ],
      skills:[
        {name:'Flecha Incendiaria I',level:1,branch:'incendiaria',grade:1},
        {name:'Flecha Perforante I',level:1,branch:'perforante',grade:1},
        {name:'Volea de Flechas I',level:1,branch:'volea',grade:1},
        {name:'Cuerdas Mejoradas I',level:2,branch:'cuerdas',grade:1},
        {name:'Flecha con Arpeo I',level:2,branch:'arpeo',grade:1},
        {name:'Volea de Flechas II',level:3,branch:'volea',grade:2},
        {name:'Flecha Perforante II',level:3,branch:'perforante',grade:2},
        {name:'Flecha Incendiaria II',level:3,branch:'incendiaria',grade:2},
        {name:'Cuerdas Mejoradas II',level:4,branch:'cuerdas',grade:2},
        {name:'Flecha con Arpeo II',level:4,branch:'arpeo',grade:2},
        {name:'Volea de Flechas III',level:5,branch:'volea',grade:3},
        {name:'Flecha Perforante III',level:5,branch:'perforante',grade:3},
        {name:'Flecha Incendiaria III',level:5,branch:'incendiaria',grade:3}
      ]
    }
  }
};
