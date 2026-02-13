/**
 * Section 3: Information Types
 */
import React from 'react';
import type { SSPData } from '../types';
import { FF, TA, SH } from '../components/FormComponents';
import { DT, useDT } from '../components/DynamicTable';
import { AddedBanner } from '../components/AddedBanner';

interface Props {
  d: SSPData;
  sf: (key: string, value: unknown) => void;
}

export const InformationTypesSec: React.FC<Props> = ({ d, sf }) => {
  const infoTypes = useDT(d, 'infoTypes', sf);

  return (
    <div>
      <SH
        title="Information Types"
        sub="NIST SP 800-60 Vol II information types. RMF Step 2: Categorize. Provides evidentiary basis for FIPS 199."
      />
      <AddedBanner
        tag="fedramp"
        ref="Appendix K / SP 800-60"
        text="3PAOs validate that FIPS 199 categorization is supported by documented information types."
      />
      <DT
        cols={[
          { k: 'nistId', l: '800-60 ID', ph: 'e.g., D.1.1', w: '110px', mono: true },
          { k: 'name', l: 'Information Type', ph: 'e.g., Administrative Management' },
          { k: 'c', l: 'C', type: 'select', opts: ['Low', 'Moderate', 'High'], w: '90px' },
          { k: 'i', l: 'I', type: 'select', opts: ['Low', 'Moderate', 'High'], w: '90px' },
          { k: 'a', l: 'A', type: 'select', opts: ['Low', 'Moderate', 'High'], w: '90px' },
        ]}
        rows={infoTypes.rows}
        onAdd={infoTypes.add}
        onDel={infoTypes.del}
        onUpd={infoTypes.upd}
      />
      <div style={{ marginTop: 16 }}>
        <FF label="Justification">
          <TA
            value={d.infoTypeJust}
            onChange={(v) => sf('infoTypeJust', v)}
            rows={3}
            placeholder="Information types selected per NIST SP 800-60 Volume II\u2026"
          />
        </FF>
      </div>
    </div>
  );
};
