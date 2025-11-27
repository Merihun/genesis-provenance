'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function PricingPage() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const plans = [
    {
      name: 'Collector',
      description: 'For individual collectors',
      price: 'Custom',
      priceSubtext: 'Per item or annual subscription',
      features: [
        'Register unlimited luxury items',
        'AI-powered authentication',
        'Digital provenance certificates',
        'Secure document storage',
        'Share with insurers and buyers',
        'Mobile app access',
        'Email support',
      ],
      cta: 'Request Access',
      highlighted: false,
    },
    {
      name: 'Reseller',
      description: 'For dealers and boutiques',
      price: 'Custom',
      priceSubtext: 'Based on inventory volume',
      features: [
        'Everything in Collector, plus:',
        'Bulk inventory management',
        'Team member access',
        'Custom branding on certificates',
        'API integration',
        'Priority authentication queue',
        'Advanced analytics dashboard',
        'Dedicated account manager',
      ],
      cta: 'Request Demo',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      description: 'For auction houses, insurers, lenders',
      price: 'Custom',
      priceSubtext: 'Tailored to your needs',
      features: [
        'Everything in Reseller, plus:',
        'Full API access',
        'Custom integration support',
        'White-label options',
        'SLA guarantees',
        'Advanced security features',
        'Custom risk models',
        'Dedicated technical support',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-white px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Pricing for Every Stakeholder
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Flexible pricing designed for collectors, dealers, and industry partners. Contact us for custom pricing based on your needs.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section ref={ref} className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-blue-900 text-white shadow-2xl ring-2 ring-blue-900 scale-105'
                    : 'bg-gray-50 text-gray-900 shadow-lg'
                }`}
              >
                <h3 className="text-2xl font-bold font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {plan.name}
                </h3>
                <p className={`mt-2 text-sm ${
                  plan.highlighted ? 'text-blue-100' : 'text-gray-600'
                }`}>
                  {plan.description}
                </p>
                <div className="mt-6">
                  <p className="text-4xl font-bold">{plan.price}</p>
                  <p className={`mt-2 text-sm ${
                    plan.highlighted ? 'text-blue-100' : 'text-gray-600'
                  }`}>
                    {plan.priceSubtext}
                  </p>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        plan.highlighted ? 'text-blue-200' : 'text-blue-900'
                      }`} />
                      <span className={`text-sm ${
                        plan.highlighted ? 'text-white' : 'text-gray-700'
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/contact">
                    <Button
                      size="lg"
                      className={`w-full ${
                        plan.highlighted
                          ? 'bg-white text-blue-900 hover:bg-gray-100'
                          : 'bg-blue-900 text-white hover:bg-blue-800'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How is pricing determined?
              </h3>
              <p className="text-gray-600">
                Pricing is customized based on your specific needs, volume of items, and required features. Contact us for a personalized quote.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                We offer demos and pilots for qualified organizations. Contact our sales team to discuss trial options.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, ACH transfers, and wire transfers for enterprise customers.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-gray-600">
                Yes, you can adjust your plan at any time. Our team will work with you to ensure a smooth transition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-900 py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Ready to Get Started?
          </h2>
          <p className="mt-6 text-lg text-blue-100">
            Contact us to discuss pricing and request access to Genesis Provenance.
          </p>
          <div className="mt-8">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
