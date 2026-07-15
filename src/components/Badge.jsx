import { getStatus } from '../utils/helpers';

export default function Badge({ children }) {
  return <span className={`badge badge-${getStatus(children)}`}>{children}</span>;
}
