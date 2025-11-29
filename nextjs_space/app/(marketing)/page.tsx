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
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
                AI-Powered Provenance Vault for{' '}
                <span className="text-blue-900">Luxury Assets</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Verifiable authenticity and provenance for watches, handbags, jewelry, art, and collectibles. Protect your investment with AI-powered authentication and digital certificates.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link href="/contact">
                  <Button size="lg" className="bg-blue-900 hover:bg-blue-800 text-lg px-8">
                    Request Access
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="outline" size="lg" className="text-lg px-8">
                    Learn More
                  </Button>
                </Link>
              </div>
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
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">
              Trusted by collectors, dealers, and industry partners
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join the growing community of luxury asset owners who trust Genesis Provenance for authentication and provenance management.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="bg-blue-900 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-7xl px-6 lg:px-8 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Ready to protect your luxury assets?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
            Request access to Genesis Provenance and start building verifiable provenance for your collection.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Request Access
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
