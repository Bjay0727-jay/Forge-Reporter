/**
 * Post-Authorization Sections (22-23)
 */
import React, { useMemo } from 'react';
import type { SSPData } from '../types';
import { FF, TI, Sel, SH, Div, G2, SubH, Chk, TAAI } from '../components/FormComponents';
import { DT, useDT } from '../components/DynamicTable';
import { AddedBanner } from '../components/AddedBanner';
import { C } from '../config/colors';
import type { SystemContext } from '../services/ai';

interface Props {
  d: SSPData;
  sf: (key: string, value: unknown) => void;
}

// Helper to build system context
const useSystemContext = (d: SSPData): SystemContext => {
  return useMemo(() => ({
    systemName: d.sysName,
    systemAcronym: d.sysAcronym,
    impactLevel: d.conf || d.integ || d.avail || 'Moderate',
    orgName: d.owningAgency,
  }), [d.sysName, d.sysAcronym, d.conf, d.integ, d.avail, d.owningAgency]);
};

// Section 22: Security Assessment (RMF Step 5 — Assess)
export const AssessSec: React.FC<Props> = ({ d, sf }) => {
  const systemContext = useSystemContext(d);

  return (
    <div>
      <SH title="Security Assessment" sub="RMF Step 5: Assess — NIST SP 800-53A. Evaluate the security controls to determine implementation effectiveness." />
      <AddedBanner tag="fisma" ref="SP 800-53A / RMF Step 5" text="Assessors (3PAO or internal) evaluate each control. Document the Security Assessment Plan (SAP) and Security Assessment Report (SAR)." />
      <div style={G2}>
        <FF label="Assessment Type" req>
          <Sel value={d.assessType} onChange={(v) => sf('assessType', v)} ph="Select" options={[
            { v: '3pao', l: '3PAO Independent Assessment' },
            { v: 'internal', l: 'Internal Assessment (Agency)' },
            { v: 'hybrid', l: 'Hybrid (3PAO + Internal)' },
          ]} />
        </FF>
        <FF label="Assessor Organization">
          <TI value={d.assessOrg} onChange={(v) => sf('assessOrg', v)} placeholder="e.g., Coalfire, Schellman, KPMG" />
        </FF>
      </div>
      <div style={G2}>
        <FF label="Assessment Start Date">
          <TI value={d.assessStart} onChange={(v) => sf('assessStart', v)} placeholder="YYYY-MM-DD" mono />
        </FF>
        <FF label="Assessment Completion Date">
          <TI value={d.assessEnd} onChange={(v) => sf('assessEnd', v)} placeholder="YYYY-MM-DD" mono />
        </FF>
      </div>
      <FF label="SAP Summary" span={2} hint="Summarize the Security Assessment Plan scope and methodology">
        <TAAI
          value={d.sapSummary}
          onChange={(v) => sf('sapSummary', v)}
          rows={4}
          placeholder="The SAP defines assessment scope, methodology, and schedule. Controls assessed per SP 800-53A procedures..."
          sectionKey="assess"
          sectionLabel="SAP Summary"
          systemContext={systemContext}
        />
      </FF>
      <Div />
      <FF label="SAR Summary" span={2} hint="Summarize Security Assessment Report findings">
        <TAAI
          value={d.sarSummary}
          onChange={(v) => sf('sarSummary', v)}
          rows={4}
          placeholder="Assessment identified X findings across Y controls. Critical: 0, High: 2, Moderate: 5, Low: 8..."
          sectionKey="assess"
          sectionLabel="SAR Summary"
          systemContext={systemContext}
        />
      </FF>
      <div style={G2}>
        <FF label="Controls Assessed">
          <TI value={d.assessCtrlCount} onChange={(v) => sf('assessCtrlCount', v)} placeholder="e.g., 325" />
        </FF>
        <FF label="Findings Count">
          <TI value={d.assessFindingsCount} onChange={(v) => sf('assessFindingsCount', v)} placeholder="e.g., 15" />
        </FF>
      </div>
    </div>
  );
};

