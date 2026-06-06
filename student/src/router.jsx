// router.jsx - Student React Router Definition

import { createBrowserRouter } from "react-router-dom";

import Splash from "./pages/onboarding/Splash";
import Welcome from "./pages/onboarding/Welcome";
import LanguageSelect from "./pages/onboarding/LanguageSelect";
import RoleSelect from "./pages/onboarding/RoleSelect";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Home from "./pages/home/Home";
import Courses from "./pages/courses/Courses";
import MockTest from "./pages/mocktests/MockTest";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/settings/Settings";

const router = createBrowserRouter([
  { path: "/", element: <Splash /> },
  { path: "/welcome", element: <Welcome /> },
  { path: "/language", element: <LanguageSelect /> },
  { path: "/role", element: <RoleSelect /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  { path: "/home", element: <Home /> },
  { path: "/courses", element: <Courses /> },
  { path: "/mock-tests", element: <MockTest /> },
  { path: "/profile", element: <Profile /> },
  { path: "/settings", element: <Settings /> },
]);

export default router;
