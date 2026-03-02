import React, { createContext, useContext, useState, useCallback } from 'react';

interface LayoutContextValue {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((prev) => !prev), []);

  return (
    <LayoutContext.Provider
      value={{ mobileMenuOpen, setMobileMenuOpen, closeMobileMenu, toggleMobileMenu }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) return null;
  return ctx;
}
