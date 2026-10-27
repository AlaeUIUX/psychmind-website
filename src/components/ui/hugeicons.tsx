import {
  AlertCircleIcon,
  Alert02Icon,
  ArrowDown01Icon,
  ArrowDownRight01Icon,
  ArrowExpand01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  ArrowUp02Icon,
  ArrowUpDownIcon,
  ArrowUpRight01Icon,
  Building03Icon,
  BulbIcon,
  Calendar03Icon,
  CalendarLove01Icon,
  Call02Icon,
  Camera01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  ChartColumnIcon as HugeChartColumnIcon,
  ChartLineData01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  CircleIcon as HugeCircleIcon,
  Clock01Icon,
  CloudUploadIcon,
  ComputerIcon,
  Copy01Icon,
  Database01Icon,
  Delete02Icon,
  DollarCircleIcon,
  Download04Icon,
  FavouriteIcon,
  File01Icon,
  File02Icon,
  FilterHorizontalIcon,
  Globe02Icon,
  HashtagIcon,
  InboxIcon as HugeInboxIcon,
  InformationCircleIcon,
  JusticeScale01Icon,
  Key01Icon,
  LabsIcon,
  LifebuoyIcon,
  Link01Icon,
  LinkSquare02Icon,
  Loading03Icon,
  Location01Icon,
  Logout01Icon,
  Mail01Icon,
  MailValidation01Icon,
  Menu01Icon,
  MessageLock01Icon,
  MinusSignIcon,
  MoreHorizontalIcon,
  Mortarboard02Icon,
  Notification01Icon,
  PencilEdit01Icon,
  PauseIcon as HugePauseIcon,
  PencilEdit02Icon,
  PlayIcon as HugePlayIcon,
  PlusSignIcon,
  PreferenceHorizontalIcon,
  RecordIcon,
  Refresh01Icon,
  Search01Icon,
  SearchAddIcon,
  SearchMinusIcon,
  SecurityCheckIcon,
  SentIcon,
  Share08Icon,
  Shield01Icon,
  SparklesIcon as HugeSparklesIcon,
  SquareLock02Icon,
  StarIcon as HugeStarIcon,
  Table01Icon,
  Tick02Icon,
  TwoFactorAccessIcon,
  Upload04Icon,
  UserAdd01Icon,
  UserIcon as HugeUserIcon,
  UserLock01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  VolumeHighIcon,
  VolumeOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from "@hugeicons/react";
import { cn } from "cn";

// The app's line icons: Hugeicons Stroke Rounded (the free set), 1.5px.
// Exported under the Lucide names the app was written with, so call sites
// read the same and keep sizing through className (`size-4`, `[&_svg]:size-*`)
// and color through currentColor. `fill-current` still fills the shape (the
// saved heart, a radio dot), as with Lucide.
//
// The site's own drawn icons (search, phone, send and friends) live in ./icons.

type IconProps = Omit<HugeiconsIconProps, "icon" | "altIcon">;

function icon(svg: IconSvgElement, name: string) {
  // Decorative unless labelled, like Lucide.
  function Icon(props: IconProps) {
    return <HugeiconsIcon icon={svg} aria-hidden={props["aria-label"] ? undefined : true} {...props} />;
  }
  Icon.displayName = name;
  return Icon;
}

// Arrows and chevrons (Hugeicons' 01 is the chevron, 02 the arrow).
export const ArrowDownRightIcon = icon(ArrowDownRight01Icon, "ArrowDownRightIcon");
export const ArrowDownUpIcon = icon(ArrowUpDownIcon, "ArrowDownUpIcon");
export const ArrowLeftIcon = icon(ArrowLeft02Icon, "ArrowLeftIcon");
export const ArrowRightIcon = icon(ArrowRight02Icon, "ArrowRightIcon");
export const ArrowUpIcon = icon(ArrowUp02Icon, "ArrowUpIcon");
export const ArrowUpRightIcon = icon(ArrowUpRight01Icon, "ArrowUpRightIcon");
export const ChevronDownIcon = icon(ArrowDown01Icon, "ChevronDownIcon");
export const ChevronLeftIcon = icon(ArrowLeft01Icon, "ChevronLeftIcon");
export const ChevronRightIcon = icon(ArrowRight01Icon, "ChevronRightIcon");
export const ChevronRight = ChevronRightIcon;
export const ChevronUpIcon = icon(ArrowUp01Icon, "ChevronUpIcon");
export const ExternalLinkIcon = icon(LinkSquare02Icon, "ExternalLinkIcon");
export const Maximize2Icon = icon(ArrowExpand01Icon, "Maximize2Icon");

/** The calls to action's arrow, a plain arrow right: inside a Button it nudges
 *  forward on hover. */
export function CtaArrowIcon({ className, ...props }: IconProps) {
  return <ArrowRightIcon className={cn("group-hover/button:translate-x-0.5", className)} {...props} />;
}
export const RotateCwIcon = icon(Refresh01Icon, "RotateCwIcon");

// Actions.
export const CheckIcon = icon(Tick02Icon, "CheckIcon");
export const Check = CheckIcon;
export const CopyIcon = icon(Copy01Icon, "CopyIcon");
export const Copy = CopyIcon;
export const DownloadIcon = icon(Download04Icon, "DownloadIcon");
export const LinkIcon = icon(Link01Icon, "LinkIcon");
export const ListFilterIcon = icon(FilterHorizontalIcon, "ListFilterIcon");
export const LogOutIcon = icon(Logout01Icon, "LogOutIcon");
export const MenuIcon = icon(Menu01Icon, "MenuIcon");
export const MinusIcon = icon(MinusSignIcon, "MinusIcon");
export const MoreHorizontal = icon(MoreHorizontalIcon, "MoreHorizontal");
export const PencilIcon = icon(PencilEdit01Icon, "PencilIcon");
export const PencilLineIcon = icon(PencilEdit02Icon, "PencilLineIcon");
export const PauseIcon = icon(HugePauseIcon, "PauseIcon");
export const PlayIcon = icon(HugePlayIcon, "PlayIcon");
export const PlusIcon = icon(PlusSignIcon, "PlusIcon");
export const SearchIcon = icon(Search01Icon, "SearchIcon");
export const SendIcon = icon(SentIcon, "SendIcon");
export const Share2Icon = icon(Share08Icon, "Share2Icon");
export const SlidersHorizontalIcon = icon(PreferenceHorizontalIcon, "SlidersHorizontalIcon");
export const Trash2Icon = icon(Delete02Icon, "Trash2Icon");
export const UploadCloudIcon = icon(CloudUploadIcon, "UploadCloudIcon");
export const UploadIcon = icon(Upload04Icon, "UploadIcon");
export const Volume2Icon = icon(VolumeHighIcon, "Volume2Icon");
export const VolumeXIcon = icon(VolumeOffIcon, "VolumeXIcon");
export const XIcon = icon(Cancel01Icon, "XIcon");
export const ZoomInIcon = icon(SearchAddIcon, "ZoomInIcon");
export const ZoomOutIcon = icon(SearchMinusIcon, "ZoomOutIcon");

// Status and feedback.
export const CheckCircle2Icon = icon(CheckmarkCircle02Icon, "CheckCircle2Icon");
export const CircleCheckIcon = CheckCircle2Icon;
export const CircleAlertIcon = icon(AlertCircleIcon, "CircleAlertIcon");
export const CircleXIcon = icon(CancelCircleIcon, "CircleXIcon");
export const XCircleIcon = CircleXIcon;
export const OctagonXIcon = CircleXIcon;
export const InfoIcon = icon(InformationCircleIcon, "InfoIcon");
export const TriangleAlertIcon = icon(Alert02Icon, "TriangleAlertIcon");
export const LoaderCircleIcon = icon(Loading03Icon, "LoaderCircleIcon");
export const Loader2Icon = LoaderCircleIcon;
export const CircleIcon = icon(HugeCircleIcon, "CircleIcon");
export const CircleDotIcon = icon(RecordIcon, "CircleDotIcon");

// People and accounts.
export const UserIcon = icon(HugeUserIcon, "UserIcon");
export const UserRoundIcon = UserIcon;
export const UserKeyIcon = icon(UserLock01Icon, "UserKeyIcon");
export const UserPlusIcon = icon(UserAdd01Icon, "UserPlusIcon");
export const KeyRoundIcon = icon(Key01Icon, "KeyRoundIcon");
export const LockIcon = icon(SquareLock02Icon, "LockIcon");
export const EyeIcon = icon(ViewIcon, "EyeIcon");
export const EyeOffIcon = icon(ViewOffSlashIcon, "EyeOffIcon");
export const BadgeCheckIcon = icon(CheckmarkBadge01Icon, "BadgeCheckIcon");
export const ShieldIcon = icon(Shield01Icon, "ShieldIcon");
export const ShieldCheckIcon = icon(SecurityCheckIcon, "ShieldCheckIcon");
export const MessageSquareLockIcon = icon(MessageLock01Icon, "MessageSquareLockIcon");
export const TwoFactorIcon = icon(TwoFactorAccessIcon, "TwoFactorIcon"); // no Lucide twin

// Things.
export const BellIcon = icon(Notification01Icon, "BellIcon");
export const BuildingIcon = icon(Building03Icon, "BuildingIcon");
export const CalendarIcon = icon(Calendar03Icon, "CalendarIcon");
export const CalendarHeartIcon = icon(CalendarLove01Icon, "CalendarHeartIcon");
export const CameraIcon = icon(Camera01Icon, "CameraIcon");
export const ChartColumnIcon = icon(HugeChartColumnIcon, "ChartColumnIcon");
export const ChartLineIcon = icon(ChartLineData01Icon, "ChartLineIcon");
export const CircleDollarSignIcon = icon(DollarCircleIcon, "CircleDollarSignIcon");
export const ClockIcon = icon(Clock01Icon, "ClockIcon");
export const DatabaseIcon = icon(Database01Icon, "DatabaseIcon");
export const FileIcon = icon(File01Icon, "FileIcon");
export const FileTextIcon = icon(File02Icon, "FileTextIcon");
export const FlaskConicalIcon = icon(LabsIcon, "FlaskConicalIcon");
export const GlobeIcon = icon(Globe02Icon, "GlobeIcon");
export const GraduationCapIcon = icon(Mortarboard02Icon, "GraduationCapIcon");
export const HashIcon = icon(HashtagIcon, "HashIcon");
export const HeartIcon = icon(FavouriteIcon, "HeartIcon");
export const InboxIcon = icon(HugeInboxIcon, "InboxIcon");
export const LifeBuoyIcon = icon(LifebuoyIcon, "LifeBuoyIcon");
export const LightbulbIcon = icon(BulbIcon, "LightbulbIcon");
export const MailIcon = icon(Mail01Icon, "MailIcon");
export const MailCheckIcon = icon(MailValidation01Icon, "MailCheckIcon");
export const MapPinIcon = icon(Location01Icon, "MapPinIcon");
export const MonitorIcon = icon(ComputerIcon, "MonitorIcon");
export const PhoneIcon = icon(Call02Icon, "PhoneIcon");
export const ScaleIcon = icon(JusticeScale01Icon, "ScaleIcon");
export const SparklesIcon = icon(HugeSparklesIcon, "SparklesIcon");
export const StarIcon = icon(HugeStarIcon, "StarIcon");
export const TableIcon = icon(Table01Icon, "TableIcon");
