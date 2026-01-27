import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center shadow">
      <h1 className="text-xl font-bold">Water Monitoring System</h1>

      <div className="flex items-center gap-6">
        <span className="text-sm">
          {user?.name} ({user?.role})
        </span>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded-md"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
