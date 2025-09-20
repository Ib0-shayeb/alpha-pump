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

interface EditRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineName: string;
  onEditRoutine: () => void;
  onCopyAndEdit: () => void;
}

export const EditRoutineDialog = ({
  open,
  onOpenChange,
  routineName,
  onEditRoutine,
  onCopyAndEdit,
}: EditRoutineDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Routine</AlertDialogTitle>
          <AlertDialogDescription>
            Editing a routine changes active assigned routines. Are you sure you want to edit "{routineName}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onCopyAndEdit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Copy and Edit
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onEditRoutine}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Edit Routine
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

