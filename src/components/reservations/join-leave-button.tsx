"use client";

import { useActionState } from "react";
import { joinGame, leaveGame } from "@/server/actions/matchmaking";
import type { ActionState } from "@/server/actions/reservation";
import { Button } from "@/components/ui/button";

type Props = {
  reservationId: string;
  mode: "join" | "leave";
  disabled?: boolean;
  disabledReason?: string;
};

export function JoinLeaveButton({
  reservationId,
  mode,
  disabled,
  disabledReason,
}: Props) {
  const action = mode === "join" ? joinGame : leaveGame;
  const [state, formAction, pending] = useActionState<
    ActionState | undefined,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="reservationId" value={reservationId} />
      <Button
        type="submit"
        size="sm"
        variant={mode === "leave" ? "outline" : "default"}
        disabled={pending || disabled}
        title={disabled ? disabledReason : undefined}
      >
        {pending
          ? mode === "join"
            ? "Přihlašuji…"
            : "Odhlašuji…"
          : mode === "join"
            ? "Přihlásit se"
            : "Odhlásit se"}
      </Button>
      {state?.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
