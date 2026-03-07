"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  title?: string;
  faqs?: FAQItem[];
}

const defaultFAQs: FAQItem[] = [
  {
    question: "Is Screenshot Studio really free?",
    answer:
      "Yes. Screenshot Studio is 100% free with no hidden costs. Unlimited exports, all features, no watermarks. No signup required.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. Just open the editor and start creating. Your work saves automatically in your browser with unlimited undo/redo.",
  },
  {
    question: "What frames and styles are available?",
    answer:
      "macOS and Windows browser frames, Arc-style rounded frames, Polaroid borders, 3D perspective transforms, and customizable shadows with blur, spread, and color controls.",
  },
  {
    question: "What export formats are supported?",
    answer:
      "PNG (with transparency) or JPG. Export up to 5x resolution for crisp, high-quality output on any platform.",
  },
  {
    question: "Which aspect ratios can I use?",
    answer:
      "Instagram (1:1, 4:5, 9:16), YouTube (16:9), Twitter, LinkedIn, Open Graph, and standard photo ratios—all optimized for their platforms.",
  },
  {
    question: "What file types can I upload?",
    answer:
      "PNG, JPG, JPEG, or WEBP up to 100MB. All processing happens locally in your browser—fast and completely private.",
  },
  {
    question: "Can I add text and overlays?",
    answer:
      "Yes. Add multiple text layers with custom fonts, sizes, colors, and shadows. Plus decorative overlays like arrows and icons.",
  },
  {
    question: "Can I create tweet screenshots or code snippets?",
    answer:
      "Yes. Paste any tweet URL to capture it as a high-res screenshot with light or dark theme. The code snippet generator supports 20+ syntax themes, 20 languages, and 10 mono fonts — perfect for sharing code on social media.",
  },
  {
    question: "Is my data stored on your servers?",
    answer:
      "No. Screenshot Studio runs entirely in your browser. Your images never leave your device unless you export them yourself.",
  },
];

export function FAQ({
  title = "Questions",
  faqs = defaultFAQs,
}: FAQProps) {
  return (
    <section className="py-16 sm:py-24 px-6 bg-background">
      <div className="max-w-[520px] mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12 tracking-tight">
          {title}
        </h2>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-border/40"
            >
              <AccordionTrigger className="text-left text-base font-medium py-5 hover:no-underline hover:text-primary transition-colors gap-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5 text-sm">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
