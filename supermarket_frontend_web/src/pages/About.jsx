import React from 'react';
import BootstrapNavbar from '../component/BootstrapNavbar';
import Footer from '../component/footerInit.jsx';
import '../Css/About.css'; 
import aboutimg from '../images/Aboutimg.png';
import teamMember1 from '../images/team-member-1.jpg'; 
import teamMember2 from '../images/team-member-1.jpg'; 
import teamMember3 from '../images/team-member-1.jpg'; 
import teamMember4 from '../images/team-member-1.jpg'; 


const AboutPage = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Alice Johnson",
      role: "Lead Developer",
      description: "Specializing in backend architecture and database design.",
      image: teamMember1,
    },
    {
      id: 2,
      name: "Bob Williams",
      role: "UI/UX Designer",
      description: "Crafting intuitive and engaging user experiences.",
      image: teamMember2,
    },
    {
      id: 3,
      name: "Charlie Brown",
      role: "Product Manager",
      description: "Guiding the product vision from concept to launch.",
      image: teamMember3,
    },
    {
      id: 4,
      name: "Diana Miller",
      role: "Quality Assurance",
      description: "Ensuring the system's reliability and performance.",
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
          <section className="about-hero-section">
            <div className="about-hero-content">
              <h1 className="about-heading">About Our Smart Labeling System</h1>
              <p className="about-subheading">
                Empowering businesses with intelligent solutions for seamless inventory and shelf management.
              </p>
            </div>
          </section>
          <section className="about-section about-mission">
            <h2 className="section-title">Our Mission</h2>
            <p className="section-description">
              Our mission is to revolutionize the way businesses manage their products and shelves. We strive to provide an intuitive, efficient, and reliable smart labeling system that minimizes manual errors, optimizes inventory control, and enhances operational productivity. We believe in simplifying complex tasks to empower our users to achieve their full potential.
            </p>
          </section>
          <section className="about-section about-features">
            <h2 className="section-title">What We Offer</h2>
            <div className="features-grid">
              <div className="feature-item">
                <i className="feature-icon fas fa-tachometer-alt"></i> 
                <h3>Intuitive Dashboard</h3>
                <p>Gain quick insights and complete control over your operations with a user-friendly interface.</p>
              </div>
              <div className="feature-item">
                <i className="feature-icon fas fa-box-open"></i> 
                <h3>Seamless Product Management</h3>
                <p>Effortlessly add, update, and track products with comprehensive details and history.</p>
              </div>
              <div className="feature-item">
                <i className="feature-icon fas fa-warehouse"></i> 
                <h3>Dynamic Shelf Management</h3>
                <p>Organize your shelves efficiently with real-time updates and smart placement suggestions.</p>
              </div>
              <div className="feature-item">
                <i className="feature-icon fas fa-users-cog"></i> 
                <h3>Secure User Management</h3>
                <p>Manage staff access with role-based permissions, ensuring data security and accountability.</p>
              </div>
              <div className="feature-item">
                <i className="feature-icon fas fa-cogs"></i> 
                <h3>Customizable Settings</h3>
                <p>Tailor the system to perfectly fit your unique business requirements and workflows.</p>
              </div>
            </div>
          </section>
          <section className="about-section about-tools">
            <h2 className="section-title">Tools & Technologies Used</h2>
            <div className="tools-list">
              <div className="tool-item">
                <i className="tool-icon fab fa-react"></i>
                <span>React.js</span>
              </div>
              <div className="tool-item">
                <i className="tool-icon fab fa-node-js"></i> 
                <span>Node.js (Backend)</span>
              </div>
              <div className="tool-item">
                <i className="tool-icon fas fa-database"></i>
                <span>Database (e.g., MongoDB/PostgreSQL)</span>
              </div>
              <div className="tool-item">
                <i className="tool-icon fab fa-css3-alt"></i> 
                <span>CSS3</span>
              </div>
              <div className="tool-item">
                <i className="tool-icon fab fa-bootstrap"></i> 
                <span>Bootstrap</span>
              </div>
            </div>
          </section>
          <section className="about-section about-team">
            <h2 className="section-title">Meet Our Team</h2>
            <div className="team-grid">
              {teamMembers.map((member) => (
                <div key={member.id} className="team-member-card">
                  <img src={member.image} alt={member.name} className="team-member-image"
                       onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/150x150/cccccc/333333?text=No+Image"; }} // Fallback image
                  />
                  <h3>{member.name}</h3>
                  <p className="team-member-role">{member.role}</p>
                  <p className="team-member-description">{member.description}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="about-section about-vision">
            <h2 className="section-title">Our Vision</h2>
            <p className="section-description">
              We envision a future where inventory management is effortless, precise, and fully automated. Our goal is to be the leading provider of smart labeling solutions, continuously innovating to meet the evolving needs of modern businesses and contribute to a more organized and productive world.
            </p>
          </section>
          <section className="about-section about-cta">
            <h2 className="section-title">Ready to Transform Your Operations?</h2>
            <p className="section-description">
              Discover how our Smart Labeling System can streamline your business.
            </p>
            <button className="cta-button" onClick={() => alert('Navigate to Contact or Demo page')}>
              Get a Demo
            </button>
          </section>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AboutPage;