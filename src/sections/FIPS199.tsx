/**
 * Section 2: FIPS 199 Categorization
 */
import React, { useMemo } from 'react';
import type { SSPData } from '../types';
import { FF, Sel, SH, G3, TAAI } from '../components/FormComponents';
import { C } from '../config/colors';
import type { SystemContext } from '../services/ai';

interface Props {
  d: SSPData;
  sf: (key: string, value: unknown) => void;
}

export const FIPS199Sec: React.FC<Props> = ({ d, sf }) => {
  // Build system context for AI
  const systemContext: SystemContext = useMemo(() => ({
    systemName: d.sysName,
    systemAcronym: d.sysAcronym,
    impactLevel: d.conf || d.integ || d.avail || 'Moderate',
    orgName: d.owningAgency,
  }), [d.sysName, d.sysAcronym, d.conf, d.integ, d.avail, d.owningAgency]);
  const lv: Record<string, number> = { high: 3, moderate: 2, low: 1 };
  const vs = [d.conf, d.integ, d.avail].map((v) => lv[v || ''] || 0);
  const mx = Math.max(...vs);
  const ov = mx === 3 ? 'HIGH' : mx === 2 ? 'MODERATE' : mx === 1 ? 'LOW' : '—';
  const oc = ov === 'HIGH' ? C.error : ov === 'MODERATE' ? C.warning : ov === 'LOW' ? C.success : C.textMuted;

  return (
    <div>
      <SH
        title="FIPS 199 Categorization"
        sub="Security categorization per FIPS 199 and NIST SP 800-60. RMF Step 2: Categorize. Determines control baseline."
      />
      <div style={{
        background: C.surface,
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        border: `1px solid ${oc}40`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: C.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}>
            Overall Impact Level (High Water Mark)
          </span>
          <div style={{
            padding: '6px 22px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 700,
            background: oc,
            color: '#fff',
            letterSpacing: '.08em',
          }}>
            {ov}
          </div>
        </div>
        <div style={G3}>
          {[
            { k: 'conf', l: 'Confidentiality', i: '🔒' },
            { k: 'integ', l: 'Integrity', i: '✅' },
            { k: 'avail', l: 'Availability', i: '⏱️' },
          ].map((o) => (
            <div key={o.k}>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6, fontWeight: 600 }}>
                {o.i} {o.l}
              </div>
              <Sel
                value={d[o.k as keyof SSPData] as string}
                onChange={(v) => sf(o.k, v)}
                ph="Select"
                options={[
                  { v: 'low', l: 'Low' },
                  { v: 'moderate', l: 'Moderate' },
                  { v: 'high', l: 'High' },
                ]}
              />
            </div>
          ))}
        </div>
      </div>
      <FF label="Categorization Justification" req span={2} hint="Reference NIST SP 800-60 Vol II information types">
        <TAAI
          value={d.catJust}
          onChange={(v) => sf('catJust', v)}
          rows={5}
          placeholder="The system is categorized as [MODERATE] based on NIST SP 800-60 analysis…"
          sectionKey="fips199"
          sectionLabel="FIPS 199 Categorization Justification"
          systemContext={systemContext}
        />
      </FF>
    </div>
  );
};
