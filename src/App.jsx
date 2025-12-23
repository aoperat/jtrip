import { useState, useEffect } from "react";
import {
  Calendar,
  Map as MapIcon,
  Ticket,
  Wallet,
  Plus,
  MapPin,
  ChevronRight,
  Maximize2,
  X,
  QrCode,
  Bell,
  CheckCircle2,
  ChevronLeft,
  Users,
  Camera,
  Image as ImageIcon,
  Barcode,
  Info,
  UserPlus,
  Settings,
  CheckSquare,
  Square,
  List,
  ClipboardList,
  Link as LinkIcon,
  DollarSign,
  Megaphone,
  Navigation,
  Search,
  Loader2,
} from "lucide-react";
import NavButton from "./components/NavButton";
import LinkedBadge from "./components/LinkedBadge";
import LinkBadge from "./components/LinkBadge";
import CreateLinkModal from "./components/CreateLinkModal";
import AddItineraryModal from "./components/AddItineraryModal";
import EditItineraryModal from "./components/EditItineraryModal";
import ItineraryDetailModal from "./components/ItineraryDetailModal";
import MapView from "./components/MapView";
import SettingsView from "./components/SettingsView";
import { useTravels } from "./hooks/useTravels";
import { useItinerary } from "./hooks/useItinerary";
import { useTickets } from "./hooks/useTickets";
import { useExpenses } from "./hooks/useExpenses";
import { usePreparations } from "./hooks/usePreparations";
import { useSharedInfo } from "./hooks/useSharedInfo";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, signOut } = useAuth();
  const {
    travels,
    loading: travelsLoading,
    createTravel,
    addParticipant,
  } = useTravels();

  const [view, setView] = useState("home");
  const [viewHistory, setViewHistory] = useState([]); // 뷰 히스토리 추적
  const [activeTab, setActiveTab] = useState("schedule");
  const [scheduleMode, setScheduleMode] = useState("list");

  const [selectedTripId, setSelectedTripId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [checkedItems, setCheckedItems] = useState(new Set());

  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTargetUser, setUploadTargetUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [travelImagePreview, setTravelImagePreview] = useState("");
  const [travelImageFile, setTravelImageFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Registration Modals
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [showAddPrepModal, setShowAddPrepModal] = useState(false);
  const [showAddInfoModal, setShowAddInfoModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddItineraryModal, setShowAddItineraryModal] = useState(false);
  const [showEditItineraryModal, setShowEditItineraryModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedItineraryItem, setSelectedItineraryItem] = useState(null);

  // 선택된 여행의 데이터 훅
  const {
    itinerary,
    loading: itineraryLoading,
    toggleCheck: toggleItineraryCheck,
    createItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,
  } = useItinerary(selectedTripId);
  const {
    ticketTypes,
    loading: ticketsLoading,
    createTicketType,
  } = useTickets(selectedTripId);
  const {
    expenses,
    loading: expensesLoading,
    totalExpense,
    getParticipantCount,
    createExpense,
  } = useExpenses(selectedTripId);
  const {
    preparations,
    loading: prepsLoading,
    togglePreparation,
    createPreparation,
  } = usePreparations(selectedTripId);
  const {
    sharedInfo,
    notices,
    loading: infoLoading,
    createSharedInfo,
    createNotice,
  } = useSharedInfo(selectedTripId);

  // 선택된 여행 정보 (trips에서 찾기)
  const selectedTrip = travels.find((t) => t.id === selectedTripId);

  // 선택된 여행에 대한 통합 데이터
  // 일정 항목에 연동 정보 추가
  const enrichedItinerary = itinerary
    ? Object.keys(itinerary).reduce((acc, day) => {
        acc[day] = itinerary[day].map((item) => {
          // 티켓 연동 확인
          const linkedTicket = ticketTypes?.find(
            (tt) => tt.linkedItineraryId === item.id
          );
          // 준비물 연동 확인
          const linkedPrep = preparations?.find(
            (p) => p.linkedItineraryId === item.id
          );
          // 정보 연동 확인
          const linkedInfo = sharedInfo?.find(
            (si) => si.linkedItineraryId === item.id
          );
          // 지출 연동 확인
          const linkedExpense = expenses?.find(
            (e) => e.linkedItineraryId === item.id
          );

          return {
            ...item,
            hasTicket: !!linkedTicket,
            prepId: linkedPrep?.id || null,
            infoId: linkedInfo?.id || null,
            expenseId: linkedExpense?.id || null,
          };
        });
        return acc;
      }, {})
    : {};

  const selectedTripData = selectedTrip
    ? {
        ...selectedTrip,
        itinerary: enrichedItinerary,
        ticketTypes: ticketTypes || [],
        expenses: expenses || [],
        preparations: preparations || [],
        sharedInfo: sharedInfo || [],
        notices: notices || [],
      }
    : null;

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, msg }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      3000
    );
  };

  const toggleItemCheck = async (id) => {
    const next = new Set(checkedItems);
    const isChecked = next.has(id);
    if (isChecked) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCheckedItems(next);

    // Supabase에 반영
    if (selectedTripId) {
      await toggleItineraryCheck(id, !isChecked);
    }
  };

  // 뷰 변경 함수 - 히스토리 추적
  const navigateToView = (newView) => {
    if (view !== newView) {
      setViewHistory((prev) => [...prev, view]);
      setView(newView);
    }
  };

  // 뒤로가기 함수
  const goBack = () => {
    if (viewHistory.length > 0) {
      const previousView = viewHistory[viewHistory.length - 1];
      setViewHistory((prev) => prev.slice(0, -1));
      setView(previousView);
    } else {
      // 히스토리가 없으면 기본적으로 home으로
      setView("home");
    }
  };

  const openTrip = (trip) => {
    setSelectedTripId(trip.id);
    navigateToView("detail");
    setActiveTab("schedule");
    setSelectedDay(1);
    setCheckedItems(new Set());
  };

  const getLinkedItemName = (id) => {
    if (!id || !selectedTripData) return null;
    const allItems = Object.values(selectedTripData.itinerary || {}).flat();
    return allItems.find((it) => it.id === id)?.title;
  };

  // 여행 날짜 기반 Day 계산
  const getTravelDays = () => {
    if (!selectedTripData?.start_date || !selectedTripData?.end_date) {
      return [];
    }
    const start = new Date(selectedTripData.start_date);
    const end = new Date(selectedTripData.end_date);
    const days = [];
    let currentDate = new Date(start);
    let dayNumber = 1;

    while (currentDate <= end) {
      days.push({
        day: dayNumber,
        date: new Date(currentDate),
        dateString: currentDate.toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        }),
      });
      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }
    return days;
  };

  const travelDays = getTravelDays();

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-900 font-sans w-full overflow-hidden relative antialiased">
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
              <button
                onClick={() => navigateToView("settings")}
                className="p-2.5 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 space-y-4">
            {travelsLoading ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-400">
                  여행 목록을 불러오는 중...
                </p>
              </div>
            ) : travels.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-400 mb-4">
                  아직 등록된 여행이 없습니다.
                </p>
                <p className="text-xs text-slate-300">
                  새 여행을 만들어보세요!
                </p>
              </div>
            ) : (
              travels.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => openTrip(trip)}
                  className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer group"
                >
                  <div className="h-36 relative">
                    {trip.image ? (
                      <img
                        src={trip.image}
                        alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center ${
                        trip.image ? "hidden" : ""
                      }`}
                    >
                      <div className="text-center text-white">
                        <MapIcon className="w-12 h-12 mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-bold opacity-60">
                          {trip.title}
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold">{trip.title}</h3>
                      <p className="text-[10px] opacity-80 font-medium">
                        {trip.date}
                      </p>
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
              ))
            )}
            <button
              onClick={() => setShowCreateTripModal(true)}
              className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-400 gap-2 hover:bg-white transition-all"
            >
              <Plus className="w-8 h-8" />
              <span className="font-bold text-xs uppercase tracking-widest">
                Plan New Trip
              </span>
            </button>
          </main>
        </div>
      )}

      {/* -------------------- VIEW: DETAIL -------------------- */}
      {view === "detail" && selectedTripData && (
        <div className="flex flex-col h-full relative animate-in slide-in-from-right-10 duration-500">
          <header className="px-6 pt-12 pb-5 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex justify-between items-end sticky top-0 z-50">
            <div className="flex flex-col gap-2">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors group"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  Dashboard
                </span>
              </button>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                {selectedTripData.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-3">
                {selectedTripData.participants?.map((p, i) => (
                  <img
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-white shadow-md bg-slate-100"
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.image}`}
                    alt={p.name}
                  />
                ))}
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
              >
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
                <div className="px-6 pt-4 pb-2">
                  <button
                    onClick={() => setShowAddItineraryModal(true)}
                    className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl transition-all active:scale-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-2.5 px-6 py-5 overflow-x-auto no-scrollbar border-b border-slate-100 sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-40">
                  {travelDays.length > 0 ? (
                    travelDays.map((dayInfo) => (
                      <button
                        key={dayInfo.day}
                        onClick={() => setSelectedDay(dayInfo.day)}
                        className={`flex-shrink-0 min-w-[80px] px-6 py-3 rounded-2xl text-[11px] font-black transition-all ${
                          selectedDay === dayInfo.day
                            ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                            : "bg-white text-slate-400 border border-slate-100"
                        }`}
                      >
                        DAY {dayInfo.day}
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 px-4">
                      날짜 정보가 없습니다.
                    </div>
                  )}
                </div>

                {scheduleMode === "list" ? (
                  <div className="p-6 space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {itineraryLoading ? (
                      <div className="text-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-xs text-slate-400">
                          일정을 불러오는 중...
                        </p>
                      </div>
                    ) : selectedTripData?.itinerary?.[selectedDay]?.length >
                      0 ? (
                      selectedTripData.itinerary[selectedDay].map((item) => {
                        const isChecked =
                          checkedItems.has(item.id) || item.is_checked;
                        const linkedExpense = selectedTripData.expenses?.find(
                          (ex) => ex.linkedItineraryId === item.id
                        );
                        return (
                          <div
                            key={item.id}
                            className="relative pl-8 flex items-start gap-3 animate-in slide-in-from-bottom-2"
                          >
                            <button
                              onClick={() => toggleItemCheck(item.id)}
                              className={`absolute left-0 top-2 w-[24px] h-[24px] rounded-full bg-white flex items-center justify-center z-10 transition-all border-2 ${
                                isChecked
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-slate-300"
                              }`}
                            >
                              {isChecked && (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              )}
                            </button>
                            <div
                              onClick={() => setSelectedItineraryItem(item)}
                              className={`flex-1 p-4 rounded-3xl border transition-all cursor-pointer active:scale-[0.98] ${
                                isChecked
                                  ? "opacity-40 bg-slate-50 border-slate-100"
                                  : "bg-white shadow-sm border-slate-100"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-widest ${
                                    isChecked
                                      ? "text-slate-300"
                                      : "text-blue-500"
                                  }`}
                                >
                                  {item.time}
                                </span>
                                <div className="flex flex-wrap justify-end gap-1 max-w-[150px]">
                                  {item.hasTicket && (
                                    <LinkedBadge
                                      color="orange"
                                      icon={Ticket}
                                      label="TICKET"
                                      onClick={() => setActiveTab("tickets")}
                                    />
                                  )}
                                  {item.prepId && (
                                    <LinkedBadge
                                      color="blue"
                                      icon={CheckSquare}
                                      label="PREP"
                                      onClick={() => setActiveTab("preps")}
                                    />
                                  )}
                                  {item.infoId && (
                                    <LinkedBadge
                                      color="slate"
                                      icon={Info}
                                      label="INFO"
                                      onClick={() => setActiveTab("info")}
                                    />
                                  )}
                                  {linkedExpense && (
                                    <LinkedBadge
                                      color="green"
                                      icon={DollarSign}
                                      label={`₩${linkedExpense.amount.toLocaleString()}`}
                                      onClick={() => setActiveTab("budget")}
                                    />
                                  )}
                                </div>
                              </div>
                              <h3
                                className={`font-bold text-sm leading-tight ${
                                  isChecked
                                    ? "text-slate-400 line-through"
                                    : "text-slate-800"
                                }`}
                              >
                                {item.title}
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                                {item.desc}
                              </p>
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
                  <MapView
                    itineraryItems={
                      selectedTripData?.itinerary?.[selectedDay] || []
                    }
                    selectedDay={selectedDay}
                  />
                )}
              </div>
            )}

            {/* --- TAB: QUICK-PASS --- */}
            {activeTab === "tickets" && (
              <div className="p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold tracking-tight">
                    퀵패스 🎫
                  </h2>
                  <button
                    onClick={() => setShowAddTicketModal(true)}
                    className="p-2 bg-blue-600 text-white rounded-xl active:scale-90 shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {ticketsLoading ? (
                    <div className="text-center py-10">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-xs text-slate-400">
                        티켓을 불러오는 중...
                      </p>
                    </div>
                  ) : selectedTripData?.ticketTypes?.length === 0 ? (
                    <div className="text-center py-10 text-slate-300 text-xs">
                      등록된 티켓이 없습니다.
                    </div>
                  ) : (
                    selectedTripData?.ticketTypes?.map((type) => {
                      const regCount = Object.keys(
                        type.registrations || {}
                      ).length;
                      const totalNeeded =
                        type.mode === "group"
                          ? 1
                          : selectedTripData.participants?.length || 0;
                      const isDone = regCount >= totalNeeded;
                      const linkedName = getLinkedItemName(
                        type.linkedItineraryId
                      );

                      return (
                        <div
                          key={type.id}
                          onClick={() => setSelectedTicketType(type)}
                          className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all cursor-pointer"
                        >
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              isDone
                                ? "bg-blue-50 text-blue-500"
                                : "bg-orange-50 text-orange-500"
                            }`}
                          >
                            <Ticket className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                {type.mode === "group" ? "공통" : "개별"}
                              </span>
                              <span
                                className={`text-[9px] font-bold ${
                                  isDone ? "text-blue-500" : "text-orange-500"
                                }`}
                              >
                                {isDone
                                  ? "완료"
                                  : `등록 중 (${regCount}/${totalNeeded})`}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">
                              {type.name}
                            </h3>
                            {linkedName && <LinkBadge label={linkedName} />}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-200" />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* --- TAB: BUDGET --- */}
            {activeTab === "budget" && (
              <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold tracking-tight text-center">
                    가계부 💰
                  </h2>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="p-2 bg-blue-600 text-white rounded-xl active:scale-90 shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 leading-none">
                    Total Expense
                  </p>
                  <h3 className="text-4xl font-black font-mono tracking-tighter">
                    ₩ {(totalExpense || 0).toLocaleString()}
                  </h3>
                  <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight font-bold uppercase">
                      1/{selectedTripData?.participants?.length || 1} Split : ₩{" "}
                      {Math.floor(
                        (totalExpense || 0) /
                          (selectedTripData?.participants?.length || 1)
                      ).toLocaleString()}
                    </p>
                    <button className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-bold active:scale-95">
                      정산하기
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {expensesLoading ? (
                    <div className="text-center py-10">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-xs text-slate-400">
                        지출 내역을 불러오는 중...
                      </p>
                    </div>
                  ) : selectedTripData?.expenses?.length === 0 ? (
                    <div className="text-center py-10 text-slate-300 text-xs">
                      등록된 지출이 없습니다.
                    </div>
                  ) : (
                    selectedTripData?.expenses?.map((ex) => {
                      const linkedName = getLinkedItemName(
                        ex.linkedItineraryId
                      );
                      return (
                        <div
                          key={ex.id}
                          className="bg-white p-5 rounded-3xl flex justify-between items-center border border-slate-50 shadow-sm active:scale-[0.98] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-xs leading-none text-slate-400">
                              {ex.category?.[0] || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 leading-tight">
                                {ex.title}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                결제: {ex.payer}
                              </p>
                              {linkedName && <LinkBadge label={linkedName} />}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-green-600 tracking-tight">
                            ₩ {ex.amount.toLocaleString()}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* --- TAB: PREPARATIONS --- */}
            {activeTab === "preps" && (
              <div className="p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-2 tracking-tight">
                    <CheckSquare className="w-5 h-5 text-blue-500" /> 준비물
                    체크
                  </h2>
                  <button
                    onClick={() => setShowAddPrepModal(true)}
                    className="p-2 bg-blue-600 text-white rounded-xl active:scale-90 shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-6">
                  {prepsLoading ? (
                    <div className="text-center py-10">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-xs text-slate-400">
                        준비물을 불러오는 중...
                      </p>
                    </div>
                  ) : (
                    [
                      { key: "common", label: "Common Items" },
                      { key: "personal", label: "Personal Items" },
                    ].map((group) => (
                      <div key={group.key} className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          {group.label}
                        </p>
                        {selectedTripData?.preparations
                          ?.filter((p) => p.type === group.key)
                          .map((prep) => {
                            const linkedName = getLinkedItemName(
                              prep.linkedItineraryId
                            );
                            return (
                              <div
                                key={prep.id}
                                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 active:scale-[0.99] transition-all"
                              >
                                <button
                                  onClick={() =>
                                    togglePreparation(prep.id, !prep.checked)
                                  }
                                  className={`p-1 transition-all ${
                                    prep.checked
                                      ? "text-blue-500 scale-110"
                                      : "text-slate-200"
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
                                    className={`text-sm font-bold ${
                                      prep.checked
                                        ? "text-slate-300 line-through"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {prep.content}
                                  </p>
                                  {linkedName && (
                                    <LinkBadge label={linkedName} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* --- TAB: INFORMATION --- */}
            {activeTab === "info" && (
              <div className="p-6 space-y-8 animate-in fade-in duration-300">
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-orange-500" /> 공지사항
                    </h2>
                    <button
                      onClick={async () => {
                        const content = prompt("공지사항 내용을 입력하세요:");
                        if (content && content.trim()) {
                          const result = await createNotice({
                            content: content.trim(),
                          });
                          if (result.error) {
                            alert(
                              "공지사항 생성 실패: " + result.error.message
                            );
                          } else {
                            addNotification("공지사항이 등록되었습니다.");
                          }
                        }
                      }}
                      className="p-2 bg-slate-100 text-slate-400 rounded-xl active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {infoLoading ? (
                      <div className="text-center py-10">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-xs text-slate-400">
                          공지사항을 불러오는 중...
                        </p>
                      </div>
                    ) : selectedTripData?.notices?.length === 0 ? (
                      <div className="text-center py-10 text-slate-300 text-xs">
                        등록된 공지사항이 없습니다.
                      </div>
                    ) : (
                      selectedTripData?.notices?.map((notice) => (
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
                      ))
                    )}
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
                    {selectedTripData?.sharedInfo?.length === 0 ? (
                      <div className="text-center py-10 text-slate-300 text-xs">
                        등록된 정보가 없습니다.
                      </div>
                    ) : (
                      selectedTripData?.sharedInfo?.map((info) => {
                        const linkedName = getLinkedItemName(
                          info.linkedItineraryId
                        );
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
                            <h4 className="font-bold text-slate-800 text-sm mb-1">
                              {info.title}
                            </h4>
                            <p className="text-xs text-slate-400 leading-normal">
                              {info.content}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
            )}
          </main>

          {/* -------------------- BOTTOM NAV -------------------- */}
          <nav className="bg-white/70 backdrop-blur-xl border-t border-slate-100 px-4 pb-10 pt-4 flex justify-between items-center absolute bottom-0 left-0 right-0 z-[60] shadow-up rounded-t-[40px]">
            <NavButton
              active={activeTab === "schedule"}
              icon={Calendar}
              label="일정"
              onClick={() => setActiveTab("schedule")}
            />
            <NavButton
              active={activeTab === "tickets"}
              icon={Ticket}
              label="퀵패스"
              onClick={() => setActiveTab("tickets")}
            />
            <NavButton
              active={activeTab === "budget"}
              icon={Wallet}
              label="예산"
              onClick={() => setActiveTab("budget")}
            />
            <NavButton
              active={activeTab === "preps"}
              icon={ClipboardList}
              label="준비물"
              onClick={() => setActiveTab("preps")}
            />
            <NavButton
              active={activeTab === "info"}
              icon={Info}
              label="정보"
              onClick={() => setActiveTab("info")}
            />
          </nav>
        </div>
      )}

      {/* -------------------- VIEW: SETTINGS -------------------- */}
      {view === "settings" && (
        <SettingsView
          user={user}
          onClose={goBack}
          onSignOut={async () => {
            await signOut();
            setViewHistory([]); // 로그아웃 시 히스토리 초기화
            setView("home");
          }}
        />
      )}

      {/* -------------------- OVERLAY: NOTIFICATIONS -------------------- */}
      <div className="absolute top-24 left-0 right-0 px-4 z-[100] pointer-events-none">
        {notifications.map((n) => (
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
          travelId={selectedTripId}
          itinerary={itinerary}
          onCreate={async (data) => {
            const result = await createTicketType(data);
            if (result.error) {
              alert("티켓 생성 실패: " + result.error.message);
            } else {
              addNotification("티켓이 등록되었습니다.");
            }
          }}
        />
      )}

      {/* PREP MODAL */}
      {showAddPrepModal && (
        <CreateLinkModal
          title="준비물 추가 🎒"
          placeholder="준비물 이름 (예: 상비약)"
          onClose={() => setShowAddPrepModal(false)}
          isPrep
          travelId={selectedTripId}
          itinerary={itinerary}
          onCreate={async (data) => {
            const result = await createPreparation(data);
            if (result.error) {
              alert("준비물 생성 실패: " + result.error.message);
            } else {
              addNotification("준비물이 추가되었습니다.");
            }
          }}
        />
      )}

      {/* INFO MODAL */}
      {showAddInfoModal && (
        <CreateLinkModal
          title="여행 정보 등록 💡"
          placeholder="정보 제목 (예: 팀랩 입장 팁)"
          onClose={() => setShowAddInfoModal(false)}
          isInfo
          travelId={selectedTripId}
          itinerary={itinerary}
          onCreate={async (data) => {
            const result = await createSharedInfo(data);
            if (result.error) {
              alert("정보 생성 실패: " + result.error.message);
            } else {
              addNotification("정보가 등록되었습니다.");
            }
          }}
        />
      )}

      {/* BUDGET MODAL */}
      {showAddExpenseModal && (
        <CreateLinkModal
          title="지출 내역 추가 💸"
          placeholder="내용 (예: 편의점 간식)"
          onClose={() => setShowAddExpenseModal(false)}
          isExpense
          travelId={selectedTripId}
          itinerary={itinerary}
          onCreate={async (data) => {
            const result = await createExpense(data);
            if (result.error) {
              alert("지출 생성 실패: " + result.error.message);
            } else {
              addNotification("지출이 등록되었습니다.");
            }
          }}
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
                {selectedTicketType.mode === "group"
                  ? "공통 티켓"
                  : "개별 티켓"}
              </span>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                {selectedTicketType.name}
              </h2>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedTicketType.mode === "group" ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-5 rounded-[32px] border border-blue-100 flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <p className="text-[11px] text-blue-600 font-bold leading-tight">
                    한 명이 등록하면 모든 멤버가 공유합니다.
                  </p>
                </div>
                {selectedTicketType.registrations?.["all"] ? (
                  <div
                    onClick={() =>
                      setViewingTicket(selectedTicketType.registrations["all"])
                    }
                    className="bg-white p-5 rounded-[32px] border-2 border-slate-900 flex items-center gap-4 cursor-pointer active:scale-95 transition-all"
                  >
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400">
                        READY TO SCAN
                      </p>
                      <h4 className="font-bold text-slate-800">
                        공통 티켓 보기
                      </h4>
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
                  {selectedTripData?.participants?.map((p) => {
                    const reg = selectedTicketType.registrations?.[p.id];
                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-3xl border flex items-center gap-4 transition-all ${
                          reg
                            ? "bg-white border-slate-100"
                            : "bg-slate-50 border-slate-100"
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
                          <h4
                            className={`font-bold text-sm ${
                              reg ? "text-slate-800" : "text-slate-400"
                            }`}
                          >
                            {p.name}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-400 leading-none">
                            {reg ? "등록 완료" : "미등록"}
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
                            <UserPlus className="w-3.5 h-3.5" /> 등록
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
              {uploadTargetUser
                ? `${uploadTargetUser.name}님의 티켓`
                : "공통 티켓"}{" "}
              등록
            </h2>
            <p className="text-xs text-slate-400 mb-8 font-medium">
              바코드, QR, 영수증 이미지를 선택하세요.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-10">
              <button className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-3xl group transition-all hover:bg-blue-50">
                <Camera className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">
                  카메라 스캔
                </span>
              </button>
              <button className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-3xl group transition-all hover:bg-blue-50">
                <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">
                  앨범 선택
                </span>
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

      {/* -------------------- MODAL: ADD ITINERARY -------------------- */}
      {showAddItineraryModal && selectedTripData && (
        <AddItineraryModal
          selectedTripData={selectedTripData}
          travelDays={travelDays}
          createItineraryItem={createItineraryItem}
          addNotification={addNotification}
          setShowAddItineraryModal={setShowAddItineraryModal}
          setSelectedDay={setSelectedDay}
        />
      )}

      {/* -------------------- MODAL: ITINERARY DETAIL -------------------- */}
      {selectedItineraryItem && selectedTripData && (
        <ItineraryDetailModal
          item={selectedItineraryItem}
          trip={selectedTripData}
          isChecked={
            checkedItems.has(selectedItineraryItem.id) ||
            selectedItineraryItem.is_checked
          }
          onClose={() => setSelectedItineraryItem(null)}
          onToggleCheck={async () => {
            const newCheckedState = !(
              checkedItems.has(selectedItineraryItem.id) ||
              selectedItineraryItem.is_checked
            );
            const result = await toggleItineraryCheck(
              selectedItineraryItem.id,
              newCheckedState
            );
            if (!result.error) {
              if (newCheckedState) {
                setCheckedItems(
                  new Set([...checkedItems, selectedItineraryItem.id])
                );
              } else {
                const newSet = new Set(checkedItems);
                newSet.delete(selectedItineraryItem.id);
                setCheckedItems(newSet);
              }
              // 모달에서도 상태 업데이트
              setSelectedItineraryItem({
                ...selectedItineraryItem,
                is_checked: newCheckedState,
              });
            }
          }}
          onEdit={() => {
            setShowEditItineraryModal(true);
          }}
          onDelete={async () => {
            return await deleteItineraryItem(selectedItineraryItem.id);
          }}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setSelectedItineraryItem(null);
          }}
          onViewTicket={(ticketType) => {
            setSelectedTicketType(ticketType);
            setSelectedItineraryItem(null);
          }}
        />
      )}

      {/* -------------------- MODAL: EDIT ITINERARY -------------------- */}
      {showEditItineraryModal && selectedItineraryItem && selectedTripData && (
        <EditItineraryModal
          item={selectedItineraryItem}
          travelDays={travelDays}
          onClose={() => {
            setShowEditItineraryModal(false);
            setSelectedItineraryItem(null);
          }}
          onUpdate={async (updates) => {
            return await updateItineraryItem(selectedItineraryItem.id, {
              day: updates.day,
              time: updates.time,
              title: updates.title,
              description: updates.description,
              location_name: updates.locationName,
              address: updates.address,
              latitude: updates.latitude,
              longitude: updates.longitude,
            });
          }}
          onDelete={async () => {
            const result = await deleteItineraryItem(selectedItineraryItem.id);
            if (!result.error) {
              setShowEditItineraryModal(false);
              setSelectedItineraryItem(null);
            }
            return result;
          }}
        />
      )}

      {/* -------------------- MODAL: INVITE USER -------------------- */}
      {showInviteModal && selectedTripData && (
        <div className="absolute inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-[40px] p-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <h2 className="text-xl font-black mb-6 text-center leading-tight tracking-tight">
              사용자 초대 👥
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get("email");

                if (!email) {
                  alert("이메일을 입력해주세요.");
                  return;
                }

                try {
                  const result = await addParticipant(selectedTripId, email);

                  if (result.error) {
                    alert("초대 실패: " + result.error.message);
                  } else {
                    addNotification("사용자가 초대되었습니다.");
                    setShowInviteModal(false);
                  }
                } catch (error) {
                  alert("오류가 발생했습니다: " + error.message);
                }
              }}
              className="space-y-4 mb-10"
            >
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                  이메일 주소
                </label>
                <input
                  name="email"
                  type="email"
                  autoFocus
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="user@example.com"
                />
                <p className="text-[10px] text-slate-300 mt-2 ml-1 font-medium leading-none">
                  * 초대할 사용자의 이메일 주소를 입력하세요.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-400 text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold text-white text-sm shadow-xl shadow-blue-100 active:scale-95 transition-all"
                >
                  초대하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: CREATE TRIP -------------------- */}
      {showCreateTripModal && (
        <div className="absolute inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-[40px] p-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <h2 className="text-xl font-black mb-6 text-center leading-tight tracking-tight">
              새 여행 만들기 ✈️
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const title = formData.get("title");
                const startDate = formData.get("startDate");
                const endDate = formData.get("endDate");
                let imageUrl = formData.get("imageUrl") || "";

                if (!title || !startDate || !endDate) {
                  alert("모든 필드를 입력해주세요.");
                  return;
                }

                try {
                  // 이미지 파일이 있으면 업로드
                  if (travelImageFile) {
                    setIsUploadingImage(true);
                    const { data: uploadData, error: uploadError } =
                      await uploadTravelImage(travelImageFile, user.id);

                    if (uploadError) {
                      alert("이미지 업로드 실패: " + uploadError.message);
                      setIsUploadingImage(false);
                      return;
                    }

                    imageUrl = uploadData.publicUrl;
                    setIsUploadingImage(false);
                  }

                  // 이미지 URL이 없으면 기본 이미지 사용
                  if (!imageUrl) {
                    imageUrl =
                      "https://images.unsplash.com/photo-1540959733332-e94e270b4052?w=800&q=80";
                  }

                  const result = await createTravel({
                    title,
                    start_date: startDate,
                    end_date: endDate,
                    image_url: imageUrl,
                  });

                  if (result.error) {
                    alert("여행 생성 실패: " + result.error.message);
                  } else {
                    addNotification("여행이 생성되었습니다.");
                    setShowCreateTripModal(false);
                    setTravelImagePreview("");
                    setTravelImageFile(null);
                    if (result.data) {
                      openTrip({
                        id: result.data.id,
                        title,
                        date: `${startDate} - ${endDate}`,
                        image: imageUrl,
                        participants: [],
                      });
                    }
                  }
                } catch (error) {
                  alert("오류가 발생했습니다: " + error.message);
                  setIsUploadingImage(false);
                }
              }}
              className="space-y-4 mb-10"
            >
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                  여행 제목
                </label>
                <input
                  name="title"
                  autoFocus
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="예: 도쿄 여행"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                    출발일
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                    귀국일
                  </label>
                  <input
                    name="endDate"
                    type="date"
                    required
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                  대표 이미지 (선택)
                </label>

                {/* 이미지 미리보기 */}
                {travelImagePreview && (
                  <div className="relative mb-3 rounded-2xl overflow-hidden">
                    <img
                      src={travelImagePreview}
                      alt="미리보기"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTravelImagePreview("");
                        setTravelImageFile(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 파일 업로드 버튼 */}
                <div className="flex gap-2 mb-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // 파일 크기 체크
                          if (file.size > 10 * 1024 * 1024) {
                            alert("파일 크기는 10MB 이하여야 합니다.");
                            return;
                          }

                          // 미리보기 생성
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTravelImagePreview(reader.result);
                          };
                          reader.readAsDataURL(file);
                          setTravelImageFile(file);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm text-center cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      {travelImagePreview ? "이미지 변경" : "이미지 업로드"}
                    </div>
                  </label>
                </div>

                {/* URL 입력 (업로드하지 않을 경우) */}
                <input
                  name="imageUrl"
                  type="url"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="또는 이미지 URL 입력 (https://...)"
                  disabled={!!travelImagePreview}
                />
                <p className="text-[10px] text-slate-300 mt-2 ml-1 font-medium leading-none">
                  * 이미지를 업로드하거나 URL을 입력할 수 있습니다. (최대 10MB)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTripModal(false)}
                  className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-400 text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold text-white text-sm shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    "만들기"
                  )}
                </button>
              </div>
            </form>
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
          <h2 className="text-2xl font-black text-slate-900 leading-tight mb-10">
            {selectedTicketType?.name}
          </h2>

          <div className="bg-white p-8 rounded-[50px] border-[6px] border-slate-900 shadow-2xl w-full max-w-[320px] flex flex-col items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-slate-900 opacity-5 animate-scan" />
            {viewingTicket?.type === "QR" ? (
              <QrCode className="w-52 h-52 text-slate-900" />
            ) : (
              <Barcode className="w-52 h-32 text-slate-900" />
            )}
            <div className="w-full pt-8 border-t-4 border-dashed border-slate-50">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-1 leading-none tracking-tighter">
                Voucher Number
              </p>
              <p className="text-2xl font-mono font-black text-slate-900 tracking-tighter">
                {viewingTicket?.code || "N/A"}
              </p>
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
