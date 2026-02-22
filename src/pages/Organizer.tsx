import { useState } from "react";
import {
  Calendar, Users, DollarSign, Plus, Edit, Trash2, Check, X, Download, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const stats = [
  { label: "Total Events", value: "4", icon: Calendar },
  { label: "Total Delegates", value: "1,050", icon: Users },
  { label: "Total Revenue", value: "₹8,40,000", icon: DollarSign },
];

const events = [
  { id: 1, title: "Delhi International MUN 2026", date: "Mar 15–17", delegates: 450, committees: 12, revenue: "₹5,40,000", status: "Open" },
  { id: 2, title: "Summer Session MUN", date: "Jun 1–3", delegates: 200, committees: 6, revenue: "₹1,60,000", status: "Draft" },
  { id: 3, title: "Youth Parliament Delhi", date: "Aug 20–22", delegates: 300, committees: 8, revenue: "₹1,80,000", status: "Upcoming" },
];

const applications = [
  { name: "Kavya Nair", committee: "UNSC", institution: "Presidency College", status: "Pending" },
  { name: "Siddharth Das", committee: "DISEC", institution: "Jadavpur University", status: "Pending" },
  { name: "Riya Joshi", committee: "WHO", institution: "Fergusson College", status: "Approved" },
];

const Organizer = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy-gradient border-b border-navy-light px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/" className="font-serif text-xl font-bold text-gold-light tracking-wide">AudenaMUN</Link>
            <span className="ml-3 text-xs bg-accent/20 text-gold-light px-2 py-0.5 rounded-full">Organizer</span>
          </div>
          <Link to="/events/create">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark text-xs">
              <Plus className="h-4 w-4 mr-1" /> Create Event
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-card">
              <s.icon className="h-5 w-5 text-accent mb-2" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Events */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h2 className="font-serif text-lg font-bold text-foreground mb-4">Your Events</h2>
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">{e.date} · {e.committees} committees · {e.delegates} delegates</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-accent">{e.revenue}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    e.status === "Open" ? "bg-green-100 text-green-700" :
                    e.status === "Draft" ? "bg-yellow-100 text-yellow-700" :
                    "bg-muted text-muted-foreground"
                  }`}>{e.status}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Applications */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-foreground">Recent Applications</h2>
            <Button size="sm" variant="outline" className="text-xs">
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
          </div>
          <div className="space-y-3">
            {applications.map((app, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-foreground">{app.name}</p>
                  <p className="text-xs text-muted-foreground">{app.committee} · {app.institution}</p>
                </div>
                <div className="flex items-center gap-2">
                  {app.status === "Pending" ? (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 w-7 p-0">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-7 w-7 p-0">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {app.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Organizer;
