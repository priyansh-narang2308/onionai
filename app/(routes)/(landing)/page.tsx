"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { ArrowRight, Check, ChevronDown, Sparkles, Zap, Calendar, MessageSquare, LayoutDashboard, Menu, X, ChevronRight } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ChannelTypeEnum, getChannelIcon } from "@/constants/channels";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Integrations", href: "#integrations" },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Floating Navbar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? "py-4" : "py-6"
          }`}
      >
        <div className="mx-auto px-6 max-w-7xl relative">
          <div
            className={`flex items-center justify-between rounded-full border border-border/40 bg-background/60 px-6 py-3 backdrop-blur-xl shadow-sm transition-all duration-300 ${isScrolled ? "shadow-md bg-background/80" : ""
              }`}
          >
            <Logo className="shrink-0 scale-95" />

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-8 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-4 md:flex">
              {!isSignedIn ? (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className="rounded-full px-6 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors h-11"
                  >
                    <Link href="/sign-in">Log in</Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-md px-7 h-11 text-base font-medium"
                  >
                    <Link href="/sign-up">Get started</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-md px-7 h-11 text-base font-medium"
                  >
                    <Link href="/schedule">Open App</Link>
                  </Button>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9 border border-border shadow-sm",
                      },
                    }}
                  />
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-foreground p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-6 right-6 mt-4 rounded-3xl border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-xl md:hidden flex flex-col gap-6 animate-in slide-in-from-top-4">
              <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-semibold text-foreground/80 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="h-px w-full bg-border/50" />
              <div className="flex flex-col gap-3">
                {!isSignedIn ? (
                  <>
                    <Button asChild variant="outline" className="w-full rounded-xl h-12">
                      <Link href="/sign-in">Log in</Link>
                    </Button>
                    <Button asChild className="w-full rounded-xl h-12 bg-foreground text-background hover:bg-foreground/90">
                      <Link href="/sign-up">Get started for free</Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild className="w-full rounded-xl h-12 bg-foreground text-background">
                    <Link href="/schedule">Open Workspace</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
          {/* Background effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[50vh] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">

            <h1 className="text-5xl font-extrabold tracking-tight text-balance sm:text-6xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 pb-4">
              Your entire social presence, automated.
            </h1>

            <p className="mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground text-balance font-medium leading-relaxed">
              Plan ideas, customize drafts for each channel, and let AI-powered scheduling do the rest. One workspace for every platform.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              {!isSignedIn ? (
                <>
                  <Button
                    asChild
                    className="h-14 w-full sm:w-auto rounded-full bg-primary px-8 text-lg font-medium text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]"
                  >
                    <Link href="/sign-up">
                      Start for free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-14 w-full sm:w-auto rounded-full px-8 text-lg font-medium border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent"
                  >
                    <Link href="#features">See how it works</Link>
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  className="h-14 rounded-full bg-primary px-8 text-lg font-medium text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]"
                >
                  <Link href="/schedule">
                    Go to Workspace
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Integrations moved to its own section */}
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="py-16">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="space-y-8 text-center">
              <h2 className="text-foreground text-3xl font-semibold tracking-tight">Integrate with your favorite channels</h2>
              <div className="*:bg-foreground/5 mx-auto flex max-w-xl flex-wrap justify-center gap-0.5 *:rounded *:p-6 *:first:rounded-l-2xl *:last:rounded-r-2xl">
                {[ChannelTypeEnum.TWITTER, ChannelTypeEnum.LINKEDIN, ChannelTypeEnum.INSTAGRAM, ChannelTypeEnum.YOUTUBE].map((type) => {
                  const icon = getChannelIcon(type);
                  return (
                    <div key={type} className="flex items-center justify-center hover:bg-foreground/10 transition-colors cursor-pointer group">
                      {icon && <HugeiconsIcon icon={icon} className="m-auto size-10 group-hover:scale-110 transition-transform duration-300" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section id="features" className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-balance">Everything you need, nothing you don't.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">Built for modern creators and teams who want to move fast without the clutter of traditional tools.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:grid-rows-2 auto-rows-[320px]">
            {/* Main Feature */}
            <div className="md:col-span-2 md:row-span-2 rounded-[32px] bg-card border border-border/50 p-10 flex flex-col justify-between overflow-hidden relative group shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">The cleanest way to plan.</h3>
                <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                  See your ideas, drafts, and scheduled posts in one beautifully designed workspace. No more juggling tabs, spreadsheets, or messy notes.
                </p>
              </div>
              <div className="relative z-10 mt-10 flex-1 w-full bg-muted/50 rounded-t-xl border-x border-t border-border/50 shadow-inner overflow-hidden translate-y-8 group-hover:translate-y-4 transition-transform duration-500">
                {/* Mockup UI representation */}
                <div className="h-8 border-b border-border/50 flex items-center px-4 gap-2 bg-background/50">
                  <div className="h-3 w-3 rounded-full bg-red-500/50" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                  <div className="h-3 w-3 rounded-full bg-green-500/50" />
                </div>
                <div className="p-6 grid grid-cols-3 gap-4">
                  <div className="col-span-1 h-32 rounded-xl bg-background border border-border/50 p-4 shadow-sm" />
                  <div className="col-span-2 h-32 rounded-xl bg-background border border-border/50 p-4 shadow-sm" />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-[32px] bg-card border border-border/50 p-8 flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Publish everywhere</h3>
              <p className="text-muted-foreground leading-relaxed">
                Start with a global draft, fine-tune for each channel, and keep every post matched to the platform's specific style.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-[32px] bg-card border border-border/50 p-8 flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Set it and forget it</h3>
              <p className="text-muted-foreground leading-relaxed">
                Reliable automated publishing means you can batch create your content and trust it will go out exactly when you want.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-border/50 bg-muted/20 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-border/50">
              <div className="flex flex-col items-center text-center pt-8 md:pt-0">
                <span className="text-6xl font-extrabold text-foreground mb-4">8+</span>
                <span className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Supported Platforms</span>
              </div>
              <div className="flex flex-col items-center text-center pt-8 md:pt-0">
                <span className="text-6xl font-extrabold text-foreground mb-4">1</span>
                <span className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Unified Workspace</span>
              </div>
              <div className="flex flex-col items-center text-center pt-8 md:pt-0">
                <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500 mb-4">AI</span>
                <span className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Native Integration</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 text-center">
          <div className="mx-auto max-w-4xl rounded-[3rem] bg-foreground text-background p-12 md:p-20 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-violet-500/20 opacity-50 pointer-events-none" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-balance relative z-10">Ready to take control?</h2>
            <p className="text-lg md:text-xl text-background/80 mb-10 max-w-2xl mx-auto text-balance relative z-10">
              Join modern creators who are saving hours every week by planning and scheduling their content with onion.ai.
            </p>
            <Button asChild size="lg" className="h-14 px-8 rounded-full bg-background text-foreground hover:bg-background/90 text-lg font-medium hover:scale-105 transition-transform relative z-10">
              <Link href="/sign-up">Start for free today</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo className="scale-90" hideName />
            <span className="font-semibold tracking-tight text-lg">onion.ai</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Onion AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const IntegrationCard = ({ title, description, children, link = '#' }: { title: string; description: string; children: React.ReactNode; link?: string }) => {
  return (
    <Card className="p-6 border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        <div className="*:size-10">{children}</div>

        <div className="space-y-2 py-6">
          <h3 className="text-base font-medium">{title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">{description}</p>
        </div>

        <div className="flex gap-3 border-t border-dashed border-border/50 pt-6">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-1 pr-2 shadow-none hover:bg-secondary/80">
            <Link href={link}>
              Learn More
              <ChevronRight className="ml-0 !size-3.5 opacity-50" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
