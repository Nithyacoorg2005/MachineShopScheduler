import { NavLink } from "react-router-dom";

type SidebarItem = {
  label: string;
  short: string;
  path: string;
};

const items: SidebarItem[] = [
  {
    label: "Overview",
    short: "OV",
    path: "/dashboard",
  },
  {
    label: "Schedule",
    short: "SC",
    path: "/schedule",
  },
  {
    label: "Scenarios",
    short: "SI",
    path: "/scenarios",
  },
  {
    label: "Machines",
    short: "MC",
    path: "/machines",
  },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: "238px",
        minWidth: "238px",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
      }}
    >
      {/* Brand */}
      <div
        style={{
          height: "124px",
          padding: "28px 18px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "9px",
            background: "#111827",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          MS
        </div>

        <div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
            }}
          >
            Machine Shop
          </div>

          <div
            style={{
              marginTop: "5px",
              fontSize: "11px",
              color: "#94a3b8",
              letterSpacing: "0.04em",
            }}
          >
            Scheduler v1.0
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: "24px 10px" }}>
        <div
          style={{
            padding: "0 6px",
            marginBottom: "10px",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "#94a3b8",
            textTransform: "uppercase",
          }}
        >
          Workspace
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                width: "100%",
                minHeight: "46px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "7px 10px",
                borderRadius: "8px",
                textDecoration: "none",
                boxSizing: "border-box",
                background: isActive ? "#eef8ff" : "transparent",
                color: isActive ? "#0369a1" : "#64748b",
                fontWeight: isActive ? 600 : 400,
                transition:
                  "background 150ms ease, color 150ms ease",
              })}
            >
              {({ isActive }) => (
                <>
                  <span
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "7px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: isActive
                        ? "#dff1ff"
                        : "#f8fafc",
                      border: `1px solid ${
                        isActive
                          ? "#c7e8ff"
                          : "#eef2f7"
                      }`,
                      fontSize: "10px",
                      fontWeight: 700,
                      color: isActive
                        ? "#0369a1"
                        : "#64748b",
                    }}
                  >
                    {item.short}
                  </span>

                  <span
                    style={{
                      fontSize: "14px",
                      lineHeight: 1,
                    }}
                  >
                    {item.label}
                  </span>

                  {isActive && (
                    <span
                      style={{
                        marginLeft: "auto",
                        width: "3px",
                        height: "22px",
                        borderRadius: "999px",
                        background: "#0ea5e9",
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom status */}
      <div
        style={{
          marginTop: "auto",
          padding: "18px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow:
                "0 0 0 4px rgba(34,197,94,0.10)",
            }}
          />

          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#64748b",
              letterSpacing: "0.04em",
            }}
          >
            SCHEDULING ENGINE
          </span>
        </div>

        <div
          style={{
            marginTop: "6px",
            marginLeft: "16px",
            fontSize: "11px",
            color: "#22c55e",
          }}
        >
          ONLINE
        </div>

        <div
          style={{
            marginTop: "14px",
            fontSize: "10px",
            color: "#cbd5e1",
            letterSpacing: "0.06em",
          }}
        >
          v1.0.0 · LOCAL
        </div>
      </div>
    </aside>
  );
}