/**
 * Forge Cyber Defense - ForgeReporter Main Application
 * Standalone FISMA SSP Reporting Engine with Dark Mode
 */
import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { C, lightTheme, darkTheme, type ThemeMode, getThemeMode, setThemeMode, setCurrentMode } from './config/colors';
import { SECTIONS } from './config/sections';
import type { SSPData } from './types';
import { Sidebar, Header, Footer, ExportModal, ImportModal, SectionErrorBoundary } from './components';
import { SectionSkeleton } from './components/SectionSkeleton';
import { SECTION_RENDERERS } from './sections';
import { validateSSP, type ValidationResult } from './utils/validation';
import { generatePDF, downloadPDF } from './utils/pdfExport';
import {
  generateValidatedOscalSSP,
  downloadOscalJson,
  downloadOscalXml,
  type ValidatedOscalExportResult
} from './utils/oscalExport';
import type { OscalImportResult } from './utils/oscalImport';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import './index.css';

// Local storage key for auto-save
const STORAGE_KEY = 'forgecomply360-ssp-data';

function AppContent() {
  // Theme state
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getThemeMode());

  // Initialize theme on mount
  useEffect(() => {
    const mode = getThemeMode();
    setThemeModeState(mode);
    setCurrentMode(mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, []);

  // Toggle theme handler
  const handleToggleTheme = useCallback(() => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeModeState(newMode);
    setThemeMode(newMode);
    setCurrentMode(newMode);
  }, [themeMode]);

  // Get current theme colors
  const colors = themeMode === 'dark' ? darkTheme : lightTheme;

  // Auth and Sync hooks
  const [authState, authActions] = useAuth();
  const [syncState, syncActions] = useSync(authState.isOnlineMode);

  // Current section state — initialized from URL hash for deep linking
  const [currentSection, setCurrentSectionRaw] = useState(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#section=(.+)$/);
    if (match) {
      const sectionId = decodeURIComponent(match[1]);
      if (SECTIONS.some((s) => s.id === sectionId)) return sectionId;
    }
    return 'sysinfo';
  });

  // Wrap setCurrentSection to also update the URL hash
  const setCurrentSection = useCallback((sectionId: string) => {
    setCurrentSectionRaw(sectionId);
    window.history.pushState(null, '', `#section=${encodeURIComponent(sectionId)}`);
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#section=(.+)$/);
      if (match) {
        const sectionId = decodeURIComponent(match[1]);
        if (SECTIONS.some((s) => s.id === sectionId)) {
          setCurrentSectionRaw(sectionId);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // SSP data state
  const [data, setData] = useState<SSPData>(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // UI state
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  // Saving state is derived from whether a save timer is pending
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Validation state — initialize with actual data (not empty object)
  const [validation, setValidation] = useState<ValidationResult>(() => validateSSP(data));

  // Ref to track if we should mark dirty
  const skipDirtyRef = useRef(false);

  // Load data from server if authenticated with an SSP ID
  useEffect(() => {
    console.log('[Reporter] App: Load effect triggered', {
      isAuthenticated: authState.isAuthenticated,
      sspId: authState.sspId,
      initialLoadDone,
      isLoading: authState.isLoading
    });

    if (authState.isAuthenticated && authState.sspId && !initialLoadDone) {
      console.log('[Reporter] App: Starting server load for SSP:', authState.sspId);
      // Use ref to prevent duplicate calls instead of state
      if (skipDirtyRef.current) return;
      skipDirtyRef.current = true;

      syncActions.loadFromServer(authState.sspId).then((serverData) => {
        console.log('[Reporter] App: Server data received:', serverData);
        if (serverData) {
          setData(serverData);
          // Update validation immediately so export modal shows correct status
          setValidation(validateSSP(serverData));
          // Also save to localStorage for offline access
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
          console.log('[Reporter] App: Data loaded and saved to localStorage');
        } else {
          console.warn('[Reporter] App: No data received from server');
        }
        setInitialLoadDone(true);
      }).catch((err) => {
        console.error('[Reporter] App: Error loading from server:', err);
        skipDirtyRef.current = false;
      });
    }
  }, [authState.isAuthenticated, authState.sspId, initialLoadDone, authState.isLoading, syncActions]);

  // Set field helper
  const setField = useCallback((key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
    // Mark as dirty if online
    if (!skipDirtyRef.current && authState.isOnlineMode) {
      syncActions.markDirty();
    }
  }, [authState.isOnlineMode, syncActions]);

  // Auto-save to localStorage with debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Effect to handle debounced auto-save
  useEffect(() => {
    if (Object.keys(data).length === 0) return;

    // Mark as pending when data changes
    setSaveStatus('pending');

    // Clear any pending save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Schedule save after debounce delay
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setLastSaved(new Date());
        setSaveStatus('saved');
        setValidation(validateSSP(data));
      } catch (e) {
        console.error('Failed to save:', e);
        setSaveStatus('idle');
      }
    }, 800);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [data]);

  // Auto-sync to server with 5s debounce (only in online mode after initial load)
  const serverSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [conflictData, setConflictData] = useState<{ server: SSPData; local: SSPData } | null>(null);

  useEffect(() => {
    if (!authState.isOnlineMode || !syncState.sspId || !initialLoadDone) return;
    if (Object.keys(data).length === 0 || !syncState.pendingChanges) return;

    // Clear any pending server sync
    if (serverSyncTimerRef.current) {
      clearTimeout(serverSyncTimerRef.current);
    }

    // Schedule server sync after 5s debounce
    serverSyncTimerRef.current = setTimeout(async () => {
      const sspId = syncState.sspId;
      if (!sspId) return;

      try {
        // Conflict detection: fetch server version and compare timestamps
        const serverRes = await syncActions.loadFromServer(sspId);
        if (serverRes && syncState.lastSyncedAt) {
          // Compare key identity fields to detect external changes
          const serverFingerprint = [serverRes.sysName, serverRes.sysDesc, serverRes.conf, serverRes.integ, serverRes.avail].join('|');
          const localSnapshot = [data.sysName, data.sysDesc, data.conf, data.integ, data.avail].join('|');

          // Simple conflict: server data differs from both local edits AND what we expect
          if (serverFingerprint !== localSnapshot && serverRes.sysName && data.sysName && serverRes.sysName !== data.sysName) {
            console.warn('[Reporter] Conflict detected — server has different data');
            setConflictData({ server: serverRes, local: data });
            return;
          }
        }

        // No conflict — save to server
        await syncActions.saveToServer(sspId, data);
        console.log('[Reporter] Auto-synced to server');
      } catch (e) {
        console.error('[Reporter] Auto-sync failed:', e);
      }
    }, 5000);

    return () => {
      if (serverSyncTimerRef.current) {
        clearTimeout(serverSyncTimerRef.current);
      }
    };
  }, [data, authState.isOnlineMode, syncState.sspId, syncState.pendingChanges, initialLoadDone, syncActions]);

  // Conflict resolution handlers
  const handleResolveConflict = (choice: 'local' | 'server') => {
    if (!conflictData) return;
    if (choice === 'server') {
      setData(conflictData.server);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conflictData.server));
    } else if (choice === 'local' && syncState.sspId) {
      syncActions.saveToServer(syncState.sspId, conflictData.local);
    }
    setConflictData(null);
  };

  // Derive saving boolean from status for Header component
  const saving = saveStatus === 'pending';

  // Calculate per-section progress
  const progress = useMemo(() => {
    const secFields: Record<string, string[]> = {
      sysinfo: ['sysName', 'sysDesc', 'authType'],
      fips199: ['conf', 'integ', 'avail', 'catJust'],
      infotypes: ['infoTypes'],
      baseline: ['ctrlBaseline', 'baseJust'],
      rmf: ['rmfCurrentStep'],
      boundary: ['bndNarr', 'bndComps'],
      dataflow: ['dfNarr', 'encRest', 'encTransit'],
      network: ['netNarr', 'netZones'],
      pps: ['ppsRows'],
      intercon: ['icRows'],
      crypto: ['cryptoNarr', 'cryptoMods'],
      personnel: ['soName', 'aoName', 'issoName'],
      identity: ['ial', 'aal'],
      sepduty: ['sepDutyMatrix'],
      controls: ['ctrlData'],
      policies: ['policyDocs'],
      scrm: ['scrmPlan', 'scrmSuppliers'],
      privacy: ['ptaCollectsPii'],
      conplan: ['cpPurpose', 'rto', 'rpo'],
      irplan: ['irPurpose', 'irSeverity'],
      cmplan: ['cmPurpose', 'cmBaselines'],
      conmon: ['iscmType', 'ctrlRotation', 'cmTools'],
      poam: ['poamRows'],
    };

    const r: Record<string, number> = {};
    for (const [s, fs] of Object.entries(secFields)) {
      const filled = fs.filter((f) => {
        const v = data[f as keyof SSPData];
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
        return v && v.toString().trim().length > 0;
      }).length;
      r[s] = Math.round((filled / fs.length) * 100);
    }
    return r;
  }, [data]);

  // Calculate overall progress
  const overall = useMemo(() => {
    const v = Object.values(progress);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
  }, [progress]);

  // Get current section info
  const currentSectionInfo = SECTIONS.find((s) => s.id === currentSection);
  const currentIndex = SECTIONS.findIndex((s) => s.id === currentSection);

  // Get the renderer for current section
  const Renderer = SECTION_RENDERERS[currentSection];

  // Navigation handlers
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentSection(SECTIONS[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < SECTIONS.length - 1) {
      setCurrentSection(SECTIONS[currentIndex + 1].id);
    }
  };

  // Export handler - returns validation result for OSCAL
  const handleExport = async (format: string): Promise<ValidatedOscalExportResult | void> => {
    console.log('Exporting as:', format);

    if (format === 'OSCAL JSON') {
      // Generate and validate OSCAL JSON
      const result = generateValidatedOscalSSP({
        data,
        documentTitle: data.sysName ? `System Security Plan - ${data.sysName}` : undefined,
        orgName: data.owningAgency,
        version: '1.0',
      });

      console.log('OSCAL Validation Result:', result.summary);

      // If valid, download automatically
      if (result.success) {
        const filename = `${data.sysAcronym || 'SSP'}_OSCAL_${new Date().toISOString().split('T')[0]}.json`;
        downloadOscalJson(result.document, filename);
      }

      // Return result for UI to display validation errors
      return result;
    } else if (format === 'OSCAL JSON (force)') {
      // Force export even with validation errors
      const result = generateValidatedOscalSSP({
        data,
        documentTitle: data.sysName ? `System Security Plan - ${data.sysName}` : undefined,
        orgName: data.owningAgency,
        version: '1.0',
      });

      // Download regardless of validation
      const filename = `${data.sysAcronym || 'SSP'}_OSCAL_${new Date().toISOString().split('T')[0]}.json`;
      downloadOscalJson(result.document, filename);

      console.log('OSCAL exported with validation warnings/errors (user forced)');
      return result;
    } else if (format === 'OSCAL XML') {
      // Generate and validate OSCAL XML
      const result = generateValidatedOscalSSP({
        data,
        documentTitle: data.sysName ? `System Security Plan - ${data.sysName}` : undefined,
        orgName: data.owningAgency,
        version: '1.0',
      });

      console.log('OSCAL XML Validation Result:', result.summary);

      // If valid, download automatically as XML
      if (result.success) {
        const filename = `${data.sysAcronym || 'SSP'}_OSCAL_${new Date().toISOString().split('T')[0]}.xml`;
        downloadOscalXml(result.document, filename);
      }

      // Return result for UI to display validation errors
      return result;
    } else if (format === 'OSCAL XML (force)') {
      // Force export XML even with validation errors
      const result = generateValidatedOscalSSP({
        data,
        documentTitle: data.sysName ? `System Security Plan - ${data.sysName}` : undefined,
        orgName: data.owningAgency,
        version: '1.0',
      });

      // Download as XML regardless of validation
      const filename = `${data.sysAcronym || 'SSP'}_OSCAL_${new Date().toISOString().split('T')[0]}.xml`;
      downloadOscalXml(result.document, filename);

      console.log('OSCAL XML exported with validation warnings/errors (user forced)');
      return result;
    } else if (format === 'PDF Report') {
      // Generate PDF
      const blob = await generatePDF({ data, progress });
      const filename = `${data.sysAcronym || 'SSP'}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(blob, filename);
    } else {
      // Other formats coming soon
      alert(`Export to ${format} coming soon!`);
    }
  };

  // Validate handler
  const handleValidate = () => {
    const result = validateSSP(data);
    setValidation(result);

    if (result.isValid) {
      alert('All required fields are complete! Your SSP is ready for export.');
    } else {
      // Navigate to first section with errors
      const firstErrorSection = result.errors[0]?.section;
      if (firstErrorSection) {
        // Map validation section to app section id
        const sectionMapping: Record<string, string> = {
          system_info: 'sysinfo',
          fips_199: 'fips199',
          control_baseline: 'baseline',
          rmf_lifecycle: 'rmf',
          authorization_boundary: 'boundary',
          data_flow: 'dataflow',
          network_architecture: 'network',
          personnel: 'personnel',
          digital_identity: 'identity',
          contingency_plan: 'conplan',
          incident_response: 'irplan',
          continuous_monitoring: 'conmon',
        };
        const sectionId = sectionMapping[firstErrorSection] || firstErrorSection;
        setCurrentSection(sectionId);
      }
      alert(`${result.errorCount} required field(s) are missing. Please review the highlighted sections.`);
    }
  };

  // Clear data handler
  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all SSP data? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      setData({});
      setValidation(validateSSP({}));
      setLastSaved(null);
    }
  };

  // Sync to server handler
  const handleSync = async () => {
    if (syncState.sspId) {
      await syncActions.fullSync(syncState.sspId, data);
    }
  };

  // Disconnect handler
  const handleDisconnect = () => {
    authActions.disconnect();
    syncActions.clearSync();
  };

  // Import handler - receives data from ImportModal
  const handleImport = (result: OscalImportResult) => {
    if (result.success && result.data) {
      // Merge imported data with existing data (imported data takes precedence)
      setData((prev) => {
        const merged = { ...prev, ...result.data };
        // Update validation with the merged data (not just imported data)
        setValidation(validateSSP(merged));
        return merged;
      });

      // Show success message
      const controlCount = result.data.ctrlData ? Object.keys(result.data.ctrlData).length : 0;
      alert(
        `Successfully imported "${result.documentInfo.title}"\n\n` +
        `• Format: OSCAL ${result.documentInfo.oscalVersion} (${result.sourceFormat.toUpperCase()})\n` +
        `• System: ${result.data.sysName || 'Unnamed'}\n` +
        `• Controls: ${controlCount}\n\n` +
        `${result.warnings.length} import note(s)`
      );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      color: colors.text,
      fontFamily: "'Inter', 'DM Sans', -apple-system, sans-serif",
      display: 'flex',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    }}>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#ssp-editor-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        onFocus={(e) => {
          e.currentTarget.style.position = 'fixed';
          e.currentTarget.style.left = '16px';
          e.currentTarget.style.top = '16px';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.overflow = 'visible';
          e.currentTarget.style.zIndex = '10000';
          e.currentTarget.style.background = colors.bg;
          e.currentTarget.style.padding = '12px 24px';
          e.currentTarget.style.borderRadius = '8px';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          e.currentTarget.style.fontWeight = '600';
          e.currentTarget.style.color = colors.text;
          e.currentTarget.style.textDecoration = 'none';
        }}
        onBlur={(e) => {
          e.currentTarget.style.position = 'absolute';
          e.currentTarget.style.left = '-9999px';
          e.currentTarget.style.width = '1px';
          e.currentTarget.style.height = '1px';
          e.currentTarget.style.overflow = 'hidden';
        }}
      >
        Skip to main content
      </a>

      {/* Live region for save status announcements */}
      <div aria-live="polite" aria-atomic="true" style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}>
        {saveStatus === 'saved' && lastSaved ? `Document saved at ${lastSaved.toLocaleTimeString()}` : ''}
      </div>

      {/* Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        progress={progress}
        overall={overall}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Content */}
      <main role="main" aria-label="SSP Editor" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        {/* Header */}
        <Header
          currentSection={currentSectionInfo}
          saving={saving}
          lastSaved={lastSaved}
          onExport={() => setShowExport(true)}
          onImport={() => setShowImport(true)}
          onValidate={handleValidate}
          onClearData={handleClearData}
          syncStatus={syncState.status}
          sspTitle={syncState.sspTitle}
          onSync={handleSync}
          onDisconnect={handleDisconnect}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
          isOfflineMode={!authState.isOnlineMode}
          onSignIn={authActions.logout}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          onExport={handleExport}
          validation={validation}
        />

        {/* Import Modal */}
        <ImportModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />

        {/* Conflict Resolution Banner */}
        {conflictData && (
          <div
            role="alertdialog"
            aria-label="Data conflict detected"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{
              background: colors.bg,
              borderRadius: 14,
              padding: 28,
              width: 480,
              border: `1px solid ${colors.text}20`,
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 700, color: colors.text }}>
                Sync Conflict Detected
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: `${colors.text}90`, lineHeight: 1.6 }}>
                The SSP has been modified on the server since your last sync. Choose which version to keep:
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => handleResolveConflict('server')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${colors.text}30`,
                    background: 'transparent',
                    color: colors.text,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Use Server Version
                </button>
                <button
                  onClick={() => handleResolveConflict('local')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#0ea5e9',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Keep My Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator when fetching from server */}
        {syncState.status === 'syncing' && !initialLoadDone && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 32,
                marginBottom: 12,
                animation: 'spin 1s linear infinite',
              }}>
                🔄
              </div>
              <div style={{ fontSize: 14, color: C.textMuted }}>
                Loading SSP from server...
              </div>
            </div>
          </div>
        )}

        {/* Section Content */}
        <div id="ssp-editor-content" tabIndex={-1} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 44px 80px',
        }}>
          <Suspense fallback={<SectionSkeleton />}>
            <div
              style={{
                maxWidth: 940,
                margin: '0 auto',
              }}
              className="animate-slideIn"
              key={currentSection}
            >
              {Renderer && (
                <SectionErrorBoundary sectionName={currentSectionInfo?.label || 'Section'}>
                  <Renderer d={data} sf={setField} />
                </SectionErrorBoundary>
              )}
            </div>
          </Suspense>
        </div>

        {/* Footer Navigation */}
        <Footer
          currentIndex={currentIndex}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </main>
    </div>
  );
}

/**
 * Auth gate: shows Login/Register when not authenticated, AppContent when authenticated
 */
function AuthGate() {
  const [authState] = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Loading spinner while checking stored credentials
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-200 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show login or register
  if (!authState.isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Authenticated — show the SSP editor
  return <AppContent />;
}

/**
 * Root component: wraps everything in AuthProvider
 */
function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
