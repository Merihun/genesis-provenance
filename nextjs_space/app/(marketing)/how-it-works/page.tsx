'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload, Sparkles, Shield, FileCheck, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function HowItWorksPage() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const steps = [
    {
      number: '01',
      icon: Upload,
      title: 'Register Your Asset',
      description: 'Upload photos, documents, and metadata about your luxury item—whether it\'s a vintage Rolex, rare Hermès Birkin, fine jewelry piece, classic Ferrari, or museum-quality artwork. Include brand, model, serial number, purchase details, and any existing certificates or appraisals.',
    },
    {
      number: '02',
      icon: Sparkles,
      title: 'AI Analysis',
      description: 'Our advanced AI systems analyze your images and documents, checking for authenticity markers, detecting potential red flags, and comparing against known patterns and databases.',
    },
    {
      number: '03',
      icon: Shield,
      title: 'Expert Review & Risk Scoring',
      description: 'Virtual specialist roles review the AI findings and assign a risk score (0-100). Items receive status classifications: verified, pending, flagged, or rejected based on comprehensive analysis.',
    },
    {
      number: '04',
      icon: FileCheck,
      title: 'Provenance Record & Certificate',
      description: 'A permanent, immutable provenance record is created with all documentation, analysis results, and risk assessment. You receive a shareable digital certificate for insurance, resale, or lending.',
    },
    {
      number: '05',
      icon: RefreshCw,
      title: 'Ongoing Monitoring & Transfer',
      description: 'Your provenance record is continuously maintained and can be updated with service records, ownership transfers, or new appraisals. When you sell, the provenance seamlessly transfers to the new owner.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-white px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            How Genesis Provenance Works
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            A simple, five-step process to authenticate and document your luxury assets with AI-powered verification.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section ref={ref} className="py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative flex items-start gap-8"
                >
                  {/* Connecting line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-10 top-20 bottom-0 w-0.5 bg-blue-200 -z-10" />
                  )}
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-900 text-white shadow-lg">
                      <Icon className="h-10 w-10" />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="text-sm font-semibold text-blue-900 mb-2">
                      STEP {step.number}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Start Building Your Provenance Record
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Request access to Genesis Provenance and protect your luxury investments.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-900 hover:bg-blue-800 text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
