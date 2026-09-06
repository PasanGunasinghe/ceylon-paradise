import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, MessageCircle, Twitter, Youtube } from 'lucide-react';
import { contactDetails } from '../contact';

const socialLinks = [
  { label: 'Facebook', href: contactDetails.facebook, Icon: Facebook },
  { label: 'Instagram', href: contactDetails.instagram, Icon: Instagram },
  { label: 'WhatsApp', href: contactDetails.whatsappHref, Icon: MessageCircle },
  { label: 'Twitter', href: contactDetails.twitter, Icon: Twitter },
  { label: 'LinkedIn', href: contactDetails.linkedin, Icon: Linkedin },
  { label: 'YouTube', href: contactDetails.youtube, Icon: Youtube },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-soft)] bg-[var(--footer-bg)] text-[var(--text-primary)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="text-2xl font-black">Ceylon Paradise</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-[var(--accent)]">Expeditions</p>
          <p className="mt-5 max-w-xs text-sm leading-7 text-[var(--text-muted)]">Thoughtfully crafted journeys across Sri Lanka, shaped by local knowledge and an unhurried sense of discovery.</p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Explore</h2>
          <div className="mt-4 grid gap-3 text-sm text-[var(--text-muted)]">
            <Link to="/destinations" className="transition hover:text-[var(--accent)]">Destinations</Link>
            <Link to="/tours" className="transition hover:text-[var(--accent)]">Signature tours</Link>
            <Link to="/map-planner" className="transition hover:text-[var(--accent)]">Map planner</Link>
            <Link to="/gallery" className="transition hover:text-[var(--accent)]">Travel memories</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Connect</h2>
          <div className="mt-4 grid gap-3 text-sm text-[var(--text-muted)]">
            <a href="mailto:ceylonparadiseexpeditions@gmail.com" className="transition hover:text-[var(--accent)]">ceylonparadiseexpeditions@gmail.com</a>
            <a href={contactDetails.phoneHref} className="transition hover:text-[var(--accent)]">{contactDetails.phone}</a>
            <a href={contactDetails.whatsappHref} target="_blank" rel="noreferrer" className="transition hover:text-[var(--accent)]">WhatsApp: {contactDetails.whatsapp}</a>
            <span>{contactDetails.address}</span>
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Follow Us</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {socialLinks.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border-soft)] px-2.5 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-[0_0_18px_var(--accent-soft)]">
                <Icon size={16} aria-hidden="true" />
                <span className="truncate">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border-soft)] px-4 py-5 text-center text-xs text-[var(--text-muted)]">
        <p>© 2026 Ceylon Paradise Expeditions. All Rights Reserved. Designed &amp; Developed by S.H.U.P. Gunasinghe</p>
      </div>
    </footer>
  );
}
