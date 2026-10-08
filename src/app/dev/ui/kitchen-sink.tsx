"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { ChoiceChips } from "@/components/app/choice-chips";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { PageHeader } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { StatusBanner } from "@/components/app/status-banner";
import { StepProgress } from "@/components/app/step-progress";
import { UploadDropzone, type UploadItem } from "@/components/app/upload-dropzone";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DoodleCheck, DoodleMagnifier } from "@/components/ui/doodles";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { CircleArrowIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Demo content only — option lists here are samples, not the approved taxonomy.
const specialties = ["Anxiety", "Depression", "Trauma & PTSD", "Relationships", "Grief", "ADHD", "Stress", "Self-esteem"].map(
  (label) => ({ value: label.toLowerCase(), label }),
);
const states = ["Arizona", "California", "Colorado", "New York", "Texas", "Washington"];

function Block({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <section className="flex flex-col gap-5 rounded-card border border-warm-200 bg-white p-5 sm:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="type-h4 text-text-primary">{title}</h2>
        {note && <p className="type-small text-text-tertiary">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function KitchenSink() {
  const [chips, setChips] = useState<string[]>(["anxiety", "trauma & ptsd"]);
  const [files, setFiles] = useState<UploadItem[]>([
    { id: "1", name: "Texas-LPC-license.pdf", size: 812_000, status: "done" },
    { id: "2", name: "NY-license-scan.jpg", size: 2_400_000, status: "error", error: "Upload failed. Check your connection and retry." },
  ]);
  const [state, setState] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  const fakeUpload = (list: File[]) => {
    for (const file of list) {
      const id = crypto.randomUUID();
      setFiles((f) => [...f, { id, name: file.name, size: file.size, status: "uploading", progress: 0 }]);
      const t = window.setInterval(() => {
        setFiles((f) =>
          f.map((item) => {
            if (item.id !== id) return item;
            const progress = Math.min(100, (item.progress ?? 0) + 18);
            if (progress >= 100) clearInterval(t);
            return { ...item, progress, status: progress >= 100 ? "done" : "uploading" };
          }),
        );
      }, 250);
      timers.current.push(t);
    }
  };

  return (
    <AppShell
      homeHref="/dev/ui"
      nav={[
        { href: "/dev/ui", label: "UI kit" },
        { href: "/dev/ui#forms", label: "Forms" },
        { href: "/dev/ui#feedback", label: "Feedback" },
        { href: "/dev/ui#overlays", label: "Overlays" },
      ]}
      user={{ name: "Sara Oliisi", email: "sara@example.com", menu: [{ href: "/dev/ui", label: "Settings" }] }}
      onSignOut={() => toast("Signed out (demo)")}
      banner={
        <StatusBanner
          tone="warning"
          countdown="3 days left"
          title="Your payment didn't go through"
          action={
            <Button size="sm" variant="primary">
              Update payment
            </Button>
          }
        >
          Update your card to stay visible in search. Demo banner.
        </StatusBanner>
      }
    >
      <PageHeader
        breadcrumbs={[{ label: "Dev", href: "/dev/ui" }, { label: "UI kit" }]}
        title="App UI kit"
        description="shadcn/ui components themed with the landing-page tokens, plus the PsychMind app components. Every state, desktop and 375px."
        actions={
          <Button variant="brand" size="md">
            Primary action
            <CircleArrowIcon />
          </Button>
        }
      />

      <Block title="Buttons" note="PsychMind variants first, then the shadcn aliases.">
        <Row>
          <Button>Primary</Button>
          <Button variant="brand">Brand</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button disabled aria-busy>
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Saving…
          </Button>
        </Row>
        <Row>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">
            Large
            <CircleArrowIcon />
          </Button>
        </Row>
      </Block>

      <Block title="Form fields" note="Inline errors are linked to their input with aria-describedby.">
        <div id="forms" className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="first">
              First name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="first" placeholder="Sara" />
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" defaultValue="sara@" aria-invalid aria-describedby="email-error" />
            <FieldError id="email-error">Enter a valid email address.</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="state">Licensed state</FieldLabel>
            <Select>
              <SelectTrigger id="state" className="w-full">
                <SelectValue placeholder="Choose a state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field data-disabled="true">
            <FieldLabel htmlFor="npi">NPI (locked)</FieldLabel>
            <Input id="npi" disabled defaultValue="1234567890" />
            <FieldDescription>Locked while your license is under review.</FieldDescription>
          </Field>
          <Field className="sm:col-span-2">
            <div className="flex items-baseline justify-between">
              <FieldLabel htmlFor="bio">Your story</FieldLabel>
              <span className="type-small text-text-placeholder">Optional</span>
            </div>
            <Textarea id="bio" placeholder="Tell people how you work…" />
            <FieldDescription>Up to 600 characters.</FieldDescription>
          </Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <p className="type-small font-medium text-text-primary">Session format</p>
            <RadioGroup defaultValue="online">
              <label className="flex items-center gap-2 type-small">
                <RadioGroupItem value="online" /> Online
              </label>
              <label className="flex items-center gap-2 type-small">
                <RadioGroupItem value="in-person" /> In person
              </label>
              <label className="flex items-center gap-2 type-small">
                <RadioGroupItem value="both" /> Both
              </label>
            </RadioGroup>
          </div>
          <div className="flex flex-col gap-3">
            <p className="type-small font-medium text-text-primary">Checkboxes</p>
            <label className="flex items-center gap-2 type-small">
              <Checkbox defaultChecked /> Sliding scale available
            </label>
            <label className="flex items-center gap-2 type-small">
              <Checkbox /> I confirm my license is current
            </label>
            <label className="flex items-center gap-2 type-small text-text-placeholder">
              <Checkbox disabled /> Disabled
            </label>
          </div>
          <div className="flex flex-col gap-3">
            <p className="type-small font-medium text-text-primary">Switch</p>
            <label className="flex items-center gap-3 type-small">
              <Switch defaultChecked /> Accepting new clients
            </label>
            <label className="flex items-center gap-3 type-small">
              <Switch /> Email me weekly stats
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="type-small font-medium text-text-primary">
            Choice chips <span className="font-normal text-text-placeholder">(up to 5)</span>
          </p>
          <ChoiceChips label="Specialties" options={specialties} value={chips} onValueChange={setChips} max={5} />
        </div>
        <div className="flex flex-col gap-3">
          <p className="type-small font-medium text-text-primary">Combobox (command + popover)</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" className="w-full justify-between sm:w-72">
                {state ?? "Search a state…"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search a state…" />
                <CommandList>
                  <CommandEmpty>No state found.</CommandEmpty>
                  <CommandGroup>
                    {states.map((s) => (
                      <CommandItem key={s} value={s} onSelect={() => setState(s)}>
                        {s}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </Block>

      <Block title="Upload" note="Type and size checked before upload; progress, error with retry, remove.">
        <UploadDropzone
          label="Upload your license"
          hint="PDF, JPG or PNG, up to 10 MB"
          accept={["application/pdf", "image/jpeg", "image/png"]}
          maxBytes={10 * 1024 * 1024}
          multiple
          files={files}
          onFiles={fakeUpload}
          onRemove={(id) => setFiles((f) => f.filter((x) => x.id !== id))}
          onRetry={(id) => setFiles((f) => f.map((x) => (x.id === id ? { ...x, status: "done", error: undefined } : x)))}
        />
      </Block>

      <Block title="Status" note="Badges pair a tint with text so status never relies on colour alone.">
        <Row>
          <Badge variant="neutral">Draft</Badge>
          <Badge variant="info">In review</Badge>
          <Badge variant="warning">Changes requested</Badge>
          <Badge variant="success">Live</Badge>
          <Badge variant="danger">Paused</Badge>
          <Badge variant="brand">New</Badge>
          <Badge>Default</Badge>
          <Badge variant="outline">Outline</Badge>
        </Row>
        <div id="feedback" className="flex flex-col gap-3">
          <StatusBanner tone="info" title="Your profile is being reviewed">
            We check every license by hand. This usually takes 1–2 business days.
          </StatusBanner>
          <StatusBanner tone="success" title="You're live again" />
          <StatusBanner
            tone="danger"
            title="Your profile is hidden from search"
            action={
              <Button size="sm" variant="primary">
                Pay now
              </Button>
            }
          >
            Pay your open invoice and you&apos;ll be visible again right away.
          </StatusBanner>
        </div>
        <StepProgress current={3} total={7} label="Your expertise" className="max-w-sm" />
      </Block>

      <Block title="Range and disclosure" note="Search filters: a two-thumb price range, and a list that reveals more options.">
        <div className="flex max-w-sm flex-col gap-6">
          <Slider defaultValue={[120, 350]} min={60} max={500} step={10} aria-label="Price per session" />
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                +3 more
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 flex flex-col gap-2 type-small text-text-secondary">
              <span>Grief &amp; loss</span>
              <span>Burnout</span>
              <span>Cultural identity</span>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </Block>

      <Block title="Keyboard shortcuts" note="Geist-style key caps. meta is ⌘ on Apple devices, Ctrl elsewhere.">
        <Row>
          <Kbd meta>↵</Kbd>
          <Kbd meta>K</Kbd>
          <Kbd meta shift>P</Kbd>
          <Kbd>Esc</Kbd>
          <Kbd small>/</Kbd>
        </Row>
      </Block>

      <Block title="Toasts">
        <Row>
          <Button variant="secondary" onClick={() => toast.success("Changes saved")}>
            Success
          </Button>
          <Button variant="secondary" onClick={() => toast.error("Couldn't save. Try again.")}>
            Error
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast("Removed from saved", { action: { label: "Undo", onClick: () => toast("Restored") } })}
          >
            With undo
          </Button>
        </Row>
      </Block>

      <Block title="Overlays">
        <Row>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upgrade your plan</DialogTitle>
                <DialogDescription>Add more practice locations to your profile.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button>Continue</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary">Confirm dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark this request as not a fit?</AlertDialogTitle>
                <AlertDialogDescription>The person will see that you can&apos;t take them on.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Mark as not a fit</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Filter sheet</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85svh] rounded-t-card">
              <SheetHeader>
                <SheetTitle>Search filters</SheetTitle>
                <SheetDescription>Mobile filters slide up from the bottom.</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">
                <ChoiceChips label="Specialties" options={specialties} value={chips} onValueChange={setChips} />
              </div>
            </SheetContent>
          </Sheet>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>We verify every license by hand.</TooltipContent>
          </Tooltip>
        </Row>
        <div id="overlays" />
      </Block>

      <Block title="Tabs and table">
        <Tabs defaultValue="new">
          <TabsList>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="contacted">Contacted</TabsTrigger>
            <TabsTrigger value="not-a-fit">Not a fit</TabsTrigger>
          </TabsList>
          <TabsContent value="new" className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["J. M.", "Online", "2h ago", "New"],
                  ["A. R.", "In person", "Yesterday", "Viewed"],
                ].map(([who, format, when, status]) => (
                  <TableRow key={who}>
                    <TableCell className="font-medium">{who}</TableCell>
                    <TableCell>{format}</TableCell>
                    <TableCell>{when}</TableCell>
                    <TableCell>
                      <Badge variant={status === "New" ? "brand" : "neutral"}>{status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="contacted" className="pt-4">
            <EmptyState art={<DoodleCheck className="size-7" />} title="No contacted requests yet">
              Requests you&apos;ve reached out to will show here.
            </EmptyState>
          </TabsContent>
          <TabsContent value="not-a-fit" className="pt-4">
            <ErrorState onRetry={() => toast("Retrying…")} />
          </TabsContent>
        </Tabs>
      </Block>

      <Block title="Analytics tiles">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Impressions" value="1,284" delta={12} hint="vs last 30 days" />
          <StatTile label="Profile views" value="312" delta={4} hint="vs last 30 days" />
          <StatTile label="Saves" value="41" delta={-3} hint="vs last 30 days" />
          <StatTile label="Session requests" value="24" />
        </div>
      </Block>

      <Block title="Loading, empty, error">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-card border border-warm-200 p-5">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <EmptyState art={<DoodleMagnifier className="size-10" />} title="No saved providers yet" className="py-8">
            Tap the heart on a profile to keep it here.
          </EmptyState>
          <ErrorState className="py-8" onRetry={() => toast("Retrying…")} />
        </div>
      </Block>

      <CrisisStrip />
    </AppShell>
  );
}
