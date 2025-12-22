import { useState } from 'react';
import { 
  Calendar, Map as MapIcon, Ticket, Wallet, Plus, MapPin, 
  ChevronRight, Maximize2, X, QrCode, Bell, CheckCircle2, 
  ChevronLeft, Users, Camera, Image as ImageIcon, 
  Barcode, Info, UserPlus, Settings, CheckSquare, Square, 
  List, ClipboardList, Link as LinkIcon, DollarSign, Megaphone
} from 'lucide-react';
import NavButton from './components/NavButton';
import LinkedBadge from './components/LinkedBadge';
import LinkBadge from './components/LinkBadge';
import CreateLinkModal from './components/CreateLinkModal';

// --- 초기 데이터 설정 ---
const INITIAL_PARTICIPANTS = [
  { id: 'u1', name: 'Felix', image: 'Felix' },
  { id: 'u2', name: '지민', image: 'Aneka' },
  { id: 'u3', name: '태형', image: 'James' },
];

const INITIAL_TRIPS = [
  { 
    id: 'trip-1', 
    title: '도쿄 여행 🗼', 
    date: '2024.05.20 - 05.22 (2박 3일)', 
    participants: INITIAL_PARTICIPANTS,
    image: 'https://images.unsplash.com/photo-1540959733332-e94e270b4052?w=800&q=80',
    itinerary: {
      1: [
        { id: 'it-1', time: '10:30', title: '인천국제공항 T1', desc: '아시아나 항공 체크인', hasTicket: true, prepId: 'p-1', infoId: 'si-2', expenseId: null },
        { id: 'it-2', time: '14:20', title: '나리타 국제공항', desc: '스카이라이너 탑승', hasTicket: true, prepId: null, infoId: null, expenseId: 'ex-3' },
        { id: 'it-3', time: '18:30', title: '시부야 스카이', desc: '일몰 관람 (예약 필수)', hasTicket: true, prepId: null, infoId: null, expenseId: null }
      ],
      2: [
        { id: 'it-4', time: '09:00', title: '츠키지 시장', desc: '카이센동 아침 식사', hasTicket: false, prepId: null, infoId: null, expenseId: 'ex-1' },
        { id: 'it-5', time: '13:00', title: '팀랩 플래닛 도쿄', desc: '전시 관람 및 사진 촬영', hasTicket: true, prepId: 'p-2', infoId: 'si-1', expenseId: 'ex-4' }
      ],
      3: []
    },
    ticketTypes: [
      { id: 'tt-1', name: '아시아나 항공권 (OZ102)', mode: 'individual', linkedItineraryId: 'it-1', registrations: { 'u1': { type: 'QR', code: 'QR-FELIX-01', uploadedBy: 'u1' }, 'u2': { type: 'QR', code: 'QR-JIMIN-01', uploadedBy: 'u2' } } },
      { id: 'tt-2', name: '시부야 스카이 입장권', mode: 'group', linkedItineraryId: 'it-3', registrations: { 'all': { type: 'QR', code: 'GROUP-QR-99', uploadedBy: 'u1' } } }
    ],
    expenses: [
      { id: 'ex-1', title: '이치란 라멘 (점심)', amount: 42000, payer: '지민', category: 'Meal', linkedItineraryId: 'it-4' },
      { id: 'ex-2', title: '숙소 잔금 결제', amount: 350000, payer: 'Felix', category: 'Stay', linkedItineraryId: null },
      { id: 'ex-3', title: '스카이라이너 티켓', amount: 75000, payer: '태형', category: 'Transport', linkedItineraryId: 'it-2' }
    ],
    notices: [
      { id: 'n-1', content: '여권 만료일 다들 꼭 확인하기!', author: 'Felix' },
      { id: 'n-2', content: '공항철도 티켓은 태형이가 일괄 구매 완료', author: '태형' }
    ],
    preparations: [
      { id: 'p-1', content: '여권 및 비자 서류', checked: true, type: 'personal', linkedItineraryId: 'it-1' },
      { id: 'p-2', content: '보조배터리 (전시 촬영용)', checked: false, type: 'personal', linkedItineraryId: 'it-5' },
      { id: 'p-3', content: '돼지코(110V) 어댑터', checked: true, type: 'common', linkedItineraryId: null }
    ],
    sharedInfo: [
      { id: 'si-1', title: '일본 전압 정보', content: '110V 사용, 돼지코 필수 지참 필요', category: 'Tip', linkedItineraryId: 'it-5' },
      { id: 'si-2', title: '현지 비상 연락처', content: '대사관: +81-3-3452-7611', category: 'Emergency', linkedItineraryId: 'it-1' }
    ]
  }
];

