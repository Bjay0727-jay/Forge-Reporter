/**
 * Architecture Sections (6-11)
 */
import React, { useMemo } from 'react';
import type { SSPData } from '../types';
import { FF, TI, Sel, SH, Div, G2, SubH, UploadZone, TAAI } from '../components/FormComponents';
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
    authType: d.authType,
    cloudModel: d.cloudModel,
    deployModel: d.deployModel,
  }), [d.sysName, d.sysAcronym, d.conf, d.integ, d.avail, d.owningAgency, d.authType, d.cloudModel, d.deployModel]);
};

// Section 6: Authorization Boundary
export const BoundarySec: React.FC<Props> = ({ d, sf }) => {
  const bndComps = useDT(d, 'bndComps', sf);
  const systemContext = useSystemContext(d);

  return (
    <div>
      <SH title="Authorization Boundary" sub="All components within the scope of authorization. Must align with network diagram and data flow diagram." />
      <FF label="Boundary Narrative" req span={2}>
        <TAAI
          value={d.bndNarr}
          onChange={(v) => sf('bndNarr', v)}
          rows={6}
          placeholder="The authorization boundary encompasses all infrastructure and data stores…"
          sectionKey="boundary"
          sectionLabel="Authorization Boundary Narrative"
          systemContext={systemContext}
        />
      </FF>
      <UploadZone icon="🗺️" title="Authorization Boundary Diagram (ABD)" sub="Upload diagram with color/line legend per FedRAMP ABD Guidance" />
      <Div />
      <SubH>Boundary Components</SubH>
      <DT
        cols={[
          { k: 'name', l: 'Component', ph: 'e.g., API Gateway' },
          { k: 'type', l: 'Type', type: 'select', opts: ['Server', 'Database', 'Network Device', 'Load Balancer', 'WAF', 'API Gateway', 'Storage', 'CDN', 'Serverless', 'Container', 'Other'], w: '140px' },
          { k: 'zone', l: 'Zone', type: 'select', opts: ['DMZ', 'Internal', 'Management', 'Data', 'External', 'Cloud', 'Edge'], w: '110px' },
          { k: 'purpose', l: 'Purpose', ph: 'Brief description' },
        ]}
        rows={bndComps.rows}
        onAdd={bndComps.add}
        onDel={bndComps.del}
        onUpd={bndComps.upd}
      />
    </div>
  );
};

// Section 7: Data Flow
export const DataFlowSec: React.FC<Props> = ({ d, sf }) => {
  const systemContext = useSystemContext(d);

  return (
    <div>
      <SH title="Data Flow" sub="How federal data flows to, from, and within the system. Must align with Appendix Q DIT reference numbers." />
      <FF label="Data Flow Narrative" req span={2}>
        <TAAI
          value={d.dfNarr}
          onChange={(v) => sf('dfNarr', v)}
          rows={7}
          placeholder="Federal data enters through TLS 1.3 encrypted connections…"
          sectionKey="dataflow"
          sectionLabel="Data Flow Narrative"
          systemContext={systemContext}
        />
      </FF>
      <UploadZone icon="🔁" title="Data Flow Diagram (DFD)" sub="Show data paths with DIT ref numbers, encryption points, trust boundaries" />
      <Div />
      <div style={G2}>
        <FF label="Encryption at Rest" req>
          <TI value={d.encRest} onChange={(v) => sf('encRest', v)} placeholder="e.g., AES-256-GCM (FIPS 140-2)" />
        </FF>
        <FF label="Encryption in Transit" req>
          <TI value={d.encTransit} onChange={(v) => sf('encTransit', v)} placeholder="e.g., TLS 1.3, mTLS" />
        </FF>
        <FF label="Key Management">
          <TI value={d.keyMgmt} onChange={(v) => sf('keyMgmt', v)} placeholder="e.g., BYOK via AWS KMS" />
        </FF>
        <FF label="Data Disposal">
          <Sel value={d.dataDisposal} onChange={(v) => sf('dataDisposal', v)} ph="Select" options={[
            { v: 'crypto', l: 'Cryptographic Erasure' },
            { v: 'overwrite', l: 'NIST 800-88 Overwrite' },
            { v: 'physical', l: 'Physical Destruction' },
          ]} />
        </FF>
      </div>
    </div>
  );
};

// Section 8: Network Architecture
export const NetworkSec: React.FC<Props> = ({ d, sf }) => {
  const netZones = useDT(d, 'netZones', sf);
  const systemContext = useSystemContext(d);

  return (
    <div>
      <SH title="Network Architecture" sub="Network topology, zones, segmentation. Must align with ABD and DFD." />
      <FF label="Network Narrative" req span={2}>
        <TAAI
          value={d.netNarr}
          onChange={(v) => sf('netNarr', v)}
          rows={6}
          placeholder="Multi-tier network architecture with strict zone separation…"
          sectionKey="network"
          sectionLabel="Network Architecture Narrative"
          systemContext={systemContext}
        />
      </FF>
      <UploadZone icon="🌐" title="Network Diagram" sub="Upload topology showing zones, firewalls, segmentation" />
      <Div />
      <SubH>Network Zones</SubH>
      <DT
        cols={[
          { k: 'zone', l: 'Zone', ph: 'e.g., DMZ' },
          { k: 'purpose', l: 'Purpose', ph: 'Public-facing services' },
          { k: 'controls', l: 'Security Controls', ph: 'WAF, IDS/IPS' },
          { k: 'subnet', l: 'Subnet', ph: '10.0.1.0/24', mono: true, w: '120px' },
        ]}
        rows={netZones.rows}
        onAdd={netZones.add}
        onDel={netZones.del}
        onUpd={netZones.upd}
      />
      <Div />
      <div style={G2}>
        <FF label="Primary DC" req>
          <TI value={d.primaryDC} onChange={(v) => sf('primaryDC', v)} placeholder="e.g., Cloudflare Edge, AWS us-gov-west-1" />
        </FF>
        <FF label="DR Location">
          <TI value={d.secondaryDC} onChange={(v) => sf('secondaryDC', v)} placeholder="e.g., AWS us-gov-east-1" />
        </FF>
      </div>
    </div>
  );
};

