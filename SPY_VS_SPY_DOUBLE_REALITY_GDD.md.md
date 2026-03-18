 
Game Design Document – MVP to Expansion  
  
Version: 1.0  
Author: Mr. Maldonado  
Genre: Competitive deception strategy  
Players: 2 (1v1)  
Platform: Web / PC  
Engine: Phaser + Node + Socket.io  
  
---  
  
# 1. Core Concept  
  
Spy vs Spy Double Reality é um jogo competitivo de engano onde cada jogador vê uma realidade diferente da partida.  
  
Jogadores precisam:  
  
- enganar o adversário  
- interpretar pistas  
- completar uma missão secreta  
- ou destruir o HP inimigo  
  
Cada rodada termina com uma revelação da verdade, criando momentos de humor e surpresa.  
  
---  
  
# 2. Core Pillars  
  
## Deception  
O jogador nunca sabe se o que vê é real.  
  
## Asymmetric perception  
Cada jogador vê versões diferentes dos eventos.  
  
## Short matches  
Partidas rápidas e intensas.  
  
## Humor  
Situações absurdas e engraçadas.  
  
---  
  
# 3. Match Structure  
  
Uma partida possui:  
  
5–7 turns  
  
Cada turno possui três fases:  
  
Choose Action  
Resolve  
Reveal  
  
---  
  
# 4. Player Resources  
  
Cada jogador possui:  
  
HP = 5  
Mission progress = 0 → 5  
Buffs  
Tricks  
  
Vitória ocorre quando:  
  
HP inimigo = 0  
OU missão completa  
  
---  
  
# 5. Action System  
  
Ações disponíveis:  
  
| Action | Description |  
|------|------|  
Attack | dano direto |  
Defense | bloqueia ataque |  
Upgrade | melhora próxima ação |  
Planning | prepara missão |  
Execute | tenta completar missão |  
  
---  
  
# 6. Action Interaction Matrix  
  
| A vs B | Result |  
|------|------|  
Attack vs Attack | ambos perdem HP |  
Attack vs Defense | bloqueado |  
Attack vs Planning | planning interrompido |  
Defense vs Execute | execução parcial |  
Upgrade vs Attack | ataque amplificado |  
Execute vs Execute | disputa |  
  
---  
  
# 7. Mission System  
  
Cada missão possui 5 partes visuais.  
  
Exemplo:  
  
### Missile Madness  
  
1 blueprint  
2 assembly  
3 fueling  
4 targeting  
5 launch  
  
Quando completa:  
  
instant victory  
  
---  
  
# 8. Trick System (Core Innovation)  
  
Tricks criam realidades diferentes para cada jogador.  
  
Estrutura:  
  
realState  
fakeStateA  
fakeStateB  
  
Exemplo:  
  
| Trick | Player A | Player B |  
|------|------|------|  
Rubber Duck Missile | míssil | pato |  
Gift Bomb | presente | bomba |  
Fake Execute | execução | falha |  
Mirror Defense | escudo | decoração |  
  
---  
  
# 9. Reveal System  
  
Após cada rodada ocorre:  
  
Reality Reveal  
  
Animação:  
  
screen crack  
fake dissolve  
truth appear  
  
---  
  
# 10. Trick Deck System  
  
Cada partida possui 3 truques aleatórios.  
  
Exemplo:  
  
Match A:  
  
Duck missile  
Fake gift  
Mirror defense  
  
Match B:  
  
Invisible bomb  
Reverse attack  
Spy clone  
  
---  
  
# 11. Gadget System (Progression)  
  
Após MVP, jogadores desbloqueiam gadgets.  
  
| Gadget | Effect |  
|------|------|  
Antenna | aumenta chance de revelar truque |  
X-ray glasses | mostra ação inimiga |  
Fake moustache | aumenta engano |  
Spy drone | revela missão |  
  
---  
  
# 12. Visual Style  
  
Estética recomendada:  
  
cartoon espionage  
1960s spy vibe  
bright colors  
exaggerated animations  
  
Referências:  
  
- Spy vs Spy (Mad Magazine)  
- Team Fortress humor  
- Among Us readability  
  
---  
  
# 13. UI Layout  
  
Tela dividida:  
  
--------------------------------  
| Player A | Player B |  
--------------------------------  
  
Elementos:  
  
HP bar  
Mission progress  
Action buttons  
Trick indicator  
  
---  
  
# 14. Multiplayer Structure  
  
Modo principal:  
  
1v1 online  
  
Fluxo:  
  
join lobby  
match start  
turn sync  
resolve  
reveal  
  
---  
  
# 15. Spectator Mode (Future)  
  
Observadores podem assistir partidas.  
  
spectators see true state  
  
---  
  
# 16. Match Length Target  
  
Tempo ideal:  
  
3–5 minutes  
  
---  
  
# 17. Replay Value  
  
Rejogabilidade vem de:  
  
random trick deck  
random missions  
player deception  
  
---  
  
# 18. AI Agents Integration  
  
Sistema pode ser expandido com bots:  
  
AI spy opponents  
  
Usos:  
  
treinamento  
singleplayer  
matchmaking filler  
  
---  
  
# 19. Metrics to Track  
  
match duration  
win rate  
trick reveal frequency  
player retention  
  
---  
  
# 20. Roadmap  
  
## Phase A – Current MVP  
  
actions  
HP  
mission  
basic tricks  
multiplayer  
  
## Phase B – Gameplay depth  
  
10 tricks  
5 missions  
animations  
balance  
  
## Phase C – Meta  
  
gadgets  
ranked matches  
leaderboard  
  
## Phase D – Expansion  
  
3 player mode  
tournaments  
mobile  
  
---  
  
# 21. Long Term Vision  
  
Spy vs Spy Double Reality pode evoluir para:  
  
competitive deception platform  
  
Com:  
  
tournaments  
streamer modes  
community maps  
"""  
  
file_path = "/mnt/data/SPY_VS_SPY_DOUBLE_REALITY_GDD.md"  
pypandoc.convert_text(content, 'md', format='md', outputfile=file_path, extra_args=['--standalone'])  
  
file_path
'/mnt/data/SPY_VS_SPY_DOUBLE_REALITY_GDD.md'