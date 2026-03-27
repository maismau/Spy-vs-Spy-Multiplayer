# 📄 VISUAL_ENGINE_SPEC_V2.md

**Spy vs Spy – Double Reality**  
**Visual System + Storytelling + Implantação**

---

# 1. 🎯 Objetivo

Implementar um sistema visual que:

- represente TODAS as ações do jogo
    
- crie **micro-narrativas engraçadas automaticamente**
    
- use **assets reutilizáveis (composição)**
    
- seja **escalável (sem IA em tempo real)**
    
- registre demanda futura de assets
    

---

# 2. 🧠 Conceito Central

O jogo NÃO mostra ações diretamente.

Ele mostra:

SITUAÇÕES VISUAIS ABSURDAS

Cada turno deve parecer:

um frame de desenho animado caótico

---

# 3. 🧩 Arquitetura Visual

Cada cena é composta por:

BACKGROUND  
+ OBJECT  
+ EFFECT  
+ OVERLAY

---

# 4. 🖼️ Backgrounds (mínimo inicial)

Criar 5:

lab_secret.jpg  
control_room.jpg  
spy_office.jpg  
rooftop_night.jpg  
underground_base.jpg

---

# 5. 🎭 Sistema de Storytelling

## 5.1 Evolução do Plano (OBRIGATÓRIO)

Cada cenário deve ter progressão visual:

Stage 1 → leve  
Stage 2 → construção  
Stage 3 → suspeita  
Stage 4 → tensão  
Stage 5 → quase pronto  
Stage 6 → iminente  
Stage 7 → crítico  
Stage 8 → execução (vitória)

---

## 5.2 Exemplo (LAB)

1 tubo  
2 mistura  
3 reação  
4 instabilidade  
5 contenção  
6 falha  
7 arma pronta  
8 explosão final

---

# 6. 🎲 Sistema de Rotação (IMPORTANTE)

O jogo NÃO usa sempre o mesmo objeto.

Exemplo:

Attack pode virar:  
- bomba  
- pato  
- bolo  
- banana  
- laser

---

## Regra:

70% coerente com cenário  
30% absurdo

---

# 7. 🎨 Categorias de Assets

## 7.1 Objects

attack_objects/  
defense_objects/  
planning_objects/  
shop_objects/  
mission_objects/

---

## 7.2 Effects

explosion  
shield  
heal  
glitch  
aura

---

## 7.3 Overlays

danger  
cute  
suspicious  
success  
fail

---

# 8. 🛒 Mapeamento da Loja

|Item|Objeto|Efeito|Overlay|
|---|---|---|---|
|HEAL I|syringe_small|heal_small|green|
|HEAL II|syringe_big|heal_big|strong_green|
|SHIELD I|shield_basic|reflect|metallic|
|SHIELD II|mirror_shield|block|mirror|
|WEAPON I|spring_weapon|recoil|unstable|
|WEAPON II|heavy_weapon|explosion_big|red|
|SABOTAGEM I|sabotage_device|glitch_full|red_glitch|
|SABOTAGEM II|virus_chip|glitch_partial|corruption|

---

# 9. 🎬 Pipeline de Renderização

renderBackground()  
  
renderObject()  
  
applyEffect()  
  
applyOverlay()  
  
renderUI()

---

# 10. 🧠 Narrative Layer (NOVO)

Cada turno deve gerar:

{  
 scene: "lab",  
 object: "banana",  
 mood: "chaotic",  
 absurdity: 0.8  
}

---

# 11. 🏆 Sistema de Vitória

## Tela final deve ter:

- vencedor rindo exageradamente
    
- perdedor destruído
    
- objeto absurdo ainda presente
    

---

## Texto:

VENCEU!  
PERDEU!

---

# 12. 📂 Estrutura de Pastas

assets/  
  
backgrounds/  
objects/  
effects/  
overlays/  
  
generated/ (futuro)

---

# 13. 📦 Sistema de Demanda de Assets

Se asset não existir:

registrar no arquivo:  
missing_assets.json

Exemplo:

{  
 "missing": [  
  "attack_duck_delayed",  
  "defense_balloon_reflect"  
 ]  
}

---

# 🚀 PASSO A PASSO DE IMPLEMENTAÇÃO (PARA SUA EQUIPE)

Agora o mais importante.

---

# 🔧 FASE 1 — Setup inicial (1–2 horas)

### 1. Criar estrutura de pastas

mkdir -p assets/backgrounds  
mkdir -p assets/objects  
mkdir -p assets/effects  
mkdir -p assets/overlays

---

### 2. Adicionar 5 backgrounds

Equipe deve colocar imagens JPG:

lab_secret.jpg  
control_room.jpg  
spy_office.jpg  
rooftop_night.jpg  
underground_base.jpg

---

# 🔧 FASE 2 — Loader de Assets (CRÍTICO)

Criar:

// client/src/engine/AssetLoader.ts

---

### Código base:

export function loadImage(path: string): HTMLImageElement {  
  
 const img = new Image()  
 img.src = path  
  
 return img  
}

---

# 🔧 FASE 3 — Renderer (CORE VISUAL)

Criar:

// client/src/engine/Renderer.ts

---

### Código base:

export function renderScene(ctx, scene){  
  
 ctx.drawImage(scene.background, 0, 0)  
  
 ctx.drawImage(scene.object, 100, 100)  
  
 if(scene.effect){  
   ctx.drawImage(scene.effect, 100, 100)  
 }  
  
 if(scene.overlay){  
   ctx.drawImage(scene.overlay, 0, 0)  
 }  
  
}

---

# 🔧 FASE 4 — Mapeamento de Ações

Criar:

// client/src/engine/VisualMapper.ts

---

### Exemplo:

export function mapActionToVisual(action){  
  
 if(action === "ATTACK"){  
   return random([  
     "bomb.png",  
     "duck.png",  
     "cake.png"  
   ])  
 }  
  
}

---

# 🔧 FASE 5 — Integração com jogo

No loop do turno:

const visual = mapActionToVisual(action)  
  
renderScene(ctx, visual)

---

# 🔧 FASE 6 — Sistema de evolução do plano

Criar:

// MissionVisual.ts

---

### Exemplo:

export function getMissionStage(stage){  
  
 const stages = [  
  "tube",  
  "mix",  
  "reaction",  
  "unstable",  
  "containment",  
  "failure",  
  "weapon"  
 ]  
  
 return stages[stage]  
}

---

# 🔧 FASE 7 — Tela de vitória

Criar:

// VictoryScreen.ts

---

### Exemplo:

export function renderVictory(ctx, winner){  
  
 ctx.fillText("VENCEU!", 200, 200)  
  
 // desenhar personagem rindo  
}

---

# 🔧 FASE 8 — Asset Demand System

Criar:

// AssetTracker.ts

---

### Código:

export function trackMissing(id){  
  
 console.log("Missing asset:", id)  
  
}

---

# 🔥 Resultado esperado após implementação

- jogo deixa de ser “texto”
    
- vira **visual + narrativa**
    
- cada partida gera cenas únicas
    
- sistema pronto para escalar
    

---

# 🧠 Mensagem final para sua equipe

Não estamos fazendo gráficos bonitos.  
  
Estamos criando situações absurdas que o jogador entende em 0.5 segundos.  
  
Se parecer sério, está errado.  
Se parecer engraçado, está certo.
