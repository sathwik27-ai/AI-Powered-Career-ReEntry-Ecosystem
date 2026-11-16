import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppNavbar } from "./AppNavbar";
import { RoleSidebar } from "./RoleSidebar";

export function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AppNavbar
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        sidebarOpen={mobileSidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden w-64 shrink-0 md:block">
          <RoleSidebar />
        </div>

        {/* Mobile Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative flex w-72 flex-1 flex-col bg-surface shadow-pop z-50">
              <RoleSidebar onClose={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
