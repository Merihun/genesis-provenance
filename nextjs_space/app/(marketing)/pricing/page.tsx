'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, X, Zap, Shield, Building2, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function PricingPage() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const plans = [
    {
      name: 'Collector',
      description: 'Perfect for individual collectors',
      icon: Crown,
      price: {
        monthly: 19,
        annual: 199,
      },
      features: [
        { name: 'Up to 25 luxury assets', included: true },
        { name: 'Unlimited photo uploads', included: true },
        { name: 'Unlimited document storage', included: true },
        { name: 'AI-powered authentication', included: true },
        { name: 'Digital provenance certificates', included: true },
        { name: 'Shareable asset links', included: true },
        { name: 'Email support (48hr response)', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'API access', included: false },
        { name: 'Bulk import', included: false },
        { name: 'White-label certificates', included: false },
        { name: 'Dedicated account manager', included: false },
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Dealer',
      description: 'For resellers and boutiques',
      icon: Building2,
      price: {
        monthly: 99,
        annual: 999,
      },
      features: [
        { name: 'Up to 200 luxury assets', included: true },
        { name: 'Everything in Collector', included: true },
        { name: '"Verified by Genesis" badges', included: true },
        { name: 'Bulk import/export (CSV)', included: true },
        { name: 'API access (1,000 calls/mo)', included: true },
        { name: 'Multi-user access (up to 5)', included: true },
        { name: 'Priority email support (24hr)', included: true },
        { name: 'Custom branding', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Export reports (PDF/CSV)', included: true },
        { name: 'White-label certificates', included: false },
        { name: 'Dedicated account manager', included: false },
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      description: 'For partners and organizations',
      icon: Shield,
      price: {
        monthly: 499,
        annual: 'Custom',
      },
      features: [
        { name: 'Unlimited assets', included: true },
        { name: 'Everything in Dealer', included: true },
        { name: 'Unlimited API calls', included: true },
        { name: 'Unlimited users', included: true },
        { name: 'White-label certificates', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Priority phone support (2hr)', included: true },
        { name: 'SLA guarantees (99.9% uptime)', included: true },
        { name: 'Custom training', included: true },
        { name: 'On-premise deployment option', included: true },
        { name: 'Legal compliance support', included: true },
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  const faqs = [
    {
      question: 'What happens after my free trial ends?',
      answer: 'After your 14-day free trial, you\'ll be prompted to choose a paid plan. Your data remains safe and accessible, but you won\'t be able to add new assets until you subscribe. No credit card required to start the trial.',
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes, you can change your plan at any time. When upgrading, you\'ll have immediate access to new features. When downgrading, changes take effect at the end of your current billing cycle, and you\'ll retain access to premium features until then.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, Amex), debit cards, and ACH bank transfers for annual plans. All payments are processed securely through Stripe.',
    },
    {
      question: 'Is there a discount for annual billing?',
      answer: 'Yes! Annual billing saves you approximately 15-16% compared to monthly billing. For example, the Collector plan is $199/year (equivalent to $16.58/month) vs. $19/month.',
    },
    {
      question: 'What if I exceed my asset limit?',
      answer: 'You\'ll receive a notification when you reach 80% of your limit. You can then upgrade to a higher tier, or for Dealer plans, purchase additional asset packs at $0.50/asset/month. Enterprise plans have no limits.',
    },
    {
      question: 'Can I cancel at any time?',
      answer: 'Absolutely. You can cancel your subscription anytime from your account settings. You\'ll retain access until the end of your current billing period. We don\'t offer refunds for partial months, but there are no cancellation fees.',
    },
    {
      question: 'Do you offer custom pricing for large organizations?',
      answer: 'Yes. If you need more than 200 assets or have specific requirements, contact our sales team for custom Enterprise pricing. We offer volume discounts, custom integrations, and flexible contracts.',
    },
    {
      question: 'Is my data secure and backed up?',
      answer: 'Yes. All data is encrypted at rest and in transit (AES-256 + TLS 1.3), stored in SOC 2 compliant data centers, and backed up daily with 30-day retention. Enterprise plans include geo-redundant backups.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-white px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Simple, Transparent Pricing
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600">
            Choose the plan that fits your needs. Start with a 14-day free trial—no credit card required.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>No credit card needed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section ref={ref} className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative rounded-2xl p-8 shadow-lg ${
                    plan.highlighted
                      ? 'border-2 border-blue-900 bg-blue-50/50'
                      : 'border border-gray-200 bg-white'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-900 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-900">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">
                        ${plan.price.monthly}
                      </span>
                      <span className="text-gray-600 ml-2">/month</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      or ${typeof plan.price.annual === 'number' ? plan.price.annual : plan.price.annual}/year
                      {typeof plan.price.annual === 'number' && (
                        <span className="text-green-600 font-semibold"> (save 15%)</span>
                      )}
                    </p>
                  </div>
                  <Link href="/auth/signup">
                    <Button
                      className={`w-full mb-6 ${
                        plan.highlighted
                          ? 'bg-blue-900 hover:bg-blue-800 shadow-lg'
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-start">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-6">
              All plans include SSL encryption, daily backups, and fraud protection.
            </p>
            <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-900" />
                <span>Instant activation</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-900" />
                <span>SOC 2 compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-blue-900" />
                <span>GDPR & CCPA ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((faq) => (
              <div key={faq.question} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-800 py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Ready to Get Started?
          </h2>
          <p className="mt-6 text-xl text-blue-100">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-10 py-6 shadow-xl">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-900 transition-all"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            Questions? Email us at <a href="mailto:sales@genesisprovenance.com" className="underline">sales@genesisprovenance.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
