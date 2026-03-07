/**
 * Current SSP document card shown in the sidebar.
 */
import { C } from '../../config/colors';

interface DocumentCardProps {
  documentName: string;
  lastSaved: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ documentName, lastSaved }) => (
  <div
    style={{
      margin: '16px 12px 0',
      padding: '12px 14px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 10,
      border: `1px solid ${C.navyLight}`,
    }}
  >
    <div
      style={{
        fontSize: 12,
        color: C.sidebarTextMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 4,
        fontWeight: 500,
      }}
    >
      Current SSP
    </div>
    <div
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: C.sidebarText,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {documentName}
    </div>
    <div
      style={{
        fontSize: 12,
        color: C.sidebarTextMuted,
        marginTop: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: C.success,
        }}
      />
      {lastSaved}
    </div>
  </div>
);
