import { Suspense } from "react";
import { Link, Route, Switch, Router } from "wouter";
import styles from "./App.module.css";

import { DrumMachine } from "./DrumMachine";
import { About } from "./About";
import { NotFound } from "./NotFound";

export function App() {
  // Remove trailing slash from base if present
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
  return (
    <Router base={base}>
      <div className={styles.main}>
        <nav>
          <Link href="/">Drum Machine</Link> | <Link href="/about">About</Link>
        </nav>
        <Suspense fallback={<div className={styles.loading}>Loading</div>}>
          <Switch>
            <Route path="/" component={DrumMachine} />
            <Route path="/about" component={About} />
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </Suspense>
      </div>
    </Router>
  );
}
