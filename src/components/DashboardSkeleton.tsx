/** Mirrors DashboardView's layout, and has to be edited alongside it. */
/** `i` staggers the sweep down the page. */
function Block({
  className = "",
  style,
  i = 0,
}: {
  className?: string;
  style?: React.CSSProperties;
  i?: number;
}) {
  return <div className={`shimmer ${className}`} style={{ ...style, "--sk": i } as React.CSSProperties} />;
}

function Panel({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`sk-panel min-w-0 ${className}`}>{children}</div>;
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Block className="h-7 w-36 rounded-lg" />
        <div className="ml-auto">
          <Block className="h-9 w-44 rounded-[10px]" />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        {/* Card rail */}
        <div className="mx-auto w-full max-w-[360px] lg:mx-0 lg:max-w-none">
          <Panel className="p-4">
            <Block className="h-4 w-20 rounded" />
            <Block className="mt-3 w-full rounded-2xl" style={{ aspectRatio: "1.5858" }} />
            <Block className="mx-auto mt-4 h-3 w-40 rounded" />
            <div className="mt-3 flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Block key={i} className="h-[26px] flex-1 rounded-md" i={i} />
              ))}
            </div>
            <Block className="mt-3 h-8 w-full rounded-lg" />
            <div className="mt-3 space-y-1.5">
              {[0, 1, 2, 3].map((i) => (
                <Block key={i} className="h-[52px] w-full rounded-lg" i={i} />
              ))}
            </div>
            <Block className="mx-auto mt-4 h-3 w-48 rounded" />
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="sk-panel stat-strip is-bare">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-cell">
                <Block className="h-3 w-20 rounded" i={i} />
                <Block className="mt-2 h-6 w-24 rounded" i={i} />
                {i === 4 && <Block className="mt-1.5 h-2.5 w-28 rounded" i={i} />}
              </div>
            ))}
          </div>

          {/* Bills */}
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Block className="h-4 w-12 rounded" />
              <Block className="h-3 w-40 rounded" />
              <Block className="ml-auto h-6 w-24 rounded-md" />
            </div>
            <div className="mt-3 flex items-center gap-3.5">
              <Block className="h-[72px] w-[72px] shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Block className="h-4 w-44 rounded" />
                <Block className="mt-2 h-3 w-56 rounded" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {[0, 1].map((i) => (
                <Block key={i} className="h-[42px] w-full rounded-lg" i={i} />
              ))}
            </div>
          </Panel>

          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel className="p-5">
              <Block className="h-4 w-28 rounded" />
              <div className="mt-4 space-y-3.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <Block className="h-3 w-40 rounded" i={i} />
                    <Block className="mt-1.5 h-1.5 w-full rounded-full" i={i} />
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <Block className="h-4 w-28 rounded" />
              <Block className="mx-auto mt-5 h-[188px] w-[188px] rounded-full" />
              <div className="mt-5 space-y-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <Block key={i} className="h-3 w-full rounded" i={i} />
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="p-5">
            <div className="flex items-baseline justify-between gap-2">
              <Block className="h-4 w-28 rounded" />
              <Block className="h-3 w-32 rounded" />
            </div>
            <Block className="mt-4 h-4 w-44 rounded" />
            <div className="mt-3 space-y-2.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Block key={i} className="h-3.5 w-full rounded" i={i} />
              ))}
            </div>
            <Block className="mt-3 h-3 w-56 rounded" />
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <Block className="h-4 w-32 rounded" />
              <Block className="h-3 w-44 rounded" />
            </div>
            <div className="mt-4 space-y-2.5">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Block key={i} className="h-8 w-full rounded" i={i} />
              ))}
            </div>
            <Block className="mt-3 h-3 w-48 rounded" />
          </Panel>

          <Panel className="p-5">
            <Block className="h-4 w-20 rounded" />
            <Block className="mt-4 h-[260px] w-full rounded-xl" />
          </Panel>

          <div className="section-rule" aria-hidden>
            <span>
              <Block className="h-3 w-20 rounded" />
            </span>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel className="p-5">
              <div className="flex items-center justify-between gap-2">
                <Block className="h-4 w-24 rounded" />
                <Block className="h-6 w-28 rounded-lg" />
              </div>
              <Block className="mt-4 h-[240px] w-full rounded-lg" />
            </Panel>
            <Panel className="p-5">
              <Block className="h-4 w-24 rounded" />
              <Block className="mt-2 h-6 w-32 rounded" />
              <Block className="mt-1.5 h-3 w-52 rounded" />
              <div className="mt-3.5 space-y-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Block key={i} className="h-[46px] w-full rounded-[10px]" i={i} />
                ))}
              </div>
            </Panel>
            <Panel className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Block className="h-4 w-52 rounded" />
                <Block className="h-7 w-80 max-w-full rounded-lg" />
              </div>
              <Block className="mt-4 h-[260px] w-full rounded-lg" />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <Block key={i} className="h-[24px] w-[92px] rounded-full" i={i} />
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
