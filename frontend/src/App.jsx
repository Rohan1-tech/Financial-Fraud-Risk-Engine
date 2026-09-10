import { useState } from 'react'
import {
  ShieldCheck,
  LayoutDashboard,
  Search,
  List,
  BarChart3,
  Brain,
  Activity,
  Bell,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Menu,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import './App.css'

const riskData = [
  { name: 'Low Risk', value: 623 },
  { name: 'Medium Risk', value: 205 },
  { name: 'High Risk', value: 121 },
  { name: 'Critical', value: 51 },
]

const activityData = [
  { day: 'Sep 1', normal: 105, fraud: 12 },
  { day: 'Sep 2', normal: 165, fraud: 28 },
  { day: 'Sep 3', normal: 178, fraud: 31 },
  { day: 'Sep 4', normal: 160, fraud: 24 },
  { day: 'Sep 5', normal: 195, fraud: 39 },
  { day: 'Sep 6', normal: 170, fraud: 29 },
  { day: 'Sep 7', normal: 220, fraud: 48 },
  { day: 'Sep 8', normal: 198, fraud: 36 },
  { day: 'Sep 9', normal: 205, fraud: 42 },
]

const transactions = [
  {
    id: 568,
    amount: '₹25,430',
    type: 'transfer',
    merchant: 'electronics',
    country: 'India',
    probability: '98.91%',
    risk: 'CRITICAL',
    status: 'FLAGGED',
  },
  {
    id: 721,
    amount: '₹18,200',
    type: 'purchase',
    merchant: 'travel',
    country: 'USA',
    probability: '91.32%',
    risk: 'HIGH',
    status: 'FLAGGED',
  },
  {
    id: 104,
    amount: '₹2,300',
    type: 'payment',
    merchant: 'groceries',
    country: 'India',
    probability: '12.41%',
    risk: 'LOW',
    status: 'CLEAR',
  },
  {
    id: 892,
    amount: '₹7,850',
    type: 'transfer',
    merchant: 'utilities',
    country: 'UK',
    probability: '76.21%',
    risk: 'HIGH',
    status: 'FLAGGED',
  },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Analyze Transaction', icon: Search },
    { name: 'Transactions', icon: List },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Model Performance', icon: Brain },
    { name: 'API Status', icon: Activity },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>
          <div>
            <div className="brand-title">Financial Fraud</div>
            <div className="brand-subtitle">Risk Engine</div>
          </div>
        </div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? 'active' : ''
                }`}
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-profile">
          <div className="avatar">RP</div>
          <div>
            <strong>Rohan Pagare</strong>
            <span>Data Scientist</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button">
            <Menu size={21} />
          </button>

          <div className="page-location">
            <span>Risk Intelligence Platform</span>
          </div>

          <div className="topbar-right">
            <div className="api-status">
              <span className="status-dot"></span>
              API Online
            </div>
            <button className="notification">
              <Bell size={19} />
            </button>
          </div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">FINANCIAL SECURITY</p>
              <h1>{activePage}</h1>
              <p className="page-description">
                Monitor and analyze transaction fraud risk using the deployed
                machine learning engine.
              </p>
            </div>

            <div className="live-badge">
              <span></span>
              Production
            </div>
          </div>

          {activePage === 'Dashboard' && (
            <>
              <div className="metric-grid">
                <MetricCard
                  title="Total Transactions"
                  value="1,000"
                  change="+12%"
                  icon={<List />}
                />
                <MetricCard
                  title="Flagged Transactions"
                  value="217"
                  change="+8%"
                  danger
                  icon={<AlertTriangle />}
                />
                <MetricCard
                  title="Fraud Detection Rate"
                  value="21.7%"
                  change="+2.3%"
                  icon={<ShieldCheck />}
                />
                <MetricCard
                  title="P95 Fraud Probability"
                  value="82.28%"
                  change="+5%"
                  icon={<BarChart3 />}
                />
              </div>

              <div className="dashboard-grid">
                <div className="card chart-card">
                  <div className="card-header">
                    <div>
                      <h2>Risk Distribution</h2>
                      <p>Current transaction risk profile</p>
                    </div>
                  </div>

                  <div className="risk-chart">
                    <ResponsiveContainer width="100%" height={270}>
                      <PieChart>
                        <Pie
                          data={riskData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={72}
                          outerRadius={105}
                          paddingAngle={3}
                        >
                          {riskData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                ['#16a34a', '#f59e0b', '#f97316', '#dc2626'][
                                  index
                                ]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="risk-legend">
                      {riskData.map((item, index) => (
                        <div className="legend-row" key={item.name}>
                          <span
                            className="legend-dot"
                            style={{
                              backgroundColor: [
                                '#16a34a',
                                '#f59e0b',
                                '#f97316',
                                '#dc2626',
                              ][index],
                            }}
                          ></span>
                          <span>{item.name}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card chart-card">
                  <div className="card-header">
                    <div>
                      <h2>Transaction Activity</h2>
                      <p>Normal vs flagged transactions</p>
                    </div>
                    <span className="period">Last 9 days</span>
                  </div>

                  <ResponsiveContainer width="100%" height={270}>
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="normal"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="fraud"
                        stroke="#dc2626"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="chart-labels">
                    <span>
                      <i className="blue-dot"></i> Normal
                    </span>
                    <span>
                      <i className="red-dot"></i> Flagged
                    </span>
                  </div>
                </div>
              </div>

              <div className="card transactions-card">
                <div className="card-header">
                  <div>
                    <h2>High-Risk Transaction Queue</h2>
                    <p>Transactions requiring analyst attention</p>
                  </div>

                  <button
                    className="view-button"
                    onClick={() => setActivePage('Transactions')}
                  >
                    View all <ArrowUpRight size={16} />
                  </button>
                </div>

                <TransactionTable rows={transactions} />
              </div>
            </>
          )}

          {activePage !== 'Dashboard' && (
            <div className="coming-card">
              <div className="coming-icon">
                <Activity size={30} />
              </div>
              <h2>{activePage}</h2>
              <p>
                This module will be connected to the production fraud API in
                the next step.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function MetricCard({ title, value, change, icon, danger }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${danger ? 'danger' : ''}`}>{icon}</div>
      <div className="metric-info">
        <span>{title}</span>
        <strong>{value}</strong>
        <small className={danger ? 'danger-text' : ''}>
          {change} vs last week
        </small>
      </div>
    </div>
  )
}

function TransactionTable({ rows }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
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
          {rows.map((transaction) => (
            <tr key={transaction.id}>
              <td>#{transaction.id}</td>
              <td className="amount">{transaction.amount}</td>
              <td>{transaction.type}</td>
              <td>{transaction.merchant}</td>
              <td>{transaction.country}</td>
              <td className="probability">{transaction.probability}</td>
              <td>
                <span className={`risk-pill ${transaction.risk.toLowerCase()}`}>
                  {transaction.risk}
                </span>
              </td>
              <td>
                <span
                  className={`status-pill ${
                    transaction.status === 'FLAGGED' ? 'flagged' : 'clear'
                  }`}
                >
                  {transaction.status === 'FLAGGED' ? (
                    <AlertTriangle size={13} />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  {transaction.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App