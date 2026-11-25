
import { useState, useEffect, useRef } from "react";
import {
  ref,
  onValue,
  push,
  set
} from "firebase/database";
import { database } from "./firebase";
import {
  LayoutDashboard, Wheat, Droplets, Sun, ShieldAlert,
  PawPrint, Activity, Settings, Wifi, Bell, Menu,
  X, ChevronRight, Power, Plus, CheckCircle2,
  AlertTriangle, Clock, ThermometerSun, Moon
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

import FirebaseTest from "./FirebaseTest";

const initialAnimals = [
  { id: "AN-001", name: "Gauri", type: "Cow", age: "4 years", notes: "Routine feeding" },
  { id: "AN-002", name: "Nandi", type: "Calf", age: "1 year", notes: "Monitor feeding" },
];

const chartData = [
  { time: "08:00", food: 13.2, water: 900 },
  { time: "09:00", food: 14.1, water: 1150 },
  { time: "10:00", food: 12.8, water: 1700 },
  { time: "11:00", food: 11.4, water: 2100 },
  { time: "12:00", food: 12.4, water: 1840 },
];

const initialLogs = [
  { id: 1, text: "Water pump activated", time: "10:42 AM", type: "info" },
  { id: 2, text: "Feeder flap closed", time: "10:38 AM", type: "success" },
  { id: 3, text: "Lighting switched on", time: "09:15 AM", type: "info" },
];

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "feeding", label: "Smart Feeding", icon: Wheat },
  { id: "water", label: "Water Management", icon: Droplets },
  { id: "environment", label: "Environment & Safety", icon: ShieldAlert },
  { id: "animals", label: "Animal Records", icon: PawPrint },
  { id: "activity", label: "Activity & Analytics", icon: Activity },
];


function StatusPill({ label, tone = "green" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${colors[tone]}`}>
      {label}
    </span>
  );
}

function Panel({ title, subtitle, children, action }) {
  return (
    <section className="rounded-xl border border-[#E4E9E2] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, detail, icon: Icon, tone = "green" }) {
  const iconColors = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="rounded-xl border border-[#E4E9E2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <div className={`rounded-lg p-2 ${iconColors[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function SensorRow({ label, value, status, tone = "green" }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{value}</p>
      </div>
      <StatusPill label={status} tone={tone} />
    </div>
  );
}
const SENSOR_THRESHOLDS = {
  foodLow: 14,
  foodFull: 10,
  waterLow: 1000,
  waterFull: 2000,
  lightDark: 2300,
  lightBright: 1800,
};

function getFoodStatus(distance) {
  if (
    distance == null ||
    !Number.isFinite(Number(distance)) ||
    Number(distance) < 0
  ) {
    return { label: "Sensor Error", tone: "red" };
  }

  if (distance >= SENSOR_THRESHOLDS.foodLow) {
    return { label: "Low", tone: "amber" };
  }

  if (distance <= SENSOR_THRESHOLDS.foodFull) {
    return { label: "Full", tone: "green" };
  }

  return { label: "Intermediate", tone: "green" };
}

function getWaterStatus(level) {
  if (
    level == null ||
    !Number.isFinite(Number(level)) ||
    Number(level) < 0 ||
    Number(level) > 4095
  ) {
    return { label: "Sensor Error", tone: "red" };
  }

  if (level <= SENSOR_THRESHOLDS.waterLow) {
    return { label: "Low", tone: "amber" };
  }

  if (level >= SENSOR_THRESHOLDS.waterFull) {
    return { label: "Full", tone: "green" };
  }

  return { label: "Intermediate", tone: "blue" };
}

function getLightStatus(value) {
  if (
    value == null ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0 ||
    Number(value) > 4095
  ) {
    return { label: "Sensor Error", tone: "red" };
  }

  if (value >= SENSOR_THRESHOLDS.lightDark) {
    return { label: "Dark", tone: "amber" };
  }

  if (value <= SENSOR_THRESHOLDS.lightBright) {
    return { label: "Bright", tone: "green" };
  }

  return { label: "Moderate", tone: "blue" };
}

export default function App() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
  () => localStorage.getItem("smartfarm-theme") === "dark"
);

useEffect(() => {
  document.documentElement.classList.toggle("dark", darkMode);

  localStorage.setItem(
    "smartfarm-theme",
    darkMode ? "dark" : "light"
  );
}, [darkMode]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [page, setPage] = useState("overview");
  const [sensorData, setSensorData] = useState(null);
  const foodStatus = getFoodStatus(sensorData?.foodDistance);
const waterStatus = getWaterStatus(sensorData?.waterLevel);
const lightStatus = getLightStatus(sensorData?.ldrValue);
  const [sensorError, setSensorError] = useState("");
  const [sensorHistory, setSensorHistory] = useState([]);
  const lastUpdated = Number(sensorData?.updatedAt || 0);
  const [currentTime, setCurrentTime] = useState(Date.now());

const isDeviceOnline =
  lastUpdated > 0 &&
  currentTime >= lastUpdated &&
  currentTime - lastUpdated < 30000;

const lastUpdatedText = lastUpdated
  ? new Date(lastUpdated).toLocaleString("en-IN")
  : "No hardware data received";
  const [deviceCommands, setDeviceCommands] = useState([]);
  const [commandFeedback, setCommandFeedback] = useState(null);
  const [sendingCommand, setSendingCommand] = useState(false);
  const commandLock = useRef(false);
  const latestTelemetry = useRef(null);
  const pumpBlocked = sensorData?.pumpTimeout === true || sensorData?.flame === true;


  const historicalChartData = sensorHistory.map((reading) => ({
  time: new Date(reading.timestamp ?? reading.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }),
  water: Number(reading.waterLevel ?? 0),
  food: Number(reading.foodDistance ?? 0),
  light: Number(reading.ldrValue ?? 0),
}));

  useEffect(() => {
    const telemetryRef = ref(
      database,
      "devices/esp32_01/telemetry"
  );

    const unsubscribe = onValue(
      telemetryRef,
      (snapshot) => {
        latestTelemetry.current = snapshot.val();
        setSensorData(snapshot.val());
        setSensorError("");
    },
      (error) => {
        setSensorError(error.message);
    }
  );

  return () => unsubscribe();
}, []);

useEffect(() => {
  const animalsRef = ref(database, "animals");

  const unsubscribe = onValue(
    animalsRef,
    (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const animalList = Object.entries(data).map(
          ([id, animal]) => ({
            id,
            ...animal,
          })
        );

        setAnimals(animalList);
      } else {
        setAnimals([]);
      }
    },
    (error) => {
      console.error("Animal records error:", error);
    }
  );

  return () => unsubscribe();
}, []);

useEffect(() => {
  const logsRef = ref(database, "activityLogs");

  const unsubscribe = onValue(
    logsRef,
    (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const logList = Object.entries(data).map(
          ([id, log]) => ({
            ...log,
            id,
          })
        );

        logList.sort(
          (a, b) => b.createdAt - a.createdAt
        );

        setLogs(logList);
      } else {
        setLogs([]);
      }
    },
    (error) => {
      console.error("Activity logs error:", error);
    }
  );

  return () => unsubscribe();
}, []);

