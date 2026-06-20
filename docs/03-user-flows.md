# InnerBrother — User Flows

---

## 1. First-Time User Onboarding Flow

```
App Launch (First Time)
        │
        ▼
┌─────────────────────────┐
│   Welcome Screen        │
│   "InnerBrother"        │
│   Tagline + CTA         │
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│   Auth Choice           │
│   [Sign Up] [Log In]    │
│   [Continue with Google]│
│   [Continue with Apple] │
└─────────────┬───────────┘
              │
       [Sign Up chosen]
              │
              ▼
┌─────────────────────────┐
│   Create Account        │
│   Email + Password      │
│   OR OAuth              │
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│   Email Verification    │
│   (skip for OAuth)      │
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│              ONBOARDING SEQUENCE                │
│                                                 │
│  Step 1: "What's your name?"                    │
│          (display name / username)              │
│                                                 │
│  Step 2: "Where are you based?"                 │
│          Country picker → stores crisis line    │
│          Shows crisis line immediately          │
│                                                 │
│  Step 3: "What brings you here today?"          │
│          Multi-select struggle categories       │
│          (No wrong answers)                     │
│                                                 │
│  Step 4: "How are you feeling right now?"       │
│          Mood slider 1–10                       │
│                                                 │
│  Step 5: Safety Commitment Screen               │
│          "InnerBrother is a support tool,       │
│           not therapy. In a crisis, we will     │
│           always connect you to real help."     │
│          [Understood — Let's begin]             │
│                                                 │
│  Step 6: "Would you like to add an emergency   │
│           contact?" (optional, can skip)        │
│                                                 │
│  Step 7: "Set your daily check-in time"         │
│          Time picker (default 8:00 AM)          │
│                                                 │
│  Step 8: 14-day Premium trial offer             │
│          [Start Free Trial] [Maybe Later]       │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
              Home Dashboard
```

---

## 2. Daily Check-In Chatbot Flow

```
Daily Notification fires at set time
              │
              ▼
┌─────────────────────────┐
│   Push Notification     │
│   "Time for your        │
│    daily check-in"      │
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│   Chatbot Screen Opens  │
│                         │
│   AI Greeting:          │
│   "Hey [name], how's    │
│    your day going?"     │
└─────────────┬───────────┘
              │
         User responds
              │
        ┌─────┴──────┐
        │             │
   Normal text    Crisis keywords
        │             │
        ▼             ▼
┌────────────┐  ┌─────────────────────┐
│  AI        │  │  CRISIS PROTOCOL    │
│  Continues │  │  (see Flow 5)       │
│  MI-style  │  └─────────────────────┘
│  dialogue  │
└─────┬──────┘
      │
      ▼
 AI identifies
 struggle category
      │
      ▼
┌─────────────────────────┐
│  Personalized follow-up │
│  questions based on     │
│  category detected      │
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│  Mood check at end      │
│  "On a scale of 1-10,  │
│   how do you feel now?" │
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│  Session Summary        │
│  • What was discussed   │
│  • Suggested goal       │
│  • Tomorrow's intention │
└─────────────┬───────────┘
              │
              ▼
        Home Dashboard
        (feed updates)
```

---

## 3. Micro-Goals Flow

```
Goals Tab
    │
    ▼
┌─────────────────────────┐
│   My Goals Screen       │
│   Active Goals (cards)  │
│   [+ Add Goal]          │
└─────────────┬───────────┘
              │
         [+ Add Goal]
              │
              ▼
┌─────────────────────────┐
│   Goal Category Picker  │
│   • Smoking             │
│   • Exercise            │
│   • Social              │
│   • Mental Wellbeing    │
│   • Custom              │
└─────────────┬───────────┘
              │
     [Category chosen]
              │
              ▼
┌─────────────────────────┐
│   Suggested Goals       │
│   (Level 1 options      │
│    for category)        │
│   [Start at Level 1]    │
│   [I've done this before│
│    → Level 2/3]         │
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│   Goal Added!           │
│   Today's micro-goal    │
│   displayed             │
│   [Mark Complete]       │
│   [Set Reminder]        │
└─────────────┬───────────┘
              │
      [Mark Complete]
              │
              ▼
┌─────────────────────────┐
│   Celebration Screen    │
│   "Amazing! You did it" │
│   XP earned             │
│   Streak updated        │
│   [Share to Community]  │
│   [Back to Goals]       │
└─────────────┬───────────┘
              │
    [After 3 consecutive]
              │
              ▼
┌─────────────────────────┐
│   Level Up Prompt       │
│   "Ready for the next   │
│    level?"              │
│   [Yes, level up!]      │
│   [Keep current level]  │
└─────────────────────────┘

If user misses 2+ days:
              │
              ▼
┌─────────────────────────┐
│   Fresh Start           │
│   "No worries — every  │
│    day is a new start"  │
│   [Continue]            │
│   [Try easier level]    │
└─────────────────────────┘
```

---

## 4. Community Hub Flow

