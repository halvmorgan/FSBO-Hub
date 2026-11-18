import React from 'react';

export const STRIPE_CHECKOUT_NOTICE_TEXT =
  'Secure checkout by Stripe. Your purchase will appear as "Ecentury Appraisal Services" on checkout and your billing statement. Ecentury Appraisal Services is the company behind FSBO Compass.';

export const BILLING_STATEMENT_SENTENCE =
  'FSBO Compass is provided by Ecentury Appraisal Services. This is the name that will appear on your billing statement.';

interface StripeBillingNoticeProps {
  className?: string;
}

export const StripeBillingNotice: React.FC<StripeBillingNoticeProps> = ({ className = '' }) => {
  return (
    <p className={`text-[11px] leading-relaxed text-stone-500 dark:text-stone-400 ${className}`}>
      {STRIPE_CHECKOUT_NOTICE_TEXT}
    </p>
  );
};
