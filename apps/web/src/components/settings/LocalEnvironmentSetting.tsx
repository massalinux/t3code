import { thrownErrorMessage } from "@t3tools/client-runtime/errors";
import { resolveEnvironmentIcon } from "@t3tools/contracts";
import { m } from "~/i18n/messages";
import type { EnvironmentPresentation } from "~/state/environments";
import { T, useGT } from "gt-react";
import { EllipsisIcon } from "lucide-react";
import { useState } from "react";

import { isLocalEnvironmentDisabled } from "../../localEnvironment";
import { EnvironmentMachineIcon } from "../EnvironmentMachineIcon";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Menu, MenuPopup, MenuTrigger } from "../ui/menu";
import { Spinner } from "../ui/spinner";
import { Switch } from "../ui/switch";
import { EnvironmentIconMenu } from "./EnvironmentIconPicker";
import { SettingsRow } from "./settingsLayout";
import { useSearchableSetting } from "./settingsSearch";

// Toggling relaunches desktop; the switch reflects startup state.
export function LocalEnvironmentSetting({
  environment,
}: {
  readonly environment: Pick<EnvironmentPresentation, "environmentId" | "serverConfig"> | null;
}) {
  const searchableSetting = useSearchableSetting();
  const gt = useGT();
  const setEnabled = window.desktopBridge?.setLocalEnvironmentEnabled;
  const [enabled] = useState(() => !isLocalEnvironmentDisabled());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!setEnabled) return null;

  const setting = searchableSetting("local-environment");
  const serverConfig = environment?.serverConfig ?? null;
  const applyChange = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      await setEnabled(!enabled);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? (thrownErrorMessage(cause, m) ?? cause.message)
          : gt("Couldn't change this setting."),
      );
      setIsUpdating(false);
    }
  };

  return (
    <>
      <SettingsRow
        {...setting}
        title={
          <span className="inline-flex items-center gap-2">
            {enabled ? (
              <EnvironmentMachineIcon
                aria-hidden
                kind={serverConfig ? resolveEnvironmentIcon(serverConfig) : "desktop"}
                className="size-3.5 shrink-0 text-muted-foreground"
              />
            ) : null}
            {setting.title}
          </span>
        }
        description={
          enabled
            ? gt(
                "Run agents on this computer. Turn off to use T3 Code only with remote environments.",
              )
            : gt("Turned off. Agents only run in remote environments.")
        }
        control={
          <div className="flex items-center gap-1">
            <Switch
              checked={enabled}
              disabled={isUpdating}
              onCheckedChange={() => setConfirmOpen(true)}
              aria-label={setting.title}
            />
            {enabled && environment ? (
              <Menu>
                <MenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost-muted"
                      size="icon-xs"
                      aria-label={gt("More actions for {label}", { label: setting.title })}
                    />
                  }
                >
                  <EllipsisIcon className="size-3.5" />
                </MenuTrigger>
                <MenuPopup align="end">
                  <EnvironmentIconMenu
                    environmentId={environment.environmentId}
                    serverConfig={serverConfig}
                  />
                </MenuPopup>
              </Menu>
            ) : null}
          </div>
        }
      />
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (isUpdating) return;
          setConfirmOpen(open);
          if (!open) setError(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {enabled ? gt("Turn off local environment?") : gt("Turn on local environment?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {enabled
                ? gt(
                    "T3 Code will restart without running a server on this computer. Any agents and terminals running here will stop, and other devices will no longer be able to connect to this computer. Your projects, history, and remote environments are unaffected.",
                  )
                : gt("T3 Code will restart and start running a server on this computer again.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? <p className="px-6 pb-4 text-sm text-destructive">{error}</p> : null}
          <AlertDialogFooter>
            <AlertDialogClose disabled={isUpdating} render={<Button variant="outline" />}>
              <T>Cancel</T>
            </AlertDialogClose>
            <Button
              variant={enabled ? "destructive" : "default"}
              disabled={isUpdating}
              onClick={() => void applyChange()}
            >
              {isUpdating ? (
                <>
                  <Spinner size="sm" />
                  <T>Restarting…</T>
                </>
              ) : enabled ? (
                gt("Restart and turn off")
              ) : (
                gt("Restart and turn on")
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
