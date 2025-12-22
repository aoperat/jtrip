import { Link as LinkIcon } from 'lucide-react';

const LinkBadge = ({ label }) => (
  <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-bold leading-none">
    <LinkIcon className="w-2.5 h-2.5" /> {label}
  </div>
);

export default LinkBadge;

