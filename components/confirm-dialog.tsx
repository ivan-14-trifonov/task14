import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui"
import { DialogButton } from "@/components/dialog-button"

export function ConfirmDialog({
  title,
  text,
  action,
  id,
}: {
  title: string
  text: string
  action: (formData: FormData) => Promise<void>
  id: string
}) {
  return (
    <DialogButton
      title={title}
      label={
        <>
          <Trash2 className="size-4" />
          Удалить
        </>
      }
      variant="ghost"
    >
      <form action={action} className="grid gap-4">
        <input type="hidden" name="id" value={id} />
        <p className="text-sm text-muted-foreground">{text}</p>
        <Button type="submit" variant="danger">
          <Trash2 className="size-4" />
          Удалить
        </Button>
      </form>
    </DialogButton>
  )
}
