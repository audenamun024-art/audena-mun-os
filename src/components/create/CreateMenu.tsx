import { Play, Image as ImageIcon, Calendar, X } from "lucide-react";
import { useUserType } from "@/hooks/useUserType";

type Choice = "buzz" | "drops" | "event";

const CreateMenu = ({
  open,
  onClose,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  onChoose: (c: Choice) => void;
}) => {
  const { isOrganization } = useUserType();
  if (!open) return null;

  const items: { key: Choice; label: string; description: string; icon: any }[] = [
    { key: "buzz", label: "Buzz", description: "Share a short video reel", icon: Play },
    { key: "drops", label: "Drops", description: "Post an image or thought", icon: ImageIcon },
  ];
  if (isOrganization) {
    items.push({ key: "event", label: "Create Event", description: "Publish a new MUN event", icon: Calendar });
  }

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-x-4 bottom-20 md:inset-x-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-sm md:mx-auto z-[95] glass-panel rounded-2xl p-2 shadow-elevated animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between p-2 mb-1">
          <h3 className="font-display font-bold text-foreground text-sm">Create</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => { onChoose(it.key); onClose(); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <it.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{it.label}</p>
                <p className="text-[11px] text-muted-foreground">{it.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default CreateMenu;
