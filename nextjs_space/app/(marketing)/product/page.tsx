'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Package, Store, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function ProductPage() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const userTypes = [
    {
      icon: Package,
      title: 'Collectors',
      description: 'Individual collectors protecting their investments',
      image: '/collector-luxury-watch.jpg',
      features: [
        'Register and document your luxury items with photos and certificates',
        'Upload purchase receipts, appraisals, and service records',
        'Generate digital certificates with verified provenance',
        'Share authentication reports with insurers, buyers, or appraisers',
        'Track ownership history and maintain value',
      ],
    },
    {
      icon: Store,
      title: 'Resellers & Dealers',
      description: 'Boutiques and dealers managing inventory',
      image: '/reseller-boutique.jpg',
      features: [
        'Streamline intake with AI-powered authenticity checks',
        'Maintain comprehensive provenance for inventory',
        'Issue "Verified by Genesis Provenance" certificates',
        'Build trust with buyers through transparent documentation',
        'Reduce authentication costs and turnaround time',
      ],
    },
    {
      icon: Briefcase,
      title: 'Partners',
      description: 'Auction houses, insurers, and lenders',
      image: '/partners-business.jpg',
      features: [
        'Access verified provenance data for underwriting decisions',
        'Use risk scores for loan valuations and insurance policies',
        'Integrate provenance APIs into existing systems',
        'Collaborate with collectors and dealers seamlessly',
        'Reduce fraud risk with AI-verified documentation',
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-white px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Built for Every Stakeholder in Luxury Assets
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Genesis Provenance serves collectors, dealers, and industry partners with tailored solutions for authentication and provenance management.
          </p>
        </div>
      </section>

      {/* User Types */}
      <section ref={ref} className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {userTypes.map((userType, index) => {
            const Icon = userType.icon;
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={userType.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`mb-24 last:mb-0 grid gap-12 lg:grid-cols-2 lg:gap-16 items-center ${
                  isEven ? '' : 'lg:grid-flow-dense'
                }`}
              >
                <div className={isEven ? '' : 'lg:col-start-2'}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-900">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
                        {userType.title}
                      </h2>
                      <p className="text-sm text-gray-600">{userType.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {userType.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <span className="mr-3 text-blue-900 text-xl">•</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`relative h-[300px] lg:h-[400px] ${isEven ? '' : 'lg:col-start-1 lg:row-start-1'}`}>
                  <div className="relative w-full h-full rounded-lg overflow-hidden shadow-xl">
                    <Image
                      src={userType.image}
                      alt={`${userType.title} using Genesis Provenance`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-900 py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Get Started with Genesis Provenance
          </h2>
          <p className="mt-6 text-lg text-blue-100">
            Request access to see how Genesis Provenance can protect your luxury assets.
          </p>
          <div className="mt-8">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Request Access
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
