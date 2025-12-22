const LinkedBadge = ({ color, icon: Icon, label, onClick }) => {
  const colors = {
    orange: 'bg-orange-50 text-orange-500 border-orange-100',
    blue: 'bg-blue-50 text-blue-500 border-blue-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-100',
    green: 'bg-green-50 text-green-600 border-green-100'
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
        colors[color]
      } active:scale-95 transition-all`}
    >
      <Icon className="w-2.5 h-2.5" /> {label}
    </button>
  );
};

export default LinkedBadge;

