import { Suspense } from "react";
import { Link, Route, Switch, Router } from "wouter";
import styles from "./App.module.css";
import { DrumMachine } from "./DrumMachine";
import { About } from "./About";

export function App() {
  return (
    <Router base="/web-audio-drum-machine">
      <div>
        <nav
          style={{
            padding: 16,
            borderBottom: "1px solid #eee",
            marginBottom: 24,
          }}
        >
          <Link href="/">Drum Machine</Link> | <Link href="/about">About</Link>
        </nav>
        <Suspense fallback={<div className={styles.loading}>Loading</div>}>
          <Switch>
            <Route path="/" component={DrumMachine} />
            <Route path="/about" component={About} />
          </Switch>
        </Suspense>
      </div>
    </Router>
  );
}
