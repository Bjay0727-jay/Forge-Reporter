/**
 * ForgeComply 360 Reporter - 23 FISMA SSP Sections
 * Based on FedRAMP Rev5 + FISMA/RMF requirements
 */

export type SectionTag = 'original' | 'fedramp' | 'fisma';
export type SectionGroup = 'Frontmatter' | 'Architecture' | 'Personnel' | 'Controls' | 'Plans' | 'Post-Auth';
export type RMFStep = 'Prepare' | 'Categorize' | 'Select' | 'Implement' | 'Assess' | 'Authorize' | 'Monitor' | 'All Steps';

export interface Section {
  id: string;
  label: string;
  icon: string;
  ref: string;
  grp: SectionGroup;
  tag: SectionTag;
  rmf: RMFStep;
  description?: string;
  bannerText?: string;
}

export const SECTIONS: Section[] = [
  // FRONTMATTER (RMF Steps 1-3)
  {
    id: 'sysinfo',
    label: 'System Information',
    icon: '📋',
    ref: 'SSP §1-4',
    grp: 'Frontmatter',
    tag: 'fedramp',
    rmf: 'Prepare',
    description: 'Core identification of the information system for FISMA authorization',
    bannerText: 'Every authorization package starts here. Without system identification, the AO cannot issue an authorization decision.'
  },
  {
    id: 'fips199',
    label: 'FIPS 199 Categorization',
    icon: '🏷️',
    ref: 'FIPS 199 / SP 800-60',
    grp: 'Frontmatter',
    tag: 'original',
    rmf: 'Categorize',
    description: 'Security categorization per FIPS 199'
  },
  {
    id: 'infotypes',
    label: 'Information Types',
    icon: '📂',
    ref: 'Appendix K',
    grp: 'Frontmatter',
    tag: 'fedramp',
    rmf: 'Categorize',
    description: 'NIST SP 800-60 information type mapping',
    bannerText: '3PAOs validate that FIPS 199 categorization is supported by documented SP 800-60 information types.'
  },
  {
    id: 'baseline',
    label: 'Control Baseline',
    icon: '🎯',
    ref: 'SP 800-53B',
    grp: 'Frontmatter',
    tag: 'original',
    rmf: 'Select',
    description: 'Selected control baseline and tailoring'
  },
  {
    id: 'rmf',
    label: 'RMF Lifecycle Tracker',
    icon: '🔄',
    ref: 'SP 800-37 Rev2',
    grp: 'Frontmatter',
    tag: 'fisma',
    rmf: 'All Steps',
    description: 'RMF step progress and artifacts',
    bannerText: 'FISMA requires explicit tracking of RMF lifecycle. The AO needs to see which step the system is in and what artifacts are complete before issuing an authorization decision.'
  },
  // ARCHITECTURE
  {
    id: 'boundary',
    label: 'Authorization Boundary',
    icon: '🗺️',
    ref: 'SSP §8',
    grp: 'Architecture',
    tag: 'original',
    rmf: 'Implement',
    description: 'System boundary definition'
  },
  {
    id: 'dataflow',
    label: 'Data Flow',
    icon: '🔁',
    ref: 'SSP §8.2',
    grp: 'Architecture',
    tag: 'original',
    rmf: 'Implement',
    description: 'Data flow diagrams and descriptions'
  },
  {
    id: 'network',
    label: 'Network Architecture',
    icon: '🌐',
    ref: 'SSP §8.1',
    grp: 'Architecture',
    tag: 'original',
    rmf: 'Implement',
    description: 'Network topology and zones'
  },
  {
    id: 'pps',
    label: 'Ports, Protocols & Services',
    icon: '🔌',
    ref: 'SSP §9',
    grp: 'Architecture',
    tag: 'fedramp',
    rmf: 'Implement',
    description: 'PPS inventory per Appendix Q',
    bannerText: '3PAOs use this to validate firewall rules. Rev5 DIT reference numbers link to Appendix Q.'
  },
  {
    id: 'intercon',
    label: 'System Interconnections',
    icon: '🔗',
    ref: 'SSP §10-11',
    grp: 'Architecture',
    tag: 'original',
    rmf: 'Implement',
    description: 'External connections and ISAs'
  },
  {
    id: 'crypto',
    label: 'Cryptographic Modules',
    icon: '🔐',
    ref: 'Appendix Q',
    grp: 'Architecture',
    tag: 'fedramp',
    rmf: 'Implement',
    description: 'FIPS 140 validated modules',
    bannerText: 'New in Rev5. FIPS 140-2/3 validation verified by assessors for every encryption point.'
  },
  // PERSONNEL & IDENTITY
  {
    id: 'personnel',
    label: 'Personnel & Roles',
    icon: '👥',
    ref: 'SSP §9.1-9.4',
    grp: 'Personnel',
    tag: 'original',
    rmf: 'Prepare',
    description: 'Key security roles'
  },
  {
    id: 'identity',
    label: 'Digital Identity',
    icon: '🪪',
    ref: 'Appendix E / SP 800-63',
    grp: 'Personnel',
    tag: 'fedramp',
    rmf: 'Implement',
    description: 'SP 800-63 IAL/AAL/FAL levels',
    bannerText: 'FedRAMP/FISMA require IAL/AAL/FAL. Most federal systems require AAL2 (MFA) minimum.'
  },
  {
    id: 'sepduty',
    label: 'Separation of Duties',
    icon: '⚖️',
    ref: 'AC-5 / FISMA',
    grp: 'Personnel',
    tag: 'fisma',
    rmf: 'Implement',
    description: 'AC-5 role conflict matrix',
    bannerText: 'Assessors verify no single person holds conflicting roles (e.g., developer + deployer + auditor). FISMA audits consistently flag missing separation of duties documentation.'
  },
  // CONTROLS & POLICIES
  {
    id: 'controls',
    label: 'Control Implementations',
    icon: '🛡️',
    ref: 'Appendix A',
    grp: 'Controls',
    tag: 'original',
    rmf: 'Implement',
    description: 'Control narrative statements'
  },
  {
    id: 'policies',
    label: 'Security Policies & Procedures',
    icon: '📜',
    ref: 'Appendix C / All -1 Controls',
    grp: 'Controls',
    tag: 'fisma',
    rmf: 'Implement',
    description: 'Per-family policy mappings',
    bannerText: 'Missing policies = every \'-1\' control fails assessment. This is the #1 finding in FISMA audits. Each of the 20 control families requires at minimum one policy document.'
  },
  {
    id: 'scrm',
    label: 'Supply Chain Risk Mgmt',
    icon: '🏭',
    ref: 'SP 800-161 / SR Family',
    grp: 'Controls',
    tag: 'fisma',
    rmf: 'Implement',
    description: 'SCRM and SBOM tracking',
    bannerText: 'Rev5 added the SR family as mandatory for moderate/high baselines. EO 14028 requires SBOM for all software sold to the government.'
  },
  {
    id: 'privacy',
    label: 'Privacy Analysis (PTA/PIA)',
    icon: '👁️',
    ref: 'E-Gov Act §208 / PT Family',
    grp: 'Controls',
    tag: 'fisma',
    rmf: 'Implement',
    description: 'PTA/PIA documentation',
    bannerText: 'FISMA mandates privacy analysis for PII systems. Rev5 added the PT (PII Processing & Transparency) family. A system processing PII without PTA/PIA will NOT receive a FISMA ATO.'
  },
  // PLANS
  {
    id: 'conplan',
    label: 'Contingency Plan',
    icon: '🔃',
    ref: 'Appendix G / SP 800-34',
    grp: 'Plans',
    tag: 'original',
    rmf: 'Implement',
    description: 'ISCP summary (SP 800-34)'
  },
  {
    id: 'irplan',
    label: 'Incident Response',
    icon: '🚨',
    ref: 'Appendix I / SP 800-61',
    grp: 'Plans',
    tag: 'original',
    rmf: 'Implement',
    description: 'IR plan summary (SP 800-61)'
  },
  {
    id: 'cmplan',
    label: 'Configuration Management',
    icon: '⚙️',
    ref: 'Appendix H',
    grp: 'Plans',
    tag: 'fedramp',
    rmf: 'Implement',
    description: 'CM plan and baselines',
    bannerText: 'CIS/STIG baselines verified by assessors. Document change control process and baseline configurations.'
  },
  // POST-AUTH (RMF Steps 5-7)
  {
    id: 'conmon',
    label: 'Continuous Monitoring & ISCM',
    icon: '📡',
    ref: 'SP 800-137 / RMF Step 7',
    grp: 'Post-Auth',
    tag: 'original',
    rmf: 'Monitor',
    description: 'ISCM strategy (SP 800-137)'
  },
  {
    id: 'poam',
    label: 'POA&M',
    icon: '📊',
    ref: 'Appendix O',
    grp: 'Post-Auth',
    tag: 'fedramp',
    rmf: 'Monitor',
    description: 'Weakness tracking',
    bannerText: 'Living document updated monthly. AO reviews POA&M as part of Ongoing Authorization determination.'
  },
];

export const SECTION_GROUPS: SectionGroup[] = [
  'Frontmatter',
  'Architecture',
  'Personnel',
  'Controls',
  'Plans',
  'Post-Auth',
];

export const RMF_STEPS: RMFStep[] = [
  'Prepare',
  'Categorize',
  'Select',
  'Implement',
  'Assess',
  'Authorize',
  'Monitor',
];
