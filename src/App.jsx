import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Layout from "./components/Layout/Layout";
import Users from "./Pages/Users/Users";
import Settings from "./Pages/Settings/Settings";
import Members from "./Pages/Members/Members";
import Events from "./Pages/Events/Events";
import Approvals from "./Pages/Approvals/Approvals";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Nissan from "./Pages/Nissan/Settings";
import UpdateTeamRanking from "./Pages/Nissan/Ranking/UpdateTeamRanking";
import ViewPlayerList from "./Pages/Nissan/Players/ViewPlayerList";
import ManageDraw from "./Pages/Nissan/Draws/ManageDraw";
import ManageResult from "./Pages/Nissan/Result/ManageResult";
import UpdateEvents from "./Pages/Nissan/UpdateEvents/UpdateEvents";
import ViewPlayerJourney from "./Pages/Nissan/Journey/ViewPlayerJourney";

import { Toaster } from "sonner";

function App() {
  return (
    <Router>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <Layout>
                <Members />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Layout>
                <Events />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nissan"
          element={
            <ProtectedRoute>
              <Layout>
                <Nissan />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nissan/update-team-ranking"
          element={
            <ProtectedRoute>
              <Layout>
                <UpdateTeamRanking />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nissan/view-player-list"
          element={
            <ProtectedRoute>
              <Layout>
                <ViewPlayerList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nissan/view-player-journey"
          element={
            <ProtectedRoute>
              <Layout>
                <ViewPlayerJourney />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nissan/manage-draw"
          element={
            <ProtectedRoute>
              <Layout>
                <ManageDraw />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nissan/manage-result"
          element={
            <ProtectedRoute>
              <Layout>
                <ManageResult />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nissan/update-events"
          element={
            <ProtectedRoute>
              <Layout>
                <UpdateEvents />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <Layout>
                <Approvals />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
