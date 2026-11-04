import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRICING_PLANS } from '../data/toolsData';
import { Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PricingSection: React.FC = () => {
  const { user, upgradePlan, showToast } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const handleSelectPlan = (planId: 'free' | 'pro' | 'business') => {
    if (user?.plan === planId) {
      showToast(`You are currently on the ${planId.toUpperCase()} plan.`, 'info');
      return;
    }
    upgradePlan(planId);
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Transparent, Scalable Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Simple Plans for Every Workflow
          </h2>

          <p className="text-sm text-slate-600">
            Start completely free or upgrade for unlimited high-speed operations, OCR, and team capabilities.
          </p>

          {/* Billing Toggle */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Yearly Billing</span>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                  Save 28%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {PRICING_PLANS.map((plan) => {
            const isCurrent = user?.plan === plan.id;
            const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const isPro = plan.id === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 ${
                  isPro
                    ? 'bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500'
                    : 'bg-white border border-slate-200/90 shadow-sm hover:border-slate-300'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-purple-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {plan.id === 'free'
                        ? 'For casual users needing quick edits'
                        : plan.id === 'pro'
                        ? 'For power users & freelancers'
                        : 'For corporate teams & enterprises'}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-slate-900 font-mono">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {plan.priceMonthly === 0
                        ? '/forever'
                        : billingCycle === 'yearly'
                        ? '/year'
                        : '/month'}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">Plan Highlights:</p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-500 cursor-default'
                        : isPro
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : `Choose ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
