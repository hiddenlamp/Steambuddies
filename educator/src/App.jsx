// App.jsx - Educator React Application

import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "./context/ThemeContext";

// Auth pages
import Login from "./pages/auth/Login";
import OurPeoples from "./pages/OurPeoples";

// Educator layout/pages
import EducatorLayout from "./pages/EducatorLayout";
import EducatorDashboard from "./pages/Dashboard";

// Courses (Educator)
import EducatorCourses from "./pages/courses/EducatorCourses";
import NewCourse from "./pages/courses/NewCourse";
import EditCourse from "./pages/courses/CourseEdit";

// Notes (Educator)
import EducatorNotes from "./pages/notes/EducatorNotes";

// School Courses (Educator)
import SchoolCourses from "./pages/SchoolCourses";

// Syllabus (Educator)
import EducatorSyllabus from "./pages/syllabus/EducatorSyllabus";

// Manuals (Educator)
import EducatorManuals from "./pages/manuals/EducatorManuals";
import EducatorManualNew from "./pages/manuals/EducatorManualNew";

// Projects (Educator)
import EducatorProjects from "./pages/projects/EducatorProjects";
import ProjectCreate from "./pages/projects/ProjectCreate";

// Mock Tests (Educator)
import EducatorMockTests from "./pages/mocktests/EducatorMockTests";
import MockTestCreate from "./pages/mocktests/MockTestCreate";
import MockTestManage from "./pages/mocktests/MockTestManage";

// Reports (Educator)
import SubmitReport from "./pages/SubmitReport";

// Challenges & Reels (Educator)
import ManageChallenges from "./pages/challenges/ManageChallenges";
import ManageReels from "./pages/reels/ManageReels";

// Doubts (Educator)
import EducatorDoubts from "./pages/doubts/EducatorDoubts";

// Profile
import Profile from "./pages/Profile";

import "./styles/globals.css";

// Role guard
function RequireEducator({ children }) {
  let user = null;
  try {
    const raw = localStorage.getItem("user");
    user = raw ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "educator" && user.role !== "admin") return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  const { theme } = useContext(ThemeContext);

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen transition-colors duration-300">
        <BrowserRouter>
          <Routes>
            {/* Redirect root to /login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/our-peoples" element={<OurPeoples />} />

            {/* Educator Panel */}
            <Route
              path="/educator"
              element={
                <RequireEducator>
                  <EducatorLayout />
                </RequireEducator>
              }
            >
              <Route index element={<EducatorDashboard />} />

              {/* Courses */}
              <Route path="courses" element={<EducatorCourses />} />
              <Route path="courses/new" element={<NewCourse />} />
              <Route path="courses/:id/edit" element={<EditCourse />} />

              {/* Notes */}
              <Route path="notes" element={<EducatorNotes />} />
              <Route path="notes/new" element={<EducatorNotes />} />

              {/* School Courses */}
              <Route path="school-courses" element={<SchoolCourses />} />

              {/* Syllabus */}
              <Route path="syllabus" element={<EducatorSyllabus />} />
              <Route path="syllabus/new" element={<EducatorSyllabus />} />

              {/* Manuals */}
              <Route path="manuals" element={<EducatorManuals />} />
              <Route path="manuals/new" element={<EducatorManualNew />} />

              {/* Projects */}
              <Route path="projects" element={<EducatorProjects />} />
              <Route path="projects/new" element={<ProjectCreate />} />

              {/* Mock Tests */}
              <Route path="mock-tests" element={<EducatorMockTests />} />
              <Route path="mock-tests/new" element={<MockTestCreate />} />
              <Route path="mock-tests/:id" element={<MockTestManage />} />

              {/* Reports */}
              <Route path="reports/new" element={<SubmitReport />} />

              {/* Challenges */}
              <Route path="challenges" element={<ManageChallenges />} />

              {/* Reels */}
              <Route path="reels" element={<ManageReels />} />

              {/* Profile */}
              <Route path="videos/manage" element={<ManageReels />} />
              <Route path="doubts" element={<EducatorDoubts />} />
              <Route path="profile" element={<Profile />} />
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
