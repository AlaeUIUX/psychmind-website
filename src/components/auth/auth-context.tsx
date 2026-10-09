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

/** The provider a session request is going to, and who it's from (request scene). */
export type RequestCard = { name: string; title: string; photoUrl: string | null; from: string; chips: string[]; sent?: boolean };

type AuthPanelState = {
  /** null until the person picks one (Continue stays disabled). */
  role: Role | null;
  setRole: (role: Role | null) => void;
  draft: DraftProfile;
  setDraft: (patch: Partial<DraftProfile>) => void;
  request: RequestCard | null;
  setRequest: (card: RequestCard | null) => void;
};

const AuthPanelContext = createContext<AuthPanelState | null>(null);

export function AuthPanelProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [draft, setDraftState] = useState<DraftProfile>({ firstName: "", lastName: "", businessName: "", displayAsBusiness: false });
  const [request, setRequest] = useState<RequestCard | null>(null);
  const value = useMemo<AuthPanelState>(
    () => ({ role, setRole, draft, setDraft: (patch) => setDraftState((d) => ({ ...d, ...patch })), request, setRequest }),
    [role, draft, request],
  );
  return <AuthPanelContext.Provider value={value}>{children}</AuthPanelContext.Provider>;
}

export function useAuthPanel() {
  const ctx = useContext(AuthPanelContext);
  if (!ctx) throw new Error("useAuthPanel must be used inside AuthPanelProvider");
  return ctx;
}
