import { C } from '../../config/colors';

interface SubHProps {
  children: React.ReactNode;
}

export const SubH: React.FC<SubHProps> = ({ children }) => (
  <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: C.primary }}>{children}</h4>
);
