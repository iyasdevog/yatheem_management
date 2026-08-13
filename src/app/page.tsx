import type { Metadata } from 'next';
import LandingPageClient from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'Yatheem Care | Ayaadi Life Education — Akode Islamic Centre',
  description: 'Ayaadi Life Education is one of the best and unique orphans caring and mentoring system in Kerala, India. Over 400+ orphans are under compassionate care at the Akode Islamic Centre.',
};

export default function HomePage() {
  return <LandingPageClient />;
}
