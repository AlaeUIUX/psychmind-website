import type { ReactNode } from "react";
import { DirectoryChrome } from "@/components/directory/directory-chrome";

// A provider's own profile preview, in the public profile's page.
export default function ProviderPreviewLayout({ children }: { children: ReactNode }) {
  return <DirectoryChrome>{children}</DirectoryChrome>;
}
