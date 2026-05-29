# Test plan (plain language)

## Core flows

1. **Client happy path**
   - Scan QR (or open URL) on iPhone Safari + Android Chrome.
   - Read headline; tap **primary action**; reach success state.
2. **Owner edit**
   - Sign in with password; change headline; save; refresh public page and see update.
3. **Wrong password**
   - Friendly error; no data leak.
4. **Stats sanity**
   - Generate N known visits and M completions; dashboard totals approximately match.

## Edge cases

- Very long headline wraps; layout does not overflow horizontally on narrow screens.
- Rapid double-tap on primary action: UI shows one clear outcome (no duplicate confusion when avoidable).
- Slow network: page still becomes usable; loading state not infinite.

## Data / privacy

- If action collects client fields: verify required/optional behavior and error messages.

## Accessibility

- Primary action is reachable by keyboard; focus visible.
- Sufficient contrast on primary button with default theme.