function App() {
  const [view, setView] = useState('home'); 
  const [activeTab, setActiveTab] = useState('schedule');
  const [scheduleMode, setScheduleMode] = useState('list'); 
  
  const [trips, setTrips] = useState(INITIAL_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [checkedItems, setCheckedItems] = useState(new Set());
  
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTargetUser, setUploadTargetUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Registration Modals
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [showAddPrepModal, setShowAddPrepModal] = useState(false);
  const [showAddInfoModal, setShowAddInfoModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const toggleItemCheck = (id) => {
    const next = new Set(checkedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedItems(next);
  };

  const openTrip = (trip) => {
    setSelectedTrip(trip);
    setView('detail');
    setActiveTab('schedule');
  };

  const getLinkedItemName = (id) => {
    if (!id || !selectedTrip) return null;
    const allItems = [...selectedTrip.itinerary[1], ...selectedTrip.itinerary[2], ...selectedTrip.itinerary[3]];
    return allItems.find(it => it.id === id)?.title;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-slate-200">
      
      {/* -------------------- VIEW: HOME -------------------- */}
      {view === 'home' && (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
          <header className="px-6 pt-10 pb-6 bg-white border-b border-slate-100 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Travel-With</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Collab Journey</p>
            </div>
            <button className="p-2 bg-slate-50 rounded-full text-slate-400"><Settings className="w-5 h-5" /></button>
          </header>
          <main className="flex-1 overflow-y-auto p-6 space-y-4">
            {trips.map(trip => (
              <div 
                key={trip.id} 
                onClick={() => openTrip(trip)} 
                className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="h-36 relative">
                  <img src={trip.image} alt={trip.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{trip.title}</h3>
                    <p className="text-[10px] opacity-80 font-medium">{trip.date}</p>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center bg-white">
                  <div className="flex -space-x-2">
                    {trip.participants.map((p, i) => (
                      <img 
                        key={i} 
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.image}`} 
                        alt={p.name} 
                      />
                    ))}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-200" />
                </div>
              </div>
            ))}
            <button 
              onClick={() => setShowCreateTripModal(true)} 
              className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-400 gap-2 hover:bg-white transition-all"
            >
              <Plus className="w-8 h-8" />
              <span className="font-bold text-xs uppercase tracking-widest">Plan New Trip</span>
            </button>
          </main>
        </div>
      )}

      {/* -------------------- VIEW: DETAIL -------------------- */}
      {view === 'detail' && selectedTrip && (
        <div className="flex flex-col h-full relative animate-in slide-in-from-right-10 duration-500">
          <header className="px-6 pt-6 pb-4 bg-white/90 backdrop-blur-md border-b border-slate-100 flex justify-between items-end sticky top-0 z-30">
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => setView('home')} 
                className="flex items-center gap-1 text-slate-400"
              >
                <ChevronLeft className="w-4 h-4" /> 
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">All Trips</span>
              </button>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">{selectedTrip.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {selectedTrip.participants.map((p, i) => (
                  <img 
                    key={i} 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-slate-100" 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.image}`} 
                    alt={p.name} 
                  />
                ))}
              </div>
              <button className="w-8 h-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-blue-500 shadow-sm">
                <Users className="w-4 h-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-24 bg-white">
            {/* --- TAB: SCHEDULE --- */}
            {activeTab === 'schedule' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-6 pb-2">
                  <h2 className="text-lg font-bold tracking-tight">여행 일정 🗓️</h2>
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button 
                      onClick={() => setScheduleMode('list')} 
                      className={`p-2 rounded-lg transition-all ${
                        scheduleMode === 'list' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-slate-400'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setScheduleMode('map')} 
                      className={`p-2 rounded-lg transition-all ${
                        scheduleMode === 'map' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-slate-400'
                      }`}
                    >
                      <MapIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2 px-6 py-4 overflow-x-auto no-scrollbar border-b border-slate-50 sticky top-0 bg-white z-10">
                  {[1, 2, 3].map(day => (
                    <button 
                      key={day} 
                      onClick={() => setSelectedDay(day)} 
                      className={`flex-shrink-0 px-6 py-2 rounded-2xl text-xs font-bold transition-all ${
                        selectedDay === day 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      Day {day}
                    </button>
                  ))}
                </div>

                {scheduleMode === 'list' ? (
                  <div className="p-6 space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {selectedTrip.itinerary[selectedDay].length > 0 ? (
                      selectedTrip.itinerary[selectedDay].map(item => {
                        const isChecked = checkedItems.has(item.id);
                        const linkedExpense = selectedTrip.expenses.find(ex => ex.linkedItineraryId === item.id);
                        return (
                          <div key={item.id} className="relative pl-8 flex items-start gap-3 animate-in slide-in-from-bottom-2">
                            <button 
                              onClick={() => toggleItemCheck(item.id)} 
                              className={`absolute left-0 top-2 w-[24px] h-[24px] rounded-full bg-white flex items-center justify-center z-10 transition-all border-2 ${
                                isChecked 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-slate-300'
                              }`}
                            >
                              {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </button>
                            <div className={`flex-1 p-4 rounded-3xl border transition-all ${
                              isChecked 
                                ? 'opacity-40 bg-slate-50 border-slate-100' 
                                : 'bg-white shadow-sm border-slate-100'
                            }`}>
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                  isChecked ? 'text-slate-300' : 'text-blue-500'
                                }`}>
                                  {item.time}
                                </span>
                                <div className="flex flex-wrap justify-end gap-1 max-w-[150px]">
                                  {item.hasTicket && (
                                    <LinkedBadge 
                                      color="orange" 
                                      icon={Ticket} 
                                      label="TICKET" 
                                      onClick={() => setActiveTab('tickets')} 
                                    />
                                  )}
                                  {item.prepId && (
                                    <LinkedBadge 
                                      color="blue" 
                                      icon={CheckSquare} 
                                      label="PREP" 
                                      onClick={() => setActiveTab('preps')} 
                                    />
                                  )}
                                  {item.infoId && (
                                    <LinkedBadge 
                                      color="slate" 
                                      icon={Info} 
                                      label="INFO" 
                                      onClick={() => setActiveTab('info')} 
                                    />
                                  )}
                                  {linkedExpense && (
                                    <LinkedBadge 
                                      color="green" 
                                      icon={DollarSign} 
                                      label={`₩${linkedExpense.amount.toLocaleString()}`} 
                                      onClick={() => setActiveTab('budget')} 
                                    />
                                  )}
                                </div>
                              </div>
                              <h3 className={`font-bold text-sm leading-tight ${
                                isChecked ? 'text-slate-400 line-through' : 'text-slate-800'
                              }`}>
                                {item.title}
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-20 text-center text-slate-300 text-xs font-bold uppercase tracking-widest tracking-tighter">
                        일정이 등록되지 않았습니다.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 h-[400px] animate-in zoom-in-95">
                    <div className="w-full h-full bg-slate-100 rounded-[40px] border-4 border-white shadow-inner flex flex-col items-center justify-center gap-4">
                      <MapPin className="w-12 h-12 text-blue-500 animate-bounce" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-800">Day {selectedDay} 동선 보기</p>
                        <p className="text-[10px] text-slate-400">Map API를 통해 경로를 표시합니다.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB: QUICK-PASS --- */}
            {activeTab === 'tickets' && (
              <div className="p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold tracking-tight">퀵패스 🎫</h2>
                  <button 
                    onClick={() => setShowAddTicketModal(true)} 
                    className="p-2 bg-blue-600 text-white rounded-xl active:scale-90 shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedTrip.ticketTypes.map(type => {
                    const regCount = Object.keys(type.registrations).length;
                    const totalNeeded = type.mode === 'group' ? 1 : selectedTrip.participants.length;
                    const isDone = regCount >= totalNeeded;
                    const linkedName = getLinkedItemName(type.linkedItineraryId);

                    return (
                      <div 
                        key={type.id} 
                        onClick={() => setSelectedTicketType(type)} 
                        className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all cursor-pointer"
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isDone ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'
                        }`}>
                          <Ticket className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                              {type.mode === 'group' ? '공통' : '개별'}
                            </span>
                            <span className={`text-[9px] font-bold ${isDone ? 'text-blue-500' : 'text-orange-500'}`}>
                              {isDone ? '완료' : `등록 중 (${regCount}/${totalNeeded})`}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-sm">{type.name}</h3>
                          {linkedName && <LinkBadge label={linkedName} />}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-200" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- TAB: BUDGET --- */}
            {activeTab === 'budget' && (
              <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold tracking-tight text-center">가계부 💰</h2>
                  <button 
                    onClick={() => setShowAddExpenseModal(true)} 
                    className="p-2 bg-blue-600 text-white rounded-xl active:scale-90 shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 leading-none">Total Expense</p>
                  <h3 className="text-4xl font-black font-mono tracking-tighter">₩ 467,000</h3>
                  <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight font-bold uppercase">1/3 Split : ₩ 155,666</p>
                    <button className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-bold active:scale-95">정산하기</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedTrip.expenses.map(ex => {
                    const linkedName = getLinkedItemName(ex.linkedItineraryId);
                    return (
                      <div 
                        key={ex.id} 
                        className="bg-white p-5 rounded-3xl flex justify-between items-center border border-slate-50 shadow-sm active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-xs leading-none text-slate-400">
                            {ex.category[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-tight">{ex.title}</p>
                            <p className="text-[10px] text-slate-400 font-medium">결제: {ex.payer}</p>
                            {linkedName && <LinkBadge label={linkedName} />}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-green-600 tracking-tight">₩ {ex.amount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- TAB: PREPARATIONS --- */}
            {activeTab === 'preps' && (
              <div className="p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-2 tracking-tight">
                    <CheckSquare className="w-5 h-5 text-blue-500" /> 준비물 체크
                  </h2>
                  <button 
                    onClick={() => setShowAddPrepModal(true)} 
                    className="p-2 bg-blue-600 text-white rounded-xl active:scale-90 shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-6">
                  {[ 
                    {key: 'common', label: 'Common Items'}, 
                    {key: 'personal', label: 'Personal Items'} 
                  ].map(group => (
                    <div key={group.key} className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        {group.label}
                      </p>
                      {selectedTrip.preparations.filter(p => p.type === group.key).map(prep => {
                        const linkedName = getLinkedItemName(prep.linkedItineraryId);
                        return (
                          <div 
                            key={prep.id} 
                            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 active:scale-[0.99] transition-all"
                          >
                            <button className={`p-1 transition-all ${
                              prep.checked ? 'text-blue-500 scale-110' : 'text-slate-200'
                            }`}>
                              {prep.checked ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                            </button>
                            <div className="flex-1">
                              <p className={`text-sm font-bold ${
                                prep.checked ? 'text-slate-300 line-through' : 'text-slate-700'
                              }`}>
                                {prep.content}
                              </p>
                              {linkedName && <LinkBadge label={linkedName} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TAB: INFORMATION --- */}
            {activeTab === 'info' && (
              <div className="p-6 space-y-8 animate-in fade-in duration-300">
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-orange-500" /> 공지사항
                    </h2>
                    <button 
                      onClick={() => addNotification("새 공지를 등록합니다.")} 
                      className="p-2 bg-slate-100 text-slate-400 rounded-xl active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedTrip.notices.map(notice => (
                      <div 
                        key={notice.id} 
                        className="bg-orange-50 p-5 rounded-[32px] border border-orange-100 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Megaphone className="w-10 h-10" />
                        </div>
                        <p className="text-sm text-slate-800 font-medium leading-relaxed mb-2 relative z-10">
                          {notice.content}
                        </p>
                        <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">
                          — {notice.author}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-500" /> 여행 정보 공유
                    </h2>
                    <button 
                      onClick={() => setShowAddInfoModal(true)} 
                      className="p-2 bg-slate-100 text-slate-400 rounded-xl active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedTrip.sharedInfo.map(info => {
                      const linkedName = getLinkedItemName(info.linkedItineraryId);
                      return (
                        <div 
                          key={info.id} 
                          className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm relative group active:scale-[0.98] transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-blue-50 text-blue-500 leading-none">
                              {info.category}
                            </span>
                            {linkedName && <LinkBadge label={linkedName} />}
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm mb-1">{info.title}</h4>
                          <p className="text-xs text-slate-400 leading-normal">{info.content}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </main>

          {/* -------------------- BOTTOM NAV -------------------- */}
          <nav className="bg-white/95 backdrop-blur-lg border-t border-slate-100 px-4 pb-8 pt-3 flex justify-between items-center absolute bottom-0 left-0 right-0 z-30 shadow-up">
            <NavButton active={activeTab === 'schedule'} icon={Calendar} label="일정" onClick={() => setActiveTab('schedule')} />
            <NavButton active={activeTab === 'tickets'} icon={Ticket} label="퀵패스" onClick={() => setActiveTab('tickets')} />
            <NavButton active={activeTab === 'budget'} icon={Wallet} label="예산" onClick={() => setActiveTab('budget')} />
            <NavButton active={activeTab === 'preps'} icon={ClipboardList} label="준비물" onClick={() => setActiveTab('preps')} />
            <NavButton active={activeTab === 'info'} icon={Info} label="정보" onClick={() => setActiveTab('info')} />
          </nav>
        </div>
      )}

      {/* -------------------- OVERLAY: NOTIFICATIONS -------------------- */}
      <div className="absolute top-24 left-0 right-0 px-4 z-[100] pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className="mb-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
          >
            <Bell className="w-3 h-3 text-blue-400" />
            <p className="text-xs font-medium leading-tight">{n.msg}</p>
          </div>
        ))}
      </div>

      {/* -------------------- MODALS: REGISTRATION (ALL USE CONSISTENT LINKING UI) -------------------- */}
      
      {/* TICKET MODAL */}
      {showAddTicketModal && (
        <CreateLinkModal 
          title="새 퀵패스 등록 🎟️" 
          placeholder="티켓 명칭 (예: 스카이트리 입장권)" 
          onClose={() => setShowAddTicketModal(false)} 
        />
      )}

      {/* PREP MODAL */}
      {showAddPrepModal && (
        <CreateLinkModal 
          title="준비물 추가 🎒" 
          placeholder="준비물 이름 (예: 상비약)" 
          onClose={() => setShowAddPrepModal(false)}
          isPrep
        />
      )}

      {/* INFO MODAL */}
      {showAddInfoModal && (
        <CreateLinkModal 
          title="여행 정보 등록 💡" 
          placeholder="정보 제목 (예: 팀랩 입장 팁)" 
          onClose={() => setShowAddInfoModal(false)}
          isInfo
        />
      )}

      {/* BUDGET MODAL */}
      {showAddExpenseModal && (
        <CreateLinkModal 
          title="지출 내역 추가 💸" 
          placeholder="내용 (예: 편의점 간식)" 
          onClose={() => setShowAddExpenseModal(false)}
          isExpense
        />
      )}

      {/* TICKET TYPE DETAIL & VIEWING */}
      {selectedTicketType && (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right-10 duration-300">
          <header className="px-6 pt-10 pb-4 border-b border-slate-50 flex items-center gap-4">
            <button 
              onClick={() => setSelectedTicketType(null)} 
              className="p-2 bg-slate-50 rounded-full text-slate-400 active:scale-90 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest tracking-tighter">
                {selectedTicketType.mode === 'group' ? '공통 티켓' : '개별 티켓'}
              </span>
              <h2 className="text-lg font-black text-slate-900 leading-tight">{selectedTicketType.name}</h2>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedTicketType.mode === 'group' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-5 rounded-[32px] border border-blue-100 flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <p className="text-[11px] text-blue-600 font-bold leading-tight">한 명이 등록하면 모든 멤버가 공유합니다.</p>
                </div>
                {selectedTicketType.registrations['all'] ? (
                  <div 
                    onClick={() => setViewingTicket(selectedTicketType.registrations['all'])} 
                    className="bg-white p-5 rounded-[32px] border-2 border-slate-900 flex items-center gap-4 cursor-pointer active:scale-95 transition-all"
                  >
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400">READY TO SCAN</p>
                      <h4 className="font-bold text-slate-800">공통 티켓 보기</h4>
                    </div>
                    <Maximize2 className="w-5 h-5 text-slate-400" />
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setUploadTargetUser(null); 
                      setShowUploadModal(true);
                    }} 
                    className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-bold text-sm"
                  >
                    등록하기
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 leading-none mb-1">
                  멤버별 등록 현황
                </h3>
                <div className="space-y-2">
                  {selectedTrip.participants.map(p => {
                    const reg = selectedTicketType.registrations[p.id];
                    return (
                      <div 
                        key={p.id} 
                        className={`p-4 rounded-3xl border flex items-center gap-4 transition-all ${
                          reg ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="relative">
                          <img 
                            className="w-10 h-10 rounded-full bg-white shadow-sm" 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.image}`} 
                            alt={p.name} 
                          />
                          {reg && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full border border-white p-0.5">
                              <CheckCircle2 className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-sm ${reg ? 'text-slate-800' : 'text-slate-400'}`}>
                            {p.name}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-400 leading-none">
                            {reg ? '등록 완료' : '미등록'}
                          </p>
                        </div>
                        {reg ? (
                          <button 
                            onClick={() => setViewingTicket(reg)} 
                            className="p-2 bg-slate-900 text-white rounded-xl active:scale-90 transition-all shadow-lg shadow-black/10"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setUploadTargetUser(p); 
                              setShowUploadModal(true);
                            }} 
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold active:scale-95 shadow-lg shadow-blue-100"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> 대신 등록
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* -------------------- MODAL: UPLOAD TICKET (IMAGE/SCAN) -------------------- */}
      {showUploadModal && (
        <div className="absolute inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-[40px] p-8 animate-in slide-in-from-bottom-10 duration-500 text-center">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <h2 className="text-xl font-black mb-1 font-bold tracking-tight leading-none">
              {uploadTargetUser ? `${uploadTargetUser.name}님의 티켓` : '공통 티켓'} 등록
            </h2>
            <p className="text-xs text-slate-400 mb-8 font-medium">바코드, QR, 영수증 이미지를 선택하세요.</p>
            <div className="grid grid-cols-2 gap-4 mb-10">
              <button className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-3xl group transition-all hover:bg-blue-50">
                <Camera className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">카메라 스캔</span>
              </button>
              <button className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-3xl group transition-all hover:bg-blue-50">
                <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">앨범 선택</span>
              </button>
            </div>
            <button 
              onClick={() => setShowUploadModal(false)} 
              className="w-full py-4 bg-slate-100 rounded-2xl font-bold text-slate-500"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: TICKET SCANNER VIEW -------------------- */}
      {viewingTicket && (
        <div className="absolute inset-0 z-[200] bg-white animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center justify-center p-8 text-center">
          <button 
            onClick={() => setViewingTicket(null)} 
            className="absolute top-8 right-8 p-3 bg-slate-50 rounded-full text-slate-400 active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
          <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black rounded-full uppercase mb-4 tracking-widest">
            Live Scan ready
          </span>
          <h2 className="text-2xl font-black text-slate-900 leading-tight mb-10">{selectedTicketType?.name}</h2>
          
          <div className="bg-white p-8 rounded-[50px] border-[6px] border-slate-900 shadow-2xl w-full max-w-[320px] flex flex-col items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-slate-900 opacity-5 animate-scan" />
            {viewingTicket.type === 'QR' ? (
              <QrCode className="w-52 h-52 text-slate-900" />
            ) : (
              <Barcode className="w-52 h-32 text-slate-900" />
            )}
            <div className="w-full pt-8 border-t-4 border-dashed border-slate-50">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-1 leading-none tracking-tighter">
                Voucher Number
              </p>
              <p className="text-2xl font-mono font-black text-slate-900 tracking-tighter">{viewingTicket.code}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setViewingTicket(null)} 
            className="mt-12 w-full max-w-[320px] py-5 bg-slate-900 rounded-[28px] font-black text-white flex items-center justify-center gap-3 active:scale-95 shadow-2xl shadow-slate-200 transition-all"
          >
            <Maximize2 className="w-6 h-6" /> 스캔용 밝기 고정
          </button>
        </div>
      )}

    </div>
  );
}

export default App;
