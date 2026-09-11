import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  FileUp,
  LayoutDashboard,
  List,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./App.css";


/* =========================================================
   API
   ========================================================= */

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";


async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}


async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;

    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}


/* =========================================================
   HELPERS
   ========================================================= */

function formatPercent(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return `${(Number(value) * 100).toFixed(digits)}%`;
}


function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toLocaleString();
}


function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return `₹${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}


function normalizeRisk(risk) {
  if (!risk) return "Low";

  const value = String(risk).toLowerCase();

  if (value === "critical") return "Critical";
  if (value === "high") return "High";
  if (value === "medium") return "Medium";

  return "Low";
}


function riskClass(risk) {
  return normalizeRisk(risk).toLowerCase();
}


function getRiskCounts(rows = []) {
  return [
    {
      name: "Low",
      value: rows.filter((r) => normalizeRisk(r.risk_band) === "Low").length,
    },
    {
      name: "Medium",
      value: rows.filter((r) => normalizeRisk(r.risk_band) === "Medium").length,
    },
    {
      name: "High",
      value: rows.filter((r) => normalizeRisk(r.risk_band) === "High").length,
    },
    {
      name: "Critical",
      value: rows.filter((r) => normalizeRisk(r.risk_band) === "Critical").length,
    },
  ];
}


function calculateProbabilityBuckets(rows = []) {
  const buckets = [
    { label: "0–10%", min: 0, max: 0.1 },
    { label: "10–20%", min: 0.1, max: 0.2 },
    { label: "20–30%", min: 0.2, max: 0.3 },
    { label: "30–40%", min: 0.3, max: 0.4 },
    { label: "40–50%", min: 0.4, max: 0.5 },
    { label: "50–60%", min: 0.5, max: 0.6 },
    { label: "60–70%", min: 0.6, max: 0.7 },
    { label: "70–80%", min: 0.7, max: 0.8 },
    { label: "80–90%", min: 0.8, max: 0.9 },
    { label: "90–100%", min: 0.9, max: 1.01 },
  ];

  return buckets.map((bucket) => ({
    range: bucket.label,
    count: rows.filter((row) => {
      const probability = Number(row.fraud_probability);

      return (
        !Number.isNaN(probability) &&
        probability >= bucket.min &&
        probability < bucket.max
      );
    }).length,
  }));
}


function downloadTextFile(content, filename, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}


function convertRowsToCSV(rows) {
  if (!rows.length) return "";

  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";

    const text = String(value);

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n")
    ) {
      return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
  };

  const header = columns.join(",");

  const body = rows.map((row) =>
    columns.map((column) => escapeCSV(row[column])).join(",")
  );

  return [header, ...body].join("\n");
}


/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [apiOnline, setApiOnline] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [metadata, setMetadata] = useState(null);

  const [threshold, setThreshold] = useState(0.35);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  const [uploadedRows, setUploadedRows] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);


  /* =======================================================
     NAVIGATION
     ======================================================= */

  const navigation = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Analyze Transaction",
      icon: Search,
    },
    {
      name: "Transactions",
      icon: List,
    },
    {
      name: "Users",
      icon: Users,
    },
    {
      name: "Analytics",
      icon: BarChart3,
    },
    {
      name: "Model Performance",
      icon: Brain,
    },
  ];


  /* =======================================================
     LOAD DATA
     ======================================================= */

  async function loadDashboard(currentThreshold = threshold) {
    setLoading(true);
    setError("");

    try {
      const [healthData, transactionData, metadataData] =
        await Promise.all([
          apiGet("/health"),
          apiGet(`/transactions?threshold=${currentThreshold}`),
          apiGet("/metadata"),
        ]);

      setApiOnline(Boolean(healthData));

      setTransactions(transactionData.transactions || []);
      setSummary(transactionData.summary || null);
      setMetadata(metadataData || null);

      if (metadataData?.saved_threshold !== undefined) {
        setThreshold(Number(metadataData.saved_threshold));
      }
    } catch (err) {
      console.error(err);
      setApiOnline(false);
      setError(err.message || "Unable to connect to the fraud API.");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadDashboard();
  }, []);


  /* =======================================================
     APPLY THRESHOLD
     ======================================================= */

  async function handleThresholdChange(value) {
    const newThreshold = Number(value);

    setThreshold(newThreshold);

    try {
      const data = await apiGet(
        `/transactions?threshold=${newThreshold}`
      );

      setTransactions(data.transactions || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to update threshold.");
    }
  }


  /* =======================================================
     REFRESH
     ======================================================= */

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadDashboard(threshold);
    } finally {
      setRefreshing(false);
    }
  }


  /* =======================================================
     TRANSACTION DETAILS
     ======================================================= */

  async function openTransaction(transaction) {
    setSelectedTransaction(transaction);
    setExplanation(null);
    setExplanationLoading(true);

    try {
      const data = await apiGet(
        `/transactions/${transaction.transaction_id}/explanation?threshold=${threshold}`
      );

      setExplanation(data);
    } catch (err) {
      console.error(err);

      setExplanation({
        error:
          err.message ||
          "Unable to load transaction explanation.",
      });
    } finally {
      setExplanationLoading(false);
    }
  }


  function closeTransaction() {
    setSelectedTransaction(null);
    setExplanation(null);
  }


  /* =======================================================
     CSV UPLOAD
     ======================================================= */

  async function handleCSVUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE}/score-csv?threshold=${threshold}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `CSV scoring failed: ${response.status}`
        );
      }

      const data = await response.json();

      setUploadedRows(data.transactions || []);
      setTransactions(data.transactions || []);
      setSummary(data.summary || null);

      setActivePage("Transactions");
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to score CSV.");
    } finally {
      setUploadLoading(false);
      event.target.value = "";
    }
  }


  /* =======================================================
     EXPORT
     ======================================================= */

  async function handleExport() {
    try {
      if (uploadedRows?.length) {
        const csv = convertRowsToCSV(uploadedRows);

        downloadTextFile(
          csv,
          "fraud-risk-scored-transactions.csv"
        );

        return;
      }

      const response = await fetch(
        `${API_BASE}/export.csv?threshold=${threshold}`
      );

      if (!response.ok) {
        throw new Error("Unable to export scored transactions.");
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "fraud-risk-scored-transactions.csv";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Export failed.");
    }
  }


  /* =======================================================
     RISK DATA
     ======================================================= */

  const riskData = useMemo(
    () => getRiskCounts(transactions),
    [transactions]
  );


  const probabilityData = useMemo(
    () => calculateProbabilityBuckets(transactions),
    [transactions]
  );


  /* =======================================================
     NAVIGATION HANDLER
     ======================================================= */

  function navigate(page) {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="app-shell">

      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside
        className={`sidebar ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
      >

        <div className="brand">

          <div className="brand-icon">
            <ShieldCheck size={21} />
          </div>

          <div>
            <div className="brand-title">
              Financial Fraud
            </div>

            <div className="brand-subtitle">
              Risk Engine
            </div>
          </div>

        </div>


        <nav className="navigation">

          <div className="nav-section-label">
            Monitoring
          </div>

          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name
                    ? "active"
                    : ""
                }`}
                onClick={() => navigate(item.name)}
              >
                <Icon size={17} />

                <span>{item.name}</span>
              </button>
            );
          })}


          <div className="nav-section-label">
            System
          </div>

          {navigation.slice(5).map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name
                    ? "active"
                    : ""
                }`}
                onClick={() => navigate(item.name)}
              >
                <Icon size={17} />

                <span>{item.name}</span>
              </button>
            );
          })}

        </nav>


      </aside>


      {/* ===================================================
          MAIN
          =================================================== */}

      <main className="main-content">

        {/* TOP BAR */}

        <header className="topbar">

          <div className="topbar-left">

            <button
              className="menu-button"
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
            >
              <Menu size={20} />
            </button>

            <div className="page-location">
              Risk Intelligence Platform
            </div>

          </div>


          <div className="topbar-right">

            <div className="api-status">

              <span
                className="status-dot"
                style={{
                  background:
                    apiOnline
                      ? "#16a34a"
                      : "#dc2626",
                }}
              />

              {apiOnline
                ? "API Online"
                : "API Offline"}

            </div>


            <button
              className="notification"
              onClick={handleRefresh}
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />
            </button>

          </div>

        </header>


        {/* =================================================
            CONTENT
            ================================================= */}

        <section className="content">

          {error && (
            <div className="alert danger">

              <CircleAlert size={16} />

              <div>
                {error}
              </div>

            </div>
          )}


          {/* ===============================================
              DASHBOARD
              =============================================== */}

          {activePage === "Dashboard" && (
            <DashboardPage
              loading={loading}
              summary={summary}
              transactions={transactions}
              riskData={riskData}
              probabilityData={probabilityData}
              threshold={threshold}
              setThreshold={handleThresholdChange}
              metadata={metadata}
              navigate={navigate}
              openTransaction={openTransaction}
            />
          )}


          {/* ===============================================
              ANALYZE
              =============================================== */}

          {activePage === "Analyze Transaction" && (
            <AnalyzePage
              threshold={threshold}
            />
          )}


          {/* ===============================================
              TRANSACTIONS
              =============================================== */}

          {activePage === "Transactions" && (
            <TransactionsPage
              transactions={transactions}
              threshold={threshold}
              uploadLoading={uploadLoading}
              handleCSVUpload={handleCSVUpload}
              handleExport={handleExport}
              openTransaction={openTransaction}
              summary={summary}
            />
          )}


          {/* ===============================================
              USERS
          =============================================== */}

          {activePage === "Users" && (
            <UsersPage
              transactions={transactions}
              onSelectTransaction={openTransaction}
            />
          )}

          {activePage === "Analytics" && (
            <AnalyticsPage
              transactions={transactions}
              summary={summary}
              riskData={riskData}
              probabilityData={probabilityData}
            />
          )}


          {/* ===============================================
              MODEL PERFORMANCE
              =============================================== */}

          {activePage === "Model Performance" && (
            <ModelPerformancePage
              metadata={metadata}
            />
          )}


        </section>

      </main>


      {/* ===================================================
          TRANSACTION MODAL
          =================================================== */}

      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          explanation={explanation}
          loading={explanationLoading}
          onClose={closeTransaction}
        />
      )}

    </div>
  );
}


