import { Suspense } from "react";
import styles from "./App.module.css";
import { DrumMachine } from "./DrumMachine";

export function App() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading</div>}>
      <DrumMachine />
    </Suspense>
  );
}
