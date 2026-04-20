import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle2, AlertTriangle } from "lucide-react";

export interface ScreenshotSubmission {
  studentName: string;
  registerNumber: string;
  taskName: string;
  file: File | null;
  fileDataUrl: string | null;
  hasHtml: boolean;
  hasCss: boolean;
  hasOutput: boolean;
}

interface Props {
  taskName: string;
  value: ScreenshotSubmission;
  onChange: (next: ScreenshotSubmission) => void;
  disabled?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const SubmissionUpload = ({ taskName, value, onChange, disabled }: Props) => {
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) {
      onChange({ ...value, file: null, fileDataUrl: null });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image (PNG/JPG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File too large (max 5MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...value, file, fileDataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const allChecked = value.hasHtml && value.hasCss && value.hasOutput;
  const allFilled =
    value.studentName.trim() &&
    value.registerNumber.trim() &&
    value.taskName.trim() &&
    value.file &&
    allChecked;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" /> Submission Screenshot
        </CardTitle>
        <CardDescription className="text-xs">
          Upload a single screenshot containing your <strong>HTML code</strong>,{" "}
          <strong>CSS code</strong>, <strong>rendered output</strong>, your{" "}
          <strong>name</strong>, <strong>register number</strong>, and{" "}
          <strong>task name</strong>. Missing components result in automatic <strong>FAIL</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="sub-name" className="text-xs">Student Name *</Label>
            <Input id="sub-name" value={value.studentName} disabled={disabled}
              onChange={(e) => onChange({ ...value, studentName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="sub-reg" className="text-xs">Register Number *</Label>
            <Input id="sub-reg" value={value.registerNumber} disabled={disabled}
              onChange={(e) => onChange({ ...value, registerNumber: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="sub-task" className="text-xs">Task Name *</Label>
            <Input id="sub-task" value={value.taskName || taskName} disabled={disabled}
              onChange={(e) => onChange({ ...value, taskName: e.target.value })} />
          </div>
        </div>

        <div>
          <Label className="text-xs mb-2 block">Screenshot file *</Label>
          {!value.fileDataUrl ? (
            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/40 transition-colors ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
              <Upload className="h-6 w-6 text-muted-foreground mb-2" />
              <span className="text-sm">Click to upload screenshot</span>
              <span className="text-xs text-muted-foreground mt-1">PNG or JPG, max 5MB</span>
              <input type="file" accept="image/png,image/jpeg" className="hidden" disabled={disabled}
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </label>
          ) : (
            <div className="relative inline-block">
              <img src={value.fileDataUrl} alt="Submission preview" className="max-h-60 rounded-lg border" />
              {!disabled && (
                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                  onClick={() => handleFile(null)}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>

        <div>
          <Label className="text-xs mb-2 block">Confirm screenshot contents *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { key: "hasHtml" as const, label: "HTML code visible" },
              { key: "hasCss" as const, label: "CSS code visible" },
              { key: "hasOutput" as const, label: "Rendered output visible" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-xs bg-muted/40 p-2 rounded-md cursor-pointer">
                <input type="checkbox" checked={value[key]} disabled={disabled}
                  onChange={(e) => onChange({ ...value, [key]: e.target.checked })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={`flex items-center gap-2 text-xs p-2 rounded-md ${allFilled ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-orange-500/10 text-orange-700 dark:text-orange-400"}`}>
          {allFilled ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>
            {allFilled
              ? "All submission components present."
              : "All fields, screenshot, and component checks are required to pass."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubmissionUpload;
