import { Client } from "./ApiClient"

// ── Types & Schemas ──────────────────────────────────────────────────────────

export interface ApplyPenaltyPayload {
  reason: string
  scorePenalty: number
  cooldownHours: number
  blockHours: number
  metadata?: Record<string, any>
}

export type BreakChainReason = "ADMIN_FORCE" | "NO_SHOW" | "CONFLICT" | "UNKNOWN"

export interface BreakChainPayload {
  reason: BreakChainReason
  offenderUserId: string
}

export interface PaginationFilters {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

// ── Helper ───────────────────────────────────────────────────────────────────

// ── Admin API Client ─────────────────────────────────────────────────────────

export const AdminApiClient = {
  // ── 📈 STATS ───────────────────────────────────────────────────────────────
  stats: {
    getOverview: () =>
      Client.get("/admin/stats/overview"),
    getNearMisses: () =>
      Client.get("/admin/stats/near-misses"),
  },

  // ── 👥 USERS ───────────────────────────────────────────────────────────────
  users: {
    list: (filters?: PaginationFilters & { role?: string; suspended?: boolean }) =>
      Client.get("/admin/users", filters),
    getProfile: (userId: string) =>
      Client.get(`/admin/users/${userId}`),
    getReliability: (userId: string) =>
      Client.get(`/admin/users/${userId}/reliability`),
    updateUser: (userId: string, data: { fullName?: string; role?: string }) =>
      Client.patch(`/admin/users/${userId}`, data),
    suspendUser: (userId: string, data: { hours: number }) =>
      Client.post(`/admin/users/${userId}/suspend`, data),
    unblockUser: (userId: string, data: { reason: string }) =>
      Client.post(`/admin/users/${userId}/unblock`, data),
    applyPenalty: (userId: string, payload: ApplyPenaltyPayload) =>
      Client.post(`/admin/users/${userId}/penalty`, payload),
    createUser: (data: any) =>
      Client.post("/admin/users/create", data),
  },

  // ── 🏠 LISTINGS ────────────────────────────────────────────────────────────
  listings: {
    list: (filters?: PaginationFilters & { status?: string; type?: string }) =>
      Client.get("/admin/listings", filters),
    getDetails: (listingId: string) =>
      Client.get(`/admin/listings/${listingId}`),
    closeListing: (listingId: string, data: { reason: string }) =>
      Client.post(`/admin/listings/${listingId}/close`, data),
    deleteListing: (listingId: string) =>
      Client.delete(`/admin/listings/${listingId}`),
    verifyListing: (listingId: string, data: { approve: boolean; reason?: string }) =>
      Client.post(`/admin/listings/${listingId}/verify`, data),
    createListing: (data: any) =>
      Client.post("/admin/listings/create", data),
  },

  // ── ✅ VERIFICATIONS ────────────────────────────────────────────────────────
  verifications: {
    getPending: () =>
      Client.get("/admin/verifications/pending"),
    getAll: (filters?: PaginationFilters) =>
      Client.get("/admin/verifications", filters),
  },

  // ── 🔗 CHAINS ──────────────────────────────────────────────────────────────
  chains: {
    list: (filters?: PaginationFilters) =>
      Client.get("/admin/chains", filters),
    getDetails: (chainId: string) =>
      Client.get(`/admin/chains/${chainId}`),
    breakChain: (chainId: string, payload: BreakChainPayload) =>
      Client.post(`/admin/chains/${chainId}/break`, payload),
    expireChain: (chainId: string) =>
      Client.post(`/admin/chains/${chainId}/expire`, {}),
    rerunMatching: (chainId: string) =>
      Client.post(`/admin/chains/${chainId}/rerun`, {}),
    expireOverdue: () =>
      Client.post("/admin/chains/expire-overdue", {}),
  },

  // ── 📲 PUSH NOTIFICATIONS ──────────────────────────────────────────────────
  pushNotifications: {
    getCampaigns: () =>
      Client.get("/admin/push-notifications"),
    create: (data: { title: string; desc: string; target: "ALL_USERS" | "SEEKERS" | "SWAPPERS" | "VERIFIED_USERS" | string; [key: string]: any }) =>
      Client.post("/admin/push-notifications", data),
    update: (id: string, data: any) =>
      Client.patch(`/admin/push-notifications/${id}`, data),
    delete: (id: string) =>
      Client.delete(`/admin/push-notifications/${id}`),
    sendNow: (id: string) =>
      Client.post(`/admin/push-notifications/${id}/send`, {}),
    sendToUser: (data: { userId: string; title: string; body: string }) =>
      Client.post("/admin/push-notifications/send-to-user", data),
  },

  // ── 🚨 REPORTS ─────────────────────────────────────────────────────────────
  reports: {
    list: (filters?: PaginationFilters) =>
      Client.get("/admin/reports", filters),
    reviewReport: (reportId: string, data: { status: "REVIEWED" | "DISMISSED"; notes?: string }) =>
      Client.patch(`/admin/reports/${reportId}/review`, data),
  },

  // ── 🏢 VACANCIES ───────────────────────────────────────────────────────────
  vacancies: {
    list: (filters?: PaginationFilters) =>
      Client.get("/admin/vacancies", filters),
    create: (data: any) =>
      Client.post("/admin/vacancies", data),
    delete: (vacancyId: string) =>
      Client.delete(`/admin/vacancies/${vacancyId}`),
  },

  // ── 👷 CARETAKERS ──────────────────────────────────────────────────────────
  caretakers: {
    list: (filters?: PaginationFilters) =>
      Client.get("/admin/caretakers", filters),
  },

  // ── 📜 ACTIVITY ────────────────────────────────────────────────────────────
  activity: {
    getLogs: (filters?: PaginationFilters) =>
      Client.get("/admin/activity", filters),
  },

  // ── 🛠 STAFF MANAGEMENT ────────────────────────────────────────────────────
  staff: {
    list: (filters?: PaginationFilters) =>
      Client.get("/admin/staff", filters),
  },
}
