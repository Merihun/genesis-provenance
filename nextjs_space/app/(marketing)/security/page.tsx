'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Lock, Shield, Database, Eye, FileCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function SecurityPage() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All data is encrypted both at rest and in transit using AES-256 encryption and TLS 1.3 protocols.',
    },
    {
      icon: Database,
      title: 'Multi-Tenant Isolation',
      description: 'Complete data isolation between organizations with database-level partitioning and access controls.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access Control',
      description: 'Granular permissions system ensuring users only access data appropriate to their role and organization.',
    },
    {
      icon: Eye,
      title: 'Comprehensive Audit Logs',
      description: 'Every action is logged with immutable audit trails for compliance and forensic analysis.',
    },
    {
      icon: FileCheck,
      title: 'SOC 2 Compliance Ready',
      description: 'Infrastructure and processes designed to meet SOC 2 Type II requirements for security and availability.',
    },
    {
      icon: AlertTriangle,
      title: 'Continuous Monitoring',
      description: '24/7 security monitoring with automated threat detection and incident response protocols.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-white px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Enterprise-Grade Security
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Your luxury assets deserve the highest level of protection. Genesis Provenance implements military-grade security measures to safeguard your valuable data.
          </p>
        </div>
      </section>

      {/* Security Image */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="https://www.shutterstock.com/image-vector/digital-certification-online-verification-concept-600nw-2631056847.jpg"
              alt="Digital security and certification"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section ref={ref} className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
              Comprehensive Security Measures
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Multi-layered security architecture protecting your data at every level.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="rounded-2xl bg-white p-8 shadow-lg hover:shadow-xl transition-shadow"
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
      </section>

      {/* Compliance */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
              Compliance & Standards
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built with compliance in mind from day one.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Data Privacy</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-3 text-blue-900">•</span>
                  GDPR compliant data handling and processing
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-blue-900">•</span>
                  CCPA compliance for California residents
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-blue-900">•</span>
                  Right to access, modify, and delete personal data
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-blue-900">•</span>
                  Transparent data usage policies
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-gray-50 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Infrastructure Security</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-3 text-blue-900">•</span>
                  AWS infrastructure with 99.99% uptime SLA
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-blue-900">•</span>
                  Regular security audits and penetration testing
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-blue-900">•</span>
                  Automated backups with point-in-time recovery
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-blue-900">•</span>
                  DDoS protection and threat mitigation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-900 py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Trust Genesis Provenance with Your Valuable Assets
          </h2>
          <p className="mt-6 text-lg text-blue-100">
            Enterprise-grade security designed for high-value luxury assets.
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
