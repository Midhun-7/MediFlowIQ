import React from 'react';
import { Link } from 'react-router-dom';

export interface EmptyStateProps {
  msg?: string;
  title?: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  msg,
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
  compact = false,
  className = '',
}) => {
  const text = (msg || title || description || '').toLowerCase();

  // Resolve appropriate icon if not explicitly provided
  const resolvedIcon =
    icon ||
    (text.includes('medical') || text.includes('record') || text.includes('history')
      ? '📋'
      : text.includes('prescription')
        ? '💊'
        : text.includes('appointment') || text.includes('booking')
          ? '📅'
          : text.includes('condition')
            ? '🩺'
            : text.includes('notification')
              ? '🔔'
              : '📭');

  // Resolve title
  const resolvedTitle =
    title ||
    (text.includes('medical record') || text.includes('records')
      ? 'No Medical Records Found'
      : text.includes('prescription')
        ? 'No Prescriptions Found'
        : text.includes('appointment')
          ? 'No Appointments Found'
          : text.includes('condition')
            ? 'No Active Conditions on Record'
            : text.includes('notification')
              ? 'No Notifications Yet'
              : msg || 'No Data Available');

  // Resolve description
  const resolvedDescription =
    description ||
    (text.includes('medical record') || text.includes('records')
      ? 'Your clinical visits, laboratory test results, and physician notes will appear here once recorded by your attending healthcare provider.'
      : text.includes('prescription')
        ? 'Your active digital prescriptions, dosages, and refill history will appear here automatically once issued by your doctor.'
        : text.includes('appointment') || text.includes('book one')
          ? 'You currently have no scheduled appointments. Browse verified specialists and book your consultation in a few clicks.'
          : text.includes('condition')
            ? 'There are no active chronic illnesses or ongoing medical conditions recorded for your profile.'
            : text.includes('notification')
              ? 'Real-time hospital alerts, appointment status changes, and clinical updates will appear here.'
              : msg || '');

  // Intelligent action button defaults for appointments
  const resolvedActionHref =
    actionHref ||
    (text.includes('book') || text.includes('appointment') ? '/patient/find-doctor' : undefined);
  const resolvedActionLabel =
    actionLabel || (resolvedActionHref === '/patient/find-doctor' ? '🔍 Find Doctors & Book' : undefined);

  if (compact) {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-6 text-slate-500 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 flex items-center justify-center text-xl mb-2.5 shadow-sm shadow-sky-500/10">
          {resolvedIcon}
        </div>
        <div className="font-bold text-sm text-slate-800 mb-1">
          {resolvedTitle}
        </div>
        <div className="text-xs text-slate-400 max-w-xs leading-relaxed">
          {resolvedDescription}
        </div>
      </div>
    );
  }

  // Full-size, centered empty state container — positioned in natural lower-middle eyeline
  return (
    <div className="flex-1 w-full min-h-[calc(100vh-220px)] flex items-center justify-center p-4 pt-10 pb-20">
      <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 md:p-14 bg-white rounded-3xl border border-slate-200/90 shadow-sm max-w-xl w-full mt-4 ${className}`}>
        {/* Glow Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-50 to-sky-100 border-2 border-sky-200 flex items-center justify-center text-4xl mb-6 shadow-md shadow-sky-500/15">
          {resolvedIcon}
        </div>

        {/* Heading */}
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
          {resolvedTitle}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-500 max-w-md leading-relaxed mb-6">
          {resolvedDescription}
        </p>

        {/* Action Button or Info Badge */}
        {resolvedActionHref && resolvedActionLabel ? (
          <Link
            to={resolvedActionHref}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold rounded-xl px-6 py-3 text-sm shadow-md shadow-sky-500/25 transition-all"
          >
            {resolvedActionLabel}
          </Link>
        ) : onAction && actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold rounded-xl px-6 py-3 text-sm shadow-md shadow-sky-500/25 transition-all"
          >
            {actionLabel}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-500 font-medium">
            ℹ️ Real-time updates sync automatically when updated by your doctor
          </div>
        )}
      </div>
    </div>
  );
};
