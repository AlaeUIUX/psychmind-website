import Link from "next/link";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { MIN_AGE } from "@/lib/age";
import { AuthTitle } from "./fields";

// Shown after an under-age answer on the age screen, and for a day after on
// this browser (AGE_BLOCK_COOKIE). Someone under 18 looking for help still
// gets a way to it: a trusted adult, and 988. TODO(client): copy.
export function AgeBlocked() {
  return (
    <div className="flex flex-col gap-6" data-testid="age-blocked">
      <AuthTitle
        title="PsychMind accounts are for adults"
        description={`You need to be ${MIN_AGE} or older to create an account.`}
      />
      <p className="type-ui-body text-warm-600">
        If you&apos;re under {MIN_AGE}, a parent or guardian can look for a provider with you. A school counselor or your
        doctor can also help you find support.
      </p>
      <CrisisStrip />
      <Link href="/" className="w-fit type-ui-small text-warm-500 underline underline-offset-2 hover:text-warm-900">
        Back to PsychMind
      </Link>
    </div>
  );
}
