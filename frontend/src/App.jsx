import { useEffect, useState } from "react";
import api from "./api/axios";

function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    api.get("/api/hello")
      .then(res => setMsg(res.data.message))
      .catch(err => setMsg("Error connecting backend"));
  }, []);

  return (
    <div>
      <h1>Project Team Management</h1>
      <p>{msg}</p>
    </div>
  );
}

export default App;
