import { useRef, useState } from "react";
import { X, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { uploadPublicFile } from "@/lib/storage";
import { toast } from "sonner";

const PostUploadModal = ({
  open,
  onClose,
  onUploaded,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
  userId: string;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) { toast.error("Pick an image first"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const url = await uploadPublicFile({
        path: `${userId}/posts/${Date.now()}.${ext}`,
        file, onProgress: setProgress,
      });
      const { error } = await supabase.from("posts").insert({
        user_id: userId, image_url: url, caption: caption || null,
      });
      if (error) throw error;
      toast.success("Drop posted!");
      setFile(null); setPreview(null); setCaption(""); setProgress(0);
      onUploaded?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-16 md:inset-x-0 md:max-w-md md:mx-auto z-[95] glass-panel rounded-2xl p-5 shadow-elevated max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground">New Drop</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
        {preview ? (
          <img src={preview} alt="" className="w-full max-h-72 object-cover rounded-xl mb-3" />
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors mb-3">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tap to select an image</p>
          </button>
        )}
        <Textarea
          placeholder="Write a caption…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="bg-card border-border rounded-xl mb-3"
          rows={3}
        />
        {uploading && progress > 0 && <Progress value={progress} className="h-2 mb-3" />}
        <div className="flex gap-2">
          {preview && (
            <Button variant="outline" className="rounded-xl" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-1" /> Change
            </Button>
          )}
          <Button className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl" onClick={handleSubmit} disabled={uploading || !file}>
            {uploading ? "Posting…" : "Post Drop"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default PostUploadModal;
