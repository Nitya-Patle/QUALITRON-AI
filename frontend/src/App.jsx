import { useState, useEffect, createContext, useContext } from "react";
import { C } from "./theme";
import Sidebar   from "./components/Sidebar";
import Topbar    from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Inspect   from "./pages/Inspect";
import Camera    from "./pages/Camera";
import Analytics from "./pages/Analytics";
import Records   from "./pages/Records";
import Alerts    from "./pages/Alerts";
import Reports   from "./pages/Reports";
import Settings  from "./pages/Settings";
import Login     from "./pages/Login";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const PAGES = { dashboard:Dashboard, inspect:Inspect, camera:Camera,
  analytics:Analytics, records:Records, alerts:Alerts, reports:Reports, settings:Settings };

export default function App() {
  const [user, setUser]   = useState(null);
  const [page, setPage]   = useState("dashboard");
  const [dark, setDark]   = useState(true);
  const [alerts, setAlerts] = useState(0);

  useEffect(() => {
    if (dark) document.body.classList.remove("light-mode");
    else document.body.classList.add("light-mode");
  }, [dark]);

  const refreshAlerts = () => {
    import("./utils/api").then(({ alertsAPI }) => {
      alertsAPI.list(1).then(res => {
        if (res && res.alerts) {
          setAlerts(res.alerts.filter(a => !a.resolved).length);
        }
      }).catch(() => {});
    });
  };

  useEffect(() => {
    const t = localStorage.getItem("qc_token");
    const u = localStorage.getItem("qc_user");
    if (t && u) {
      setUser(JSON.parse(u));
      refreshAlerts();
    }
  }, []);

  const login  = (token, userData) => {
    localStorage.setItem("qc_token", token);
    localStorage.setItem("qc_user",  JSON.stringify(userData));
    setUser(userData);
  };
  const logout = () => {
    localStorage.removeItem("qc_token");
    localStorage.removeItem("qc_user");
    setUser(null);
  };

  if (!user) return <AuthContext.Provider value={{user,login,logout}}><Login /></AuthContext.Provider>;

  const Page = PAGES[page] || Dashboard;
  return (
    <AuthContext.Provider value={{user,login,logout}}>
      <div style={{display:"flex",minHeight:"100vh",background:C.bg}}>
        <Sidebar active={page} setActive={setPage} role={user.role} />
        <div style={{marginLeft:220,flex:1,display:"flex",flexDirection:"column"}}>
          <Topbar page={page} dark={dark} setDark={setDark} user={user} logout={logout} alerts={alerts} />
          <main style={{flex:1,padding:"24px 28px",overflowY:"auto"}}>
            <Page user={user} refreshAlerts={refreshAlerts} />
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}
