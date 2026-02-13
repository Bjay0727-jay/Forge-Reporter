/**
 * ForgeComply 360 Reporter - Main Application
 * Standalone FISMA SSP Reporting Engine
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { C } from './config/colors';
import { SECTIONS } from './config/sections';
import type { SSPData } from './types';
import { Sidebar, Header, Footer, ExportModal } from './components';
import { SECTION_RENDERERS } from './sections';
import { validateSSP, type ValidationResult } from './utils/validation';
import { generatePDF, downloadPDF } from './utils/pdfExport';
import { exportToOscalJson } from './utils/oscalExport';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import './index.css';

// Local storage key for auto-save
const STORAGE_KEY = 'forgecomply360-ssp-data';

function App() {
  // Auth and Sync hooks
  const [authState, authActions] = useAuth();
  const [syncState, syncActions] = useSync(authState.isOnlineMode);

  // Current section state
  const [currentSection, setCurrentSection] = useState('sysinfo');

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
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Validation state
  const [validation, setValidation] = useState<ValidationResult>(() => validateSSP({}));

  // Ref to track if we should mark dirty
  const skipDirtyRef = useRef(false);

  // Load data from server if authenticated with an SSP ID
  useEffect(() => {
    if (authState.isAuthenticated && authState.sspId && !initialLoadDone) {
      setInitialLoadDone(true);
      skipDirtyRef.current = true;

      syncActions.loadFromServer(authState.sspId).then((serverData) => {
        if (serverData) {
          setData(serverData);
          // Also save to localStorage for offline access
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
        }
        skipDirtyRef.current = false;
      });
    }
  }, [authState.isAuthenticated, authState.sspId, initialLoadDone, syncActions]);

  // Set field helper
  const setField = useCallback((key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
    // Mark as dirty if online
    if (!skipDirtyRef.current && authState.isOnlineMode) {
      syncActions.markDirty();
    }
  }, [authState.isOnlineMode, syncActions]);

  // Auto-save to localStorage and update validation
  useEffect(() => {
    if (Object.keys(data).length === 0) return;

    setSaving(true);
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSaving(false);
        setLastSaved(new Date());
        // Update validation after save
        setValidation(validateSSP(data));
      } catch (e) {
        console.error('Failed to save:', e);
        setSaving(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [data]);

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

  // Export handler
  const handleExport = async (format: string) => {
    console.log('Exporting as:', format);

    if (format === 'OSCAL JSON') {
      // Generate OSCAL JSON
      exportToOscalJson({
        data,
        documentTitle: data.sysName ? `System Security Plan - ${data.sysName}` : undefined,
        orgName: data.owningAgency,
        version: '1.0',
      });
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

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      display: 'flex',
    }}>
      {/* Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        progress={progress}
        overall={overall}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        validationErrors={validation.sectionErrors}
      />

      {/* Main Content */}
      <div style={{
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
          onValidate={handleValidate}
          onClearData={handleClearData}
          syncStatus={syncState.status}
          sspTitle={syncState.sspTitle}
          onSync={handleSync}
          onDisconnect={handleDisconnect}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          onExport={handleExport}
          validation={validation}
        />

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
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '26px 34px 80px',
        }}>
          <div
            style={{
              maxWidth: 940,
              margin: '0 auto',
            }}
            className="animate-slideIn"
            key={currentSection}
          >
            {Renderer && <Renderer d={data} sf={setField} />}
          </div>
        </div>

        {/* Footer Navigation */}
        <Footer
          currentIndex={currentIndex}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}

export default App;
