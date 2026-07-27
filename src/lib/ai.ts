import type {
  AIInsights,
  AIRecInput,
  Activity,
  Approval,
  Expense,
  Trip,
  TripMember,
  UserPreferences,
} from './types';
import { clamp, daysUntil, formatCurrency, tripDurationDays } from './utils';

/**
 * Heuristic AI engine for MindYourTrip AI.
 *
 * Generates contextual recommendations, smart expense splits, trip insights,
 * and conversational assistant replies from live trip data — without calling
 * an external LLM. Every output is a suggestion; final decisions stay with users.
 */

// ---------- Trip creation suggestions ----------

export interface TripCreationSuggestion {
  type: 'dates' | 'weather' | 'expenses' | 'attractions' | 'hotels' | 'restaurants' | 'transport' | 'safety' | 'events';
  title: string;
  detail: string;
}

const DESTINATION_INTEL: Record<
  string,
  {
    country: string;
    bestMonths: string;
    weather: string;
    avgDailyCost: number;
    currency: string;
    attractions: string[];
    events: string[];
    safety: string;
    cover: string;
  }
> = {
  Goa: {
    country: 'India',
    bestMonths: 'Nov–Feb',
    weather: 'Sunny, 24–32°C, low humidity',
    avgDailyCost: 3500,
    currency: 'INR',
    attractions: ['Baga Beach', 'Old Goa Churches', 'Dudhsagar Falls', 'Anjuna Flea Market', 'Fort Aguada'],
    events: ['Goa Carnival (Feb)', 'Sunburn Festival (Dec)', 'Shigmo Festival (Mar)'],
    safety: 'Tourist-friendly. Avoid isolated beaches after dark; keep valuables in hotel safe.',
    cover: 'https://images.pexels.com/photos/1434060/pexels-photo-1434060.jpeg',
  },
  Manali: {
    country: 'India',
    bestMonths: 'Mar–Jun & Oct–Feb',
    weather: 'Cool to snowy, -2 to 20°C depending on season',
    avgDailyCost: 2800,
    currency: 'INR',
    attractions: ['Solang Valley', 'Hadimba Temple', 'Rohtang Pass', 'Old Manali Cafes', 'Manikaran Sahib'],
    events: ['Winter Carnival (Jan)', 'Haldi Festival (Feb)'],
    safety: 'Mountain roads can be treacherous in snow — hire experienced local drivers.',
    cover: 'https://images.pexels.com/photos/2962078/pexels-photo-2962078.jpeg',
  },
  Bali: {
    country: 'Indonesia',
    bestMonths: 'Apr–Oct',
    weather: 'Tropical, 24–31°C, dry season',
    avgDailyCost: 4500,
    currency: 'INR',
    attractions: ['Uluwatu Temple', 'Tegalalang Rice Terraces', 'Ubud Monkey Forest', 'Nusa Penida', 'Tanah Lot'],
    events: ['Galungan (varies)', 'Bali Arts Festival (Jun–Jul)'],
    safety: 'Watch for monkey thefts at temples; stick to flagged swim zones — strong currents.',
    cover: 'https://images.pexels.com/photos/1802255/pexels-photo-1802255.jpeg',
  },
  Dubai: {
    country: 'UAE',
    bestMonths: 'Nov–Mar',
    weather: 'Warm, 19–30°C, pleasant',
    avgDailyCost: 8500,
    currency: 'INR',
    attractions: ['Burj Khalifa', 'Palm Jumeirah', 'Desert Safari', 'Dubai Mall', 'Marina Dhow Cruise'],
    events: ['Dubai Shopping Festival (Jan–Feb)', 'Expo City events year-round'],
    safety: 'Very safe. Respect local dress codes at religious sites; alcohol only in licensed venues.',
    cover: 'https://images.pexels.com/photos/3787839/pexels-photo-3787839.jpeg',
  },
  Paris: {
    country: 'France',
    bestMonths: 'Apr–Jun & Sep–Oct',
    weather: 'Mild, 10–25°C',
    avgDailyCost: 9500,
    currency: 'INR',
    attractions: ['Eiffel Tower', 'Louvre Museum', 'Montmartre', 'Seine Cruise', 'Versailles'],
    events: ['Bastille Day (Jul 14)', 'Nuit Blanche (Oct)'],
    safety: 'Watch for pickpockets near landmarks and on the Metro.',
    cover: 'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg',
  },
  Tokyo: {
    country: 'Japan',
    bestMonths: 'Mar–May & Oct–Nov',
    weather: 'Mild, 10–22°C, low rainfall',
    avgDailyCost: 11000,
    currency: 'INR',
    attractions: ['Shibuya Crossing', 'Senso-ji Temple', 'TeamLab Planets', 'Mt. Fuji day trip', 'Akihabara'],
    events: ['Cherry Blossoms (Mar–Apr)', 'Sumo Tournaments (varies)'],
    safety: 'One of the safest cities in the world. Carry some cash — many small shops are cash-only.',
    cover: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg',
  },
};

