"use client";

import { cn } from "@/lib/utils";

interface VideoTestimonial {
  videoId: string;
  startTime?: number;
  endTime?: number;
  title?: string;
  author?: string;
}

interface VideoTestimonialsProps {
  testimonials: VideoTestimonial[];
  title?: string;
}

function VideoTestimonialCard({
  videoId,
  startTime,
  endTime,
  title,
  author,
}: VideoTestimonial) {
  const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
  if (startTime) embedUrl.searchParams.set("start", startTime.toString());
  if (endTime) embedUrl.searchParams.set("end", endTime.toString());
  embedUrl.searchParams.set("rel", "0");

  const videoTitle = title || "Screenshot Studio testimonial";

  return (
    <article className="space-y-3">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted/30 border border-border/30">
        <iframe
          width="100%"
          height="100%"
          src={embedUrl.toString()}
          title={videoTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0"
          loading="lazy"
        />
      </div>
      {(title || author) && (
        <div className="px-0.5">
          {title && (
            <h3 className="font-medium text-sm text-foreground">{title}</h3>
          )}
          {author && (
            <p className="text-xs text-muted-foreground">{author}</p>
          )}
        </div>
      )}
    </article>
  );
}

export function VideoTestimonials({
  testimonials,
  title,
}: VideoTestimonialsProps) {
  if (!testimonials || testimonials.length === 0) return null;

  const count = testimonials.length;

  return (
    <section className="py-16 sm:py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center mb-12 tracking-tight">
            {title}
          </h2>
        )}

        <div
          className={cn(
            "grid gap-6",
            count === 1 && "grid-cols-1 max-w-3xl mx-auto",
            count === 2 && "grid-cols-1 md:grid-cols-2",
            count === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            count >= 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {testimonials.map((testimonial, index) => (
            <VideoTestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
