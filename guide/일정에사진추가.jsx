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
  ClipboardList,
  Link as LinkIcon,
  DollarSign,
  Search,
  Navigation,
  MoreVertical,
  Mail,
  Lock,
  User,
  LogOut,
  Github,
  Globe,
  RefreshCw,
  Sparkles,
  Smile,
  ChevronDown,
  Palette,
  Eye,
  ShoppingBag,
  PhotoIcon,
} from "lucide-react";

// --- Avatar Customization Options ---
const AVATAR_OPTIONS = {
  top: [
    "longHair",
    "shortHair",
    "bob",
    "curly",
    "shaved",
    "frizzle",
    "dreads",
    "turban",
    "hijab",
  ],
  hairColor: [
    "2c1b18",
    "4a312c",
    "724133",
    "a55728",
    "b58143",
    "c93305",
    "e8e1e1",
    "f59797",
  ],
  skinColor: [
    "614335",
    "ae5d29",
    "d08b5b",
    "edb98a",
    "f8d25c",
    "fd9841",
    "ffdbac",
  ],
  eyes: [
    "default",
    "happy",
    "closed",
    "squint",
    "wink",
    "surprised",
    "eyeRoll",
  ],
  mouth: [
    "default",
    "smile",
    "serious",
    "grimace",
    "twinkle",
    "tongue",
    "eating",
  ],
};

// --- Placeholder Color Generator ---
const getPlaceholderStyle = (title) => {
  const colors = [
    "from-blue-400 to-indigo-600",
    "from-emerald-400 to-teal-600",
    "from-rose-400 to-orange-600",
    "from-purple-400 to-violet-600",
    "from-amber-400 to-orange-500",
  ];
  const index = title.length % colors.length;
  return colors[index];
};

// --- Mock Data (With Photos in Itinerary) ---
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
          desc: "아시아나 항공 체크인 및 수하물 위탁.",
          hasTicket: true,
          prepId: "p-1",
          image:
            "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=500&q=80",
        },
        {
          id: "it-2",
          time: "14:20",
          title: "나리타 국제공항",
          desc: "스카이라이너 탑승.",
          hasTicket: true,
        },
        {
          id: "it-3",
          time: "18:30",
          title: "시부야 스카이",
          desc: "일몰 관람 및 야경 촬영.",
          hasTicket: true,
          image:
            "https://images.unsplash.com/photo-1542359649-31e03ad4d92c?w=500&q=80",
        },
      ],
      2: [
        {
          id: "it-4",
          time: "09:00",
          title: "츠키지 시장",
          desc: "카이센동 투어.",
          hasTicket: false,
        },
        {
          id: "it-5",
          time: "13:00",
          title: "팀랩 플래닛 도쿄",
          desc: "몰입형 미디어 아트 관람.",
          hasTicket: true,
          image:
            "https://images.unsplash.com/photo-1551048839-49c0d7f35497?w=500&q=80",
        },
      ],
      3: [],
    },
    ticketTypes: [
      {
        id: "tt-1",
        name: "아시아나 항공권",
        mode: "individual",
        linkedItineraryId: "it-1",
        registrations: {
          u1: { type: "QR", code: "QR-FELIX-01", uploadedBy: "u1" },
        },
      },
    ],
    expenses: [
      {
        id: "ex-1",
        title: "라멘",
        amount: 42000,
        payer: "지민",
        category: "Meal",
        linkedItineraryId: "it-4",
      },
    ],
    notices: [{ id: "n-1", content: "여권 챙기기!", author: "Felix" }],
    preparations: [
      {
        id: "p-1",
        content: "여권",
        checked: true,
        type: "personal",
        linkedItineraryId: "it-1",
      },
    ],
    sharedInfo: [
      {
        id: "si-1",
        title: "전압 110V",
        content: "돼지코 필수",
        category: "Tip",
      },
    ],
  },
];

