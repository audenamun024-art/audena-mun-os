import { useState, useRef } from "react";
import { X, Upload, Video, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const categories = ["Best Speech", "Crisis Reaction", "Debate Moment", "Award"];
const MAX_FILE_SIZE_MB = 100;

type Props = {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
  userId: string;
};

const BuzzUploadModal = ({ open, onClose, onUploaded, userId }: Props) => {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Best Speech");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Max file size is ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setFile(selected);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setThumbnailFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error("Please add a title and select a video");
      return;
    }
    setUploading(true);
    setProgress(10);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const videoPath = `${userId}/buzz/${Date.now()}_video.${ext}`;
      setProgress(20);

      const { error: uploadErr } = await supabase.storage
        .from("uploads")
        .upload(videoPath, file, { contentType: file.type, cacheControl: "3600" });
      if (uploadErr) throw uploadErr;
      setProgress(60);

      const { data: videoUrlData } = supabase.storage.from("uploads").getPublicUrl(videoPath);
      const videoUrl = videoUrlData.publicUrl;

      let thumbnailUrl = "";
      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split(".").pop() || "jpg";
        const thumbPath = `${userId}/buzz/${Date.now()}_thumb.${thumbExt}`;
        await supabase.storage.from("uploads").upload(thumbPath, thumbnailFile, { contentType: thumbnailFile.type });
        const { data: thumbUrlData } = supabase.storage.from("uploads").getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      }
      setProgress(75);

      const { error: insertErr } = await supabase.from("videos").insert({
        user_id: userId,
        title: `${title.trim()}${caption.trim() ? ` — ${caption.trim()}` : ""}`,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        category,
      });
      if (insertErr) throw insertErr;
      setProgress(90);

      const { data: tasks } = await supabase
        .from("user_tasks").select("id, points").eq("active", true).eq("category", "buzz").limit(1);
      if (tasks && tasks.length > 0) {
        const task = tasks[0];
        const { data: existing } = await supabase
          .from("task_completions").select("id").eq("user_id", userId).eq("task_id", task.id).maybeSingle();
        if (!existing) {
          await supabase.from("task_completions").insert({ user_id: userId, task_id: task.id, points_awarded: task.points });
          const { data: profile } = await supabase.from("profiles").select("rank_points").eq("user_id", userId).maybeSingle();
          if (profile) {
            await supabase.from("profiles").update({ rank_points: (profile.rank_points || 0) + task.points }).eq("user_id", userId);
          }
          toast.success(`+${task.points} points earned for completing a Buzz task!`);
        }
      }

      setProgress(100);
      setDone(true);
      toast.success("Video posted to Buzz!");
      setTimeout(() => { onUploaded(); resetForm(); onClose(); }, 1200);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setCaption(""); setCategory("Best Speech");
    setFile(null); setThumbnailFile(null); setThumbnailPreview(null);
    setProgress(0); setDone(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-[10%] z-[95] max-w-lg mx-auto bg-card rounded-2xl border border-border shadow-elevated overflow-hidden max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-base font-bold text-foreground">Create Buzz Post</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Video File *</Label>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl border border-border">
                <Video className="h-8 w-8 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => fileRef.current?.click()}>Change</Button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tap to select video (max {MAX_FILE_SIZE_MB}MB)</p>
              </button>
            )}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Thumbnail (optional)</Label>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailSelect} />
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-32 object-cover rounded-xl border border-border" />
              ) : (
                <div className="w-full h-20 border border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary/50 transition-colors">
                  <p className="text-xs text-muted-foreground">+ Add cover image</p>
                </div>
              )}
            </label>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Best speech on climate action" className="mt-1 bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Caption</Label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Share context about your video..." className="mt-1 bg-secondary border-border min-h-[60px]" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    category === cat ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                  }`}>{cat}</button>
              ))}
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">
                {progress < 60 ? "Uploading video..." : progress < 90 ? "Saving post..." : "Almost done..."}
              </p>
            </div>
          )}

          {done && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Check className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-success">Posted successfully!</span>
            </div>
          )}

          <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold h-11" onClick={handleUpload} disabled={uploading || done}>
            {uploading ? "Uploading..." : done ? "Done!" : "Post to Buzz"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default BuzzUploadModal;
