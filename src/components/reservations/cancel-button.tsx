"use client";

import { useActionState } from "react";
import { cancelReservation, type ActionState } from "@/server/actions/reservation";
import { Button } from "@/components/ui/button";

type Props = {
  reservationId: string;
};

export function CancelButton({ reservationId }: Props) {
  const [state, formAction, pending] = useActionState<
    ActionState | undefined,
    FormData
  >(cancelReservation, undefined);

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="reservationId" value={reservationId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
      >
        {pending ? "Ruším…" : "Zrušit"}
      </Button>
      {state?.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
