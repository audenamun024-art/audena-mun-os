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
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary hover:border-accent/40 transition-all text-left group disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors shrink-0">
              <acc.icon className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">{acc.role}</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">{acc.description}</p>
            </div>
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
