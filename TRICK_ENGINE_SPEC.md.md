# TRICK_ENGINE_SPEC.md 
Procedural Trick Generation System    
Spy vs Spy – Double Reality    
  
Version: 1.0  
  
---  
  
# 1. Purpose  
  
The Trick Engine generates **deception mechanics procedurally**, combining base gameplay effects with visual misdirection and modifiers.  
  
Goals:  
  
- high replayability  
- constant surprise  
- shared humor  
- balanced gameplay  
  
Every trick must satisfy two rules:  
  
- both players see something interesting  
- reveal moment is funny or surprising  
  
---  
  
# 2. Trick Architecture  
  
Every trick is composed of **three layers**.  

BASE EFFECT  
+  
VISUAL DECEPTION  
+  
MODIFIER

  
Example:  

Base: Attack  
Visual: Gift Box  
Modifier: Delayed

  
Result:  

Delayed Gift Bomb

  
---  
  
# 3. Trick Object Specification  
  
Agents should implement tricks using the following structure.  
  
```ts  
interface Trick {  
  
 id: string  
  
 baseEffect: BaseEffect  
 visual: DeceptionVisual  
 modifier: Modifier  
  
 realState: State  
 fakeState: State  
  
 execute(): void  
 reveal(): void  
}

---

# 4. Base Effects

These define the **actual gameplay effect**.

enum BaseEffect {  
  
 ATTACK  
 DEFENSE  
 TRAP  
 BUFF  
 COUNTER  
 REFLECT  
 MISSION_PROGRESS  
 MISSION_SABOTAGE  
 HP_SWAP  
 ENERGY_DRAIN  
  
}

Design rule:

base effects must influence gameplay  
not just visuals

---

# 5. Visual Deception Layer

Defines what players **think is happening**.

enum DeceptionVisual {  
  
 DUCK  
 GIFT_BOX  
 BANANA  
 BALLOON  
 CONFETTI  
 TOY_GUN  
 LASER_POINTER  
 SPY_CLONE  
 FAKE_BLUEPRINT  
 PARTY_CAKE  
 RUBBER_CHICKEN  
 DISCO_BALL  
  
}

Design rules:

visuals must be absurd  
animations must exaggerate  
objects must be readable instantly

---

# 6. Modifiers

Modifiers alter behavior.

enum Modifier {  
  
 DELAYED  
 DOUBLE  
 INVISIBLE  
 RANDOM_TARGET  
 AREA_EFFECT  
 REFLECTED  
 CHAIN_REACTION  
 REVERSE  
  
}

Example combinations:

DOUBLE ATTACK  
INVISIBLE TRAP  
CHAIN DEFENSE  
RANDOM BUFF

---

# 7. Trick Generation Algorithm

Agents generate tricks procedurally.

function generateTrick(): Trick {  
  
 const base = random(BaseEffect)  
 const visual = random(DeceptionVisual)  
 const modifier = random(Modifier)  
  
 return buildTrick(base, visual, modifier)  
  
}

---

# 8. Trick Builder

function buildTrick(base, visual, modifier): Trick {  
  
 return {  
  
  id: `${base}_${visual}_${modifier}`,  
  
  baseEffect: base,  
  visual: visual,  
  modifier: modifier,  
  
  realState: createRealState(base, modifier),  
  
  fakeState: createFakeState(visual),  
  
  execute() {  
   applyEffect(base, modifier)  
  },  
  
  reveal() {  
   revealTruth(base, visual)  
  }  
  
 }  
  
}

---

# 9. Real State vs Fake State

Each player receives **different render states**.

Example:

PLAYER A VIEW  
missile launch  
  
PLAYER B VIEW  
rubber duck floating

Data structure:

interface State {  
  
 sprite  
 animation  
 sound  
 uiIndicators  
  
}

---

# 10. Reveal Moment

Every trick must include a **reveal animation**.

Example reveal events:

duck explodes into missile  
gift box detonates  
balloon shield becomes energy dome  
banana grenade explodes

Design rule:

reveal must be surprising  
reveal must be readable in <1 second

---

# 11. Humor Engine

Humor must be exaggerated.

Recommended animation principles:

squash and stretch  
cartoon physics  
absurd transformations

Examples:

spy slips on banana  
missile emerges from gift box  
balloons inflate into shield dome

---

# 12. Engagement Rule

Both players must always be engaged.

Wrong design:

one player waits

Correct design:

both players see different chaos

Example:

Player A  
giant laser charging  
  
Player B  
rubber chicken dance animation

Both players react.

---

# 13. Trick Deck Generation

Each match generates:

5 tricks

Algorithm:

function generateMatchDeck(){  
  
 const deck = []  
  
 while(deck.length < 5){  
  
  const trick = generateTrick()  
  
  if(isBalanced(trick))  
   deck.push(trick)  
  
 }  
  
 return deck  
  
}

---

# 14. Balance System

Each trick receives a **power score**.

Example:

ATTACK = 5  
DEFENSE = 4  
TRAP = 6  
BUFF = 3

Modifiers adjust score.

Example:

DOUBLE = +2  
CHAIN = +3  
DELAYED = -1

Deck rule:

total deck power < threshold

This prevents broken matches.

---

# 15. Trick Mutation System

Agents can evolve tricks.

function mutateTrick(a,b){  
  
 return {  
  
  baseEffect: a.baseEffect,  
  visual: random(),  
  modifier: b.modifier  
  
 }  
  
}

Example mutation:

Gift Bomb  
+  
Mirror Shield  
  
=  
Reflecting Gift Bomb

---

# 16. Trick Memory

To prevent repetition:

recentTricks = []

Generator rule:

avoid last 10 tricks used

---

# 17. Replay Variety

With:

10 base effects  
12 visuals  
8 modifiers

Possible tricks:

10 × 12 × 8 = 960 tricks

Match deck combinations:

C(960,5) ≈ astronomical

Replay value becomes enormous.

---

# 18. File Structure

Recommended repository layout:

game/  
  
tricks/  
  TrickEngine.ts  
  TrickBuilder.ts  
  TrickBalance.ts  
  
data/  
  baseEffects.ts  
  visuals.ts  
  modifiers.ts

---

# 19. Agent Integration

Agents implementing the engine should follow this workflow:

load base effects  
load visuals  
load modifiers  
generate tricks  
validate balance  
build deck

---

# 20. Future Expansion

Future systems may add:

player gadgets  
environment hazards  
spy personalities  
seasonal trick pools

Example seasonal trick:

Christmas Present Bomb

---

# 21. Design Philosophy

Spy vs Spy Double Reality should feel like:

a spy movie  
+  
a cartoon  
+  
a prank war

Every round should generate moments like:

WAIT THAT WAS A DUCK?!

That reaction is the goal.

  
---  