/* =========================================================
   PAGE HEADER
   ========================================================= */

function PageHeader({
  eyebrow = "FINANCIAL SECURITY",
  title,
  description,
  badge = "Engine Active",
}) {
  return (
    <div className="page-heading">

      <div>

        <div className="eyebrow">
          {eyebrow}
        </div>

        <h1>
          {title}
        </h1>

        <p className="page-description">
          {description}
        </p>

      </div>


      <div className="live-badge">
        <span className="live-dot"></span>
        {badge}
      </div>

    </div>
  );
}


/* =========================================================
   METRIC CARD
   ========================================================= */

function MetricCard({
  title,
  value,
  note,
  icon,
  danger = false,
  warning = false,
  success = false,
  purple = false,
}) {
  return (
    <div className="metric-card">

      <div className="metric-top">

        <div
          className={`metric-icon ${
            danger ? "danger" : ""
          } ${
            warning ? "warning" : ""
          } ${
            success ? "success" : ""
          } ${
            purple ? "purple" : ""
          }`}
        >
          {icon}
        </div>

      </div>


      <div className="metric-info">

        <div className="metric-label">
          {title}
        </div>

        <div className="metric-value">
          {value}
        </div>

        {note && (
          <div className="metric-note">
            {note}
          </div>
        )}

      </div>

    </div>
  );
}


/* =========================================================
   DASHBOARD PAGE
   ========================================================= */

function DashboardPage({
  loading,
  summary,
  transactions,
  riskData,
  probabilityData,
  threshold,
  setThreshold,
  metadata,
  navigate,
  openTransaction,
}) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Monitor and analyze transaction fraud risk using the deployed machine learning engine."
      />


      {/* SUMMARY */}

      {loading ? (
        <div className="card loading-state">

          <RefreshCw
            size={24}
            className="spin"
          />

          <div>
            Loading fraud-risk data...
          </div>

        </div>
      ) : (
        <>
          <div className="metric-grid">

            <MetricCard
              title="Total Transactions"
              value={formatNumber(
                summary?.total_transactions
              )}
              note="Current scored dataset"
              icon={<List size={20} />}
            />

            <MetricCard
              title="Flagged Transactions"
              value={formatNumber(
                summary?.flagged_transactions
              )}
              note="Transactions above threshold"
              icon={
                <AlertTriangle size={20} />
              }
              danger
            />

            <MetricCard
              title="Flagged Rate"
              value={formatPercent(
                summary?.flagged_rate
              )}
              note="Current review rate"
              icon={
                <ShieldCheck size={20} />
              }
              success
            />

            <MetricCard
              title="P95 Fraud Probability"
              value={formatPercent(
                summary?.p95_fraud_probability
              )}
              note="95th percentile score"
              icon={
                <BarChart3 size={20} />
              }
              purple
            />

          </div>


          {/* SECONDARY METRICS */}

          <div className="secondary-metric-grid">

            <div className="secondary-metric">

              <span>
                Average Probability
              </span>

              <strong>
                {formatPercent(
                  summary?.average_probability
                )}
              </strong>

            </div>


            <div className="secondary-metric">

              <span>
                Maximum Probability
              </span>

              <strong>
                {formatPercent(
                  summary?.max_probability
                )}
              </strong>

            </div>


            <div className="secondary-metric">

              <span>
                True Fraud Rate
              </span>

              <strong>
                {formatPercent(
                  summary?.true_fraud_rate
                )}
              </strong>

            </div>


            <div className="secondary-metric">

              <span>
                Decision Threshold
              </span>

              <strong>
                {formatPercent(threshold)}
              </strong>

            </div>

          </div>


          {/* THRESHOLD */}

          <div className="card threshold-card section">

            <div className="card-header">

              <div>

                <h2>
                  Decision Threshold
                </h2>

                <p>
                  Adjust the probability threshold used to flag transactions for review.
                </p>

              </div>

              <div className="threshold-value">
                {formatPercent(threshold)}
              </div>

            </div>


            <div className="threshold-control">

              <input
                className="threshold-range"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={threshold}
                onChange={(event) =>
                  setThreshold(
                    event.target.value
                  )
                }
              />

              <div className="threshold-scale">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>

              <div className="threshold-caption">
                Lower thresholds increase review volume.
                Higher thresholds reduce the number of flagged transactions.
              </div>

            </div>

          </div>


          {/* CHARTS */}

          <div className="dashboard-grid">

            <RiskDistributionCard
              riskData={riskData}
              total={
                summary?.total_transactions ||
                transactions.length
              }
            />


            <ProbabilityDistributionCard
              probabilityData={probabilityData}
              threshold={threshold}
            />

          </div>


          {/* MODEL QUALITY */}

          <div className="dashboard-grid">

            <ModelQualityCard
              metadata={metadata}
            />


            <EngineOverviewCard />

          </div>


          {/* HIGH RISK QUEUE */}

          <div className="card transactions-card">

            <div className="card-header">

              <div>

                <h2>
                  High-Risk Transaction Queue
                </h2>

                <p>
                  Transactions requiring analyst attention
                </p>

              </div>


              <button
                className="secondary-button"
                onClick={() =>
                  navigate("Transactions")
                }
              >
                View all
                <ChevronRight size={14} />
              </button>

            </div>


            <TransactionTable
              rows={transactions
                .slice()
                .sort(
                  (a, b) =>
                    Number(
                      b.fraud_probability
                    ) -
                    Number(
                      a.fraud_probability
                    )
                )
                .slice(0, 10)}
              onSelect={openTransaction}
            />

          </div>

        </>
      )}
    </>
  );
}


