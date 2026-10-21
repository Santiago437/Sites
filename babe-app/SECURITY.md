# Segurança e verificações automáticas

Execute `npm run verify` antes de entregar ou atualizar. Sem npm, execute em sequência e confira o código de saída de cada comando:

```text
node scripts/check.mjs
node --test tests/backend.test.mjs tests/store.test.mjs
node scripts/security.mjs
```

O workflow GitHub Actions executa as mesmas verificações em cada push e pull request quando o código estiver em um repositório GitHub com Actions habilitado. O servidor e o frontend não têm dependências npm de terceiros; alterações futuras que adicionem dependências exigem atualizar a verificação estática e incluir auditoria do lockfile. Node.js, imagens Docker e Caddy ainda precisam de atualizações de segurança.

## Controles implementados

- Senha com salt individual e scrypt (`N=32768`, `r=8`, `p=3`); comparação do hash em tempo constante. Segue os parâmetros de scrypt indicados pela [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- Sessões aleatórias armazenadas no banco por hash; cookie HttpOnly e SameSite=Strict, Secure em produção. Expiração absoluta em oito horas e por inatividade em 30 minutos. Logout e redefinição de senha revogam sessões. Não há token em localStorage. [Referência OWASP sobre sessões](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- Origem exata em requisições de escrita, verificação de Host e token CSRF nos comandos administrativos. [Referência OWASP sobre CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- Gestão e leitura de registros privados exigem autenticação no servidor. A API pública não entrega contatos, observações, pedidos ou mensagens de outros clientes; entrega catálogo e intervalos ocupados sem identidade.
- SQLite com consultas parametrizadas e transações para regras de agendamento e estoque. Revisão otimista evita que duas edições administrativas sobrescrevam dados. Pedidos com a mesma chave de idempotência e mesmo conteúdo reservam estoque uma vez.
- Validação de corpo, limites de tamanho, consentimento, rejeição de campos públicos inesperados, preços calculados no servidor, duração de atendimento e conflitos de horário.
- Limites persistentes de login, submissões e API por IP; tempo limite HTTP; logs de ações sem senhas, tokens ou corpo dos pedidos.
- CSP, proteção contra framing, MIME sniffing, políticas de recursos e HSTS em produção. CSP permite estilos inline porque a interface atual os utiliza; scripts inline e execução dinâmica permanecem bloqueados.
- Arquivos privados fora de `dist`; bloqueio de caminhos malformados e links simbólicos que escapem da pasta pública. Secrets, bancos e dados ficam fora do Git e da imagem Docker.
- Aplicação Docker sem root, sem porta pública própria, filesystem somente leitura exceto volume de dados e diretório temporário; Caddy faz a terminação HTTPS.
- Backup consistente por `VACUUM INTO`, seguido de `PRAGMA integrity_check`; cópia anterior em alterações administrativas; registros de auditoria conservados por 90 dias.

## Limites da verificação

Os testes exercitam cenários definidos e a análise estática procura padrões específicos. Não demonstram ausência de todas as vulnerabilidades. A verificação do domínio real precisa cobrir HTTPS, DNS, firewall, configuração do proxy, exposição do volume, acessos à hospedagem e restauração de uma cópia externa.

`TRUST_PROXY=1` somente atrás do proxy confiável que sobrescreve `X-Forwarded-For`, como o Caddy fornecido. Sem essa condição, clientes poderiam falsificar IP para contornar limites. Não habilite outra origem nem CORS indiscriminadamente. Formulários públicos não têm CAPTCHA; os limites básicos podem precisar de proteção adicional contra abuso conforme o tráfego.

A aplicação protege o acesso aos dados; o disco e os backups não são criptografados pelo código. Use os controles de criptografia e acesso do provedor. Os responsáveis pelo consultório devem definir retenção dos dados, textos de privacidade e acesso de colaboradores antes de inserir dados reais. Para operações sensíveis ou crescimento do serviço, revise MFA, perfis de acesso e auditoria externa.
