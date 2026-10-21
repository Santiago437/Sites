# Disponibilizar o site BABE para o cliente

O site agora precisa do servidor Node.js e do banco SQLite. Publicar somente `dist` em uma hospedagem estática não oferece agenda, loja ou painel funcionais. A configuração `.openai/hosting.json` pertence à versão estática anterior; ela não publica este backend Node.js.

## Caminho preparado: servidor Linux com Docker Compose

1. Use um servidor Linux com Docker Engine e Compose. Crie a conta da hospedagem e registre o domínio no nome do cliente; você pode receber acesso técnico. Este repositório não contrata serviços nem configura uma conta externa.
2. Aponte o registro DNS `A` do domínio para o IPv4 do servidor. Configure `AAAA` somente se o IPv6 estiver funcionando. Libere as portas TCP 80 e 443; mantenha o SSH restrito aos responsáveis. A aplicação não publica a porta 4173 na internet.
3. Transfira a pasta `babe-app`, incluindo os arquivos Docker, para o servidor. Não envie `.git`, `.sites-runtime`, `.env` local nem banco de testes. Na pasta do projeto, copie `.env.example` para `.env` e preencha `DOMAIN`, `ACME_EMAIL`, `ADMIN_USERNAME` e `ADMIN_PASSWORD`. Use uma senha única de no mínimo 16 caracteres, gerada em um gerenciador de senhas. Proteja `.env` com `chmod 600 .env`. Evite valores contendo `$` sem aspas simples, pois Compose pode interpolá-los.
4. Execute `docker compose up -d --build`. Veja o resultado com `docker compose ps` e `docker compose logs --tail=50 app proxy backup`. O Caddy solicita e renova o certificado HTTPS quando o domínio e as portas estão acessíveis. [Documentação oficial do Caddy](https://caddyserver.com/docs/quick-starts/https).
5. Abra `https://SEU-DOMINIO` e `https://SEU-DOMINIO/#/admin`. Cadastre contatos, especialista, fotos reais, tratamentos, preços, estoque e horários. Confirme um agendamento e um pedido de teste em um dispositivo e confira-os no painel de outro dispositivo. Cancele o pedido de teste para devolver seu estoque.
6. Entregue ao cliente o endereço público, o endereço do painel, o usuário e a senha por um canal privado, os acessos ao domínio/hospedagem e a rotina de backup. Registre quem mantém o servidor e quem recebe alertas de falha. Configure um monitor externo do endereço `/api/health` na conta de hospedagem do cliente.

O volume `babe_data` preserva o banco entre atualizações de contêiner. O contêiner `backup` gera uma cópia SQLite íntegra a cada 24 horas e mantém 30 dias. A primeira tentativa ocorre no início; se o banco ainda não existir ou ocorrer falha, tenta novamente em uma hora. Confira os logs. [Volumes no Docker Compose](https://docs.docker.com/reference/compose-file/volumes/).

**Os backups locais protegem contra alterações acidentais; copie-os também para outro local privado.** A perda do servidor ou do volume pode afetar tanto o banco quanto os backups. O destino externo e suas credenciais dependem da conta do cliente e não estão configurados aqui. Não execute `docker compose down -v`: isso remove os volumes e os dados.

## Atualizações, backups e recuperação

- Antes de atualizar: `docker compose exec app node scripts/backup.mjs`.
- Depois de transferir a nova versão: `docker compose up -d --build`; confira o site e o painel. O banco persistente permanece no volume.
- Liste cópias: `docker compose exec app ls /app/data/backups`.
- Copie uma cópia para fora do servidor: `docker compose cp app:/app/data/backups/ARQUIVO.sqlite ./ARQUIVO.sqlite`. Guarde-a em armazenamento privado com acesso restrito.
- Para restaurar registros pelo painel, importe o backup JSON e confirme a substituição. Uma edição administrativa preserva a versão anterior, disponível pelo botão “Restaurar cópia anterior”. Exporte os dados atuais primeiro.
- Para recuperar todo o banco SQLite: pare **app e backup**; preserve uma cópia do banco atual, incluindo WAL/SHM se existirem; verifique a integridade do arquivo escolhido; substitua `babe.sqlite` no volume pelo arquivo íntegro e remova WAL/SHM antigos somente com todos os escritores parados; preserve o proprietário `node` e permissões privadas; reinicie. Esta operação é administrativa e substitui todos os dados, incluindo credenciais. Encerre sessões antigas e redefina a senha após a recuperação.
- Para alterar a senha, atualize `ADMIN_PASSWORD` no `.env` seguro e execute `docker compose run --rm app node scripts/reset-admin.mjs`. A redefinição invalida todas as sessões. Alterar apenas `.env` não muda um administrador já cadastrado no banco.

## Executar no Windows para revisar

Use Node.js 24.19 ou superior da série 24. Crie `.env` a partir do exemplo e preencha:

```dotenv
NODE_ENV=development
HOST=127.0.0.1
PORT=4173
PUBLIC_ORIGIN=http://127.0.0.1:4173
DATA_DIR=./data
ADMIN_USERNAME=admin
ADMIN_PASSWORD='SUA-SENHA-UNICA-DE-16-OU-MAIS-CARACTERES'
TRUST_PROXY=0
```

Execute `node --env-file=.env server.mjs` e abra `http://127.0.0.1:4173`. O domínio `localhost` é uma origem diferente; use exatamente o endereço configurado. Nunca coloque esse modo HTTP local na internet. Não configure senha de produção em comandos compartilhados ou capturas de tela.

Se houver dados da versão antiga, exporte o JSON no navegador que os contém **antes de atualizar** e importe-o no painel autenticado. Não existe migração automática de todos os navegadores para o servidor. O carrinho continua local, mas dados administrativos, pedidos, mensagens e reservas passam a ser compartilhados.

## Escopo da entrega

Há login de uma administradora, banco compartilhado, agendamentos, loja com reserva de estoque, mensagens, gestão de conteúdo, imagens raster armazenadas no conteúdo, notificações no painel, exportação/importação e backups SQLite.

Pagamentos continuam combinados com o consultório. WhatsApp abre a mensagem para o cliente enviá-la. E-mail, WhatsApp automático, antifraude, recuperação de senha por e-mail e cópia de backup para serviço externo exigem fornecedor e credenciais; não estão ativos. O servidor usa uma única instância com SQLite, adequado ao fluxo atual de um consultório. Não escale para várias réplicas compartilhando o arquivo; essa expansão exige outra arquitetura de banco.

Os arquivos Docker/Caddy estão preparados; publicação real, DNS, emissão de certificado, firewall e monitor externo só podem ser confirmados na conta de hospedagem e no domínio do cliente. A verificação local não é um pentest do servidor publicado.
