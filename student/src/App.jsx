// App.jsx - Student React Application

import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "./context/ThemeContext";

// Onboarding pages
import Splash from "./pages/onboarding/Splash";
import Welcome from "./pages/onboarding/Welcome";
import LanguageSelect from "./pages/onboarding/LanguageSelect";
import RoleSelect from "./pages/onboarding/RoleSelect";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Student pages
import Home from "./pages/home/Home";
import Courses from "./pages/courses/Courses";
import CourseDetails from "./pages/courses/CourseDetails";
import Profile from "./pages/profile/Profile";
import Notes from "./pages/notes/Notes";
import Projects from "./pages/projects/Projects";
import Syllabus from "./pages/syllabus/Syllabus";
import Quest from "./pages/quest/Quest";
import Books from "./pages/books/Books";
import MockTest from "./pages/mocktests/MockTest";
import Manual from "./pages/manuals/Manual";
import SolarSystem from "./pages/science/SolarSystem";
import HumanBody from "./pages/science/HumanBody";
import RoboticsLab from "./pages/science/RoboticsLab";
import MoleculesLab from "./pages/science/MoleculesLab";
import Settings from "./pages/settings/Settings";

// Student navigation
import Navigation from "./components/navigation/Navigation";

import "./styles/globals.css";

// Student layout (Bottom Nav)
function MainLayout() {
  return (
    <>
      <Outlet />
      <Navigation />
    </>
  );
}

export default function App() {
  const { theme } = useContext(ThemeContext);

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen transition-colors duration-300">
        <BrowserRouter>
          <Routes>
            {/* Onboarding */}
            <Route path="/" element={<Splash />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/language" element={<LanguageSelect />} />
            <Route path="/role" element={<RoleSelect />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Forgot / Reset */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Student UI */}
            <Route element={<MainLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<CourseDetails />} />
              <Route path="/manuals" element={<Manual />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/syllabus" element={<Syllabus />} />
              <Route path="/quest" element={<Quest />} />
              <Route path="/books" element={<Books />} />
              <Route path="/solar-system" element={<SolarSystem />} />
              <Route path="/human-body" element={<HumanBody />} />
              <Route path="/robotics-lab" element={<RoboticsLab />} />
              <Route path="/molecules-lab" element={<MoleculesLab />} />
              <Route path="/mock-tests" element={<MockTest />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* 404 */}
            <Route
              path="*"
              element={<div className="p-10 text-center text-2xl font-bold">404 • Page Not Found</div>}
            />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
