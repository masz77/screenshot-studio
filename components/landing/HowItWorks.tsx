import { useId } from "react";

interface Step {
  step: number;
  title: string;
  description: string;
}

interface HowItWorksProps {
  steps: Step[];
  title?: string;
}

export function HowItWorks({
  steps,
  title = "How It Works",
}: HowItWorksProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="py-16 sm:py-24 px-6 bg-background"
    >
      <div className="max-w-4xl mx-auto">
        <h2
          id={titleId}
          className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center mb-16 tracking-tight"
        >
          {title}
        </h2>

        <div className="grid md:grid-cols-3 gap-12 md:gap-10">
          {steps.map((step) => (
            <div key={step.step} className="text-center md:text-left">
              <span className="inline-block text-5xl font-bold text-primary/20 mb-4 leading-none">
                {step.step}
              </span>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
