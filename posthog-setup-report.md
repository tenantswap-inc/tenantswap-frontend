<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into TenantSwap. Events are tracked across the full user journey — from registration and login through listing creation, match exploration, and swap request outcomes. User identification is called on successful login and registration so that events from both flows are correlated to the same person profile. Exception capture has been added to critical async handlers in the login, registration, and engine flows.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `user_logged_in` | User successfully logs in with phone and password | `app/login/page.tsx` |
| `user_login_failed` | Login attempt fails (invalid credentials, suspended, not found, rate-limited, etc.) | `app/login/page.tsx` |
| `user_registered` | User completes registration after onboarding | `app/register/page.tsx` |
| `google_sso_initiated` | User clicks Google sign-in or sign-up button | `components/GoogleSignInButton.tsx` |
| `listing_created` | User successfully creates a SWAP or SEEKING listing | `app/engine/page.tsx` |
| `match_explored` | User opens the match detail modal to explore a potential swap | `components/MatchCard.tsx` |
| `swap_request_sent` | User sends a connection/swap request to a matched tenant | `app/dashboard/page.tsx` |
| `swap_request_approved` | User approves an incoming swap connection request | `app/dashboard/page.tsx` |
| `swap_request_declined` | User declines an incoming swap connection request | `app/dashboard/page.tsx` |
| `vacancy_alert_created` | User creates a vacancy alert for a desired property | `app/dashboard/page.tsx` |
| `vacancy_alert_removed` | User removes an existing vacancy alert | `app/dashboard/page.tsx` |
| `swap_request_retried` | User retries a swap request after it was previously declined | `components/MatchCard.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/367795/dashboard/1428159
- **User Acquisition Funnel** (Register → Create Listing → Explore Match → Send Request): https://us.posthog.com/project/367795/insights/Imlt5eEP
- **Daily Logins & Registrations**: https://us.posthog.com/project/367795/insights/LG087Jbl
- **Swap Request Outcomes** (Approved vs Declined): https://us.posthog.com/project/367795/insights/S4WdzPtU
- **Login Failure Reasons** (broken down by reason): https://us.posthog.com/project/367795/insights/xMdzyTrv
- **Listing Creation Trend** (broken down by listing type): https://us.posthog.com/project/367795/insights/dxYVS09d

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
