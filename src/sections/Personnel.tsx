/**
 * Personnel & Identity Sections (12-14)
 */
import React from 'react';
import type { SSPData } from '../types';
import { FF, TI, TA, Sel, SH, Div, G2, SubH } from '../components/FormComponents';
import { DT, useDT } from '../components/DynamicTable';
import { AddedBanner } from '../components/AddedBanner';
import { C } from '../config/colors';

interface Props {
  d: SSPData;
  sf: (key: string, value: unknown) => void;
}

// Section 12: Personnel & Roles
export const PersonnelSec: React.FC<Props> = ({ d, sf }) => {
  const addContacts = useDT(d, 'addContacts', sf);
  const roles = [
    { k: 'so', l: 'System Owner', ref: '§9.1' },
    { k: 'ao', l: 'Authorizing Official (AO)', ref: '§9.2' },
    { k: 'isso', l: 'ISSO', ref: '§9.3' },
    { k: 'issm', l: 'ISSM', ref: '§9.4' },
    { k: 'sca', l: 'Security Control Assessor (SCA)', ref: 'SP 800-37' },
    { k: 'po', l: 'Privacy Officer', ref: 'E-Gov Act' },
  ];

  return (
    <div>
      <SH title="Personnel & Roles" sub="Key personnel for the FISMA authorization. Includes SCA and Privacy Officer for RMF compliance." />
      {roles.map((r) => (
        <div key={r.k} style={{
          background: C.surface,
          borderRadius: 10,
          padding: 16,
          marginBottom: 10,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.primary }}>{r.l}</h4>
            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "'Fira Code', monospace" }}>{r.ref}</span>
          </div>
          <div style={G2}>
            <FF label="Name" req>
              <TI value={d[`${r.k}Name` as keyof SSPData] as string} onChange={(v) => sf(`${r.k}Name`, v)} placeholder="First Last" />
            </FF>
            <FF label="Email" req>
              <TI value={d[`${r.k}Email` as keyof SSPData] as string} onChange={(v) => sf(`${r.k}Email`, v)} placeholder="name@agency.gov" />
            </FF>
          </div>
        </div>
      ))}
      <Div />
      <SubH>Additional Contacts</SubH>
      <DT
        cols={[
          { k: 'name', l: 'Name', ph: 'Full name' },
          { k: 'role', l: 'Role', type: 'select', opts: ['ISSO Alt', 'CIO', 'CISO', 'IR Lead', 'CM Lead', 'Help Desk', 'Other'], w: '130px' },
          { k: 'email', l: 'Email', ph: 'email@org.gov' },
          { k: 'phone', l: 'Phone', ph: '(555) 000-0000', w: '130px' },
        ]}
        rows={addContacts.rows}
        onAdd={addContacts.add}
        onDel={addContacts.del}
        onUpd={addContacts.upd}
      />
    </div>
  );
};

// Section 13: Digital Identity
export const IdentitySec: React.FC<Props> = ({ d, sf }) => (
  <div>
    <SH title="Digital Identity Determination" sub="NIST SP 800-63-3 IAL/AAL/FAL levels." />
    <AddedBanner tag="fedramp" ref="Appendix E / SP 800-63-3" text="FedRAMP/FISMA require IAL/AAL/FAL. Most federal requires AAL2 (MFA)." />
    <div style={G2}>
      <FF label="IAL" req hint="Identity proofing">
        <Sel value={d.ial} onChange={(v) => sf('ial', v)} ph="Select" options={[
          { v: '1', l: 'IAL1 — Self-asserted' },
          { v: '2', l: 'IAL2 — Remote/in-person proofing' },
          { v: '3', l: 'IAL3 — In-person + verification' },
        ]} />
      </FF>
      <FF label="AAL" req hint="Authentication">
        <Sel value={d.aal} onChange={(v) => sf('aal', v)} ph="Select" options={[
          { v: '1', l: 'AAL1 — Single-factor' },
          { v: '2', l: 'AAL2 — MFA' },
          { v: '3', l: 'AAL3 — Hardware crypto' },
        ]} />
      </FF>
      <FF label="FAL" hint="Federation">
        <Sel value={d.fal} onChange={(v) => sf('fal', v)} ph="Select" options={[
          { v: '1', l: 'FAL1 — Bearer' },
          { v: '2', l: 'FAL2 — Holder-of-key' },
          { v: 'na', l: 'N/A' },
        ]} />
      </FF>
      <FF label="MFA Methods">
        <TI value={d.mfaMethods} onChange={(v) => sf('mfaMethods', v)} placeholder="PIV/CAC, TOTP, FIDO2/WebAuthn" />
      </FF>
    </div>
    <Div />
    <FF label="Digital Identity Narrative" span={2}>
      <TA value={d.idNarr} onChange={(v) => sf('idNarr', v)} rows={4} placeholder="AAL2 multi-factor authentication with TOTP + WebAuthn…" />
    </FF>
  </div>
);

// Section 14: Separation of Duties
export const SepDutySec: React.FC<Props> = ({ d, sf }) => {
  const sepDutyMatrix = useDT(d, 'sepDutyMatrix', sf);
  return (
    <div>
      <SH title="Separation of Duties" sub="AC-5 — Document role separation to prevent conflicts of interest. Required for FISMA authorization packages." />
      <AddedBanner tag="fisma" ref="AC-5 / FISMA" text="Assessors verify no single person holds conflicting roles (e.g., developer + deployer + auditor). FISMA audits consistently flag missing separation of duties documentation." />
      <SubH>Role Separation Matrix</SubH>
      <DT
        cols={[
          { k: 'role', l: 'Role', type: 'select', opts: ['System Admin', 'Security Admin', 'Auditor', 'Developer', 'Operator', 'DBA', 'Network Admin', 'Help Desk', 'AO', 'ISSO', 'SCA'], w: '140px' },
          { k: 'access', l: 'Access Level', type: 'select', opts: ['Full Admin', 'Privileged', 'Standard', 'Read-Only', 'Audit-Only'], w: '120px' },
          { k: 'prohibited', l: 'Cannot Also Hold', ph: 'e.g., Developer, Deployer' },
          { k: 'justification', l: 'Justification', ph: 'e.g., Prevent unauthorized code deployment' },
        ]}
        rows={sepDutyMatrix.rows}
        onAdd={sepDutyMatrix.add}
        onDel={sepDutyMatrix.del}
        onUpd={sepDutyMatrix.upd}
      />
      <Div />
      <div style={G2}>
        <FF label="Dual-Control Operations" hint="Operations requiring two-person integrity">
          <TA value={d.dualControl} onChange={(v) => sf('dualControl', v)} rows={3} placeholder="• Encryption key ceremonies require two key custodians\n• Production deployments require developer + separate approver\n• Database schema changes require DBA + ISSO approval" />
        </FF>
        <FF label="Privileged Access Justification" hint="Why privileged accounts exist and how they're controlled">
          <TA value={d.privAccess} onChange={(v) => sf('privAccess', v)} rows={3} placeholder="Privileged accounts are limited to System Admins and Security Admins. All privileged access uses MFA, session recording, and just-in-time provisioning…" />
        </FF>
      </div>
    </div>
  );
};
