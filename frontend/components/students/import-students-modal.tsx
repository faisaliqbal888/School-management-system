"use client"

import { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2, Upload } from "lucide-react"
import { useImportStudents, type ImportReport } from "@/lib/hooks/use-students"

const TEMPLATE_HEADER =
  "name,email,date_of_birth,gender,guardian_name,guardian_relation,guardian_phone"
const TEMPLATE_ROWS = [
  "Ayesha Khan,ayesha.khan@example.com,2012-04-18,FEMALE,Tariq Khan,Father,03001234567",
  "Bilal Ahmed,bilal.ahmed@example.com,2011-09-02,MALE,Nadia Ahmed,Mother,03007654321",
]

/** Downloads the CSV template the importer expects (columns + two example rows). */
export function downloadImportTemplate(): void {
  const csv = [TEMPLATE_HEADER, ...TEMPLATE_ROWS].join("\r\n") + "\r\n"
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "students-import-template.csv"
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

interface ImportStudentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a real (non dry-run) import created at least one student. */
  onImported?: () => void
}

export function ImportStudentsModal({ open, onOpenChange, onImported }: ImportStudentsModalProps) {
  const importStudents = useImportStudents()
  const fileInput = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState("")
  const [csvText, setCsvText] = useState("")
  const [report, setReport] = useState<ImportReport | null>(null)
  const [busy, setBusy] = useState<"check" | "import" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setFileName("")
    setCsvText("")
    setReport(null)
    setError(null)
    setBusy(null)
    if (fileInput.current) fileInput.current.value = ""
  }

  const handleClose = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleFile = async (file: File | undefined) => {
    setError(null)
    setReport(null)
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError("That file is larger than 2 MB. Split it into smaller batches.")
      return
    }
    if (!/\.csv$/i.test(file.name)) {
      setError("Please choose a .csv file. Excel files can be saved as CSV from File → Save as.")
      return
    }
    try {
      const text = await file.text()
      setFileName(file.name)
      setCsvText(text)
    } catch {
      setError("Could not read that file.")
    }
  }

  const run = async (dryRun: boolean) => {
    if (!csvText.trim()) {
      setError("Choose a CSV file first.")
      return
    }
    setBusy(dryRun ? "check" : "import")
    setError(null)
    try {
      const result = await importStudents({ csv: csvText, dryRun })
      setReport(result)
      if (dryRun) {
        toast.success("Check complete", {
          description: `${result.imported} row(s) ready, ${result.skipped} need attention`,
        })
      } else {
        toast.success(`Imported ${result.imported} student(s)`, {
          description: result.skipped > 0 ? `${result.skipped} row(s) were skipped` : "All rows imported",
        })
        if (result.imported > 0) onImported?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setBusy(null)
    }
  }

  const checked = report?.dryRun === true
  const canImport = checked && report !== null && report.imported > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV, run the check to see every problem per row, then import the rows that pass.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="csv-file" className="sr-only">
                CSV file
              </Label>
              <Input
                id="csv-file"
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => void handleFile(e.target.files?.[0])}
                className="max-w-sm cursor-pointer"
              />
              <Button type="button" variant="outline" size="sm" onClick={downloadImportTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Required columns: name, email, date_of_birth, gender, guardian_name, guardian_relation,
              guardian_phone. Dates accept YYYY-MM-DD or DD/MM/YYYY. Max 2 MB.
            </p>
            {fileName && (
              <p className="flex items-center gap-2 text-xs font-medium">
                <FileUp className="h-3.5 w-3.5" />
                {fileName}
              </p>
            )}
          </div>

          {report && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={report.skipped > 0 ? "secondary" : "default"}>
                  {report.dryRun ? "Check result" : "Imported"}
                </Badge>
                <span>{report.total} row(s) read</span>
                <span className="text-emerald-600">· {report.imported} ok</span>
                {report.skipped > 0 && <span className="text-destructive">· {report.skipped} skipped</span>}
              </div>

              {report.errors.length > 0 && (
                <div className="max-h-52 overflow-y-auto rounded-md border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-2">Row</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Problem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.errors.map((e) => (
                        <tr key={`${e.row}-${e.email}`} className="border-t">
                          <td className="p-2 font-mono">{e.row}</td>
                          <td className="p-2 break-all">{e.email}</td>
                          <td className="p-2">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {report.sample && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    First account: <strong>{report.sample.email}</strong> · temporary password{" "}
                    <code className="rounded bg-muted px-1">{report.sample.temporaryPassword}</code> — share it
                    securely and ask the student to change it.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => handleClose(false)} disabled={busy !== null}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={() => void run(true)} disabled={busy !== null || !csvText}>
            {busy === "check" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Check rows
          </Button>
          <Button type="button" onClick={() => void run(false)} disabled={busy !== null || !canImport}>
            {busy === "import" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import {canImport ? `${report.imported} student(s)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
