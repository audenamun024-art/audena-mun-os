import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { ArrowLeft, Bookmark, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SavedVideos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      const { data: bookmarks } = await supabase
        .from("video_bookmarks")
        .select("video_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const ids = (bookmarks || []).map((b: any) => b.video_id);
      if (!ids.length) { setVideos([]); setLoading(false); return; }
      const { data: vids } = await supabase.from("videos").select("*").in("id", ids);
      // preserve bookmark order
      const sorted = ids.map((id) => (vids || []).find((v: any) => v.id === id)).filter(Boolean);
      setVideos(sorted as any[]);
      setLoading(false);
    };
    void load();
  }, [user]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" /> Saved Videos
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[9/16] rounded-md" />)}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl">
            <Bookmark className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-sm text-foreground">No saved videos yet</p>
            <p className="text-xs text-muted-foreground mt-1">Tap the bookmark icon on any Buzz video to save it.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {videos.map((v) => (
              <div
                key={v.id}
                onClick={() => navigate("/buzz")}
                className="relative aspect-[9/16] bg-secondary rounded-md overflow-hidden cursor-pointer group"
              >
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                ) : (
                  <video src={v.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                )}
                <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded-full p-1">
                  <Play className="h-2.5 w-2.5 text-white fill-white" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SavedVideos;
