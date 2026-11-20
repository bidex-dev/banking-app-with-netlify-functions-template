import React from "react";

export default function App() {
  const [user, setUser] = React.useState(null);
  const [page, setPage] = React.useState("login"); // login, dashboard, transfer, profile
  const [accounts, setAccounts] = React.useState([]);
  const [transactions, setTransactions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const [transferForm, setTransferForm] = React.useState({
    fromAccountId: "",
    toAccountNumber: "",
    amount: "",
    description: "",
  });

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  }

  // Load accounts when dashboard opens
  React.useEffect(() => {
    if (page === "dashboard" && user) {
      setLoading(true);
      fetch("/.netlify/functions/getAccounts")
        .then((res) => res.json())
        .then((data) => {
          setAccounts(data);
          if (data.length > 0) {
            setTransferForm((f) => ({ ...f, fromAccountId: data[0].id }));
          }
        })
        .catch(() => alert("Failed to load accounts"))
        .finally(() => setLoading(false));
    } else {
      setAccounts([]);
    }
  }, [page, user]);

  // Simulated user profile data:
  const userProfile = {
    name: "John Doe",
    username: "user",
    email: "john.doe@example.com",
    phone: "+234 800 000 0000",
  };

  // Simple login simulation
  function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value.trim();
    const password = form.password.value.trim();
    if (username === "user" && password === "password") {
      setUser({ name: "John Doe", username: "user" });
      setPage("dashboard");
    } else {
      alert("Invalid username or password");
    }
  }

  function logout() {
    setUser(null);
    setPage("login");
  }

  function handleTransferChange(e) {
    setTransferForm({ ...transferForm, [e.target.name]: e.target.value });
  }

  async function handleTransferSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/.netlify/functions/createTransfer", {
        method: "POST",
        body: JSON.stringify(transferForm),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const message = await response.text();
        alert(`Transfer failed: ${message}`);
        setLoading(false);
        return;
      }
      const data = await response.json();
      alert(data.message);

      // Refresh accounts balances after transfer
      const resAccounts = await fetch("/.netlify/functions/getAccounts");
      const updatedAccounts = await resAccounts.json();
      setAccounts(updatedAccounts);

      setPage("dashboard");
      setTransferForm({
        fromAccountId: updatedAccounts.length > 0 ? updatedAccounts[0].id : "",
        toAccountNumber: "",
        amount: "",
        description: "",
      });
    } catch {
      alert("Transfer failed due to network or server error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-700 text-white font-sans">
      <div className="max-w-md mx-auto p-6">
        {page === "login" && (
          <div className="bg-white bg-opacity-10 rounded-lg p-6 shadow-lg">
            <h1 className="text-3xl font-bold mb-4 text-center">BankApp Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block mb-1 font-semibold">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full rounded px-3 py-2 text-black"
                />
              </div>
              <div>
                <label htmlFor="password" className="block mb-1 font-semibold">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full rounded px-3 py-2 text-black"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-800 rounded py-2 font-semibold"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        )}

        {page === "dashboard" && (
          <div>
            <header className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Welcome, {user.name}</h2>
              <button
                onClick={logout}
                className="bg-red-600 px-3 py-1 rounded hover:bg-red-800"
                disabled={loading}
              >
                Logout
              </button>
            </header>

            <section className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Your Accounts</h3>
              {loading ? (
                <p>Loading accounts...</p>
              ) : (
                <div className="space-y-4">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="bg-white bg-opacity-10 rounded p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold">{acc.name}</p>
                        <p className="text-sm text-slate-300">
                          Account No: 1234 5678 {acc.id}9 0{acc.id}
                        </p>
                      </div>
                      <p className="text-lg font-bold">{formatCurrency(acc.balance)}</p>
                    </div>
                  ))}
                  {accounts.length === 0 && <p>No accounts found.</p>}
                </div>
              )}
            </section>

            {/* Not keeping transactions since backend functions don’t track them persistently */}

            <nav className="flex justify-around text-indigo-300 font-semibold">
              <button
                onClick={() => setPage("dashboard")}
                className="border-b-2 border-indigo-400 py-1"
                disabled={loading}
              >
                Home
              </button>
              <button
                onClick={() => setPage("transfer")}
                className="hover:text-white py-1"
                disabled={loading}
              >
                Transfer
              </button>
              <button
                onClick={() => setPage("profile")}
                className="hover:text-white py-1"
                disabled={loading}
              >
                Profile
              </button>
            </nav>
          </div>
        )}

        {page === "transfer" && (
          <div>
            <header className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Transfer Funds</h2>
              <button
                onClick={() => setPage("dashboard")}
                className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-800"
                disabled={loading}
              >
                Cancel
              </button>
            </header>

            <form
              onSubmit={handleTransferSubmit}
              className="space-y-4 bg-white bg-opacity-10 rounded p-6"
            >
              <div>
                <label htmlFor="fromAccountId" className="block font-semibold mb-1">
                  From Account
                </label>
                <select
                  id="fromAccountId"
                  name="fromAccountId"
                  value={transferForm.fromAccountId}
                  onChange={handleTransferChange}
                  className="w-full rounded px-3 py-2 text-black"
                  required
                  disabled={loading}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} - {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="toAccountNumber" className="block font-semibold mb-1">
                  To Account Number
                </label>
                <input
                  id="toAccountNumber"
                  name="toAccountNumber"
                  type="text"
                  value={transferForm.toAccountNumber}
                  onChange={handleTransferChange}
                  className="w-full rounded px-3 py-2 text-black"
                  placeholder="e.g. 1234567890"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="amount" className="block font-semibold mb-1">
                  Amount (NGN)
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1"
                  value={transferForm.amount}
                  onChange={handleTransferChange}
                  className="w-full rounded px-3 py-2 text-black"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="description" className="block font-semibold mb-1">
                  Description (optional)
                </label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={transferForm.description}
                  onChange={handleTransferChange}
                  className="w-full rounded px-3 py-2 text-black"
                  placeholder="e.g. Rent payment"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-800 rounded py-2 font-semibold"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Transfer"}
              </button>
            </form>
          </div>
        )}

        {page === "profile" && (
          <div>
            <header className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Profile</h2>
              <button
                onClick={() => setPage("dashboard")}
                className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-800"
                disabled={loading}
              >
                Back
              </button>
            </header>
            <div className="bg-white bg-opacity-10 rounded p-6 space-y-4">
              <p>
                <span className="font-semibold">Name:</span> {userProfile.name}
              </p>
              <p>
                <span className="font-semibold">Username:</span> {userProfile.username}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {userProfile.email}
              </p>
              <p>
                <span className="font-semibold">Phone:</span> {userProfile.phone}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}