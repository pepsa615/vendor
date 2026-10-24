import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout.tsx";
import { PublicLayout } from "../layouts/PublicLayout.tsx";
import { RouteLoading } from "../components/shared/RouteLoading.tsx";
import { RouteError } from "../pages/RouteError.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";
import { ProtectedRoute } from "./ProtectedRoute.tsx";
import { ApprovedRoute } from "./ApprovedRoute.tsx";

/* Route modules intentionally export configuration, not refreshable components. */
/* oxlint-disable react/only-export-components */

const Login = lazy(() => import("../pages/LoginPage.tsx"));
const Registration = lazy(() => import("../pages/RegistrationPage.tsx"));
const Verification = lazy(() => import("../pages/VerificationPage.tsx"));
const Onboarding = lazy(() => import("../pages/OnboardingPage.tsx"));
const ThankYou = lazy(() => import("../pages/ThankYouPage.tsx"));
const ReviewStatus = lazy(() => import("../pages/ReviewStatusPage.tsx"));
const Invitation = lazy(() => import("../pages/InvitationPage.tsx"));
const PublicOrder = lazy(() => import("../pages/PublicOrderPage.tsx"));
const Staff = lazy(() => import("../pages/StaffPage.tsx"));
const Roles = lazy(() => import("../pages/RolesPage.tsx"));
const ProfileSettings = lazy(() => import("../pages/ProfileSettingsPage.tsx"));
const Dashboard = lazy(() => import("../pages/DashboardPage.tsx"));
const Operations = lazy(() => import("../pages/OperationsPage.tsx"));
const Manifest = lazy(() => import("../pages/ManifestPage.tsx"));
const OpenDispatch = lazy(() => import("../pages/OpenDispatchPage.tsx"));
const Account = lazy(() => import("../pages/AccountPage.tsx"));
const People = lazy(() => import("../pages/PeoplePage.tsx"));
const Dispatchers = lazy(() => import("../pages/DispatchersPage.tsx"));
const DispatcherForm = lazy(() => import("../pages/DispatcherFormPage.tsx"));
const DispatcherDetail = lazy(
  () => import("../pages/DispatcherDetailPage.tsx"),
);
const Customers = lazy(() => import("../pages/CustomersPage.tsx"));
const Settings = lazy(() => import("../pages/SettingsPage.tsx"));
const UiKit = lazy(() => import("../pages/UiKitPage.tsx"));
const suspended = (element: React.ReactNode) => (
  <Suspense fallback={<RouteLoading />}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { path: "/login", element: suspended(<Login />) },
      { path: "/register", element: suspended(<Registration />) },
      { path: "/verify-email", element: suspended(<Verification />) },
      { path: "/invitation", element: suspended(<Invitation />) },
      { path: "/order/:slug", element: suspended(<PublicOrder />) },
      { path: "/ui-kit", element: suspended(<UiKit />) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/onboarding/:step", element: suspended(<Onboarding />) },
      { path: "/review-status", element: suspended(<ReviewStatus />) },
      { path: "/thank-you", element: suspended(<ThankYou />) },
      {
        element: <ApprovedRoute />,
        children: [
          {
            element: <AppLayout />,
            errorElement: <RouteError />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: "/dashboard", element: suspended(<Dashboard />) },
              { path: "/operations", element: suspended(<Operations />) },
              { path: "/manifest", element: suspended(<Manifest />) },
              { path: "/open-dispatch", element: suspended(<OpenDispatch />) },
              { path: "/account", element: suspended(<Account />) },
              {
                path: "/people",
                element: suspended(<People />),
                children: [
                  {
                    index: true,
                    element: <Navigate to="dispatchers" replace />,
                  },
                  {
                    path: "dispatchers",
                    element: suspended(<Dispatchers />),
                  },
                  {
                    path: "dispatchers/new",
                    element: suspended(<DispatcherForm />),
                  },
                  {
                    path: "dispatchers/:id",
                    element: suspended(<DispatcherDetail />),
                  },
                  {
                    path: "customers",
                    element: suspended(<Customers />),
                  },
                  { path: "staff", element: suspended(<Staff />) },
                ],
              },
              { path: "/settings", element: suspended(<Settings />) },
              { path: "/settings/roles", element: suspended(<Roles />) },
              {
                path: "/settings/profile",
                element: suspended(<ProfileSettings />),
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
