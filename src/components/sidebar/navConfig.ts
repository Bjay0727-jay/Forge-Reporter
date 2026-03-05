/** Navigation group configuration */
export const NAV_GROUPS = [
  { id: 'getting-started', label: 'Getting Started', sectionIds: ['sysinfo', 'fips199', 'infotypes', 'baseline', 'rmf'] },
  { id: 'architecture', label: 'Architecture', sectionIds: ['boundary', 'dataflow', 'network', 'pps', 'intercon', 'crypto'] },
  { id: 'security', label: 'Security Controls', sectionIds: ['personnel', 'identity', 'sepduty', 'controls'] },
  { id: 'policies', label: 'Policies & Plans', sectionIds: ['policies', 'scrm', 'privacy', 'conplan', 'irplan', 'cmplan', 'conmon', 'poam'] },
];

/** Clean section label mapping */
export const SECTION_LABELS: Record<string, string> = {
  sysinfo: 'System Information',
  fips199: 'Security Categorization',
  infotypes: 'Information Types',
  baseline: 'Control Baseline',
  rmf: 'RMF Lifecycle',
  boundary: 'Authorization Boundary',
  dataflow: 'Data Flow',
  network: 'Network Architecture',
  pps: 'Ports & Protocols',
  intercon: 'Interconnections',
  crypto: 'Cryptography',
  personnel: 'Personnel Security',
  identity: 'Identity Management',
  sepduty: 'Separation of Duties',
  controls: 'Security Controls',
  policies: 'Security Policies',
  scrm: 'Supply Chain Risk',
  privacy: 'Privacy Analysis',
  conplan: 'Contingency Plan',
  irplan: 'Incident Response',
  cmplan: 'Configuration Mgmt',
  conmon: 'Continuous Monitoring',
  poam: 'POA&M',
};
