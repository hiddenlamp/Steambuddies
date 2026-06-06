// router.jsx - Educator React Router Definition

import { createBrowserRouter } from "react-router-dom";

import EducatorLayout from "./pages/EducatorLayout";
import EducatorDashboard from "./pages/Dashboard";
import SchoolCourses from "./pages/SchoolCourses";

const router = createBrowserRouter([
  {
    path: "/",
    element: <EducatorLayout />,
    children: [
      { path: "/", element: <EducatorDashboard /> },
      { path: "/school-courses", element: <SchoolCourses /> },
    ],
  },
]);

export default router;