// Section 23: Authorization Decision (RMF Step 6 — Authorize)
export const AuthorizeSec: React.FC<Props> = ({ d, sf }) => {
  const systemContext = useSystemContext(d);

  return (
    <div>
      <SH title="Authorization Decision" sub="RMF Step 6: Authorize — NIST SP 800-37 Rev 2. The AO reviews the authorization package and renders a decision." />
      <AddedBanner tag="fisma" ref="SP 800-37 Rev2 / RMF Step 6" text="The Authorizing Official reviews the SSP, SAR, and POA&M to determine if residual risk is acceptable. Document the ATO letter and any conditions." />
      <div style={G2}>
        <FF label="Authorization Decision" req>
          <Sel value={d.authDecision} onChange={(v) => sf('authDecision', v)} ph="Select" options={[
            { v: 'ato', l: 'Authorization to Operate (ATO)' },
            { v: 'iatt', l: 'Interim ATO (IATT)' },
            { v: 'dato', l: 'Denial of Authorization (DATO)' },
            { v: 'pending', l: 'Pending Decision' },
          ]} />
        </FF>
        <FF label="Authorization Date">
          <TI value={d.authDate} onChange={(v) => sf('authDate', v)} placeholder="YYYY-MM-DD" mono />
        </FF>
      </div>
      <div style={G2}>
        <FF label="AO Name" req>
          <TI value={d.authAoName} onChange={(v) => sf('authAoName', v)} placeholder="Authorizing Official name" />
        </FF>
        <FF label="Authorization Expiration">
          <TI value={d.authExpiry} onChange={(v) => sf('authExpiry', v)} placeholder="YYYY-MM-DD or 'Ongoing'" mono />
        </FF>
      </div>
      <FF label="Authorization Conditions" span={2} hint="Document any conditions or limitations on the authorization">
        <TAAI
          value={d.authConditions}
          onChange={(v) => sf('authConditions', v)}
          rows={4}
          placeholder="ATO granted with the following conditions:
1. All critical POA&M items remediated within 30 days
2. Monthly vulnerability scanning required
3. Annual 3PAO re-assessment..."
          sectionKey="authorize"
          sectionLabel="Authorization Conditions"
          systemContext={systemContext}
        />
      </FF>
      <Div />
      <FF label="Risk Acceptance Statement" span={2} hint="AO's formal risk acceptance rationale">
        <TAAI
          value={d.riskAcceptance}
          onChange={(v) => sf('riskAcceptance', v)}
          rows={4}
          placeholder="The AO has determined that residual risk is acceptable based on review of the SSP, SAR, and POA&M..."
          sectionKey="authorize"
          sectionLabel="Risk Acceptance Statement"
          systemContext={systemContext}
        />
      </FF>
    </div>
  );
};

