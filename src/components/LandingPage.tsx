'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles, HeartHandshake, Users, BookOpen, Heart, Shield,
  GraduationCap, Phone, Mail, MapPin, ArrowRight, ChevronDown,
  Star, Award, Quote, LogIn, Menu, X
} from 'lucide-react';

const stats = [
  { label: 'Orphans in Care', value: '400+', icon: Users, color: 'from-emerald-500 to-teal-500' },
  { label: 'Years of Service', value: '15+', icon: Award, color: 'from-teal-500 to-cyan-500' },
  { label: 'Sponsor Families', value: '250+', icon: HeartHandshake, color: 'from-cyan-500 to-indigo-500' },
  { label: 'Success Stories', value: '800+', icon: Star, color: 'from-indigo-500 to-violet-500' },
];

const programs = [
  {
    icon: BookOpen,
    title: 'School & Madrasa Education',
    description: 'Comprehensive schooling from kindergarten to post-secondary education, paired with Islamic studies at local madrasas.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/5 border-emerald-500/20',
    glow: 'shadow-emerald-500/10',
  },
  {
    icon: Heart,
    title: 'Healthcare & Medical Support',
    description: 'Full medical coverage, regular health check-ups, and psychological counselling to ensure holistic well-being.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/5 border-rose-500/20',
    glow: 'shadow-rose-500/10',
  },
  {
    icon: Shield,
    title: 'Safe Family Environment',
    description: 'Each child is placed in a loving, nurturing family environment that replicates the warmth of a true home.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/5 border-amber-500/20',
    glow: 'shadow-amber-500/10',
  },
  {
    icon: GraduationCap,
    title: 'Life Skills & Mentoring',
    description: 'Beyond academics, we provide vocational training, leadership development, and life-skills coaching.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/5 border-violet-500/20',
    glow: 'shadow-violet-500/10',
  },
];

