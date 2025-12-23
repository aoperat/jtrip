import React, { useState, useEffect } from "react";
import {
  Calendar,
  Map as MapIcon,
  Ticket,
  Wallet,
  Plus,
  Clock,
  MapPin,
  ChevronRight,
  Maximize2,
  X,
  QrCode,
  Bell,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Users,
  Copy,
  Share2,
  Camera,
  Image as ImageIcon,
  Barcode,
  Info,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  Settings,
  Trash2,
  Megaphone,
  CheckSquare,
  Square,
  List,
  ExternalLink,
  ClipboardList,
  Link as LinkIcon,
  DollarSign,
  Search,
  Navigation,
  MoreVertical,
} from "lucide-react";

// --- 초기 데이터 설정 ---
const INITIAL_PARTICIPANTS = [
  { id: "u1", name: "Felix", image: "Felix" },
  { id: "u2", name: "지민", image: "Aneka" },
  { id: "u3", name: "태형", image: "James" },
];

const INITIAL_TRIPS = [
  {
    id: "trip-1",
    title: "도쿄 미식 여행 🗼",
    date: "2024.05.20 - 05.22",
    participants: INITIAL_PARTICIPANTS,
    image:
      "https://images.unsplash.com/photo-1540959733332-e94e270b4052?w=800&q=80",
    itinerary: {
      1: [
        {
          id: "it-1",
          time: "10:30",
          title: "인천국제공항 T1",
          desc: "아시아나 항공 체크인 및 수하물 위탁. 면세점 쇼핑 및 라운지 이용 예정.",
          hasTicket: true,
          prepId: "p-1",
          infoId: "si-2",
          expenseId: null,
        },
        {
          id: "it-2",
          time: "14:20",
          title: "나리타 국제공항",
          desc: "스카이라이너 탑승권 교환 및 이동. 우에노역까지 약 41분 소요.",
          hasTicket: true,
          prepId: null,
          infoId: null,
          expenseId: "ex-3",
        },
        {
          id: "it-3",
          time: "18:30",
          title: "시부야 스카이",
          desc: "일몰 골든아워 관람 및 야경 촬영. 예약 시간 15분 전 도착 필수.",
          hasTicket: true,
          prepId: null,
          infoId: null,
          expenseId: null,
        },
      ],
      2: [
        {
          id: "it-4",
          time: "09:00",
          title: "츠키지 시장",
          desc: "새벽 카이센동 투어 및 시장 구경. 유명 맛집 '카이센동 마루키타' 방문.",
          hasTicket: false,
          prepId: null,
          infoId: null,
          expenseId: "ex-1",
        },
        {
          id: "it-5",
          time: "13:00",
          title: "팀랩 플래닛 도쿄",
          desc: "몰입형 미디어 아트 전시 관람. 바지를 걷어올려야 하는 구역이 있으니 복장 주의.",
          hasTicket: true,
          prepId: "p-2",
          infoId: "si-1",
          expenseId: null,
        },
      ],
      3: [],
    },
    ticketTypes: [
      {
        id: "tt-1",
        name: "아시아나 항공권 (OZ102)",
        mode: "individual",
        linkedItineraryId: "it-1",
        registrations: {
          u1: { type: "QR", code: "QR-FELIX-01", uploadedBy: "u1" },
          u2: { type: "QR", code: "QR-JIMIN-01", uploadedBy: "u2" },
        },
      },
      {
        id: "tt-2",
        name: "시부야 스카이 입장권",
        mode: "group",
        linkedItineraryId: "it-3",
        registrations: {
          all: { type: "QR", code: "GROUP-QR-99", uploadedBy: "u1" },
        },
      },
    ],
    expenses: [
      {
        id: "ex-1",
        title: "이치란 라멘 (점심)",
        amount: 42000,
        payer: "지민",
        category: "Meal",
        linkedItineraryId: "it-4",
      },
      {
        id: "ex-2",
        title: "숙소 잔금 결제",
        amount: 350000,
        payer: "Felix",
        category: "Stay",
        linkedItineraryId: null,
      },
      {
        id: "ex-3",
        title: "스카이라이너 티켓",
        amount: 75000,
        payer: "태형",
        category: "Transport",
        linkedItineraryId: "it-2",
      },
    ],
    notices: [
      { id: "n-1", content: "여권 만료일 다들 꼭 확인하기!", author: "Felix" },
      {
        id: "n-2",
        content: "공항철도 티켓은 태형이가 일괄 구매 완료",
        author: "태형",
      },
    ],
    preparations: [
      {
        id: "p-1",
        content: "여권 및 비자 서류",
        checked: true,
        type: "personal",
        linkedItineraryId: "it-1",
      },
      {
        id: "p-2",
        content: "보조배터리 (전시 촬영용)",
        checked: false,
        type: "personal",
        linkedItineraryId: "it-5",
      },
      {
        id: "p-3",
        content: "돼지코(110V) 어댑터",
        checked: true,
        type: "common",
        linkedItineraryId: null,
      },
    ],
    sharedInfo: [
      {
        id: "si-1",
        title: "일본 전압 정보",
        content:
          "110V 사용, 돼지코 필수 지참 필요. 호텔에서 대여 가능한지 확인 완료.",
        category: "Tip",
        linkedItineraryId: "it-5",
      },
      {
        id: "si-2",
        title: "현지 비상 연락처",
        content: "대사관: +81-3-3452-7611, 긴급 경찰: 110",
        category: "Emergency",
        linkedItineraryId: "it-1",
      },
    ],
  },
];

