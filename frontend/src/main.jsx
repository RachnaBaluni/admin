import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { Toaster } from "sonner";
import "./index.css";

import Home from "./Pages/Home/Home";

import Nissan_Home from "./Pages/Nissan_Home/Nissan_Home";
import Nissan_Register from "./Pages/Nissan_Register/Nissan_Register";
import Nissan_RegisteredPlayers from "./Pages/Nissan_RegisteredPlayers/Nissan_RegisteredPlayers";
import Nissan_PlayerList from "./Pages/Nissan_PlayerList/PlayerList.jsx";
import Nissan_Login from "./Pages/Nissan_Login/Nissan_Login";
import Nissan_Login_Page from "./Pages/Nissan_Login/LoginPage.jsx";

import Tournaments from "./Pages/Tournaments/Tournaments";
import TournamentDetail from "./Pages/TournamentDetails/TournamentDetail";
import About from "./Pages/AboutUs/About";
import JoinUs from "./Pages/JoinUs/JoinUs";
import Contact from "./Pages/Contact/Contact";
import Layout from "./Layout";
import Login from "./Pages/Login/Login";
import Result from "./Pages/Result/Result.jsx";
import Draws from "./Pages/Draws/Draws.jsx";
import DrawDisplay from "./Pages/DrawDisplay/DrawDisplay.jsx";
import DrawDisplaySetup from "./Pages/DrawDisplay/DrawDisplaySetup.jsx";


const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<Home />} />
        {/* <Route path="/tournaments" element={<Tournaments />} /> */}
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/joinUs" element={<JoinUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/tournaments/results" element={<Result />} />
        <Route path="/tournaments/draws" element={<Draws />} />
        <Route path="/tournaments/drawdisplaysetup" element={<DrawDisplaySetup />} />

        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="/tournaments/drawdisplay" element={<DrawDisplay />} />
      <Route path="/tournaments" element={<Nissan_Home />} />
      <Route path="/tournaments/register" element={<Nissan_Register />} />
      <Route
        path="/tournaments/registered-teams"
        element={<Nissan_RegisteredPlayers />}
      />
      <Route
        path="/tournaments/registered-players"
        element={<Nissan_PlayerList />}
      />
      <Route path="/tournaments/login" element={<Nissan_Login />} />
      <Route path="/tournaments/login/:id" element={<Nissan_Login_Page />} />
      {/* <Route path="*" element={<WrongURL />} /> */}
    </>
  )
);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <Toaster richColors position="top-center" />
    <RouterProvider router={router} />
  </Provider>
);
