import { useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import type { ButtonProps } from "@calcom/ui";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  showToast,
  DialogFooter,
  DialogClose,
} from "@calcom/ui";
import { Trash, AlertCircle } from "@calcom/ui/components/icon";

export default function DisconnectIntegration({
  credentialId,
  label,
  trashIcon,
  isGlobal,
  onSuccess,
  buttonProps,
  disableOverlay,
  item
}: {
  credentialId: number;
  label?: string;
  trashIcon?: boolean;
  isGlobal?: boolean;
  onSuccess?: (item: any) => void;
  buttonProps?: ButtonProps;
  disableOverlay?: boolean;
  item?:any;
}) {
  const { t } = useLocale();
  const [modalOpen, setModalOpen] = useState(false);
  const utils = trpc.useContext();

  const mutation = trpc.viewer.deleteCredential.useMutation({
    onSuccess: () => {
      showToast(t("app_removed_successfully"), "success");
      setModalOpen(false);
      onSuccess && onSuccess(item);
    },
    onError: () => {
      showToast(t("error_removing_app"), "error");
      setModalOpen(false);
      if(disableOverlay) {
        const message = {
          source: 'calendar-settings-frame',
          type: 'calendar-deletion-failed'
        }
        window.parent.postMessage(message, '*')
      }
    },
    async onSettled() {
      await utils.viewer.connectedCalendars.invalidate();
    },
  });
  
  const onConfirm = ()=>{
    if(disableOverlay) {
      const message = {
        source: 'calendar-settings-frame',
        type: 'initiate-calendar-deletion'
      }
      window.parent.postMessage(message, '*')
    }
    mutation.mutate({ id: credentialId })
  }

  return (
    <>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogTrigger asChild>
          <Button
            color={buttonProps?.color || "transparent"}
            StartIcon={trashIcon ? Trash : undefined}
            size="base"
            variant={trashIcon && !label ? "icon" : "button"}
            disabled={isGlobal}
            {...buttonProps}>
            {label && label}
          </Button>
        </DialogTrigger>
        <DialogContent
          title={t("remove_app")}
          description={t("are_you_sure_you_want_to_remove_this_app")}
          type="confirmation"
          className='sm:max-w-[340px]'>
          <DialogFooter>
            <DialogClose onClick={() => setModalOpen(false)} />
            <DialogClose color="primary" onClick={onConfirm}>
              {t("Confirm")}
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
