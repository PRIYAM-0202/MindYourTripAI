import { useEffect, useState } from 'react';
import {
  Compass,
  Plane,
  Sparkles,
  Brain,
  Wallet,
  Users,
  MessageSquare,
  FileText,
  ShieldCheck,
  ArrowRight,
  Check,
  Cloud,
  MapPin,
  Calendar,
  TrendingUp,
  Bot,
  Mic,
  Receipt,
  ChevronDown,
  Star,
  Quote,
} from 'lucide-react';
import { TravelBackground } from '@/components/TravelBackground';
import { Link } from '@/lib/router';

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <TravelBackground variant="full" />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <About />
        <Features />
        <HowItWorks />
        <AIBenefits />
        <Testimonials />
        <FAQ />
        <Footer />
      </div>
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-strong border-b border-white/10' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl ai-gradient flex items-center justify-center shadow-glow">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-bold text-white">MindYourTrip AI</div>
            <div className="text-[10px] text-ai-300 font-medium tracking-wide">AI-ASSISTED TRAVEL</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: 'About', href: '#about' },
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how' },
            { label: 'AI Benefits', href: '#ai' },
            { label: 'FAQ', href: '#faq' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="btn-ghost text-sm hidden sm:inline-flex">
            Sign in
          </Link>
          <Link to="/auth" className="btn-primary text-sm">
            Create Your Trip <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-40 pb-24 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 chip-ai mb-6 animate-fade-up">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Assisted Travel. Human Decisions.
        </div>

        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white text-balance animate-fade-up animate-delay-100">
          Plan Every Journey
          <br />
          <span className="ai-gradient-text">Smarter with AI</span>
        </h1>

        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto text-balance animate-fade-up animate-delay-200">
          MindYourTrip AI intelligently assists groups in planning, organizing,
          collaborating, budgeting, and improving travel experiences — without
          taking away user control.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-fade-up animate-delay-300">
          <Link to="/auth" className="btn-primary text-base px-6 py-3">
            <Plane className="w-5 h-5" /> Create Your Trip
          </Link>
          <Link to="/auth" className="btn-ghost text-base px-6 py-3">
            <Sparkles className="w-5 h-5" /> Explore Dashboard
          </Link>
          <a href="#about" className="btn-ghost text-base px-6 py-3">
            Learn More <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Animated dashboard preview */}
        <div className="mt-16 relative animate-fade-up animate-delay-500">
          <div className="glass-strong rounded-3xl p-2 shadow-glow-lg max-w-5xl mx-auto">
            <div className="rounded-2xl bg-ink-950/80 overflow-hidden">
              <HeroPreview />
            </div>
          </div>
          <div className="absolute -inset-4 ai-gradient opacity-20 blur-3xl -z-10 rounded-[3rem]" />
        </div>

        {/* Stat strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fade-up animate-delay-700">
          {[
            { value: '1', label: 'Unified workspace', icon: Compass },
            { value: '5', label: 'AI agents working', icon: Bot },
            { value: '100%', label: 'Human decisions', icon: ShieldCheck },
            { value: '∞', label: 'Trips to plan', icon: Plane },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <s.icon className="w-5 h-5 text-ai-300 mx-auto mb-2" />
              <div className="font-display text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="grid grid-cols-12 gap-3 p-4 text-left">
      {/* Sidebar mini */}
      <div className="col-span-3 hidden md:block space-y-1.5">
        {['Home', 'Trips', 'Trip Board', 'AI Assistant', 'Budget'].map((n, i) => (
          <div
            key={n}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
              i === 0 ? 'bg-ai-500/15 border border-ai-500/30 text-white' : 'text-slate-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ai-400" /> {n}
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="col-span-12 md:col-span-9 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Upcoming', value: '3', accent: 'text-ai-300' },
            { label: 'Budget used', value: '68%', accent: 'text-glow-amber' },
            { label: 'Pending approvals', value: '2', accent: 'text-glow-rose' },
          ].map((c) => (
            <div key={c.label} className="glass rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">{c.label}</div>
              <div className={`font-display text-xl font-bold mt-1 ${c.accent}`}>{c.value}</div>
            </div>
          ))}
        </div>
        <div className="glass rounded-xl p-4 border-l-2 border-ai-500">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-ai-300" />
            <span className="text-[10px] uppercase tracking-wider text-ai-300">AI Recommendation</span>
          </div>
          <div className="text-sm font-medium text-white">Book your hotel within two days</div>
          <div className="text-xs text-slate-400 mt-1">
            Hotel prices typically rise 8–15% in the final 2 weeks before travel.
          </div>
          <div className="flex gap-1.5 mt-2">
            {['Accept', 'Modify', 'Ignore', 'Ask AI Why'].map((b) => (
              <span key={b} className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                {b}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          {['Goa Trip', 'Manali Escape'].map((t) => (
            <div key={t} className="glass rounded-xl p-3 flex-1">
              <div className="h-16 rounded-lg ai-gradient-soft mb-2" />
              <div className="text-sm font-medium text-white">{t}</div>
              <div className="text-[10px] text-slate-400">5 days · 4 members</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="py-24 px-4 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          tag="About"
          title="Not a booking site. Not a chatbot. A travel operating system."
          subtitle="MindYourTrip AI combines planning, collaboration, budgeting, documents, and intelligence into one workspace — so you never need to juggle WhatsApp, Docs, Excel, and five separate apps again."
        />
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Bot,
              title: 'AI assists',
              text: 'It observes, recommends, predicts, summarizes, and learns from your trips — continuously.',
            },
            {
              icon: Users,
              title: 'Humans decide',
              text: 'Every recommendation offers Accept, Modify, Ignore, or Ask AI Why. You always have the final word.',
            },
            {
              icon: Compass,
              title: 'One workspace',
              text: 'Plan, chat, vote, budget, store documents, and approve — all in a single shared trip board.',
            },
          ].map((c, i) => (
            <div
              key={c.title}
              className="glass-card glass-hover p-6 animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-11 h-11 rounded-xl ai-gradient-soft border border-ai-500/30 flex items-center justify-center mb-4">
                <c.icon className="w-5 h-5 text-ai-300" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">{c.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Users,
    title: 'Collaborative Trip Board',
    text: 'Add places, restaurants, hotels, and activities. Vote, comment, approve, and drag-and-drop across status columns — Ideas, Suggested, Discussing, Approved, Booked, Completed.',
  },
  {
    icon: Wallet,
    title: 'Smart Budget with AI Splitting',
    text: 'Expenses are never divided equally by default. The AI recommends fair splits based on who actually participated — then you confirm or edit before saving.',
  },
  {
    icon: MessageSquare,
    title: 'Group Chat per Trip',
    text: 'Messages, voice notes, polls, replies, mentions, reactions, and system messages — everything a group needs, with the AI quietly summarizing on request.',
  },
  {
    icon: Mic,
    title: 'Voice Expense Entry',
    text: 'Say "I paid ₹2,400 for dinner for Priyam, Aman and Rahul" — the AI converts it into a structured expense with the right participants.',
  },
  {
    icon: Receipt,
    title: 'Receipt & Booking Scanner',
    text: 'Upload restaurant receipts and travel tickets. AI extracts merchant, items, totals, dates, passenger names, and booking IDs — all awaiting your confirmation.',
  },
  {
    icon: FileText,
    title: 'Documents Module',
    text: 'Store tickets, visas, insurance, passports, and hotel confirmations. AI organizes and categorizes them automatically after you approve.',
  },
  {
    icon: ShieldCheck,
    title: 'Approvals Workflow',
    text: 'Nothing happens automatically. Every key action — activity, budget change, member invite — routes through a group approval process.',
  },
  {
    icon: Brain,
    title: 'AI Memory & Personalization',
    text: 'The AI remembers your favorite destinations, travel style, budget range, and group size — so future trips get smarter recommendations.',
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          tag="Features"
          title="Everything your group needs, in one place"
          subtitle="Replace WhatsApp, Google Docs, Notes, Excel, expense splitters, itinerary apps, and reminder apps with a single intelligent workspace."
        />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass-card glass-hover p-5 group animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-10 h-10 rounded-xl ai-gradient-soft border border-ai-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5 text-ai-300" />
              </div>
              <h3 className="font-display text-base font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: '01',
    icon: Plane,
    title: 'Create your trip',
    text: 'Enter destination, dates, and budget. The AI instantly suggests better dates, weather, estimated costs, attractions, hotels, and local experiences.',
  },
  {
    n: '02',
    icon: Users,
    title: 'Invite your group',
    text: 'Invite by email, phone, link, or QR code. Roles (Owner, Admin, Editor, Member, Viewer) keep permissions clean.',
  },
  {
    n: '03',
    icon: LayoutGridIcon,
    title: 'Collaborate on the board',
    text: 'Suggest, vote, comment, and approve places and activities. The AI recommends and flags conflicts — you decide.',
  },
  {
    n: '04',
    icon: Wallet,
    title: 'Track budget smartly',
    text: 'Record expenses by voice, receipt scan, or manual entry. AI splits fairly by who participated; you confirm every split.',
  },
];

function LayoutGridIcon(props: { className?: string }) {
  return <LayoutGrid {...props} />;
}
import { LayoutGrid } from 'lucide-react';

function HowItWorks() {
  return (
    <section id="how" className="py-24 px-4 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          tag="How It Works"
          title="From idea to itinerary in four steps"
          subtitle="The AI assists at every step — but you, and your group, make every decision."
        />
        <div className="mt-12 space-y-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="glass-card glass-hover p-6 flex items-start gap-5 animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="font-display text-3xl font-bold ai-gradient-text flex-shrink-0 w-16">
                {s.n}
              </div>
              <div className="w-11 h-11 rounded-xl ai-gradient-soft border border-ai-500/30 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-ai-300" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const AI_BENEFITS = [
  { icon: TrendingUp, title: 'Predictive analytics', text: 'Estimates final cost, daily spending, budget overrun risk, price trends, crowd levels, and weather risk — from your trip history.' },
  { icon: Brain, title: 'Learns your style', text: 'Favorite destinations, food and hotel preferences, average budget, typical group size. Suggestions get sharper every trip.' },
  { icon: Sparkles, title: 'Contextual recommendations', text: 'Try moving this activity to Day 2. Weather may affect this plan. A cheaper train option is available. Everywhere you look.' },
  { icon: Bot, title: 'Discussion summarizer', text: '"Today: hotel finalized, budget increased, three activities approved, transport pending." No need to scroll back.' },
  { icon: ShieldCheck, title: 'Risk detection', text: 'Budget warnings, missing documents, pending approvals, closed-on-Mondays — the AI flags what you might miss.' },
  { icon: MessageSquare, title: 'Natural-language search', text: '"Find beaches near our hotel." "Show vegetarian restaurants." "Suggest adventure activities." Just ask.' },
];

function AIBenefits() {
  return (
    <section id="ai" className="py-24 px-4 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          tag="AI Benefits"
          title="An AI advisor that never takes the wheel"
          subtitle="It continuously observes, analyzes, recommends, predicts, summarizes, compares, and optimizes — but every final decision stays with you."
        />
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className="glass-card glass-hover p-5 relative overflow-hidden animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 ai-gradient opacity-10 blur-2xl rounded-full" />
              <div className="flex items-center gap-3 mb-3 relative">
                <div className="w-9 h-9 rounded-lg ai-gradient flex items-center justify-center shadow-glow-soft">
                  <b.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="font-display text-base font-semibold text-white">{b.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed relative">{b.text}</p>
            </div>
          ))}
        </div>

        {/* AI philosophy callout */}
        <div className="mt-12 glass-strong rounded-3xl p-8 lg:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 ai-gradient opacity-[0.06]" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl ai-gradient flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <p className="font-display text-2xl lg:text-3xl font-bold text-white text-balance max-w-2xl mx-auto">
              "AI assists. Humans decide."
            </p>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto text-sm">
              The AI is a travel advisor. It should never become the travel manager.
              No automatic bookings. No automatic spending. No automatic changes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-24 px-4 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          tag="Testimonials"
          title="What travelers are saying"
          subtitle="Early groups who planned with MindYourTrip AI — coming soon to more travelers worldwide."
        />
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[
            {
              name: 'Priyam S.',
              role: 'Group of 6, Goa trip',
              quote: 'The smart split saved friendships. The AI noticed two friends skipped dinner and only charged the rest of us. No awkward math.',
            },
            {
              name: 'Aman K.',
              role: 'Couples trip, Manali',
              quote: 'I loved that it never booked anything for us. It just nudged — "book the hotel within two days" — and we decided.',
            },
            {
              name: 'Neha R.',
              role: 'Family of 5, Bali',
              quote: 'One chat, one board, one budget. We stopped drowning in WhatsApp groups and spreadsheets. The summary feature is gold.',
            },
          ].map((t, i) => (
            <div
              key={t.name}
              className="glass-card p-6 animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <Quote className="w-7 h-7 text-ai-400/50 mb-3" />
              <p className="text-sm text-slate-200 leading-relaxed mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full ai-gradient flex items-center justify-center text-sm font-semibold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.role}</div>
                </div>
              </div>
              <div className="flex gap-0.5 mt-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-glow-amber" fill="currentColor" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const faqs = [
    {
      q: 'Does the AI automatically book things for me?',
      a: 'Never. The AI only suggests, recommends, and organizes. Every booking, expense, itinerary change, and member invite requires your explicit confirmation. The philosophy is: AI assists, humans decide.',
    },
    {
      q: 'How does the smart budget splitting work?',
      a: 'When you record an expense, the AI recommends a split based on who actually participated. If member D skipped dinner, only A, B, and C are charged. You can edit the split before confirming — nothing is automatic.',
    },
    {
      q: 'Can I use voice to add expenses?',
      a: 'Yes. Say something like "I paid ₹2,400 for dinner for Priyam, Aman and Rahul" and the AI parses the amount, title, participants, and category into a structured expense — always awaiting your confirmation.',
    },
    {
      q: 'What can I upload to the documents module?',
      a: 'Tickets, receipts, invoices, visas, insurance, passports, hotel confirmations, and booking PDFs. The AI extracts relevant details and suggests a category — you confirm before it\'s filed.',
    },
    {
      q: 'Does the AI learn from my past trips?',
      a: 'Yes. It remembers favorite destinations, travel style, budget range, typical group size, food and hotel preferences — so future recommendations become increasingly personalized, while still leaving decisions to you.',
    },
    {
      q: 'Is my group\'s data secure?',
      a: 'Every trip is protected with row-level security. Only trip members can view or edit trip data, with role-based permissions (Owner, Admin, Editor, Member, Viewer) controlling who can do what.',
    },
  ];

  return (
    <section id="faq" className="py-24 px-4 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <SectionHeading tag="FAQ" title="Common questions" />
        <div className="mt-10 space-y-2.5">
          {faqs.map((f, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-white">{f.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed animate-fade-in">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 glass-strong rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-aurora opacity-50" />
          <div className="relative">
            <h3 className="font-display text-2xl font-bold text-white mb-2">
              Ready to plan smarter?
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">
              Create your first trip and watch the AI assist your group from idea to itinerary.
            </p>
            <Link to="/auth" className="btn-primary text-base px-6 py-3 inline-flex">
              <Plane className="w-5 h-5" /> Get started free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-4 lg:px-8 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl ai-gradient flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="font-display text-base font-bold text-white">MindYourTrip AI</div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              AI-assisted collaborative travel planning. Artificial Intelligence empowers
              travelers with data-driven suggestions while every important decision remains
              completely in the hands of the users.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="#ai" className="hover:text-white transition-colors">AI benefits</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Get started</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/auth" className="hover:text-white transition-colors">Create account</Link></li>
              <li><Link to="/auth" className="hover:text-white transition-colors">Sign in</Link></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© 2026 MindYourTrip AI. AI assists. Humans decide.</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({ tag, title, subtitle }: { tag: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <span className="chip-ai mb-4 inline-flex">{tag}</span>
      <h2 className="font-display text-3xl lg:text-4xl font-bold text-white text-balance">{title}</h2>
      {subtitle && <p className="mt-4 text-slate-400 text-balance">{subtitle}</p>}
    </div>
  );
}
