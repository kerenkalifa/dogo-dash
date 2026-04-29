## Add Google Sign-In to Dogo

Add a "Continue with Google" button to the Auth page so users can sign up / sign in with their Google account in one click, alongside the existing email + password flow.

### What changes

**1. Enable Lovable's managed Google OAuth integration**
- Run the Configure Social Login setup for Google. This creates `src/integrations/lovable/` (managed file — never edited by hand) and installs `@lovable.dev/cloud-auth-js`.
- Uses Lovable Cloud's managed Google OAuth credentials by default — no Google Cloud Console setup required from the user. (They can later swap in their own client ID/secret from Cloud → Auth Settings → Google if they want their own branding.)

**2. Update `src/pages/Auth.tsx`**
- Add a "Continue with Google" button below the email/password form, separated by a subtle "or" divider.
- Button uses the Google "G" logo icon and matches the app's glassmorphism + 2xl rounded style.
- On click, calls:
  ```ts
  import { lovable } from "@/integrations/lovable";
  await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  ```
- Handle `result.error` with a toast and `result.redirected` by returning (browser navigates to Google).
- Works for both sign-in and sign-up — Google flow handles both automatically.

**3. Translations (`src/hooks/useLanguage.tsx`)**
- Add new keys for both English and Hebrew:
  - `continue_with_google` → "Continue with Google" / "המשך עם Google"
  - `or` → "or" / "או"

**4. RTL support**
- Divider and button layout already work in RTL via existing `dir` handling — just ensure the Google icon stays on the leading side in both directions.

### Technical notes

- No database/schema changes needed. New Google users land in `auth.users` like any other user; existing RLS policies on `dogs` and `walks` keyed off `auth.uid()` work unchanged.
- No secrets to add — managed credentials are used.
- The existing `useAuth` hook keeps working: `onAuthStateChange` fires after the OAuth redirect completes and `ProtectedRoute` will let the user into `/`.
- Custom domain compatible (managed OAuth supports both `*.lovable.app` and custom domains).
