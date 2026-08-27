import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

interface NavItemProps {
  label: string;
  path: string;
}

function NavItem({ label, path }: NavItemProps) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `dashboard-nav-item ${
          isActive ? "dashboard-nav-item--active" : ""
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="dashboard-nav-indicator" />
          <span>{label}</span>

          {isActive && (
            <span className="dashboard-nav-active-bar" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function DashboardLayout({
  children,
  title = "Operations Dashboard",
  subtitle = "Machine shop scheduling and live replanning",
  actions,
}: DashboardLayoutProps) {
  return (
    <>
      <div className="dashboard-layout">
        {/* SIDEBAR */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand">
            <div className="dashboard-brand-mark">
              MS
            </div>

            <div className="dashboard-brand-copy">
              <span className="dashboard-brand-name">
                MACHINE SHOP
              </span>

              <span className="dashboard-brand-subtitle">
                SCHEDULER
              </span>
            </div>
          </div>

          <nav
            className="dashboard-nav"
            aria-label="Main navigation"
          >
            <NavItem
              label="Overview"
              path="/dashboard"
            />

            <NavItem
              label="Schedule"
              path="/schedule"
            />

            <NavItem
              label="Scenarios"
              path="/scenarios"
            />

            <NavItem
              label="Machines"
              path="/machines"
            />
          </nav>

          <div className="dashboard-sidebar-footer">
            <div className="dashboard-engine-status">
              <span className="dashboard-status-dot" />

              <div>
                <span className="dashboard-engine-label">
                  ENGINE
                </span>

                <span className="dashboard-engine-value">
                  ONLINE
                </span>
              </div>
            </div>

            <span className="dashboard-version">
              v1.0.0
            </span>
          </div>
        </aside>

        {/* MAIN */}
        <div className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-heading">
              <div className="dashboard-breadcrumb">
                <span>CONTROL ROOM</span>

                <span className="dashboard-breadcrumb-separator">
                  /
                </span>

                <span>OPERATIONS</span>
              </div>

              <h1 className="dashboard-title">
                {title}
              </h1>

              <p className="dashboard-subtitle">
                {subtitle}
              </p>
            </div>

            {actions && (
              <div className="dashboard-actions">
                {actions}
              </div>
            )}
          </header>

          <main className="dashboard-content">
            {children}
          </main>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          min-height: 100%;
          width: 100%;
        }

        body {
          background: #ffffff;
        }

        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #ffffff;
          color: #111827;
        }

        /* =========================
           SIDEBAR
        ========================= */

        .dashboard-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 20;

          display: flex;
          flex-direction: column;

          width: 224px;

          background: #ffffff;
          border-right: 1px solid #e5e7eb;
        }

        .dashboard-brand {
          display: flex;
          align-items: center;
          gap: 11px;

          height: 72px;
          padding: 0 20px;

          border-bottom: 1px solid #e5e7eb;
        }

        .dashboard-brand-mark {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 32px;
          height: 32px;

          border: 1px solid #d1d5db;
          border-radius: 7px;

          background: #111827;
          color: #ffffff;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .dashboard-brand-copy {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .dashboard-brand-name {
          color: #111827;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .dashboard-brand-subtitle {
          color: #94a3b8;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.16em;
        }

        /* =========================
           NAVIGATION
        ========================= */

        .dashboard-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;

          padding: 18px 10px;
        }

        .dashboard-nav-item {
          position: relative;

          display: flex;
          align-items: center;
          gap: 11px;

          width: 100%;
          height: 40px;
          padding: 0 12px;

          border-radius: 6px;

          background: transparent;
          color: #64748b;

          font-family: inherit;
          font-size: 11px;
          font-weight: 500;
          text-align: left;
          text-decoration: none;

          cursor: pointer;

          transition:
            color 140ms ease,
            background 140ms ease,
            border-color 140ms ease;
        }

        .dashboard-nav-item:hover {
          background: #f8fafc;
          color: #334155;
        }

        .dashboard-nav-item--active {
          background: #eef8ff;
          color: #0369a1;
          font-weight: 600;
        }

        .dashboard-nav-indicator {
          width: 5px;
          height: 5px;
          flex: 0 0 5px;

          border-radius: 50%;
          background: #cbd5e1;

          transition:
            background 140ms ease,
            transform 140ms ease;
        }

        .dashboard-nav-item--active
          .dashboard-nav-indicator {
          background: #0ea5e9;
          transform: scale(1.15);
        }

        .dashboard-nav-active-bar {
          position: absolute;

          right: 0;
          top: 9px;

          width: 3px;
          height: 22px;

          border-radius: 999px 0 0 999px;

          background: #0ea5e9;
        }

        /* =========================
           SIDEBAR FOOTER
        ========================= */

        .dashboard-sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 14px;

          margin-top: auto;
          padding: 16px 15px;

          border-top: 1px solid #e5e7eb;
        }

        .dashboard-engine-status {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .dashboard-status-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;

          border-radius: 50%;
          background: #22c55e;

          box-shadow:
            0 0 0 3px #ecfdf5;
        }

        .dashboard-engine-status > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .dashboard-engine-label {
          color: #94a3b8;
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .dashboard-engine-value {
          color: #16a34a;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
          letter-spacing: 0.08em;
        }

        .dashboard-version {
          color: #cbd5e1;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
        }

      

        .dashboard-main {
          display: flex;
          flex-direction: column;

          width: calc(100% - 224px);
          min-height: 100vh;

          margin-left: 224px;

          background: #ffffff;
        }

        /* =========================
           HEADER
        ========================= */

        .dashboard-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;

          min-height: 126px;
          padding: 28px 34px 25px;

          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }

        .dashboard-heading {
          min-width: 0;
        }

        .dashboard-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 11px;

          color: #94a3b8;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.14em;
        }

        .dashboard-breadcrumb-separator {
          color: #cbd5e1;
        }

        .dashboard-title {
          margin: 0;

          color: #111827;

          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.025em;
          line-height: 1.1;
        }

        .dashboard-subtitle {
          margin: 7px 0 0;

          color: #94a3b8;

          font-size: 11px;
          line-height: 1.4;
        }

        .dashboard-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
        }

        /* =========================
           CONTENT
        ========================= */

        .dashboard-content {
          flex: 1;
          width: 100%;
          max-width: 1600px;

          margin: 0 auto;
          padding: 26px 34px 40px;

          background: #ffffff;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 900px) {
          .dashboard-sidebar {
            width: 64px;
          }

          .dashboard-main {
            width: calc(100% - 64px);
            margin-left: 64px;
          }

          .dashboard-brand {
            justify-content: center;
            padding: 0;
          }

          .dashboard-brand-copy {
            display: none;
          }

          .dashboard-nav {
            padding: 18px 8px;
          }

          .dashboard-nav-item {
            justify-content: center;
            padding: 0;
          }

          .dashboard-nav-item > span:nth-child(2) {
            display: none;
          }

          .dashboard-nav-active-bar {
            display: none;
          }

          .dashboard-sidebar-footer {
            align-items: center;
            padding: 14px 8px;
          }

          .dashboard-engine-status > div,
          .dashboard-version {
            display: none;
          }

          .dashboard-header {
            padding-left: 24px;
            padding-right: 24px;
          }

          .dashboard-content {
            padding-left: 24px;
            padding-right: 24px;
          }
        }

        @media (max-width: 600px) {
          .dashboard-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 18px;

            min-height: auto;
            padding: 22px 18px;
          }

          .dashboard-content {
            padding: 18px;
          }

          .dashboard-title {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}