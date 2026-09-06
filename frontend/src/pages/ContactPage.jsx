import { useState } from 'react';
import { Facebook, Instagram, Music2 } from 'lucide-react';
import { contactDetails } from '../contact';

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  message: '',
};

export default function ContactPage() {
  const [form, setForm] = useState(defaultForm);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Thank you for contacting Ceylon Paradise Expeditions. Our travel team will get back to you shortly.');
    setForm(defaultForm);
  };

  return (
    <div className="page-shell page-background-full pb-20" style={{ backgroundImage: "url('/images/coastal_beach.jpg')" }}>
      <section className="page-hero small">
        <div className="content-container mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="eyebrow">Contact us</p>
          <h1>Plan your next escape with confidence</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">Share your travel ideas and our specialists will design a tailored Sri Lankan journey just for you.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900">Visit our office</h3>
              <p className="mt-3 text-slate-600">{contactDetails.address}</p>
              <a href={contactDetails.phoneHref} className="mt-2 block text-slate-600 hover:text-emerald-700">{contactDetails.phone}</a>
              <a href="mailto:ceylonparadiseexpeditions@gmail.com" className="mt-2 block text-slate-600 hover:text-emerald-700">ceylonparadiseexpeditions@gmail.com</a>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900">WhatsApp</h3>
              <p className="mt-3 text-slate-600">Need a quick reply? Connect with our travel desk instantly.</p>
              <a href={contactDetails.whatsappHref} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white">Chat on WhatsApp</a>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900">Follow our journeys</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={contactDetails.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"><Facebook size={18} aria-hidden="true" /> Facebook</a>
                <a href={contactDetails.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-pink-500 hover:text-pink-600"><Instagram size={18} aria-hidden="true" /> Instagram</a>
                <a href={contactDetails.tiktok} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"><Music2 size={18} aria-hidden="true" /> TikTok</a>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <input name="name" value={form.name} onChange={updateField} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 outline-none focus:border-emerald-500" placeholder="Your name" required />
              <input name="email" type="email" value={form.email} onChange={updateField} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 outline-none focus:border-emerald-500" placeholder="Email address" required />
            </div>

            <div className="mt-5">
              <input name="phone" value={form.phone} onChange={updateField} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 outline-none focus:border-emerald-500" placeholder="Phone number" />
            </div>

            <div className="mt-5">
              <textarea name="message" value={form.message} onChange={updateField} rows="6" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 outline-none focus:border-emerald-500" placeholder="Tell us about your dream trip..." required />
            </div>

            <button type="submit" className="mt-6 rounded-full bg-slate-900 px-6 py-3.5 font-semibold text-white">Send inquiry</button>
          </form>
        </div>
      </section>
    </div>
  );
}
