"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/check");
        const data = await res.json();

        if (data.authenticated) {
          setIsAuthenticated(true);
        } else if (pathname !== "/login") {
          router.push("/login");
        }
      } catch {
        if (pathname !== "/login") {
          router.push("/login");
        }
      } finally {
        setIsChecking(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  // Don't show anything while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  // On login page, always show content
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Elsewhere, only show if authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
