// Texts from Docs/Lore_And_Art_Bible.md, sections 7, 8 and 10.
export const INTRO_SCENES = [
  { title: 'A Bigorna Primordial', image: '/assets/portraits/world_magicforge_anvil.jpg', duration: 11000, effect: 'anvil', text: 'Antes dos reinos, antes dos deuses terem nome, havia um som. Um martelo. Uma bigorna. E seis chamas que ainda não sabiam o que queriam ser.' },
  { title: 'As seis chamas', image: '/assets/portraits/world_magicforge_anvil.jpg', duration: 6000, effect: 'elements', text: 'Com elas, o mundo foi forjado. E alguém precisava guardar a forja.' },
  { title: 'O guardião', image: '/assets/portraits/villain_malakor_portrait.jpg', duration: 8000, effect: 'guardian', text: 'Escolheram um homem. Um ferreiro. O melhor que já existiu... e o mais faminto.' },
  { title: 'O golpe profano', image: '/assets/portraits/world_magicforge_anvil.jpg', duration: 8000, effect: 'fracture', text: 'Malakor quis todas as chamas para si. Ergueu o martelo profano. E a Bigorna... quebrou.' },
  { title: 'Os estilhaços', image: '/assets/environment/tile_mundo_1_floresta.jpg', duration: 12000, effect: 'shards', text: 'Os estilhaços caíram sobre os planos dimensionais. Os monstros beberam a escória. E em algum lugar, uma alma acordou com uma fagulha que não era sua.' },
  { title: 'O despertar', image: '/assets/ui/login/bg_login_forja_astral.jpg', duration: 5000, effect: 'awakening', text: 'Quem é você, Forjado?' },
] as const;

export const HERO_QUOTES: Record<string, string> = {
  GUERREIRO: 'A Ordem da Bigorna caiu. Eu não. Meu escudo ainda sustenta o mundo.',
  CLERIGO: 'A luz sagrada vaza pelas rachaduras da forja. Alguém precisa costurá-las.',
  BARBARO: 'Bebi o magma primordial. Ele ainda ruge e queima dentro das minhas veias.',
  MONGE: 'Meu corpo é a bigorna. Cada soco desferido, uma lição de equilíbrio.',
  BRUXO: 'Ele quebrou o mundo. Eu só colhi o que sobrou... e o que sussurra debaixo do abismo.',
  MAGO: 'O fogo derrete a matéria. O gelo a tempera. O resto é mero detalhe arcano.',
  ARQUEIRO: 'A floresta virou cristal sob a fumaça de Malakor. Eu enxergo tudo de longe.',
};
export const MONSTER_QUOTES: Record<string, string[]> = {
  slime: ['blub... brilhante... engoli... brilhante...'],
  lancer: ['A lança é minha! Eu achei! Foi a terra rachada que me deu!', 'O Grande Chefe avisou que você vinha! Disse que você é nanico!'],
  archer: ['Uma flecha só... na ponta do seu nariz!', 'Errei?! Não me olha assim, a fumaça entrou no meu olho!'],
  wolf: ['(Um rosnado rouco; seus olhos fixam a fumaça de Malakor.)'],
  goblinBoss: ['EU SOU O REI DESTE BOSQUE! A COROA DE FOGO ME ESCOLHEU!'],
};
