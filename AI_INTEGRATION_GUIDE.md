# Connect AI Integration Guide

## Environment Setup

### Step 1: Add Google AI API Key

You need to add your Google Gemini API key to your environment variables.

**For Development:**
Create/edit `.env.local` in your project root:

```env
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

**Get Your API Key:**
1. Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key

**For Production (Vercel/Netlify):**
Add the environment variable in your deployment dashboard:
- Variable name: `NEXT_PUBLIC_GOOGLE_AI_API_KEY`
- Value: Your actual API key

### Step 2: Restart Development Server

After adding the API key:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## Using AI Buttons in Your Pages

### Profile Page Integration

**File:** Any profile edit component

```tsx
import { 
    AIResumeParserButton, 
    AIProfileEnhancerButton,
    AISuggestSkillsButton 
} from '@/components/ai/AIProfileButtons';

// In your component:
<div className="space-y-4">
    {/* Resume Parser */}
    <AIResumeParserButton 
        onProfileDataExtracted={(data) => {
            // Auto-fill your form with extracted data
            setDisplayName(data.displayName);
            setTitle(data.title);
            setBio(data.bio);
            setSkills(data.skills);
            setExperience(data.experience);
            setEducation(data.education);
            // etc.
        }}
    />

    {/* Bio Enhancer */}
    <AIProfileEnhancerButton
        currentBio={bio}
        skills={skills}
        experience={experience}
        onBioGenerated={(enhancedBio) => {
            setBio(enhancedBio);
        }}
    />

    {/* Skill Suggester */}
    <AISuggestSkillsButton
        experience={experience}
        currentSkills={skills}
        onSkillsSuggested={(suggestedSkills) => {
            // Show suggestions to user or auto-add
            setSkills([...skills, ...suggestedSkills]);
        }}
    />
</div>
```

---

### Mail Page Integration

**File:** Mail compose component

```tsx
import { AIEmailComposerButton } from '@/components/ai/AIMailButtons';

// In your mail compose form:
<div className="mb-4">
    <AIEmailComposerButton 
        onEmailGenerated={(email) => {
            setSubject(email.subject);
            setBody(email.body);
        }}
    />
</div>
```

---

### Project/Job Page Integration

**File:** Project creation or job posting component

```tsx
import { 
    AITaskGeneratorButton,
    AICandidateFinderButton,
    AITeamRecommenderButton 
} from '@/components/ai/AIProjectButtons';

// For Project Creation:
<AITaskGeneratorButton
    projectDescription={projectDescription}
    teamMembers={selectedMembers}
    onTasksGenerated={(tasks) => {
        // Add tasks to your project
        setGeneratedTasks(tasks);
    }}
/>

// For Job Posting/Recruiting:
<AICandidateFinderButton
    jobDescription={jobDescription}
    requiredSkills={requiredSkills}
    onCandidatesFound={(candidates) => {
        // Show candidate matches
        setCandidateMatches(candidates);
    }}
/>

// For Team Building:
<AITeamRecommenderButton
    projectDescription={projectDescription}
    requiredSkills={projectSkills}
    onTeamMembersRecommended={(members) => {
        // Show recommended team members
        setRecommendedMembers(members);
    }}