/* =========================================================
   RISK DISTRIBUTION
   ========================================================= */

function RiskDistributionCard({
  riskData,
  total,
}) {
  const chartColors = [
    "#16a34a",
    "#f59e0b",
    "#f97316",
    "#dc2626",
  ];

  return (
    <div className="card chart-card">

      <div className="card-header">

        <div>

          <h2>
            Risk Distribution
          </h2>

          <p>
            Distribution across the current scored dataset
          </p>

        </div>

      </div>


      <div className="risk-chart-layout">

        <div className="risk-donut">

          <ResponsiveContainer
            width="100%"
            height={270}
          >
            <PieChart>

              <Pie
                data={riskData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={105}
                paddingAngle={3}
              >

                {riskData.map(
                  (entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        chartColors[index]
                      }
                    />
                  )
                )}

              </Pie>

              <Tooltip />

            </PieChart>
          </ResponsiveContainer>


          <div className="donut-center">

            <strong>
              {formatNumber(total)}
            </strong>

            <span>
              Total
            </span>

          </div>

        </div>


        <div className="risk-legend">

          {riskData.map(
            (item, index) => (
              <div
                className="legend-row"
                key={item.name}
              >

                <div className="legend-left">

                  <span
                    className={`legend-dot ${item.name.toLowerCase()}`}
                  />

                  <span>
                    {item.name}
                  </span>

                </div>

                <strong className="legend-value">
                  {formatNumber(item.value)}
                </strong>

              </div>
            )
          )}

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   PROBABILITY DISTRIBUTION
   ========================================================= */

function ProbabilityDistributionCard({
  probabilityData,
  threshold,
}) {
  return (
    <div className="card chart-card">

      <div className="card-header">

        <div>

          <h2>
            Fraud Probability
          </h2>

          <p>
            Probability distribution of scored transactions
          </p>

        </div>


        <div className="chart-header-stat">

          <span>
            Threshold
          </span>

          <strong>
            {formatPercent(threshold)}
          </strong>

        </div>

      </div>


      <div className="chart-container">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <BarChart
            data={probabilityData}
            margin={{
              top: 10,
              right: 10,
              left: -15,
              bottom: 5,
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="range"
              tick={{
                fontSize: 10,
              }}
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fontSize: 10,
              }}
            />

            <Tooltip />

            <Bar
              dataKey="count"
              name="Transactions"
              fill="#2563eb"
              radius={[
                5,
                5,
                0,
                0,
              ]}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}


/* =========================================================
   MODEL QUALITY
   ========================================================= */

function ModelQualityCard({ metadata }) {
  return (
    <div className="card">

      <div className="card-header">

        <div>

          <h2>
            Model Quality Snapshot
          </h2>

          <p>
            Evaluation metrics loaded from the deployed fraud engine.
          </p>

        </div>

        <Brain size={21} />

      </div>


      <div className="quality-list">

        <QualityRow
          label="ROC-AUC"
          value={
            metadata?.roc_auc !== undefined
              ? Number(
                  metadata.roc_auc
                ).toFixed(4)
              : "—"
          }
          description="Ranking discrimination"
        />


        <QualityRow
          label="Average Precision / PR-AUC"
          value={
            metadata?.average_precision !== undefined
              ? Number(
                  metadata.average_precision
                ).toFixed(4)
              : "—"
          }
          description="Precision-recall performance"
        />


        <QualityRow
          label="Brier Score"
          value={
            metadata?.brier_score !== undefined
              ? Number(
                  metadata.brier_score
                ).toFixed(4)
              : "—"
          }
          description="Probability calibration"
        />


        <QualityRow
          label="Saved Decision Threshold"
          value={
            metadata?.saved_threshold !== undefined
              ? Number(
                  metadata.saved_threshold
                ).toFixed(2)
              : "—"
          }
          description="Configured review threshold"
        />

      </div>

    </div>
  );
}


/* =========================================================
   QUALITY ROW
   ========================================================= */

function QualityRow({
  label,
  value,
  description,
}) {
  return (
    <div className="quality-row">

      <div>

        <div className="quality-label">
          {label}
        </div>

        <div className="quality-description">
          {description}
        </div>

      </div>

      <strong className="quality-value">
        {value}
      </strong>

    </div>
  );
}


/* =========================================================
   ENGINE OVERVIEW
   ========================================================= */

function EngineOverviewCard() {
  return (
    <div className="card engine-card">

      <div className="engine-icon">
        <ShieldCheck size={25} />
      </div>

      <h2>
        Fraud Risk Engine
      </h2>

      <p>
        The application uses the trained fraud detection
        pipeline to generate transaction probabilities,
        review flags, risk bands and analyst-oriented
        reason codes.
      </p>


      <div className="engine-features">

        <span>
          Machine Learning
        </span>

        <span>
          Risk Scoring
        </span>

        <span>
          SHAP Explainability
        </span>

        <span>
          Reason Codes
        </span>

      </div>

    </div>
  );
}


/* =========================================================
   ANALYZE PAGE
   ========================================================= */

function AnalyzePage({ threshold }) {
  const [form, setForm] = useState({
    amount: "125.47",
    hour: "2",
    device_risk_score: "0.789",
    ip_risk_score: "0.4796",
    transaction_type: "transfer",
    merchant_category: "crypto",
    country: "CN",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }


  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        amount: Number(form.amount),
        hour: Number(form.hour),
        device_risk_score: Number(
          form.device_risk_score
        ),
        ip_risk_score: Number(
          form.ip_risk_score
        ),
        transaction_type:
          form.transaction_type,
        merchant_category:
          form.merchant_category,
        country: form.country,
      };

      const data = await apiPost(
        `/predict?threshold=${threshold}`,
        payload
      );

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to analyze transaction."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <>
      <PageHeader
        title="Analyze Transaction"
        description="Submit transaction features directly to the fraud prediction API."
      />


      <div className="card form-card">

        <div className="form-card-header">

          <div>

            <h2>
              Analyze a Transaction
            </h2>

            <p>
              Enter the transaction features used by the deployed model.
            </p>

          </div>


          <div className="threshold-badge">
            Threshold{" "}
            <strong>
              {formatPercent(threshold)}
            </strong>
          </div>

        </div>


        <div className="form-grid">

          <FormField
            label="Transaction Amount"
            value={form.amount}
            onChange={(value) =>
              updateField(
                "amount",
                value
              )
            }
            type="number"
            step="0.01"
          />


          <FormField
            label="Transaction Hour"
            value={form.hour}
            onChange={(value) =>
              updateField(
                "hour",
                value
              )
            }
            type="number"
            min="0"
            max="23"
          />


          <FormField
            label="Device Risk Score"
            value={
              form.device_risk_score
            }
            onChange={(value) =>
              updateField(
                "device_risk_score",
                value
              )
            }
            type="number"
            step="0.001"
          />


          <FormField
            label="IP Risk Score"
            value={
              form.ip_risk_score
            }
            onChange={(value) =>
              updateField(
                "ip_risk_score",
                value
              )
            }
            type="number"
            step="0.0001"
          />


          <FormSelect
            label="Transaction Type"
            value={
              form.transaction_type
            }
            onChange={(value) =>
              updateField(
                "transaction_type",
                value
              )
            }
            options={[
              "purchase",
              "transfer",
              "payment",
              "withdrawal",
              "wire",
            ]}
          />


          <FormSelect
            label="Merchant Category"
            value={
              form.merchant_category
            }
            onChange={(value) =>
              updateField(
                "merchant_category",
                value
              )
            }
            options={[
              "grocery",
              "groceries",
              "electronics",
              "crypto",
              "luxury",
              "travel",
              "utilities",
            ]}
          />


          <FormSelect
            label="Country"
            value={form.country}
            onChange={(value) =>
              updateField(
                "country",
                value
              )
            }
            options={[
              "IN",
              "US",
              "USA",
              "UK",
              "CN",
              "RU",
            ]}
          />

        </div>


        {error && (
          <div className="alert danger mt-15">
            <CircleAlert size={15} />
            {error}
          </div>
        )}


        <div className="form-actions">

          <button
            className="primary-button"
            onClick={analyze}
            disabled={loading}
          >

            {loading ? (
              <>
                <RefreshCw
                  size={15}
                  className="spin"
                />
                Analyzing...
              </>
            ) : (
              <>
                <Search size={15} />
                Analyze Transaction
              </>
            )}

          </button>

        </div>

      </div>


      {result && (
        <PredictionResult
          result={result}
        />
      )}

    </>
  );
}


/* =========================================================
   FORM FIELD
   ========================================================= */

function FormField({
  label,
  value,
  onChange,
  type = "text",
  ...props
}) {
  return (
    <div className="form-group">

      <label className="form-label">
        {label}
      </label>

      <input
        className="form-input"
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        {...props}
      />

    </div>
  );
}


/* =========================================================
   FORM SELECT
   ========================================================= */

function FormSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div className="form-group">

      <label className="form-label">
        {label}
      </label>

      <select
        className="form-select"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

    </div>
  );
}