const App = () => {
  const [view, setView] = useState("home");
  const [activeTab, setActiveTab] = useState("schedule");
  const [scheduleMode, setScheduleMode] = useState("list");

  const [trips, setTrips] = useState(INITIAL_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [checkedItems, setCheckedItems] = useState(new Set());

  // Modal/Detail States
  const [selectedItineraryItem, setSelectedItineraryItem] = useState(null);
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
    setNotifications((prev) => [...prev, { id, msg }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      3000
    );
  };

  const toggleItemCheck = (id) => {
    const next = new Set(checkedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedItems(next);
  };

  const openTrip = (trip) => {
    setSelectedTrip(trip);
    setView("detail");
    setActiveTab("schedule");
  };

  const getLinkedItemName = (id) => {
    if (!id || !selectedTrip) return null;
    const allItems = [
      ...(selectedTrip.itinerary[1] || []),
      ...(selectedTrip.itinerary[2] || []),
      ...(selectedTrip.itinerary[3] || []),
    ];
    return allItems.find((it) => it.id === id)?.title;
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-900 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-slate-200 antialiased">
      {/* -------------------- VIEW: HOME -------------------- */}
      {view === "home" && (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
          <header className="px-6 pt-12 pb-6 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex justify-between items-end sticky top-0 z-50">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                Trips
              </h1>
              <p className="text-[11px] text-blue-600 font-black uppercase tracking-widest mt-2">
                Adventure Awaits
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2.5 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2.5 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <section>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">
                On Going
              </h2>
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => openTrip(trip)}
                  className="relative bg-white rounded-[40px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 active:scale-[0.97] transition-all cursor-pointer group mb-4"
                >
                  <div className="h-52 relative overflow-hidden">
                    <img
                      src={trip.image}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-black border border-white/20">
                      LIVE
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-2xl font-black text-white tracking-tight mb-1">
                        {trip.title}
                      </h3>
                      <div className="flex items-center gap-2 text-white/70 text-xs font-bold">
                        <Calendar className="w-3.5 h-3.5" /> {trip.date}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-5 flex justify-between items-center bg-white">
                    <div className="flex -space-x-3">
                      {trip.participants.map((p, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full border-4 border-white shadow-sm overflow-hidden bg-slate-100"
                        >
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.image}`}
                            alt={p.name}
                          />
                        </div>
                      ))}
                      <div className="w-10 h-10 rounded-full border-4 border-white bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm z-10">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-2xl text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </section>
            <button
              onClick={() => setShowCreateTripModal(true)}
              className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-slate-400 gap-3 hover:bg-white hover:border-blue-300 hover:text-blue-500 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-110 transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-black text-xs uppercase tracking-widest leading-none">
                Create New Trip
              </span>
            </button>
          </main>
        </div>
      )}

      {/* -------------------- VIEW: DETAIL -------------------- */}
      {view === "detail" && selectedTrip && (
        <div className="flex flex-col h-full relative animate-in slide-in-from-right-10 duration-500">
          <header className="px-6 pt-12 pb-5 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex justify-between items-end sticky top-0 z-50">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setView("home")}
                className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors group"
              >
                <ChevronLeft className="w-4 h-4" />{" "}
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  Dashboard
                </span>
              </button>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                {selectedTrip.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-3">
                {selectedTrip.participants.map((p, i) => (
                  <img
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-white shadow-md bg-slate-100"
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.image}`}
                    alt={p.name}
                  />
                ))}
              </div>
              <button className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
                <Users className="w-4 h-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-32 bg-[#F8FAFC]">
            {/* --- TAB: SCHEDULE --- */}
            {activeTab === "schedule" && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-black tracking-tight leading-none">
                      Itinerary
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                      Day by Day Plan
                    </p>
                  </div>
                  <div className="bg-slate-200/50 p-1 rounded-2xl flex gap-1">
                    <button
                      onClick={() => setScheduleMode("list")}
                      className={`p-2.5 rounded-xl transition-all ${
                        scheduleMode === "list"
                          ? "bg-white shadow-sm text-blue-600 scale-105"
                          : "text-slate-400"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setScheduleMode("map")}
                      className={`p-2.5 rounded-xl transition-all ${
                        scheduleMode === "map"
                          ? "bg-white shadow-sm text-blue-600 scale-105"
                          : "text-slate-400"
                      }`}
                    >
                      <MapIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5 px-6 py-5 overflow-x-auto no-scrollbar border-b border-slate-100 sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-40">
                  {[1, 2, 3].map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`flex-shrink-0 min-w-[80px] px-6 py-3 rounded-2xl text-[11px] font-black transition-all ${
                        selectedDay === day
                          ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                          : "bg-white text-slate-400 border border-slate-100"
                      }`}
                    >
                      DAY {day}
                    </button>
                  ))}
                </div>

                {scheduleMode === "list" ? (
                  <div className="p-6 space-y-5 relative before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200/50">
                    {(selectedTrip.itinerary[selectedDay] || []).length > 0 ? (
                      selectedTrip.itinerary[selectedDay].map((item, idx) => {
                        const isChecked = checkedItems.has(item.id);
                        const linkedExpense = selectedTrip.expenses.find(
                          (ex) => ex.linkedItineraryId === item.id
                        );
                        return (
                          <div
                            key={item.id}
                            className="relative pl-9 flex items-start gap-4 animate-in slide-in-from-right-4 duration-300"
                            style={{ transitionDelay: `${idx * 100}ms` }}
                          >
                            <button
                              onClick={() => toggleItemCheck(item.id)}
                              className={`absolute left-0 top-3 w-[24px] h-[24px] rounded-full bg-white flex items-center justify-center z-10 transition-all border-[3px] ${
                                isChecked
                                  ? "bg-blue-500 border-blue-500 shadow-lg shadow-blue-200"
                                  : "border-slate-200"
                              }`}
                            >
                              {isChecked && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              )}
                            </button>
                            <div
                              onClick={() => setSelectedItineraryItem(item)}
                              className={`flex-1 p-5 rounded-[32px] border transition-all duration-300 cursor-pointer ${
                                isChecked
                                  ? "bg-slate-100 border-transparent opacity-60"
                                  : "bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] border-slate-100 active:scale-[0.98]"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${
                                      isChecked
                                        ? "text-slate-300"
                                        : "text-blue-600"
                                    }`}
                                  >
                                    {item.time}
                                  </span>
                                  <h3
                                    className={`font-black text-[15px] leading-tight ${
                                      isChecked
                                        ? "text-slate-400 line-through"
                                        : "text-slate-800"
                                    }`}
                                  >
                                    {item.title}
                                  </h3>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 pt-1">
                                  {item.hasTicket && (
                                    <LinkedBadge
                                      color="orange"
                                      icon={Ticket}
                                      label="TICKET"
                                    />
                                  )}
                                  {linkedExpense && (
                                    <LinkedBadge
                                      color="green"
                                      icon={DollarSign}
                                      label={`₩${linkedExpense.amount.toLocaleString()}`}
                                    />
                                  )}
                                </div>
                              </div>
                              <p className="text-[12px] text-slate-400 font-medium leading-relaxed truncate">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-24 text-center">
                        <Calendar className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                          일정이 없습니다.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 h-[500px] animate-in zoom-in-95">
                    <div className="w-full h-full bg-white rounded-[48px] border-[6px] border-white shadow-xl flex flex-col items-center justify-center gap-6">
                      <MapPin className="w-10 h-10 text-blue-600 animate-bounce" />
                      <p className="text-xs font-black text-slate-900 tracking-tight uppercase">
                        Interactive Map Loading...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB: QUICK-PASS --- */}
            {activeTab === "tickets" && (
              <div className="p-6 space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black tracking-tight leading-none">
                      Quick-Pass
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-[0.2em]">
                      Smart Wallet
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddTicketModal(true)}
                    className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl transition-all active:scale-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {selectedTrip.ticketTypes.map((type, idx) => {
                    const regCount = Object.keys(type.registrations).length;
                    const totalNeeded =
                      type.mode === "group"
                        ? 1
                        : selectedTrip.participants.length;
                    const isDone = regCount >= totalNeeded;
                    const linkedName = getLinkedItemName(
                      type.linkedItineraryId
                    );
                    return (
                      <div
                        key={type.id}
                        onClick={() => setSelectedTicketType(type)}
                        className="bg-white rounded-[40px] p-6 border border-slate-100 shadow-sm flex items-center gap-5 active:scale-[0.98] transition-all cursor-pointer group"
                      >
                        <div
                          className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all group-hover:rotate-6 ${
                            isDone
                              ? "bg-blue-50 text-blue-500"
                              : "bg-orange-50 text-orange-500"
                          }`}
                        >
                          <Ticket className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                              {type.mode === "group" ? "Group" : "Indiv"}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase tracking-tighter ${
                                isDone ? "text-blue-500" : "text-orange-500"
                              }`}
                            >
                              {isDone
                                ? "READY"
                                : `WAITING (${regCount}/${totalNeeded})`}
                            </span>
                          </div>
                          <h3 className="font-black text-slate-800 text-base leading-tight group-hover:text-blue-600">
                            {type.name}
                          </h3>
                          {linkedName && (
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-300 font-bold">
                              <LinkIcon className="w-3 h-3" /> {linkedName}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-slate-400" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- TAB: BUDGET --- */}
            {activeTab === "budget" && (
              <div className="p-6 space-y-8 animate-in slide-in-from-bottom-6 duration-500">
                <header className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black tracking-tight leading-none">
                      Wallet
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-[0.2em]">
                      Shared Expenses
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl transition-all active:scale-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </header>
                <div className="bg-slate-900 rounded-[48px] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-blue-500/30 transition-all duration-1000" />
                  <div className="relative z-10">
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mb-2 leading-none">
                      Total Expense
                    </p>
                    <div className="flex items-baseline gap-2 mb-8">
                      <span className="text-4xl font-black font-mono tracking-tighter leading-none">
                        ₩ 467,000
                      </span>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <div className="pt-8 border-t border-slate-800 flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">
                          Split (1/3)
                        </p>
                        <p className="text-base font-black text-blue-400 font-mono tracking-tight leading-none">
                          ₩ 155,666
                        </p>
                      </div>
                      <button className="bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                        Settlement
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    Recent Transactions
                  </h4>
                  {selectedTrip.expenses.map((ex, i) => (
                    <div
                      key={ex.id}
                      className="bg-white p-5 rounded-[32px] flex justify-between items-center border border-slate-100 shadow-sm active:scale-[0.98] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                          {ex.category[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-tight group-hover:text-blue-600">
                            {ex.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Paid by {ex.payer}
                          </p>
                        </div>
                      </div>
                      <span className="text-base font-black text-slate-900 tracking-tight font-mono">
                        ₩{ex.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TAB: PREPS --- */}
            {activeTab === "preps" && (
              <div className="p-6 space-y-8 animate-in fade-in duration-300">
                <header className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black tracking-tight leading-none">
                      Checklist
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-[0.2em]">
                      Don't Forget
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddPrepModal(true)}
                    className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl transition-all active:scale-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </header>
                <div className="space-y-8">
                  {[
                    { key: "common", label: "Common Items" },
                    { key: "personal", label: "Personal Items" },
                  ].map((group) => (
                    <div key={group.key} className="space-y-3">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                        {group.label}
                      </h3>
                      {selectedTrip.preparations
                        .filter((p) => p.type === group.key)
                        .map((prep) => (
                          <div
                            key={prep.id}
                            className={`bg-white p-5 rounded-[32px] border shadow-sm flex items-center gap-4 transition-all ${
                              prep.checked
                                ? "border-transparent opacity-60 bg-slate-50"
                                : "border-slate-100"
                            }`}
                          >
                            <button
                              className={`p-1.5 rounded-xl transition-all ${
                                prep.checked
                                  ? "bg-blue-500 text-white"
                                  : "bg-slate-50 text-slate-300"
                              }`}
                            >
                              {prep.checked ? (
                                <CheckSquare className="w-6 h-6" />
                              ) : (
                                <Square className="w-6 h-6" />
                              )}
                            </button>
                            <div className="flex-1">
                              <p
                                className={`text-base font-black leading-tight ${
                                  prep.checked
                                    ? "text-slate-400 line-through"
                                    : "text-slate-700"
                                }`}
                              >
                                {prep.content}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TAB: INFO --- */}
            {activeTab === "info" && (
              <div className="p-6 space-y-10 animate-in fade-in duration-500">
                <section className="space-y-5">
                  <header className="flex justify-between items-center px-1">
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                      <Megaphone className="w-6 h-6 text-orange-500" /> Notices
                    </h2>
                    <button className="p-2.5 bg-slate-100 text-slate-400 rounded-2xl active:scale-90 transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </header>
                  {selectedTrip.notices.map((notice, i) => (
                    <div
                      key={notice.id}
                      className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group"
                    >
                      <p className="text-[15px] text-slate-800 font-bold leading-relaxed mb-4 relative z-10">
                        {notice.content}
                      </p>
                      <div className="flex items-center gap-2 relative z-10">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notice.author}`}
                          className="w-6 h-6 rounded-full bg-slate-100"
                          alt="author"
                        />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          {notice.author}
                        </span>
                      </div>
                    </div>
                  ))}
                </section>
                <section className="space-y-5 pb-10">
                  <header className="flex justify-between items-center px-1">
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                      <Info className="w-6 h-6 text-blue-500" /> Travel Tips
                    </h2>
                    <button
                      onClick={() => setShowAddInfoModal(true)}
                      className="p-2.5 bg-slate-100 text-slate-400 rounded-2xl active:scale-90 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </header>
                  {selectedTrip.sharedInfo.map((info, i) => (
                    <div
                      key={info.id}
                      className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm relative group active:scale-[0.98] transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                          {info.category}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-base mb-2 group-hover:text-blue-600 transition-colors">
                        {info.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        {info.content}
                      </p>
                    </div>
                  ))}
                </section>
              </div>
            )}
          </main>

          <nav className="bg-white/70 backdrop-blur-xl border-t border-slate-100 px-4 pb-10 pt-4 flex justify-between items-center absolute bottom-0 left-0 right-0 z-[60] shadow-up rounded-t-[40px]">
            <NavButton
              active={activeTab === "schedule"}
              icon={Calendar}
              label="Schedule"
              onClick={() => setActiveTab("schedule")}
            />
            <NavButton
              active={activeTab === "tickets"}
              icon={Ticket}
              label="Quick-Pass"
              onClick={() => setActiveTab("tickets")}
            />
            <NavButton
              active={activeTab === "budget"}
              icon={Wallet}
              label="Wallet"
              onClick={() => setActiveTab("budget")}
            />
            <NavButton
              active={activeTab === "preps"}
              icon={ClipboardList}
              label="Checklist"
              onClick={() => setActiveTab("preps")}
            />
            <NavButton
              active={activeTab === "info"}
              icon={Info}
              label="Info"
              onClick={() => setActiveTab("info")}
            />
          </nav>
        </div>
      )}

      {/* -------------------- OVERLAY: NOTIFICATIONS -------------------- */}
      <div className="absolute top-28 left-0 right-0 px-6 z-[200] pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="mb-3 bg-slate-900/90 text-white px-5 py-4 rounded-[28px] shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-6 pointer-events-auto border border-white/10 backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <Bell className="w-4 h-4" />
            </div>
            <p className="text-xs font-black leading-tight tracking-tight">
              {n.msg}
            </p>
          </div>
        ))}
      </div>

      {/* -------------------- MODAL: ITINERARY DETAIL -------------------- */}
      {selectedItineraryItem && (
        <ItineraryDetailModal
          item={selectedItineraryItem}
          trip={selectedTrip}
          onClose={() => setSelectedItineraryItem(null)}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setSelectedItineraryItem(null);
          }}
          onViewTicket={(type) => {
            setSelectedTicketType(type);
            setSelectedItineraryItem(null);
          }}
        />
      )}

      {/* -------------------- MODAL: TICKET TYPE DETAIL -------------------- */}
      {selectedTicketType && (
        <div className="absolute inset-0 z-[100] bg-[#F8FAFC] flex flex-col animate-in slide-in-from-right-10 duration-400">
          <header className="px-6 pt-12 pb-5 bg-white border-b border-slate-100 flex items-center gap-5 sticky top-0 z-10">
            <button
              onClick={() => setSelectedTicketType(null)}
              className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all hover:bg-slate-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                {selectedTicketType.mode === "group" ? "Shared" : "Individual"}
              </span>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {selectedTicketType.name}
              </h2>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 space-y-8">
            {selectedTicketType.mode === "group" ? (
              <div className="space-y-6">
                <div className="bg-blue-600 rounded-[48px] p-10 text-white shadow-2xl flex flex-col items-center text-center gap-6 relative overflow-hidden">
                  <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center backdrop-blur-md border border-white/20">
                    <Users className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-xl leading-tight text-center">
                      Shared Group Access
                    </h4>
                    <p className="text-xs text-blue-100 font-bold leading-relaxed opacity-80 text-center">
                      한 명만 등록해도 <br /> 멤버 모두가 이 티켓을 사용합니다.
                    </p>
                  </div>
                </div>
                {selectedTicketType.registrations["all"] ? (
                  <div
                    onClick={() =>
                      setViewingTicket(selectedTicketType.registrations["all"])
                    }
                    className="bg-white p-7 rounded-[48px] border-[3px] border-slate-900 flex items-center gap-6 cursor-pointer active:scale-95 shadow-xl group"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-900">
                      <QrCode className="w-10 h-10" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-1">
                        Voucher Ready
                      </p>
                      <h4 className="font-black text-xl text-slate-800">
                        Open QR Pass
                      </h4>
                    </div>
                    <Maximize2 className="w-6 h-6 text-slate-300" />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setUploadTargetUser(null);
                      setShowUploadModal(true);
                    }}
                    className="w-full py-16 border-2 border-dashed border-slate-200 rounded-[48px] text-slate-400 font-black text-sm uppercase tracking-widest hover:bg-white transition-all"
                  >
                    Upload Common Ticket
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                  Member Registration
                </h3>
                {selectedTrip.participants.map((p) => {
                  const reg = selectedTicketType.registrations[p.id];
                  return (
                    <div
                      key={p.id}
                      className={`p-5 rounded-[36px] border flex items-center gap-5 transition-all ${
                        reg
                          ? "bg-white border-slate-100 shadow-sm"
                          : "bg-slate-50 border-slate-200 opacity-80"
                      }`}
                    >
                      <div className="relative">
                        <img
                          className="w-14 h-14 rounded-full bg-white shadow-md border-2 border-white"
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.image}`}
                          alt={p.name}
                        />
                        {reg && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full border-2 border-white p-1 shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-black text-base ${
                            reg ? "text-slate-800" : "text-slate-400"
                          }`}
                        >
                          {p.name}
                        </h4>
                        <p
                          className={`text-[11px] font-black uppercase tracking-widest ${
                            reg ? "text-blue-500" : "text-slate-400"
                          }`}
                        >
                          {reg ? "Ready to use" : "Missing ticket"}
                        </p>
                      </div>
                      {reg ? (
                        <button
                          onClick={() => setViewingTicket(reg)}
                          className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg active:scale-90 transition-all"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setUploadTargetUser(p);
                            setShowUploadModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all"
                        >
                          <UserPlus className="w-4 h-4" /> Delegate
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}

      {/* -------------------- MODAL: UPLOAD TICKET -------------------- */}
      {showUploadModal && (
        <div className="absolute inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-[56px] p-10 animate-in slide-in-from-bottom-10 duration-500 text-center shadow-2xl">
            <div className="w-14 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
            <h2 className="text-2xl font-black mb-2">Upload Ticket ✨</h2>
            <p className="text-xs text-slate-400 mb-10 font-bold uppercase tracking-widest text-center">
              Supports QR, Barcode, Images
            </p>
            <div className="grid grid-cols-2 gap-5 mb-10">
              <button className="flex flex-col items-center gap-4 p-8 bg-slate-50 rounded-[40px] group transition-all hover:bg-blue-50">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:scale-110 shadow-sm transition-all">
                  <Camera className="w-8 h-8" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-blue-600">
                  Scan QR
                </span>
              </button>
              <button className="flex flex-col items-center gap-4 p-8 bg-slate-50 rounded-[40px] group transition-all hover:bg-blue-50">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:scale-110 shadow-sm transition-all">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-blue-600">
                  Library
                </span>
              </button>
            </div>
            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full py-5 bg-slate-100 rounded-[28px] font-black text-slate-500 uppercase tracking-widest text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: TICKET VIEW -------------------- */}
      {viewingTicket && (
        <div className="absolute inset-0 z-[300] bg-white animate-in fade-in zoom-in-95 duration-400 flex flex-col items-center justify-center p-10 text-center">
          <button
            onClick={() => setViewingTicket(null)}
            className="absolute top-12 right-10 p-4 bg-slate-50 rounded-full text-slate-400 active:scale-90 shadow-sm transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="mb-12">
            <span className="px-4 py-1.5 bg-blue-100 text-blue-600 text-[11px] font-black rounded-full uppercase tracking-[0.2em] border border-blue-200">
              Live Access Pass
            </span>
            <h2 className="text-3xl font-black text-slate-900 leading-tight mt-6 tracking-tight">
              {selectedTicketType?.name}
            </h2>
          </div>
          <div className="bg-white p-10 rounded-[64px] border-[8px] border-slate-900 shadow-2xl w-full max-w-[340px] flex flex-col items-center gap-10 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-2 bg-slate-900 opacity-10 animate-scan" />
            <div className="transition-transform group-hover:scale-105 duration-700">
              {viewingTicket.type === "QR" ? (
                <QrCode className="w-56 h-56 text-slate-900" />
              ) : (
                <Barcode className="w-56 h-36 text-slate-900" />
              )}
            </div>
            <div className="w-full pt-10 border-t-4 border-dashed border-slate-50">
              <p className="text-[11px] text-slate-300 font-black uppercase tracking-[0.3em] mb-2">
                Voucher Code
              </p>
              <p className="text-3xl font-mono font-black text-slate-900 tracking-tighter">
                {viewingTicket.code}
              </p>
            </div>
          </div>
          <button
            onClick={() => setViewingTicket(null)}
            className="mt-16 w-full max-w-[340px] py-6 bg-slate-900 rounded-[32px] font-black text-white flex items-center justify-center gap-4 active:scale-95 shadow-2xl shadow-slate-300 transition-all text-sm uppercase tracking-widest"
          >
            <Maximize2 className="w-6 h-6" /> Fix Brightness
          </button>
        </div>
      )}

      {/* -------------------- GENERIC CREATE MODALS -------------------- */}
      {(showAddTicketModal ||
        showAddPrepModal ||
        showAddInfoModal ||
        showAddExpenseModal) && (
        <CreateLinkModal
          title={
            showAddTicketModal
              ? "Add Ticket"
              : showAddPrepModal
              ? "Add Prep"
              : showAddInfoModal
              ? "Add Tip"
              : "Add Expense"
          }
          placeholder="Enter details..."
          onClose={() => {
            setShowAddTicketModal(false);
            setShowAddPrepModal(false);
            setShowAddInfoModal(false);
            setShowAddExpenseModal(false);
          }}
          isExpense={showAddExpenseModal}
          isPrep={showAddPrepModal}
        />
      )}

      {/* -------------------- MODAL: CREATE TRIP -------------------- */}
      {showCreateTripModal && (
        <div className="absolute inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-[56px] p-10 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl text-center">
            <div className="w-14 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
            <h2 className="text-2xl font-black mb-8 tracking-tight text-center">
              New Adventure ✨
            </h2>
            <div className="space-y-6 mb-12">
              <input
                className="w-full bg-slate-50 border-2 border-transparent rounded-[28px] px-8 py-5 text-slate-900 font-black focus:border-blue-500 outline-none text-lg"
                placeholder="Where to go?"
              />
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-slate-50 p-6 rounded-[32px]">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">
                    Departure
                  </p>
                  <p className="text-base font-black">2024.08.01</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[32px]">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">
                    Return
                  </p>
                  <p className="text-base font-black">2024.08.05</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateTripModal(false)}
                className="flex-1 py-5 bg-slate-100 rounded-[28px] font-black text-slate-400 text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateTripModal(false)}
                className="flex-[2] py-5 bg-blue-600 rounded-[28px] font-black text-white text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Create Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Reusable & Sub-Components ---

const ItineraryDetailModal = ({
  item,
  trip,
  onClose,
  onNavigate,
  onViewTicket,
}) => {
  const linkedTicket = trip.ticketTypes.find(
    (t) => t.linkedItineraryId === item.id
  );
  const linkedPrep = trip.preparations.find(
    (p) => p.linkedItineraryId === item.id
  );
  const linkedInfo = trip.sharedInfo.find(
    (i) => i.linkedItineraryId === item.id
  );
  const linkedExpense = trip.expenses.find(
    (ex) => ex.linkedItineraryId === item.id
  );

  return (
    <div className="absolute inset-0 z-[200] bg-[#F8FAFC] flex flex-col animate-in slide-in-from-bottom-10 duration-500">
      <header className="px-6 pt-12 pb-5 bg-white border-b border-slate-50 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
            장소 상세 정보
          </h2>
        </div>
        <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all">
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* Header Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-black rounded-full uppercase tracking-widest shadow-md shadow-blue-100">
              {item.time}
            </span>
            <div className="flex -space-x-2">
              {INITIAL_PARTICIPANTS.map((p, i) => (
                <img
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.image}`}
                  alt={p.name}
                />
              ))}
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
            {item.title}
          </h1>
          <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
            {item.desc}
          </p>
          <button className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest pt-2 group">
            <Navigation className="w-4 h-4 group-hover:animate-bounce" /> 길
            찾기 시작
          </button>
        </section>

        {/* Linked Data Section */}
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 leading-none">
            Linked Information
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {/* Ticket Card */}
            {linkedTicket ? (
              <div
                onClick={() => onViewTicket(linkedTicket)}
                className="bg-orange-50 border border-orange-100 p-5 rounded-[32px] flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-0.5">
                    Quick-Pass Linked
                  </p>
                  <h4 className="font-black text-slate-800 text-sm">
                    {linkedTicket.name}
                  </h4>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-200" />
              </div>
            ) : (
              <EmptyLink icon={Ticket} label="티켓 연결하기" color="orange" />
            )}

            {/* Prep Card */}
            {linkedPrep ? (
              <div
                onClick={() => onNavigate("preps")}
                className="bg-blue-50 border border-blue-100 p-5 rounded-[32px] flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">
                    Preparation
                  </p>
                  <h4 className="font-black text-slate-800 text-sm">
                    {linkedPrep.content}
                  </h4>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-200" />
              </div>
            ) : (
              <EmptyLink
                icon={CheckSquare}
                label="준비물 연결하기"
                color="blue"
              />
            )}

            {/* Expense Card */}
            {linkedExpense ? (
              <div
                onClick={() => onNavigate("budget")}
                className="bg-green-50 border border-green-100 p-5 rounded-[32px] flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-0.5">
                    Budget Spent
                  </p>
                  <h4 className="font-black text-slate-800 text-sm">
                    ₩{linkedExpense.amount.toLocaleString()} (
                    {linkedExpense.title})
                  </h4>
                </div>
                <ChevronRight className="w-5 h-5 text-green-200" />
              </div>
            ) : (
              <EmptyLink
                icon={DollarSign}
                label="지출 내역 기록"
                color="green"
              />
            )}

            {/* Info Card */}
            {linkedInfo ? (
              <div
                onClick={() => onNavigate("info")}
                className="bg-slate-100 border border-slate-200 p-5 rounded-[32px] flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <Info className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Travel Info Tip
                  </p>
                  <h4 className="font-black text-slate-800 text-sm">
                    {linkedInfo.title}
                  </h4>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            ) : (
              <EmptyLink icon={Info} label="여행 팁 추가하기" color="slate" />
            )}
          </div>
        </section>
      </main>

      <div className="absolute bottom-10 left-6 right-6 z-20">
        <button
          onClick={onClose}
          className="w-full py-5 bg-slate-900 rounded-[32px] font-black text-white text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
        >
          Close Details
        </button>
      </div>
    </div>
  );
};

const EmptyLink = ({ icon: Icon, label, color }) => {
  const colors = {
    orange: "text-orange-200 border-orange-100 bg-orange-50/20",
    blue: "text-blue-200 border-blue-100 bg-blue-50/20",
    green: "text-green-200 border-green-100 bg-green-50/20",
    slate: "text-slate-200 border-slate-200 bg-slate-50/20",
  };
  return (
    <div
      className={`p-4 rounded-[28px] border-2 border-dashed flex items-center justify-center gap-3 opacity-60 ${colors[color]}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};

const LinkedBadge = ({ color, icon: Icon, label }) => {
  const colors = {
    orange: "bg-orange-50 text-orange-500 border-orange-100",
    blue: "bg-blue-50 text-blue-500 border-blue-100",
    slate: "bg-slate-50 text-slate-500 border-slate-100",
    green: "bg-green-50 text-green-600 border-green-100",
  };
  return (
    <div
      className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border ${colors[color]} uppercase tracking-tighter leading-none`}
    >
      <Icon className="w-2.5 h-2.5" /> {label}
    </div>
  );
};

const NavButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all relative ${
      active ? "text-blue-600 scale-110" : "text-slate-300 hover:text-slate-500"
    }`}
  >
    <div
      className={`p-1 rounded-xl transition-all ${
        active ? "bg-blue-50 shadow-inner" : ""
      }`}
    >
      <Icon className={`w-6 h-6 ${active ? "fill-blue-600/10" : ""}`} />
    </div>
    <span
      className={`text-[10px] font-black uppercase tracking-tighter ${
        active ? "opacity-100" : "opacity-40"
      }`}
    >
      {label}
    </span>
    {active && (
      <div className="absolute -bottom-2 w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
    )}
  </button>
);

const CreateLinkModal = ({
  title,
  placeholder,
  onClose,
  isPrep,
  isExpense,
}) => (
  <div className="absolute inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-end animate-in fade-in duration-300">
    <div className="w-full bg-white rounded-t-[56px] p-10 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl">
      <div className="w-14 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
      <h2 className="text-2xl font-black mb-8 text-center leading-none">
        {title}
      </h2>
      <div className="space-y-6 mb-12">
        <div className="space-y-2">
          <label className="text-[11px] text-slate-400 font-black uppercase tracking-widest ml-2">
            Details
          </label>
          {isExpense ? (
            <div className="flex gap-4">
              <input
                className="flex-[2] bg-slate-50 border-2 border-transparent rounded-[28px] px-8 py-5 text-slate-900 font-black focus:border-blue-500 outline-none"
                placeholder={placeholder}
              />
              <input
                className="flex-1 bg-slate-50 border-2 border-transparent rounded-[28px] px-8 py-5 text-slate-900 font-black focus:border-blue-500 outline-none"
                placeholder="Amount"
              />
            </div>
          ) : (
            <input
              autoFocus
              className="w-full bg-slate-50 border-2 border-transparent rounded-[28px] px-8 py-5 text-slate-900 font-black focus:border-blue-500 outline-none"
              placeholder={placeholder}
            />
          )}
        </div>
        <div className="space-y-2">
          <label className="text-[11px] text-slate-400 font-black uppercase tracking-widest ml-2">
            Itinerary Link
          </label>
          <div className="relative">
            <select className="w-full bg-slate-50 border-2 border-transparent rounded-[28px] px-8 py-5 text-slate-900 font-black focus:border-blue-500 outline-none appearance-none">
              <option>Select an itinerary item...</option>
              <optgroup label="DAY 1">
                <option>인천국제공항 T1</option>
                <option>나리타 국제공항</option>
                <option>시부야 스카이</option>
              </optgroup>
            </select>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
              <ChevronRight className="w-5 h-5 rotate-90" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onClose}
          className="flex-1 py-5 bg-slate-100 rounded-[28px] font-black text-slate-400 text-xs uppercase"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="flex-[2] py-5 bg-blue-600 rounded-[28px] font-black text-white text-xs uppercase shadow-xl"
        >
          Save Record
        </button>
      </div>
    </div>
  </div>
);

export default App;
