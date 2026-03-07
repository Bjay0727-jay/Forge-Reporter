import { C } from '../../config/colors';

interface SubHProps {
  children: React.ReactNode;
}

export const SubH: React.FC<SubHProps> = ({ children }) => (
  <h4 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: C.primary, letterSpacing: '-0.01em' }}>{children}</h4>
);
