/**
 * Forge Cyber Defense - Added Banner Component
 * Shows contextual information for FedRAMP/FISMA sections
 */
import React from 'react';
import { C } from '../config/colors';

interface AddedBannerProps {
  tag: 'fedramp' | 'fisma';
  ref: string;
  text: string;
}

// Tag colors inline to match new design
const TAG_COLORS = {
  fedramp: '#3b82f6', // Blue
  fisma: '#f97316',   // Orange
};

const TAG_BG = {
  fedramp: '#eff6ff', // Blue-50
  fisma: '#fff7ed',   // Orange-50
};

export const AddedBanner: React.FC<AddedBannerProps> = ({ tag, ref: nistRef, text }) => (
  <div style={{
    background: TAG_BG[tag],
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    border: `1px solid ${TAG_COLORS[tag]}30`,
  }}>
    <div style={{
      fontSize: 12,
      color: TAG_COLORS[tag],
      fontWeight: 600,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: '.04em',
    }}>
      {tag === 'fisma' ? '🔴' : '✦'} {tag === 'fisma' ? 'FISMA/RMF Requirement' : 'FedRAMP Addition'} — {nistRef}
    </div>
    <div style={{
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 1.6,
    }}>
      {text}
    </div>
  </div>
);
