"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Scan, User, Users } from "lucide-react";

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
    <div className="wl-scope wl-bottom-nav-root">
      <nav className="wl-bottom-nav" aria-label="Main navigation">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`wl-bottom-nav-item ${isActive ? "is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.75} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (min-width: 861px) {
          .wl-bottom-nav-root {
            display: none !important;
          }
        }

        @media (max-width: 860px) {
          body {
            padding-bottom: calc(68px + env(safe-area-inset-bottom, 0px));
          }

          .wl-bottom-nav-root {
            display: block;
          }

          .wl-bottom-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 30;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px));
            background: var(--panel);
            backdrop-filter: blur(22px) saturate(140%);
            -webkit-backdrop-filter: blur(22px) saturate(140%);
            border-top: 1px solid var(--line);
            box-sizing: border-box;
          }

          .wl-bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 6px 0;
            border-radius: 10px;
            font-size: 11.5px;
            color: var(--soft);
            text-decoration: none;
            transition: color 0.25s ease, background 0.25s ease;
            cursor: pointer;
            user-select: none;
          }

          .wl-bottom-nav-item:hover {
            color: #ffffff;
          }

          .wl-bottom-nav-item.is-active {
            color: #ffffff;
            background: var(--hover);
          }
        }
      `}</style>
    </div>
  );
}
