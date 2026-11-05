# Política de Segurança

Segurança da informação é a **primeira premissa** deste projeto. Nenhuma informação de usuário pode vazar, e a forma mais segura de garantir isso é **não coletar nada**.

## Regras do projeto

1. **Nenhum dado pessoal.** O jogo não pede nem guarda nome, e-mail, telefone, idade, localização, contatos, fotos ou identificadores de aparelho.
2. **Nada sai do aparelho.** O jogo não envia requisições de rede para servidores (nem nossos, nem de terceiros). Recorde e opção de som ficam só no `localStorage` do navegador.
3. **Sem terceiros.** Proibido adicionar analytics, anúncios, SDKs de rastreamento, CDNs, fontes externas ou scripts de fora sem revisão e atualização da política de privacidade.
4. **Content Security Policy (CSP)** em `index.html` bloqueia qualquer script, estilo, imagem ou conexão de outro domínio. Não afrouxar a CSP (ex.: `unsafe-inline`, `unsafe-eval`, `*`).
5. **Sem `eval`, `new Function` ou `innerHTML` com dados.** Textos na tela usam `textContent`.
6. **Dados lidos do armazenamento são validados** (ver `src/storage.js`) antes de usar.
7. **Nada de segredos no repositório.** Chaves, senhas, tokens e certificados de assinatura (keystore Android, certificados Apple) **nunca** entram no Git. Use os *Secrets* do GitHub Actions.
8. **GitHub Actions com permissão mínima** e Dependabot ativado para manter as actions atualizadas.

## Checklist antes de cada mudança

- [ ] A mudança adiciona alguma chamada de rede? Se sim, precisa de justificativa e revisão.
- [ ] Algum dado novo é guardado? Se sim, atualizar `PRIVACIDADE.md`.
- [ ] A CSP continua igual ou mais restrita?
- [ ] `npm test` passa?

## Recomendações para o dono do repositório (no GitHub)

- Ativar **autenticação em dois fatores (2FA)** na conta.
- Em **Settings → Code security**: ativar *Secret scanning*, *Push protection* e *Dependabot alerts*.
- Em **Settings → Branches**: proteger a branch `main` (exigir pull request e testes passando).

## Como reportar uma vulnerabilidade

Não abra uma issue pública. Use **Security → Report a vulnerability** (aviso privado do GitHub) neste repositório. Responderemos assim que possível.
