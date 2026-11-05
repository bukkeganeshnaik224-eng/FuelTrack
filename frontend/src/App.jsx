import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://fueltrack-2.onrender.com";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({
    vehicle_code: "",
    vehicle_type: "",
    fuel_type: "",
  });

  const [fuelForm, setFuelForm] = useState({
    vehicle_id: "",
    fill_date: "",
    odometer_km: "",
    litres: "",
    total_cost: "",
    full_tank_flag: true,
  });

  const menu = [
    { name: "Dashboard", icon: "▦" },
    { name: "Vehicles", icon: "🚘" },
    { name: "Fuel Records", icon: "⛽" },
    { name: "Add Vehicle", icon: "＋" },
    { name: "Add Fuel Record", icon: "✎" },
    { name: "Analytics", icon: "▥" },
    { name: "Reports", icon: "▤" },
  ];

  // LOAD VEHICLES AND FUEL RECORDS
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [vehicleRes, recordRes] = await Promise.all([
        fetch(`${API_URL}/vehicles`),
        fetch(`${API_URL}/fuel-records`),
      ]);

      if (!vehicleRes.ok || !recordRes.ok) {
        throw new Error("Backend returned an error.");
      }

      const vehicleData = await vehicleRes.json();
      const recordData = await recordRes.json();

      setVehicles(
        Array.isArray(vehicleData)
          ? vehicleData
          : vehicleData.vehicles || []
      );

      setRecords(
        Array.isArray(recordData)
          ? recordData
          : recordData.records || recordData.fuel_records || []
      );
    } catch (err) {
      setError(
        "Unable to connect to backend. Please start Flask server and check API endpoints."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // TOTAL EXPENSES
  const totalExpenses = records.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );

  // TOTAL FUEL
  const totalLitres = records.reduce(
    (sum, item) => sum + Number(item.litres || 0),
    0
  );

  // AVERAGE FUEL PRICE
  const averagePrice = totalLitres
    ? totalExpenses / totalLitres
    : 0;

  // MILEAGE ANALYSIS
  const mileageData = calculateMileageByVehicle(
    records,
    vehicles
  );

  // MONTHLY EXPENSE ANALYSIS
  const monthlyExpenses = calculateMonthlyExpenses(records);

  // FORMAT INDIAN RUPEES
  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  // ADD VEHICLE
  const addVehicle = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not add vehicle."
        );
      }

      alert("Vehicle added successfully!");

      setVehicleForm({
        vehicle_code: "",
        vehicle_type: "",
        fuel_type: "",
      });

      await loadData();
      setActivePage("Vehicles");
    } catch (err) {
      alert(err.message);
    }
  };

  // ADD FUEL RECORD
  const addFuelRecord = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/fuel-records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...fuelForm,
          vehicle_id: Number(fuelForm.vehicle_id),
          odometer_km: Number(fuelForm.odometer_km),
          litres: Number(fuelForm.litres),
          total_cost: Number(fuelForm.total_cost),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not add fuel record."
        );
      }

      alert("Fuel record added successfully!");

      setFuelForm({
        vehicle_id: "",
        fill_date: "",
        odometer_km: "",
        litres: "",
        total_cost: "",
        full_tank_flag: true,
      });

      await loadData();
      setActivePage("Fuel Records");
    } catch (err) {
      alert(err.message);
    }
  };

  // EXPORT CSV REPORT
  const exportCSV = () => {
    if (!records.length) {
      alert("No records available.");
      return;
    }

    const headers = [
      "Vehicle ID",
      "Date",
      "Odometer KM",
      "Litres",
      "Total Cost",
      "Full Tank",
    ];

    const rows = records.map((r) => [
      r.vehicle_id,
      r.fill_date,
      r.odometer_km,
      r.litres,
      r.total_cost,
      r.full_tank_flag ? "Yes" : "No",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "fuel_consumption_report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const pageTitle = {
    Dashboard: "Dashboard",
    Vehicles: "Vehicle Management",
    "Fuel Records": "Fuel Records",
    "Add Vehicle": "Add New Vehicle",
    "Add Fuel Record": "Add Fuel Record",
    Analytics: "Analytics",
    Reports: "Reports",
  };

  return (
    <div className="app-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">F</div>

          <div>
            <h2>FuelTrack</h2>
            <span>FLEET MANAGEMENT</span>
          </div>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav>
          {menu.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "selected" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>

              {item.name}

              {activePage === item.name && (
                <span className="active-indicator"></span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar">G</div>

          <div>
            <strong>Administrator</strong>
            <small>System Manager</small>
          </div>
        </div>

      </aside>

      {/* MAIN AREA */}
      <main className="main-area">

        <header className="top-header">

          <div>
            <div className="breadcrumb">
              Workspace / {pageTitle[activePage]}
            </div>

            <h1>{pageTitle[activePage]}</h1>
          </div>

          <div className="header-right">
            <div className="system-status">
              <span></span>
              System Online
            </div>

            <div className="header-avatar">G</div>
          </div>

        </header>

        {error && (
          <div className="alert-error">{error}</div>
        )}

        {loading && (
          <div className="loading">Loading your data...</div>
        )}

        {/* DASHBOARD */}
        {activePage === "Dashboard" && (
          <>

            <section className="welcome-banner">

              <div>
                <span className="welcome-tag">
                  FLEET OVERVIEW
                </span>

                <h2>Welcome back, Administrator 👋</h2>

                <p>
                  Here's what's happening with your fleet today.
                  Monitor fuel consumption and expenses in one place.
                </p>
              </div>

              <button
                className="button-primary"
                onClick={() =>
                  setActivePage("Add Fuel Record")
                }
              >
                + Add Fuel Entry
              </button>

            </section>

            <section className="stats-grid">

              <StatCard
                icon="🚘"
                title="Total Vehicles"
                value={vehicles.length}
                subtitle="Registered vehicles"
                color="blue"
              />

              <StatCard
                icon="⛽"
                title="Fuel Consumed"
                value={`${totalLitres.toFixed(2)} L`}
                subtitle="Total recorded litres"
                color="green"
              />

              <StatCard
                icon="₹"
                title="Total Expenses"
                value={formatMoney(totalExpenses)}
                subtitle="Total fuel expenditure"
                color="orange"
              />

              <StatCard
                icon="📊"
                title="Average Fuel Price"
                value={formatMoney(averagePrice)}
                subtitle="Cost per litre"
                color="purple"
              />

            </section>
                        {/* RECENT FUEL RECORDS */}
            <section className="content-card">

              <div className="section-header">
                <div>
                  <h2>Recent Fuel Records</h2>
                  <p>Latest fuel transactions</p>
                </div>

                <button
                  className="button-secondary"
                  onClick={() => setActivePage("Fuel Records")}
                >
                  View All
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle ID</th>
                      <th>Date</th>
                      <th>Odometer</th>
                      <th>Litres</th>
                      <th>Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.slice(0, 5).map((record, index) => (
                      <tr key={record.record_id || index}>
                        <td>{record.vehicle_id}</td>
                        <td>{record.fill_date}</td>
                        <td>{record.odometer_km} km</td>
                        <td>{record.litres} L</td>
                        <td>{formatMoney(Number(record.total_cost || 0))}</td>
                      </tr>
                    ))}

                    {records.length === 0 && (
                      <tr>
                        <td colSpan="5">No fuel records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </section>
          </>
        )}

        {/* VEHICLES PAGE */}
        {activePage === "Vehicles" && (
          <section className="content-card">

            <div className="section-header">
              <div>
                <h2>Registered Vehicles</h2>
                <p>Manage your registered vehicles</p>
              </div>

              <button
                className="button-primary"
                onClick={() => setActivePage("Add Vehicle")}
              >
                + Add Vehicle
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle ID</th>
                    <th>Vehicle Code</th>
                    <th>Vehicle Type</th>
                    <th>Fuel Type</th>
                  </tr>
                </thead>

                <tbody>
                  {vehicles.map((vehicle, index) => (
                    <tr key={vehicle.vehicle_id || index}>
                      <td>{vehicle.vehicle_id}</td>
                      <td>{vehicle.vehicle_code}</td>
                      <td>{vehicle.vehicle_type}</td>
                      <td>{vehicle.fuel_type}</td>
                    </tr>
                  ))}

                  {vehicles.length === 0 && (
                    <tr>
                      <td colSpan="4">No vehicles found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* FUEL RECORDS PAGE */}
        {activePage === "Fuel Records" && (
          <section className="content-card">

            <div className="section-header">
              <div>
                <h2>Fuel Records</h2>
                <p>All recorded fuel transactions</p>
              </div>

              <button
                className="button-primary"
                onClick={() => setActivePage("Add Fuel Record")}
              >
                + Add Record
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Vehicle ID</th>
                    <th>Date</th>
                    <th>Odometer</th>
                    <th>Litres</th>
                    <th>Total Cost</th>
                    <th>Full Tank</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record, index) => (
                    <tr key={record.record_id || index}>
                      <td>{record.record_id || index + 1}</td>
                      <td>{record.vehicle_id}</td>
                      <td>{record.fill_date}</td>
                      <td>{record.odometer_km} km</td>
                      <td>{record.litres} L</td>
                      <td>
                        {formatMoney(Number(record.total_cost || 0))}
                      </td>
                      <td>
                        {record.full_tank_flag ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}

                  {records.length === 0 && (
                    <tr>
                      <td colSpan="7">No records available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* ADD VEHICLE PAGE */}
        {activePage === "Add Vehicle" && (
          <section className="form-card">

            <div className="form-heading">
              <h2>Register New Vehicle</h2>
              <p>Enter the vehicle details below.</p>
            </div>

            <form onSubmit={addVehicle}>

              <div className="form-group">
                <label>Vehicle Code</label>

                <input
                  type="text"
                  placeholder="Example: BIKE01"
                  value={vehicleForm.vehicle_code}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      vehicle_code: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Vehicle Type</label>

                <select
                  value={vehicleForm.vehicle_type}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      vehicle_type: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select vehicle type</option>
                  <option value="Bike">Bike</option>
                  <option value="Car">Car</option>
                  <option value="Truck">Truck</option>
                  <option value="Bus">Bus</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fuel Type</label>

                <select
                  value={vehicleForm.fuel_type}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      fuel_type: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select fuel type</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <button type="submit" className="button-primary">
                Save Vehicle
              </button>

            </form>
          </section>
        )}

        {/* ADD FUEL RECORD PAGE */}
        {activePage === "Add Fuel Record" && (
          <section className="form-card">

            <div className="form-heading">
              <h2>Add Fuel Record</h2>
              <p>Enter the latest fuel filling information.</p>
            </div>

            <form onSubmit={addFuelRecord}>

              <div className="form-group">
                <label>Select Vehicle</label>

                <select
                  value={fuelForm.vehicle_id}
                  onChange={(e) =>
                    setFuelForm({
                      ...fuelForm,
                      vehicle_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select vehicle</option>

                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle.vehicle_id}
                      value={vehicle.vehicle_id}
                    >
                      {vehicle.vehicle_code} - {vehicle.vehicle_type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Fuel Filling Date</label>

                <input
                  type="date"
                  value={fuelForm.fill_date}
                  onChange={(e) =>
                    setFuelForm({
                      ...fuelForm,
                      fill_date: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Odometer Reading (KM)</label>

                <input
                  type="number"
                  min="0"
                  placeholder="Enter odometer reading"
                  value={fuelForm.odometer_km}
                  onChange={(e) =>
                    setFuelForm({
                      ...fuelForm,
                      odometer_km: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Fuel Quantity (Litres)</label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter litres"
                  value={fuelForm.litres}
                  onChange={(e) =>
                    setFuelForm({
                      ...fuelForm,
                      litres: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Total Cost (₹)</label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter total cost"
                  value={fuelForm.total_cost}
                  onChange={(e) =>
                    setFuelForm({
                      ...fuelForm,
                      total_cost: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={fuelForm.full_tank_flag}
                    onChange={(e) =>
                      setFuelForm({
                        ...fuelForm,
                        full_tank_flag: e.target.checked,
                      })
                    }
                  />
                  Full Tank
                </label>
              </div>

              <button type="submit" className="button-primary">
                Save Fuel Record
              </button>

            </form>
          </section>
        )}
                {/* ANALYTICS PAGE */}
        {activePage === "Analytics" && (
          <>
            <section className="stats-grid">

              <StatCard
                icon="⛽"
                title="Total Fuel"
                value={`${totalLitres.toFixed(2)} L`}
                subtitle="Total fuel consumed"
                color="green"
              />

              <StatCard
                icon="₹"
                title="Total Expenses"
                value={formatMoney(totalExpenses)}
                subtitle="Total fuel expenditure"
                color="orange"
              />

              <StatCard
                icon="📊"
                title="Average Price"
                value={formatMoney(averagePrice)}
                subtitle="Average cost per litre"
                color="purple"
              />

              <StatCard
                icon="🚘"
                title="Vehicles Analyzed"
                value={mileageData.length}
                subtitle="Vehicles with mileage data"
                color="blue"
              />

            </section>

            {/* MILEAGE ANALYSIS */}
            <section className="content-card">

              <div className="section-header">
                <div>
                  <h2>Vehicle Mileage Analysis</h2>
                  <p>Estimated mileage for each vehicle</p>
                </div>
              </div>

              <MileageTable
                mileageData={mileageData}
              />

              <p className="analytics-note">
                Note: Mileage is calculated using consecutive
                full-tank fuel records.
              </p>

            </section>

            {/* MONTHLY EXPENSES */}
            <section className="content-card">

              <div className="section-header">
                <div>
                  <h2>Monthly Fuel Expenses</h2>
                  <p>Month-wise fuel expenditure</p>
                </div>
              </div>

              <MonthlyExpenseChart
                data={monthlyExpenses}
                formatMoney={formatMoney}
              />

            </section>

            {/* FUEL CONSUMPTION */}
            <section className="content-card">

              <div className="section-header">
                <div>
                  <h2>Fuel Consumption Overview</h2>
                  <p>Total fuel consumption by vehicle</p>
                </div>
              </div>

              {vehicles.map((vehicle) => {
                const vehicleRecords = records.filter(
                  (record) =>
                    Number(record.vehicle_id) ===
                    Number(vehicle.vehicle_id)
                );

                const litres = vehicleRecords.reduce(
                  (sum, record) =>
                    sum + Number(record.litres || 0),
                  0
                );

                const percentage = totalLitres
                  ? (litres / totalLitres) * 100
                  : 0;

                return (
                  <div
                    className="consumption-item"
                    key={vehicle.vehicle_id}
                  >
                    <div className="consumption-heading">
                      <strong>{vehicle.vehicle_code}</strong>
                      <span>{litres.toFixed(2)} L</span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percentage}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {vehicles.length === 0 && (
                <p>No vehicle data available.</p>
              )}

            </section>
          </>
        )}

        {/* REPORTS PAGE */}
        {activePage === "Reports" && (
          <section className="content-card">

            <div className="section-header">
              <div>
                <h2>Fuel Consumption Reports</h2>
                <p>Download your fuel transaction report.</p>
              </div>
            </div>

            <div className="report-summary">

              <div className="report-box">
                <span>Total Vehicles</span>
                <h2>{vehicles.length}</h2>
              </div>

              <div className="report-box">
                <span>Total Records</span>
                <h2>{records.length}</h2>
              </div>

              <div className="report-box">
                <span>Total Fuel</span>
                <h2>{totalLitres.toFixed(2)} L</h2>
              </div>

              <div className="report-box">
                <span>Total Expenses</span>
                <h2>{formatMoney(totalExpenses)}</h2>
              </div>

            </div>

            <button
              className="button-primary"
              onClick={exportCSV}
            >
              ↓ Download CSV Report
            </button>

          </section>
        )}

        {/* FOOTER */}
        <footer className="app-footer">
          FuelTrack – Fuel Consumption Analysis System
          <span> | Powered by React and Flask</span>
        </footer>

      </main>
    </div>
  );
}

// STATISTICS CARD COMPONENT
function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}) {
  return (
    <div className={`stat-card ${color}`}>

      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
      </div>

      <h3>{title}</h3>

      <h2>{value}</h2>

      <p>{subtitle}</p>

    </div>
  );
}

// CALCULATE VEHICLE MILEAGE
function calculateMileageByVehicle(records, vehicles) {
  const results = [];

  const isFullTank = (value) =>
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true";

  vehicles.forEach((vehicle) => {
    const vehicleRecords = records
      .filter(
        (record) =>
          Number(record.vehicle_id) ===
          Number(vehicle.vehicle_id)
      )
      .sort(
        (a, b) =>
          new Date(a.fill_date) - new Date(b.fill_date)
      );

    let totalDistance = 0;
    let totalFuel = 0;

    for (let i = 1; i < vehicleRecords.length; i++) {
      const previous = vehicleRecords[i - 1];
      const current = vehicleRecords[i];

      if (
        isFullTank(previous.full_tank_flag) &&
        isFullTank(current.full_tank_flag)
      ) {
        const distance =
          Number(current.odometer_km) -
          Number(previous.odometer_km);

        const fuel = Number(current.litres);

        if (distance > 0 && fuel > 0) {
          totalDistance += distance;
          totalFuel += fuel;
        }
      }
    }

    const mileage =
      totalFuel > 0
        ? totalDistance / totalFuel
        : 0;

    if (mileage > 0) {
      results.push({
        vehicle_code: vehicle.vehicle_code,
        vehicle_type: vehicle.vehicle_type,
        mileage: mileage,
        distance: totalDistance,
        fuel: totalFuel,
      });
    }
  });

  return results;
}

// CALCULATE MONTHLY EXPENSES
function calculateMonthlyExpenses(records) {
  const monthlyData = {};

  records.forEach((record) => {
    if (!record.fill_date) return;

    const date = new Date(record.fill_date);

    if (Number.isNaN(date.getTime())) return;

    const month = date.toLocaleString("en-IN", {
      month: "short",
      year: "numeric",
    });

    monthlyData[month] =
      (monthlyData[month] || 0) +
      Number(record.total_cost || 0);
  });

  return Object.entries(monthlyData).map(
    ([month, amount]) => ({
      month,
      amount,
    })
  );
}
// MILEAGE TABLE COMPONENT
function MileageTable({ mileageData }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Vehicle Type</th>
            <th>Total Distance</th>
            <th>Fuel Used</th>
            <th>Average Mileage</th>
          </tr>
        </thead>

        <tbody>
          {mileageData.map((item, index) => (
            <tr key={index}>
              <td>{item.vehicle_code}</td>
              <td>{item.vehicle_type}</td>
              <td>{item.distance.toFixed(2)} KM</td>
              <td>{item.fuel.toFixed(2)} L</td>
              <td>
                <strong>
                  {item.mileage.toFixed(2)} KM/L
                </strong>
              </td>
            </tr>
          ))}

          {mileageData.length === 0 && (
            <tr>
              <td colSpan="5">
                No mileage data available.
                Add at least two consecutive full-tank records.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// MONTHLY EXPENSE CHART COMPONENT
function MonthlyExpenseChart({ data, formatMoney }) {
  const maxAmount = Math.max(
    ...data.map((item) => item.amount),
    1
  );

  return (
    <div className="monthly-chart">

      {data.map((item, index) => {
        const percentage =
          (item.amount / maxAmount) * 100;

        return (
          <div className="monthly-chart-row" key={index}>

            <div className="monthly-chart-label">
              {item.month}
            </div>

            <div className="monthly-chart-track">
              <div
                className="monthly-chart-bar"
                style={{
                  width: `${percentage}%`,
                }}
              ></div>
            </div>

            <div className="monthly-chart-value">
              {formatMoney(item.amount)}
            </div>

          </div>
        );
      })}

      {data.length === 0 && (
        <p>No monthly expense data available.</p>
      )}

    </div>
  );
}

export default App;
