# InnerBrother — React Native Architecture

## Project Structure

```
frontend/
├── App.tsx                          # Root component, Redux Provider
├── app.json                         # Expo config
├── tsconfig.json
└── src/
    ├── constants/
    │   ├── theme.ts                 # Colors, typography, spacing, shadows
    │   └── crisisResources.ts       # Offline-cached crisis lines (15 countries)
    │
    ├── store/                       # Redux Toolkit state management
    │   ├── index.ts                 # Store configuration
    │   └── slices/
    │       ├── authSlice.ts         # User, tokens, profile
    │       ├── chatSlice.ts         # Conversations, messages
    │       ├── goalsSlice.ts        # Goals, completions, templates
    │       ├── moodSlice.ts         # Mood entries, trends
    │       ├── crisisSlice.ts       # Crisis overlay state (global)
    │       └── communitySlice.ts    # Groups, posts, real-time
    │
    ├── services/
    │   ├── api.ts                   # Axios client, auto-refresh interceptor
    │   └── crisis.ts                # Crisis actions (SOS, call, notify)
    │
    ├── navigation/
    │   └── AppNavigator.tsx         # Auth → Onboarding → Main tabs
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── WelcomeScreen.tsx    # Landing + OAuth options
    │   │   ├── LoginScreen.tsx      # Email/password login
    │   │   ├── RegisterScreen.tsx   # Registration
    │   │   └── OnboardingScreen.tsx # 6-step onboarding wizard
    │   └── main/
    │       ├── HomeScreen.tsx       # Daily feed, mood check, goal preview
    │       ├── ChatbotScreen.tsx    # AI check-in conversation
    │       ├── GoalsScreen.tsx      # Goals list + completion + add modal
    │       ├── CommunityScreen.tsx  # Group feed + real-time posts
    │       └── DashboardScreen.tsx  # Mood trends, resilience score
    │
    └── components/
        ├── crisis/
        │   └── CrisisOverlay.tsx    # Full-screen crisis modal (always mounted)
        └── common/
            ├── EmergencyButton.tsx  # 🆘 persistent button (every screen)
            ├── MoodPicker.tsx       # Emoji mood selector 1-10
            ├── GoalCard.tsx         # Goal display + completion button
            └── MessageBubble.tsx    # Chat message component
```

## State Management Architecture

```
Redux Store
├── auth
│   ├── user: { id, email, profile, crisisResource }
│   ├── accessToken: string | null
│   ├── isAuthenticated: boolean
│   └── isLoading: boolean
│
├── crisis                           ← CRITICAL: Drives CrisisOverlay
│   ├── isActive: boolean            ← Overlay visible/hidden
│   ├── severity: 'none'|'low'|...
│   ├── eventId: string | null
│   ├── resource: CrisisResource
│   └── triggerSource: string
│
├── chat
│   ├── currentConversationId
│   ├── messages: Message[]
│   └── isSending: boolean
│
├── goals
│   ├── goals: Goal[]
│   ├── templates: GoalTemplate[]
│   └── lastCompletion: CompletionResult | null
│
├── mood
│   ├── trends7d: MoodTrend[]
│   ├── summary: MoodSummary | null
│   └── todayScore: number | null
│
└── community
    ├── groups: CommunityGroup[]
    ├── posts: CommunityPost[]
    └── currentGroupId: string | null
```

## Crisis System Architecture (Frontend)

```
Detection Sources
     │
     ▼
chat/sendMessage → API response: crisis_detected: true
                                        │
                            crisis.service.ts:activateCrisisProtocol()
                                        │
                            Redux: triggerCrisis(severity, eventId, resource)
                                        │
                            crisisSlice.isActive = true
                                        │
                            CrisisOverlay (always mounted at root)
                            renders as full-screen Modal
                                        │
                         User taps "Call" → Linking.openURL('tel:116123')
                                       │
                         User taps "Notify" → crisis.service.ts:notifyEmergencyContact()
                                       │
                         User taps "I'm safe" → dismissCrisis() → Modal hides
```

## Navigation Architecture

```
<NavigationContainer>
  <Stack.Navigator>
    ├── Auth (if not authenticated)
    │   ├── Welcome
    │   ├── Login
    │   └── Register
    │
    ├── Onboarding (if authenticated but not onboarded)
    │
    └── Main (if authenticated + onboarded)
        └── <BottomTabNavigator>
            ├── Home
            ├── Chat
            ├── Goals
            ├── Community
            └── Dashboard

<CrisisOverlay />  ← OUTSIDE NavigationContainer, z-index: MAX
```

## Key Design Decisions

### 1. Crisis Overlay Mounted at Root
The `CrisisOverlay` is rendered in `App.tsx` outside the `NavigationContainer`, ensuring it displays over any screen including modals and other overlays. It uses Redux state to show/hide, meaning it can be triggered from any service anywhere in the app.

### 2. Offline Crisis Resources
All 15 country crisis hotlines are cached in `crisisResources.ts` and bundled with the app. If the API fails (no network), the crisis overlay still shows the correct hotline using cached data.

### 3. Auto-Token Refresh
The Axios interceptor in `api.ts` automatically refreshes the access token on 401 responses, providing seamless re-authentication without the user ever seeing an error.

### 4. Message Encryption
Messages are encrypted at rest on the server (AES-256-GCM), decrypted per request. The frontend never sees raw encrypted content — all content is decrypted server-side before sending to the client.

### 5. Streak System
Goal streaks are calculated server-side on completion. The frontend receives the new streak value in the completion response and updates local state optimistically.
