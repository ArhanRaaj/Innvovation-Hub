import os

new_styles = """
/* ==========================================================================
   THE INNOVATION HUB - ANIMATIONS & HOME PAGE SECTIONS
   ========================================================================== */

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 15px rgba(255, 255, 255, 0.08); }
  50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.22); }
}

@keyframes wireFlow {
  from { stroke-dashoffset: 40; }
  to { stroke-dashoffset: 0; }
}

@keyframes floatCard {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes borderShimmer {
  0% { border-color: rgba(255, 255, 255, 0.12); }
  50% { border-color: rgba(255, 255, 255, 0.35); }
  100% { border-color: rgba(255, 255, 255, 0.12); }
}

.home-section {
  padding: 100px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  background: transparent;
}

.section-header-center {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 56px auto;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: #A3A3A3;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.section-kicker-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 0 8px #FFFFFF;
}

.section-title-large {
  font-size: clamp(2.2rem, 3.8vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #FFFFFF;
  line-height: 1.12;
  margin-bottom: 16px;
}

.section-subtitle {
  font-size: 1.05rem;
  color: #A3A3A3;
  line-height: 1.6;
}

/* Innovation Pillars Matrix */
.home-pillars-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .home-pillars-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .home-pillars-grid {
    grid-template-columns: 1fr;
  }
}

.pillar-card {
  background: #0A0A0A;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.pillar-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.pillar-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.9), 0 0 25px rgba(255, 255, 255, 0.08);
}

.pillar-card:hover::before {
  opacity: 1;
}

.pillar-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  margin-bottom: 20px;
  transition: all 0.25s ease;
}

.pillar-card:hover .pillar-icon-box {
  background: #FFFFFF;
  color: #000000;
  transform: scale(1.05);
}

.pillar-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
}

.pillar-desc {
  font-size: 0.88rem;
  color: #A3A3A3;
  line-height: 1.55;
  flex: 1;
  margin-bottom: 18px;
}

.pillar-badge {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  color: #737373;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Interactive Hardware Playground Widget */
.playground-box {
  background: #0A0A0A;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 36px;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 36px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9);
}

@media (max-width: 960px) {
  .playground-box {
    grid-template-columns: 1fr;
    padding: 24px;
  }
}

.playground-controls {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.playground-ctrl-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.playground-ctrl-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #737373;
  text-transform: uppercase;
}

.playground-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.playground-choice-btn {
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #A3A3A3;
  padding: 7px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playground-choice-btn:hover {
  border-color: rgba(255, 255, 255, 0.3);
  color: #FFFFFF;
}

.playground-choice-btn.active {
  background: #FFFFFF;
  color: #000000;
  border-color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(255, 255, 255, 0.2);
}

.playground-specs-card {
  background: #121212;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.playground-spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.playground-spec-key {
  color: #737373;
}

.playground-spec-val {
  font-family: var(--font-mono);
  font-weight: 600;
  color: #E5E5E5;
}

.playground-canvas-wrap {
  background: #050505;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  min-height: 380px;
  display: flex;
  flex-direction: column;
}

.playground-canvas-header {
  padding: 12px 18px;
  background: #0D0D0D;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.playground-canvas-title {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  color: #E5E5E5;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.playground-canvas-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Founder Spotlight Section */
.founder-spotlight-box {
  background: #0A0A0A;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 44px;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 40px;
  align-items: center;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9);
}

@media (max-width: 800px) {
  .founder-spotlight-box {
    grid-template-columns: 1fr;
    padding: 28px;
    text-align: center;
  }
}

.founder-portrait-wrap {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.founder-spotlight-img {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}

.founder-spotlight-badge {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #FFFFFF;
  color: #000000;
  padding: 4px 14px;
  border-radius: 9999px;
  font-weight: 800;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.founder-spotlight-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.founder-spotlight-name {
  font-size: 2.2rem;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.founder-spotlight-role {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 700;
  color: #A3A3A3;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.founder-spotlight-quote {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #D4D4D4;
}

.founder-credentials-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.founder-cred-pill {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 5px 12px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #A3A3A3;
}

/* Standalone Single Project Page Styles */
.single-project-view {
  min-height: 100vh;
  padding: 110px 0 60px 0;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #737373;
  margin-bottom: 24px;
}

.breadcrumb-nav a {
  color: #A3A3A3;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-nav a:hover {
  color: #FFFFFF;
}

.project-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 20px;
}

.project-page-title {
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #FFFFFF;
  margin-bottom: 12px;
}

.project-page-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.project-page-card {
  background: #0A0A0A;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 28px;
  margin-bottom: 40px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
}
"""

with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

if 'THE INNOVATION HUB - ANIMATIONS' not in css:
    with open('css/style.css', 'w', encoding='utf-8') as f:
        f.write(css + '\n' + new_styles)
    print('Appended successfully')
else:
    print('Already present')