/* =========================================================
   PREDICTION RESULT
   ========================================================= */

function PredictionResult({ result }) {
  const probability =
    Number(
      result.fraud_probability
    );

  const risk =
    normalizeRisk(
      result.risk_band
    );


  return (
    <div className="card prediction-result">

      <div className="card-header">

        <div>

          <h2>
            Prediction Result
          </h2>

          <p>
            Fraud risk generated by the deployed model.
          </p>

        </div>


        <span
          className={`risk-pill ${riskClass(
            risk
          )}`}
        >
          {risk}
        </span>

      </div>


      <div className="prediction-main">

        <div className="prediction-score-block">

          <div className="prediction-score">
            {formatPercent(
              probability
            )}
          </div>

          <div className="prediction-score-label">
            Fraud probability
          </div>

        </div>


        <div className="prediction-status">

          {Number(
            result.fraud_flag
          ) === 1 ? (
            <span className="status-pill flagged">
              <AlertTriangle size={13} />
              FLAGGED
            </span>
          ) : (
            <span className="status-pill clear">
              <CheckCircle2 size={13} />
              CLEAR
            </span>
          )}

        </div>

      </div>


      {result.reason_codes?.length > 0 && (
        <div className="prediction-reasons">

          <h3>
            Analyst Reason Codes
          </h3>

          <ReasonList
            reasons={
              result.reason_codes
            }
          />

        </div>
      )}

    </div>
  );
}


/* =========================================================
   TRANSACTIONS PAGE
   ========================================================= */