const DEFAULT_INTEL = {
  country: '',
  bestMonths: 'Shoulder season (avoid peak crowds & prices)',
  weather: 'Pleasant daytime, cooler evenings — pack layers',
  avgDailyCost: 4000,
  currency: 'INR',
  attractions: ['Old Town walking tour', 'Local viewpoint at sunset', 'Regional cuisine tasting', 'Nearby nature trail'],
  events: ['Check local tourism boards for seasonal festivals'],
  safety: 'Register with your embassy, share itinerary with family, keep digital copies of documents.',
  cover: 'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg',
};

export function getDestinationIntel(destination: string) {
  const key = Object.keys(DESTINATION_INTEL).find((k) =>
    destination.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? DESTINATION_INTEL[key] : { ...DEFAULT_INTEL, country: '' };
}

export function suggestForTripCreation(
  destination: string,
  startDate: string,
  budget: number,
  members: number,
): TripCreationSuggestion[] {
  const intel = getDestinationIntel(destination);
  const duration = startDate ? tripDurationDays(startDate, startDate) : 5;
  const estTotal = intel.avgDailyCost * Math.max(duration, 1) * Math.max(members, 1);
  const budgetOk = budget >= estTotal;

  return [
    {
      type: 'dates',
      title: `Best time to visit ${destination || 'this destination'}`,
      detail: `Ideal months are ${intel.bestMonths}. Your selected dates look reasonable — consider shifting by a few days to dodge weekend price spikes.`,
    },
    {
      type: 'weather',
      title: 'Weather forecast',
      detail: intel.weather,
    },
    {
      type: 'expenses',
      title: budgetOk ? 'Budget looks healthy' : 'Budget may be tight',
      detail: budgetOk
        ? `Estimated total for ${members || 1} travelers over ~${Math.max(
            duration,
            1,
          )} days is ${formatCurrency(estTotal, intel.currency)} — within your ${formatCurrency(
            budget,
            intel.currency,
          )} budget.`
        : `Estimated spend is ${formatCurrency(estTotal, intel.currency)} vs your ${formatCurrency(
            budget,
            intel.currency,
          )} budget. Consider extending the budget, shortening the trip, or splitting costs across more members.`,
    },
    {
      type: 'attractions',
      title: 'Top attractions to consider',
      detail: intel.attractions.join(' • '),
    },
    {
      type: 'hotels',
      title: 'Accommodation suggestion',
      detail: members > 2
        ? `Look for serviced apartments or 2-bedroom stays — typically 20–30% cheaper than two hotel rooms for ${members} travelers.`
        : 'Boutique stays near the city centre maximize sightseeing time versus beachfront resorts.',
    },
    {
      type: 'restaurants',
      title: 'Local experiences',
      detail: 'Reserve one fine-dining spot and balance with street food tours — best way to experience local flavor on budget.',
    },
    {
      type: 'transport',
      title: 'Getting around',
      detail: members >= 4
        ? 'A rental car or shared cab often beats per-person transit costs for a group of 4+.'
        : 'Public transit day passes usually beat per-ride fares for 3+ day stays.',
    },
    {
      type: 'safety',
      title: 'Safety notes',
      detail: intel.safety,
    },
    {
      type: 'events',
      title: 'Seasonal events',
      detail: intel.events.join(' • '),
    },
  ];
}

// ---------- Recommendation cards ----------

export function generateRecommendations(ctx: {
  trip: Trip;
  members: TripMember[];
  activities: Activity[];
  expenses: Expense[];
  approvals: Approval[];
}): AIRecInput[] {
  const { trip, members, activities, expenses, approvals } = ctx;
  const recs: AIRecInput[] = [];

  const acceptedMembers = members.filter((m) => m.status === 'accepted');
  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetUsedPct = trip.estimated_budget > 0 ? (totalSpend / trip.estimated_budget) * 100 : 0;
  const daysToTrip = daysUntil(trip.start_date);
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const approvedActivities = activities.filter((a) => a.status === 'approved');
  const unapprovedActivities = activities.filter((a) => a.status !== 'approved' && a.status !== 'rejected');

  // Budget recommendations
  if (budgetUsedPct >= 80) {
    recs.push({
      title: 'Budget nearly exhausted',
      description: `You've used ${Math.round(budgetUsedPct)}% of the trip budget (${formatCurrency(
        totalSpend,
        trip.currency,
      )} of ${formatCurrency(trip.estimated_budget, trip.currency)}). Tighten non-essential spend or raise the budget.`,
      category: 'budget',
      priority: budgetUsedPct >= 100 ? 'critical' : 'high',
      action_type: 'warning',
      rationale:
        'Trips that exceed 80% budget before departure typically overspend by 15–20% on-site. Early intervention gives the group time to adjust.',
    });
  } else if (budgetUsedPct > 0 && budgetUsedPct < 50 && daysToTrip < 14) {
    recs.push({
      title: 'Budget utilization looks low',
      description: `Only ${Math.round(budgetUsedPct)}% of the budget is allocated with ${daysToTrip} days to go. Confirm accommodation and transport — these are usually the largest locked-in costs.`,
      category: 'budget',
      priority: 'medium',
      action_type: 'suggestion',
      rationale: 'Accommodation and transport make up ~60% of typical trip spend and sell out first. Under-allocation this close to departure signals unbooked essentials.',
    });
  }

  // Approval reminders
  if (pendingApprovals.length > 0) {
    recs.push({
      title: `${pendingApprovals.length} approval${pendingApprovals.length > 1 ? 's' : ''} pending`,
      description: `${pendingApprovals[0].title}${
        pendingApprovals.length > 1 ? ` and ${pendingApprovals.length - 1} more` : ''
      } awaiting decision. Resolve before ${daysToTrip < 0 ? 'the trip ends' : 'departure'}.`,
      category: 'approval',
      priority: daysToTrip < 7 ? 'high' : 'medium',
      action_type: 'reminder',
      rationale: 'Unresolved approvals delay bookings and inflate last-minute prices. Group consensus takes ~2–3 days on average.',
    });
  }

  // Planning completion
  if (unapprovedActivities.length > activities.length * 0.6 && activities.length > 0) {
    recs.push({
      title: 'Most activities are still undecided',
      description: `${unapprovedActivities.length} of ${activities.length} activities haven't been approved yet. Hold a quick group vote to lock in the plan.`,
      category: 'scheduling',
      priority: 'medium',
      action_type: 'suggestion',
      rationale: 'Groups that finalize activities early report 40% less day-of-trip stress and fewer missed bookings.',
    });
  }

  // Member quorum
  if (acceptedMembers.length < 2 && trip.max_members > 1) {
    recs.push({
      title: 'Invite more members to share the cost',
      description: `Only ${acceptedMembers.length} member${acceptedMembers.length === 1 ? '' : 's'} confirmed. Adding travelers splits fixed costs (stay, transport) and lowers per-person spend.`,
      category: 'general',
      priority: 'low',
      action_type: 'suggestion',
      rationale: 'Fixed costs like accommodation and rental cars split evenly — 4 travelers typically pay 35% less per head than 2.',
    });
  }

  // Day-of-week / scheduling heuristics
  const firstDay = new Date(trip.start_date);
  const closedOn = firstDay.getDay() === 1; // Monday
  if (closedOn) {
    recs.push({
      title: 'Arrival day is a Monday',
      description: 'Many museums and attractions close on Mondays. Plan an outdoor or nature activity for Day 1 and reserve indoor sights for later in the week.',
      category: 'scheduling',
      priority: 'medium',
      action_type: 'suggestion',
      rationale: 'Museum closures on Mondays are common worldwide. Scheduling around them avoids wasted first-day plans.',
    });
  }

  // Expense category imbalance
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const transportSpend = byCategory['transport'] ?? 0;
  if (transportSpend > trip.estimated_budget * 0.4 && trip.estimated_budget > 0) {
    recs.push({
      title: 'Transportation is costing more than expected',
      description: `Transport is ${Math.round(
        (transportSpend / trip.estimated_budget) * 100,
      )}% of your budget. Consider a rental car or public transit pass to cut it down.`,
      category: 'transport',
      priority: 'medium',
      action_type: 'insight',
      rationale: 'Transport above 40% of budget typically signals over-reliance on per-ride cabs. A shared rental or pass usually saves 25–40%.',
    });
  }

  // Countdown
  if (daysToTrip > 0 && daysToTrip <= 7) {
    recs.push({
      title: `Trip starts in ${daysToTrip} day${daysToTrip === 1 ? '' : 's'}`,
      description: 'Finalize packing, confirm hotel check-in, download offline maps, and verify all bookings are paid.',
      category: 'general',
      priority: 'high',
      action_type: 'alert',
      rationale: 'The final week is when most trip issues surface — confirming logistics now avoids day-of surprises.',
    });
  }

  // Hotel booking urgency
  const hasHotelActivity = activities.some(
    (a) => a.category === 'hotel' && a.status !== 'booked' && a.status !== 'completed',
  );
  if (hasHotelActivity && daysToTrip > 0 && daysToTrip < 21) {
    recs.push({
      title: 'Book your hotel within the next few days',
      description: `Hotel prices typically rise 8–15% in the final 2 weeks before travel. Lock in your stay for ${trip.destination}.`,
      category: 'hotel',
      priority: 'high',
      action_type: 'suggestion',
      rationale: 'Historical booking data shows prices climb steeply inside 14 days. Confirming now avoids both higher rates and limited room choice.',
    });
  }

  // Document readiness
  const missingDocs: string[] = [];
  if (!activities.some((a) => a.category === 'transport')) missingDocs.push('transport tickets');
  if (approvedActivities.length > 0 && !byCategory['accommodation']) missingDocs.push('hotel confirmation');
  if (missingDocs.length > 0 && daysToTrip < 14) {
    recs.push({
      title: 'Documents missing',
      description: `Looks like you still need: ${missingDocs.join(', ')}. Upload them so the AI can organize and verify booking details.`,
      category: 'document',
      priority: 'medium',
      action_type: 'reminder',
      rationale: 'Centralizing tickets and confirmations avoids last-minute scrambles at check-in and makes them shareable with the whole group.',
    });
  }

  return recs;
}

// ---------- Smart expense splitting ----------

export interface SplitResult {
  splits: { memberKey: string; label: string; share: number; isParticipant: boolean }[];
  rationale: string;
}

export function recommendExpenseSplit(
  amount: number,
  members: { id: string; label: string }[],
  participants: string[],
): SplitResult {
  const participantMembers = members.filter((m) => participants.includes(m.id));
  const splitAmong = participantMembers.length > 0 ? participantMembers : members;
  const perHead = amount / Math.max(splitAmong.length, 1);

  const splits = members.map((m) => ({
    memberKey: m.id,
    label: m.label,
    share: splitAmong.includes(m) ? perHead : 0,
    isParticipant: splitAmong.includes(m),
  }));

  const rationale =
    participants.length > 0 && participants.length < members.length
      ? `Splitting ${formatCurrency(amount)} only among the ${participants.length} members who participated — ${members.length - participants.length} member(s) excluded. Each pays ${formatCurrency(perHead)}.`
      : `Splitting ${formatCurrency(amount)} equally across all ${members.length} members. Each pays ${formatCurrency(perHead)}.`;

  return { splits, rationale };
}

// Voice expense parsing — heuristic NLP
export interface ParsedVoiceExpense {
  amount: number;
  title: string;
  participants: string[];
  paidByName: string | null;
  category: string;
  confidence: number;
}

export function parseVoiceExpense(text: string): ParsedVoiceExpense {
  const lower = text.toLowerCase();
  const amountMatch = lower.match(/(?:₹|rs\.?|inr)?\s?(\d[\d,]*)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

  const knownNames = ['priyam', 'aman', 'rahul', 'ananya', 'kabir', 'meera', 'sanjay', 'neha', 'arjun', 'divya'];
  const participants = knownNames.filter((n) => lower.includes(n));

  const paidByMatch = lower.match(/(?:i|(\w+))\s+(?:paid|spent|covered)/);
  const paidByName = paidByMatch ? paidByMatch[1] || 'You' : null;

  let category = 'general';
  if (/dinner|lunch|breakfast|food|eat|restaurant|cafe|snack|pizza|burger|meal/.test(lower)) category = 'food';
  else if (/cab|uber|taxi|bus|train|flight|fuel|petrol|transport|metro|auto/.test(lower)) category = 'transport';
  else if (/hotel|stay|room|hostel|airbnb|accommodation/.test(lower)) category = 'accommodation';
  else if (/ticket|entry|activity|diving|paragliding|trek|tour|museum|adventure/.test(lower)) category = 'activity';
  else if (/shopping|souvenir|gift|clothes|market/.test(lower)) category = 'shopping';

  const titleWords = lower
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !['i', 'paid', 'for', 'the', 'a', 'an', 'and', 'with', 'to', 'of', 'rs', 'inr'].includes(w));
  const title = titleWords.slice(0, 4).join(' ') || (category === 'food' ? 'Meal' : 'Expense');

  return {
    amount,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    participants,
    paidByName,
    category,
    confidence: amount > 0 ? 0.85 : 0.3,
  };
}

// Receipt OCR mock — simulates AI extraction
export function mockReceiptOcr(): {
  merchant: string;
  items: { name: string; price: number }[];
  taxes: number;
  total: number;
  date: string;
  suggestedCategory: string;
} {
  const merchants = ['The Coast Cafe', 'Spice Route Restaurant', 'Mountain View Diner', 'Bistro 24', 'The Local Table'];
  const merchant = merchants[Math.floor(Math.random() * merchants.length)];
  const items = [
    { name: 'Main course x2', price: 480 },
    { name: 'Starters', price: 320 },
    { name: 'Beverages x3', price: 270 },
    { name: 'Dessert', price: 180 },
  ];
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const taxes = Math.round(subtotal * 0.05);
  return {
    merchant,
    items,
    taxes,
    total: subtotal + taxes,
    date: new Date().toISOString().slice(0, 10),
    suggestedCategory: 'food',
  };
}

export function mockBookingOcr(): {
  type: 'flight' | 'train' | 'bus' | 'hotel';
  destination: string;
  travelDate: string;
  passengerName: string;
  bookingId: string;
  travelTime: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
} {
  const types: Array<'flight' | 'train' | 'bus' | 'hotel'> = ['flight', 'train', 'hotel'];
  const type = types[Math.floor(Math.random() * types.length)];
  const base = {
    type,
    destination: 'Goa',
    travelDate: '2026-08-15',
    passengerName: 'Traveler One',
    bookingId: 'BK' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    travelTime: type === 'hotel' ? '14:00' : '09:30',
  };
  return type === 'hotel'
    ? { ...base, hotelName: 'Seaside Resort & Spa', checkIn: base.travelDate, checkOut: '2026-08-19' }
    : base;
}

// ---------- Insights ----------

export function computeInsights(ctx: {
  trip: Trip;
  members: TripMember[];
  activities: Activity[];
  expenses: Expense[];
  approvals: Approval[];
  messages: { author_name: string | null }[];
}): Omit<AIInsights, 'id' | 'trip_id' | 'computed_at'> {
  const { trip, members, activities, expenses, approvals, messages } = ctx;
  const accepted = members.filter((m) => m.status === 'accepted');

  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetUsedPct = trip.estimated_budget > 0 ? (totalSpend / trip.estimated_budget) * 100 : 0;
  const budgetHealth = clamp(Math.round(100 - Math.abs(budgetUsedPct - 60) * 1.2), 0, 100);

  const decidedActs = activities.filter((a) => a.status === 'approved' || a.status === 'booked' || a.status === 'completed').length;
  const planningCompletion = activities.length > 0 ? Math.round((decidedActs / activities.length) * 100) : 0;

  const resolvedApprovals = approvals.filter((a) => a.status !== 'pending').length;
  const approvalProgress = approvals.length > 0 ? Math.round((resolvedApprovals / approvals.length) * 100) : 100;

  const messageCount = messages.length;
  const groupActivity = clamp(Math.round((messageCount / Math.max(accepted.length, 1)) * 4), 0, 100);

  const mostActive = messages
    .map((m) => m.author_name)
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, n) => {
      acc[n!] = (acc[n!] ?? 0) + 1;
      return acc;
    }, {});
  const mostActiveMember = Object.entries(mostActive).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const estimatedReadiness = clamp(
    Math.round(planningCompletion * 0.4 + approvalProgress * 0.3 + budgetHealth * 0.3),
    0,
    100,
  );

  const tripHealthScore = clamp(
    Math.round(budgetHealth * 0.35 + planningCompletion * 0.35 + approvalProgress * 0.3),
    0,
    100,
  );

  const potentialRisks: AIInsights['potential_risks'] = [];
  if (budgetUsedPct > 80) potentialRisks.push({ label: 'Budget overrun likely', severity: 'high' });
  else if (budgetUsedPct > 60) potentialRisks.push({ label: 'Budget tightening', severity: 'medium' });
  if (approvals.filter((a) => a.status === 'pending').length > 2)
    potentialRisks.push({ label: 'Too many pending approvals', severity: 'medium' });
  if (accepted.length < 2) potentialRisks.push({ label: 'Low group size inflates per-head cost', severity: 'low' });
  const days = daysUntil(trip.start_date);
  if (days > 0 && days < 14 && planningCompletion < 60)
    potentialRisks.push({ label: 'Planning behind schedule', severity: 'high' });

  const upcomingDeadlines: AIInsights['upcoming_deadlines'] = [];
  if (days > 0) upcomingDeadlines.push({ label: 'Trip departure', date: trip.start_date });
  approvals.filter((a) => a.status === 'pending' && a.due_at).forEach((a) =>
    upcomingDeadlines.push({ label: `Approval: ${a.title}`, date: a.due_at! }),
  );

  const summary = buildTripSummary(ctx);

  return {
    trip_health_score: tripHealthScore,
    budget_health: budgetHealth,
    approval_progress: approvalProgress,
    planning_completion: planningCompletion,
    group_activity: groupActivity,
    most_active_member: mostActiveMember,
    estimated_readiness: estimatedReadiness,
    potential_risks: potentialRisks,
    upcoming_deadlines: upcomingDeadlines,
    summary,
  };
}