// Section 9: Ports, Protocols & Services
export const PPSSec: React.FC<Props> = ({ d, sf }) => {
  const ppsRows = useDT(d, 'ppsRows', sf);
  return (
    <div>
      <SH title="Ports, Protocols & Services" sub="All PPS within or crossing the authorization boundary. DIT ref numbers must match Appendix Q." />
      <AddedBanner tag="fedramp" ref="SSP §9" text="3PAOs use this to validate firewall rules. Rev5 DIT reference numbers link to Appendix Q." />
      <DT
        cols={[
          { k: 'port', l: 'Port(s)', ph: '443', w: '75px', mono: true },
          { k: 'proto', l: 'Protocol', type: 'select', opts: ['TCP', 'UDP', 'TCP/UDP', 'ICMP'], w: '90px' },
          { k: 'svc', l: 'Service', ph: 'HTTPS' },
          { k: 'purpose', l: 'Purpose', ph: 'Encrypted web traffic' },
          { k: 'dir', l: 'Dir', type: 'select', opts: ['In', 'Out', 'Internal', 'Bi'], w: '80px' },
          { k: 'dit', l: 'DIT Ref', ph: 'Q-001', w: '70px', mono: true },
        ]}
        rows={ppsRows.rows}
        onAdd={ppsRows.add}
        onDel={ppsRows.del}
        onUpd={ppsRows.upd}
      />
    </div>
  );
};

// Section 10: System Interconnections
export const InterconSec: React.FC<Props> = ({ d, sf }) => {
  const icRows = useDT(d, 'icRows', sf);
  const systemContext = useSystemContext(d);

  return (
    <div>
      <SH title="System Interconnections" sub="External systems with ISA/MOU documentation." />
      <DT
        cols={[
          { k: 'sys', l: 'External System', ph: 'e.g., eMASS' },
          { k: 'org', l: 'Organization', ph: 'DISA' },
          { k: 'conn', l: 'Connection', type: 'select', opts: ['API/HTTPS', 'VPN', 'Direct', 'Peering', 'mTLS', 'Other'], w: '120px' },
          { k: 'dir', l: 'Dir', type: 'select', opts: ['In', 'Out', 'Bi'], w: '70px' },
          { k: 'data', l: 'Data', ph: 'OSCAL JSON' },
          { k: 'isa', l: 'ISA/MOU', type: 'select', opts: ['Approved', 'Pending', 'Draft', 'N/A'], w: '95px' },
        ]}
        rows={icRows.rows}
        onAdd={icRows.add}
        onDel={icRows.del}
        onUpd={icRows.upd}
      />
      <div style={{ marginTop: 16 }}>
        <FF label="ISA Notes">
          <TAAI
            value={d.icNotes}
            onChange={(v) => sf('icNotes', v)}
            rows={3}
            placeholder="All interconnections use TLS 1.3 minimum…"
            sectionKey="intercon"
            sectionLabel="System Interconnections Notes"
            systemContext={systemContext}
          />
        </FF>
      </div>
    </div>
  );
};

// Section 11: Cryptographic Modules
export const CryptoSec: React.FC<Props> = ({ d, sf }) => {
  const cryptoMods = useDT(d, 'cryptoMods', sf);
  const systemContext = useSystemContext(d);

  return (
    <div>
      <SH title="Cryptographic Modules" sub="Rev5 Appendix Q — All crypto modules for DAR, DIT, DIU with FIPS 140-2/3 validation." />
      <AddedBanner tag="fedramp" ref="Appendix Q (Rev5)" text="New in Rev5. FIPS 140-2/3 validation verified by assessors for every encryption point." />
      <FF label="Cryptographic Narrative" req span={2}>
        <TAAI
          value={d.cryptoNarr}
          onChange={(v) => sf('cryptoNarr', v)}
          rows={4}
          placeholder="All operations use FIPS 140-2 validated modules…"
          sectionKey="crypto"
          sectionLabel="Cryptographic Protection Narrative"
          systemContext={systemContext}
        />
      </FF>
      <Div />
      <SubH>Module Inventory</SubH>
      <DT
        cols={[
          { k: 'mod', l: 'Module', ph: 'OpenSSL 3.0 FIPS' },
          { k: 'cert', l: 'FIPS Cert#', ph: '#4282', w: '100px', mono: true },
          { k: 'level', l: 'Level', type: 'select', opts: ['Level 1', 'Level 2', 'Level 3', 'Pending'], w: '90px' },
          { k: 'usage', l: 'Usage', type: 'select', opts: ['DAR', 'DIT', 'DIU', 'DAR+DIT', 'All'], w: '95px' },
          { k: 'where', l: 'Where Used', ph: 'Database encryption' },
        ]}
        rows={cryptoMods.rows}
        onAdd={cryptoMods.add}
        onDel={cryptoMods.del}
        onUpd={cryptoMods.upd}
      />
    </div>
  );
};