/>
```

---

## Component Reference

### Available AI Components

| Component | Feature | Tier Required | Location |
|-----------|---------|---------------|----------|
| `AIResumeParserButton` | Parse resume → auto-fill profile | Connect AI | `@/components/ai/AIProfileButtons` |
| `AIProfileEnhancerButton` | Enhance bio with AI | Connect AI | `@/components/ai/AIProfileButtons` |
| `AISuggestSkillsButton` | Suggest relevant skills | Connect AI | `@/components/ai/AIProfileButtons` |
| `AIEmailComposerButton` | Draft emails with AI | Connect AI | `@/components/ai/AIMailButtons` |
| `AIContractDrafterButton` | Generate legal contracts | Connect AI | `@/components/ai/AIMailButtons` |
| `AITaskGeneratorButton` | Generate tasks from project | Connect AI | `@/components/ai/AIProjectButtons` |
| `AICandidateFinderButton` | Find best candidates | Connect AI | `@/components/ai/AIProjectButtons` |
| `AITeamRecommenderButton` | Recommend team members | Connect AI | `@/components/ai/AIProjectButtons` |

---

## Automatic Feature Gating

All AI components automatically:
- ✅ Check if user has Connect AI subscription
- ✅ Verify AI quota remaining
- ✅ Show upgrade prompt if feature locked
- ✅ Track usage and deduct from monthly quota
- ✅ Display loading states
- ✅ Handle errors gracefully

**No additional checks needed!** Just add the component and it works.

---

## Testing AI Features

### 1. Subscribe to Connect AI

```typescript
// Navigate to: /ai-tools or /settings?tab=subscription
// Top up wallet: /wallet
// Purchase Connect AI plan: D15,000/month
```

### 2. Test Resume Parser

```typescript
// On profile edit page:
// 1. Click "Fill from Resume (AI)"
// 2. Upload a .txt resume file
// 3. Watch form auto-fill with extracted data
```

### 3. Test Email Composer

```typescript
// On mail compose:
// 1. Click "Draft with AI"
// 2. Enter description: "Request project update from team"
// 3. Select tone: Formal/Casual/Persuasive
// 4. Click "Generate Email"
// 5. Review and edit generated email
```

### 4. Test Task Generator

```typescript
// On project creation:
// 1. Fill in project description
// 2. Add team members
// 3. Click "Generate Tasks with AI"
// 4. Review generated tasks
// 5. Accept or modify tasks
```

---

## Firebase Functions (Optional Backend)

For production-scale deployments, you can move AI processing to Firebase Functions:

### Setup

```bash
# Initialize Firebase Functions
firebase init functions

# Install dependencies
cd functions
npm install firebase-admin @google/generative-ai

# Set environment variable
firebase functions:config:set google.ai_key="YOUR_KEY"

# Deploy
firebase deploy --only functions
```

### Reference Implementation

See [`lib/firebase/functions-reference.ts`](file:///c:/Projects/connekt/lib/firebase/functions-reference.ts) for:
- Cloud Functions examples
- Scheduled jobs (subscription renewals)
- Webhook handlers (Modem Pay)
- Firestore triggers

---

## Quota Management

### Monthly Limits

| Tier | AI Requests/Month |
|------|-------------------|
| Free | 0 (no access) |
| Pro | 0 (no AI features) |
| Pro Plus | 0 (no AI features) |
| **Connect AI** | **1,000 requests** |

### Viewing Quota

Users can check their quota on:
- `/ai-tools` page (header display)
- Settings → Subscription tab

### When Quota Runs Out

- User receives error message
- Usage tracked in `ai_usage_quotas` collection
- Resets automatically on 1st of each month
- Users can upgrade for more quota (future enhancement)

---

## Troubleshooting

### "AI quota exceeded"
**Solution:** User needs to wait for monthly reset or implement quota top-up feature

### "This feature requires Connect AI subscription"
**Solution:** User needs to upgrade at `/ai-tools` or `/settings?tab=subscription`

### "Failed to generate"
**Solutions:**
1. Check API key is set correctly in environment
2. Verify internet connection
3. Check Gemini API quota/billing
4. Check console for detailed error

### Resume parser not extracting data
**Solutions:**
1. Ensure resume is in .txt format (PDF parsing requires additional library)
2. Check resume has clear structure
3. Try with a different resume format

---

## Next Steps

1. ✅ Add API key to environment
2. ✅ Restart dev server  
3. [ ] Add AI buttons to profile edit page
4. [ ] Add AI buttons to mail compose
5. [ ] Add AI buttons to project/job pages
6. [ ] Test all features with Connect AI subscription
7. [ ] (Optional) Deploy Firebase Functions for production

**All components are ready to use!** Just import and add them to your pages.
