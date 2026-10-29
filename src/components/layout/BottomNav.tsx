"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, MessageSquare, Scan, Shield, User, Users } from "lucide-react";

const navItems = [
  { href: "/",            icon: Home,          label: "Home"      },
  { href: "/discover",    icon: Compass,       label: "Discover"  },
  { href: "/scan",        icon: Scan,          label: "Scan"      },
  { href: "/communities", icon: Users,         label: "Community" },
  { href: "/profile",     icon: User,          label: "Profile"   },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.75}
              style={{
                filter: isActive
                  ? "drop-shadow(0 0 6px rgba(232,168,56,0.6))"
                  : undefined,
              }}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
