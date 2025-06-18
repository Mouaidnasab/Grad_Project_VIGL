import React, { useRef, useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import {
  Info,
  Barcode,
  CalendarCheck,
  AlertCircle,
  Activity,
  Users,
  UserCheck,
  Terminal,
  Database,
  Figma,
  Smartphone,
  Monitor,
  Atom,
  SquarePercent,
} from "lucide-react";
import "../Css/About.css";

function useInView(ref, options = { threshold: 0.1 }) {
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(element);
      }
    }, options);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
}

const AboutPage = () => {
  const navigate = useNavigate();

  const heroRef = useRef(null);
  const supervisorRef = useRef(null);
  const missionRef = useRef(null);
  const featuresRef = useRef(null);
  const toolsRef = useRef(null);
  const teamRef = useRef(null);
  const visionRef = useRef(null);
  const ctaRef = useRef(null);

  const heroVisible = useInView(heroRef);
  const supervisorVisible = useInView(supervisorRef);
  const missionVisible = useInView(missionRef);
  const featuresVisible = useInView(featuresRef);
  const toolsVisible = useInView(toolsRef);
  const teamVisible = useInView(teamRef);
  const visionVisible = useInView(visionRef);
  const ctaVisible = useInView(ctaRef);

  const features = [
    {
      icon: <Barcode size={20} className="text-success me-2" />,
      title: "Barcode Assignment",
      desc: "Auto-map products to shelf labels via barcode scan.",
    },
    {
      icon: <CalendarCheck size={20} className="text-success me-2" />,
      title: "Promo Scheduling",
      desc: "Define and apply promotional windows centrally.",
    },
    {
      icon: <AlertCircle size={20} className="text-success me-2" />,
      title: "Threshold Alerts",
      desc: "Real-time enforcement of legal price limits.",
    },
    {
      icon: <Activity size={20} className="text-success me-2" />,
      title: "Penalty Automation",
      desc: "Automatically trigger non-compliance penalties.",
    },
    {
      icon: <UserCheck size={20} className="text-success me-2" />,
      title: "Role-Based UI",
      desc: "Custom interfaces for inspectors, managers, and staff.",
    },
    {
      icon: <Monitor size={20} className="text-success me-2" />,
      title: "Real-Time Analytics",
      desc: "Gain actionable insights with live dashboards and reports.",
    },
  ];

  const tools = [
    {
      icon: <Terminal size={20} className="text-success me-1" />,
      label: "FastAPI",
    },
    {
      icon: <Database size={20} className="text-success me-1" />,
      label: "MySQL",
    },
    { icon: <Figma size={20} className="text-success me-1" />, label: "Figma" },
    {
      icon: <Smartphone size={20} className="text-success me-1" />,
      label: "Flutter",
    },
    {
      icon: <SquarePercent size={20} className="text-success me-1" />,
      label: "E-Paper ESL",
    },
    {
      icon: <Atom size={20} className="text-success me-1" />,
      label: "React.js",
    },
  ];

  const team = [
    {
      name: "Mouaid Nasab",
      role: "Project Manager",
      desc: "Leads architecture, backend & database design.",
    },
    {
      name: "Ali Othman",
      role: "Software Team Leader & Front-end Dev",
      desc: "Oversees React frontend and mobile interfaces.",
    },
    {
      name: "Abdulwahab Swenia",
      role: "DB Team Leader & Developer",
      desc: "Designs MySQL schemas and data integrations.",
    },
    {
      name: "Ali Kalou",
      role: "Analysis & Testing Leader",
      desc: "Manages QA/testing workflows and data validation.",
    },
  ];

  return (
    <div className="d-flex flex-column bg-light" style={{ height: "100svh" }}>
      <nav className="navbar navbar-light bg-light shadow-sm">
        <div className="container-fluid justify-content-center">
          <a className="navbar-brand" href="#">
            <img src="/logo.png" alt="VIGL Logo" width="120" />
          </a>
        </div>
      </nav>

      <div className="flex-grow-1 overflow-auto px-3 pt-3 pb-5">
        <div
          ref={heroRef}
          className={`animated-hero text-white text-center p-4 mb-4 fade-in-section ${
            heroVisible ? "is-visible" : ""
          }`}
        >
          <Info size={32} className="mb-2" />
          <h2 className="h5 fw-bold mb-1">
            Smart Label System for Supermarkets
          </h2>
          <small>Graduation Project (CMSE-406) • EMU Spring 2024/25</small>
        </div>

        <div
          ref={supervisorRef}
          className={`card rounded-3 shadow-sm border-0 mb-4 fade-in-section ${
            supervisorVisible ? "is-visible" : ""
          }`}
        >
          <div className="card-body px-3 py-4 text-center">
            <UserCheck size={24} className="text-success mb-2" />
            <h6 className="fw-bold mb-1">Supervisor</h6>
            <p className="small text-muted mb-0">
              Prof. Dr. Duygu Çelik Ertuğrul
            </p>
          </div>
        </div>

        <div
          ref={missionRef}
          className={`card rounded-3 shadow-sm border-0 mb-4 fade-in-section ${
            missionVisible ? "is-visible" : ""
          }`}
        >
          <div className="card-body px-3 py-4">
            <h6 className="fw-bold mb-2">Our Mission</h6>
            <p className="small text-muted mb-0">
              Deliver a real-time, energy-efficient ESL solution that ensures
              pricing accuracy, operational efficiency, and regulatory
              compliance in TRNC supermarkets.
            </p>
          </div>
        </div>

        <div
          ref={featuresRef}
          className={`mb-4 fade-in-section ${
            featuresVisible ? "is-visible" : ""
          }`}
        >
          <h6 className="text-success fw-bold mb-2">Key Features</h6>
          <div className="row row-cols-1 row-cols-sm-2 g-3">
            {features.map((f, i) => (
              <div key={i} className="col">
                <div className="d-flex align-items-start bg-white rounded-3 shadow-sm p-3 h-100">
                  {f.icon}
                  <div>
                    <div className="fw-semibold">{f.title}</div>
                    <small className="text-muted">{f.desc}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={toolsRef}
          className={`mb-4 fade-in-section ${toolsVisible ? "is-visible" : ""}`}
        >
          <h6 className="text-success fw-bold mb-2">Tools & Technologies</h6>
          <div className="d-flex flex-wrap gap-3">
            {tools.map((t, i) => (
              <div
                key={i}
                className="d-flex align-items-center bg-white rounded-pill shadow-sm px-3 py-1"
              >
                {t.icon}
                <small className="mb-0">{t.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={teamRef}
          className={`mb-4 fade-in-section ${teamVisible ? "is-visible" : ""}`}
        >
          <h6 className="text-success fw-bold mb-2">Project Team</h6>
          <div className="row row-cols-1 row-cols-sm-2 g-3">
            {team.map((m, i) => (
              <div key={i} className="col">
                <div className="bg-white rounded-3 shadow-sm p-3 h-100 text-center">
                  <Users size={28} className="text-success mb-2" />
                  <div className="fw-semibold">{m.name}</div>
                  <small className="text-muted">{m.role}</small>
                  <p className="small text-muted mt-2 mb-0">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={visionRef}
          className={`card rounded-3 shadow-sm border-0 mb-4 fade-in-section ${
            visionVisible ? "is-visible" : ""
          }`}
        >
          <div className="card-body px-3 py-4">
            <h6 className="fw-bold mb-2">Our Vision</h6>
            <p className="small text-muted mb-0">
              To set the standard for smart retail pricing—seamless, compliant,
              and sustainable.
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 pb-4">
        <button
          className="btn btn-success w-100 rounded-pill"
          style={{ backgroundColor: "#738844" }}
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default AboutPage;
