"use client"

import React from "react"
import { notFound } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Map,
  Zap,
  MessageSquare,
  Users,
  CreditCard,
  TrendingUp,
  Mail,
  MessageCircle,
  ShieldAlert,
  FileText,
  Settings,
  ToggleRight,
  LifeBuoy,
  Database,
  Activity,
  LayoutDashboard,
  Megaphone,
  Siren,
  Lock,
} from "lucide-react"

type SectionKey =
  | "analytics"
  | "market"
  | "matching"
  | "requests"
  | "caretakers"
  | "billing"
  | "revenue"
  | "email"
  | "sms"
  | "reliability"
  | "audit"
  | "settings"
  | "flags"
  | "support"
  | "jobs"
  | "health"
  | "cms"
  | "referrals"
  | "emergency"
  | "super"

type SectionConfig = {
  title: string
  subtitle: string
  icon: LucideIcon
  modules: string[]
  operatorActions: string[]
}

const SECTION_CONFIG: Record<SectionKey, SectionConfig> = {
  analytics: {
    title: "Analytics & BI",
    subtitle: "Track growth, funnel conversion, and market-level supply and demand shifts.",
    icon: BarChart3,
    modules: ["Growth trends", "Cohort conversion", "Matching conversion", "Export queue"],
    operatorActions: ["Run filtered export", "Save dashboard preset", "Review conversion drops"],
  },
  market: {
    title: "Market Health",
    subtitle: "Monitor state, city, and area readiness to detect demand-supply imbalance early.",
    icon: Map,
    modules: ["High-demand zones", "Low-supply zones", "Launch readiness", "Regional variance"],
    operatorActions: ["Escalate weak zones", "Flag launch blockers", "Share market snapshot"],
  },
  matching: {
    title: "Matching Engine",
    subtitle: "Inspect match runs, failures, and quality indicators across one-to-one and chain paths.",
    icon: Zap,
    modules: ["Match runs", "Failure queue", "Rule visibility", "Rerun controls"],
    operatorActions: ["Rerun failed matching", "Inspect quality regression", "Apply temporary rule override"],
  },
  requests: {
    title: "Request Operations",
    subtitle: "Handle incoming and outgoing requests, approvals, declines, and conversion performance.",
    icon: MessageSquare,
    modules: ["Pending approvals", "Approved/declined queue", "Expiry tracking", "Conversion trend"],
    operatorActions: ["Manually approve request", "Decline with reason", "Release blocked request"],
  },
  caretakers: {
    title: "Caretaker Operations",
    subtitle: "Review caretaker coverage, activity, and intervention workflows.",
    icon: Users,
    modules: ["Coverage map", "Assigned listings", "Escalation queue", "Performance snapshots"],
    operatorActions: ["Reassign caretaker", "Deactivate caretaker", "Open intervention ticket"],
  },
  billing: {
    title: "Subscriptions & Billing",
    subtitle: "Manage payment exceptions, past-due users, and subscription override workflows.",
    icon: CreditCard,
    modules: ["Subscription states", "Webhook events", "Past-due queue", "Override history"],
    operatorActions: ["Grant temporary access", "Retry failed billing", "Mark tester bypass"],
  },
  revenue: {
    title: "Revenue Analytics",
    subtitle: "Analyze MRR/ARR, churn, conversion, and collection health by plan and geography.",
    icon: TrendingUp,
    modules: ["MRR / ARR", "Churn tracker", "Failed collections", "Plan performance"],
    operatorActions: ["Export monthly report", "Compare plan cohorts", "Raise anomaly alert"],
  },
  email: {
    title: "Email Operations",
    subtitle: "Observe delivery success rates, queue health, retries, and template reliability.",
    icon: Mail,
    modules: ["Delivery status", "Queue health", "Retry pipeline", "Template health"],
    operatorActions: ["Resend transactional email", "Retry failed batch", "Pause broken template"],
  },
  sms: {
    title: "SMS Operations",
    subtitle: "Monitor OTP and notification SMS sends, provider failures, and spend behavior.",
    icon: MessageCircle,
    modules: ["OTP sends", "Provider errors", "Retry status", "Usage and spend"],
    operatorActions: ["Resend OTP", "Switch provider fallback", "Inspect spend spike"],
  },
  reliability: {
    title: "Reliability & Trust Ops",
    subtitle: "Track reliability scores, repeat cancellations, no-shows, and applied penalties.",
    icon: ShieldAlert,
    modules: ["Score distribution", "No-show trends", "Penalty queue", "Cooldown windows"],
    operatorActions: ["Apply manual penalty", "Lift cooldown", "Review trust flags"],
  },
  audit: {
    title: "Audit Logs",
    subtitle: "Review the full trail of admin and automation actions with actor and reason context.",
    icon: FileText,
    modules: ["Admin actions", "Automation actions", "Before/after snapshots", "Reason tracking"],
    operatorActions: ["Filter by actor", "Export log slice", "Investigate suspicious action"],
  },
  settings: {
    title: "Settings & Config",
    subtitle: "Centralize business controls, sender identity, and environment-safe configuration review.",
    icon: Settings,
    modules: ["Business profile", "Sender config", "Support channels", "Retention controls"],
    operatorActions: ["Update support details", "Review environment config", "Validate sender settings"],
  },
  flags: {
    title: "Feature Flags",
    subtitle: "Control rollout behavior with clear flag ownership and operational safety checks.",
    icon: ToggleRight,
    modules: ["Flag registry", "Rollout cohorts", "Exposure metrics", "Kill-switch list"],
    operatorActions: ["Enable staged rollout", "Disable unstable flag", "Audit recent flag changes"],
  },
  support: {
    title: "Support Queue",
    subtitle: "Process tickets, escalations, and SLA breaches with assignment visibility.",
    icon: LifeBuoy,
    modules: ["Open tickets", "Escalations", "SLA countdown", "Resolution notes"],
    operatorActions: ["Assign owner", "Escalate ticket", "Close with resolution note"],
  },
  jobs: {
    title: "Job Operations",
    subtitle: "Inspect worker health, failed jobs, retries, and queue lag across critical workloads.",
    icon: Database,
    modules: ["Queue depth", "Failed jobs", "Retry pipeline", "Worker heartbeat"],
    operatorActions: ["Retry failed jobs", "Drain queue safely", "Inspect stuck workers"],
  },
  health: {
    title: "System Uptime",
    subtitle: "Track API, database, cache, provider, and webhook health in one operational view.",
    icon: Activity,
    modules: ["API latency", "Database health", "Redis health", "Webhook health"],
    operatorActions: ["Acknowledge incident", "Open outage notice", "Run health diagnostics"],
  },
  cms: {
    title: "Admin CMS",
    subtitle: "Manage policy pages, onboarding copy, FAQ entries, and operational announcements.",
    icon: LayoutDashboard,
    modules: ["FAQ management", "Policy pages", "Onboarding text", "Banner slots"],
    operatorActions: ["Publish announcement", "Update policy block", "Preview onboarding copy"],
  },
  referrals: {
    title: "Referral Engine",
    subtitle: "Monitor campaign performance, referral cohorts, and invitation conversion health.",
    icon: Megaphone,
    modules: ["Campaign metrics", "Referral cohorts", "Invite conversion", "Promo outcomes"],
    operatorActions: ["Launch campaign", "Pause weak cohort", "Export growth segment"],
  },
  emergency: {
    title: "Emergency Console",
    subtitle: "Execute incident controls like pausing matching, listings, or payment actions.",
    icon: Siren,
    modules: ["Maintenance mode", "Pause matching", "Pause listings", "Emergency notice"],
    operatorActions: ["Trigger maintenance mode", "Pause contact unlock", "Broadcast incident update"],
  },
  super: {
    title: "SuperAdmin Root",
    subtitle: "High-risk root operations for one-off repairs and deeply audited overrides.",
    icon: Lock,
    modules: ["Dangerous overrides", "Repair tools", "Root history", "Approval chain"],
    operatorActions: ["Open audited override", "Execute repair action", "Review root activity log"],
  },
}

export default function AdminSectionPage({ params }: { params: { section: string } }) {
  const key = params.section as SectionKey
  const config = SECTION_CONFIG[key]

  if (!config) {
    notFound()
  }

  const Icon = config.icon

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-poppins-bold text-white mb-2 flex items-center gap-3">
          <Icon size={24} className="text-indigo-400" />
          {config.title}
        </h1>
        <p className="text-sm text-slate-400 font-poppins-medium max-w-3xl">{config.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-poppins-bold text-slate-300 uppercase tracking-wider mb-4">Core Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.modules.map((moduleName) => (
              <div
                key={moduleName}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 font-poppins-medium"
              >
                {moduleName}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-poppins-bold text-slate-300 uppercase tracking-wider mb-4">Operator Actions</h2>
          <div className="space-y-3">
            {config.operatorActions.map((action) => (
              <button
                key={action}
                type="button"
                className="w-full text-left rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300 hover:text-white hover:border-indigo-500/50 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