useEffect(() => {
  const historyRef = ref(database, "sensorHistory");

  const unsubscribe = onValue(
    historyRef,
    (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setSensorHistory([]);
        return;
      }

      const history = Object.entries(data)
        .map(([id, reading]) => ({
          id,
          ...reading,
        }))
        .sort((a, b) => (a.timestamp ?? a.createdAt ?? 0) - (b.timestamp ?? b.createdAt ?? 0));

      setSensorHistory(history);
    },
    (error) => {
      console.error("Sensor history error:", error);
    }
  );

  return () => unsubscribe();
}, []);
useEffect(() => {
  const notificationsRef = ref(database, "notifications");

  const unsubscribe = onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      setNotificationHistory([]);
      return;
    }

    const records = Object.entries(data)
      .map(([id, value]) => ({
        ...value,
        id,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    setNotificationHistory(records);
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  const commandsRef = ref(database, "commands/esp32_01");

  const unsubscribe = onValue(
    commandsRef,
    (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const commands = Object.entries(data).map(
          ([id, command]) => ({
            id,
            ...command,
          })
        );

        commands.sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );

        setDeviceCommands(commands);
      } else {
        setDeviceCommands([]);
      }
    },
    (error) => {
      console.error("Command listener error:", error);
    }
  );

  return () => unsubscribe();
}, []);

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(Date.now());
  }, 5000);

  return () => clearInterval(interval);
}, []);

