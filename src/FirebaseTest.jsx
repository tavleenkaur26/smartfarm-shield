import { useEffect, useState } from "react";
import { auth, database } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import { ref, onValue } from "firebase/database";

export default function FirebaseTest() {
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    let unsubscribe = () => {};

    signInAnonymously(auth)
      .then(() => {
        setStatus("Authenticated. Checking database...");

        unsubscribe = onValue(
          ref(database, "devices/esp32_01/telemetry"),
          (snapshot) => {
            setStatus(
              snapshot.exists()
                ? "Firebase connected — telemetry found!"
                : "Firebase connected — no telemetry yet."
            );
          },
          (error) => {
            setStatus(`Database error: ${error.message}`);
          }
        );
      })
      .catch((error) => {
        setStatus(`Authentication error: ${error.message}`);
      });

    return () => unsubscribe();
  }, []);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <strong>Firebase Connection:</strong> {status}
    </div>
  );
}