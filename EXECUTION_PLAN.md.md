# EXECUTION_PLAN.md – Spy vs Spy Double Reality

**Versão:** 1.0 (Março 2026) **Fonte de verdade:** https://github.com/maismau/spy-vs-spy-double-reality **Ambiente alvo:** Digital Ocean 192.34.61.253 (porta 3000) **Objetivo do MVP:** Jogo 1v1 local (hotseat) → online com tela dividida, 5 ações, 5 HP, 5 partes de missão e truques visuais básicos rodando no servidor em < 20 horas totais.

## Estratégia Geral - Desenvolvimento incremental (nunca quebrar o jogo). - Cada fase tem **passos exatos**, **tempo estimado** e **métricas de validação** claras. - Estagiário executa 90% → eu (ou você) reviso só no merge. - Após MVP (Fase 5), liberamos para outros agentes.

### Fase 0: Setup Infra (30-45 min) **Objetivo:** Repo + servidor pronto para código.

**Passos:** 1. Clone o repo no servidor: `git clone https://github.com/maismau/spy-vs-spy-double-reality.git && cd spy-vs-spy-double-reality` 2. Crie pastas: `mkdir -p client server docs/blocks` 3. Instale dependências base: `npm init -y && npm install typescript ts-node @types/node` 4. Configure .gitignore + README.md inicial.

**Métricas de validação (sucesso = 100%):** - `git status` mostra branch main limpa. - `node --version` e `npm --version` respondem no servidor. - Pasta `docs/blocks/` existe e repo tem exatamente os arquivos iniciais. - Commit: “chore: initial setup” pushado.

### Fase 1: MVP Local Hotseat (2-3 horas) – Jogo jogável local **Objetivo:** Tela dividida + turnos + ações + HP funcionando (sem internet).

**Passos:** 1. Instale Phaser 3 + Vite no client. 2. Crie cena básica com canvas dividido (esquerda/direita). 3. Implemente 5 botões de ação (Ataque, Defesa, Aprimoramento, Planejamento, Execução). 4. Sistema de HP (5 cada) e vitória por HP=0 ou missão completa (placeholder). 5. Turnos simultâneos via hotseat (mesmo teclado ou dois jogadores no mesmo PC).

**Métricas de validação:** - Abra `http://192.34.61.253:3000` (ou localhost) → tela dividida aparece. - Após 8-12 turnos, alguém vence (HP=0 ou “missão completa” placeholder). - Nenhum erro no console. - Commit: “feat: mvp hotseat core loop” + screenshot da vitória anexado no PR.

### Fase 2: Regras de Combate + Interações (2 horas) **Objetivo:** Lógica completa das 5 ações (Ataque×Defesa, stacking, dano, etc.).

**Passos:** 1. Crie classe `ActionSystem` com as interações exatas que definimos. 2. Adicione Aprimoramento (amplifica próxima ação) e Planejamento (pre-buff). 3. Teste todos os 25 combinações possíveis.

**Métricas de validação:** - Teste manual: Ataque×Ataque → ambos perdem 2 HP (verificado 3x). - Defesa stacking funciona (3 ataques seguidos → 0 dano). - Log no console mostra corretamente quem ganhou o turno. - Commit: “feat: full action combat rules”.

### Fase 3: Asimetria Visual + Truques Básicos (3 horas) – O coração do jogo! **Objetivo:** Cada jogador vê realidade diferente.

**Passos:** 1. Sistema de “fake state” por jogador. 2. Implemente 4 truques iniciais (pato de borracha, presente fofo, execução falsa, planejamento na piscina). 3. Revelação % (20% → 70% com antena). 4. Animação final “revelação da verdade” (tela quebra e mostra a mentira).

**Métricas de validação:** - Jogador A vê míssil real, Jogador B vê pato → confirmado visualmente. - Final da rodada mostra animação hilária de revelação. - 100% das vezes o lado direito/esquerdo é diferente. - Commit: “feat: core visual asymmetry & tricks”.

### Fase 4: Missões com 5 Partes (3 horas) **Objetivo:** 4 missões reais com pré-requisitos.

**Passos:** 1. Crie sistema de “5 partes fixas” por missão. 2. Implemente 4 missões (Míssil Pateta, Vírus do Caos, Queima-Servidor, etc.). 3. Pré-requisitos (ex: só executa parte 4 se fez Planejamento antes).

**Métricas de validação:** - Cada missão tem exatamente 5 partes visuais progressivas. - 2 formas de vitória funcionando (missão 100% OU HP=0). - Teste completo de 1 partida com missão real → vitória correta. - Commit: “feat: 4 real missions + prerequisites”.

### Fase 5: Multiplayer Online + Deploy (4 horas) – MVP FINAL NO AR **Objetivo:** Jogo online 1v1 rodando no 192.34.61.253.

**Passos:** 1. Socket.io (salas 1v1, turnos sincronizados). 2. PM2 + Nginx (reverse proxy porta 80 → 3000). 3. Deploy: `pm2 start server/index.js --name spy-game`

**Métricas de validação (MVP CONCLUÍDO):** - Dois jogadores diferentes acessam `http://192.34.61.253` e entram na mesma sala. - Turnos simultâneos funcionam (sem delay perceptível). - Tela dividida + truques + vitória funcionando online. - `pm2 status` mostra processo rodando. - Commit: “feat: multiplayer online + production deploy”. - **Teste final:** jogar 3 partidas completas com outra pessoa → sem crash.

### Fases Futuras (pós-MVP – só depois da Fase 5) - Fase 6: Banco SQLite + usuários/leaderboard (3h) - Fase 7: Power-ups permanentes + animações polidas (3h) - Fase 8: Leaderboard público + som (1h)

## Regras de Validação Geral - **Sempre** após cada fase: rodar `npm run dev` e testar no servidor. - PR só é mergeado se **todas** as métricas de validação forem atingidas. - Screenshot ou vídeo de 15 segundos da validação deve estar no PR. - Tempo total até MVP no ar: **14-18 horas** (pode ser feito em 2-3 dias).

---