import { useState } from "react";
import {
  Users, Calendar, DollarSign, Shield, Video, AlertTriangle, Globe,
  TrendingUp, ChevronRight, Check, X, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const stats = [
  { label: "Total Organizers", value: "18", icon: Users, trend: "+3 this month" },
  { label: "Total Events", value: "24", icon: Calendar, trend: "+5 this month" },
  { label: "Total Delegates", value: "3,240", icon: Users, trend: "+420 this month" },
  { label: "Platform Revenue", value: "₹2,43,000", icon: DollarSign, trend: "+₹48,000" },
];

const pendingOrganizers = [
  { id: 1, name: "Presidency University", contact: "Dr. S. Roy", email: "admin@presidency.edu" },
  { id: 2, name: "IIT Bombay MUN Society", contact: "Rahul Verma", email: "mun@iitb.ac.in" },
];

const recentEvents = [
  { title: "Delhi International MUN", status: "Live", delegates: 450, revenue: "₹5,40,000" },
  { title: "Mumbai Model UN", status: "Upcoming", delegates: 320, revenue: "₹2,56,000" },
  { title: "National Youth Parliament", status: "Closed", delegates: 280, revenue: "₹1,68,000" },
];

const flaggedContent = [
  { type: "Video", title: "Inappropriate speech clip", reporter: "System", severity: "High" },
  { type: "Profile", title: "Fake delegate account", reporter: "User Report", severity: "Medium" },
];

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy-gradient border-b border-navy-light px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/" className="font-serif text-xl font-bold text-gold-light tracking-wide">
              AudenaMUN
            </Link>
            <span className="ml-3 text-xs bg-accent/20 text-gold-light px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" className="text-gold-light hover:bg-navy-light text-xs">
              <Globe className="h-4 w-4 mr-1" /> Research Logs
            </Button>
            <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs">
              <AlertTriangle className="h-4 w-4 mr-1" /> Trigger Crisis
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="h-5 w-5 text-accent" />
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-[10px] text-green-600 mt-1">{s.trend}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Organizers */}
          <section className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h2 className="font-serif text-lg font-bold text-foreground mb-4">Pending Organizer Approvals</h2>
            <div className="space-y-3">
              {pendingOrganizers.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-foreground">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.contact} · {org.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 w-7 p-0">
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-7 w-7 p-0">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Events */}
          <section className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h2 className="font-serif text-lg font-bold text-foreground mb-4">Recent Events</h2>
            <div className="space-y-3">
              {recentEvents.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.delegates} delegates · {e.revenue}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    e.status === "Live" ? "bg-green-100 text-green-700" :
                    e.status === "Upcoming" ? "bg-accent/20 text-accent" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Flagged Content */}
          <section className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h2 className="font-serif text-lg font-bold text-foreground mb-4">Flagged Content</h2>
            <div className="space-y-3">
              {flaggedContent.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.type} · Reported by {item.reporter}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.severity === "High" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {item.severity}
                    </span>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Revenue */}
          <section className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h2 className="font-serif text-lg font-bold text-foreground mb-4">Revenue Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: "Platform Fees (₹25/delegate)", value: "₹81,000", pct: "33%" },
                { label: "Event Registration", value: "₹1,62,000", pct: "67%" },
              ].map((r, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{r.label}</p>
                    <p className="text-sm font-bold text-accent">{r.value}</p>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gold-gradient rounded-full" style={{ width: r.pct }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Admin;