export function buildTripSummary(ctx: {
  trip: Trip;
  activities: Activity[];
  expenses: Expense[];
  approvals: Approval[];
}): string {
  const { trip, activities, expenses, approvals } = ctx;
  const approved = activities.filter((a) => a.status === 'approved').length;
  const booked = activities.filter((a) => a.status === 'booked').length;
  const rejected = activities.filter((a) => a.status === 'rejected').length;
  const pending = approvals.filter((a) => a.status === 'pending').length;
  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const pct = trip.estimated_budget > 0 ? Math.round((totalSpend / trip.estimated_budget) * 100) : 0;

  const lines: string[] = [];
  if (booked) lines.push(`${booked} activit${booked === 1 ? 'y' : 'ies'} booked`);
  if (approved) lines.push(`${approved} approved`);
  if (rejected) lines.push(`${rejected} rejected`);
  if (pending) lines.push(`${pending} approval${pending === 1 ? '' : 's'} still pending`);
  lines.push(`Budget at ${pct}%`);
  return `Today's summary: ${lines.join(', ')}.`;
}

// ---------- AI Assistant ----------

export interface AssistantReply {
  text: string;
  citations?: string[];
}

export function assistantRespond(
  question: string,
  ctx: {
    trip: Trip;
    members: TripMember[];
    activities: Activity[];
    expenses: Expense[];
    approvals: Approval[];
  },
): AssistantReply {
  const q = question.toLowerCase();
  const { trip, members, activities, expenses, approvals } = ctx;
  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = trip.estimated_budget - totalSpend;
  const pct = trip.estimated_budget > 0 ? Math.round((totalSpend / trip.estimated_budget) * 100) : 0;

  if (/missing|what.*need|checklist|what.*left/.test(q)) {
    const pending = approvals.filter((a) => a.status === 'pending').length;
    const missing: string[] = [];
    if (!activities.some((a) => a.category === 'hotel' && (a.status === 'booked' || a.status === 'approved')))
      missing.push('an approved accommodation');
    if (!activities.some((a) => a.category === 'transport' && (a.status === 'booked' || a.status === 'approved')))
      missing.push('transport to/from the destination');
    if (pending > 0) missing.push(`${pending} pending approval${pending > 1 ? 's' : ''} to resolve`);
    if (members.filter((m) => m.status === 'accepted').length < 2) missing.push('confirm the rest of your group');
    return {
      text: missing.length
        ? `Here's what's still outstanding for ${trip.name}: ${missing.join(', ')}. Would you like me to draft reminders for the group?`
        : `Looks like the essentials are in place for ${trip.name}. You have approved accommodation, transport, and no pending approvals. Want me to suggest day-by-day scheduling?`,
    };
  }

  if (/budget|remain|left.*money|spend|spent/.test(q)) {
    return {
      text: `You've spent ${formatCurrency(totalSpend, trip.currency)} of ${formatCurrency(
        trip.estimated_budget,
        trip.currency,
      )} — that's ${pct}% used. ${formatCurrency(Math.max(remaining, 0), trip.currency)} remains. ${
        pct > 80
          ? "You're close to the limit — I'd hold off on non-essential spend."
          : pct < 40
            ? 'Plenty of headroom — you could upgrade one activity or add a nice dinner.'
            : 'On track so far.'
      }`,
    };
  }

  if (/summari|recap|today|what.*happen/.test(q)) {
    return { text: buildTripSummary(ctx) };
  }

  if (/cheaper|cheap|save|budget.*hotel|budget.*option/.test(q)) {
    return {
      text: `Three ways to trim spend on ${trip.destination}: (1) swap beachfront hotels for stays 2–3 km inland — usually 25–35% cheaper; (2) book a shared rental car instead of per-ride cabs for the group; (3) balance one fine-dining night with street-food tours. Estimated saving: ${formatCurrency(
        Math.round(trip.estimated_budget * 0.12),
        trip.currency,
      )}–${formatCurrency(Math.round(trip.estimated_budget * 0.2), trip.currency)}.`,
    };
  }

  if (/compare|vs|versus|better/.test(q)) {
    return {
      text: "I can compare options on the Trip Board. Add both as cards in the 'Discussing' column and I'll surface a cost, rating, and distance breakdown to help the group decide. Tag me with the two card names.",
    };
  }

  if (/pack|packing|bring|luggage/.test(q)) {
    const intel = getDestinationIntel(trip.destination);
    return {
      text: `Packing suggestions for ${trip.destination} (${intel.weather}): comfortable walking shoes, layers for cool evenings, power adapter, reusable water bottle, basic first-aid kit, photocopies of ID/passport, portable charger, and a light daypack. ${
        /snow|cold|-?\d/i.test(intel.weather) ? 'Add a warm jacket and gloves.' : 'Add sunscreen and sunglasses.'
      }`,
    };
  }

  if (/approv|pending|outstanding/.test(q)) {
    const pending = approvals.filter((a) => a.status === 'pending');
    return pending.length
      ? {
          text: `${pending.length} item${pending.length > 1 ? 's' : ''} awaiting approval: ${pending
            .map((p) => p.title)
            .join(', ')}. Each needs a group decision (accept/modify/ignore). Want me to nudge the members who haven't voted?`,
        }
      : { text: 'No pending approvals — everything is resolved.' };
  }

  if (/weather|rain|forecast|temperature/.test(q)) {
    const intel = getDestinationIntel(trip.destination);
    return { text: `Forecast for ${trip.destination}: ${intel.weather}. Best months are ${intel.bestMonths}.` };
  }

  if (/activit|todo|do.*there|sightsee/.test(q)) {
    const intel = getDestinationIntel(trip.destination);
    return {
      text: `Recommended activities for ${trip.destination}: ${intel.attractions.slice(0, 4).join(', ')}. Want me to add these to the Trip Board as suggestion cards?`,
    };
  }

  return {
    text: `I can help with ${trip.name} in a few ways: summarize progress, check budget, suggest cheaper options, generate a packing list, flag pending approvals, or recommend activities. What would you like to dive into?`,
  };
}

// ---------- Personalization / AI memory ----------

export function learnFromTrips(
  trips: Trip[],
  prefs: UserPreferences | null,
): Partial<UserPreferences> {
  if (trips.length === 0) return {};
  const destinations = trips.map((t) => t.destination);
  const styles = trips.map((t) => t.travel_style).filter(Boolean) as string[];
  const budgets = trips.map((t) => t.estimated_budget);
  const avgBudget = budgets.reduce((s, b) => s + b, 0) / Math.max(budgets.length, 1);
  const groupSizes = trips.map((t) => t.max_members);

  const favDest = Array.from(new Set([...(prefs?.favorite_destinations ?? []), ...destinations])).slice(0, 8);
  const favStyles = Array.from(new Set([...(prefs?.travel_styles ?? []), ...styles])).slice(0, 6);

  return {
    favorite_destinations: favDest,
    travel_styles: favStyles,
    avg_budget: Math.round(avgBudget),
    typical_group_size: Math.round(groupSizes.reduce((s, g) => s + g, 0) / Math.max(groupSizes.length, 1)),
  };
}
