export const KEY = 'babe.podologia.v1';
export const DEFAULT_CONTENT = {
  brand: 'BABE', tagline: 'PODOLOGIA & BEM-ESTAR', logo: 'assets/logo.jpeg', accent: '#194f46',
  announcement: 'Um momento de cuidado. Uma vida com mais conforto.',
  navHome: 'Início', navServices: 'Tratamentos', navAbout: 'A especialista', navShop: 'Nossa loja', navContact: 'Contato',
  heroEyebrow: 'CUIDADO ESPECIALIZADO, DE VERDADE', heroTitle: 'Seus pés merecem\num novo cuidado.',
  heroDescription: 'Mais conforto para caminhar, mais leveza para viver. Um atendimento humano e personalizado, do primeiro passo à sua rotina de cuidado.',
  bookLabel: 'Agendar meu cuidado', shopLabel: 'Conhecer os produtos', heroImage: 'assets/hero.png',
  heroImageAlt: 'Cuidado profissional dos pés em um ambiente acolhedor', heroBadgeTitle: 'Seu bem-estar, em boas mãos', heroBadgeText: 'Cuidado individual · Atendimento com hora marcada',
  heroTag: 'Saúde & bem-estar', heroReassurance: 'Atendimento com hora marcada, no seu tempo.',
  benefit1: 'Atendimento personalizado', benefit2: 'Ambiente acolhedor', benefit3: 'Cuidado e prevenção',
  serviceEyebrow: 'CUIDADOS PARA CADA PASSO', serviceTitle: 'Pequenos cuidados.\nUma grande diferença.', serviceDescription: 'Tratamentos pensados para a saúde dos seus pés, com atenção ao que você precisa.', serviceLink: 'Agendar tratamento',
  aboutEyebrow: 'CONHEÇA QUEM CUIDA DE VOCÊ', aboutTitle: 'Cuidar dos pés é\ncuidar de você.', specialist: 'Sua especialista em podologia', qualification: 'Cuidado profissional e atenção individual',
  aboutDescription: 'Aqui, cada pessoa é recebida com tempo, escuta e cuidado. Acreditamos que a saúde dos pés faz parte de uma vida mais confortável e de uma rotina de bem-estar.\n\nNosso atendimento começa entendendo suas necessidades, para orientar um plano de cuidado que faça sentido para você.',
  aboutImage: 'assets/clinic.png', aboutImageAlt: 'Consultório de podologia', aboutPill1: 'Escuta e acolhimento', aboutPill2: 'Cuidado personalizado',
  shopEyebrow: 'O CUIDADO CONTINUA EM CASA', shopTitle: 'Bem-estar na sua rotina.', shopDescription: 'Uma seleção de produtos para acompanhar seus passos, todos os dias.', shopButton: 'Ver todos os produtos',
  bookingTitle: 'Seu próximo passo começa aqui.', bookingDescription: 'Escolha o cuidado que precisa e encontre um horário que combine com sua rotina.',
  contactEyebrow: 'VAMOS CONVERSAR', contactTitle: 'Estamos aqui para você.', contactDescription: 'Tem alguma dúvida sobre os cuidados ou quer conversar antes de agendar? Será um prazer ajudar.',
  phone: '', email: '', instagram: '', address: 'Endereço do consultório a cadastrar', hours: 'Segunda a sexta · 9h às 18h\nSábado · 9h às 13h',
  footerDescription: 'Cuidado que acompanha cada passo.', footerCopyright: 'BABE Podologia. Todos os direitos reservados.',
  contactOfficeLabel: 'Nosso consultório', contactHoursLabel: 'Horários de atendimento', contactFormTitle: 'Deixe sua mensagem', contactNameLabel: 'Seu nome', contactEmailLabel: 'E-mail', contactMessageLabel: 'Mensagem', contactConsent: 'Autorizo o uso destes dados para receber uma resposta à minha mensagem.', contactSubmitLabel: 'Enviar mensagem', contactPrivacy: 'Seus dados serão usados apenas para este atendimento.', mapTitle: 'Venha nos visitar', mapButton: 'Ver mapa', socialLabel: 'Acompanhe no Instagram', adminLinkLabel: 'Painel de gestão',
  currency: 'BRL', locale: 'pt-BR', timezone: 'America/Sao_Paulo'
};
export function seed() {
  return {
    version: 1, revision: 0, content: structuredClone(DEFAULT_CONTENT),
    services: [
      { id: 's1', title: 'Podologia preventiva', description: 'Higienização, cuidado das unhas e remoção de calosidades para pés mais confortáveis.', duration: 60, price: 120, category: 'Cuidado essencial', image: '', active: true },
      { id: 's2', title: 'Unhas encravadas', description: 'Avaliação e cuidado especializado para aliviar o desconforto e orientar a prevenção.', duration: 60, price: 150, category: 'Cuidado especializado', image: '', active: true },
      { id: 's3', title: 'Cuidado do pé diabético', description: 'Atenção individual à prevenção, com avaliação dos pés e orientações de cuidado diário.', duration: 60, price: 160, category: 'Saúde e prevenção', image: '', active: true },
      { id: 's4', title: 'Avaliação podológica', description: 'Uma conversa e avaliação para entender suas necessidades e indicar os próximos cuidados.', duration: 30, price: 80, category: 'Seu primeiro passo', image: '', active: true }
    ],
    products: [
      { id: 'p1', title: 'Creme hidratante para os pés', description: 'Hidratação para sua rotina de cuidado. Consulte o consultório para conhecer as marcas e opções disponíveis.', price: 49.9, stock: 12, category: 'Hidratação', image: 'assets/cream.png', active: true },
      { id: 'p2', title: 'Separador de dedos em silicone', description: 'Acessório para conforto dos pés. Consulte a profissional para entender se este produto atende às suas necessidades.', price: 24.9, stock: 18, category: 'Conforto', image: 'assets/separator.png', active: true },
      { id: 'p3', title: 'Meias de cuidado diário', description: 'Meias macias para o dia a dia. Consulte o consultório para verificar tamanhos e opções disponíveis.', price: 39.9, stock: 8, category: 'Bem-estar', image: 'assets/socks.png', active: true },
      { id: 'p4', title: 'Loção para os pés', description: 'Uma etapa de cuidado para sua rotina. Consulte o consultório para conhecer as opções e orientação de uso.', price: 59.9, stock: 10, category: 'Cuidado diário', image: 'assets/lotion.png', active: true }
    ],
    availability: { interval: 30, weekly: { 0: [], 1: [['09:00','12:00'],['13:00','18:00']], 2: [['09:00','12:00'],['13:00','18:00']], 3: [['09:00','12:00'],['13:00','18:00']], 4: [['09:00','12:00'],['13:00','18:00']], 5: [['09:00','12:00'],['13:00','18:00']], 6: [['09:00','13:00']] }, overrides: {} },
    bookings: [], orders: [], notifications: [], messages: []
  };
}
