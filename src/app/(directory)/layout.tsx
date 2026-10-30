import type { ReactNode } from "react";
import { DirectoryChrome } from "@/components/directory/directory-chrome";

// The directory: search results and public provider profiles.
export default function DirectoryLayout({ children }: { children: ReactNode }) {
  return <DirectoryChrome>{children}</DirectoryChrome>;
}
