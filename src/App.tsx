import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Community from "./pages/Community";
import Courses from "./pages/Courses";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import CourseDetail from "./pages/CourseDetail";
import LessonPlayer from "./pages/LessonPlayer";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseControl from "./pages/admin/AdminCourseControl";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTeamDetail from "./pages/admin/AdminTeamDetail";
import AdminTeams from "./pages/admin/AdminTeams";
import NotFound from "./pages/NotFound";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import { AuthRouteGuard } from "@/components/AuthRouteGuard";
import { useGlobalProtection } from "@/hooks/useGlobalProtection";

const queryClient = new QueryClient();

const App = () => {
  useGlobalProtection();

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <AuthRouteGuard>
                    <Dashboard />
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/community"
                element={
                  <AuthRouteGuard>
                    <Community />
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/course/:courseId"
                element={
                  <AuthRouteGuard>
                    <CourseDetail />
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/course/:courseId/lesson/:lessonId"
                element={
                  <AuthRouteGuard>
                    <LessonPlayer />
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/courses"
                element={
                  <AuthRouteGuard>
                    <Courses />
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/progress"
                element={
                  <AuthRouteGuard>
                    <Progress />
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/settings"
                element={
                  <AuthRouteGuard>
                    <Settings />
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/profile"
                element={
                  <AuthRouteGuard>
                    <Profile />
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/admin"
                element={
                  <AuthRouteGuard>
                    <AdminRouteGuard>
                      <Admin />
                    </AdminRouteGuard>
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AuthRouteGuard>
                    <AdminRouteGuard>
                      <AdminDashboard />
                    </AdminRouteGuard>
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <AuthRouteGuard>
                    <AdminRouteGuard>
                      <AdminCourses />
                    </AdminRouteGuard>
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/admin/members"
                element={
                  <AuthRouteGuard>
                    <AdminRouteGuard>
                      <AdminMembers />
                    </AdminRouteGuard>
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AuthRouteGuard>
                    <AdminRouteGuard>
                      <AdminSettings />
                    </AdminRouteGuard>
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/admin/course-control"
                element={
                  <AuthRouteGuard>
                    <AdminRouteGuard>
                      <AdminCourseControl />
                    </AdminRouteGuard>
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/admin/teams"
                element={
                  <AuthRouteGuard>
                    <AdminRouteGuard>
                      <AdminTeams />
                    </AdminRouteGuard>
                  </AuthRouteGuard>
                }
              />
              <Route
                path="/admin/teams/:teamId"
                element={
                  <AuthRouteGuard>
                    <AdminRouteGuard>
                      <AdminTeamDetail />
                    </AdminRouteGuard>
                  </AuthRouteGuard>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
