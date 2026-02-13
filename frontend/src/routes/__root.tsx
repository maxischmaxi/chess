import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <nav
        style={{
          padding: "12px 24px",
          background: "#0f3460",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Link
          to="/"
          style={{
            color: "#e0e0e0",
            textDecoration: "none",
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          Chess
        </Link>
      </nav>
      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
