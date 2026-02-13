/**
 * ForgeComply 360 Reporter - Added Banner Component
 * Shows contextual information for FedRAMP/FISMA sections
 */
import React from 'react';
import { C, TAG_COLORS, TAG_BG } from '../config/colors';

interface AddedBannerProps {
  tag: 'fedramp' | 'fisma';
  ref: string;
  text: string;
}

export const AddedBanner: React.FC<AddedBannerProps> = ({ tag, ref: nistRef, text }) => (
  <div style={{
    background: TAG_BG[tag],
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    border: `1px solid ${TAG_COLORS[tag]}30`,
  }}>
    <div style={{
      fontSize: 11,
      color: TAG_COLORS[tag],
      fontWeight: 600,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: '.05em',
    }}>
      {tag === 'fisma' ? '\ud83d\udd34' : '\u2726'} {tag === 'fisma' ? 'NEW \u2014 FISMA/RMF Requirement' : 'FEDRAMP ADDITION'} \u2014 {nistRef}
    </div>
    <div style={{
      fontSize: 12,
      color: C.textSecondary,
      lineHeight: 1.5,
    }}>
      {text}
    </div>
  </div>
);
