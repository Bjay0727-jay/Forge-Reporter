/**
 * Plans Sections (19-21)
 */
import React, { useMemo } from 'react';
import type { SSPData } from '../types';
import { FF, TI, Sel, SH, Div, G2, SubH, TAAI } from '../components/FormComponents';
import { DT, useDT } from '../components/DynamicTable';
import { AddedBanner } from '../components/AddedBanner';
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

// Section 19: Contingency Plan
export const ConPlanSec: React.FC<Props> = ({ d, sf }) => {
  const systemContext = useSystemContext(d);

  return (
    <div>
      <SH title="Contingency Plan" sub="SP 800-34 — ISCP. Appendix G. Tested annually." />
      <div style={G2}>
        <FF label="Purpose" req>
          <TAAI
            value={d.cpPurpose}
            onChange={(v) => sf('cpPurpose', v)}
            rows={3}
            placeholder="This ISCP establishes recovery procedures…"
            sectionKey="conplan"
            sectionLabel="Contingency Plan Purpose"
            systemContext={systemContext}
          />
        </FF>
        <FF label="Scope" req>
          <TAAI
            value={d.cpScope}
            onChange={(v) => sf('cpScope', v)}
            rows={3}
            placeholder="Covers all components within the boundary…"
            sectionKey="conplan"
            sectionLabel="Contingency Plan Scope"
            systemContext={systemContext}
          />
        </FF>
      </div>
      <Div />
      <SubH>Recovery Objectives</SubH>
      <div style={G2}>
        <FF label="RTO" req>
          <TI value={d.rto} onChange={(v) => sf('rto', v)} placeholder="e.g., 4 hours" />
        </FF>
        <FF label="RPO" req>
          <TI value={d.rpo} onChange={(v) => sf('rpo', v)} placeholder="e.g., 1 hour" />
        </FF>
        <FF label="MTD">
          <TI value={d.mtd} onChange={(v) => sf('mtd', v)} placeholder="e.g., 24 hours" />
        </FF>
        <FF label="Backup Freq">
          <Sel value={d.backupFreq} onChange={(v) => sf('backupFreq', v)} ph="Select" options={[
            { v: 'rt', l: 'Real-time' },
            { v: 'hourly', l: 'Hourly' },
            { v: 'daily', l: 'Daily' },
          ]} />
        </FF>
      </div>
      <Div />
      <div style={G2}>
        <FF label="Last CP Test">
          <TI value={d.cpTestDate} onChange={(v) => sf('cpTestDate', v)} placeholder="YYYY-MM-DD" mono />
        </FF>
        <FF label="Test Type">
          <Sel value={d.cpTestType} onChange={(v) => sf('cpTestType', v)} ph="Select" options={[
            { v: 'tabletop', l: 'Tabletop' },
            { v: 'walkthrough', l: 'Walkthrough' },
            { v: 'functional', l: 'Functional' },
            { v: 'full', l: 'Full Interruption' },
          ]} />
        </FF>
      </div>
    </div>
  );
};

// Section 20: Incident Response
export const IRPlanSec: React.FC<Props> = ({ d, sf }) => {
  const irSeverity = useDT(d, 'irSeverity', sf);
  const systemContext = useSystemContext(d);

  return (
    <div>
      <SH title="Incident Response Plan" sub="SP 800-61 Rev3 — Appendix I. Tested annually. US-CERT reporting required." />
      <div style={G2}>
        <FF label="Purpose" req>
          <TAAI
            value={d.irPurpose}
            onChange={(v) => sf('irPurpose', v)}
            rows={3}
            placeholder="This IRP establishes detection, reporting, and response procedures…"
            sectionKey="irplan"
            sectionLabel="Incident Response Plan Purpose"
            systemContext={systemContext}
          />
        </FF>
        <FF label="Scope" req>
          <TAAI
            value={d.irScope}
            onChange={(v) => sf('irScope', v)}
            rows={3}
            placeholder="Applies to all personnel, systems, data within boundary…"
            sectionKey="irplan"
            sectionLabel="Incident Response Plan Scope"
            systemContext={systemContext}
          />
        </FF>
      </div>
      <Div />
      <SubH>Severity Levels & Response SLAs</SubH>
      <DT
        cols={[
          { k: 'level', l: 'Severity', type: 'select', opts: ['Critical (1)', 'High (2)', 'Medium (3)', 'Low (4)', 'Info (5)'], w: '130px' },
          { k: 'desc', l: 'Description', ph: 'Active data exfiltration' },
          { k: 'sla', l: 'Response SLA', ph: '15 min', w: '100px' },
          { k: 'notify', l: 'Notification', ph: 'US-CERT 1hr', w: '140px' },
        ]}
        rows={irSeverity.rows}
        onAdd={irSeverity.add}
        onDel={irSeverity.del}
        onUpd={irSeverity.upd}
      />
      <Div />
      <div style={G2}>
        <FF label="US-CERT Reporting">
          <Sel value={d.certTime} onChange={(v) => sf('certTime', v)} ph="Select" options={[
            { v: '1hr', l: '1 hour (Cat 1-2)' },
            { v: '8hr', l: '8 hours (Cat 3-4)' },
            { v: '72hr', l: '72 hours (Cat 5-6)' },
          ]} />
        </FF>
        <FF label="Last IR Test">
          <TI value={d.irTestDate} onChange={(v) => sf('irTestDate', v)} placeholder="YYYY-MM-DD" mono />
        </FF>
      </div>
    </div>
  );
};

// Section 21: Configuration Management
export const CMPlanSec: React.FC<Props> = ({ d, sf }) => {
  const cmBaselines = useDT(d, 'cmBaselines', sf);
  const systemContext = useSystemContext(d);

  return (
    <div>
      <SH title="Configuration Management Plan" sub="Appendix H — Baselines, change control, deviation detection." />
      <AddedBanner tag="fedramp" ref="Appendix H" text="CIS/STIG baselines verified by assessors." />
      <FF label="CM Purpose & Scope" req span={2}>
        <TAAI
          value={d.cmPurpose}
          onChange={(v) => sf('cmPurpose', v)}
          rows={4}
          placeholder="Establishes process for managing configuration items, baselines, and changes…"
          sectionKey="cmplan"
          sectionLabel="Configuration Management Purpose & Scope"
          systemContext={systemContext}
        />
      </FF>
      <Div />
      <SubH>Configuration Baselines</SubH>
      <DT
        cols={[
          { k: 'comp', l: 'Component', ph: 'Ubuntu 22.04' },
          { k: 'bench', l: 'Benchmark', ph: 'CIS Level 1' },
          { k: 'ver', l: 'Version', ph: 'v2.0', w: '80px' },
          { k: 'pct', l: 'Compliance', ph: '97%', w: '90px' },
          { k: 'scan', l: 'Last Scan', ph: 'YYYY-MM-DD', w: '100px' },
        ]}
        rows={cmBaselines.rows}
        onAdd={cmBaselines.add}
        onDel={cmBaselines.del}
        onUpd={cmBaselines.upd}
      />
      <Div />
      <FF label="Change Control Process" span={2}>
        <TAAI
          value={d.cmChangeNarr}
          onChange={(v) => sf('cmChangeNarr', v)}
          rows={4}
          placeholder="RFC → Impact analysis → CAB review → Testing → Approval → Implementation → Post-review…"
          sectionKey="cmplan"
          sectionLabel="Change Control Process"
          systemContext={systemContext}
        />
      </FF>
    </div>
  );
};
