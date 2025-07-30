import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const ScrollNavbar = () => {
  const navbarRef = useRef(null);
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);

  useEffect(() => {
    const trigger = ScrollTrigger.create;

    return () => {
      trigger.kill(); // cleanup
    };
  }, []);

  return (
    <div className="app">
      {/* Navbar */}
      <nav
        ref={navbarRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          padding: "1rem",
          backgroundColor: "#ecf0f1",
          color: "#2c3e50",
          zIndex: 1000,
          transition: "0.3s, color 0.3s",
        }}
      >
        <div
          className="navbar-content"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="logo">Logo</div>
          <ul style={{ display: "flex", listStyle: "none", gap: "1rem" }}>
            <li>Home</li>
            <li>About</li>
            <li>Contact</li>
          </ul>
        </div>
      </nav>

      {/* Section 1 */}
      <section
        ref={section1Ref}
        style={{
          height: "100vh",
          width: "100wv",
          backgroundColor: "#3498db",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: "2rem",
        }}
      >
        <h1>First Section</h1>
      </section>

      {/* Section 2 */}
      <section
        ref={section2Ref}
        style={{
          height: "100vh",
          backgroundColor: "#e74c3c",
          width: "100wv",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: "2rem",
        }}
      >
        <h1>Second Section</h1>
      </section>
    </div>
  );
};

export default ScrollNavbar;
