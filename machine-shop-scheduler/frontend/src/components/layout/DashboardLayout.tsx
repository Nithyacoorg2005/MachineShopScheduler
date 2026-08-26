import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

interface NavItemProps {
  label: string;
  active?: boolean;
}

function NavItem({
  label,
  active = false,
}: NavItemProps) {
  return (
    <button
      type="button"
      className={`dashboard-nav-item ${
        active ? "dashboard-nav-item--active" : ""
      }`}
    >
      <span className="dashboard-nav-indicator" />
      <span>{label}</span>
    </button>
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
              active
            />

            <NavItem label="Schedule" />

            <NavItem label="Scenarios" />

            <NavItem label="Machines" />
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

        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #08090a;
          color: #e7e9e8;
        }

        .dashboard-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 20;

          display: flex;
          flex-direction: column;

          width: 224px;

          background: #0a0b0c;
          border-right: 1px solid #202326;
        }

        .dashboard-brand {
          display: flex;
          align-items: center;
          gap: 11px;

          height: 72px;
          padding: 0 20px;

          border-bottom: 1px solid #202326;
        }

        .dashboard-brand-mark {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 30px;
          height: 30px;

          border: 1px solid #3b3f41;
          border-radius: 5px;

          color: #d5d8d7;

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
          color: #dedfdd;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .dashboard-brand-subtitle {
          color: #555c60;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.16em;
        }

        .dashboard-nav {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 18px 10px;
        }

        .dashboard-nav-item {
          display: flex;
          align-items: center;
          gap: 11px;

          width: 100%;
          height: 38px;
          padding: 0 12px;

          border: 0;
          border-radius: 5px;

          background: transparent;
          color: #62696d;

          font-family: inherit;
          font-size: 10px;
          font-weight: 500;
          text-align: left;

          cursor: pointer;

          transition:
            color 140ms ease,
            background 140ms ease;
        }

        .dashboard-nav-item:hover {
          background: #101214;
          color: #a8adac;
        }

        .dashboard-nav-item--active {
          background: #111416;
          color: #e1e3e1;
        }

        .dashboard-nav-indicator {
          width: 3px;
          height: 3px;
          flex: 0 0 3px;

          border-radius: 50%;
          background: #454b4e;

          transition:
            width 140ms ease,
            height 140ms ease,
            background 140ms ease;
        }

        .dashboard-nav-item--active
          .dashboard-nav-indicator {
          width: 5px;
          height: 5px;
          flex-basis: 5px;

          background: #b8bdba;
        }

        .dashboard-sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 14px;

          margin-top: auto;
          padding: 16px 15px;

          border-top: 1px solid #202326;
        }

        .dashboard-engine-status {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .dashboard-status-dot {
          width: 6px;
          height: 6px;
          flex: 0 0 6px;

          border-radius: 50%;
          background: #87a890;

          box-shadow:
            0 0 0 3px #17221a;
        }

        .dashboard-engine-status > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .dashboard-engine-label {
          color: #535a5e;
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .dashboard-engine-value {
          color: #91a998;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
          letter-spacing: 0.08em;
        }

        .dashboard-version {
          color: #3f4548;

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
        }

        .dashboard-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;

          min-height: 126px;
          padding: 28px 34px 25px;

          background: #0a0b0c;
          border-bottom: 1px solid #202326;
        }

        .dashboard-heading {
          min-width: 0;
        }

        .dashboard-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 11px;

          color: #4f565a;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          font-weight: 600;
          letter-spacing: 0.14em;
        }

        .dashboard-breadcrumb-separator {
          color: #303538;
        }

        .dashboard-title {
          margin: 0;

          color: #eceeec;

          font-size: 22px;
          font-weight: 500;
          letter-spacing: -0.025em;
          line-height: 1.1;
        }

        .dashboard-subtitle {
          margin: 7px 0 0;

          color: #5d6468;

          font-size: 10px;
          line-height: 1.4;
        }

        .dashboard-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
        }

        .dashboard-content {
          flex: 1;
          width: 100%;
          max-width: 1600px;

          margin: 0 auto;
          padding: 26px 34px 40px;
        }

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

          .dashboard-nav-item > span:last-child {
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
            font-size: 19px;
          }
        }
      `}</style>
    </>
  );
}