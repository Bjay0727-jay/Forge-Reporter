/**
 * ForgeComply 360 Reporter - Error Boundary Component
 * Catches rendering errors and displays a fallback UI
 */
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { C } from '../config/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error details
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            background: '#FEF2F2',
            borderRadius: 12,
            border: '1px solid #FCA5A5',
            margin: 24,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#DC2626',
              marginBottom: 8,
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: 14,
              color: '#7F1D1D',
              marginBottom: 16,
              maxWidth: 500,
              margin: '0 auto 16px',
            }}
          >
            This section encountered an error and couldn't be displayed.
            Your data is safe and saved locally.
          </p>
          {this.state.error && (
            <details
              style={{
                textAlign: 'left',
                background: '#FFFFFF',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                maxWidth: 600,
                margin: '0 auto 16px',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: '#991B1B',
                  marginBottom: 8,
                }}
              >
                Error Details
              </summary>
              <pre
                style={{
                  fontSize: 12,
                  color: '#7F1D1D',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  padding: 12,
                  background: '#FEE2E2',
                  borderRadius: 4,
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                background: C.accent,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#E5E7EB',
                color: '#374151',
                border: 'none',
                borderRadius: 8,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Section-specific error boundary with section name context
 */
interface SectionErrorBoundaryProps {
  sectionName: string;
  children: ReactNode;
}

export function SectionErrorBoundary({
  sectionName,
  children,
}: SectionErrorBoundaryProps): ReactNode {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error(`[Section: ${sectionName}] Error:`, error);
      }}
      fallback={
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            background: '#FFFBEB',
            borderRadius: 12,
            border: '1px solid #FCD34D',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#92400E',
              marginBottom: 8,
            }}
          >
            Unable to load "{sectionName}"
          </h3>
          <p
            style={{
              fontSize: 13,
              color: '#A16207',
              marginBottom: 16,
            }}
          >
            Please try navigating to a different section and returning.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
