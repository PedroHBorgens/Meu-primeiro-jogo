# Trinca! 🔺🟦🔴

Jogo de quebra-cabeça simples para **todas as idades**: formas (bolinhas, quadrados, triângulos...) caem do topo em grupos de 3. Junte **3 ou mais formas iguais** em linha (deitado, em pé ou na diagonal) para explodir e ganhar pontos. Inspirado no estilo de jogos de "cair e combinar", com regras e visual próprios.

- Começa **bem fácil**: só 3 tipos de forma e queda lenta.
- A cada nível a peça cai mais rápido e aparecem formas novas (até 6).
- **Combos**: quando uma explosão faz outras formas caírem e formarem nova trinca, os pontos multiplicam.
- Cada forma tem **cor e formato** diferentes, então pessoas daltônicas também conseguem jogar.

## Onde roda

| Plataforma | Como |
|---|---|
| Navegador (PC, Mac, Linux, Chromebook) | Abrir o link do jogo |
| Android | Abrir no Chrome → menu ⋮ → **Instalar app** / **Adicionar à tela inicial** |
| iPhone / iPad | Abrir no Safari → **Compartilhar** → **Adicionar à Tela de Início** |
| Offline | Depois da primeira visita, funciona sem internet |

O jogo é feito com **HTML5 + JavaScript puro**, sem nenhuma biblioteca externa. É um **PWA** (app web instalável). No futuro o mesmo código pode virar app da Google Play e da App Store (veja o Roteiro abaixo).

## Controles

| | Computador | Celular |
|---|---|---|
| Mover | ← → (ou A D) | arrastar para os lados, ou botões ◀ ▶ |
| Girar as cores | ↑ (ou W, X) | tocar no tabuleiro, ou ⟳ |
| Descer | ↓ (ou S) | ▼ |
| Derrubar | Espaço | deslizar para baixo, ou ⤓ |
| Pausar | P ou Esc | botão ⏸ |

## Rodar no seu computador

Precisa de um servidor local simples (abrir o `index.html` direto não funciona por causa dos módulos JavaScript):

```bash
python3 -m http.server 8080
# depois abra http://localhost:8080
```

## Testes

```bash
npm test
```

Os testes ficam em `tests/` e verificam as regras: trincas, gravidade, combos, fim de jogo, pausa e dificuldade.

## Estrutura

```
index.html            página do jogo
css/style.css         visual
src/logic.js          regras do jogo (sem tela, fácil de testar)
src/render.js         desenho das formas no canvas
src/main.js           controles, telas, laço do jogo
src/storage.js        recorde e som (só no aparelho)
src/audio.js          sons gerados na hora
sw.js                 modo offline
manifest.webmanifest  dados para instalar como app
tests/                testes automáticos
```

## Publicar de graça no GitHub Pages

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Junte (merge) as mudanças na branch `main`.
3. O workflow `Publicar no GitHub Pages` roda sozinho e mostra o link do jogo.

## Segurança e privacidade

Prioridade número 1 do projeto. Resumo:

- **Não coletamos nenhum dado do jogador.** Sem conta, login, e-mail, nome, localização, anúncios ou rastreadores.
- Só o **recorde** e a **opção de som** ficam salvos, e apenas no próprio aparelho.
- Nenhum script, fonte ou imagem de fora: uma **Content Security Policy** bloqueia qualquer recurso externo.
- Zero dependências de terceiros no jogo.

Detalhes em [SECURITY.md](SECURITY.md) e [PRIVACIDADE.md](PRIVACIDADE.md).

## Roteiro (próximos passos)

- [ ] Publicar no GitHub Pages e testar em celulares reais
- [ ] Efeitos de partícula na explosão e música de fundo
- [ ] Modos de jogo (contra o tempo, desafio diário)
- [ ] Opções de acessibilidade (tamanho, alto contraste, velocidade)
- [ ] App para **Android** e **iOS** com [Capacitor](https://capacitorjs.com) (empacota este mesmo código)
- [ ] Versão para Steam/PC (ex.: com Electron ou Tauri)