// Section 24: Continuous Monitoring & ISCM
export const ConMonSec: React.FC<Props> = ({ d, sf }) => {
  const cmTools = useDT(d, 'cmTools', sf);
  const systemContext = useSystemContext(d);

  const cadenceItems = [
    'Monthly vulnerability scans',
    'Monthly POA&M updates to AO',
    'Monthly ConMon report submission',
    'Quarterly security metrics reporting',
    'Annual control assessment (1/3 rotation)',
    'Annual IR Plan test',
    'Annual CP test',
    'Annual privacy review',
    'Annual FISMA reporting (CyberScope/CSAM)',
    'Ongoing KEV catalog remediation (BO 22-01)',
  ];

  return (
    <div>
      <SH title="Continuous Monitoring & ISCM" sub="RMF Step 7: Monitor — NIST SP 800-137 Information Security Continuous Monitoring. Expanded for FISMA Ongoing Authorization." />
      <div style={{
        background: C.surface,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        border: `1px solid ${C.warning}30`,
      }}>
        <div style={{
          fontSize: 11,
          color: C.warning,
          fontWeight: 600,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}>
          ⚡ EXPANDED FOR FISMA/RMF — SP 800-137 ISCM + SP 800-37 Step 7
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
          This section now covers the full RMF Monitor step: 1/3 annual control rotation, Ongoing Authorization triggers, significant change process, FISMA annual reporting, and POA&M monthly cadence.
        </div>
      </div>
      <div style={G2}>
        <FF label="ISCM Strategy Type" req>
          <Sel value={d.iscmType} onChange={(v) => sf('iscmType', v)} ph="Select" options={[
            { v: 'ongoing', l: 'Ongoing Authorization (continuous)' },
            { v: '3yr', l: '3-Year ATO with Annual Assessment' },
            { v: 'hybrid', l: 'Hybrid (automated + periodic)' },
          ]} />
        </FF>
        <FF label="Control Assessment Rotation" req hint="SP 800-53A: Test 1/3 of controls annually">
          <Sel value={d.ctrlRotation} onChange={(v) => sf('ctrlRotation', v)} ph="Select" options={[
            { v: 'third', l: '1/3 annually (FISMA standard)' },
            { v: 'continuous', l: 'All controls continuously (automated)' },
            { v: 'risk', l: 'Risk-based selection' },
          ]} />
        </FF>
      </div>
      <FF label="ISCM Strategy Narrative" span={2}>
        <TAAI
          value={d.iscmNarrative}
          onChange={(v) => sf('iscmNarrative', v)}
          rows={5}
          placeholder="ControlPulse™ CCM executes 2,847 automated tests/day. Drift detection within 2 minutes. Monthly vulnerability scans. Annual 3PAO assessment with 1/3 control rotation…"
          sectionKey="conmon"
          sectionLabel="ISCM Strategy Narrative"
          systemContext={systemContext}
        />
      </FF>
      <Div />
      <SubH>Monitoring Tools & Automation</SubH>
      <DT
        cols={[
          { k: 'tool', l: 'Tool', ph: 'ControlPulse CCM' },
          { k: 'purpose', l: 'Purpose', ph: 'Continuous control testing' },
          { k: 'freq', l: 'Frequency', type: 'select', opts: ['Real-time', 'Hourly', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'], w: '110px' },
          { k: 'ctrls', l: 'Controls', ph: 'AC, AU, CM, SI' },
        ]}
        rows={cmTools.rows}
        onAdd={cmTools.add}
        onDel={cmTools.del}
        onUpd={cmTools.upd}
      />
      <Div />
      <SubH>Ongoing Authorization Triggers</SubH>
      <FF label="Significant Change Criteria" span={2} hint="SP 800-37 Task M-3: What triggers re-assessment vs. ongoing auth">
        <TAAI
          value={d.sigChangeCriteria}
          onChange={(v) => sf('sigChangeCriteria', v)}
          rows={4}
          placeholder="Significant changes requiring AO notification and potential re-assessment:
• New external interconnections
• Migration to new cloud provider
• Change in data sensitivity level
• Major architecture changes
• New information types added"
          sectionKey="conmon"
          sectionLabel="Significant Change Criteria"
          systemContext={systemContext}
        />
      </FF>
      <Div />
      <SubH>FISMA Monthly/Annual Cadence</SubH>
      <div style={{
        background: C.surface,
        borderRadius: 10,
        padding: 16,
        border: `1px solid ${C.border}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
      }}>
        {cadenceItems.map((item) => (
          <Chk
            key={item}
            label={item}
            checked={(d.iscmCadence || []).includes(item)}
            onChange={(chk) => {
              const c = d.iscmCadence || [];
              sf('iscmCadence', chk ? [...c, item] : c.filter((x) => x !== item));
            }}
          />
        ))}
      </div>
      <Div />
      <div style={G2}>
        <FF label="Authorization Expiration">
          <TI value={d.atoExpiry} onChange={(v) => sf('atoExpiry', v)} placeholder="YYYY-MM-DD or 'Ongoing'" mono />
        </FF>
        <FF label="Next Annual Assessment">
          <TI value={d.nextAssessment} onChange={(v) => sf('nextAssessment', v)} placeholder="YYYY-MM-DD" mono />
        </FF>
      </div>
    </div>
  );
};

// Section 23: POA&M
export const PoamSec: React.FC<Props> = ({ d, sf }) => {
  const poamRows = useDT(d, 'poamRows', sf);
  return (
    <div>
      <SH title="Plan of Action & Milestones" sub="Appendix O — Monthly updates. FedRAMP: 15/30/90/180 day remediation. RMF Task M-4." />
      <AddedBanner tag="fedramp" ref="Appendix O / RMF Task M-4" text="Living document updated monthly. AO reviews POA&M as part of Ongoing Authorization determination." />
      <DT
        cols={[
          { k: 'id', l: 'ID', ph: 'V-001', w: '70px', mono: true },
          { k: 'weakness', l: 'Weakness', ph: 'Missing MFA on admin' },
          { k: 'sev', l: 'Severity', type: 'select', opts: ['Critical', 'High', 'Medium', 'Low'], w: '90px' },
          { k: 'ctrl', l: 'Control', ph: 'IA-2', w: '70px', mono: true },
          { k: 'status', l: 'Status', type: 'select', opts: ['Open', 'In Progress', 'Completed', 'Delayed', 'Accepted'], w: '110px' },
          { k: 'due', l: 'Due', ph: 'YYYY-MM-DD', w: '95px' },
        ]}
        rows={poamRows.rows}
        onAdd={poamRows.add}
        onDel={poamRows.del}
        onUpd={poamRows.upd}
      />
      <Div />
      <div style={G2}>
        <FF label="Review Frequency">
          <Sel value={d.poamFreq} onChange={(v) => sf('poamFreq', v)} ph="Select" options={[
            { v: 'monthly', l: 'Monthly (FISMA/FedRAMP)' },
            { v: 'biweekly', l: 'Bi-weekly' },
            { v: 'weekly', l: 'Weekly' },
          ]} />
        </FF>
        <FF label="Remediation Workflow">
          <TI value={d.poamWf} onChange={(v) => sf('poamWf', v)} placeholder="Auto from ForgeScan → assigned → tracked" />
        </FF>
      </div>
    </div>
  );
};
