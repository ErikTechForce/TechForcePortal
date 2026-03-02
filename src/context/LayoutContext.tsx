import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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

  const value = useMemo(
    () => ({ mobileMenuOpen, setMobileMenuOpen, closeMobileMenu, toggleMobileMenu }),
    [mobileMenuOpen, closeMobileMenu, toggleMobileMenu]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) return null;
  return ctx;
}
