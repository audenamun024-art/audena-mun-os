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
        ​Welcome to the BEST MUN PLATFORM      
      </p>
      <div className="grid grid-cols-2 gap-2">
        {roles.map((acc) => {}












        )}
      </div>
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border" />
        
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>);

};

export default AuthRoleQuickAccess;