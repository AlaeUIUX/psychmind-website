"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// Lets the auth forms talk to the portal panel beside them: the role being
// chosen, and the name a provider is typing (shown live on their profile card).

export type DraftProfile = {
  firstName: string;
  lastName: string;
  businessName: string;
  displayAsBusiness: boolean;
};

type Role = "patient" | "provider";

type AuthPanelState = {
  /** null until the person picks one (Continue stays disabled). */
  role: Role | null;
  setRole: (role: Role | null) => void;
  draft: DraftProfile;
  setDraft: (patch: Partial<DraftProfile>) => void;
};

const AuthPanelContext = createContext<AuthPanelState | null>(null);

export function AuthPanelProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [draft, setDraftState] = useState<DraftProfile>({ firstName: "", lastName: "", businessName: "", displayAsBusiness: false });
  const value = useMemo<AuthPanelState>(
    () => ({ role, setRole, draft, setDraft: (patch) => setDraftState((d) => ({ ...d, ...patch })) }),
    [role, draft],
  );
  return <AuthPanelContext.Provider value={value}>{children}</AuthPanelContext.Provider>;
}

export function useAuthPanel() {
  const ctx = useContext(AuthPanelContext);
  if (!ctx) throw new Error("useAuthPanel must be used inside AuthPanelProvider");
  return ctx;
}
