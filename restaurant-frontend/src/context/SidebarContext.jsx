import { createContext, useContext, useState, useMemo, useCallback } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
    const [collapsed, setCollapsed] = useState(false);

    const toggle = useCallback(() => setCollapsed((c) => !c), []);

    const value = useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);

    return (
        <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
    );
}

export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
    return ctx;
}
