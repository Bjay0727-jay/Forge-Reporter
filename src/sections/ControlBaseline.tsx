/**
 * Section 4: Control Baseline
 */
import React from 'react';
import type { SSPData } from '../types';
import { FF, TA, Sel, SH, Div, G2, SubH } from '../components/FormComponents';
import { DT, useDT } from '../components/DynamicTable';

interface Props {
  d: SSPData;
  sf: (key: string, value: unknown) => void;
}

export const ControlBaselineSec: React.FC<Props> = ({ d, sf }) => {
  const tailorRows = useDT(d, 'tailorRows', sf);

  return (
    <div>
      <SH
        title="Control Baseline"
        sub="RMF Step 3: Select. Choose the applicable baseline and document any tailoring or overlays."
      />
      <div style={G2}>
        <FF label="Control Baseline" req>
          <Sel value={d.ctrlBaseline} onChange={(v) => sf('ctrlBaseline', v)} ph="Select" options={[
            { v: 'fedramp-low', l: 'FedRAMP Low (156)' },
            { v: 'fedramp-mod', l: 'FedRAMP Moderate (325)' },
            { v: 'fedramp-high', l: 'FedRAMP High (421)' },
            { v: 'nist-low', l: 'NIST 800-53 Low' },
            { v: 'nist-mod', l: 'NIST 800-53 Moderate' },
            { v: 'nist-high', l: 'NIST 800-53 High' },
            { v: 'cmmc-l1', l: 'CMMC Level 1 (17)' },
            { v: 'cmmc-l2', l: 'CMMC Level 2 (110)' },
            { v: 'cmmc-l3', l: 'CMMC Level 3 (134)' },
            { v: 'dod-il4', l: 'DoD SRG IL4' },
            { v: 'dod-il5', l: 'DoD SRG IL5' },
            { v: 'txramp', l: 'TX-RAMP Level 2' },
          ]} />
        </FF>
        <FF label="Tailoring / Overlay">
          <Sel value={d.tailoring} onChange={(v) => sf('tailoring', v)} ph="None" options={[
            { v: 'none', l: 'No Tailoring' },
            { v: 'dod-srg', l: 'DoD Cloud SRG' },
            { v: 'privacy', l: 'Privacy Overlay' },
            { v: 'cnssi1253', l: 'CNSSI 1253 (NSS)' },
            { v: 'custom', l: 'Custom Overlay' },
          ]} />
        </FF>
      </div>
      <FF label="Baseline Justification" req span={2}>
        <TA
          value={d.baseJust}
          onChange={(v) => sf('baseJust', v)}
          rows={4}
          placeholder="FedRAMP Moderate was selected because the system processes federal CUI\u2026"
        />
      </FF>
      <Div />
      <SubH>Tailoring Decisions</SubH>
      <DT
        cols={[
          { k: 'ctrl', l: 'Control', ph: 'PE-3', w: '90px', mono: true },
          { k: 'dec', l: 'Decision', type: 'select', opts: ['Applied', 'Tailored Out', 'Compensating', 'Inherited', 'Common Control'], w: '150px' },
          { k: 'rat', l: 'Rationale', ph: 'Justification' },
        ]}
        rows={tailorRows.rows}
        onAdd={tailorRows.add}
        onDel={tailorRows.del}
        onUpd={tailorRows.upd}
      />
    </div>
  );
};
