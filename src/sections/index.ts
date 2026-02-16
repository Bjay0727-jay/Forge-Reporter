/**
 * ForgeComply 360 Reporter - Section Registry
 */
import React from 'react';
import type { SSPData } from '../types';

// Import all section components
import { SystemInfoSec } from './SystemInfo';
import { FIPS199Sec } from './FIPS199';
import { InformationTypesSec } from './InformationTypes';
import { ControlBaselineSec } from './ControlBaseline';
import { RMFLifecycleSec } from './RMFLifecycle';
import { BoundarySec, DataFlowSec, NetworkSec, PPSSec, InterconSec, CryptoSec } from './Architecture';
import { PersonnelSec, IdentitySec, SepDutySec } from './Personnel';
import { ControlsSec, PoliciesSec, SCRMSec, PrivacySec } from './Controls';
import { ConPlanSec, IRPlanSec, CMPlanSec } from './Plans';
import { AssessSec, AuthorizeSec, ConMonSec, PoamSec } from './PostAuth';

// Section renderer type
export type SectionRenderer = React.FC<{ d: SSPData; sf: (key: string, value: unknown) => void }>;

// Section registry mapping section IDs to their renderer components
export const SECTION_RENDERERS: Record<string, SectionRenderer> = {
  sysinfo: SystemInfoSec,
  fips199: FIPS199Sec,
  infotypes: InformationTypesSec,
  baseline: ControlBaselineSec,
  rmf: RMFLifecycleSec,
  boundary: BoundarySec,
  dataflow: DataFlowSec,
  network: NetworkSec,
  pps: PPSSec,
  intercon: InterconSec,
  crypto: CryptoSec,
  personnel: PersonnelSec,
  identity: IdentitySec,
  sepduty: SepDutySec,
  controls: ControlsSec,
  policies: PoliciesSec,
  scrm: SCRMSec,
  privacy: PrivacySec,
  conplan: ConPlanSec,
  irplan: IRPlanSec,
  cmplan: CMPlanSec,
  assess: AssessSec,
  authorize: AuthorizeSec,
  conmon: ConMonSec,
  poam: PoamSec,
};
