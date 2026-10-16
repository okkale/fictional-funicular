import { MotionConfig } from "motion/react";
import Nav from "./components/Nav";
import { still } from "./perf";
import Landing from "./kale/Landing";
import Kale from "./kale/Kale";
import Hero from "./components/Hero";
import Portal from "./components/Portal";
import Expertise from "./components/Expertise";
import { CursorGlow } from "./components/ui";
import Projects from "./components/Projects";
import ModelLab from "./components/ModelLab";
import { Contact, Experience, Metrics, Stack, Systems } from "./components/Sections";

export default function App() {
  return (
    <MotionConfig reducedMotion={still ? "always" : "never"}>
      <div className="grain" aria-hidden />
      <CursorGlow />
      <Nav />
      <Kale />
      <main className="relative z-10 overflow-x-clip">
        <Landing />
        <Hero />
        <Metrics />
        <Portal />
        <Expertise />
        <Projects />
        <ModelLab />
        <Systems />
        <Experience />
        <Stack />
        <Contact />
      </main>
    </MotionConfig>
  );
}
