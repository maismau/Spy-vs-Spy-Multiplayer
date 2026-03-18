Spy vs Spy — Double Reality  
Autonomous Execution Plan  
  
---  
  
## GLOBAL RULES FOR AGENTS  
  
Before executing any task:  
  
1. Pull latest repository state  
  
git pull origin main  
  
2. After implementing a task always run  
  
npm run build || npm run dev  
  
3. Only commit if validation succeeds.  
  
Commit format:  
  
[type]: task-id short description  
  
Example:  
  
feat: T12 action system base  
  
---  
  
# PHASE 0 — INFRASTRUCTURE [DONE]

## TASK T01 — Clone Repository [DONE]
  
Agent Type: Infra Agent  
  
git clone https://github.com/maismau/spy-vs-spy-double-reality.git  
cd spy-vs-spy-double-reality  
  
Validation  
  
git status  
  
Expected  
  
On branch main  
nothing to commit  
  
Commit  
  
chore: T01 repo cloned  
  
---  
  
## TASK T02 — Create Folder Structure  
  
Directories  
  
client  
server  
docs  
docs/blocks  
  
Command  
  
mkdir -p client server docs/blocks  
  
Validation  
  
ls  
  
Commit  
  
chore: T02 project structure  
  
---  
  
## TASK T03 — Node Project Setup  
  
npm init -y  
npm install typescript ts-node @types/node  
  
Create  
  
tsconfig.json  
.gitignore  
README.md  
  
Validation  
  
node --version  
npm --version  
  
Commit  
  
chore: T03 node environment  
  
---  
  
# PHASE 1 — GAME CLIENT [DONE]

## TASK T10 — Install Client Framework [DONE]
  
Agent: Game Engine Agent  
  
Inside /client  
  
npm create vite@latest  
npm install phaser  
  
Expected structure  
  
client/src  
client/index.html  
  
Commit  
  
feat: T10 vite + phaser client  
  
---  
  
## TASK T11 — Create Game Scene  
  
Create  
  
client/src/game/GameScene.ts  
  
Must include  
  
create()  
update()  
  
Validation  
  
npm run dev  
  
Commit  
  
feat: T11 base game scene  
  
---  
  
## TASK T12 — Split Screen Layout  
  
Layout  
  
| Player A | Player B |  
  
Validation  
  
Both areas render independently.  
  
Commit  
  
feat: T12 split screen layout  
  
---  
  
## TASK T13 — Action Buttons  
  
Buttons  
  
Attack  
Defense  
Upgrade  
Planning  
Execute  
  
Event  
  
playerAction(actionType)  
  
Commit  
  
feat: T13 action buttons  
  
---  
  
## TASK T14 — HP System  
  
Initial values  
  
playerA.hp = 5  
playerB.hp = 5  
  
Victory  
  
hp <= 0  
  
Commit  
  
feat: T14 hp system  
  
---  
  
# PHASE 2 — ACTION SYSTEM [DONE]

## TASK T20 — Create ActionSystem [DONE]
  
Create  
  
client/src/game/ActionSystem.ts  
  
Core  
  
resolveTurn(playerAAction, playerBAction)  
  
Commit  
  
feat: T20 action system base  
  
---  
  
## TASK T21 — Implement Action Matrix  
  
Example  
  
Attack vs Attack → both -2 HP  
Attack vs Defense → blocked  
  
Commit  
  
feat: T21 action matrix  
  
---  
  
## TASK T22 — Turn Resolver  
  
Flow  
  
players choose actions  
resolve matrix  
apply hp  
update state  
  
Commit  
  
feat: T22 turn resolution  
  
---  
  
# PHASE 3 — DOUBLE REALITY SYSTEM  
  
## TASK T30 — Fake State System  
  
Create  
  
client/src/game/FakeState.ts  
  
Structure  
  
realState  
fakeStatePlayerA  
fakeStatePlayerB  
  
Commit  
  
feat: T30 fake state system  
  
---  
  
## TASK T31 — Rubber Duck Trick  
  
Player A sees missile  
Player B sees rubber duck  
  
Commit  
  
feat: T31 duck trick  
  
---  
  
## TASK T32 — Cute Gift Bomb  
  
Commit  
  
feat: T32 gift bomb trick  
  
---  
  
## TASK T33 — Fake Execution  
  
Commit  
  
feat: T33 fake execution trick  
  
---  
  
## TASK T34 — Pool Planning  
  
Commit  
  
feat: T34 pool planning trick  
  
---  
  
## TASK T35 — Reality Reveal Animation  
  
Effect  
  
screen cracks  
true action revealed  
  
Commit  
  
feat: T35 reality reveal animation  
  
---  
  
# PHASE 4 — MISSIONS [DONE]

## TASK T40 — Mission System Base [DONE]
  
Create  
  
client/src/game/MissionSystem.ts  
  
Structure  
  
mission  
progress  
requirements  
  
Commit  
  
feat: T40 mission system  
  
---  
  
## TASK T41 — Mission Parts  
  
Each mission  
  
5 parts  
  
Example  
  
build  
arm  
target  
launch  
detonate  
  
Commit  
  
feat: T41 mission parts  
  
---  
  
## TASK T42 — Victory Condition  
  
mission.progress == 5  
  
OR  
  
enemy.hp == 0  
  
Commit  
  
feat: T42 mission victory  
  
---  
  
# PHASE 5 — MULTIPLAYER [DONE]

## TASK T50 — Server Setup [DONE]
  
Create  
  
server/index.ts  
  
Install  
  
express  
socket.io  
  
Commit  
  
feat: T50 game server  
  
---  
  
## TASK T51 — Game Rooms  
  
room size = 2  
  
Flow  
  
join room  
match start  
  
Commit  
  
feat: T51 matchmaking rooms  
  
---  
  
## TASK T52 — Turn Sync  
  
Server resolves turn and broadcasts result.  
  
Commit  
  
feat: T52 synchronized turns  
  
---  
  
# PHASE 6 — DEPLOYMENT  
  
## TASK T60 — Install PM2  
  
npm install -g pm2  
  
Commit  
  
chore: T60 pm2 install  
  
---  
  
## TASK T61 — Production Server  
  
pm2 start server/index.js --name spy-game  
  
Validation  
  
pm2 status  
  
Commit  
  
feat: T61 production server  
  
---  
  
## TASK T62 — Nginx Reverse Proxy  
  
Mapping  
  
80 → 3000  
  
Commit  
  
feat: T62 nginx proxy  
  
---  
  
# FINAL VALIDATION  
  
npm run build  
  
Test  
  
two browsers  
join match  
play full game  
  
Success criteria  
  
no crash  
hp works  
mission works  
tricks render  
multiplayer sync