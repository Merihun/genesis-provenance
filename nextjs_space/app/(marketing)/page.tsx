'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Shield, Sparkles, FileCheck, Users, TrendingUp, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function HomePage() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    {
      icon: Shield,
      title: 'AI-Powered Authentication',
      description: 'Advanced AI analysis of images and documents to verify authenticity and detect potential issues.',
    },
    {
      icon: FileCheck,
      title: 'Digital Certificates',
      description: 'Immutable provenance records with shareable digital certificates for insurance and resale.',
    },
    {
      icon: Lock,
      title: 'Secure Vault',
      description: 'Military-grade encryption and multi-tenant data isolation to protect your valuable assets.',
    },
    {
      icon: TrendingUp,
      title: 'Value Protection',
      description: 'Maintain and enhance resale value with verified provenance documentation.',
    },
    {
      icon: Users,
      title: 'Multi-Party Access',
      description: 'Share provenance data securely with buyers, insurers, lenders, and auction houses.',
    },
    {
      icon: Sparkles,
      title: 'Ongoing Monitoring',
      description: 'Continuous tracking and updates to your asset provenance throughout ownership lifecycle.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-amber-50 px-6 py-24 sm:py-32 lg:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-7xl"
        >
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl font-serif leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
                Build Verifiable Provenance for Your{' '}
                <span className="text-blue-900">Luxury Assets</span>
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-gray-600 max-w-2xl">
                Authenticate, document, and protect watches, handbags, jewelry, art, and collectibles with AI-powered analysis and blockchain-grade digital certificates.
              </p>
              <div className="mt-10 flex items-center gap-x-6 flex-wrap">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-blue-900 hover:bg-blue-800 text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105">
                    Start Building for Free
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-2 hover:bg-gray-50 transition-all duration-200">
                    View Pricing
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-500">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src="/hero-luxury-vault.jpg"
                  alt="Luxury watch vault showcasing high-end timepieces and provenance management"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
              Everything you need to protect your luxury investments
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Comprehensive provenance management powered by artificial intelligence.
            </p>
          </motion.div>
          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative rounded-2xl bg-gray-50 p-8 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-900 mb-6">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-semibold text-gray-900 mb-4">
              Trusted by the Luxury Asset Community
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join 2,500+ collectors, 180+ dealers, and 40+ industry partners protecting over $500M in luxury assets.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12 mt-16">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-900 mb-2">15,000+</div>
              <div className="text-sm text-gray-600 text-center">Assets Authenticated</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-900 mb-2">$500M+</div>
              <div className="text-sm text-gray-600 text-center">Total Asset Value</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-900 mb-2">99.7%</div>
              <div className="text-sm text-gray-600 text-center">Authentication Accuracy</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-900 mb-2">24/7</div>
              <div className="text-sm text-gray-600 text-center">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="bg-gradient-to-br from-blue-900 to-blue-800 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-7xl px-6 lg:px-8 text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Start Building Your Provenance Record Today
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-blue-100">
            Join collectors, dealers, and partners who trust Genesis Provenance to protect over $500M in luxury assets.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105">
                Get Started Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-900 transition-all duration-200">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            14-day free trial • No credit card required • Start in minutes
          </p>
        </motion.div>
      </section>
    </div>
  );
}
