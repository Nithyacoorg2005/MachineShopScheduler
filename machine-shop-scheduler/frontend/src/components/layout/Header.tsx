import { useState } from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  onScenarioClick?: () => void;
  loading?: boolean;
}

export default function Header({
  title = "Operations Dashboard",
  subtitle = "Machine shop scheduling and live replanning",
  onRefresh,
  onScenarioClick,
  loading = false,
}: HeaderProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing || loading) return;

    setRefreshing(true);

    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 350);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="app-header__left">
          <div className="app-header__breadcrumb">
            <span>CONTROL ROOM</span>
            <span className="app-header__separator">/</span>
            <span>OPERATIONS</span>
          </div>

          <div className="app-header__heading">
            <h1>{title}</h1>

            <p>{subtitle}</p>
          </div>
        </div>

        <div className="app-header__right">
          <div className="app-header__engine">
            <span className="app-header__engine-dot" />

            <div>
              <span className="app-header__engine-label">
                SCHEDULING ENGINE
              </span>

              <span className="app-header__engine-status">
                ONLINE
              </span>
            </div>
          </div>

          <div className="app-header__divider" />

          <button
            type="button"
            className="app-header__button app-header__button--secondary"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <span
              className={`app-header__refresh-icon ${
                refreshing || loading
                  ? "app-header__refresh-icon--spinning"
                  : ""
              }`}
            >
              ↻
            </span>

            {refreshing || loading
              ? "UPDATING"
              : "REFRESH"}
          </button>

          <button
            type="button"
            className="app-header__button app-header__button--primary"
            onClick={onScenarioClick}
          >
            <span className="app-header__plus">
              +
            </span>

            RUN SCENARIO
          </button>
        </div>
      </header>

      <style>{`
        .app-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 32px;

          width: 100%;
          min-height: 118px;

          padding: 27px 34px 24px;

          background: #0a0b0c;
          border-bottom: 1px solid #202326;

          color: #e7e9e8;
        }

        .app-header__left {
          min-width: 0;
        }

        .app-header__breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 10px;

          color: #4f565a;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          font-weight: 600;
          letter-spacing: 0.15em;
          line-height: 1;
        }

        .app-header__separator {
          color: #303538;
        }

        .app-header__heading h1 {
          margin: 0;

          color: #eceeec;

          font-size: 21px;
          font-weight: 500;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }

        .app-header__heading p {
          margin: 7px 0 0;

          color: #5d6468;

          font-size: 10px;
          line-height: 1.4;
        }

        .app-header__right {
          display: flex;
          align-items: center;
          gap: 9px;

          flex: 0 0 auto;
        }

        .app-header__engine {
          display: flex;
          align-items: center;
          gap: 9px;

          padding-right: 8px;
        }

        .app-header__engine-dot {
          width: 6px;
          height: 6px;
          flex: 0 0 6px;

          border-radius: 50%;

          background: #89a992;

          box-shadow:
            0 0 0 3px #17211a;
        }

        .app-header__engine > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .app-header__engine-label {
          color: #535a5e;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.13em;
          white-space: nowrap;
        }

        .app-header__engine-status {
          color: #8ca695;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
          font-weight: 500;
          letter-spacing: 0.08em;
        }

        .app-header__divider {
          width: 1px;
          height: 27px;

          margin: 0 5px;

          background: #24282a;
        }

        .app-header__button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;

          height: 32px;

          padding: 0 12px;

          border: 1px solid transparent;
          border-radius: 5px;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;

          cursor: pointer;

          transition:
            background 140ms ease,
            border-color 140ms ease,
            color 140ms ease,
            opacity 140ms ease;
        }

        .app-header__button:disabled {
          cursor: default;
          opacity: 0.55;
        }

        .app-header__button--secondary {
          background: #0e1011;
          border-color: #292d30;
          color: #858b8d;
        }

        .app-header__button--secondary:hover:not(:disabled) {
          background: #141618;
          border-color: #383d40;
          color: #b4b8b7;
        }

        .app-header__button--primary {
          background: #d7d8d3;
          border-color: #d7d8d3;
          color: #111314;
        }

        .app-header__button--primary:hover {
          background: #ecece7;
          border-color: #ecece7;
        }

        .app-header__refresh-icon {
          display: inline-block;

          font-family:
            Arial,
            sans-serif;

          font-size: 14px;
          font-weight: 400;
          line-height: 1;
        }

        .app-header__refresh-icon--spinning {
          animation: app-header-spin 700ms linear infinite;
        }

        .app-header__plus {
          font-family:
            Arial,
            sans-serif;

          font-size: 14px;
          font-weight: 400;
          line-height: 1;
        }

        @keyframes app-header-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .app-header {
            padding-left: 24px;
            padding-right: 24px;
          }

          .app-header__engine {
            display: none;
          }

          .app-header__divider {
            display: none;
          }
        }

        @media (max-width: 650px) {
          .app-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 18px;

            min-height: auto;

            padding: 21px 18px;
          }

          .app-header__right {
            width: 100%;
          }

          .app-header__button {
            flex: 1;
          }
        }

        @media (max-width: 420px) {
          .app-header__right {
            flex-wrap: wrap;
          }

          .app-header__button {
            flex: 1 1 calc(50% - 5px);
          }
        }
      `}</style>
    </>
  );
}