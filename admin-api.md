# 📊 ADMIN API ENDPOINTS — (/admin | ADMIN role required)

━━━━━━━━━━━━━━━
### 📈 STATS
• **GET** `/admin/stats/overview` → Platform overview (users, listings, chains)
• **GET** `/admin/stats/near-misses` → Near-miss breakdown

━━━━━━━━━━━━━━━
### 👥 USERS
• **GET** `/admin/users` → List users *(filters: page, limit, search, role, suspended)*
• **GET** `/admin/users/:userId` → Full user profile
• **GET** `/admin/users/:userId/reliability` → Reliability score
• **PATCH** `/admin/users/:userId` → Update user *(fullName, role)*
• **POST** `/admin/users/:userId/suspend` → Suspend *(hours)*
• **POST** `/admin/users/:userId/unblock` → Unblock *(reason)*
• **POST** `/admin/users/:userId/penalty` → Apply penalty
• **POST** `/admin/users/create` → Create user

━━━━━━━━━━━━━━━
### 🏠 LISTINGS
• **GET** `/admin/listings` → List listings *(filters: page, status, type, search)*
• **GET** `/admin/listings/:listingId` → Listing details
• **POST** `/admin/listings/:listingId/close` → Close listing *(reason)*
• **DELETE** `/admin/listings/:listingId` → Delete
• **POST** `/admin/listings/:listingId/verify` → Approve/Reject
• **POST** `/admin/listings/create` → Create listing

━━━━━━━━━━━━━━━
### ✅ VERIFICATIONS
• **GET** `/admin/verifications/pending` → Pending verifications
• **GET** `/admin/verifications` → All verifications *(filters)*

━━━━━━━━━━━━━━━
### 🔗 CHAINS
• **GET** `/admin/chains` → List chains
• **GET** `/admin/chains/:chainId` → Chain details
• **POST** `/admin/chains/:chainId/break` → Break chain *(reason, offenderUserId)*
• **POST** `/admin/chains/:chainId/expire` → Expire chain
• **POST** `/admin/chains/:chainId/rerun` → Rerun matching
• **POST** `/admin/chains/expire-overdue` → Expire overdue

━━━━━━━━━━━━━━━
### 📲 PUSH NOTIFICATIONS
• **GET** `/admin/push-notifications` → Campaigns
• **POST** `/admin/push-notifications` → Create/send *(title, desc, target, etc.)*
• **PATCH** `/admin/push-notifications/:id` → Update
• **DELETE** `/admin/push-notifications/:id` → Delete
• **POST** `/admin/push-notifications/:id/send` → Send now
• **POST** `/admin/push-notifications/send-to-user` → Send to user

**Targets:** `ALL_USERS` · `SEEKERS` · `SWAPPERS` · `VERIFIED_USERS`

━━━━━━━━━━━━━━━
### 🚨 REPORTS
• **GET** `/admin/reports` → User reports
• **PATCH** `/admin/reports/:reportId/review` → Review *(REVIEWED / DISMISSED)*

━━━━━━━━━━━━━━━
### 🏢 VACANCIES
• **GET** `/admin/vacancies` → List vacancies
• **POST** `/admin/vacancies` → Create vacancy
• **DELETE** `/admin/vacancies/:vacancyId` → Delete

━━━━━━━━━━━━━━━
### 👷 CARETAKERS
• **GET** `/admin/caretakers` → List caretakers

━━━━━━━━━━━━━━━
### 📜 ACTIVITY
• **GET** `/admin/activity` → Platform activity logs

━━━━━━━━━━━━━━━
### 🛠 STAFF MANAGEMENT
• **GET** `/admin/staff` → Staff/admin users

━━━━━━━━━━━━━━━
### ⚙️ SCHEMAS

#### Apply Penalty
```json
{
  "reason": "string",
  "scorePenalty": 10,
  "cooldownHours": 24,
  "blockHours": 48,
  "metadata": {}
}
```

#### Break Chain
```json
{
  "reason": "ADMIN_FORCE | NO_SHOW | CONFLICT | UNKNOWN",
  "offenderUserId": "uuid"
}
```