function TransactionsPage({
  transactions,
  threshold,
  uploadLoading,
  handleCSVUpload,
  handleExport,
  openTransaction,
  summary,
}) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] =
    useState("All");
  const [statusFilter, setStatusFilter] =
    useState("All");
  const [topN, setTopN] = useState(20);
  const [page, setPage] = useState(1);

  const pageSize = 20;


  const filteredRows = useMemo(() => {
    let rows = [...transactions];

    if (search.trim()) {
      const query =
        search.toLowerCase();

      rows = rows.filter((row) =>
        [
          row.transaction_id,
          row.user_id,
          row.country,
          row.transaction_type,
          row.merchant_category,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }


    if (riskFilter !== "All") {
      rows = rows.filter(
        (row) =>
          normalizeRisk(
            row.risk_band
          ) === riskFilter
      );
    }


    if (statusFilter !== "All") {
      rows = rows.filter((row) => {
        const isFlagged =
          Number(
            row.fraud_flag
          ) === 1;

        return statusFilter ===
          "Flagged"
          ? isFlagged
          : !isFlagged;
      });
    }


    rows.sort(
      (a, b) =>
        Number(
          b.fraud_probability
        ) -
        Number(
          a.fraud_probability
        )
    );

    return rows.slice(0, topN);
  }, [
    transactions,
    search,
    riskFilter,
    statusFilter,
    topN,
  ]);


  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRows.length /
        pageSize
    )
  );


  const currentPage = Math.min(
    page,
    totalPages
  );


  const visibleRows =
    filteredRows.slice(
      (currentPage - 1) *
        pageSize,
      currentPage * pageSize
    );


  function changeFilter(
    callback
  ) {
    callback();
    setPage(1);
  }


  return (
    <>
      <PageHeader
        title="Transactions"
        description="Review scored transactions, risk bands, model probabilities and analyst reason codes."
      />


      {/* SUMMARY */}

      <div className="metric-grid">

        <MetricCard
          title="Total Transactions"
          value={formatNumber(
            summary?.total_transactions ??
              transactions.length
          )}
          note="Current dataset"
          icon={<List size={20} />}
        />


        <MetricCard
          title="Flagged Transactions"
          value={formatNumber(
            summary?.flagged_transactions
          )}
          note={`Threshold ${formatPercent(
            threshold
          )}`}
          icon={
            <AlertTriangle size={20} />
          }
          danger
        />


        <MetricCard
          title="Flagged Rate"
          value={formatPercent(
            summary?.flagged_rate
          )}
          note="Review volume"
          icon={
            <ShieldCheck size={20} />
          }
          warning
        />


        <MetricCard
          title="P95 Probability"
          value={formatPercent(
            summary?.p95_fraud_probability
          )}
          note="High-risk tail"
          icon={
            <BarChart3 size={20} />
          }
          purple
        />

      </div>


      {/* UPLOAD */}

      <div className="upload-card section">

        <div className="upload-area">

          <div className="upload-icon">
            <Upload size={22} />
          </div>

          <div className="upload-title">
            Score a CSV Dataset
          </div>

          <div className="upload-description">
            Upload a transaction CSV and score the entire dataset using the deployed model.
          </div>


          <div className="upload-actions">

            <label className="secondary-button">

              <FileUp size={15} />

              {uploadLoading
                ? "Scoring..."
                : "Upload CSV"}

              <input
                className="upload-input"
                type="file"
                accept=".csv"
                onChange={
                  handleCSVUpload
                }
                disabled={
                  uploadLoading
                }
              />

            </label>


            <button
              className="secondary-button"
              onClick={handleExport}
            >
              <Download size={15} />
              Export CSV
            </button>

          </div>

        </div>

      </div>


      {/* TABLE */}

      <div className="card transactions-card">

        <div className="transactions-toolbar">

          <div className="toolbar-left">

            <div className="search-box">

              <Search size={16} />

              <input
                type="text"
                placeholder="Search transaction, user, country..."
                value={search}
                onChange={(event) =>
                  changeFilter(
                    () =>
                      setSearch(
                        event.target.value
                      )
                  )
                }
              />

            </div>

          </div>


          <div className="toolbar-right">

            <select
              className="filter-select"
              value={riskFilter}
              onChange={(event) =>
                changeFilter(
                  () =>
                    setRiskFilter(
                      event.target.value
                    )
                )
              }
            >
              <option value="All">
                All Risk Bands
              </option>

              <option value="Low">
                Low
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="High">
                High
              </option>

              <option value="Critical">
                Critical
              </option>

            </select>


            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) =>
                changeFilter(
                  () =>
                    setStatusFilter(
                      event.target.value
                    )
                )
              }
            >

              <option value="All">
                All Status
              </option>

              <option value="Flagged">
                Flagged
              </option>

              <option value="Clear">
                Clear
              </option>

            </select>


            <select
              className="filter-select"
              value={topN}
              onChange={(event) =>
                changeFilter(
                  () =>
                    setTopN(
                      Number(
                        event.target.value
                      )
                    )
                )
              }
            >

              <option value={20}>
                Top 20
              </option>

              <option value={50}>
                Top 50
              </option>

              <option value={100}>
                Top 100
              </option>

              <option value={500}>
                Top 500
              </option>

              <option value={1000}>
                Top 1000
              </option>

            </select>

          </div>

        </div>


        <TransactionTable
          rows={visibleRows}
          onSelect={openTransaction}
        />


        <div className="pagination">

          <div className="pagination-info">

            Showing{" "}
            {visibleRows.length} of{" "}
            {filteredRows.length}{" "}
            transactions

          </div>


          <div className="pagination-controls">

            <button
              className="pagination-button"
              disabled={currentPage <= 1}
              onClick={() =>
                setPage(
                  Math.max(
                    1,
                    currentPage - 1
                  )
                )
              }
            >
              <ChevronLeft size={14} />
            </button>


            {Array.from(
              {
                length: Math.min(
                  totalPages,
                  5
                ),
              },
              (_, index) => {
                const pageNumber =
                  index + 1;

                return (
                  <button
                    key={pageNumber}
                    className={`pagination-button ${
                      pageNumber ===
                      currentPage
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setPage(
                        pageNumber
                      )
                    }
                  >
                    {pageNumber}
                  </button>
                );
              }
            )}


            <button
              className="pagination-button"
              disabled={
                currentPage >=
                totalPages
              }
              onClick={() =>
                setPage(
                  Math.min(
                    totalPages,
                    currentPage + 1
                  )
                )
              }
            >
              <ChevronRight size={14} />
            </button>

          </div>

        </div>

      </div>

    </>
  );
}


/* =========================================================
   TRANSACTION TABLE
   ========================================================= */

function TransactionTable({
  rows,
  onSelect,
}) {
  if (!rows?.length) {
    return (
      <div className="empty-state">

        <List size={25} />

        <h3>
          No transactions found
        </h3>

        <p>
          Try changing your filters or search criteria.
        </p>

      </div>
    );
  }


  return (
    <div className="table-wrapper">

      <table>

        <thead>

          <tr>
            <th>Transaction</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Merchant</th>
            <th>Country</th>
            <th>Probability</th>
            <th>Risk</th>
            <th>Status</th>
          </tr>

        </thead>


        <tbody>

          {rows.map((transaction) => {

            const risk =
              normalizeRisk(
                transaction.risk_band
              );

            const flagged =
              Number(
                transaction.fraud_flag
              ) === 1;


            return (
              <tr
                key={
                  transaction.transaction_id
                }
                onClick={() =>
                  onSelect?.(
                    transaction
                  )
                }
                className="clickable-row"
              >

                <td>

                  <span className="transaction-id">
                    #
                    {
                      transaction.transaction_id
                    }
                  </span>

                </td>


                <td className="amount">

                  {formatMoney(
                    transaction.amount
                  )}

                </td>


                <td>
                  {
                    transaction.transaction_type ||
                    "—"
                  }
                </td>


                <td>
                  {
                    transaction.merchant_category ||
                    "—"
                  }
                </td>


                <td>
                  {
                    transaction.country ||
                    "—"
                  }
                </td>


                <td className="probability">

                  {formatPercent(
                    transaction.fraud_probability
                  )}

                </td>


                <td>

                  <span
                    className={`risk-pill ${riskClass(
                      risk
                    )}`}
                  >
                    {risk}
                  </span>

                </td>


                <td>

                  {flagged ? (
                    <span className="status-pill flagged">

                      <AlertTriangle
                        size={12}
                      />

                      FLAGGED

                    </span>
                  ) : (
                    <span className="status-pill clear">

                      <CheckCircle2
                        size={12}
                      />

                      CLEAR

                    </span>
                  )}

                </td>

              </tr>
            );
          })}

        </tbody>

      </table>

    </div>
  );
}


/* =========================================================
   ANALYTICS PAGE
   ========================================================= */

function UsersPage({
  transactions,
  onSelectTransaction,
}) {
  const [selectedUserId, setSelectedUserId] = useState("");

  const users = useMemo(() => {
    const grouped = new Map();

    transactions.forEach((row) => {
      const userId = String(row.user_id ?? "").trim();
      if (!userId) return;

      if (!grouped.has(userId)) {
        grouped.set(userId, []);
      }

      grouped.get(userId).push(row);
    });

    return Array.from(grouped.entries())
      .map(([userId, rows]) => {
        const probabilities = rows.map((row) =>
          Number(row.fraud_probability || 0)
        );

        const flagged = rows.filter(
          (row) => Number(row.fraud_flag) === 1
        ).length;

        const highest = probabilities.length
          ? Math.max(...probabilities)
          : 0;

        const average = probabilities.length
          ? probabilities.reduce((a, b) => a + b, 0) /
            probabilities.length
          : 0;

        const critical = rows.filter(
          (row) => normalizeRisk(row.risk_band) === "Critical"
        ).length;

        return {
          userId,
          rows,
          transactions: rows.length,
          flagged,
          flaggedRate: rows.length ? flagged / rows.length : 0,
          average,
          highest,
          critical,
        };
      })
      .sort((a, b) => b.highest - a.highest);
  }, [transactions]);

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId) || null,
    [users, selectedUserId]
  );

  const selectedRows = selectedUser?.rows || [];

  const riskCounts = useMemo(() => {
    return ["Low", "Medium", "High", "Critical"].map((risk) => ({
      risk,
      count: selectedRows.filter(
        (row) => normalizeRisk(row.risk_band) === risk
      ).length,
    }));
  }, [selectedRows]);

  const recentRows = useMemo(() => {
    return [...selectedRows]
      .sort(
        (a, b) =>
          Number(b.fraud_probability || 0) -
          Number(a.fraud_probability || 0)
      )
      .slice(0, 10);
  }, [selectedRows]);

  return (
    <>
      <PageHeader
        title="User Risk"
        description="Review transaction behavior and fraud-risk exposure at the individual user level."
      />

      <div className="user-selector-card card">
        <div>
          <div className="form-label">Select User</div>
          <p className="user-selector-help">
            Choose a user to review their transaction history and risk profile.
          </p>
        </div>

        <select
          className="form-select user-selector"
          value={selectedUserId}
          onChange={(event) => setSelectedUserId(event.target.value)}
          disabled={!users.length}
        >
          <option value="">Select a user</option>
          {users.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.userId} — {user.transactions} transactions
            </option>
          ))}
        </select>
      </div>

      {!selectedUser ? (
        <div className="card empty-state user-empty-state">
          <Users size={30} />
          <h3>Select a user to view their risk profile</h3>
          <p>
            The profile is calculated directly from the currently scored transaction dataset.
          </p>
        </div>
      ) : (
        <>
          <div className="user-profile-header card">
            <div>
              <div className="eyebrow">USER RISK PROFILE</div>
              <h2>{selectedUser.userId}</h2>
              <p>
                Individual transaction-level fraud exposure from the current scored dataset.
              </p>
            </div>

            <span className="risk-pill critical">
              Highest Risk {formatPercent(selectedUser.highest)}
            </span>
          </div>

          <div className="metric-grid user-metric-grid">
            <MetricCard
              title="Transactions"
              value={formatNumber(selectedUser.transactions)}
              icon={<List size={19} />}
            />

            <MetricCard
              title="Flagged Transactions"
              value={formatNumber(selectedUser.flagged)}
              icon={<AlertTriangle size={19} />}
              danger
            />

            <MetricCard
              title="Flagged Rate"
              value={formatPercent(selectedUser.flaggedRate)}
              icon={<ShieldCheck size={19} />}
              purple
            />

            <MetricCard
              title="Average Probability"
              value={formatPercent(selectedUser.average)}
              icon={<BarChart3 size={19} />}
              success
            />
          </div>

          <div className="dashboard-grid user-profile-grid">
            <div className="card">
              <div className="card-header">
                <div>
                  <h2>Risk Band Distribution</h2>
                  <p>Transactions grouped by model risk classification.</p>
                </div>
              </div>

              <div className="user-risk-list">
                {riskCounts.map((item) => (
                  <div className="user-risk-row" key={item.risk}>
                    <div className="legend-left">
                      <span className={`legend-dot ${item.risk.toLowerCase()}`} />
                      <span>{item.risk}</span>
                    </div>

                    <div className="user-risk-bar-track">
                      <div
                        className={`user-risk-bar ${item.risk.toLowerCase()}`}
                        style={{
                          width: selectedUser.transactions
                            ? `${(item.count / selectedUser.transactions) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>

                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h2>User Risk Summary</h2>
                  <p>Key signals from this user's scored transactions.</p>
                </div>
              </div>

              <div className="user-summary-list">
                <div className="user-summary-row">
                  <span>Highest probability</span>
                  <strong>{formatPercent(selectedUser.highest)}</strong>
                </div>

                <div className="user-summary-row">
                  <span>Average probability</span>
                  <strong>{formatPercent(selectedUser.average)}</strong>
                </div>

                <div className="user-summary-row">
                  <span>Critical transactions</span>
                  <strong>{selectedUser.critical}</strong>
                </div>

                <div className="user-summary-row">
                  <span>Flagged transactions</span>
                  <strong>{selectedUser.flagged}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="card transactions-card user-transactions-card">
            <div className="card-header">
              <div>
                <h2>User Transactions</h2>
                <p>Highest-risk transactions for {selectedUser.userId}.</p>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Merchant</th>
                    <th>Country</th>
                    <th>Probability</th>
                    <th>Risk</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentRows.map((row) => {
                    const risk = normalizeRisk(row.risk_band);
                    const flagged = Number(row.fraud_flag) === 1;

                    return (
                      <tr
                        key={row.transaction_id}
                        className="clickable-row"
                        onClick={() => onSelectTransaction(row)}
                      >
                        <td className="transaction-id">
                          #{row.transaction_id}
                        </td>
                        <td className="amount">
                          {formatMoney(row.amount)}
                        </td>
                        <td>{row.transaction_type || "—"}</td>
                        <td>{row.merchant_category || "—"}</td>
                        <td>{row.country || "—"}</td>
                        <td className="probability">
                          {formatPercent(row.fraud_probability)}
                        </td>
                        <td>
                          <span className={`risk-pill ${riskClass(risk)}`}>
                            {risk}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              flagged ? "flagged" : "clear"
                            }`}
                          >
                            {flagged ? "⚠ FLAGGED" : "✓ CLEAR"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}


function AnalyticsPage({
  transactions,
  summary,
  riskData,
  probabilityData,
}) {
  const averageByRisk = useMemo(() => {
    return ["Low", "Medium", "High", "Critical"].map(
      (risk) => {

        const rows =
          transactions.filter(
            (row) =>
              normalizeRisk(
                row.risk_band
              ) === risk
          );

        const average =
          rows.length
            ? rows.reduce(
                (total, row) =>
                  total +
                  Number(
                    row.fraud_probability ||
                      0
                  ),
                0
              ) / rows.length
            : 0;

        return {
          risk,
          probability:
            average * 100,
        };
      }
    );
  }, [transactions]);


  return (
    <>
      <PageHeader
        title="Analytics"
        description="Explore fraud-risk distributions, probability patterns and transaction-level model behavior."
      />


      <div className="analytics-summary">

        <MetricCard
          title="Transactions"
          value={formatNumber(
            summary?.total_transactions
          )}
          icon={<List size={19} />}
        />

        <MetricCard
          title="Average Probability"
          value={formatPercent(
            summary?.average_probability
          )}
          icon={
            <BarChart3 size={19} />
          }
          purple
        />

        <MetricCard
          title="Maximum Probability"
          value={formatPercent(
            summary?.max_probability
          )}
          icon={
            <Zap size={19} />
          }
          danger
        />

        <MetricCard
          title="True Fraud Rate"
          value={formatPercent(
            summary?.true_fraud_rate
          )}
          icon={
            <ShieldCheck size={19} />
          }
          success
        />

      </div>


      <div className="analytics-grid">

        <div className="card">

          <div className="card-header">

            <div>

              <h2>
                Risk Band Distribution
              </h2>

              <p>
                Number of transactions in each risk band
              </p>

            </div>

          </div>


          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={riskData}
                margin={{
                  top: 10,
                  right: 15,
                  left: 0,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 10,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 10,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  name="Transactions"
                  fill="#2563eb"
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        <div className="card">

          <div className="card-header">

            <div>

              <h2>
                Probability Distribution
              </h2>

              <p>
                Fraud probability buckets across the scored dataset
              </p>

            </div>

          </div>


          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={probabilityData}
                margin={{
                  top: 10,
                  right: 15,
                  left: 0,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="range"
                  tick={{
                    fontSize: 9,
                  }}
                  interval={0}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 10,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  name="Transactions"
                  fill="#7c3aed"
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        <div className="card">

          <div className="card-header">

            <div>

              <h2>
                Average Probability by Risk Band
              </h2>

              <p>
                Average model score within each risk classification
              </p>

            </div>

          </div>


          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={averageByRisk}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="risk"
                  tick={{
                    fontSize: 10,
                  }}
                />

                <YAxis
                  unit="%"
                  tick={{
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  formatter={(value) =>
                    `${Number(
                      value
                    ).toFixed(2)}%`
                  }
                />

                <Bar
                  dataKey="probability"
                  name="Average probability"
                  fill="#2563eb"
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        <div className="card analytics-insight-card">

          <div className="card-header">

            <div>

              <h2>
                Risk Interpretation
              </h2>

              <p>
                How the current scoring output should be interpreted
              </p>

            </div>

          </div>


          <div className="risk-interpretation">

            <InterpretationRow
              risk="Low"
              text="Transactions with lower model probability and limited rule-based risk signals."
            />

            <InterpretationRow
              risk="Medium"
              text="Transactions with moderate probability that may require additional context."
            />

            <InterpretationRow
              risk="High"
              text="Transactions with elevated probability and stronger fraud-risk indicators."
            />

            <InterpretationRow
              risk="Critical"
              text="Transactions with very high model probability requiring priority review."
            />

          </div>

        </div>

      </div>

    </>
  );
}


/* =========================================================
   INTERPRETATION
   ========================================================= */

function InterpretationRow({
  risk,
  text,
}) {
  return (
    <div className="interpretation-row">

      <span
        className={`risk-pill ${riskClass(
          risk
        )}`}
      >
        {risk}
      </span>

      <p>
        {text}
      </p>

    </div>
  );
}


/* =========================================================
   MODEL PERFORMANCE PAGE
   ========================================================= */

function ModelPerformancePage({
  metadata,
}) {
  return (
    <>
      <PageHeader
        title="Model Performance"
        description="Review the evaluation metrics and configuration of the deployed fraud detection engine."
      />


      <div className="performance-grid">

        <PerformanceCard
          label="ROC-AUC"
          value={
            metadata?.roc_auc !== undefined
              ? Number(
                  metadata.roc_auc
                ).toFixed(4)
              : "—"
          }
          description="Ranking discrimination"
        />


        <PerformanceCard
          label="PR-AUC"
          value={
            metadata?.average_precision !== undefined
              ? Number(
                  metadata.average_precision
                ).toFixed(4)
              : "—"
          }
          description="Average precision"
        />


        <PerformanceCard
          label="Brier Score"
          value={
            metadata?.brier_score !== undefined
              ? Number(
                  metadata.brier_score
                ).toFixed(4)
              : "—"
          }
          description="Probability calibration"
        />


        <PerformanceCard
          label="Saved Threshold"
          value={
            metadata?.saved_threshold !== undefined
              ? Number(
                  metadata.saved_threshold
                ).toFixed(2)
              : "—"
          }
          description="Configured review threshold"
        />

      </div>


      <div className="dashboard-grid performance-details">

        <div className="card">

          <div className="card-header">

            <div>

              <h2>
                Evaluation Metrics
              </h2>

              <p>
                Metrics reported by the trained fraud detection pipeline.
              </p>

            </div>

            <Brain size={21} />

          </div>


          <div className="performance-list">

            <PerformanceRow
              label="ROC-AUC"
              value={
                metadata?.roc_auc !== undefined
                  ? Number(
                      metadata.roc_auc
                    ).toFixed(4)
                  : "—"
              }
            />

            <PerformanceRow
              label="Average Precision / PR-AUC"
              value={
                metadata?.average_precision !== undefined
                  ? Number(
                      metadata.average_precision
                    ).toFixed(4)
                  : "—"
              }
            />

            <PerformanceRow
              label="Brier Score"
              value={
                metadata?.brier_score !== undefined
                  ? Number(
                      metadata.brier_score
                    ).toFixed(4)
                  : "—"
              }
            />

            <PerformanceRow
              label="Decision Threshold"
              value={
                metadata?.saved_threshold !== undefined
                  ? Number(
                      metadata.saved_threshold
                    ).toFixed(2)
                  : "—"
              }
            />

          </div>

        </div>


        <div className="card">

          <div className="card-header">

            <div>

              <h2>
                What These Metrics Mean
              </h2>

              <p>
                Practical interpretation for fraud-risk analysis.
              </p>

            </div>

          </div>


          <div className="metric-explanation-list">

            <ExplanationBlock
              title="ROC-AUC"
              text="Measures how well the model ranks fraudulent transactions above non-fraudulent transactions."
            />

            <ExplanationBlock
              title="PR-AUC"
              text="Focuses on precision and recall and is useful when fraudulent transactions are less common."
            />

            <ExplanationBlock
              title="Brier Score"
              text="Measures the quality of predicted probabilities, where lower values indicate better calibration."
            />

            <ExplanationBlock
              title="Decision Threshold"
              text="Controls the probability level at which a transaction is flagged for review."
            />

          </div>

        </div>

      </div>

    </>
  );
}


/* =========================================================
   PERFORMANCE CARD
   ========================================================= */

function PerformanceCard({
  label,
  value,
  description,
}) {
  return (
    <div className="performance-card">

      <div className="performance-label">
        {label}
      </div>

      <div className="performance-value">
        {value}
      </div>

      <div className="performance-description">
        {description}
      </div>

    </div>
  );
}


/* =========================================================
   PERFORMANCE ROW
   ========================================================= */

function PerformanceRow({
  label,
  value,
}) {
  return (
    <div className="performance-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* =========================================================
   EXPLANATION BLOCK
   ========================================================= */

function ExplanationBlock({
  title,
  text,
}) {
  return (
    <div className="explanation-block">

      <div className="explanation-block-title">
        {title}
      </div>

      <div className="explanation-block-text">
        {text}
      </div>

    </div>
  );
}


/* =========================================================
   TRANSACTION MODAL
   ========================================================= */

function TransactionModal({
  transaction,
  explanation,
  loading,
  onClose,
}) {
  const probability =
    Number(
      transaction.fraud_probability
    );

  const risk =
    normalizeRisk(
      transaction.risk_band
    );


  const shapValues =
    explanation?.shap_values || [];


  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="modal">

        <div className="modal-header">

          <div>

            <div className="modal-title">
              Transaction #
              {
                transaction.transaction_id
              }
            </div>

            <div className="modal-subtitle">
              Fraud-risk explanation
            </div>

          </div>


          <button
            className="modal-close"
            onClick={onClose}
          >
            <X size={17} />
          </button>

        </div>


        <div className="modal-body">

          {/* SUMMARY */}

          <div className="detail-summary">

            <div>

              <div className="detail-summary-label">
                Fraud Probability
              </div>

              <div className="detail-summary-value">
                {formatPercent(
                  probability
                )}
              </div>

            </div>


            <span
              className={`risk-pill ${riskClass(
                risk
              )}`}
            >
              {risk}
            </span>

          </div>


          {/* DETAILS */}

          <div className="detail-grid">

            <DetailItem
              label="Transaction ID"
              value={
                transaction.transaction_id
              }
            />

            <DetailItem
              label="User ID"
              value={
                transaction.user_id
              }
            />

            <DetailItem
              label="Amount"
              value={formatMoney(
                transaction.amount
              )}
            />

            <DetailItem
              label="Hour"
              value={transaction.hour}
            />

            <DetailItem
              label="Device Risk"
              value={
                transaction.device_risk_score
              }
            />

            <DetailItem
              label="IP Risk"
              value={
                transaction.ip_risk_score
              }
            />

            <DetailItem
              label="Transaction Type"
              value={
                transaction.transaction_type
              }
            />

            <DetailItem
              label="Merchant Category"
              value={
                transaction.merchant_category
              }
            />

            <DetailItem
              label="Country"
              value={
                transaction.country
              }
            />

            <DetailItem
              label="Fraud Flag"
              value={
                Number(
                  transaction.fraud_flag
                ) === 1
                  ? "Flagged"
                  : "Clear"
              }
            />

          </div>


          {/* REASONS */}

          <div className="modal-section">

            <div className="section-heading">

              <div>

                <h3>
                  Analyst Reason Codes
                </h3>

                <p>
                  Rule-based risk drivers identified for this transaction.
                </p>

              </div>

            </div>


            <ReasonList
              reasons={
                transaction.reason_codes ||
                []
              }
            />

          </div>


          {/* SHAP */}

          <div className="modal-section">

            <div className="section-heading">

              <div>

                <h3>
                  SHAP Feature Contributions
                </h3>

                <p>
                  Model-level feature contributions for this transaction.
                </p>

              </div>

            </div>


            {loading ? (
              <div className="loading-state compact">

                <RefreshCw
                  size={20}
                  className="spin"
                />

                Loading SHAP explanation...

              </div>
            ) : explanation?.error ? (
              <div className="alert danger">
                <CircleAlert size={15} />
                {explanation.error}
              </div>
            ) : shapValues.length ? (
              <SHAPChart
                values={shapValues}
              />
            ) : (
              <div className="empty-state compact">
                <Brain size={22} />
                <p>
                  No SHAP explanation available.
                </p>
              </div>
            )}

          </div>


          {/* SHAP REASONS */}

          {explanation?.shap_reason_codes
            ?.length > 0 && (
            <div className="modal-section">

              <div className="section-heading">

                <div>

                  <h3>
                    SHAP-Based Reason Codes
                  </h3>

                  <p>
                    Direction-aware explanations from the model.
                  </p>

                </div>

              </div>


              <ReasonList
                reasons={
                  explanation.shap_reason_codes
                }
              />

            </div>
          )}

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   DETAIL ITEM
   ========================================================= */

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="detail-item">

      <div className="detail-label">
        {label}
      </div>

      <div className="detail-value">
        {value ?? "—"}
      </div>

    </div>
  );
}


/* =========================================================
   REASON LIST
   ========================================================= */

function ReasonList({ reasons }) {
  if (!reasons?.length) {
    return (
      <div className="empty-reason">
        No strong risk drivers identified.
      </div>
    );
  }


  return (
    <div className="reason-list">

      {reasons.map(
        (reason, index) => (
          <div
            className="reason-item"
            key={`${reason}-${index}`}
          >

            <CircleAlert size={14} />

            <span>
              {reason}
            </span>

          </div>
        )
      )}

    </div>
  );
}


/* =========================================================
   SHAP CHART
   ========================================================= */

function SHAPChart({ values }) {
  const data = values
    .map((item) => ({
      feature:
        item.feature ||
        item.name ||
        "Feature",

      value: Number(
        item.shap_value ??
          item.value ??
          0
      ),
    }))
    .sort(
      (a, b) =>
        Math.abs(b.value) -
        Math.abs(a.value)
    )
    .slice(0, 10)
    .reverse();


  return (
    <div className="shap-chart">

      <ResponsiveContainer
        width="100%"
        height={360}
      >

        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5,
            right: 20,
            left: 20,
            bottom: 5,
          }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
          />

          <XAxis
            type="number"
            tick={{
              fontSize: 10,
            }}
          />

          <YAxis
            type="category"
            dataKey="feature"
            width={145}
            tick={{
              fontSize: 10,
            }}
          />

          <Tooltip
            formatter={(value) =>
              Number(value).toFixed(4)
            }
          />

          <Bar
            dataKey="value"
            name="SHAP value"
            radius={4}
          >

            {data.map(
              (entry, index) => (
                <Cell
                  key={`shap-${index}`}
                  fill={
                    entry.value >= 0
                      ? "#dc2626"
                      : "#16a34a"
                  }
                />
              )
            )}

          </Bar>

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
}


/* =========================================================
   MISC HELPERS
   ========================================================= */



export default App;
