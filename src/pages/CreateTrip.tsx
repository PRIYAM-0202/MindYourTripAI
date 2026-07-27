import { useMemo, useState } from 'react';
import {
  Plane,
  MapPin,
  Calendar,
  Wallet,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Cloud,
  Hotel,
  UtensilsCrossed,
  Car,
  ShieldCheck,
  CalendarHeart,
  Brain,
  Star,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { seedBoardColumns } from '@/lib/data';
import { getDestinationIntel, suggestForTripCreation, type TripCreationSuggestion } from '@/lib/ai';
import { cn, formatCurrency } from '@/lib/utils';

const SUGGESTION_ICONS: Record<TripCreationSuggestion['type'], React.ComponentType<{ className?: string }>> = {
  dates: CalendarHeart,
  weather: Cloud,
  expenses: Wallet,
  attractions: Star,
  hotels: Hotel,
  restaurants: UtensilsCrossed,
  transport: Car,
  safety: ShieldCheck,
  events: Sparkles,
};

const TRAVEL_STYLES = ['Explorer', 'Relaxed', 'Adventure', 'Luxury', 'Backpacker', 'Cultural', 'Foodie'];
const ACCOMMODATIONS = ['Hotel', 'Hostel', 'Airbnb', 'Resort', 'Villa', 'Guesthouse'];
const TRANSPORTS = ['Flight', 'Train', 'Bus', 'Self-drive', 'Rental car'];
const CATEGORIES = ['Leisure', 'Adventure', 'Business', 'Family', 'Honeymoon', 'Spiritual', 'Beach', 'Mountains'];
const INTERESTS = ['Beaches', 'Mountains', 'Nightlife', 'Food', 'History', 'Adventure', 'Nature', 'Shopping', 'Wellness', 'Photography'];

export function CreateTrip() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '50000',
    members: '4',
    travelStyle: 'Explorer',
    accommodation: 'Hotel',
    transport: 'Flight',
    category: 'Leisure',
    notes: '',
    interests: [] as string[],
  });

  const set = (k: keyof typeof form, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));

  const toggleInterest = (i: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(i)
        ? f.interests.filter((x) => x !== i)
        : [...f.interests, i],
    }));

  const intel = useMemo(() => getDestinationIntel(form.destination), [form.destination]);
  const suggestions = useMemo(
    () => suggestForTripCreation(form.destination, form.startDate, Number(form.budget), Number(form.members)),
    [form.destination, form.startDate, form.budget, form.members],
  );

  const canStep1 = form.name && form.destination && form.startDate && form.endDate && Number(form.budget) > 0;

  const create = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          name: form.name,
          destination: form.destination,
          country: intel.country || null,
          cover_image: intel.cover,
          start_date: form.startDate,
          end_date: form.endDate,
          estimated_budget: Number(form.budget),
          currency: 'INR',
          status: 'upcoming',
          travel_style: form.travelStyle,
          accommodation: form.accommodation,
          transportation: form.transport,
          max_members: Number(form.members),
          trip_category: form.category,
          activity_interests: form.interests,
          notes: form.notes || null,
          weather_summary: intel.weather,
          safety_info: intel.safety,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error || !data) {
        toast(error?.message ?? 'Failed to create trip', 'error');
        setSaving(false);
        return;
      }

      // Add owner as a member
      await supabase.from('trip_members').insert({
        trip_id: data.id,
        user_id: user.id,
        role: 'owner',
        status: 'accepted',
        joined_at: new Date().toISOString(),
        invited_by: user.id,
      });

      // Seed default board columns
      await seedBoardColumns(data.id);

      toast('Trip created — AI suggestions are ready', 'success');
      navigate(`/trips/${data.id}`);
    } catch (e) {
      toast('Something went wrong creating the trip', 'error');
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/trips')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to trips
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl ai-gradient flex items-center justify-center shadow-glow">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Create a New Trip</h1>
            <p className="text-sm text-slate-400">The AI will suggest dates, weather, costs, and experiences as you fill in details.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {['Details', 'Preferences', 'AI Suggestions'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                  step > i + 1
                    ? 'bg-glow-teal text-ink-950'
                    : step === i + 1
                      ? 'ai-gradient text-white shadow-glow'
                      : 'bg-white/5 text-slate-500',
                )}
              >
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn('text-sm', step === i + 1 ? 'text-white font-medium' : 'text-slate-500')}>{s}</span>
              {i < 2 && <div className="flex-1 h-px bg-white/10 mx-2" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <Field label="Trip Name" icon={Plane}>
                    <input
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g. Summer Goa Escape"
                      className="input-field"
                    />
                  </Field>

                  <Field label="Destination" icon={MapPin}>
                    <input
                      value={form.destination}
                      onChange={(e) => set('destination', e.target.value)}
                      placeholder="e.g. Goa, Bali, Manali"
                      className="input-field"
                    />
                    {form.destination && intel.country && (
                      <p className="text-xs text-ai-300 mt-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {intel.country} · Best time: {intel.bestMonths}
                      </p>
                    )}
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Start Date" icon={Calendar}>
                      <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className="input-field" />
                    </Field>
                    <Field label="End Date" icon={Calendar}>
                      <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} min={form.startDate} className="input-field" />
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Estimated Budget (₹)" icon={Wallet}>
                      <input type="number" value={form.budget} onChange={(e) => set('budget', e.target.value)} className="input-field" />
                      {intel.country && (
                        <p className="text-xs text-slate-500 mt-1.5">
                          AI estimate: ~{formatCurrency(intel.avgDailyCost * 5, intel.currency)}/person for 5 days
                        </p>
                      )}
                    </Field>
                    <Field label="Number of Members" icon={Users}>
                      <input type="number" min="1" max="20" value={form.members} onChange={(e) => set('members', e.target.value)} className="input-field" />
                    </Field>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      disabled={!canStep1}
                      onClick={() => setStep(2)}
                      className="btn-primary"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <ChoiceField label="Travel Style" options={TRAVEL_STYLES} value={form.travelStyle} onChange={(v) => set('travelStyle', v)} />
                  <ChoiceField label="Accommodation" options={ACCOMMODATIONS} value={form.accommodation} onChange={(v) => set('accommodation', v)} />
                  <ChoiceField label="Transportation" options={TRANSPORTS} value={form.transport} onChange={(v) => set('transport', v)} />
                  <ChoiceField label="Trip Category" options={CATEGORIES} value={form.category} onChange={(v) => set('category', v)} />

                  <div>
                    <label className="label-text mb-2 block">Activity Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((i) => (
                        <button
                          key={i}
                          onClick={() => toggleInterest(i)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm border transition-all',
                            form.interests.includes(i)
                              ? 'ai-gradient text-white border-transparent shadow-glow-soft'
                              : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20',
                          )}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field label="Notes (optional)">
                    <textarea
                      value={form.notes}
                      onChange={(e) => set('notes', e.target.value)}
                      placeholder="Any specific plans, constraints, or preferences..."
                      rows={3}
                      className="input-field resize-none"
                    />
                  </Field>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setStep(1)} className="btn-ghost">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button onClick={() => setStep(3)} className="btn-primary">
                      See AI Suggestions <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-ai-300" />
                    <h3 className="font-display text-lg font-semibold text-white">AI Suggestions for {form.destination || 'your trip'}</h3>
                  </div>
                  <p className="text-sm text-slate-400">
                    The AI has analyzed your inputs. Review each suggestion — you decide what to use.
                  </p>

                  <div className="space-y-2.5">
                    {suggestions.map((s, i) => {
                      const Icon = SUGGESTION_ICONS[s.type];
                      return (
                        <div key={i} className="glass-card p-4 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg ai-gradient-soft border border-ai-500/30 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-ai-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white">{s.title}</h4>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-white/10">
                    <button onClick={() => setStep(2)} className="btn-ghost">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button onClick={create} disabled={saving} className="btn-primary">
                      {saving ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Create Trip
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live AI preview */}
          <div className="space-y-4">
            <div className="glass-card p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-display text-sm font-semibold text-white">AI Preview</h3>
              </div>

              {form.destination ? (
                <div className="space-y-3">
                  {form.destination && (
                    <div className="rounded-xl overflow-hidden">
                      <img src={intel.cover} alt={form.destination} className="w-full h-28 object-cover" />
                    </div>
                  )}
                  <div className="space-y-2 text-xs">
                    <PreviewRow icon={MapPin} label="Country" value={intel.country || '—'} />
                    <PreviewRow icon={Cloud} label="Weather" value={intel.weather} />
                    <PreviewRow icon={Calendar} label="Best time" value={intel.bestMonths} />
                    <PreviewRow icon={Wallet} label="Avg/day" value={formatCurrency(intel.avgDailyCost, intel.currency)} />
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-ai-300 mb-1.5 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Top attractions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {intel.attractions.slice(0, 3).map((a) => (
                        <span key={a} className="chip text-[10px]">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">
                  Enter a destination to see AI-powered insights.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-text mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </label>
      {children}
    </div>
  );
}

function ChoiceField({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label-text mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm border transition-all',
              value === o
                ? 'ai-gradient text-white border-transparent shadow-glow-soft'
                : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20',
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function PreviewRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
      <span className="text-slate-400 flex-1">{label}</span>
      <span className="text-white text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
