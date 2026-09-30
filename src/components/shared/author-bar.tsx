import type { ReactNode } from "react";
import { ShareButtons } from "./share-buttons";

type AuthorBarProps = {
  name: string;
  role?: string;
  /** Avatar(s) shown before the name. */
  avatar?: ReactNode;
};

// Closing row of every long-form page: who wrote it, and how to share it.
export function AuthorBar({ name, role, avatar }: AuthorBarProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-6 border-t border-warm-200 pt-6">
      <div className="flex items-center gap-3">
        {avatar}
        <div className="flex flex-col type-body">
          <span className="font-semibold text-text-primary">{name}</span>
          {role && <span className="text-text-tertiary">{role}</span>}
        </div>
      </div>
      <ShareButtons />
    </div>
  );
}
