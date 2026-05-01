<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

    <!-- Header -->
    <div class="mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Statistical Analysis</h1>
        <p class="text-gray-500 text-sm mt-0.5">Hypothesis testing, sector models, regional competitiveness &amp; anomaly detection</p>
      </div>
      <div class="flex gap-2">
        <button @click="refreshAll" :disabled="loading"
          class="btn-secondary flex items-center gap-1.5 text-sm"
          title="Recompute all statistical tests">
          <svg class="w-4 h-4" :class="loading ? 'animate-spin' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Tab Nav -->
    <div class="mb-5">
      <div class="flex gap-0 border-b border-gray-200 overflow-x-auto">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          class="flex items-center gap-1.5 px-5 py-3 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border-b-2 -mb-px"
          :class="activeTab === tab.id
            ? 'border-brand-600 text-brand-700 bg-brand-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'">
          <span>{{ tab.icon }}</span>
          {{ tab.label }}
          <span v-if="tab.badge" class="px-1.5 py-0.5 text-[10px] rounded font-semibold"
            :class="activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'">
            {{ tab.badge }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="card p-6 h-32 animate-pulse bg-gray-100 rounded-xl"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card p-8 text-center">
      <p class="text-red-600 mb-3">{{ error }}</p>
      <button @click="refreshAll" class="btn-primary">Retry</button>
    </div>

    <template v-else>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TAB 1: HYPOTHESIS TESTS                               -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'hypothesis'">

        <!-- Summary KPI row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Tests Run</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ tests.length }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Across 5 methods</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Significant</p>
            <p class="text-2xl font-bold text-green-600 mt-1">{{ sigCount }}</p>
            <p class="text-xs text-gray-400 mt-0.5">at α = 0.05</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Strongest Effect</p>
            <p class="text-lg font-bold text-brand-600 mt-1 truncate">{{ strongestTest }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Largest effect size</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Key Conclusion</p>
            <p class="text-sm font-semibold text-gray-800 mt-1 leading-tight">SME barriers are structural &amp; statistically proven</p>
          </div>
        </div>

        <!-- Tests accordion -->
        <div class="space-y-3">
          <div v-for="(test, i) in tests" :key="i" class="card overflow-hidden">
            <button @click="toggleTest(i)"
              class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-3 min-w-0">
                <span class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  :class="test.significant ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                  {{ test.significant ? '✓' : '○' }}
                </span>
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900 text-sm">{{ test.test }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ test.hypothesis }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4 flex-shrink-0 ml-4">
                <div class="text-right hidden sm:block">
                  <p class="text-xs text-gray-500">{{ test.statistic_label }}</p>
                  <p class="font-mono font-bold text-sm text-gray-900">{{ test.statistic }}</p>
                </div>
                <div class="text-right hidden sm:block">
                  <p class="text-xs text-gray-500">p-value</p>
                  <p class="font-mono font-bold text-sm" :class="test.significant ? 'text-green-600' : 'text-gray-600'">
                    {{ test.p_label }}
                  </p>
                </div>
                <div class="text-right hidden md:block">
                  <p class="text-xs text-gray-500">{{ test.effect_size_label }}</p>
                  <p class="font-mono font-bold text-sm text-brand-600">{{ test.effect_size }}</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="test.significant ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                  {{ test.significant ? 'Significant' : 'Not sig.' }}
                </span>
                <svg class="w-4 h-4 text-gray-400 transition-transform" :class="openTest === i ? 'rotate-180' : ''"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </button>

            <!-- Expanded detail -->
            <div v-if="openTest === i" class="px-5 pb-5 border-t border-gray-100">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <!-- Stat summary -->
                <div class="space-y-3">
                  <div class="grid grid-cols-3 gap-3">
                    <div class="bg-gray-50 rounded-lg p-3 text-center">
                      <p class="text-xs text-gray-500">{{ test.statistic_label }}</p>
                      <p class="font-mono font-bold text-lg text-gray-900">{{ test.statistic }}</p>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-3 text-center">
                      <p class="text-xs text-gray-500">p-value</p>
                      <p class="font-mono font-bold text-lg" :class="test.significant ? 'text-green-600' : 'text-gray-600'">
                        {{ test.p_label }}
                      </p>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-3 text-center">
                      <p class="text-xs text-gray-500">{{ test.effect_size_label }}</p>
                      <p class="font-mono font-bold text-lg text-brand-600">{{ test.effect_size }}</p>
                    </div>
                  </div>

                  <!-- Group means for t-test -->
                  <div v-if="test.group_a_mean" class="grid grid-cols-2 gap-3">
                    <div class="bg-blue-50 rounded-lg p-3 text-center">
                      <p class="text-xs text-blue-600 font-semibold">{{ test.group_a_label }}</p>
                      <p class="font-bold text-blue-900 mt-0.5">£{{ fmtNum(test.group_a_mean) }}</p>
                    </div>
                    <div class="bg-red-50 rounded-lg p-3 text-center">
                      <p class="text-xs text-red-600 font-semibold">{{ test.group_b_label }}</p>
                      <p class="font-bold text-red-900 mt-0.5">£{{ fmtNum(test.group_b_mean) }}</p>
                    </div>
                  </div>

                  <!-- Chi-square residuals -->
                  <div v-if="test.top_residuals" class="space-y-1">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Standardised Residuals (post-hoc)</p>
                    <div v-for="r in test.top_residuals" :key="r.entity"
                      class="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                      <span class="font-medium text-gray-800">{{ r.entity }}</span>
                      <span class="font-mono font-bold" :class="r.direction === 'over' ? 'text-green-600' : 'text-red-600'">
                        {{ r.direction === 'over' ? '+' : '' }}{{ r.residual }}
                      </span>
                    </div>
                  </div>

                  <!-- Tukey pairs for ANOVA -->
                  <div v-if="test.tukey_pairs" class="space-y-1">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tukey HSD Post-hoc</p>
                    <div v-for="pair in test.tukey_pairs" :key="pair.pair"
                      class="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                      <span class="text-gray-700">{{ pair.pair }}</span>
                      <span class="font-mono font-semibold text-green-600">Δ {{ pair.mean_diff }}%</span>
                    </div>
                  </div>
                </div>

                <!-- Interpretation -->
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p class="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Interpretation</p>
                  <p class="text-sm text-gray-700 leading-relaxed">{{ test.interpretation }}</p>
                  <div class="mt-3 pt-3 border-t border-amber-200">
                    <p class="text-xs text-amber-600">
                      <strong>Category:</strong> {{ test.category }}
                      <span v-if="test.degrees_of_freedom" class="ml-3">
                        <strong>df:</strong> {{ test.degrees_of_freedom }}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Effect size guide -->
        <div class="card p-5 mt-5">
          <h3 class="font-semibold text-gray-900 mb-3 text-sm">Effect Size Reference Guide</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div v-for="guide in effectGuide" :key="guide.label" class="rounded-lg p-3 text-center" :class="guide.cls">
              <p class="font-bold">{{ guide.label }}</p>
              <p class="text-gray-600 mt-0.5">{{ guide.range }}</p>
              <p class="font-semibold mt-1">{{ guide.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TAB 2: SECTOR REGRESSION MODELS                       -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'sector'">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Sectors Modelled</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ sectors.length }}</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Highest SME Rate</p>
            <p class="text-2xl font-bold text-green-600 mt-1">{{ topSector?.sme_rate }}%</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ topSector?.sector }}</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Lowest SME Rate</p>
            <p class="text-2xl font-bold text-red-600 mt-1">{{ bottomSector?.sme_rate }}%</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ bottomSector?.sector }}</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Best Accuracy</p>
            <p class="text-2xl font-bold text-brand-600 mt-1">{{ bestAccSector?.accuracy }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ bestAccSector?.sector }}</p>
          </div>
        </div>

        <!-- Sector bar chart -->
        <div class="card p-5 mb-5">
          <h3 class="font-semibold text-gray-900 mb-1">SME Award Rate by Sector</h3>
          <p class="text-xs text-gray-400 mb-3">Ranked by SME rate — national average 42.7% (dashed)</p>
          <div ref="chartSectorBar" style="height:380px"></div>
        </div>

        <!-- Sector table -->
        <div class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Sector Regression Summary</h3>
            <p class="text-xs text-gray-400">Logistic regression: sme_award ~ year + value + region</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="text-left px-4 py-3 font-medium text-gray-600">Sector</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600">SME Rate</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Contracts</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Avg Value</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600">Year β</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Value β</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Accuracy</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Top Factor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in sectorsSorted" :key="s.sector"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ s.sector }}</td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <div class="w-16 h-1.5 rounded-full bg-gray-200 hidden sm:block">
                        <div class="h-full rounded-full"
                          :style="{ width: s.sme_rate + '%' }"
                          :class="s.sme_rate >= 60 ? 'bg-green-500' : s.sme_rate >= 35 ? 'bg-blue-500' : 'bg-red-400'"></div>
                      </div>
                      <span class="font-semibold" :class="s.sme_rate >= 60 ? 'text-green-700' : s.sme_rate >= 35 ? 'text-blue-700' : 'text-red-700'">
                        {{ s.sme_rate }}%
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-600 hidden md:table-cell">{{ fmtNum(s.contracts) }}</td>
                  <td class="px-4 py-3 text-right text-gray-600 hidden md:table-cell">£{{ fmtNum(s.avg_value) }}</td>
                  <td class="px-4 py-3 text-right font-mono text-sm" :class="s.year_trend >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ s.year_trend >= 0 ? '+' : '' }}{{ s.year_trend }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono text-sm text-red-500 hidden lg:table-cell">{{ s.value_coef }}</td>
                  <td class="px-4 py-3 text-right hidden lg:table-cell">
                    <span class="font-semibold" :class="s.accuracy >= 0.70 ? 'text-green-600' : 'text-gray-600'">
                      {{ s.accuracy ? (s.accuracy * 100).toFixed(1) + '%' : '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-500 hidden xl:table-cell">{{ s.top_factor }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sector insight -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div class="card p-4 bg-green-50 border border-green-200">
            <p class="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">High SME Sectors</p>
            <p class="text-sm text-gray-700">R&amp;D (83%), Repair &amp; Maintenance (79%), Architecture (73%) — small project values, fragmented work, no incumbent advantage.</p>
          </div>
          <div class="card p-4 bg-red-50 border border-red-200">
            <p class="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Low SME Sectors</p>
            <p class="text-sm text-gray-700">Financial Services (19%), Software (30%), IT Services (22%) — high capital requirements, security clearances, incumbent lock-in.</p>
          </div>
          <div class="card p-4 bg-blue-50 border border-blue-200">
            <p class="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Year Trend</p>
            <p class="text-sm text-gray-700">Positive year coefficient in all 15 sectors — policy-driven SME growth is sector-universal, but rates differ by 4.6×.</p>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TAB 3: REGIONAL COMPETITIVENESS                       -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'regional'">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Top Region</p>
            <p class="text-xl font-bold text-green-600 mt-1">{{ regions[0]?.region }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Score: {{ regions[0]?.composite_score }}/100</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Bottom Region</p>
            <p class="text-xl font-bold text-red-600 mt-1">{{ regions.at(-1)?.region }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Score: {{ regions.at(-1)?.composite_score }}/100</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Score Range</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">
              {{ (regions[0]?.composite_score - (regions.at(-1)?.composite_score || 0)).toFixed(1) }}
            </p>
            <p class="text-xs text-gray-400 mt-0.5">points spread</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">SME Rate Range</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">
              {{ regions[0]?.sme_rate }}% – {{ regions.at(-1)?.sme_rate }}%
            </p>
            <p class="text-xs text-gray-400 mt-0.5">best vs worst</p>
          </div>
        </div>

        <!-- Chart -->
        <div class="card p-5 mb-5">
          <h3 class="font-semibold text-gray-900 mb-1">Regional Competitiveness Composite Score</h3>
          <p class="text-xs text-gray-400 mb-3">Score = 40% SME rate + 30% volume + 20% low avg value + 10% growth rate</p>
          <div ref="chartRegionalScore" style="height:360px"></div>
        </div>

        <!-- Ranking table -->
        <div class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100">
            <h3 class="font-semibold text-gray-900">Regional Competitiveness Ranking</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="text-left px-4 py-3 font-medium text-gray-600">Rank</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-600">Region</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600">SME Rate</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Volume</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Avg Value</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Growth/yr</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in regions" :key="r.region"
                  class="border-b border-gray-100 hover:bg-gray-50"
                  :class="r.rank <= 3 ? 'bg-green-50/30' : r.rank >= regions.length - 1 ? 'bg-red-50/20' : ''">
                  <td class="px-4 py-3">
                    <span class="font-bold text-lg" :class="rankColor(r.rank)">{{ r.rank }}</span>
                  </td>
                  <td class="px-4 py-3 font-medium text-gray-900">{{ r.region }}</td>
                  <td class="px-4 py-3 text-right">
                    <span class="font-semibold" :class="r.sme_rate >= 60 ? 'text-green-600' : r.sme_rate >= 40 ? 'text-blue-600' : 'text-red-600'">
                      {{ r.sme_rate }}%
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-600 hidden md:table-cell">{{ fmtNum(r.contract_volume) }}</td>
                  <td class="px-4 py-3 text-right text-gray-600 hidden md:table-cell">£{{ fmtNum(r.avg_value) }}</td>
                  <td class="px-4 py-3 text-right hidden lg:table-cell">
                    <span :class="r.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'">
                      {{ r.growth_rate >= 0 ? '+' : '' }}{{ r.growth_rate }}%
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <div class="w-16 h-2 rounded-full bg-gray-200 hidden sm:block">
                        <div class="h-full rounded-full transition-all"
                          :style="{ width: r.composite_score + '%' }"
                          :class="r.composite_score >= 70 ? 'bg-green-500' : r.composite_score >= 50 ? 'bg-blue-500' : r.composite_score >= 35 ? 'bg-amber-500' : 'bg-red-400'"></div>
                      </div>
                      <span class="font-bold text-gray-900">{{ r.composite_score }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Scoring methodology -->
        <div class="card p-5 mt-5 bg-blue-50 border border-blue-200">
          <h3 class="font-semibold text-blue-900 mb-3">Scoring Methodology</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-blue-800">
            <div><strong>40%</strong> — SME award rate</div>
            <div><strong>30%</strong> — Contract volume (market size)</div>
            <div><strong>20%</strong> — Avg value (lower = more SME-accessible)</div>
            <div><strong>10%</strong> — Annual SME rate growth trend</div>
          </div>
          <p class="text-xs text-blue-600 mt-2">All components normalised 0–100 before weighting. Score ≥70: SME-Champion. 50–69: SME-Friendly. &lt;50: Low Access.</p>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TAB 4: ANOMALY DETECTION                              -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div v-show="activeTab === 'anomalies'">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Total Anomalies</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ anomalies.length }}</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">High Severity</p>
            <p class="text-2xl font-bold text-red-600 mt-1">{{ anomalies.filter(a => a.severity === 'high').length }}</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Medium Severity</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ anomalies.filter(a => a.severity === 'medium').length }}</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Low Severity</p>
            <p class="text-2xl font-bold text-blue-600 mt-1">{{ anomalies.filter(a => a.severity === 'low').length }}</p>
          </div>
        </div>

        <!-- Severity filter -->
        <div class="mb-4 flex items-center gap-2 flex-wrap">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter:</span>
          <button v-for="sev in ['all','high','medium','low']" :key="sev"
            @click="anomalyFilter = sev"
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            :class="anomalyFilter === sev ? severityBtnActive(sev) : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'">
            {{ sev.charAt(0).toUpperCase() + sev.slice(1) }}
          </button>
        </div>

        <!-- Anomaly chart -->
        <div class="card p-5 mb-5">
          <h3 class="font-semibold text-gray-900 mb-1">Anomaly Severity Overview</h3>
          <div ref="chartAnomalies" style="height:280px"></div>
        </div>

        <!-- Anomaly cards -->
        <div class="space-y-3">
          <div v-for="a in filteredAnomalies" :key="a.entity + a.type"
            class="card p-4 border-l-4"
            :class="severityBorder(a.severity)">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="severityBadge(a.severity)">
                    {{ a.severity.toUpperCase() }}
                  </span>
                  <span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-medium">{{ a.type }}</span>
                  <span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{{ a.entity_type }}</span>
                </div>
                <p class="font-semibold text-gray-900 text-sm">{{ a.entity }}</p>
                <p class="text-sm text-gray-600 mt-1 leading-relaxed">{{ a.description }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-xs text-gray-400">Anomaly Score</p>
                <p class="text-2xl font-bold" :class="a.score >= 8 ? 'text-red-600' : a.score >= 6 ? 'text-amber-600' : 'text-blue-600'">
                  {{ a.score }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Methodology note -->
        <div class="card p-4 mt-5 bg-gray-50 border border-gray-200">
          <p class="text-xs text-gray-500">
            <strong>Detection methods:</strong> Z-score outliers (|z| &gt; 2) for region/sector SME rates;
            IQR (×3) for contract value outliers; temporal analysis for spike detection.
            Anomaly score 1–10 reflects combined statistical severity and policy impact.
          </p>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { statsApi } from '@/lib/api'

const activeTab = ref('hypothesis')
const tabs = [
  { id: 'hypothesis', label: 'Hypothesis Tests',          icon: '🔬', badge: '5 tests' },
  { id: 'sector',     label: 'Sector Regression Models',  icon: '📊', badge: '15 sectors' },
  { id: 'regional',   label: 'Regional Competitiveness',  icon: '🗺️', badge: '12 regions' },
  { id: 'anomalies',  label: 'Anomaly Detection',         icon: '⚠️' },
]

const tests        = ref([])
const sectors      = ref([])
const regions      = ref([])
const anomalies    = ref([])
const loading      = ref(true)
const error        = ref('')
const openTest     = ref(null)
const anomalyFilter= ref('all')

const chartSectorBar    = ref(null)
const chartRegionalScore= ref(null)
const chartAnomalies    = ref(null)
let Plotly = null

const BLUE  = '#2563eb'
const GREEN = '#16a34a'
const RED   = '#dc2626'
const AMBER = '#d97706'
const BASE  = {
  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#374151' },
  margin: { l: 10, r: 10, t: 10, b: 10 },
}
const CFG = { responsive: true, displayModeBar: false }

// ── Computed ───────────────────────────────────────────────────────────────
const sigCount = computed(() => tests.value.filter(t => t.significant).length)
const strongestTest = computed(() => {
  if (!tests.value.length) return ''
  return tests.value.reduce((a, b) => (a.effect_size || 0) > (b.effect_size || 0) ? a : b).test?.split(' ').slice(0, 2).join(' ') || ''
})
const sectorsSorted  = computed(() => [...sectors.value].sort((a, b) => b.sme_rate - a.sme_rate))
const topSector      = computed(() => sectorsSorted.value[0])
const bottomSector   = computed(() => sectorsSorted.value.at(-1))
const bestAccSector  = computed(() => [...sectors.value].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))[0])
const filteredAnomalies = computed(() =>
  anomalyFilter.value === 'all'
    ? [...anomalies.value].sort((a, b) => b.score - a.score)
    : anomalies.value.filter(a => a.severity === anomalyFilter.value).sort((a, b) => b.score - a.score)
)

const effectGuide = [
  { label: 'Small',    range: 'd/V < 0.2',  desc: 'Minimal practical impact', cls: 'bg-gray-100 text-gray-600' },
  { label: 'Medium',   range: '0.2 – 0.5',  desc: 'Moderate practical impact', cls: 'bg-blue-50 text-blue-700' },
  { label: 'Large',    range: '0.5 – 0.8',  desc: 'Substantial impact',        cls: 'bg-amber-50 text-amber-700' },
  { label: 'Very Large', range: '> 0.8',    desc: 'Major practical importance', cls: 'bg-green-50 text-green-700' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k'
  return n.toLocaleString()
}

function rankColor(rank) {
  if (rank === 1) return 'text-amber-500'
  if (rank === 2) return 'text-gray-400'
  if (rank === 3) return 'text-amber-700'
  return 'text-gray-500'
}

function severityBorder(sev) {
  return { high: 'border-red-400', medium: 'border-amber-400', low: 'border-blue-300' }[sev] || 'border-gray-300'
}
function severityBadge(sev) {
  return { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700' }[sev] || 'bg-gray-100 text-gray-600'
}
function severityBtnActive(sev) {
  const map = { all: 'bg-gray-800 text-white border-gray-800', high: 'bg-red-600 text-white border-red-600', medium: 'bg-amber-500 text-white border-amber-500', low: 'bg-blue-600 text-white border-blue-600' }
  return map[sev] || 'bg-gray-800 text-white border-gray-800'
}

function toggleTest(i) {
  openTest.value = openTest.value === i ? null : i
}

// ── Charts ─────────────────────────────────────────────────────────────────
async function ensurePlotly() {
  if (!Plotly) Plotly = (await import('plotly.js-dist-min')).default
}

async function drawSectorBar() {
  if (!chartSectorBar.value || !sectors.value.length) return
  await ensurePlotly()
  const d = [...sectors.value].sort((a, b) => a.sme_rate - b.sme_rate)
  const colors = d.map(s => s.sme_rate >= 60 ? GREEN : s.sme_rate >= 35 ? BLUE : RED)
  Plotly.newPlot(chartSectorBar.value, [
    { type: 'bar', orientation: 'h',
      x: d.map(s => s.sme_rate), y: d.map(s => s.sector),
      marker: { color: colors },
      text: d.map(s => s.sme_rate + '%'), textposition: 'outside',
      customdata: d.map(s => fmtNum(s.contracts)),
      hovertemplate: '<b>%{y}</b><br>SME Rate: %{x}%<br>n = %{customdata}<extra></extra>' },
    { type: 'scatter', mode: 'lines', x: [42.7, 42.7], y: [d[0].sector, d.at(-1).sector],
      line: { color: AMBER, dash: 'dash', width: 2 }, name: 'National avg 42.7%', hoverinfo: 'none' },
  ], { ...BASE, showlegend: true, legend: { x: 0.65, y: 0.02, orientation: 'h' },
       xaxis: { title: { text: 'SME Award Rate (%)' }, range: [0, 100] },
       yaxis: { automargin: true, tickfont: { size: 10 } },
       margin: { l: 10, r: 55, t: 20, b: 50 } }, CFG)
}

async function drawRegionalScore() {
  if (!chartRegionalScore.value || !regions.value.length) return
  await ensurePlotly()
  const d = [...regions.value].sort((a, b) => a.composite_score - b.composite_score)
  const colors = d.map(r => r.composite_score >= 70 ? GREEN : r.composite_score >= 50 ? BLUE : r.composite_score >= 35 ? AMBER : RED)
  Plotly.newPlot(chartRegionalScore.value, [{
    type: 'bar', orientation: 'h',
    x: d.map(r => r.composite_score), y: d.map(r => r.region),
    marker: { color: colors },
    text: d.map(r => r.composite_score), textposition: 'outside',
    customdata: d.map(r => r.sme_rate + '% SME'),
    hovertemplate: '<b>%{y}</b><br>Score: %{x}/100<br>%{customdata}<extra></extra>',
  }], { ...BASE,
       xaxis: { title: { text: 'Competitiveness Score (0–100)' }, range: [0, 100] },
       yaxis: { automargin: true },
       margin: { l: 10, r: 55, t: 10, b: 50 } }, CFG)
}

async function drawAnomalies() {
  if (!chartAnomalies.value || !anomalies.value.length) return
  await ensurePlotly()
  const counts = { high: 0, medium: 0, low: 0 }
  anomalies.value.forEach(a => { counts[a.severity] = (counts[a.severity] || 0) + 1 })
  const types = ['Authority (0% SME)', 'Sector extremes', 'Value spikes', 'Volume spikes', 'Structural outliers']
  const countsByType = types.map(() => Math.ceil(Math.random() * 3))

  Plotly.newPlot(chartAnomalies.value, [
    { type: 'bar', x: ['High', 'Medium', 'Low'], y: [counts.high, counts.medium, counts.low],
      marker: { color: [RED, AMBER, BLUE] },
      text: [counts.high, counts.medium, counts.low], textposition: 'outside',
      name: 'By Severity',
      hovertemplate: '<b>%{x}</b><br>%{y} anomalies<extra></extra>' },
  ], { ...BASE, yaxis: { title: { text: 'Count' }, range: [0, Math.max(...Object.values(counts)) + 2] },
       margin: { l: 50, r: 20, t: 20, b: 50 } }, CFG)
}

// ── Chart watchers ─────────────────────────────────────────────────────────
watch(activeTab, async (tab) => {
  await nextTick()
  await new Promise(r => requestAnimationFrame(r))
  await new Promise(r => requestAnimationFrame(r))
  if (tab === 'sector')   drawSectorBar()
  if (tab === 'regional') drawRegionalScore()
  if (tab === 'anomalies') drawAnomalies()
})

watch(sectors, () => { if (activeTab.value === 'sector') drawSectorBar() }, { flush: 'post' })
watch(regions, () => { if (activeTab.value === 'regional') drawRegionalScore() }, { flush: 'post' })
watch(anomalies, () => { if (activeTab.value === 'anomalies') drawAnomalies() }, { flush: 'post' })

// ── Data loading ────────────────────────────────────────────────────────────
async function refreshAll() {
  loading.value = true; error.value = ''
  try {
    const [t, s, r, a] = await Promise.all([
      statsApi.hypothesisTests(),
      statsApi.sectorModels(),
      statsApi.regionalCompetitiveness(),
      statsApi.anomalies(),
    ])
    tests.value    = t.data.tests    || []
    sectors.value  = s.data.sectors  || []
    regions.value  = r.data.regions  || []
    anomalies.value= a.data.anomalies|| []
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to load statistical analysis'
  } finally {
    loading.value = false
  }
}

onMounted(refreshAll)
</script>
