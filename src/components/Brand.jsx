import { Sprout } from 'lucide-react';

export default function Brand({ inverse = false, to = '/dashboard' }) {
  return (
    <a className={`brand-lockup${inverse ? ' brand-lockup-inverse' : ''}`} href={to}>
      <span className="brand-symbol"><Sprout size={21} strokeWidth={2.2} /></span>
      <span className="brand-name">AGRI<span>-</span>TRACK</span>
    </a>
  );
}
