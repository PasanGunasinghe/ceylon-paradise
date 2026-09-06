import { MessageCircle } from 'lucide-react';
import { contactDetails } from '../contact';

export default function WhatsAppButton() {
  return (
    <a
      href={contactDetails.whatsappHref}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-emerald-900/30 transition hover:-translate-y-1 hover:bg-[#1ebe5d] focus:outline-none focus:ring-4 focus:ring-emerald-300/60"
      aria-label={`Chat with us on WhatsApp at ${contactDetails.whatsapp}`}
      title="Chat on WhatsApp"
    >
      <MessageCircle size={28} strokeWidth={2.2} />
    </a>
  );
}