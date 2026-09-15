import { useEffect, useState } from "react";
import "./Users.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "https://graminmart.onrender.com/api/admin/users"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error("Users Error:", error);
      alert("Users load nahi ho rahe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="users-page">

      <div className="users-header">
        <div>
          <h1>👥 Users Management</h1>
          <p>Manage all registered GraminMart users</p>
        </div>

        <button onClick={fetchUsers}>
          🔄 Refresh
        </button>
      </div>

      <div className="users-card">

        <div className="users-card-header">
          <h2>All Users</h2>
          <span>{users.length} Users</span>
        </div>

        {loading ? (
          <div className="users-message">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="users-message">
            No users found.
          </div>
        ) : (
          <div className="users-table-wrapper">

            <table className="users-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr key={user._id || index}>

                    <td>{index + 1}</td>

                    <td>
                      👤 {user.name}
                    </td>

                    <td>
                      {user.mobile || "—"}
                    </td>

                    <td>
                      {user.email}
                    </td>

                    <td>
                      <span
                        className={
                          user.role === "admin"
                            ? "role admin-role"
                            : "role customer-role"
                        }
                      >
                        {user.role || "customer"}
                      </span>
                    </td>

                    <td>
                      {user.createdAt
                        ? new Date(
                            user.createdAt
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Users;
