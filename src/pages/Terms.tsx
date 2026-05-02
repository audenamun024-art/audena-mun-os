import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-display font-bold text-foreground">{title}</h2>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </section>
);

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-panel border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 h-14">
          <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-secondary text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-display font-bold text-foreground">Terms & Privacy</h1>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">AudenaHub</p>
          <h1 className="text-3xl font-display font-bold text-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: May 2026</p>
        </header>

        <Section title="1. Welcome to AudenaHub">
          <p>AudenaHub is a community-driven platform designed for sharing ideas, discussions, MUN-related content, and connecting with people across regions and perspectives. By accessing or using AudenaHub, you agree to follow these Terms. If you do not agree, please do not use the platform.</p>
        </Section>

        <Section title="2. Our Purpose">
          <ul className="list-disc pl-5 space-y-1">
            <li>Create a space for meaningful discussions</li>
            <li>Encourage youth participation and awareness</li>
            <li>Allow users to express ideas through content</li>
            <li>Build a strong network of individuals and communities</li>
          </ul>
        </Section>

        <Section title="3. Eligibility">
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least 13 years old to use AudenaHub</li>
            <li>By using the platform, you confirm that you meet this requirement</li>
            <li>You agree to provide accurate and truthful information</li>
          </ul>
        </Section>

        <Section title="4. User Accounts">
          <p>You agree to keep your login details secure, not share your account, and not impersonate any person or organisation. We may suspend or remove accounts that violate our rules, misuse the platform, or engage in harmful behaviour.</p>
        </Section>

        <Section title="5. User Content">
          <p>You can create and share videos, posts (Drops / Buzz), opinions and discussions. You own your content, but by posting it, you give AudenaHub permission to display, share, and promote it within the platform.</p>
        </Section>

        <Section title="6. Community Guidelines">
          <p>Please do not post hate speech, violence or threats, harassment, false or misleading information, or illegal content. We reserve the right to remove content that violates these guidelines.</p>
        </Section>

        <Section title="7. Community Evaluation System">
          <p>AudenaHub allows users to evaluate content using options like ✔ Accurate and ⚠ Needs Check. These are community opinions, not verified facts. AudenaHub does not guarantee accuracy of content.</p>
        </Section>

        <Section title="8. Points & Reward System">
          <p>We use a points-based system to encourage participation. Points are virtual and may change anytime. They do not represent real money unless clearly stated. We may adjust point rules, reset points, or remove points in case of misuse.</p>
        </Section>

        <Section title="9. Payments & Platform Fees">
          <p>Certain features may include platform fees (e.g., ₹29). Payments are processed via third-party gateways. Fees are generally non-refundable unless required by law.</p>
        </Section>

        <Section title="10. Intellectual Property">
          <p>All platform elements — logo, design, features, branding — belong to AudenaHub. You may not copy the platform, reproduce designs, or use branding without permission.</p>
        </Section>

        <Section title="11. Platform Changes">
          <p>We may add or remove features, update the design, or modify policies. Continued use means you accept these changes.</p>
        </Section>

        <Section title="12. Account Suspension or Termination">
          <p>We may suspend or remove your account if you violate terms, abuse the system, or harm other users.</p>
        </Section>

        <Section title="13. Limitation of Liability">
          <p>AudenaHub is a platform for user-generated content. We are not responsible for opinions shared by users, incorrect content, or loss of data or access. Use the platform at your own responsibility.</p>
        </Section>

        <Section title="14. Governing Law">
          <p>These Terms are governed by the laws of India.</p>
        </Section>

        <hr className="border-border" />

        <header className="space-y-2 pt-4">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">AudenaHub</p>
          <h1 className="text-3xl font-display font-bold text-foreground">Privacy Policy</h1>
        </header>

        <Section title="1. Information We Collect">
          <ul className="list-disc pl-5 space-y-1">
            <li>Name and email</li>
            <li>Profile information</li>
            <li>Content you post</li>
            <li>Usage and interaction data</li>
            <li>Device information</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>To provide and improve the platform, personalise your experience, maintain security, and prevent misuse.</p>
        </Section>

        <Section title="3. Data Sharing">
          <p>We do not sell your personal data. We may share data with payment providers and legal authorities when required.</p>
        </Section>

        <Section title="4. Data Security">
          <p>We take reasonable steps to protect your data. However, no system is completely secure.</p>
        </Section>

        <Section title="5. Your Rights">
          <p>You can update your profile, delete your account, or request removal of your data.</p>
        </Section>

        <Section title="6. Cookies & Tracking">
          <p>We may use cookies or similar technologies to improve your experience.</p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>AudenaHub is available only to users aged 13 and above. We do not knowingly collect data from children below this age.</p>
        </Section>

        <Section title="8. Updates to Privacy Policy">
          <p>We may update this policy from time to time. We encourage users to review it regularly.</p>
        </Section>

        <div className="bg-secondary/50 border border-border rounded-2xl p-5 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-2">⚠️ Important Disclaimer</p>
          <p>AudenaHub is a community-driven platform. Content is created by users. Opinions are personal. We do not guarantee accuracy. Users are responsible for what they post and how they interact.</p>
        </div>
      </article>
    </div>
  );
};

export default Terms;
