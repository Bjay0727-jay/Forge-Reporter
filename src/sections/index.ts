/**
 * ForgeComply 360 Reporter - Section Registry
 * Uses React.lazy() for code-splitting — each section loads on demand.
 */
import React from 'react';
import type { SSPData } from '../types';

// Section renderer type
export type SectionRenderer = React.FC<{ d: SSPData; sf: (key: string, value: unknown) => void; sspId?: string }>;

// Lazy-loaded section components
const SystemInfoSec = React.lazy(() => import('./SystemInfo').then(m => ({ default: m.SystemInfoSec })));
const FIPS199Sec = React.lazy(() => import('./FIPS199').then(m => ({ default: m.FIPS199Sec })));
const InformationTypesSec = React.lazy(() => import('./InformationTypes').then(m => ({ default: m.InformationTypesSec })));
const ControlBaselineSec = React.lazy(() => import('./ControlBaseline').then(m => ({ default: m.ControlBaselineSec })));
const RMFLifecycleSec = React.lazy(() => import('./RMFLifecycle').then(m => ({ default: m.RMFLifecycleSec })));
const BoundarySec = React.lazy(() => import('./Architecture').then(m => ({ default: m.BoundarySec })));
const DataFlowSec = React.lazy(() => import('./Architecture').then(m => ({ default: m.DataFlowSec })));
const NetworkSec = React.lazy(() => import('./Architecture').then(m => ({ default: m.NetworkSec })));
const PPSSec = React.lazy(() => import('./Architecture').then(m => ({ default: m.PPSSec })));
const InterconSec = React.lazy(() => import('./Architecture').then(m => ({ default: m.InterconSec })));
const CryptoSec = React.lazy(() => import('./Architecture').then(m => ({ default: m.CryptoSec })));
const PersonnelSec = React.lazy(() => import('./Personnel').then(m => ({ default: m.PersonnelSec })));
const IdentitySec = React.lazy(() => import('./Personnel').then(m => ({ default: m.IdentitySec })));
const SepDutySec = React.lazy(() => import('./Personnel').then(m => ({ default: m.SepDutySec })));
const ControlsSec = React.lazy(() => import('./Controls').then(m => ({ default: m.ControlsSec })));
const PoliciesSec = React.lazy(() => import('./Controls').then(m => ({ default: m.PoliciesSec })));
const SCRMSec = React.lazy(() => import('./Controls').then(m => ({ default: m.SCRMSec })));
const PrivacySec = React.lazy(() => import('./Controls').then(m => ({ default: m.PrivacySec })));
const ConPlanSec = React.lazy(() => import('./Plans').then(m => ({ default: m.ConPlanSec })));
const IRPlanSec = React.lazy(() => import('./Plans').then(m => ({ default: m.IRPlanSec })));
const CMPlanSec = React.lazy(() => import('./Plans').then(m => ({ default: m.CMPlanSec })));
const AssessSec = React.lazy(() => import('./PostAuth').then(m => ({ default: m.AssessSec })));
const AuthorizeSec = React.lazy(() => import('./PostAuth').then(m => ({ default: m.AuthorizeSec })));
const ConMonSec = React.lazy(() => import('./PostAuth').then(m => ({ default: m.ConMonSec })));
const VulnSec = React.lazy(() => import('./PostAuth').then(m => ({ default: m.VulnSec })));
const PoamSec = React.lazy(() => import('./PostAuth').then(m => ({ default: m.PoamSec })));

// Section registry mapping section IDs to their renderer components
export const SECTION_RENDERERS: Record<string, React.LazyExoticComponent<SectionRenderer>> = {
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
  vulns: VulnSec,
  poam: PoamSec,
};
