const NavButton = ({ active, icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center gap-1 transition-all ${
      active 
        ? 'text-blue-600 scale-110 font-black' 
        : 'text-slate-400 hover:text-slate-600 font-bold'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'fill-blue-50' : ''}`} />
    <span className="text-[10px]">{label}</span>
  </button>
);

export default NavButton;

