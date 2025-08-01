import { Suspense } from "react";
import { Link, Route, Switch, Router, useParams, Redirect } from "wouter";
import styles from "./App.module.css";

import { DrumMachine } from "./DrumMachine";
import { About } from "./About";
import { NotFound } from "./NotFound";

// Wrapper component to handle pattern route parameters
function PatternRoute() {
  const params = useParams();
  return params.encodedPattern ? (
    <DrumMachine initialPattern={params.encodedPattern} />
  ) : (
    <Redirect to="/" />
  );
}

// Wrapper component for the root route
function RootRoute() {
  return (
    <Redirect to="/pattern/HhoAKQdkZWZhdWx0BO9rLF4AAD1FACyAJAAAADwAAAAAfwAAAAAAAAB_AAAAU0y_ObVQq1l3sk3qUktOAAAAAAAAAAAAAAAAAAAATF4~" />
  );
}

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
            <Route path="/" component={RootRoute} />
            <Route path="/about" component={About} />
            <Route path="/pattern/:encodedPattern" component={PatternRoute} />
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </Suspense>
      </div>
    </Router>
  );
}