```
Community Tab
    │
    ▼
┌─────────────────────────┐
│   My Groups             │
│   (joined groups list)  │
│   [Discover Groups]     │
└─────────────┬───────────┘
              │
    [Select Group]
              │
              ▼
┌─────────────────────────┐
│   Group Feed            │
│   Recent posts          │
│   [+ New Post]          │
│   [Support reactions]   │
└─────────────┬───────────┘
              │
       [+ New Post]
              │
              ▼
┌─────────────────────────┐
│   Compose Post          │
│   Text area             │
│   "Post as anonymous"   │
│   toggle (default: ON)  │
│   Crisis content check  │
│   (real-time)           │
│   [Post]                │
└─────────────┬───────────┘
              │
       [Post submitted]
              │
    ┌─────────┴─────────┐
    │                   │
 Normal post      Crisis keywords
    │             detected in post
    ▼                   │
Post visible       Crisis protocol
in group feed      triggers first
                   before posting
```

---

## 5. Crisis Detection & Intervention Flow

```
Crisis Keywords Detected
(in chatbot, community post, or mood entry)
              │
              ▼
┌─────────────────────────────────────────────┐
│              CRISIS OVERLAY                  │
│         (appears instantly, full-screen)     │
│                                             │
│  ♥ We see you're going through something    │
│    really hard right now.                   │
│                                             │
│  You don't have to face this alone.         │
│  Real help is available right now.          │
│                                             │
│  [country] Crisis Line:                     │
│  📞 [HOTLINE NUMBER]                        │
│  [TAP TO CALL — ONE TOUCH]                  │
│                                             │
│  ─────────────────                          │
│                                             │
│  [Text with a counselor]                    │
│  [Alert my emergency contact]               │
│  [I'm safe — continue to app]               │
│                                             │
│  ─────────────────                          │
│  This moment will pass.                     │
│  We'll check in with you soon.              │
└─────────────────────────────────────────────┘
              │
    ┌─────────┼──────────────┐
    │         │              │
 [Call]  [Emergency]  [I'm safe]
    │     contact        │
    │         │          ▼
    ▼         ▼    Crisis event
  Phone    Notify    logged
  dialer   contact   (not content)
  opens    (SMS)         │
                         ▼
                   Follow-up
                   scheduled
                   (1 hour)
                         │
                         ▼
                  1-hour follow-up
                  check-in notification
                         │
                         ▼
                  Next-day gentle
                  chatbot check-in
```

---

## 6. Emotional Health Dashboard Flow

```
Dashboard Tab
    │
    ▼
┌─────────────────────────┐
│   Emotional Health      │
│                         │
│   Resilience Score: 72  │
│   [████████░░] 72/100   │
│                         │
│   7-Day Mood Trend      │
│   [Line graph]          │
│   Mon Tue Wed Thu Fri   │
│    6   5   7   8   7    │
│                         │
│   Stress Level          │
│   [Weekly trend bar]    │
│                         │
│   Goals This Week       │
│   ████████░░ 4/5        │
│                         │
│   Community Activity    │
│   3 posts, 8 supports   │
│                         │
│   [View Full Report]    │
└─────────────┬───────────┘
              │
    [View Full Report]
              │
              ▼
┌─────────────────────────┐
│   30-Day Deep View      │
│   • Mood trend graph    │
│   • Stress heatmap      │
│   • Goal completion %   │
│   • Milestones earned   │
│   • Pattern insights    │
│     (Premium only for   │
│      AI-generated       │
│      insights)          │
└─────────────────────────┘
```

---

## 7. Settings & Emergency Resources Flow

```
Profile Tab → Settings
    │
    ▼
┌─────────────────────────┐
│   Settings              │
│                         │
│   Account               │
│   ├─ Edit Profile       │
│   ├─ Change Password    │
│   └─ Privacy Settings   │
│                         │
│   Notifications         │
│   ├─ Daily check-in     │
│   ├─ Goal reminders     │
│   └─ Community updates  │
│                         │
│   Emergency & Safety    │
│   ├─ 🆘 Crisis Resources│ ← Always visible
│   ├─ Emergency Contacts │
│   └─ Safety Plan        │
│                         │
│   Subscription          │
│   ├─ Current Plan       │
│   └─ Upgrade            │
│                         │
│   Support               │
│   ├─ FAQ                │
│   ├─ Contact Us         │
│   └─ App Disclaimer     │
│                         │
│   Data & Privacy        │
│   ├─ Download My Data   │
│   └─ Delete Account     │
└─────────────────────────┘
```

---

## 8. Returning User Daily Flow

```
App Opens (returning user)
    │
    ▼
┌─────────────────────────┐
│   Home Screen           │
│   "Good morning, [name]"│
│   Mood quick-check      │
│   [😔][😐][🙂][😊][😄] │
└─────────────┬───────────┘
              │
        Mood selected
              │
              ▼
┌─────────────────────────┐
│   Today's Feed          │
│   • Morning message     │
│   • Reflection prompt   │
│   • Goal reminder       │
│   • Community activity  │
└─────────────┬───────────┘
              │
    ┌─────────┼──────────┐
    │         │          │
 [Chat]   [Goals]   [Community]
    │         │          │
    ▼         ▼          ▼
Chatbot   Goals      Community
screen    screen     feed
```
