'use client';

import * as React from 'react';
import { ArrowDown01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { useDisclosureStore } from '@/lib/store/disclosure-store';

interface SectionWrapperProps {
  /** Stable identifier used for localStorage-backed open/closed persistence. Required. */
  sectionId: string;
  title: string;
  children: React.ReactNode;
  /** Optional secondary disclosure; shown collapsed inside the open section. */
  advancedContent?: React.ReactNode;
  /** Fallback section-open state when no persisted value exists. */
  defaultOpen?: boolean;
  /** Fallback advanced-open state when no persisted value exists. Defaults to `false`. */
  defaultAdvancedOpen?: boolean;
  className?: string;
  action?: React.ReactNode;
}

export function SectionWrapper({
  sectionId,
  title,
  children,
  advancedContent,
  defaultOpen = true,
  defaultAdvancedOpen = false,
  className,
  action,
}: SectionWrapperProps) {
  const open = useDisclosureStore(
    (s) => s.sections[sectionId]?.open ?? defaultOpen
  );
  const advancedOpen = useDisclosureStore(
    (s) => s.sections[sectionId]?.advancedOpen ?? defaultAdvancedOpen
  );

  const toggleOpen = React.useCallback(() => {
    useDisclosureStore.getState().setOpen(sectionId, !open);
  }, [sectionId, open]);
  const toggleAdvanced = React.useCallback(() => {
    useDisclosureStore.getState().setAdvancedOpen(sectionId, !advancedOpen);
  }, [sectionId, advancedOpen]);

  return (
    <div className={cn('mb-1', className)}>
      <div className="w-full flex items-center justify-between gap-2 py-3 px-2 hover:bg-card/30 rounded-lg transition-colors group">
        <button
          type="button"
          onClick={toggleOpen}
          className="flex items-center gap-2 flex-1"
        >
          <ArrowDown01Icon
            size={16}
            className={cn(
              'text-muted-foreground transition-transform duration-200',
              !open && '-rotate-90'
            )}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
            {title}
          </span>
        </button>
        {action && <div>{action}</div>}
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          open ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-2 pb-4 space-y-4">
          {children}

          {advancedContent && (
            <div className="pt-2 border-t border-border/30">
              <button
                type="button"
                onClick={toggleAdvanced}
                className="w-full flex items-center gap-2 py-1.5 px-1 rounded-md hover:bg-card/30 transition-colors group"
                aria-expanded={advancedOpen}
              >
                <ArrowDown01Icon
                  size={14}
                  className={cn(
                    'text-muted-foreground/80 transition-transform duration-200',
                    !advancedOpen && '-rotate-90'
                  )}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 group-hover:text-foreground">
                  Advanced
                </span>
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  advancedOpen ? 'max-h-[2000px] opacity-100 pt-2' : 'max-h-0 opacity-0'
                )}
              >
                <div className="space-y-4 pl-1">{advancedContent}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
