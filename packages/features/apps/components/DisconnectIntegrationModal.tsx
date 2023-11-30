import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Dialog, DialogContent, showToast, DialogFooter, DialogClose } from "@calcom/ui";
import { AlertCircle } from "@calcom/ui/components/icon";

interface DisconnectIntegrationModalProps {
  credentialId: number | null;
  isOpen: boolean;
  handleModelClose: () => void;
  item: any;
}

export default function DisconnectIntegrationModal({
  credentialId,
  isOpen,
  handleModelClose,
  item
}: DisconnectIntegrationModalProps) {
  const { t } = useLocale();
  const utils = trpc.useContext();

  const mutation = trpc.viewer.deleteCredential.useMutation({
    onSuccess: () => {
      showToast(t("app_removed_successfully"), "success");
      handleModelClose();
      const message = {
        source: 'calendar-settings-frame',
        type: 'conference-deleted',
        conferenceInfo:item
      }
      window.parent.postMessage(message, '*')
      utils.viewer.integrations.invalidate();
      utils.viewer.connectedCalendars.invalidate();
    },
    onError: () => {
      const message = {
        source: 'calendar-settings-frame',
        type: 'conference-deletion-failed'
      }
      window.parent.postMessage(message, '*')
      showToast(t("error_removing_app"), "error");
      handleModelClose();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleModelClose}>
      <DialogContent
        title={t("remove_app")}
        description={t("are_you_sure_you_want_to_remove_this_app")}
        type="confirmation"
        className='sm:max-w-[340px]'>
        <DialogFooter>
          <DialogClose onClick={handleModelClose} />
          <DialogClose
            color="primary"
            onClick={() => {
              if (credentialId) {
                const message = {
                  source: 'calendar-settings-frame',
                  type: 'initiate-conference-deletion'
                }
                window.parent.postMessage(message, '*')
                mutation.mutate({ id: credentialId });
              }
            }}>
            {t("Confirm")}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
