"use client";

import { useState } from "react";
import { ClerkLoaded, ClerkLoading, PricingTable } from "@clerk/nextjs";
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  TrendingUp, 
  Layers, 
  Cpu, 
  ChevronDown, 
  Lock, 
  Infinity as InfinityIcon,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Can I upgrade or downgrade my subscription anytime?",
    answer: "Yes, absolutely! Prorated charges or credits will automatically apply to your account when you switch between Pro and Premium tiers."
  },
  {
    question: "What happens if I exceed my monthly AI content suggestions?",
    answer: "On Free and Pro tiers, you'll receive a notification when you reach 90% of your limit. You can easily upgrade with one click without disrupting your scheduled social pipeline."
  },
  {
    question: "Are social media account connections secure?",
    answer: "Onion AI uses official OAuth 2.0 APIs verified by X (Twitter), LinkedIn, and Instagram. We never store your direct passwords, only encrypted refresh tokens."
  },
  {
    question: "Do you offer custom Enterprise or Agency plans?",
    answer: "Yes! If you manage over 50 client social accounts or need custom Neo4j Knowledge Graph isolation, reach out to our dedicated support team for agency volume discounts."
  }
];

const perks = [
  {
    icon: Cpu,
    title: "Graph-Powered AI Engine",
    description: "Leverage Neo4j knowledge graphs that learn your audience's engagement patterns to write hyper-converting hooks."
  },
  {
    icon: Zap,
    title: "Instant Multi-Channel Sync",
    description: "Write once, tailor effortlessly. Auto-format posts for X threads, LinkedIn carousels, and Instagram captions instantly."
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade Encryption",
    description: "All OAuth tokens and scheduling pipelines run inside SOC-2 compliant isolated containers with 99.99% SLA uptime."
  }
];

const BillingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="relative min-h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-border/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-600 dark:text-lime-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="size-3.5 animate-pulse" />
            <span>Workspace Subscription</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Plans & Billing
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl">
            Scale your AI content pipeline with supercharged scheduling, intelligent Neo4j graph insights, and multi-channel synchronization.
          </p>
        </div>

        {/* Current Plan Quick Badge */}
        <div className="flex items-center gap-4 bg-card/60 backdrop-blur-md border border-border/80 p-4 rounded-2xl shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-500/15 border border-lime-500/30 text-lime-600 dark:text-lime-400">
            <Award className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Current Status</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                ACTIVE
              </span>
            </div>
            <p className="text-sm font-semibold mt-0.5">Free Starter Tier</p>
          </div>
        </div>
      </div>

      {/* Usage Overview Matrix Card */}
      <div className="mb-12 relative rounded-3xl border border-border/70 bg-gradient-to-br from-card/90 via-card/50 to-background backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-lime-500/5">
        <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-40 h-40 bg-lime-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="size-5 text-lime-500" />
              <span>Current Cycle Usage</span>
            </h2>
            <p className="text-xs text-muted-foreground">Monthly allocation resets on August 1, 2026</p>
          </div>
          <Badge className="bg-lime-500 hover:bg-lime-600 text-black font-semibold text-xs py-1 px-3">
            Upgrade for Unlimited
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metric 1 */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/50">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-medium text-muted-foreground">AI Content Hooks</span>
              <span className="font-bold text-foreground">142 <span className="text-xs font-normal text-muted-foreground">/ 500 free</span></span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-lime-500 to-emerald-400 rounded-full w-[28%] transition-all duration-500 shadow-sm shadow-lime-500/50" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" /> Normal creation velocity
            </p>
          </div>

          {/* Metric 2 */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/50">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-medium text-muted-foreground">Connected Channels</span>
              <span className="font-bold text-foreground">2 <span className="text-xs font-normal text-muted-foreground">/ 3 accounts</span></span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full w-[66%] transition-all duration-500" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              1 free account slot remaining
            </p>
          </div>

          {/* Metric 3 */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/50">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-medium text-muted-foreground">Post Scheduling</span>
              <span className="font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                <InfinityIcon className="size-4" /> Unlimited
              </span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full w-full" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <Zap className="size-3 text-amber-500" /> Automated calendar active
            </p>
          </div>
        </div>
      </div>

      {/* Perks Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {perks.map((perk, idx) => {
          const Icon = perk.icon;
          return (
            <div key={idx} className="group relative rounded-2xl border border-border/60 bg-card/40 p-6 transition-all duration-300 hover:bg-card/80 hover:border-lime-500/40 hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500/10 border border-lime-500/20 text-lime-600 dark:text-lime-400 mb-4 group-hover:scale-110 transition-transform">
                <Icon className="size-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">{perk.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{perk.description}</p>
            </div>
          );
        })}
      </div>

      {/* Clerk Pricing Table Section */}
      <div className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Choose Your Superpower
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Transparent pricing designed for individual creators, rapidly growing brands, and elite marketing agencies.
          </p>
        </div>

        <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 via-card/40 to-background/50 backdrop-blur-2xl p-4 sm:p-8 shadow-2xl shadow-black/5">
          <ClerkLoading>
            <div className="flex flex-col items-center justify-center h-80 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lime-500" />
              <p className="text-xs font-medium text-muted-foreground animate-pulse">Loading live plans & pricing...</p>
            </div>
          </ClerkLoading>

          <ClerkLoaded>
            <div className="w-full">
              <PricingTable for="user" newSubscriptionRedirectUrl="/billing" />
            </div>
          </ClerkLoaded>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="size-5 text-lime-500" />
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className="rounded-2xl border border-border/60 bg-card/50 transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-sm sm:text-base hover:text-lime-500 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180 text-lime-500")} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Enterprise Trust Footer */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-secondary/40 via-card/60 to-secondary/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-500/10 border border-lime-500/20 text-lime-600 dark:text-lime-400">
            <Lock className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Secure Stripe & Clerk Infrastructure</p>
            <p className="text-xs text-muted-foreground">All payments are processed securely via SSL encryption with PCI-DSS compliance.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>Instant Activation</span>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