const App = () => {
  // --- Auth & User ---
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // --- Main App State ---
  const [view, setView] = useState("home");
  const [activeTab, setActiveTab] = useState("schedule");
  const [scheduleMode, setScheduleMode] = useState("list");
  const [trips, setTrips] = useState(INITIAL_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [notifications, setNotifications] = useState([]);

  // --- Modals ---
  const [selectedItineraryItem, setSelectedItineraryItem] = useState(null);
  const [showAddItineraryModal, setShowAddItineraryModal] = useState(false);

  // --- Avatar Customizer ---
  const [traits, setTraits] = useState({
    top: "shortHair",
    hairColor: "2c1b18",
    skinColor: "ffdbac",
    eyes: "default",
    mouth: "smile",
  });
  const [activeCategory, setActiveCategory] = useState("top");
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?top=${traits.top}&hairColor=${traits.hairColor}&skinColor=${traits.skinColor}&eyes=${traits.eyes}&mouth=${traits.mouth}`;

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, msg }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      3000
    );
  };

  const handleAuth = (e) => {
    e.preventDefault();
    const mockUser = {
      email: "traveler@example.com",
      name: authMode === "login" ? "Felix" : "New Traveler",
      photo:
        authMode === "login"
          ? `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`
          : null,
      avatarSet: authMode === "login" ? true : false,
    };
    setUser(mockUser);
    if (!mockUser.avatarSet) setView("avatar-setup");
    else setView("home");
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

  // -------------------- RENDER: AUTH --------------------
  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-white text-slate-900 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-slate-200 antialiased animate-in fade-in duration-1000">
        <div className="absolute top-0 left-0 w-full h-[45%] bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full -top-40 -right-40 blur-[100px] animate-pulse" />
          <div className="relative z-10 flex flex-col items-center text-center px-10">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-[32px] flex items-center justify-center border border-white/20 shadow-2xl mb-6">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">
              Travel-With
            </h1>
          </div>
        </div>
        <main className="flex-1 p-8 pt-12 flex flex-col mt-[45%] bg-white rounded-t-[60px] relative z-20 shadow-up">
          <div className="mb-10 flex bg-slate-100 p-1.5 rounded-2xl w-full">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${
                authMode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${
                authMode === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              Sign Up
            </button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === "signup" && (
              <AuthInput icon={User} placeholder="사용자 이름" required />
            )}
            <AuthInput
              icon={Mail}
              type="email"
              placeholder="이메일 주소"
              required
            />
            <AuthInput
              icon={Lock}
              type="password"
              placeholder="비밀번호"
              required
            />
            <button
              type="submit"
              className="w-full py-5 bg-blue-600 text-white rounded-[28px] font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-100 active:scale-95 transition-all mt-4"
            >
              시작하기
            </button>
          </form>
        </main>
      </div>
    );
  }

  // -------------------- RENDER: AVATAR CUSTOMIZER --------------------
  if (view === "avatar-setup") {
    return (
      <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-slate-200 antialiased animate-in slide-in-from-right-10 duration-700">
        <header className="px-6 pt-14 pb-8 bg-white rounded-b-[48px] shadow-sm flex flex-col items-center shrink-0">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-600/10 blur-[60px] rounded-full" />
            <div className="w-44 h-44 bg-slate-50 rounded-[56px] border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden relative z-10 animate-in zoom-in-95">
              <img
                src={avatarUrl}
                alt="preview"
                className="w-full h-full scale-110 object-cover"
              />
            </div>
            <button
              onClick={() => addNotification("랜덤 생성!")}
              className="absolute -bottom-2 -right-2 w-12 h-12 bg-slate-900 text-white rounded-[20px] flex items-center justify-center shadow-2xl z-20 active:scale-90 border-4 border-white"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Avatar Studio</h2>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden bg-white mt-4 rounded-t-[48px]">
          <div className="flex gap-2 p-6 overflow-x-auto no-scrollbar border-b border-slate-50 shrink-0">
            {Object.keys(AVATAR_OPTIONS).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                    : "bg-slate-50 text-slate-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <div className="grid grid-cols-3 gap-4 pb-10">
              {AVATAR_OPTIONS[activeCategory].map((opt, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setTraits((prev) => ({ ...prev, [activeCategory]: opt }))
                  }
                  className={`aspect-square rounded-[32px] border-2 transition-all flex items-center justify-center ${
                    traits[activeCategory] === opt
                      ? "border-blue-600 scale-105 shadow-xl bg-white"
                      : "border-slate-50 bg-slate-50"
                  }`}
                >
                  {activeCategory.includes("Color") ? (
                    <div
                      className="w-10 h-10 rounded-full shadow-inner"
                      style={{ backgroundColor: `#${opt}` }}
                    />
                  ) : (
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?${activeCategory}=${opt}`}
                      alt="opt"
                      className="w-full h-full p-2"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </main>
        <footer className="p-8 pb-12 bg-white border-t border-slate-100">
          <button
            onClick={() => {
              setUser({ ...user, photo: avatarUrl, avatarSet: true });
              setView("home");
            }}
            className="w-full py-5 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest text-sm shadow-2xl active:scale-95 transition-all"
          >
            설정 완료
          </button>
        </footer>
      </div>
    );
  }

  // -------------------- RENDER: APP CONTENT --------------------
  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-900 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-slate-200 antialiased">
      {/* -------------------- VIEW: HOME -------------------- */}
      {view === "home" && (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
          <header className="px-6 pt-14 pb-6 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex justify-between items-end sticky top-0 z-50">
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none text-slate-900">
                Trips
              </h1>
              <p className="text-[11px] text-blue-600 font-black uppercase tracking-widest mt-2">
                나의 여행 리스트
              </p>
            </div>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-xl active:scale-90 bg-slate-100"
            >
              <img src={user.photo} alt="profile" />
            </button>
          </header>
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => openTrip(trip)}
                className="relative bg-white rounded-[44px] overflow-hidden shadow-[0_10px_35px_rgb(0,0,0,0.03)] border border-slate-100 active:scale-[0.97] transition-all cursor-pointer group mb-5"
              >
                <div className="h-56 relative overflow-hidden bg-slate-100">
                  {trip.image ? (
                    <img
                      src={trip.image}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${getPlaceholderStyle(
                        trip.title
                      )}`}
                    >
                      <span className="text-3xl font-black text-white">
                        {trip.title[0]}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent" />
                  <div className="absolute bottom-6 left-8">
                    <h3 className="text-2xl font-black text-white tracking-tight mb-1">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/60 text-xs font-bold">
                      <Calendar className="w-3.5 h-3.5" /> {trip.date}
                    </div>
                  </div>
                </div>
                <div className="px-8 py-5 flex justify-between items-center bg-white">
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
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
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
                className="flex items-center gap-1.5 text-slate-400"
              >
                <ChevronLeft className="w-4 h-4" />{" "}
                <span className="text-[10px] font-black uppercase tracking-widest leading-none text-slate-400">
                  Back
                </span>
              </button>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                {selectedTrip.title}
              </h1>
            </div>
            <button className="w-10 h-10 rounded-2xl bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
              <Users className="w-5 h-5" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto pb-32 bg-[#F8FAFC]">
            {activeTab === "schedule" && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-black tracking-tight leading-none text-slate-800">
                      Itinerary
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                      계획 및 사진
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                    <button
                      onClick={() => setShowAddItineraryModal(true)}
                      className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5 px-6 py-6 overflow-x-auto no-scrollbar border-b border-slate-100 sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-40">
                  {[1, 2, 3].map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`flex-shrink-0 min-w-[85px] px-6 py-3.5 rounded-2xl text-[11px] font-black transition-all ${
                        selectedDay === day
                          ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                          : "bg-white text-slate-400 border border-slate-100"
                      }`}
                    >
                      DAY {day}
                    </button>
                  ))}
                </div>

                <div className="p-6 space-y-5 relative before:absolute before:left-[11px] before:top-6 before:bottom-6 before:w-[2px] before:bg-slate-200/50">
                  {(selectedTrip.itinerary[selectedDay] || []).length > 0 ? (
                    selectedTrip.itinerary[selectedDay].map((item, idx) => {
                      const isChecked = checkedItems.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className="relative pl-9 flex items-start animate-in slide-in-from-right-4 duration-300"
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
                            className={`flex-1 p-5 rounded-[32px] border transition-all duration-300 cursor-pointer flex gap-4 ${
                              isChecked
                                ? "bg-slate-100 border-transparent opacity-60"
                                : "bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] border-slate-100 active:scale-[0.98]"
                            }`}
                          >
                            <div className="flex-1 overflow-hidden">
                              <span
                                className={`text-[10px] font-black uppercase text-blue-600 mb-1 block tracking-widest ${
                                  isChecked ? "text-slate-300" : ""
                                }`}
                              >
                                {item.time}
                              </span>
                              <h3
                                className={`font-black text-slate-800 text-[15px] leading-tight ${
                                  isChecked ? "text-slate-400 line-through" : ""
                                }`}
                              >
                                {item.title}
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed truncate">
                                {item.desc}
                              </p>
                              {item.hasTicket && (
                                <div className="mt-3 flex gap-1">
                                  <span className="text-[8px] font-black bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full border border-orange-100">
                                    VOUCHER
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* --- Thumbnail Photo --- */}
                            {item.image && (
                              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-sm relative group/img">
                                <img
                                  src={item.image}
                                  alt="loc"
                                  className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/10 transition-opacity opacity-0 group-hover/img:opacity-100 flex items-center justify-center">
                                  <Maximize2 className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-32 text-center opacity-30">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                        일정이 없습니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          <nav className="bg-white/70 backdrop-blur-xl border-t border-slate-100 px-4 pb-12 pt-4 flex justify-between items-center absolute bottom-0 left-0 right-0 z-[60] shadow-up rounded-t-[40px]">
            <NavButton
              active={activeTab === "schedule"}
              icon={Calendar}
              label="Plans"
              onClick={() => setActiveTab("schedule")}
            />
            <NavButton
              active={activeTab === "tickets"}
              icon={Ticket}
              label="Quick"
              onClick={() => setActiveTab("tickets")}
            />
            <NavButton
              active={activeTab === "budget"}
              icon={Wallet}
              label="Budget"
              onClick={() => setActiveTab("budget")}
            />
            <NavButton
              active={activeTab === "preps"}
              icon={ClipboardList}
              label="Check"
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

      {/* -------------------- MODAL: ITINERARY DETAIL (With Large Photo) -------------------- */}
      {selectedItineraryItem && (
        <div className="absolute inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
          {/* Header Image Section */}
          <div className="relative h-2/5 shrink-0 bg-slate-100 overflow-hidden">
            {selectedItineraryItem.image ? (
              <img
                src={selectedItineraryItem.image}
                alt="hero"
                className="w-full h-full object-cover animate-in fade-in duration-1000"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-200">
                <ImageIcon className="w-16 h-16" />
                <p className="text-[10px] font-black uppercase tracking-widest mt-4">
                  No Visual Reference
                </p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30" />
            <button
              onClick={() => setSelectedItineraryItem(null)}
              className="absolute top-12 left-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white border border-white/30 active:scale-90 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="absolute top-12 right-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white border border-white/30 active:scale-90 transition-all">
              <MoreVertical className="w-6 h-6" />
            </button>

            <div className="absolute bottom-8 left-8 right-8">
              <span className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-blue-600/30">
                {selectedItineraryItem.time}
              </span>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mt-4 drop-shadow-sm">
                {selectedItineraryItem.title}
              </h2>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto p-8 bg-white rounded-t-[56px] -mt-8 relative z-10 space-y-10">
            <section className="space-y-4">
              <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                {selectedItineraryItem.desc ||
                  "상세 설명이 등록되지 않은 일정입니다. 현장에서 자유롭게 탐방해 보세요!"}
              </p>
              <div className="flex gap-4 pt-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-50 rounded-2xl text-slate-900 font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                  <Navigation className="w-4 h-4 text-blue-500" /> 길 찾기
                </button>
                <button
                  onClick={() => addNotification("위치 정보 복사됨")}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-50 rounded-2xl text-slate-900 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                  <Copy className="w-4 h-4 text-slate-400" /> 주소 복사
                </button>
              </div>
            </section>

            <section className="space-y-4 pt-6 border-t border-slate-50">
              <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">
                Related Items
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {selectedItineraryItem.hasTicket ? (
                  <div className="bg-orange-50 p-5 rounded-[32px] border border-orange-100 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none mb-1">
                        Quick-Pass Ready
                      </p>
                      <h4 className="font-black text-slate-800 text-sm">
                        연동된 티켓 열기
                      </h4>
                    </div>
                    <ChevronRight className="w-4 h-4 text-orange-200" />
                  </div>
                ) : (
                  <div className="py-8 border-2 border-dashed border-slate-50 rounded-[32px] flex flex-col items-center justify-center text-slate-200">
                    <AlertCircle className="w-6 h-6 mb-2 opacity-30" />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      No Linked Tickets
                    </p>
                  </div>
                )}
              </div>
            </section>
          </main>

          <footer className="p-8 pb-12 bg-white border-t border-slate-50 flex gap-4">
            <button
              onClick={() => setSelectedItineraryItem(null)}
              className="flex-1 py-5 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all"
            >
              Dismiss
            </button>
          </footer>
        </div>
      )}

      {/* -------------------- MODAL: ADD ITINERARY (With Photo Selection) -------------------- */}
      {showAddItineraryModal && (
        <div className="absolute inset-0 z-[250] bg-slate-900/60 backdrop-blur-md flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-[56px] p-10 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl">
            <div className="w-14 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
            <h2 className="text-2xl font-black mb-8 text-center tracking-tight">
              New Place ✨
            </h2>

            <div className="space-y-6 mb-12">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Location Name
                </label>
                <input
                  autoFocus
                  className="w-full bg-slate-50 border-none rounded-[28px] px-8 py-5 text-slate-900 font-black focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="어디로 가시나요?"
                />
              </div>

              {/* --- Photo Upload Section --- */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Attached Photo
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-[32px] group hover:bg-blue-50 transition-colors border-2 border-transparent active:border-blue-100 active:scale-95">
                    <Camera className="w-6 h-6 text-slate-300 group-hover:text-blue-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600">
                      Take Shot
                    </span>
                  </button>
                  <button className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-[32px] group hover:bg-blue-50 transition-colors border-2 border-transparent active:border-blue-100 active:scale-95">
                    <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-blue-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600">
                      Library
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowAddItineraryModal(false)}
                className="flex-1 py-5 bg-slate-50 rounded-[28px] font-black text-slate-400 text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddItineraryModal(false);
                  addNotification("일정이 추가되었습니다.");
                }}
                className="flex-[2] py-5 bg-blue-600 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100"
              >
                Add Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- OVERLAY: NOTIFICATIONS -------------------- */}
      <div className="absolute top-28 left-0 right-0 px-6 z-[300] pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="mb-3 bg-slate-900/95 text-white px-5 py-4 rounded-[28px] shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-6 pointer-events-auto border border-white/10 backdrop-blur-md"
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
    </div>
  );
};

// --- Helpers ---

const AuthInput = ({ icon: Icon, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-7 flex items-center text-slate-300 group-focus-within:text-blue-500 transition-colors">
      <Icon className="w-5 h-5" />
    </div>
    <input
      className="w-full bg-slate-50 border-2 border-transparent rounded-[28px] pl-16 pr-8 py-5 text-slate-900 font-black focus:border-blue-500 focus:bg-white transition-all outline-none text-sm shadow-inner"
      {...props}
    />
  </div>
);

const SocialBtn = ({ icon: Icon, customIcon }) => (
  <button className="w-16 h-16 flex items-center justify-center bg-white border-2 border-slate-100 rounded-3xl hover:bg-slate-50 transition-all active:scale-90 shadow-sm group">
    {Icon ? (
      <Icon className="w-6 h-6 text-slate-800 group-hover:scale-110 transition-transform" />
    ) : (
      customIcon
    )}
  </button>
);

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
      className={`text-[9px] font-black uppercase tracking-tighter ${
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

const LinkedBadge = ({ color, icon: Icon, label }) => {
  const colors = {
    orange: "bg-orange-50 text-orange-500 border-orange-100",
    blue: "bg-blue-50 text-blue-500 border-blue-100",
    slate: "bg-slate-50 text-slate-500 border-slate-100",
    green: "bg-green-50 text-green-600 border-green-100",
  };
  return (
    <div
      className={`text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border ${colors[color]} uppercase tracking-tighter shadow-sm`}
    >
      <Icon className="w-2.5 h-2.5" /> {label}
    </div>
  );
};

export default App;
