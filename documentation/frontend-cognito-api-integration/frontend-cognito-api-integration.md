# Frontend Authentication & API Integration with Amazon Cognito

This is a walkthrough of how I integrated Amazon Cognito authentication into my React frontend, wired it up with Axios to talk to my API Gateway, and handled all the little gotchas along the way. If you're building a Vite + React + Cognito app from scratch — or just trying to understand why something broke — this should help.

---

## Table of Contents

1. [Installing the SDK](#1-installing-the-sdk)
2. [The Global Variable Fix](#2-the-global-variable-fix)
3. [Understanding UserPoolId and ClientId](#3-understanding-userpoolid-and-clientid)
4. [The Auth Service — cognitoAuth.ts](#4-the-auth-service--cognitoauthts)
5. [Sign Up Flow](#5-sign-up-flow)
6. [Email Verification Flow](#6-email-verification-flow)
7. [Sign In Flow](#7-sign-in-flow)
8. [How the SDK Handles Token Storage](#8-how-the-sdk-handles-token-storage)
9. [Sign Out — Local vs Global](#9-sign-out--local-vs-global)
10. [The Axios Interceptor — apiClient.ts](#10-the-axios-interceptor--apiclientts)
11. [Notes API Service — notesApi.ts](#11-notes-api-service--notesapits)
12. [Session Validation on App Load](#12-session-validation-on-app-load)
13. [Lessons Learned & Common Pitfalls](#13-lessons-learned--common-pitfalls)

---

## 1. Installing the SDK

I used the `amazon-cognito-identity-js` package. It's Cognito's official JavaScript SDK for browser-based authentication — no need for the full AWS SDK.

```bash
npm install --save amazon-cognito-identity-js
```

I also used `axios` for HTTP requests:

```bash
npm install --save axios
```

**Why `amazon-cognito-identity-js` and not AWS Amplify?**  
Amplify is great, but it's a large abstraction layer with a lot of opinions. If you only need authentication, `amazon-cognito-identity-js` gives you exactly that — direct control over sign-up, sign-in, token management, and session handling — without pulling in an entire framework. It's lighter, more transparent, and perfect when you want to understand what's actually happening under the hood.

---

## 2. The Global Variable Fix

Here's something that'll trip you up almost immediately: `amazon-cognito-identity-js` was built for Node.js environments and references a `global` variable that doesn't exist in the browser. When you run the app, you'll see an error like:

```
Uncaught ReferenceError: global is not defined
```

**The fix for Vite/React:** Add a polyfill script in `index.html` **before** your app bundle loads:

```html
<body>
  <script>
    if (typeof global === "undefined") {
      window.global = window;
    }
  </script>
  <div id="root"></div>
  <script type="module" src="/src/index.tsx"></script>
</body>
```

**Why before the app script?** Because the Cognito SDK is imported at the top of your modules. If `global` isn't defined by the time the import runs, it's already too late. Adding this inline script ensures it's set before anything else executes.

> **Note:** If you're working with Angular, you'd put `(window as any).global = window;` in your `polyfills.ts` file and include it in the `angular.json` build scripts. Same concept, different injection point.

---

## 3. Understanding UserPoolId and ClientId

Every Cognito operation starts with a `CognitoUserPool` instance, and it needs two things:

```typescript
const poolData = {
  UserPoolId: 'us-east-1_XXXXXXXXX',   // Your User Pool ID
  ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxx', // Your App Client ID
};

const userPool = new CognitoUserPool(poolData);
```

**What are these?**

- **UserPoolId** — The unique identifier for your Cognito User Pool. It's in the format `{region}_{poolId}`. You find it in the AWS Console under Cognito → User Pools → your pool → Pool overview. This tells the SDK *where* your user directory lives.

- **ClientId** — The App Client ID from your User Pool's app client configuration. It's found under App Integration → App clients. This identifies *which application* is making authentication requests. One user pool can have multiple app clients (e.g., one for web, one for mobile), each with different settings.

**Important:** When you created the app client, you should have left "Generate client secret" **unchecked**. Browser-based apps can't securely store a client secret (the user can just open DevTools), so Cognito supports public clients that authenticate without one. If you accidentally generated a secret, you'll get cryptic errors from the SDK.

These two values appear in several places across my codebase — `cognitoAuth.ts`, `apiClient.ts`, and `AppContext.tsx` — because each file creates its own `CognitoUserPool` instance for its specific purpose.

---

## 4. The Auth Service — cognitoAuth.ts

Rather than scattering Cognito SDK calls across every component, I created a centralized auth service file: `src/utils/cognitoAuth.ts`. This keeps the authentication logic in one place — no copy-pasting SDK boilerplate into page components.

The file exports these functions:

| Function | Purpose |
|---|---|
| `signUp()` | Register a new user with required attributes |
| `confirmRegistration()` | Verify the 6-digit email code |
| `resendConfirmationCode()` | Resend the verification code |
| `signIn()` | Authenticate and get tokens |
| `parseIdToken()` | Decode the JWT ID token for user info |
| `cognitoSignOut()` | Clear tokens locally |
| `cognitoGlobalSignOut()` | Revoke tokens server-side + clear locally |

Each function wraps the SDK's callback-based API in a `Promise` so I can use `async/await` in my React components.

---

## 5. Sign Up Flow

### How it works

```typescript
export const signUp = (
  name: string,
  familyName: string,
  email: string,
  password: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: name }),
      new CognitoUserAttribute({ Name: 'family_name', Value: familyName }),
    ];

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) { reject(err); return; }
      resolve(result!.user.getUsername());
    });
  });
};
```

**Key points:**

- **Attributes must match your pool configuration exactly.** If your pool requires `email`, `name`, and `family_name`, you must send all three. Miss one and the call fails. Add an extra one that doesn't exist and the call also fails.

- **The username is the email.** I pass `email` as the first argument to `userPool.signUp()`. In my pool, email *is* the username (sign-in identifier). This is important because every subsequent SDK call that needs a `Username` parameter will use this same email.

- **Cognito automatically sends a verification code** to the email address after sign-up. You don't trigger this — it just happens.

### In the SignUp component

The form collects First Name, Last Name, Email, and Password. On submit, it calls `signUp()` and on success, navigates to `/verify-email` passing the email via React Router state:

```typescript
await signUp(name, familyName, email, password);
navigate('/verify-email', { state: { email } });
```

Errors are displayed in a red banner — the SDK gives descriptive error messages like "Password did not conform with policy" or "An account with the given email already exists."

---

## 6. Email Verification Flow

After sign-up, the user lands on the email verification page. They enter the 6-digit code Cognito sent to their email.

### Confirming the code

```typescript
export const confirmRegistration = (
  username: string,
  code: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result); // result === 'SUCCESS'
    });
  });
};
```

**Why do I construct a new `CognitoUser`?** Because I navigated to a new page. The original `CognitoUser` from `signUp()` is no longer in scope. I reconstruct it with the `Username` (email) and the `Pool`. This is totally fine — the SDK doesn't need the same object instance, just the same username and pool.

**The second argument `true`** tells Cognito to force alias creation (linking email as a login alias). Leave it `true` unless you have a very specific reason not to.

### Resending the code

If the code expires or the user didn't get it:

```typescript
cognitoUser.resendConfirmationCode((err, result) => { ... });
```

### What happens after verification?

After successful confirmation, I redirect to `/signin` — **not** directly into the app. The user's account is now active but they don't have a session yet. They need to sign in to get tokens.

> **Why not auto-login after verification?** Because `confirmRegistration` doesn't return tokens. It just activates the account. I'd need a separate `authenticateUser` call, and at that point, it's cleaner to just take the user to the sign-in page. Plus, it gives them a chance to see that their account works.

---

## 7. Sign In Flow

### Authenticating

```typescript
export const signIn = (
  username: string,
  password: string
): Promise<{ accessToken: string; idToken: string; refreshToken: string }> => {
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        const tokens = {
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        };
        resolve(tokens);
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};
```

**The three tokens:**

- **Access Token** — This is what goes in the `Authorization` header when calling my API. API Gateway validates it. Expires after 1 hour by default.
- **ID Token** — Contains user identity claims (`sub`, `email`, `name`, etc.). I decode this to get user info for the UI.
- **Refresh Token** — A long-lived token used to get new access/ID tokens when they expire. This is what keeps the user logged in between sessions.

### Extracting user info from the ID token

Instead of making a separate API call to get user info, I decode the JWT:

```typescript
export const parseIdToken = (idToken: string) => {
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  return {
    sub: payload.sub,       // Unique user ID — used as userId in DynamoDB
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
  };
};
```

**Why `atob`?** JWTs are base64-encoded. The second segment (between the dots) is the payload. `atob()` decodes it and we parse the JSON. This is just for reading claims on the client — the actual signature validation happens on API Gateway, not here.

### In the SignIn component

```typescript
const tokens = await signIn(email, password);
const userInfo = parseIdToken(tokens.idToken);
await login({
  id: userInfo.sub,
  name: userInfo.name,
  email: userInfo.email,
});
navigate(from, { replace: true });
```

The `from` variable comes from React Router location state. If the user was redirected to sign-in from a protected route (e.g., `/notes/abc123`), they'll be sent back there after login. Otherwise, they go to `/notes`.

---

## 8. How the SDK Handles Token Storage

This is a detail that's easy to miss: **the `amazon-cognito-identity-js` SDK automatically stores all tokens in `localStorage`** whenever you call `authenticateUser()` or `getSession()`.

It uses Cognito-prefixed keys that look like:

```
CognitoIdentityServiceProvider.{clientId}.{username}.accessToken
CognitoIdentityServiceProvider.{clientId}.{username}.idToken
CognitoIdentityServiceProvider.{clientId}.{username}.refreshToken
CognitoIdentityServiceProvider.{clientId}.LastAuthUser
```

**This is why I commented out my explicit `localStorage.setItem` calls in the `signIn` function.** I was doubling up — storing the tokens myself *and* the SDK was storing them too. The SDK's storage is what `getCurrentUser()` and `getSession()` rely on, so there's no need to duplicate it.

**The SDK also uses these stored tokens to:**

- Reconstruct the current user via `userPool.getCurrentUser()`
- Return valid sessions via `user.getSession()` without re-authenticating
- Automatically refresh expired access/ID tokens using the stored refresh token

Bottom line: let the SDK manage its own token storage. You don't need to touch localStorage for Cognito tokens.

---

## 9. Sign Out — Local vs Global

There are two flavors of sign-out, and they do very different things:

### `cognitoSignOut()` — Local Sign Out

```typescript
export const cognitoSignOut = (): void => {
  const user = userPool.getCurrentUser();
  if (user) {
    user.signOut();
  }
};
```

**What it does:** Clears all Cognito tokens from `localStorage`. That's it. The refresh token is still valid on Cognito's servers — if someone had copied it, they could still use it to get new tokens.

**When to use it:** For quick, low-stakes sign-outs. When you just want to clear the browser so the user has to log in again.

### `cognitoGlobalSignOut()` — Global Sign Out

```typescript
export const cognitoGlobalSignOut = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) { resolve(); return; }

    user.getSession((err: any) => {
      if (err) {
        user.signOut(); // Still clear locally even if session fetch fails
        resolve();
        return;
      }

      user.globalSignOut({
        onSuccess: () => resolve(),
        onFailure: (err) => {
          user.signOut(); // Fallback to local clear
          reject(err);
        },
      });
    });
  });
};
```

**What it does:** Makes an API call to Cognito's servers to **revoke all tokens** (including the refresh token) for this user, across all devices. Then clears localStorage.

**Why do I call `getSession()` first?** Because `globalSignOut()` needs a valid access token to make the server-side revocation request. If the session is already expired, it can't talk to Cognito — in that case, I fall back to a local `signOut()`.

**Why the fallback `user.signOut()` in the error handler?** Even if the server-side revocation fails (e.g., network issue), I still want to clean up locally. The user's browser should always end up in a logged-out state.

**When to use it:** For security-sensitive apps. I use this in my `logout` function in `AppContext.tsx` so that when a user clicks "Sign Out," their tokens are genuinely revoked — not just forgotten.

---

## 10. The Axios Interceptor — apiClient.ts

This is where things get interesting. I created an Axios instance with a request interceptor that automatically handles authentication headers and token refresh. The goal: **no page or component should ever have to think about tokens.**

### Base setup

```typescript
const apiClient = axios.create({
  baseURL: 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod',
});
```

### What the interceptor does, step by step

Every request passes through this interceptor before being sent:

**1. Check for a logged-in user**

```typescript
const user = userPool.getCurrentUser();
if (!user) return config; // No auth needed — let the request through
```

If there's no Cognito user in localStorage, the request goes out without an `Authorization` header. This is intentional — it lets sign-up and sign-in calls work without authentication.

**2. Get the current session**

```typescript
const session = await new Promise((resolve, reject) => {
  user.getSession((err, sess) => err ? reject(err) : resolve(sess));
});
```

`getSession()` loads the tokens from localStorage and checks their expiration. If the access token is expired but the refresh token is still valid, the SDK **automatically refreshes the tokens** behind the scenes. This is one of the most useful things the SDK does for you.

**3. Check token expiration**

```typescript
const timeLeft = session.getAccessToken().getExpiration() - Math.floor(Date.now() / 1000);
```

If the token is valid for **60+ seconds**, attach it and go:

```typescript
config.headers.Authorization = `Bearer ${session.getAccessToken().getJwtToken()}`;
return config;
```

**4. Token expiring soon — the refresh queue**

If the token expires in less than 60 seconds, we need to refresh. But here's the tricky part: what if **multiple requests** fire at the same time?

I use a **leader/follower pattern**:

- The **first request** to notice the expiration becomes the "leader." It sets `isRefreshing = true` and calls `getSession()` to get fresh tokens.
- **Subsequent requests** see `isRefreshing === true` and add themselves to a `failedQueue` — an array of promises that won't resolve until the leader finishes.
- When the leader gets the new token, it calls `processQueue()` to resolve all queued promises with the new token.

```typescript
// Other requests wait here
failedQueue.push({
  resolve: (token) => {
    config.headers.Authorization = `Bearer ${token}`;
    resolve(config);
  },
  reject: (err) => reject(err),
});
```

**Why go through all this trouble?** Without the queue, you'd fire 5 simultaneous refresh calls to Cognito. That's wasteful and can cause race conditions. With the queue, only one refresh happens and everyone benefits.

**5. Session failure — sign out**

If the session can't be retrieved at all (e.g., the refresh token has expired or been revoked), the interceptor signs out the user and redirects to the sign-in page:

```typescript
user.signOut();
window.location.href = '/signin';
```

---

## 11. Notes API Service — notesApi.ts

All API calls go through the interceptor-equipped `apiClient`, so they automatically get the auth header. The API service is a clean layer that maps between my frontend's `Note` type and the backend's DynamoDB structure.

**Why the mapping?** The backend uses `noteId` and `userId` (DynamoDB keys), but the frontend uses `id` (cleaner for React). I handle that with a `mapNote` function:

```typescript
const mapNote = (bn: BackendNote): Note => ({
  id: bn.noteId,
  title: bn.title,
  content: bn.content,
  createdAt: bn.createdAt,
  updatedAt: bn.updatedAt,
});
```

**Watch the response shapes.** The backend wraps some responses differently:

- `GET /notes` → `response.data.notes` (array)
- `GET /notes/:id` → `response.data` (single note object)
- `POST /notes` → `response.data.note` (nested in a `{ message, note }` wrapper)
- `PUT /notes/:id` → `response.data.note` (nested in a `{ message, note }` wrapper)

Getting this wrong is a common bug source — I got `undefined` for IDs and dates, which led to "Each child in a list should have a unique key" and "Invalid time value" errors. Learned that one the hard way.

---

## 12. Session Validation on App Load

When the app loads, `AppContext` runs a `useEffect` that validates the Cognito session before trusting localStorage:

```typescript
useEffect(() => {
  const validateSession = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { setIsLoading(false); return; }

    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      // Stale localStorage — Cognito tokens are gone but our user key remains
      localStorage.removeItem('user');
      setIsLoading(false);
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err || !session || !session.isValid()) {
        localStorage.removeItem('user');
        cognitoUser.signOut();
      } else {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });
  };
  validateSession();
}, []);
```

**Why not just check localStorage?** Because I ran into a bug. If the user had stale data in localStorage (from a previous session), the app would set `isAuthenticated = true` and try to fetch notes — even on the sign-in page, even with expired tokens. The API call would fail, cause a re-render, which would trigger another fetch, creating an infinite loop.

The fix: ask Cognito first. If `getCurrentUser()` returns null or `getSession()` fails, the session is dead. Clean up and stay on the sign-in page.

**Note about `isLoading`:** This global `isLoading` state is **only** for the session validation on mount. It's what lets the `Layout` component show a spinner while we check if the user is still logged in, preventing a flash of the sign-in page for returning users. Note CRUD operations use their own local loading states in their respective pages — otherwise, setting the global `isLoading` would unmount components and cause re-render loops.

---

## 13. Lessons Learned & Common Pitfalls

Here's a roundup of things I ran into — saving you the debugging time:

### Don't use global `isLoading` for API calls
If your `Layout` component conditionally renders `<Outlet>` based on `isLoading`, setting `isLoading = true` for a notes fetch will **unmount** the component that triggered the fetch. When `isLoading` goes back to false, the component remounts, fires the fetch again, and you're in an infinite loop. Keep API loading states local to the pages.

### The OPTIONS request is normal
When the browser sees an `Authorization` header, it fires a CORS preflight (`OPTIONS`) request before the real one. This is browser behavior, not a bug. Your API Gateway needs CORS configured to handle it.

### `loadNotes` needs to be stable
If you expose a `loadNotes` function from context and call it in a `useEffect`, make sure it's wrapped in `useCallback`. Otherwise, every context re-render creates a new function reference, which triggers the `useEffect` again — another infinite loop.

### Guard against duplicate fetches
I use a `useRef(false)` flag (`isFetchingNotes`) to prevent concurrent `loadNotes` calls. Without it, rapid re-renders or strict mode can fire duplicate API requests.

### The SDK auto-stores tokens
The `amazon-cognito-identity-js` SDK writes tokens to localStorage automatically. You don't need to do it yourself — and doing it creates confusion about which token store is the "source of truth."

### Response shape mismatches cause subtle bugs
If the backend returns `{ message: "...", note: { noteId, ... } }` but you read `response.data.noteId`, you'll get `undefined`. This leads to React "missing key" warnings and `Invalid time value` errors from date libraries. Always verify the exact response shape.

### `global is not defined`
The Cognito SDK uses Node.js globals. In Vite/React, polyfill it in `index.html` before the app script. In Angular, put it in `polyfills.ts`. The fix is always the same — `window.global = window` — just the injection point changes.

---

## Complete Auth Flow Diagram

```
SIGN UP                              SIGN IN (returning user)
────────────────────────────         ────────────────────────────
signUp(name, familyName,             signIn(email, password)
       email, password)                       │
       │                                      ▼
       ▼                              onSuccess → tokens
Cognito sends 6-digit code                    │
       │                                      ▼
       ▼                              parseIdToken(idToken)
confirmRegistration(email, code)              │
       │                                      ▼
       ▼                              login({ id, name, email })
Redirect to /signin                           │
       │                                      ▼
       ▼                              Navigate to /notes
signIn(email, password)                       │
       │                                      ▼
       ▼                              loadNotes() fetches from API
onSuccess → tokens                    using interceptor with Bearer token
       │
       ▼
parseIdToken → login → /notes
```
