import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const FeatureRequestDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!request.trim() || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("feature_requests").insert({
        user_id: user.id,
        title: request.trim().slice(0, 100),
        description: request.trim(),
      });
      if (error) throw error;
      toast({ title: "Feature requested! ✨", description: "We'll review your suggestion soon." });
      setRequest("");
      setOpen(false);
    } catch {
      toast({ title: "Error", description: "Could not submit request.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
          title="Request a feature"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Request a Feature
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Describe the feature you'd like to see. Be as specific as you want!
          </p>
          <Textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder='e.g. "Add a daily quiz feature" or "Create a coding contest mode"'
            className="min-h-[120px] resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{request.length}/500</span>
            <Button onClick={handleSubmit} disabled={!request.trim() || submitting} size="sm">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureRequestDialog;
