
import { useState, useEffect } from "react";
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
  AlertTriangle, Clock, ThermometerSun
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

export default function App() {
  const [page, setPage] = useState("overview");
  const [sensorData, setSensorData] = useState(null);
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

  const historicalChartData = sensorHistory.map((reading) => ({
  time: new Date(reading.timestamp).toLocaleTimeString("en-IN", {
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
        .sort((a, b) => a.timestamp - b.timestamp);

      setSensorHistory(history);
    },
    (error) => {
      console.error("Sensor history error:", error);
    }
  );

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
  if (!isDeviceOnline || !lastUpdated) return;

  const interval = setInterval(async () => {
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
        createdAt: currentTimestamp,
        source: "automatic",
      });

      console.log("Automatic sensor snapshot saved");
    } catch (error) {
      console.error("Automatic history error:", error);
    }
  }, 60000);

  return () => clearInterval(interval);
}, [isDeviceOnline, lastUpdated, sensorData]);

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
  try {
    const commandRef = push(
      ref(database, "commands/esp32_01")
    );

    await set(commandRef, {
      action,
      status: "pending",
      createdAt: Date.now(),
      source: "dashboard",
    });

    await addLog(`Manual command requested: ${action}`);
  } catch (error) {
    console.error("Command error:", error);
    alert("Failed to send command: " + error.message);
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
          <p className="text-xs font-semibold text-amber-800">Demo Mode</p>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            Showing sample readings. Hardware connection pending.
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
            <StatusPill label="Demo Data" tone="amber" />
            <Bell size={19} className="text-slate-500" />
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 p-5 lg:p-9">
        <FirebaseTest />
          {page === "overview" && (
            <>
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
  subtitle="Send command requests to Firebase — hardware integration pending"
>
  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => sendDeviceCommand("dispense_food")}
      className="rounded-lg bg-[#254C3B] px-4 py-2 text-sm font-medium text-white"
    >
      Dispense Food
    </button>

    <button
      type="button"
      onClick={() => sendDeviceCommand("start_pump")}
      className="rounded-lg bg-[#254C3B] px-4 py-2 text-sm font-medium text-white"
    >
      Start Water Pump
    </button>

    <button
      type="button"
      onClick={() => sendDeviceCommand("stop_pump")}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
    >
      Stop Water Pump
    </button>

    <button
      type="button"
      onClick={() => sendDeviceCommand("light_on")}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
    >
      Light ON
    </button>

    <button
      type="button"
      onClick={() => sendDeviceCommand("light_off")}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
    >
      Light OFF
    </button>
  </div>

  <p className="mt-3 text-xs text-slate-500">
    Commands are stored as pending requests. No physical device
    will respond until ESP32 command handling is implemented.
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
              <div>
                <p className="text-sm text-slate-500">Farm monitoring workspace</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Farm Overview
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Monitor feeding, water, lighting, and shed safety from one place.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Food Distance" value={`${sensorData.foodDistance} cm`} detail="Ultrasonic measurement" icon={Wheat} />
                <Metric label="Water Sensor" value={sensorData.waterLevel.toLocaleString()} detail="Raw ADC reading (0–4095)" icon={Droplets} tone="blue" />
                <Metric label="Lighting" value={sensorData.lightOn ? "ON" : "OFF"} detail="Automatic LDR control" icon={Sun} tone="amber" />
                <Metric label="Fire Safety" value={sensorData.flame ? "ALERT" : "Normal"} detail="Flame sensor status" icon={ShieldAlert} tone={sensorData.flame ? "red" : "green"} />
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <Panel title="Sensor Trends" subtitle="Illustrative readings — not live sensor history">
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
                <Panel title="System Status" subtitle="Current simulated device states">
                  <SensorRow label="Feeder Flap" value="Servo motor" status={sensorData.feederOpen ? "Open" : "Closed"} />
                  <SensorRow label="Water Pump" value="Relay-controlled" status={sensorData.pumpRunning ? "Running" : "Stopped"} />
                  <SensorRow label="IR Detection" value="Shed proximity sensor" status={sensorData.intrusion ? "Detected" : "Clear"} tone={sensorData.intrusion ? "red" : "green"} />
                  <SensorRow label="Pump Timeout" value="30-second safety limit" status={sensorData.pumpTimeout ? "Triggered" : "Normal"} tone={sensorData.pumpTimeout ? "red" : "green"} />
                </Panel>
              </div>

              <Panel title="Recent Activity" subtitle="Sample events and local demo actions">
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
            </>
          )}

          {page === "feeding" && (
            <>
              <div>
                <h2 className="text-2xl font-semibold">Smart Feeding</h2>
                <p className="mt-2 text-sm text-slate-500">Monitor the ultrasonic sensor and feeder servo.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Metric label="Food Distance" value={`${sensorData.foodDistance} cm`} detail="Measured from ultrasonic sensor" icon={Wheat} />
                <Metric label="Feeder Flap" value={sensorData.feederOpen ? "OPEN" : "CLOSED"} detail="Servo position" icon={Settings} />
              </div>
              <Panel title="Manual Feeding" subtitle="Hardware integration will be added after Firebase setup">
                <p className="mb-4 text-sm text-slate-600">
                  Request a feeding cycle remotely. This button currently demonstrates the interface only.
                </p>
                <button onClick={() => requestControl("Dispense Food")} className="rounded-lg bg-[#254C3B] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B392C]">
                  Request Food Dispense
                </button>
              </Panel>
              <Panel title="Automatic Feeder Logic">
                <SensorRow label="Low food threshold" value="Ultrasonic distance" status="16 cm" tone="gray" />
                <SensorRow label="Full food threshold" value="Ultrasonic distance" status="10 cm" tone="gray" />
                <SensorRow label="Servo control" value="Current firmware" status="Automatic" />
              </Panel>
            </>
          )}

          {page === "water" && (
            <>
              <h2 className="text-2xl font-semibold">Water Management</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric label="Water Sensor" value={sensorData.waterLevel} detail="Raw ADC reading" icon={Droplets} tone="blue" />
                <Metric label="Pump Status" value={sensorData.pumpRunning ? "RUNNING" : "STOPPED"} detail="Relay state" icon={Power} />
                <Metric label="Safety Timeout" value={sensorData.pumpTimeout ? "ACTIVE" : "CLEAR"} detail="30-second limit" icon={ShieldAlert} />
              </div>
              <Panel title="Pump Management" subtitle="Safety restrictions will remain enforced by ESP32">
                <p className="mb-4 text-sm text-slate-600">
                  Manual pump commands require additional firmware logic and safety validation.
                </p>
                <button onClick={() => requestControl("Manual Pump Control")} className="rounded-lg border border-[#254C3B] px-5 py-3 text-sm font-medium text-[#254C3B] hover:bg-emerald-50">
                  Test Pump Control Interface
                </button>
              </Panel>
              <Panel title="Current Water Thresholds">
                <SensorRow label="Low water" value="Pump activation threshold" status="≤ 1000 ADC" tone="amber" />
                <SensorRow label="Full water" value="Pump stop threshold" status="≥ 2500 ADC" />
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
              <Panel title="Safety Monitoring">
                <SensorRow label="Lighting" value="LDR-controlled LED" status={sensorData.lightOn ? "ON" : "OFF"} />
                <SensorRow label="Fire Alarm" value="Flame sensor + buzzer" status={sensorData.flame ? "ALERT" : "Normal"} tone={sensorData.flame ? "red" : "green"} />
                <SensorRow label="IR Detection" value="Nearby object detection" status={sensorData.intrusion ? "Detected" : "Clear"} tone={sensorData.intrusion ? "amber" : "green"} />
              </Panel>
            </>
          )}

          {page === "animals" && (
            <>
              <h2 className="text-2xl font-semibold">Animal Records</h2>
              <div className="grid gap-5 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <Panel title="Registered Animals" subtitle="Demo records stored in browser memory">
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
              <Panel title="Event History" subtitle="Sample logs and actions from this session">
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
