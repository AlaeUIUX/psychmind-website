import { cn } from "cn";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  /** Figma's dashboard trail, e.g. Analytics › Sara Oliisi. The last crumb is the current page. */
  breadcrumbs?: Crumb[];
  title: ReactNode;
  /** A status chip beside the title (Figma D1's "Live"). */
  badge?: ReactNode;
  description?: ReactNode;
  /** Buttons aligned to the right from `sm` up. */
  actions?: ReactNode;
  className?: string;
};

// Breadcrumb → title → subtitle, the top of every app page (portal type).
export function PageHeader({ breadcrumbs, title, badge, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${i}`}>
                  <BreadcrumbItem>
                    {last || !crumb.href ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!last && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          {badge ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="type-ui-display text-text-primary">{title}</h1>
              {badge}
            </div>
          ) : (
            <h1 className="type-ui-display text-text-primary">{title}</h1>
          )}
          {description && <p className="max-w-[640px] type-ui-body text-text-tertiary">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
