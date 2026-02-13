/**
 * Section 1: System Information
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

export const SystemInfoSec: React.FC<Props> = ({ d, sf }) => {
  const levAuths = useDT(d, 'levAuths', sf);

  // Build system context for AI
  const systemContext: SystemContext = useMemo(() => ({
    systemName: d.sysName,
    systemAcronym: d.sysAcronym,
    impactLevel: d.conf || d.integ || d.avail || 'Moderate',
    orgName: d.owningAgency,
    authType: d.authType,
    cloudModel: d.cloudModel,
    deployModel: d.deployModel,
  }), [d.sysName, d.sysAcronym, d.conf, d.integ, d.avail, d.owningAgency, d.authType, d.cloudModel, d.deployModel]);

  return (
    <div>
      <SH
        title="System Information"
        sub="Core identification of the information system for FISMA authorization. Maps to SSP \u00a71-4 and eMASS/CSAM registration."
      />
      <AddedBanner
        tag="fedramp"
        ref="SSP \u00a71-4"
        text="Every authorization package starts here. Without system identification, the AO cannot issue an authorization decision."
      />
      <div style={G2}>
        <FF label="System Name" req>
          <TI value={d.sysName} onChange={(v) => sf('sysName', v)} placeholder="e.g., ForgeComply 360 Enterprise Platform" />
        </FF>
        <FF label="System Acronym" req>
          <TI value={d.sysAcronym} onChange={(v) => sf('sysAcronym', v)} placeholder="e.g., FC360" mono />
        </FF>
        <FF label="FISMA System ID" hint="eMASS or CSAM system identifier">
          <TI value={d.fismaId} onChange={(v) => sf('fismaId', v)} placeholder="e.g., eMASS-12345" mono />
        </FF>
        <FF label="FedRAMP ID" hint="If also pursuing FedRAMP">
          <TI value={d.fedrampId} onChange={(v) => sf('fedrampId', v)} placeholder="e.g., FR-2026-XXXXX" mono />
        </FF>
        <FF label="Owning Agency / Organization" req>
          <TI value={d.owningAgency} onChange={(v) => sf('owningAgency', v)} placeholder="e.g., Department of Homeland Security" />
        </FF>
        <FF label="Agency Component">
          <TI value={d.agencyComp} onChange={(v) => sf('agencyComp', v)} placeholder="e.g., Cybersecurity and Infrastructure Security Agency (CISA)" />
        </FF>
      </div>
      <FF label="System Description" req span={2} hint="Purpose, functions, data processed (min 200 words)">
        <TAAI
          value={d.sysDesc}
          onChange={(v) => sf('sysDesc', v)}
          rows={6}
          placeholder="Describe the system — purpose, users, data types, operational context…"
          sectionKey="sysinfo"
          sectionLabel="System Description"
          systemContext={systemContext}
        />
      </FF>
      <Div />
      <div style={G2}>
        <FF label="Cloud Service Model">
          <Sel value={d.cloudModel} onChange={(v) => sf('cloudModel', v)} ph="Select" options={[
            { v: 'SaaS', l: 'SaaS' },
            { v: 'PaaS', l: 'PaaS' },
            { v: 'IaaS', l: 'IaaS' },
            { v: 'hybrid', l: 'Hybrid' },
            { v: 'on-prem', l: 'On-Premises (Non-Cloud)' },
          ]} />
        </FF>
        <FF label="Deployment Model">
          <Sel value={d.deployModel} onChange={(v) => sf('deployModel', v)} ph="Select" options={[
            { v: 'public', l: 'Public Cloud' },
            { v: 'private', l: 'Private Cloud' },
            { v: 'community', l: 'Government Community' },
            { v: 'hybrid', l: 'Hybrid' },
            { v: 'on-prem', l: 'On-Premises / Air-Gapped' },
          ]} />
        </FF>
        <FF label="Authorization Type" req>
          <Sel value={d.authType} onChange={(v) => sf('authType', v)} ph="Select" options={[
            { v: 'fisma-agency', l: 'FISMA Agency ATO' },
            { v: 'fisma-ongoing', l: 'FISMA Ongoing Authorization' },
            { v: 'fedramp-jab', l: 'FedRAMP JAB P-ATO' },
            { v: 'fedramp-agency', l: 'FedRAMP Agency ATO' },
            { v: 'dod-rmf', l: 'DoD RMF ATO (DoDI 8510.01)' },
            { v: 'iatt', l: 'Interim ATO (IATT)' },
          ]} />
        </FF>
        <FF label="Authorization Duration">
          <Sel value={d.authDuration} onChange={(v) => sf('authDuration', v)} ph="Select" options={[
            { v: '3yr', l: '3 Years (Standard FISMA)' },
            { v: '1yr', l: '1 Year (IATT)' },
            { v: 'ongoing', l: 'Ongoing Authorization' },
            { v: 'custom', l: 'Custom Period' },
          ]} />
        </FF>
        <FF label="Target Auth System">
          <Sel value={d.authSystem} onChange={(v) => sf('authSystem', v)} ph="Select" options={[
            { v: 'emass', l: 'eMASS (DoD)' },
            { v: 'csam', l: 'CSAM (Civilian)' },
            { v: 'xacta', l: 'Xacta' },
            { v: 'other', l: 'Other' },
          ]} />
        </FF>
        <FF label="Operational Date">
          <TI value={d.opDate} onChange={(v) => sf('opDate', v)} placeholder="YYYY-MM-DD" mono />
        </FF>
      </div>
      <Div />
      <SubH>Leveraged Authorizations</SubH>
      <DT
        cols={[
          { k: 'name', l: 'Service/CSP', ph: 'e.g., AWS GovCloud' },
          { k: 'id', l: 'Auth ID', ph: 'FR-xxxx', mono: true, w: '120px' },
          { k: 'type', l: 'Type', type: 'select', opts: ['FedRAMP', 'FISMA', 'DoD RMF', 'StateRAMP'], w: '110px' },
          { k: 'impact', l: 'Impact', type: 'select', opts: ['Low', 'Moderate', 'High'], w: '100px' },
        ]}
        rows={levAuths.rows}
        onAdd={levAuths.add}
        onDel={levAuths.del}
        onUpd={levAuths.upd}
      />
    </div>
  );
};
