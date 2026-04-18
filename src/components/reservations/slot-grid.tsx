import { cn } from "@/lib/utils";
import type { DaySlot } from "@/lib/time";

type SlotState = "free" | "reserved" | "own" | "past";

type Props = {
  slots: DaySlot[];
  states: SlotState[];
  selectedStart?: string;
  onSelectName?: string; // name pro form radio
};

const STATE_LABEL: Record<SlotState, string> = {
  free: "volné",
  reserved: "obsazeno",
  own: "vaše",
  past: "uplynulé",
};

// Server komponenta – pouze pro zobrazení. Interakce řeší client SlotPicker.
export function SlotGrid({ slots, states }: Props) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
      {slots.map((s, i) => {
        const st = states[i];
        return (
          <div
            key={s.startLabel}
            data-state={st}
            title={STATE_LABEL[st]}
            className={cn(
              "rounded-md border px-2 py-1.5 text-center text-xs",
              st === "free" &&
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
              st === "reserved" &&
                "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200",
              st === "own" &&
                "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200",
              st === "past" &&
                "border-muted bg-muted/40 text-muted-foreground",
            )}
          >
            {s.startLabel}
          </div>
        );
      })}
    </div>
  );
}

export type { SlotState };
