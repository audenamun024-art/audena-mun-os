import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { startCashfreePayment } from "@/lib/cashfree";

type Props = {
  open: boolean;
  onClose: () => void;
  amount: number;
  title: string;
  description?: string;
  eventId?: string | null;
  purpose?: string;
  onSuccess?: () => void;
};

const CashfreePaymentDialog = ({ open, onClose, amount, title, description, eventId, purpose, onSuccess }: Props) => {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pay = async () => {
    if (!user) return;
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return;
    }
    setSubmitting(true);
    const res = await startCashfreePayment({
      user_id: user.id,
      amount,
      customer_email: user.email || "",
      customer_name: user.user_metadata?.full_name || "Audena Delegate",
      customer_phone: phone,
      event_id: eventId ?? null,
      purpose: purpose || title,
    });
    setSubmitting(false);
    if (res?.status === "paid") {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Confirm payment
          </DialogTitle>
          <DialogDescription>
            {description || `You are about to pay for "${title}".`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-xl font-bold text-foreground">₹{amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>For</span><span className="truncate max-w-[60%] text-right">{title}</span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Mobile number (required by gateway)</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit phone"
              inputMode="numeric"
              className="mt-1.5"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Secured by Cashfree · UPI, Cards, Netbanking, Wallets
          </div>

          <Button
            disabled={submitting || !phone}
            onClick={pay}
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground h-11 rounded-xl shadow-glow"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ₹${amount.toLocaleString()}`}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            A receipt and the transaction will appear in your profile under Transactions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CashfreePaymentDialog;
