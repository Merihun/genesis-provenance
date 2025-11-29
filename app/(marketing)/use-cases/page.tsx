'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, FileCheck, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function UseCasesPage() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const useCases = [
    {
      icon: Shield,
      title: 'Protecting Investment Value',
      category: 'Collectors',
      description: 'A collector purchases a vintage Rolex Daytona for $150,000. By documenting the purchase with Genesis Provenance, they create an immutable record including original box, papers, service history, and expert authentication. Years later when selling, the verified provenance increases buyer confidence and resale value.',
      benefits: [
        'Maintain complete ownership history',
        'Document service and restoration records',
        'Increase resale value with verified authenticity',
        'Simplify insurance claims and appraisals',
      ],
    },
    {
      icon: FileCheck,
      title: 'Streamlining Authentication',
      category: 'Resellers',
      description: 'A luxury consignment boutique receives 20-30 handbags monthly for authentication. Using Genesis Provenance, they upload photos and documents for AI analysis, reducing authentication time from 3 days to 2 hours. The AI flags potential concerns for human expert review, while verified items receive "Verified by Genesis Provenance" certificates that boost buyer confidence.',
      benefits: [
        'Reduce authentication turnaround time by 90%',
        'Lower costs compared to traditional expert fees',
        'Issue certificates that differentiate your inventory',
        'Build trust with buyers through transparency',
      ],
    },
    {
      icon: TrendingUp,
      title: 'Risk Assessment for Lending',
      category: 'Partners',
      description: 'An asset-based lender evaluates a $2M watch collection as collateral for a loan. Instead of hiring multiple experts for authentication, they access Genesis Provenance records with AI risk scores, ownership history, and market comparables. The lender completes underwriting in days instead of weeks, with greater confidence in collateral value.',
      benefits: [
        'Accelerate underwriting with verified data',
        'Reduce fraud risk with AI authentication',
        'Access comprehensive provenance records',
        'Make data-driven lending decisions',
      ],
    },
    {
      icon: Users,
      title: 'Insurance Underwriting',
      category: 'Partners',
      description: 'A high-net-worth individual seeks insurance for a $5M jewelry collection. Their insurer accesses Genesis Provenance records with verified appraisals, photos, and risk scores for each piece. The insurer underwrites the policy with confidence, offering competitive rates based on documented authenticity and security measures.',
      benefits: [
        'Verify authenticity before issuing policies',
        'Access detailed documentation for claims',
        'Price premiums accurately based on risk scores',
        'Reduce fraudulent claims',
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-white px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Use Cases & Solutions
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            See how Genesis Provenance solves real-world challenges for collectors, resellers, and industry partners.
          </p>
        </div>
      </section>

      {/* Use Cases */}
      <section ref={ref} className="py-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="space-y-16">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="rounded-2xl bg-gray-50 p-8 shadow-lg"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-900">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-900 mb-2">
                        {useCase.category.toUpperCase()}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
                        {useCase.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed mb-6">
                        {useCase.description}
                      </p>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Key Benefits:</h4>
                        <ul className="space-y-2">
                          {useCase.benefits.map((benefit) => (
                            <li key={benefit} className="flex items-start">
                              <span className="mr-3 text-blue-900 text-xl">•</span>
                              <span className="text-gray-700">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-900 py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            See How Genesis Provenance Can Help You
          </h2>
          <p className="mt-6 text-lg text-blue-100">
            Request a demo to explore how our platform addresses your specific needs.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Request Demo
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-900 text-lg px-8">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
