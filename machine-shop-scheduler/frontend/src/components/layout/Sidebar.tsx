import { useState } from "react";

export type SidebarSection =
  | "overview"
  | "schedule"
  | "scenarios"
  | "machines";

interface SidebarProps {
  activeSection?: SidebarSection;
  onNavigate?: (section: SidebarSection) => void;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

interface NavigationItem {
  id: SidebarSection;
  label: string;
  shortLabel: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "OV",
  },
  {
    id: "schedule",
    label: "Schedule",
    shortLabel: "SC",
  },
  {
    id: "scenarios",
    label: "Scenarios",
    shortLabel: "SN",
  },
  {
    id: "machines",
    label: "Machines",
    shortLabel: "MC",
  },
];

export default function Sidebar({
  activeSection = "overview",
  onNavigate,
  collapsed = false,
  onCollapse,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (
    section: SidebarSection
  ) => {
    onNavigate?.(section);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        className="sidebar-mobile-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <span />
        <span />
        <span />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={[
          "app-sidebar",
          collapsed
            ? "app-sidebar--collapsed"
            : "",
          mobileOpen
            ? "app-sidebar--mobile-open"
            : "",
        ].join(" ")}
      >
        <div className="app-sidebar__brand">
          <div className="app-sidebar__brand-mark">
            MS
          </div>

          {!collapsed && (
            <div className="app-sidebar__brand-copy">
              <span className="app-sidebar__brand-name">
                MACHINE SHOP
              </span>

              <span className="app-sidebar__brand-subtitle">
                SCHEDULER
              </span>
            </div>
          )}

          <button
            type="button"
            className="app-sidebar__collapse"
            onClick={() =>
              onCollapse?.(!collapsed)
            }
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            <span
              className={
                collapsed
                  ? "app-sidebar__collapse-icon app-sidebar__collapse-icon--collapsed"
                  : "app-sidebar__collapse-icon"
              }
            >
              ‹
            </span>
          </button>
        </div>

        <div className="app-sidebar__section">
          {!collapsed && (
            <span className="app-sidebar__section-label">
              WORKSPACE
            </span>
          )}

          <nav
            className="app-sidebar__navigation"
            aria-label="Primary navigation"
          >
            {navigationItems.map((item) => {
              const active =
                activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    "app-sidebar__nav-item",
                    active
                      ? "app-sidebar__nav-item--active"
                      : "",
                  ].join(" ")}
                  onClick={() =>
                    handleNavigate(item.id)
                  }
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                >
                  <span className="app-sidebar__nav-mark">
                    {item.shortLabel}
                  </span>

                  {!collapsed && (
                    <span className="app-sidebar__nav-label">
                      {item.label}
                    </span>
                  )}

                  {active && (
                    <span className="app-sidebar__active-line" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="app-sidebar__bottom">
          <div className="app-sidebar__engine">
            <span className="app-sidebar__engine-indicator" />

            {!collapsed && (
              <div className="app-sidebar__engine-copy">
                <span className="app-sidebar__engine-label">
                  SCHEDULING ENGINE
                </span>

                <span className="app-sidebar__engine-status">
                  ONLINE
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="app-sidebar__meta">
              <span>v1.0.0</span>

              <span className="app-sidebar__meta-separator">
                •
              </span>

              <span>LOCAL</span>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        .app-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 50;

          display: flex;
          flex-direction: column;

          width: 224px;

          background: #0a0b0c;
          border-right: 1px solid #202326;

          transition:
            width 180ms ease,
            transform 180ms ease;
        }

        .app-sidebar--collapsed {
          width: 68px;
        }

        /* -------------------------
           BRAND
           ------------------------- */

        .app-sidebar__brand {
          position: relative;

          display: flex;
          align-items: center;
          gap: 11px;

          min-height: 72px;
          padding: 0 18px;

          border-bottom: 1px solid #202326;
        }

        .app-sidebar--collapsed
          .app-sidebar__brand {
          justify-content: center;
          padding: 0;
        }

        .app-sidebar__brand-mark {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 30px;
          height: 30px;
          flex: 0 0 30px;

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

        .app-sidebar__brand-copy {
          display: flex;
          flex-direction: column;
          gap: 3px;

          min-width: 0;
        }

        .app-sidebar__brand-name {
          color: #dedfdd;

          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;

          white-space: nowrap;
        }

        .app-sidebar__brand-subtitle {
          color: #555c60;

          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.16em;
        }

        .app-sidebar__collapse {
          position: absolute;
          right: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          width: 21px;
          height: 21px;

          padding: 0;

          border: 1px solid transparent;
          border-radius: 4px;

          background: transparent;
          color: #555c60;

          cursor: pointer;

          opacity: 0;

          transition:
            opacity 140ms ease,
            color 140ms ease,
            background 140ms ease,
            border-color 140ms ease;
        }

        .app-sidebar__brand:hover
          .app-sidebar__collapse {
          opacity: 1;
        }

        .app-sidebar--collapsed
          .app-sidebar__collapse {
          position: static;
          margin-left: 0;

          opacity: 1;
        }

        .app-sidebar__collapse:hover {
          background: #141618;
          border-color: #292d30;
          color: #b1b6b5;
        }

        .app-sidebar__collapse-icon {
          display: block;

          font-family: Arial, sans-serif;
          font-size: 19px;
          font-weight: 300;
          line-height: 1;

          transform: translateX(-1px);
        }

        .app-sidebar__collapse-icon--collapsed {
          transform: rotate(180deg)
            translateX(1px);
        }

        /* -------------------------
           SECTION
           ------------------------- */

        .app-sidebar__section {
          padding: 19px 10px 0;
        }

        .app-sidebar__section-label {
          display: block;

          padding: 0 11px 9px;

          color: #454c50;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.16em;
        }

        /* -------------------------
           NAVIGATION
           ------------------------- */

        .app-sidebar__navigation {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .app-sidebar__nav-item {
          position: relative;

          display: flex;
          align-items: center;
          gap: 10px;

          width: 100%;
          height: 38px;

          padding: 0 10px;

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

        .app-sidebar--collapsed
          .app-sidebar__nav-item {
          justify-content: center;
          padding: 0;
        }

        .app-sidebar__nav-item:hover {
          background: #101214;
          color: #a8adac;
        }

        .app-sidebar__nav-item--active {
          background: #111416;
          color: #e1e3e1;
        }

        .app-sidebar__nav-mark {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 24px;
          height: 24px;
          flex: 0 0 24px;

          border: 1px solid #292d30;
          border-radius: 4px;

          color: #555c60;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          font-weight: 600;

          transition:
            color 140ms ease,
            border-color 140ms ease,
            background 140ms ease;
        }

        .app-sidebar__nav-item:hover
          .app-sidebar__nav-mark {
          color: #929898;
          border-color: #373c3f;
        }

        .app-sidebar__nav-item--active
          .app-sidebar__nav-mark {
          background: #191c1d;
          border-color: #414648;
          color: #c2c6c4;
        }

        .app-sidebar__nav-label {
          white-space: nowrap;
        }

        .app-sidebar__active-line {
          position: absolute;
          right: 0;

          width: 2px;
          height: 18px;

          border-radius: 2px 0 0 2px;

          background: #b9bdba;
        }

        /* -------------------------
           BOTTOM STATUS
           ------------------------- */

        .app-sidebar__bottom {
          margin-top: auto;
          padding: 15px;

          border-top: 1px solid #202326;
        }

        .app-sidebar--collapsed
          .app-sidebar__bottom {
          display: flex;
          justify-content: center;
          padding: 15px 0;
        }

        .app-sidebar__engine {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .app-sidebar__engine-indicator {
          width: 6px;
          height: 6px;
          flex: 0 0 6px;

          border-radius: 50%;

          background: #89a992;

          box-shadow:
            0 0 0 3px #17221a;
        }

        .app-sidebar__engine-copy {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .app-sidebar__engine-label {
          color: #535a5e;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.12em;

          white-space: nowrap;
        }

        .app-sidebar__engine-status {
          color: #8ca695;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
          letter-spacing: 0.08em;
        }

        .app-sidebar__meta {
          display: flex;
          align-items: center;
          gap: 6px;

          margin-top: 14px;

          color: #3f4548;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          letter-spacing: 0.06em;
        }

        .app-sidebar__meta-separator {
          color: #292e31;
        }

        /* -------------------------
           MOBILE
           ------------------------- */

        .sidebar-mobile-trigger {
          position: fixed;
          top: 15px;
          left: 15px;
          z-index: 40;

          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 4px;

          width: 34px;
          height: 34px;

          padding: 8px;

          border: 1px solid #292d30;
          border-radius: 5px;

          background: #0c0e0f;
          cursor: pointer;
        }

        .sidebar-mobile-trigger span {
          display: block;

          width: 100%;
          height: 1px;

          background: #8a9092;
        }

        .sidebar-mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 45;

          display: none;

          border: 0;

          background: rgba(0, 0, 0, 0.58);
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .app-sidebar {
            width: 68px;
          }

          .app-sidebar__brand {
            justify-content: center;
            padding: 0;
          }

          .app-sidebar__brand-copy {
            display: none;
          }

          .app-sidebar__collapse {
            display: none;
          }

          .app-sidebar__section {
            padding-left: 8px;
            padding-right: 8px;
          }

          .app-sidebar__section-label {
            display: none;
          }

          .app-sidebar__nav-item {
            justify-content: center;
            padding: 0;
          }

          .app-sidebar__nav-label {
            display: none;
          }

          .app-sidebar__active-line {
            right: -8px;
          }

          .app-sidebar__engine-copy,
          .app-sidebar__meta {
            display: none;
          }

          .app-sidebar__bottom {
            display: flex;
            justify-content: center;
            padding-left: 0;
            padding-right: 0;
          }
        }

        @media (max-width: 600px) {
          .sidebar-mobile-trigger {
            display: flex;
          }

          .app-sidebar {
            width: 224px;

            transform: translateX(-100%);

            box-shadow:
              12px 0 35px rgba(0, 0, 0, 0.35);
          }

          .app-sidebar--mobile-open {
            transform: translateX(0);
          }

          .app-sidebar--mobile-open
            .app-sidebar__brand {
            justify-content: flex-start;
            padding: 0 18px;
          }

          .app-sidebar--mobile-open
            .app-sidebar__brand-copy {
            display: flex;
          }

          .app-sidebar--mobile-open
            .app-sidebar__collapse {
            display: none;
          }

          .app-sidebar--mobile-open
            .app-sidebar__section {
            padding-left: 10px;
            padding-right: 10px;
          }

          .app-sidebar--mobile-open
            .app-sidebar__section-label {
            display: block;
          }

          .app-sidebar--mobile-open
            .app-sidebar__nav-item {
            justify-content: flex-start;
            padding: 0 10px;
          }

          .app-sidebar--mobile-open
            .app-sidebar__nav-label {
            display: inline;
          }

          .app-sidebar--mobile-open
            .app-sidebar__engine-copy {
            display: flex;
          }

          .app-sidebar--mobile-open
            .app-sidebar__meta {
            display: flex;
          }

          .sidebar-mobile-overlay {
            display: block;
          }
        }
      `}</style>
    </>
  );
}