const testimonials = [
  {
    quote: 'Ayaadi Life Education gave me not just an education, but a family, a future, and the confidence to dream bigger than I ever could.',
    author: 'Ahmed Riyaz',
    role: 'Programme Graduate · Now a Teacher',
    initial: 'A',
    color: 'bg-emerald-500',
  },
  {
    quote: 'As a sponsor, knowing exactly how my contribution is being used — down to every rupee — gives me complete peace of mind. Truly transparent.',
    author: 'Mrs. Fathima',
    role: 'Anonymous Donor · Sponsor since 2019',
    initial: 'F',
    color: 'bg-teal-500',
  },
  {
    quote: "The Yatheem Care management system ensures our children's welfare is tracked meticulously. A model for the rest of India.",
    author: 'Ustadh Ibrahim',
    role: 'Mahallu Leader · Malappuram',
    initial: 'I',
    color: 'bg-indigo-500',
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [counters, setCounters] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const targets = [400, 15, 250, 800];
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounters(targets.map(t => Math.floor(t * eased)));
      if (step >= steps) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
      {/* ========== NAVBAR ========== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-white bg-clip-text text-transparent">
                YATHEEM CARE
              </span>
              <span className="hidden sm:block text-[9px] text-emerald-400 font-semibold tracking-widest uppercase leading-none">
                Ayaadi Life Education · AIC
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm text-slate-400">
            <a href="#about" className="hover:text-white transition">About</a>
            <a href="#programs" className="hover:text-white transition">Programs</a>
            <a href="#impact" className="hover:text-white transition">Impact</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
            <a
              href="/login"
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              <LogIn className="w-3.5 h-3.5" /> Portal Login
            </a>
          </nav>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-4 space-y-3">
            {['About', 'Programs', 'Impact', 'Contact'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="block text-sm text-slate-400 hover:text-white transition py-1"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <a
              href="/login"
              className="flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm w-full justify-center"
            >
              <LogIn className="w-4 h-4" /> Portal Login
            </a>
          </div>
        )}
      </header>

      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 overflow-hidden">
        {/* Decorative glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Akode Islamic Centre · Kerala, India</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            <span className="text-white">Giving Orphans a</span>{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Brighter Future
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Ayaadi Life Education is one of the <strong className="text-slate-200">best and most unique orphan-care systems in Kerala</strong>. 
            Over <strong className="text-emerald-400">400+ children</strong> receive education, healthcare, and a loving family environment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="/login"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-8 py-3.5 rounded-2xl text-base shadow-2xl shadow-emerald-500/20 transition group"
            >
              <LogIn className="w-5 h-5" />
              Access Your Portal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </a>
            <a
              href="#about"
              className="flex items-center gap-2 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-8 py-3.5 rounded-2xl text-base transition"
            >
              Learn More
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section id="impact" className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ label, value, icon: Icon, color }, i) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center hover:border-slate-700 transition shadow-lg group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} mx-auto mb-3 flex items-center justify-center shadow-lg group-hover:scale-110 transition`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">
                {counters[i]}+
              </div>
              <div className="text-xs text-slate-400 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== ABOUT ========== */}
      <section id="about" className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <Heart className="w-3.5 h-3.5" /> Our Mission
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  A Beacon of Compassion<br />
                  <span className="text-emerald-400">& Knowledge</span>
                </h2>
              </div>
              <p className="text-slate-400 text-base leading-relaxed">
                The Akode Islamic Center is a beacon of compassion and knowledge, providing a foster life and a brighter 
                future for over <strong className="text-white">400 orphaned children</strong>. We ensure that every child 
                feels a loving family environment that warms the innocent story of childhood.
              </p>
              <p className="text-slate-400 text-base leading-relaxed">
                As a center of knowledge spanning from kindergarten to post-secondary education, we empower every individual 
                through education, preserving cherished values and encouraging personal growth.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { label: 'Founded by', value: 'Islamic Centre Virippadam' },
                  { label: 'Location', value: 'Akode, Kerala, India' },
                  { label: 'Email', value: 'islamiccentre.akod@gmail.com' },
                  { label: 'Phone', value: '+91 97458 33399' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{label}</div>
                    <div className="text-xs text-white font-semibold mt-0.5 truncate">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-3xl p-8 space-y-5">
                <Quote className="w-8 h-8 text-emerald-400/50" />
                <blockquote className="text-xl font-semibold text-white leading-relaxed italic">
                  "Every orphaned child deserves not just support, but a future filled with dignity, love, and opportunity."
                </blockquote>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-extrabold text-sm">
                    AIC
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Akode Islamic Centre</div>
                    <div className="text-xs text-slate-400">Ayaadi Life Education Programme</div>
                  </div>
                </div>
              </div>
              {/* Decorative dots */}
              <div className="absolute -top-4 -right-4 grid grid-cols-4 gap-1.5 opacity-30">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROGRAMS ========== */}
      <section id="programs" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-widest bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20">
              <GraduationCap className="w-3.5 h-3.5" /> What We Offer
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Our Programmes</h2>
            <p className="text-slate-400 max-w-xl mx-auto">A holistic ecosystem designed to nurture every aspect of a child's development.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {programs.map(({ icon: Icon, title, description, color, bg, glow }) => (
              <div key={title} className={`${bg} border rounded-2xl p-6 hover:scale-[1.02] transition shadow-lg ${glow} space-y-4`}>
                <div className={`w-11 h-11 rounded-xl ${bg} border flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className={`text-sm font-bold ${color}`}>{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <Star className="w-3.5 h-3.5" /> Voices from the Community
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">What People Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ quote, author, role, initial, color }) => (
              <div key={author} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition shadow-lg">
                <Quote className="w-6 h-6 text-slate-600" />
                <p className="text-slate-300 text-sm leading-relaxed italic">"{quote}"</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm shadow`}>
                    {initial}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{author}</div>
                    <div className="text-[10px] text-slate-500">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA — Portal Access ========== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900 border border-emerald-500/20 rounded-3xl p-10 sm:p-16 space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <LogIn className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Access Your Secure Portal</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Students, Sponsors, and Administrators each have a dedicated, private portal. Log in to manage your specific data — DigiLocker, donation history, reports, and more.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a
                href="/login"
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-8 py-3.5 rounded-2xl text-base shadow-xl shadow-emerald-500/20 transition group"
              >
                <LogIn className="w-5 h-5" /> Login to Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </a>
              <a
                href="https://aicedu.in/ayaadi-life-education/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-8 py-3.5 rounded-2xl text-base transition"
              >
                Visit AIC Website <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CONTACT ========== */}
      <section id="contact" className="py-16 px-4 border-t border-slate-800">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: MapPin, label: 'Address', value: 'Akode, Malappuram District, Kerala, India', color: 'text-emerald-400' },
            { icon: Phone, label: 'Phone', value: '+91 97458 33399', color: 'text-teal-400' },
            { icon: Mail, label: 'Email', value: 'islamiccentre.akod@gmail.com', color: 'text-cyan-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</div>
                <div className="text-sm text-slate-300 mt-0.5">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-slate-800 py-8 px-4 text-center">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-slate-950" />
          </div>
          <span className="font-extrabold text-sm bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            YATHEEM CARE
          </span>
        </div>
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Akode Islamic Centre · Ayaadi Life Education · Malappuram, Kerala
        </p>
      </footer>
    </div>
  );
}
