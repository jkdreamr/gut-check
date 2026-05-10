import { PlayCircle, UploadCloud } from 'lucide-react';

interface HeroVideoStageProps {
  videoSrc?: string;
  posterSrc?: string;
}

export function HeroVideoStage({
  videoSrc,
  posterSrc,
}: HeroVideoStageProps) {
  const resolvedVideo = videoSrc?.trim();

  return (
    <div className="panel-elevated relative overflow-hidden p-3">
      <div className="hairline-grid absolute inset-0 opacity-50" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
        {resolvedVideo ? (
          // The landing hero stays video-ready: later you can upload an MP4 and set NEXT_PUBLIC_MARKETING_VIDEO_URL.
          <video
            className="aspect-[16/10] w-full object-cover"
            controls
            playsInline
            preload="metadata"
            poster={posterSrc}
          >
            <source src={resolvedVideo} />
          </video>
        ) : (
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[radial-gradient(circle_at_25%_20%,rgba(126,231,255,0.18),transparent_28%),radial-gradient(circle_at_75%_35%,rgba(154,132,255,0.18),transparent_30%),linear-gradient(135deg,rgba(8,18,34,0.98),rgba(18,31,53,0.94))]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_45%,rgba(255,255,255,0.04)_100%)]" />
            <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
              <div className="mb-5 flex size-16 items-center justify-center rounded-full border border-white/[0.15] bg-white/10 text-cyan-200 shadow-[0_0_40px_rgba(126,231,255,0.16)]">
                <PlayCircle className="size-8" />
              </div>
              <p className="font-display text-3xl tracking-tight text-white sm:text-4xl">
                Drop your ad video here later
              </p>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Upload a video into `public/marketing` and point `NEXT_PUBLIC_MARKETING_VIDEO_URL` at it. This frame is already sized for a centerpiece hero cut.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                <UploadCloud className="size-4" />
                Video-ready slot
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
