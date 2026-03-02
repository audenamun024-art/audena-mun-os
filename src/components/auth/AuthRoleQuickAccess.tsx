import { LucideIcon } from "lucide-react";

export type TestRoleAccount = {
  role: string;
  icon: LucideIcon;
  email: string;
  password: string;
  description: string;
};

type AuthRoleQuickAccessProps = {
  roles: TestRoleAccount[];
  loading: boolean;
  onRoleSelect: (role: TestRoleAccount) => void;
};

const AuthRoleQuickAccess = ({ roles, loading, onRoleSelect }: AuthRoleQuickAccessProps) => {
  return (
    <div className="mb-5 animate-fade-in">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3 text-center">
        Quick Access — Test Roles
      </p>
      <div className="grid grid-cols-2 gap-2">
        {roles.map((acc) => (
          <button
            key={acc.role}
            onClick={() => onRoleSelect(acc)}
            disabled={loading}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-secondary hover:border-accent/40 hover:bg-secondary/80 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <acc.icon className="h-4.5 w-4.5 text-accent" />
            </div>
            <span className="text-xs font-semibold text-foreground">{acc.role}</span>
            <span className="text-[9px] text-muted-foreground leading-tight text-center">{acc.description}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground">or sign in manually</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
};

export default AuthRoleQuickAccess;
