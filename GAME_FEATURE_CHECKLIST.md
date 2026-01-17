# Game Feature Checklist: The Battalion

This checklist tracks the implementation status of the game from start to finish, covering core mechanics, multiplayer integration, and UI polish.

## 1. Project Initialization & Infrastructure
- [x] **Project Setup**
    - [x] Next.js 16 + React 19 environment
    - [x] TypeScript configuration
    - [x] TailwindCSS setup
- [ ] **Multiplayer Infrastructure (Convex)**
    - [ ] `Convex` setup & configuration
    - [ ] `ConvexProvider` client integration
    - [ ] Convex Schema Definition (`convex/schema.ts`)
    - [ ] Backend Functions (Mutations/Queries for room state)
    - [ ] State Synchronization (Realtime updates)

## 2. Onboarding & Lobby
- [ ] **Landing Page** (`LandingPage.tsx`)
    - [ ] User authentication/guest login
    - [ ] "Create Room" / "Join Room" UI
- [ ] **Lobby System** (`Lobby.tsx`, `WaitingRoom.tsx`)
    - [ ] Room code generation & sharing
    - [ ] Player list display
    - [ ] Ready check system
    - [ ] Host controls (Start game)

## 3. Game Setup Phase
- [ ] **Scenario/Mission Briefing** (`MissionBriefing.tsx`)
    - [ ] Intro animation/story text
- [ ] **Player Setup**
    - [ ] **First Player Selection** (`FirstPlayerSelectionScreen.tsx`)
        - [ ] Bidding/Selection mechanic
    - [ ] **Resource Drafting** (`ResourceSelectionScreen.tsx`)
        - [ ] Resource selection UI
        - [ ] Turn-based drafting logic
    - [ ] **Initial Deployment** (`SetupScreen.tsx`)
        - [ ] Unit placement logic

## 4. Core Gameplay Loop
- [ ] **Game Board** (`GameBoard.tsx`, `Zone.tsx`)
    - [ ] Interactive 3D/2D map rendering
    - [ ] Zone selection & highlighting
    - [ ] Unit rendering & movement animations
- [ ] **Turn Management** (`PhaseIndicator.tsx`)
    - [ ] Turn timer/tracker
    - [ ] Phase transitions (Deploy -> Move -> Action -> End)
    - [ ] Active player enforcement (Client-side & Server-side)
- [ ] **Player HUD** (`PlayerHUD.tsx`)
    - [ ] Resource counters
    - [ ] Current action status
    - [ ] Turn indicator

## 5. Game Mechanics & Systems
- [ ] **Economy & Shops**
    - [ ] **Deployment Shop** (`DeploymentShop.tsx`): Buying units
    - [ ] **Conspiracy Cards** (`ConspiracyCardShop.tsx`): Buying/Playing cards
    - [ ] **Trading System** (`TradingPanel.tsx`, `PlayerTradingPanel.tsx`): Resource exchange
- [ ] **Special Abilities**
    - [ ] **Powers** (`PowersPanel.tsx`): Unique player/faction abilities
    - [ ] **Gerrymandering** (`GerrymanderPanel.tsx`): Board manipulation mechanics
    - [ ] **Ideology Cards** (`IdeologyCard.tsx`): Passive buffs/effects
- [ ] **Events & Logic**
    - [ ] Headlines/Events (`HeadlineDisplay.tsx`)
    - [ ] Game Log (`GameLog.tsx`): History of actions

## 6. Polish & UX
- [ ] **Visuals**
    - [ ] "Rogue State" theme application (`rogue-state.css`)
    - [ ] Animations (Entry, Combat, Card plays)
    - [ ] Responsive design (Mobile/Desktop)
- [ ] **Audio**
    - [ ] Background music
    - [ ] SFX (Clicks, Deployment, Success/Fail)
    - [ ] Mute controls (`MuteButton.tsx`)
- [ ] **Tutorials** (`Tutorial.tsx`, `InGameHelp.tsx`)
    - [ ] Onboarding flow
    - [ ] Tooltips & Help modals

## 7. End Game
- [ ] **Win Conditions**
    - [ ] Check for victory points/territory control
    - [ ] Trigger Game Over
- [ ] **Game Over Screen** (`GameOverScreen.tsx`)
    - [ ] Winner announcement
    - [ ] Stats summary
    - [ ] "Play Again" / "Return to Lobby" options

## 8. Deployment
- [ ] **Production Build**
    - [ ] Optimization & Performance check
- [ ] **Deployments**
    - [ ] Deploy client to Vercel
    - [ ] Deploy server to PartyKit Cloud
