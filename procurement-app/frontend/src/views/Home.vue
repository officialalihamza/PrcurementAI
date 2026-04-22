<template>
  <div class="min-h-screen">
    <!-- Hero -->
    <section class="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white py-24 px-4">
      <div class="max-w-5xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-sm mb-6">
          <span class="w-2 h-2 bg-green-400 rounded-full"></span>
          Live UK Contracts Finder data
        </div>
        <h1 class="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Win more UK government<br />contracts — intelligently
        </h1>
        <p class="text-xl text-brand-200 mb-10 max-w-2xl mx-auto">
          ProcurementAI monitors the UK Contracts Finder and alerts you to opportunities
          matched to your business profile. Stop missing tenders.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink to="/signup" class="px-8 py-3 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 transition-colors text-lg">
            Get started free
          </RouterLink>
          <RouterLink to="/login" class="px-8 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-lg border border-white/20">
            Sign in
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-gray-900 mb-4">Everything you need to win contracts</h2>
        <p class="text-gray-500 text-center mb-12 max-w-xl mx-auto">Built for UK SMEs competing for government business</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="feature in features" :key="feature.title" class="text-center p-6">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" :class="feature.bg">
              <span class="text-2xl">{{ feature.icon }}</span>
            </div>
            <h3 class="font-bold text-lg text-gray-900 mb-2">{{ feature.title }}</h3>
            <p class="text-gray-500">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats banner -->
    <section class="py-12 bg-gray-50 border-y border-gray-200">
      <div class="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div v-for="stat in stats" :key="stat.label">
          <p class="text-3xl font-bold text-brand-600">{{ stat.value }}</p>
          <p class="text-gray-500 mt-1 text-sm">{{ stat.label }}</p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-20 px-4 bg-white">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Up and running in 3 steps</h2>
        <div class="space-y-8">
          <div v-for="(step, i) in steps" :key="i" class="flex gap-6 items-start">
            <div class="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-lg">
              {{ i + 1 }}
            </div>
            <div>
              <h3 class="font-bold text-lg text-gray-900 mb-1">{{ step.title }}</h3>
              <p class="text-gray-500">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="py-20 px-4 bg-gray-50">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
        <p class="text-gray-500 mb-12">Start free, upgrade when you need more</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div class="card p-8 text-left">
            <p class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Free</p>
            <p class="text-4xl font-bold text-gray-900 mb-1">£0</p>
            <p class="text-gray-500 text-sm mb-6">Forever free</p>
            <ul class="space-y-2 mb-8">
              <li v-for="f in freePlan" :key="f" class="flex gap-2 text-sm text-gray-700">
                <span class="text-green-500 font-bold">✓</span> {{ f }}
              </li>
            </ul>
            <RouterLink to="/signup" class="btn-secondary w-full text-center">Get started</RouterLink>
          </div>

          <div class="card p-8 text-left border-brand-500 ring-2 ring-brand-500">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-semibold text-brand-600 uppercase tracking-wide">Pro</p>
              <span class="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded">Popular</span>
            </div>
            <p class="text-4xl font-bold text-gray-900 mb-1">£29<span class="text-lg text-gray-400 font-normal">/mo</span></p>
            <p class="text-gray-500 text-sm mb-6">Billed monthly</p>
            <ul class="space-y-2 mb-8">
              <li v-for="f in proPlan" :key="f" class="flex gap-2 text-sm text-gray-700">
                <span class="text-brand-500 font-bold">✓</span> {{ f }}
              </li>
            </ul>
            <RouterLink to="/signup" class="btn-primary w-full text-center">Start free trial</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 px-4 bg-brand-700 text-white text-center">
      <h2 class="text-3xl font-bold mb-4">Start finding contracts today</h2>
      <p class="text-brand-200 mb-8 max-w-md mx-auto">Join hundreds of UK SMEs already using ProcurementAI to win government business.</p>
      <RouterLink to="/signup" class="px-8 py-3 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 transition-colors text-lg inline-block">
        Create free account →
      </RouterLink>
    </section>

    <!-- Footer -->
    <footer class="py-8 bg-gray-900 text-gray-400 text-center text-sm">
      <p>© 2026 ProcurementAI · Data sourced from UK Contracts Finder · Not affiliated with UK Government</p>
    </footer>
  </div>
</template>

<script setup>
const features = [
  { icon: '🔍', title: 'Smart Contract Search', desc: 'Filter by sector, region, value, and SME suitability across all UK government contracts.', bg: 'bg-blue-50' },
  { icon: '🔔', title: 'Instant Alerts', desc: 'Get notified by email the moment contracts matching your criteria are published.', bg: 'bg-green-50' },
  { icon: '📊', title: 'Market Analytics', desc: 'Understand SME win rates, sector trends, and regional spending patterns with interactive charts.', bg: 'bg-amber-50' },
  { icon: '🎯', title: 'Match Scoring', desc: 'Every contract is scored against your company profile so you focus on the best opportunities.', bg: 'bg-purple-50' },
  { icon: '💾', title: 'Save & Track', desc: 'Bookmark contracts and add notes to stay organised across multiple opportunities.', bg: 'bg-red-50' },
  { icon: '📄', title: 'PDF Reports', desc: 'Export market intelligence reports for stakeholders and board presentations.', bg: 'bg-teal-50' },
]

const stats = [
  { value: '10,000+', label: 'Contracts indexed monthly' },
  { value: '12', label: 'UK regions covered' },
  { value: '55%', label: 'Average SME win rate' },
  { value: '£2.3Bn', label: 'Monthly contract value' },
]

const steps = [
  { title: 'Create your free account', desc: 'Sign up with email — no credit card required.' },
  { title: 'Set up your company profile', desc: 'Enter your SIC codes, region, and turnover so we can calculate match scores.' },
  { title: 'Find and get alerted to contracts', desc: 'Search live UK Contracts Finder data and set up alerts for ongoing monitoring.' },
]

const freePlan = [
  'Unlimited contract search',
  'Up to 3 saved alerts',
  'Save up to 20 contracts',
  'Basic analytics dashboard',
]

const proPlan = [
  'Everything in Free',
  'Unlimited alerts',
  'Unlimited saved contracts',
  'Full EDA analytics suite',
  'PDF report export',
  'Priority email support',
]
</script>
