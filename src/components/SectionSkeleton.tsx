/**
 * Skeleton loader shown during section lazy-load transitions.
 * Mimics the visual structure of a form section: header bar + input fields.
 */
const SkeletonBar: React.FC<{ width?: string; height?: number; className?: string }> = ({
  width = '100%',
  height = 16,
  className = '',
}) => (
  <div
    className={`animate-pulse ${className}`}
    style={{
      width,
      height,
      borderRadius: 6,
      background: 'var(--border)',
    }}
  />
);

export const SectionSkeleton: React.FC = () => (
  <div style={{ maxWidth: 940, margin: '0 auto' }}>
    {/* Section header skeleton */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
      <div
        className="animate-pulse"
        style={{ width: 5, height: 28, borderRadius: 2, background: 'var(--border)' }}
      />
      <SkeletonBar width="260px" height={22} />
    </div>

    {/* Card skeleton */}
    <div style={{
      background: 'var(--surface)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Accent bar */}
      <div className="animate-pulse" style={{ height: 6, background: 'var(--border)' }} />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Title */}
        <SkeletonBar width="180px" height={18} />

        {/* 2-column grid of fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonBar width="100px" height={12} />
              <SkeletonBar height={38} />
            </div>
          ))}
        </div>

        {/* Full-width textarea field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SkeletonBar width="140px" height={12} />
          <SkeletonBar height={96} />
        </div>
      </div>
    </div>

    {/* Second card skeleton (shorter) */}
    <div style={{
      background: 'var(--surface)',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div className="animate-pulse" style={{ height: 6, background: 'var(--border)' }} />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SkeletonBar width="200px" height={18} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonBar width="90px" height={12} />
              <SkeletonBar height={38} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
