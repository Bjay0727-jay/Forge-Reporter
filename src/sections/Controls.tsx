/**
 * Controls & Policies Sections (15-18)
 */
import React, { useState } from 'react';
import type { SSPData } from '../types';
import { FF, TI, TA, Sel, SH, Div, G2, SubH } from '../components/FormComponents';
import { DT, useDT } from '../components/DynamicTable';
import { AddedBanner } from '../components/AddedBanner';
import { C } from '../config/colors';

interface Props {
  d: SSPData;
  sf: (key: string, value: unknown) => void;
}

// Section 15: Control Implementations
export const ControlsSec: React.FC<Props> = ({ d, sf }) => {
  const [exp, setExp] = useState<string | null>(null);
  const families = [
    { c: 'AC', n: 'Access Control', t: 25 },
    { c: 'AT', n: 'Awareness & Training', t: 6 },
    { c: 'AU', n: 'Audit & Accountability', t: 16 },
    { c: 'CA', n: 'Assessment, Auth & Monitoring', t: 9 },
    { c: 'CM', n: 'Configuration Management', t: 14 },
    { c: 'CP', n: 'Contingency Planning', t: 13 },
    { c: 'IA', n: 'Identification & Auth', t: 12 },
    { c: 'IR', n: 'Incident Response', t: 10 },
    { c: 'MA', n: 'Maintenance', t: 7 },
    { c: 'MP', n: 'Media Protection', t: 8 },
    { c: 'PE', n: 'Physical & Environmental', t: 20 },
    { c: 'PL', n: 'Planning', t: 11 },
    { c: 'PM', n: 'Program Management', t: 32 },
    { c: 'PS', n: 'Personnel Security', t: 9 },
    { c: 'PT', n: 'PII Processing & Transparency', t: 8 },
    { c: 'RA', n: 'Risk Assessment', t: 10 },
    { c: 'SA', n: 'System & Services Acquisition', t: 23 },
    { c: 'SC', n: 'System & Comms Protection', t: 44 },
    { c: 'SI', n: 'System & Info Integrity', t: 23 },
    { c: 'SR', n: 'Supply Chain Risk Mgmt', t: 12 },
  ];

  const cs = d.ctrlData || {};

  return (
    <div>
      <SH title="Control Implementations" sub="RMF Step 4: Implement. Appendix A — Per NIST 800-53 Rev5 including PT and SR families." />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8,
        marginBottom: 20,
        background: C.surface,
        borderRadius: 10,
        padding: 14,
        border: `1px solid ${C.border}`,
      }}>
        {[
          { l: 'Implemented', c: C.success, i: '✅' },
          { l: 'Partial', c: C.warning, i: '🔶' },
          { l: 'Planned', c: C.info, i: '📋' },
          { l: 'Inherited', c: '#8b5cf6', i: '🔗' },
          { l: 'N/A', c: C.textMuted, i: '➖' },
        ].map((s) => (
          <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: s.c }}>
            <span>{s.i}</span>{s.l}
          </div>
        ))}
      </div>
      {families.map((f) => {
        const fd = cs[f.c] || {};
        const impl = Object.values(fd).filter((v) => v === 'implemented').length;
        const pct = f.t > 0 ? Math.round((impl / f.t) * 100) : 0;
        const isNew = f.c === 'PT' || f.c === 'SR';

        return (
          <div key={f.c} style={{
            background: C.surface,
            borderRadius: 10,
            marginBottom: 6,
            border: `1px solid ${exp === f.c ? C.primary + '50' : C.border}`,
            overflow: 'hidden',
          }}>
            <div
              onClick={() => setExp(exp === f.c ? null : f.c)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: "'Fira Code', monospace",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: C.primary,
                  background: `${C.primary}15`,
                  padding: '2px 7px',
                  borderRadius: 4,
                }}>
                  {f.c}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{f.n}</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>({f.t})</span>
                {isNew && (
                  <span style={{
                    fontSize: 8,
                    background: `${C.warning}25`,
                    color: C.warning,
                    padding: '1px 5px',
                    borderRadius: 3,
                    fontWeight: 700,
                  }}>
                    REV5
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 70, height: 5, background: C.surfaceAlt, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? C.success : C.primary, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 10.5, color: C.textSecondary, fontFamily: "'Fira Code', monospace", minWidth: 30, textAlign: 'right' }}>
                  {pct}%
                </span>
                <span style={{ fontSize: 12, color: C.textMuted, transform: exp === f.c ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  ▶
                </span>
              </div>
            </div>
            {exp === f.c && (
              <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.borderLight}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 5, paddingTop: 8 }}>
                  {Array.from({ length: f.t }, (_, i) => {
                    const id = `${f.c}-${i + 1}`;
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 10.5, fontFamily: "'Fira Code', monospace", color: C.textSecondary, minWidth: 42 }}>{id}</span>
                        <select
                          value={fd[id] || ''}
                          onChange={(e) => {
                            const n = { ...cs };
                            if (!n[f.c]) n[f.c] = {};
                            n[f.c][id] = e.target.value;
                            sf('ctrlData', n);
                          }}
                          style={{
                            flex: 1,
                            padding: '3px 5px',
                            fontSize: 11,
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 4,
                            color: C.textSecondary,
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="">—</option>
                          <option value="implemented">✅ Impl</option>
                          <option value="partial">🔶 Partial</option>
                          <option value="planned">📋 Planned</option>
                          <option value="inherited">🔗 Inherited</option>
                          <option value="na">➖ N/A</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Section 16: Security Policies & Procedures
export const PoliciesSec: React.FC<Props> = ({ d, sf }) => {
  const policyDocs = useDT(d, 'policyDocs', sf);
  return (
    <div>
      <SH title="Security Policies & Procedures" sub="FedRAMP Appendix C / FISMA §3544 — Every '-1' control requires documented policy and procedures." />
      <AddedBanner tag="fisma" ref="Appendix C / All -1 Controls / FISMA §3544" text="Missing policies = every '-1' control fails assessment. This is the #1 finding in FISMA audits. Each of the 20 control families requires at minimum one policy document." />
      <DT
        cols={[
          { k: 'family', l: 'Family', type: 'select', opts: ['AC', 'AT', 'AU', 'CA', 'CM', 'CP', 'IA', 'IR', 'MA', 'MP', 'PE', 'PL', 'PM', 'PS', 'PT', 'RA', 'SA', 'SC', 'SI', 'SR'], w: '70px' },
          { k: 'title', l: 'Policy Document Title', ph: 'e.g., Access Control Policy' },
          { k: 'version', l: 'Version', ph: 'v2.1', w: '75px' },
          { k: 'owner', l: 'Owner', ph: 'e.g., CISO' },
          { k: 'lastReview', l: 'Last Reviewed', ph: 'YYYY-MM-DD', w: '100px' },
          { k: 'status', l: 'Status', type: 'select', opts: ['Approved', 'Draft', 'Under Review', 'Expired'], w: '110px' },
        ]}
        rows={policyDocs.rows}
        onAdd={policyDocs.add}
        onDel={policyDocs.del}
        onUpd={policyDocs.upd}
      />
      <Div />
      <div style={G2}>
        <FF label="Policy Review Cycle">
          <Sel value={d.policyReviewCycle} onChange={(v) => sf('policyReviewCycle', v)} ph="Select" options={[
            { v: 'annual', l: 'Annual (FISMA standard)' },
            { v: 'biannual', l: 'Bi-annual' },
            { v: 'event', l: 'Event-driven' },
          ]} />
        </FF>
        <FF label="Policy Exception Process">
          <TI value={d.policyException} onChange={(v) => sf('policyException', v)} placeholder="e.g., Exception requests submitted to ISSO → AO approval" />
        </FF>
      </div>
    </div>
  );
};

// Section 17: Supply Chain Risk Management
export const SCRMSec: React.FC<Props> = ({ d, sf }) => {
  const scrmSuppliers = useDT(d, 'scrmSuppliers', sf);
  return (
    <div>
      <SH title="Supply Chain Risk Management" sub="NIST SP 800-161 Rev1, SR Control Family (Rev5), EO 14028 — Software supply chain transparency." />
      <AddedBanner tag="fisma" ref="SP 800-161 / SR Family / EO 14028" text="Rev5 added the SR family as mandatory for moderate/high baselines. EO 14028 requires SBOM for all software sold to the government." />
      <FF label="SCRM Plan Summary" req span={2}>
        <TA value={d.scrmPlan} onChange={(v) => sf('scrmPlan', v)} rows={4} placeholder="The organization maintains a Supply Chain Risk Management Plan addressing procurement, development, integration, and maintenance of system components…" />
      </FF>
      <Div />
      <SubH>Critical Suppliers & Components</SubH>
      <DT
        cols={[
          { k: 'supplier', l: 'Supplier / Component', ph: 'e.g., Cloudflare Workers' },
          { k: 'type', l: 'Type', type: 'select', opts: ['CSP', 'SaaS', 'Open Source', 'COTS', 'Custom Dev', 'Hardware'], w: '110px' },
          { k: 'criticality', l: 'Criticality', type: 'select', opts: ['Critical', 'High', 'Medium', 'Low'], w: '100px' },
          { k: 'sbom', l: 'SBOM', type: 'select', opts: ['Complete', 'Partial', 'Pending', 'N/A'], w: '95px' },
          { k: 'riskLevel', l: 'Risk', type: 'select', opts: ['Acceptable', 'Mitigated', 'Under Review', 'Elevated'], w: '110px' },
        ]}
        rows={scrmSuppliers.rows}
        onAdd={scrmSuppliers.add}
        onDel={scrmSuppliers.del}
        onUpd={scrmSuppliers.upd}
      />
      <Div />
      <div style={G2}>
        <FF label="SBOM Format">
          <Sel value={d.sbomFormat} onChange={(v) => sf('sbomFormat', v)} ph="Select" options={[
            { v: 'spdx', l: 'SPDX (ISO standard)' },
            { v: 'cyclonedx', l: 'CycloneDX' },
            { v: 'swid', l: 'SWID Tags' },
            { v: 'na', l: 'Not yet generated' },
          ]} />
        </FF>
        <FF label="Provenance Tracking">
          <Sel value={d.provenance} onChange={(v) => sf('provenance', v)} ph="Select" options={[
            { v: 'automated', l: 'Automated (CI/CD integrated)' },
            { v: 'manual', l: 'Manual review' },
            { v: 'partial', l: 'Partial coverage' },
            { v: 'planned', l: 'Planned' },
          ]} />
        </FF>
      </div>
    </div>
  );
};

// Section 18: Privacy Analysis
export const PrivacySec: React.FC<Props> = ({ d, sf }) => (
  <div>
    <SH title="Privacy Analysis (PTA/PIA)" sub="E-Government Act §208, OMB M-03-22, SP 800-122 — Required for any system processing PII." />
    <AddedBanner tag="fisma" ref="E-Government Act §208 / PT Family" text="FISMA mandates privacy analysis for PII systems. Rev5 added the PT (PII Processing & Transparency) family. A system processing PII without PTA/PIA will NOT receive a FISMA ATO." />
    <SubH>Privacy Threshold Analysis (PTA)</SubH>
    <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
      <div style={G2}>
        <FF label="Does the system collect, store, or process PII?" req>
          <Sel value={d.ptaCollectsPii} onChange={(v) => sf('ptaCollectsPii', v)} ph="Select" options={[
            { v: 'yes', l: 'Yes — PII is collected/stored/processed' },
            { v: 'no', l: 'No — No PII involved' },
            { v: 'metadata', l: 'Metadata only (may contain PII)' },
          ]} />
        </FF>
        <FF label="PII Types (if applicable)">
          <TI value={d.ptaPiiTypes} onChange={(v) => sf('ptaPiiTypes', v)} placeholder="e.g., Names, emails, SSN, addresses, phone numbers" />
        </FF>
      </div>
      <div style={{ marginTop: 12, ...G2 }}>
        <FF label="Number of PII Records">
          <TI value={d.ptaRecordCount} onChange={(v) => sf('ptaRecordCount', v)} placeholder="e.g., < 1,000 / 1,000-100,000 / > 100,000" />
        </FF>
        <FF label="Is a full PIA required?">
          <Sel value={d.ptaPiaRequired} onChange={(v) => sf('ptaPiaRequired', v)} ph="Select" options={[
            { v: 'yes', l: 'Yes — Full PIA required' },
            { v: 'no', l: 'No — PTA sufficient' },
            { v: 'tbd', l: 'Under determination' },
          ]} />
        </FF>
      </div>
    </div>
    {d.ptaPiaRequired === 'yes' && (
      <>
        <SubH>Privacy Impact Assessment (PIA)</SubH>
        {[
          { k: 'piaAuthority', l: 'Authority to Collect', ph: 'Cite legal authority for PII collection (e.g., 5 USC §301)' },
          { k: 'piaPurpose', l: 'Purpose of Collection', ph: 'Why is PII collected and how is it used?' },
          { k: 'piaMinimization', l: 'Data Minimization', ph: 'How do you ensure only necessary PII is collected?' },
          { k: 'piaRetention', l: 'Retention & Disposal', ph: 'How long is PII retained? NARA schedule reference?' },
          { k: 'piaSharing', l: 'Third-Party Sharing', ph: 'Is PII shared externally? With whom and under what authority?' },
          { k: 'piaConsent', l: 'Individual Consent & Redress', ph: 'How do individuals consent? How can they access/correct their data?' },
        ].map((field) => (
          <FF key={field.k} label={field.l}>
            <TA value={d[field.k as keyof SSPData] as string} onChange={(v) => sf(field.k, v)} rows={2} placeholder={field.ph} />
          </FF>
        ))}
      </>
    )}
    <Div />
    <div style={G2}>
      <FF label="System of Records Notice (SORN)">
        <Sel value={d.sornStatus} onChange={(v) => sf('sornStatus', v)} ph="Select" options={[
          { v: 'published', l: 'Published in Federal Register' },
          { v: 'draft', l: 'Draft' },
          { v: 'na', l: 'N/A — Not a Privacy Act SOR' },
          { v: 'update', l: 'Needs update' },
        ]} />
      </FF>
      <FF label="SORN Number">
        <TI value={d.sornNumber} onChange={(v) => sf('sornNumber', v)} placeholder="e.g., DHS/CISA-XXX" mono />
      </FF>
    </div>
  </div>
);
