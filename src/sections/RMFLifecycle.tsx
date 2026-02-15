/**
 * Section 5: RMF Lifecycle Tracker
 */
import React from 'react';
import type { SSPData } from '../types';
import { FF, TI, Sel, SH, Div, G2, SubH, Chk } from '../components/FormComponents';
import { AddedBanner } from '../components/AddedBanner';
import { C } from '../config/colors';

interface Props {
  d: SSPData;
  sf: (key: string, value: unknown) => void;
}

const RMF_STEPS = [
  { id: 'prepare', num: '1', name: 'Prepare', ref: 'SP 800-37 §3.1', tasks: ['Define risk management roles', 'Establish risk management strategy', 'Identify common controls', 'Prioritize systems', 'Develop ISCM strategy'], color: '#8b5cf6' },
  { id: 'categorize', num: '2', name: 'Categorize', ref: 'SP 800-37 §3.2', tasks: ['Document system characteristics', 'Categorize system (FIPS 199)', 'Register system with agency'], color: '#3b82f6' },
  { id: 'select', num: '3', name: 'Select', ref: 'SP 800-37 §3.3', tasks: ['Select control baseline', 'Tailor controls', 'Allocate controls to system', 'Document in SSP'], color: '#14b8a6' },
  { id: 'implement', num: '4', name: 'Implement', ref: 'SP 800-37 §3.4', tasks: ['Implement selected controls', 'Document implementation in SSP', 'Collect evidence artifacts'], color: '#22c55e' },
  { id: 'assess', num: '5', name: 'Assess', ref: 'SP 800-37 §3.5', tasks: ['Develop SAP', 'Assess controls per SP 800-53A', 'Generate SAR', 'Conduct risk assessment', 'Generate POA&M'], color: '#f59e0b' },
  { id: 'authorize', num: '6', name: 'Authorize', ref: 'SP 800-37 §3.6', tasks: ['Prepare authorization package', 'Submit to AO', 'AO risk determination', 'Issue ATO/DATO/IATT'], color: '#f97316' },
  { id: 'monitor', num: '7', name: 'Monitor', ref: 'SP 800-37 §3.7', tasks: ['Implement ISCM strategy', 'Assess 1/3 controls annually', 'Manage POA&M monthly', 'Track significant changes', 'Ongoing authorization determination'], color: '#ef4444' },
];

const ARTIFACTS = [
  'System Security Plan (SSP)',
  'Security Assessment Plan (SAP)',
  'Security Assessment Report (SAR)',
  'Plan of Action & Milestones (POA&M)',
  'Risk Assessment Report (RAR)',
  'Privacy Impact Assessment (PIA)',
  'Contingency Plan (CP)',
  'Incident Response Plan (IRP)',
  'Configuration Management Plan (CMP)',
  'Continuous Monitoring Strategy',
  'Authorization Decision Letter',
  'Rules of Behavior (ROB)',
];

export const RMFLifecycleSec: React.FC<Props> = ({ d, sf }) => {
  return (
    <div>
      <SH
        title="RMF Lifecycle Tracker"
        sub="NIST SP 800-37 Rev2 — All 7 Risk Management Framework steps with task completion tracking."
      />
      <AddedBanner
        tag="fisma"
        ref="SP 800-37 Rev2 / DoDI 8510.01"
        text="FISMA requires explicit tracking of RMF lifecycle. The AO needs to see which step the system is in and what artifacts are complete before issuing an authorization decision."
      />
      <div style={G2}>
        <FF label="Current RMF Step" req>
          <Sel
            value={d.rmfCurrentStep}
            onChange={(v) => sf('rmfCurrentStep', v)}
            ph="Select current step"
            options={RMF_STEPS.map((s) => ({ v: s.id, l: `Step ${s.num}: ${s.name}` }))}
          />
        </FF>
        <FF label="Target ATO Date">
          <TI value={d.rmfTargetAto} onChange={(v) => sf('rmfTargetAto', v)} placeholder="YYYY-MM-DD" mono />
        </FF>
      </div>
      <Div />
      {RMF_STEPS.map((step) => {
        const taskData = (d[`rmf_${step.id}` as keyof SSPData] as Record<string, boolean>) || {};
        const completed = Object.values(taskData).filter(Boolean).length;
        const pct = step.tasks.length > 0 ? Math.round((completed / step.tasks.length) * 100) : 0;
        const isCurrent = d.rmfCurrentStep === step.id;

        return (
          <div
            key={step.id}
            style={{
              background: isCurrent ? `${step.color}08` : C.surface,
              borderRadius: 10,
              padding: 16,
              marginBottom: 8,
              border: `1px solid ${isCurrent ? step.color + '50' : C.border}`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isCurrent ? 12 : 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#fff',
                  background: step.color,
                  flexShrink: 0,
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? C.text : C.textSecondary }}>
                    {step.name}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "'Fira Code', monospace" }}>
                    {step.ref}
                  </div>
                </div>
                {isCurrent && (
                  <span style={{
                    fontSize: 9,
                    background: step.color,
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 700,
                    marginLeft: 8,
                  }}>
                    CURRENT
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 60,
                  height: 5,
                  background: C.surfaceAlt,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: pct === 100 ? C.success : step.color,
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{
                  fontSize: 10,
                  fontFamily: "'Fira Code', monospace",
                  color: C.textSecondary,
                }}>
                  {pct}%
                </span>
              </div>
            </div>
            {isCurrent && (
              <div style={{
                marginTop: 8,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 6,
              }}>
                {step.tasks.map((task, ti) => (
                  <Chk
                    key={ti}
                    label={task}
                    checked={taskData[`t${ti}`] || false}
                    onChange={(v) => {
                      const n = { ...taskData, [`t${ti}`]: v };
                      sf(`rmf_${step.id}`, n);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
      <Div />
      <SubH>Authorization Package Artifacts</SubH>
      <div style={{
        background: C.surface,
        borderRadius: 10,
        padding: 16,
        border: `1px solid ${C.border}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
      }}>
        {ARTIFACTS.map((art) => (
          <Chk
            key={art}
            label={art}
            checked={(d.rmfArtifacts || []).includes(art)}
            onChange={(chk) => {
              const c = d.rmfArtifacts || [];
              sf('rmfArtifacts', chk ? [...c, art] : c.filter((x) => x !== art));
            }}
          />
        ))}
      </div>
    </div>
  );
};