useEffect(() => {
  const interval = setInterval(async () => {
    const sensorData = latestTelemetry.current;
    const lastUpdated = Number(sensorData?.updatedAt || 0);
    if (!sensorData || !lastUpdated) return;
    const currentTimestamp = Date.now();

    // Only record recently received hardware data
    if (
      currentTimestamp < lastUpdated ||
      currentTimestamp - lastUpdated >= 30000
    ) {
      return;
    }

    try {
      const historyRef = ref(database, "sensorHistory");

      await push(historyRef, {
        foodDistance: Number(sensorData.foodDistance ?? 0),
        waterLevel: Number(sensorData.waterLevel ?? 0),
        ldrValue: Number(sensorData.ldrValue ?? 0),
        feederOpen: Boolean(sensorData.feederOpen),
        pumpRunning: Boolean(sensorData.pumpRunning),
        lightOn: Boolean(sensorData.lightOn),
        flame: Boolean(sensorData.flame),
        intrusion: Boolean(sensorData.intrusion),
        timestamp: currentTimestamp,
        source: "automatic",
      });

      console.log("Automatic sensor snapshot saved");
    } catch (error) {
      console.error("Automatic history error:", error);
    }
  }, 60000);

  return () => clearInterval(interval);
}, []);

const recordSensorSnapshot = async () => {
  if (!sensorData) return;

  try {
    const historyRef = push(ref(database, "sensorHistory"));

    await set(historyRef, {
      foodDistance: Number(sensorData.foodDistance),
      waterLevel: Number(sensorData.waterLevel),
      ldrValue: Number(sensorData.ldrValue),
      feederOpen: Boolean(sensorData.feederOpen),
      pumpRunning: Boolean(sensorData.pumpRunning),
      lightOn: Boolean(sensorData.lightOn),
      flame: Boolean(sensorData.flame),
      intrusion: Boolean(sensorData.intrusion),
      timestamp: Date.now(),
      source: "manual-test",
    });

    await addLog("Sensor snapshot recorded for testing");
  } catch (error) {
    console.error("Snapshot error:", error);
    alert("Failed to record snapshot: " + error.message);
  }
};
const sendDeviceCommand = async (action) => {
  if (commandLock.current) return;
  if (action === "start_pump" && pumpBlocked) {
    setCommandFeedback({ tone: "red", text: "Pump start blocked by safety alert." });
    return;
  }
  commandLock.current = true;
  setSendingCommand(true);
  const label = action.replaceAll("_", " ");
  setCommandFeedback({ tone: "gray", text: `Sending ${label}…` });
  try {
    const commandRef = push(ref(database, "commands/esp32_01"));
    await set(commandRef, {
      action,
      status: "pending",
      createdAt: Date.now(),
      source: "dashboard",
    });
    setCommandFeedback({ tone: "green", text: `${label}: saved to Firebase. Awaiting ESP32 execution.` });
    void addLog(`Manual command requested: ${action}`);
  } catch (error) {
    console.error("Command error:", error);
    setCommandFeedback({ tone: "red", text: `Failed to send ${label}: ${error.message}` });
  } finally {
    commandLock.current = false;
    setSendingCommand(false);
  }
};

  const [mobileOpen, setMobileOpen] = useState(false);
  const [animals, setAnimals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [name, setName] = useState("");
  const [animalType, setAnimalType] = useState("");
  const [notes, setNotes] = useState("");

  const addLog = async (text) => {
  try {
    const logsRef = ref(database, "activityLogs");
    const newLogRef = push(logsRef);

    await set(newLogRef, {
      text,
      time: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "info",
      createdAt: Date.now(),
      source: "dashboard",
    });
  } catch (error) {
    console.error("Failed to save activity log:", error);
  }
};

  const addAnimal = async (e) => {
  e.preventDefault();

  if (!name.trim() || !animalType.trim()) return;

  try {
    const animalsRef = ref(database, "animals");
    const newAnimalRef = push(animalsRef);

    await set(newAnimalRef, {
      name: name.trim(),
      type: animalType.trim(),
      age: "Not specified",
      notes: notes.trim() || "—",
      createdAt: Date.now(),
    });

    addLog(`Animal record added: ${name}`);

    setName("");
    setAnimalType("");
    setNotes("");

  } catch (error) {
    console.error("Error saving animal:", error);
    alert("Failed to save animal record: " + error.message);
  }
};

  const requestControl = (action) => {
    // UI demonstration only. No hardware command is sent.
    addLog(`Demo control requested: ${action}`);
    window.alert(
      `${action}\n\nThis is a UI demonstration. No command was sent to the ESP32.`
    );
  };
  const activeAlerts = [
  {
    id: "flame",
    active: sensorData?.flame === true,
    title: "Fire detected",
    message: "Flame detected inside the animal shed.",
    severity: "critical",
  },
  {
    id: "intrusion",
    active: sensorData?.intrusion === true,
    title: "Intrusion detected",
    message: "Security sensor reported an intrusion.",
    severity: "critical",
  },
  {
    id: "food",
    active: foodStatus.label === "Low",
    title: "Low food supply",
    message: "Food level is below the required threshold.",
    severity: "warning",
  },
  {
    id: "water",
    active: waterStatus.label === "Low",
    title: "Low water supply",
    message: "Water level is below the required threshold.",
    severity: "warning",
  },
  {
    id: "pump",
    active: sensorData?.pumpTimeout === true,
    title: "Pump safety timeout",
    message: "Water pump safety timeout has been triggered.",
    severity: "warning",
  },
  {
    id: "rfid",
    active:
      Boolean(sensorData?.rfidUid) &&
      sensorData?.rfidAuthorized === false,
    title: "Unauthorized RFID tag",
    message: "An unrecognized RFID tag was scanned.",
    severity: "critical",
  },
  {
    id: "connection",
    active: !isDeviceOnline,
    title: lastUpdated === 0
      ? "Hardware integration pending"
      : "ESP32 disconnected",
    message: lastUpdated === 0
      ? "No hardware telemetry has been received yet."
      : "The ESP32 has stopped sending readings.",
    severity: "warning",
  },
].filter((item) => item.active);

  const currentPage = navItems.find((item) => item.id === page);

  if (sensorError) {
    return (
    <div className="p-8 text-red-700">
      Firebase error: {sensorError}
    </div>
  );
}

  if (!sensorData) {
    return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9F6]">
      <p className="text-slate-600">
        Waiting for Firebase sensor data...
      </p>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-slate-800">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-[#E4E9E2] bg-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#254C3B] text-white">
            <Wheat size={22} />
          </div>
          <div>
            <p className="font-bold tracking-tight text-[#254C3B]">SmartFarm Shield</p>
            <p className="text-xs text-slate-400">Operations Console</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </p>
          <nav className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setPage(id); setMobileOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                  page === id
                    ? "bg-[#EAF1EB] font-semibold text-[#254C3B]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
                {page === id && <ChevronRight size={15} className="ml-auto" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-800">{isDeviceOnline ? "Live Mode" : lastUpdated ? "Offline Mode" : "Demo Mode"}</p>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            {isDeviceOnline ? "Receiving recent hardware telemetry." : lastUpdated ? "Showing last received readings." : "Showing sample readings. Hardware connection pending."}
          </p>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[#E4E9E2] bg-white px-5 lg:px-9">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{currentPage.label}</h1>
              <p className="text-xs text-slate-500">SmartFarm Shield / {currentPage.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
  <StatusPill label={isDeviceOnline ? "Live Data" : lastUpdated ? "Offline" : "Demo Data"} tone={isDeviceOnline ? "green" : "amber"} />
  <button
  type="button"
  onClick={() => setDarkMode((prev) => !prev)}
  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
  title={darkMode ? "Light mode" : "Dark mode"}
  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
>
  {darkMode ? <Sun size={21} /> : <Moon size={21} />}
</button>

  <div className="relative">
    <button
      type="button"
      aria-label="Notifications"
      aria-expanded={notificationsOpen}
      onClick={() => setNotificationsOpen((prev) => !prev)}
      className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
    >
      <Bell size={22} />

      {activeAlerts.length > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {activeAlerts.length}
        </span>
      )}
    </button>

    {notificationsOpen && (
      <div className="absolute right-0 top-12 z-50 w-80 max-w-[85vw] rounded-xl border border-slate-200 bg-white shadow-xl">

        <div className="border-b border-slate-100 p-4">
          <h3 className="font-semibold text-slate-900">
            Notifications
          </h3>
          <p className="text-xs text-slate-500">
            {activeAlerts.length} active alerts
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {activeAlerts.length === 0 ? (
            <p className="p-5 text-center text-sm text-slate-500">
              No active alerts
            </p>
          ) : (
            activeAlerts.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 border-b border-slate-100 p-4"
              >
                <AlertTriangle
                  size={18}
                  className={`mt-1 shrink-0 ${
                    item.severity === "critical"
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-slate-200">
  <div className="bg-slate-50 px-4 py-3">
    <h4 className="text-sm font-semibold text-slate-700">
      Notification History
    </h4>
  </div>

  <div className="max-h-64 overflow-y-auto">
    {notificationHistory.length === 0 ? (
      <p className="p-4 text-center text-xs text-slate-500">
        No recorded notifications yet
      </p>
    ) : (
      notificationHistory.map((item) => (
        <div
          key={item.id}
          className="flex gap-3 border-b border-slate-100 p-4"
        >
          <AlertTriangle
            size={18}
            className={`shrink-0 ${
              item.severity === "critical"
                ? "text-red-600"
                : "text-amber-600"
            }`}
          />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              {item.title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {item.message}
            </p>

            <p className="mt-2 text-[11px] text-slate-400">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))
    )}
  </div>
</div>
        <button
          onClick={() => setNotificationsOpen(false)}
          className="w-full p-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    )}
  </div>
</div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 p-5 lg:p-9">
          {commandFeedback && (
            <div role="status" aria-live="polite" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={commandFeedback.tone === "green" ? "Saved" : commandFeedback.tone === "red" ? "Error" : "Sending"} tone={commandFeedback.tone} />
                <span className="text-sm">{commandFeedback.text}</span>
              </div>
              <button type="button" aria-label="Dismiss command message" onClick={() => setCommandFeedback(null)}><X size={18} /></button>
            </div>
          )}
          {page === "overview" && (
            <>
        
              <div>
                <p className="text-sm text-slate-500">Farm monitoring workspace</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Farm Overview
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Monitor feeding, water, lighting, and shed safety from one place.
                </p>
              </div>
              {activeAlerts.length > 0 ? (
  <div className="space-y-3">
    {activeAlerts.map((item) => (
      <div
        key={item.id}
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          item.severity === "critical"
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <AlertTriangle
          size={20}
          className="mt-0.5 shrink-0"
        />

        <div>
          <p className="text-sm font-semibold">
            {item.title}
          </p>
          <p className="mt-1 text-xs">
            {item.message}
          </p>
        </div>
      </div>
    ))}
  </div>
) : (
  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
    <CheckCircle2 size={20} />
    <p className="text-sm font-medium">
      No active alerts
    </p>
  </div>
)}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Metric
  label="Food Supply"
  value={foodStatus.label}
  detail={`Distance: ${sensorData.foodDistance ?? "—"} cm`}
  icon={Wheat}
  tone={foodStatus.tone}
/>

<Metric
  label="Water Supply"
  value={waterStatus.label}
  detail={`Sensor ADC: ${sensorData.waterLevel ?? "—"}`}
  icon={Droplets}
  tone={waterStatus.tone}
/>

<Metric
  label="Ambient Lighting"
  value={lightStatus.label}
  detail={`LDR: ${sensorData.ldrValue ?? "—"} | Light ${
    sensorData.lightOn ? "ON" : "OFF"
  }`}
  icon={Sun}
  tone={lightStatus.tone}
/>

<Metric
  label="Fire Safety"
  value={sensorData.flame ? "ALERT" : "Normal"}
  detail={
    sensorData.flame
      ? "Flame detected"
      : "No flame detected"
  }
  icon={ShieldAlert}
  tone={sensorData.flame ? "red" : "green"}
/>
<Metric
  label="Intrusion Detection"
  value={sensorData.intrusion ? "Alert" : "Clear"}
  detail={
    sensorData.intrusion
      ? "Intrusion detected"
      : "No intrusion reported"
  }
  icon={ShieldAlert}
  tone={sensorData.intrusion ? "red" : "green"}
/>

<Metric
  label="RFID Access"
  value={
    !sensorData.rfidUid
      ? "No Scan"
      : sensorData.rfidAuthorized === true
      ? "Authorized"
      : sensorData.rfidAuthorized === false
      ? "Unauthorized"
      : "Unknown"
  }
  detail={
    sensorData.rfidUid
      ? `Last UID: ${sensorData.rfidUid}`
      : "Awaiting RFID data"
  }
  icon={ShieldAlert}
  tone={
    !sensorData.rfidUid
      ? "gray"
      : sensorData.rfidAuthorized === true
      ? "green"
      : sensorData.rfidAuthorized === false
      ? "red"
      : "gray"
  }
/>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <Panel title="Sensor Trends" subtitle="Historical sensor readings stored in Firebase">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historicalChartData}>
                          <defs>
                            <linearGradient id="foodGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#39765A" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#39765A" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECE8" />
                          <XAxis dataKey="time" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 20]} />
                          <Tooltip />
                          <Area type="monotone" dataKey="food" stroke="#39765A" strokeWidth={2} fill="url(#foodGradient)" name="Food distance (cm)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Panel>
                </div>
                <Panel title="System Status" subtitle={isDeviceOnline ? "Current device states" : "Last available device states"}>
                  <SensorRow label="Feeder Flap" value="Servo motor" status={sensorData.feederOpen ? "Open" : "Closed"} />
                  <SensorRow label="Water Pump" value="Relay-controlled" status={sensorData.pumpRunning ? "Running" : "Stopped"} />
                  <SensorRow label="IR Detection" value="Shed proximity sensor" status={sensorData.intrusion ? "Detected" : "Clear"} tone={sensorData.intrusion ? "red" : "green"} />
                  <SensorRow label="Pump Timeout" value="30-second safety limit" status={sensorData.pumpTimeout ? "Triggered" : "Normal"} tone={sensorData.pumpTimeout ? "red" : "green"} />
                </Panel>
              </div>

              <Panel title="Recent Activity" subtitle="Recent recorded farm activity">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-emerald-50 p-2 text-emerald-700">
                        <Activity size={15} />
                      </div>
                      <p className="text-sm">{log.text}</p>
                    </div>
                    <span className="text-xs text-slate-400">{log.time}</span>
                  </div>
                ))}
              </Panel>
              <Panel
  title="ESP32 Connection"
  subtitle="Hardware connectivity monitoring"
>
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-slate-800">
        ESP32 — Animal Shed Controller
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Last updated: {lastUpdatedText}
      </p>
    </div>

    <StatusPill
      label={isDeviceOnline ? "Online" : "Offline"}
      tone={isDeviceOnline ? "green" : "gray"}
    />
  </div>
</Panel>
            <Panel
  title="Manual Device Controls"
  subtitle="Send command requests to Firebase"
>
  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => sendDeviceCommand("dispense_food")}
      disabled={sendingCommand}
      className="rounded-lg bg-[#254C3B] px-4 py-2 text-sm font-medium text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      Dispense Food
    </button>

    <button
      type="button"
      onClick={() => sendDeviceCommand("start_pump")}
      disabled={sendingCommand || pumpBlocked}
      className="rounded-lg bg-[#254C3B] px-4 py-2 text-sm font-medium text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      Start Water Pump
    </button>

    <button
      type="button"
      onClick={() => sendDeviceCommand("stop_pump")}
      disabled={sendingCommand}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      Stop Water Pump
    </button>

    <button
      type="button"
      onClick={() => sendDeviceCommand("light_on")}
      disabled={sendingCommand}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      Light ON
    </button>

    <button
      type="button"
      onClick={() => sendDeviceCommand("light_off")}
      disabled={sendingCommand}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      Light OFF
    </button>
  </div>

  <p className="mt-3 text-xs text-slate-500">
    Commands remain pending until acknowledged by ESP32. A saved request does not confirm physical execution.
  </p>
</Panel>
<Panel
  title="Recent Device Commands"
  subtitle="Command requests stored in Firebase"
>
  <div className="space-y-3">
    {deviceCommands.length === 0 ? (
      <p className="text-sm text-slate-500">
        No device commands recorded yet.
      </p>
    ) : (
      deviceCommands.slice(0, 5).map((command) => (
        <div
          key={command.id}
          className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0"
        >
          <div>
            <p className="text-sm font-medium text-slate-800">
              {command.action?.replaceAll("_", " ")}
            </p>

            <p className="text-xs text-slate-500">
              {command.createdAt
                ? new Date(command.createdAt).toLocaleString()
                : "No timestamp"}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              command.status === "completed"
                ? "bg-green-100 text-green-700"
                : command.status === "failed"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {command.status || "pending"}
          </span>
        </div>
      ))
    )}
  </div>
</Panel>
            </>
          )}

          {page === "feeding" && (
  <>
    <div>
      <h2 className="text-2xl font-semibold">
        Smart Feeding
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Monitor food availability and control the feeder remotely.
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <Metric
        label="Food Supply"
        value={foodStatus.label}
        detail="Current food availability"
        icon={Wheat}
        tone={foodStatus.tone}
      />

      <Metric
        label="Food Distance"
        value={`${sensorData.foodDistance ?? "—"} cm`}
        detail="Measured by ultrasonic sensor"
        icon={Wheat}
        tone={foodStatus.tone}
      />

      <Metric
        label="Feeder Flap"
        value={sensorData.feederOpen ? "OPEN" : "CLOSED"}
        detail="Current servo position"
        icon={Settings}
        tone={sensorData.feederOpen ? "amber" : "green"}
      />
    </div>

    <Panel
      title="Manual Feeding"
      subtitle="Remote feeder control through Firebase"
    >
      <p className="mb-4 text-sm text-slate-600">
        Request a feeding cycle remotely. The command
        will be stored in Firebase for the ESP32 to execute.
      </p>

      <button
        onClick={() => sendDeviceCommand("dispense_food")}
      disabled={sendingCommand}
        className="rounded-lg bg-[#254C3B] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B392C] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        Request Food Dispense
      </button>
    </Panel>

    <Panel
      title="Automatic Feeder Logic"
      subtitle="Threshold-based feeding automation"
    >
      <SensorRow
        label="Low food threshold"
        value="Ultrasonic distance"
        status={`${SENSOR_THRESHOLDS.foodLow} cm`}
        tone="amber"
      />

      <SensorRow
        label="Full food threshold"
        value="Ultrasonic distance"
        status={`${SENSOR_THRESHOLDS.foodFull} cm`}
        tone="green"
      />

      <SensorRow
        label="Servo control"
        value="Firmware-based control"
        status="Automatic"
      />
    </Panel>
  </>
)}

          {page === "water" && (
  <>
    <div>
      <h2 className="text-2xl font-semibold">
        Water Management
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Monitor water availability, pump operation and safety.
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric
        label="Water Supply"
        value={waterStatus.label}
        detail="Current water availability"
        icon={Droplets}
        tone={waterStatus.tone}
      />

      <Metric
        label="Water Sensor"
        value={sensorData.waterLevel ?? "—"}
        detail="Raw ADC reading"
        icon={Droplets}
        tone="blue"
      />

      <Metric
        label="Pump Status"
        value={sensorData.pumpRunning ? "RUNNING" : "STOPPED"}
        detail="Current relay state"
        icon={Power}
        tone={sensorData.pumpRunning ? "blue" : "gray"}
      />

      <Metric
        label="Safety Timeout"
        value={sensorData.pumpTimeout ? "ACTIVE" : "CLEAR"}
        detail="30-second safety limit"
        icon={ShieldAlert}
        tone={sensorData.pumpTimeout ? "red" : "green"}
      />
    </div>

    <Panel
      title="Pump Management"
      subtitle="Remote pump control through Firebase"
    >
      <p className="mb-4 text-sm text-slate-600">
        Request manual pump operation. Hardware safety
        restrictions must remain enforced by the ESP32.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => sendDeviceCommand("start_pump")}
      disabled={sendingCommand || pumpBlocked}
          className="rounded-lg bg-[#254C3B] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B392C] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Water Pump
        </button>

        <button
          onClick={() => sendDeviceCommand("stop_pump")}
      disabled={sendingCommand}
          className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          Stop Water Pump
        </button>
      </div>

      {pumpBlocked && (
        <p className="mt-3 text-sm text-red-600">
          Pump start is blocked by a timeout or fire alert.
        </p>
      )}
    </Panel>

    <Panel
      title="Automatic Water Management"
      subtitle="Threshold-based pump automation"
    >
      <SensorRow
        label="Low water"
        value="Pump activation threshold"
        status={`≤ ${SENSOR_THRESHOLDS.waterLow} ADC`}
        tone="amber"
      />

      <SensorRow
        label="Full water"
        value="Pump stop threshold"
        status={`≥ ${SENSOR_THRESHOLDS.waterFull} ADC`}
        tone="green"
      />

      <SensorRow
        label="Safety timeout"
        value="Maximum continuous pump operation"
        status="30 seconds"
        tone="gray"
      />
    </Panel>
  </>
)}

          {page === "environment" && (
            <>
              <h2 className="text-2xl font-semibold">Environment & Safety</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric label="Light Sensor" value={sensorData.ldrValue} detail="LDR raw ADC reading" icon={Sun} tone="amber" />
                <Metric label="Fire Detection" value={sensorData.flame ? "DETECTED" : "CLEAR"} detail="Flame sensor" icon={ShieldAlert} tone={sensorData.flame ? "red" : "green"} />
                <Metric label="IR Detection" value={sensorData.intrusion ? "DETECTED" : "CLEAR"} detail="Object proximity detection" icon={Activity} />
              </div>
              <Panel
  title="Manual Lighting Control"
  subtitle="Remote LED control through Firebase"
>
  <p className="mb-4 text-sm text-slate-600">
    Request manual lighting changes remotely.
    Automatic lighting is managed by the ESP32.
  </p>

  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => sendDeviceCommand("light_on")}
      disabled={sendingCommand}
      className="rounded-lg bg-[#254C3B] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B392C] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      Turn Light ON
    </button>

    <button
      type="button"
      onClick={() => sendDeviceCommand("light_off")}
      disabled={sendingCommand}
      className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      Turn Light OFF
    </button>
  </div>
</Panel>
              <Panel title="Safety Monitoring">
                <SensorRow label="Lighting" value="LDR-controlled LED" status={sensorData.lightOn ? "ON" : "OFF"} />
                <SensorRow label="Fire Alarm" value="Flame sensor + buzzer" status={sensorData.flame ? "ALERT" : "Normal"} tone={sensorData.flame ? "red" : "green"} />
                <SensorRow label="IR Detection" value="Nearby object detection" status={sensorData.intrusion ? "Detected" : "Clear"} tone={sensorData.intrusion ? "amber" : "green"} />
              </Panel>
              <Panel
  title="RFID Access Monitoring"
  subtitle="RFID tag identification and access status"
>
  <div className="grid gap-4 sm:grid-cols-3">

    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">
        Last Scanned Tag
      </p>
      <p className="mt-2 text-lg font-semibold">
        {sensorData?.rfidUid || "No scan yet"}
      </p>
    </div>

    <div className="rounded-xl border border-slate-200 p-4">
      <p className="mb-2 text-sm text-slate-500">
        Access Status
      </p>

      <StatusPill
        label={
          !sensorData?.rfidUid
            ? "Awaiting Scan"
            : sensorData.rfidAuthorized === true
            ? "Authorized"
            : sensorData.rfidAuthorized === false
            ? "Unauthorized"
            : "Unknown"
        }
        tone={
          !sensorData?.rfidUid
            ? "gray"
            : sensorData.rfidAuthorized === true
            ? "green"
            : sensorData.rfidAuthorized === false
            ? "red"
            : "gray"
        }
      />
    </div>

    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">
        Last Scan Time
      </p>
      <p className="mt-2 text-sm font-semibold">
        {sensorData?.rfidLastScan
          ? new Date(sensorData.rfidLastScan).toLocaleString()
          : "No scan recorded"}
      </p>
    </div>

  </div>
</Panel>
            </>
          )}

          {page === "animals" && (
            <>
              <h2 className="text-2xl font-semibold">Animal Records</h2>
              <div className="grid gap-5 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <Panel title="Registered Animals" subtitle="Animal records stored in Firebase">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 text-xs text-slate-500">
                          <tr>
                            <th className="pb-3 font-medium">ID</th>
                            <th className="pb-3 font-medium">Name</th>
                            <th className="pb-3 font-medium">Type</th>
                            <th className="pb-3 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {animals.map((animal) => (
                            <tr key={animal.id} className="border-b border-slate-100">
                              <td className="py-4 text-slate-500">{animal.id}</td>
                              <td className="py-4 font-medium">{animal.name}</td>
                              <td className="py-4">{animal.type}</td>
                              <td className="py-4 text-slate-500">{animal.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                </div>
                <Panel title="Add Animal Record" subtitle="Manual entry">
                  <form onSubmit={addAnimal} className="space-y-4">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Animal name" className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600" required />
                    <input value={animalType} onChange={(e) => setAnimalType(e.target.value)} placeholder="Type (Cow, Calf, etc.)" className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600" required />
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Caretaker notes" rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600" />
                    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#254C3B] px-4 py-3 text-sm font-medium text-white">
                      <Plus size={16} /> Add Record
                    </button>
                  </form>
                </Panel>
              </div>
            </>
          )}

          {page === "activity" && (
            <>
  <div className="flex items-center justify-between gap-4">
    <h2 className="text-2xl font-semibold">
      Activity & Analytics
    </h2>

    <button
      type="button"
      onClick={recordSensorSnapshot}
      className="rounded-lg bg-[#254C3B] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B392C]"
    >
      Record Sensor Snapshot
    </button>
  </div>

  <Panel title="Water Sensor Trends" subtitle="Historical water sensor readings stored in Firebase">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECE8" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 4095]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="water" stroke="#3B82A0" fill="#DDEEF4" name="Water ADC" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel
  title="Food Level Trends"
  subtitle="Historical ultrasonic distance readings (cm)"
>
  <div className="h-72">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={historicalChartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" cm" />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="food"
          name="Food Distance"
          stroke="#39836A"
          fill="#DCEEE5"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</Panel>
<Panel
  title="Lighting Sensor Trends"
  subtitle="Historical LDR readings (raw ADC)"
>
  <div className="h-72">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={historicalChartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 4095]} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="light"
          name="LDR Reading"
          stroke="#B58A39"
          fill="#F6EBD3"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</Panel>
              <Panel title="Event History" subtitle="Persistent activity logs">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <Clock size={17} className="text-slate-400" />
                      <p className="text-sm">{log.text}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate-400">{log.time}</span>
                  </div>
                ))}
              </Panel>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
