# BABE · Podologia & bem-estar

Site em HTML/CSS/JavaScript e backend Node.js 24 com SQLite persistente. O painel exige login; conteúdo, reservas, pedidos e mensagens são compartilhados entre dispositivos. O carrinho permanece no navegador. Não há dependências npm externas.

## Iniciar localmente

1. Copie `.env.example` para `.env`.
2. Para desenvolvimento, defina `NODE_ENV=development`, `PUBLIC_ORIGIN=http://127.0.0.1:4173`, `TRUST_PROXY=0` e uma `ADMIN_PASSWORD` única com pelo menos 16 caracteres.
3. Execute `node --env-file=.env server.mjs` ou `npm start`.
4. Abra `http://127.0.0.1:4173` e `http://127.0.0.1:4173/#/admin`.

A senha cria o administrador na primeira inicialização. Para alterá-la depois, use `npm run admin:reset` com a nova senha no ambiente. Nunca inclua credenciais reais no Git. O banco fica em `data/babe.sqlite`, fora da pasta pública.

## Funcionalidades

- Site institucional, catálogo, busca, carrinho e checkout sem cobrança automática.
- Agendamento na zona America/Sao_Paulo, disponibilidade semanal, bloqueios e horizonte de 180 dias.
- Validação transacional de sobreposição e duração dos atendimentos, reserva de estoque e devolução por cancelamento.
- Gestão autenticada de tratamentos, produtos, preços, conteúdo, imagens, agenda, pedidos, clientes, mensagens e avisos no painel.
- Exportação/importação JSON com confirmação, recuperação da versão anterior a uma alteração administrativa e backup SQLite com verificação de integridade.
- Sessões privadas, cookies protegidos, CSRF, limites de requisições, validação no servidor e isolamento dos dados de clientes.

Antes de entregar, substitua contatos, dados da especialista, fotos, preços e estoque ilustrativos pelos reais no painel. Imagens de exemplo não comprovam qualificações ou retratam necessariamente o consultório. Pagamento é combinado com a profissional; WhatsApp depende do envio pelo usuário e e-mail automático exige integração adicional.

## Verificação e publicação

`npm run verify` executa sintaxe, testes de negócio e segurança HTTP, e análise estática dos arquivos públicos. Sem npm: `node scripts/check.mjs`, `node --test tests/backend.test.mjs tests/store.test.mjs` e `node scripts/security.mjs`.

- [DEPLOY.md](DEPLOY.md): hospedagem com Docker/Caddy, domínio, HTTPS, persistência, backup e entrega ao cliente.
- [SECURITY.md](SECURITY.md): controles, verificações e limites da auditoria.

O frontend requer a API na mesma origem. Publicar apenas `dist` ou usar o manifesto estático antigo não disponibiliza este backend. Os arquivos de publicação estão preparados; domínio e infraestrutura reais precisam da conta do cliente.

## Arquivos principais

`server.mjs` inicia `backend.mjs`; `backend.mjs` contém HTTP, autenticação, banco, autorização e API. `dist/store.js` compartilha validação e regras com o servidor e conecta o frontend à API. `dist/app.js`, `admin.js`, `flows.js` e `ui.js` implementam interface, painel, fluxos e helpers. `dist/seed.js` fornece conteúdo inicial. `scripts` reúne verificações, backup e redefinição administrativa. `tests` cobre os fluxos locais e o backend real. `compose.yaml`, `Dockerfile` e `Caddyfile` preparam uma instância com volume persistente, proxy HTTPS e backups diários.
