import React from "react";
import BootstrapNavbar from "../component/BootstrapNavbar";
import Footer from "../component/footerInit.jsx";
import "../Css/About.css";
import aboutimg from "../images/Aboutimg.png";
import teamMember1 from "../images/Mouaid.jpg";
import teamMember2 from "../images/Othman.jpg";
import teamMember3 from "../images/Abd.jpg";
import teamMember4 from "../images/Kalo.jpg";
import {
  Info,
  UserCheck,
  Barcode,
  CalendarCheck,
  AlertCircle,
  Activity,
  Terminal,
  Database,
  Figma,
  Smartphone,
  SquarePercent,
  Atom,
  Monitor,
} from "lucide-react";

const AboutPage = () => {
  const features = [
    {
      icon: <Barcode size={80} className="text-success me-2" />,
      title: "Barcode Assignment",
      desc: "Auto-map products to shelf labels via barcode scan.",
    },
    {
      icon: <AlertCircle size={80} className="text-success me-2" />,
      title: "Threshold Alerts",
      desc: "Real-time enforcement of legal price limits.",
    },
    {
      icon: <CalendarCheck size={80} className="text-success me-2" />,
      title: "Promo Scheduling",
      desc: "Define and apply promotional windows centrally.",
    },
    {
      icon: <Activity size={80} className="text-success me-2" />,
      title: "Penalty Automation",
      desc: "Automatically trigger non-compliance penalties.",
    },
    {
      icon: <UserCheck size={80} className="text-success me-2" />,
      title: "Role-Based UI",
      desc: "Custom interfaces for inspectors, managers, and staff.",
    },
    {
      icon: <Monitor size={80} className="text-success me-2" />,
      title: "Real-Time Analytics",
      desc: "Gain actionable insights with live dashboards and reports.",
    },
  ];

  const tools = [
    {
      icon: <Terminal size={30} className="text-success me-1" />,
      label: "FastAPI",
    },
    {
      icon: <Database size={30} className="text-success me-1" />,
      label: "MySQL",
    },
    {
      icon: <Smartphone size={30} className="text-success me-1" />,
      label: "Flutter",
    },
    {
      icon: <SquarePercent size={30} className="text-success me-1" />,
      label: "E-Paper ESL",
    },
    {
      icon: <Atom size={30} className="text-success me-1" />,
      label: "React.js",
    },
  ];

  const teamMembers = [
    {
      id: 1,
      name: "Mouaid Nasab",
      role: "Project Manager",
      description: "Leads architecture, backend & database design.",
      image: teamMember1,
    },
    {
      id: 2,
      name: "Ali Othman",
      role: "Software Team Leader & Front-end Dev",
      description: "Oversees React frontend and mobile interfaces.",
      image: teamMember2,
    },
    {
      id: 3,
      name: "Abdulwahab Swenia",
      role: "DB Team Leader & Developer",
      description: "Designs MySQL schemas and data integrations.",
      image: teamMember3,
    },
    {
      id: 4,
      name: "Ali Kalou",
      role: "Analysis & Testing Leader",
      description: "Manages QA/testing workflows and data validation.",
      image: teamMember4,
    },
  ];

  return (
    <>
      <BootstrapNavbar />
      <div className="about-outer-container">
        <div className="fixed-left-square-image">
          <img src={aboutimg} alt="Decorative Image" />
        </div>

        <div className="about-page-wrapper">
          <section className="about-hero-section text-center">
            <h1 className="about-heading">
              Smart Label System for Supermarkets
            </h1>
            <p className="about-subheading">
              Graduation Project (CMSE-406) • EMU Spring 2024/25
            </p>
          </section>

          <section className="about-section about-supervisor">
            <h2 className="section-title">Supervisor</h2>
            <p className="section-description">
              Prof. Dr. Duygu Çelik Ertuğrul
            </p>
          </section>

          <section className="about-section about-mission">
            <h2 className="section-title">Our Mission</h2>
            <p className="section-description">
              Deliver a real-time, energy-efficient ESL solution that ensures
              pricing accuracy, operational efficiency, and regulatory
              compliance in TRNC supermarkets.
            </p>
          </section>

          <section className="about-section about-features">
            <h2 className="section-title">Key Features</h2>
            <div className="features-grid">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="feature-item d-flex align-items-center mb-3"
                >
                  {feature.icon}
                  <div>
                    <h3 className="mb-1">{feature.title}</h3>
                    <p className="mb-0">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="about-section about-tools">
            <h2 className="section-title">Tools & Technologies</h2>
            <div className="tools-list d-flex flex-wrap gap-3">
              {tools.map((tool) => (
                <div
                  key={tool.label}
                  className="tool-item d-flex align-items-center"
                >
                  {tool.icon}
                  <span className="ms-1">{tool.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="about-section about-team">
            <h2 className="section-title">Project Team</h2>
            <div className="team-grid row row-cols-1 row-cols-sm-2 g-3 ">
              {teamMembers.map((member) => (
                <div key={member.id} className="col">
                  <div
                    className="team-member-card bg-white rounded-3 border-0  shadow-sm p-3 text-center h-100 "
                    style={{ width: "300px" }}
                  >
                    <img
                      src={member.image}
                      alt={member.name}
                      className="team-member-image rounded-circle mb-2"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/150x150/cccccc/333333?text=No+Image";
                      }}
                    />
                    <h3 className="mb-1">{member.name}</h3>
                    <p className="team-member-role text-muted mb-1">
                      {member.role}
                    </p>
                    <p className="team-member-description text-muted mb-0">
                      {member.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="about-section about-vision">
            <h2 className="section-title">Our Vision</h2>
            <p className="section-description">
              To set the standard for smart retail pricing—seamless, compliant,
              and sustainable.
            </p>
          </section>

          <section className="about-section about-cta text-center">
            <button
              className="cta-button btn btn-success rounded-pill px-4 py-2"
              onClick={() => (window.location.href = "/")}
            >
              Back to Home
            </button>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;
