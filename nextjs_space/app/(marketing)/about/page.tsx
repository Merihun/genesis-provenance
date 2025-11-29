'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, Lightbulb, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function AboutPage() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'We exist to bring transparency and trust to the luxury asset market through technology.',
    },
    {
      icon: Lightbulb,
      title: 'Innovation First',
      description: 'Leveraging cutting-edge AI and blockchain technology to solve authentication challenges.',
    },
    {
      icon: Users,
      title: 'Customer-Centric',
      description: 'Built in partnership with collectors, dealers, and industry experts who understand the market.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-white px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            About Genesis Provenance
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Building the future of luxury asset authentication and provenance management.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Our Story
          </h2>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              Genesis Provenance was founded to address a critical challenge in the luxury asset market: the lack of verifiable, portable provenance. Whether it's a vintage Rolex, a Hermès Birkin, or a piece of fine art, high-value assets deserve comprehensive documentation that travels with them throughout their lifecycle.
            </p>
            <p>
              Traditional authentication methods are expensive, time-consuming, and fragmented. Collectors maintain paper documents that can be lost or forged. Dealers spend significant resources on expert authentication. Insurers and lenders struggle to verify authenticity and assess risk.
            </p>
            <p>
              We're changing that by combining artificial intelligence, digital certificates, and secure cloud infrastructure to create permanent, verifiable provenance records. Our platform serves every stakeholder in the luxury asset ecosystem—from individual collectors to major auction houses.
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
                Our Vision
              </h3>
              <p className="text-gray-700 leading-relaxed">
                To become the global standard for luxury asset provenance, creating a trusted ecosystem where authenticity is verifiable, provenance is portable, and value is protected.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
                Our Mission
              </h3>
              <p className="text-gray-700 leading-relaxed">
                To leverage AI and technology to make luxury asset authentication accessible, affordable, and reliable for collectors, dealers, and industry partners worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section ref={ref} className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
              Our Values
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="rounded-2xl bg-gray-50 p-8 text-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-900 mx-auto mb-6">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Placeholder */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
              Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're a team of technologists, luxury market experts, and authentication specialists dedicated to building the future of provenance management.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-900 py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Join Us in Building the Future
          </h2>
          <p className="mt-6 text-lg text-blue-100">
            Request access to Genesis Provenance and be part of the authentication revolution.
          </p>
          <div className="mt-8">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
