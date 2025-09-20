import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineName: string;
  onConfirm: () => void;
  isActive?: boolean;
}

export const DeleteRoutineDialog = ({
  open,
  onOpenChange,
  routineName,
  onConfirm,
  isActive = false,
}: DeleteRoutineDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Routine</AlertDialogTitle>
          <AlertDialogDescription>
            {isActive ? (
              <>
                This routine is currently active and assigned to you. Deleting it will remove it from your active routines.
                <br /><br />
                Are you sure you want to delete "{routineName}"? This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete "{routineName}"? This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Routine
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

