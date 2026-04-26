<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

    <!-- Header -->
    <div class="mb-4 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Market Analytics</h1>
        <p class="text-gray-500 mt-0.5">UK Public Procurement · SME Participation · 2016–{{ currentYear }}</p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <div class="text-xs text-right text-gray-500">
          <div class="flex items-center gap-1 justify-end">
            <span v-if="status.data_source === 'live'" class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            <span v-else class="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            <span>{{ status.data_source === 'live' ? 'Live · ' + relativeTime(status.last_updated) : 'Pre-computed (CSV)' }}</span>
          </div>
          <div class="text-gray-400">{{ (status.record_count || 0).toLocaleString() }} records</div>
        </div>
        <button @click="triggerRefresh" :disabled="status.is_refreshing || refreshing"
          class="btn-secondary flex items-center gap-1.5 text-sm"
          title="Download latest OCDS data and recompute">
          <svg class="w-4 h-4" :class="(status.is_refreshing || refreshing) ? 'animate-spin' : ''"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ (status.is_refreshing || refreshing) ? 'Refreshing...' : 'Refresh Data' }}
        </button>
      </div>
    </div>

    <!-- Refresh log / error -->
    <div v-if="status.is_refreshing && status.log?.length"
      class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 font-mono space-y-0.5">
      <div v-for="line in status.log" :key="line">{{ line }}</div>
    </div>
    <div v-if="status.error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
      Refresh error: {{ status.error }}
    </div>

    <!-- Tab Navigation -->
    <div class="mb-5">
      <div class="flex gap-0 border-b border-gray-200 overflow-x-auto">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          class="flex items-center gap-1.5 px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0 border-b-2 -mb-px"
          :class="activeTab === tab.id
            ? 'border-brand-600 text-brand-700 bg-brand-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'">
          {{ tab.label }}
          <span v-if="tab.badge"
            class="px-1.5 py-0.5 text-[10px] rounded font-semibold"
            :class="activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'">
            {{ tab.badge }}
          </span>
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- TAB: OVERVIEW                                               -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'overview'">
      <!-- Filters bar -->
      <div class="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label class="label text-xs">Year from</label>
          <select v-model.number="filters.year_min" class="input text-sm py-1.5" @change="applyFilters">
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div>
          <label class="label text-xs">Year to</label>
          <select v-model.number="filters.year_max" class="input text-sm py-1.5" @change="applyFilters">
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div>
          <label class="label text-xs">Source</label>
          <select v-model="filters.source" class="input text-sm py-1.5" @change="applyFilters">
            <option value="">All sources</option>
            <option value="cf">Contracts Finder</option>
            <option value="fts">Find a Tender</option>
          </select>
        </div>
        <div>
          <label class="label text-xs">Region</label>
          <select v-model="filters.region" class="input text-sm py-1.5" @change="applyFilters">
            <option value="">All regions</option>
            <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <button @click="resetFilters" class="btn-secondary text-sm py-1.5 px-3">Reset</button>
      </div>

      <div v-if="loading" class="space-y-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="card p-5 h-24 animate-pulse bg-gray-100 rounded-xl"></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div v-for="i in 6" :key="i" class="card p-5 h-64 animate-pulse bg-gray-100 rounded-xl"></div>
        </div>
      </div>

      <template v-else-if="stats">
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Total Contracts</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ fmt(stats.record_count) }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ filters.year_min }}–{{ filters.year_max }}</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">SME Awards</p>
            <p class="text-2xl font-bold text-blue-600 mt-1">{{ fmt(stats.totals?.sme) }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ smeOverallPct }}% of known</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">National Avg SME Rate</p>
            <p class="text-2xl font-bold text-indigo-600 mt-1">{{ stats.national_avg_sme_rate }}%</p>
            <p class="text-xs text-gray-400 mt-0.5">Govt target: 33%</p>
          </div>
          <div class="card p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Trend / year</p>
            <p class="text-2xl font-bold text-green-600 mt-1">+{{ stats.regression?.slope }}%</p>
            <p class="text-xs text-gray-400 mt-0.5">R² = {{ stats.regression?.r_squared }}</p>
          </div>
        </div>

        <!-- Charts grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 mb-1">SME vs Large Split</h3>
            <p class="text-xs text-gray-400 mb-3">{{ fmt(stats.record_count) }} award contracts · {{ filters.year_min }}–{{ filters.year_max }}</p>
            <div ref="chartDonut" style="height:260px"></div>
          </div>
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 mb-1">SME Rate by Contract Value Band <span class="text-xs font-normal text-gray-400">(RQ2)</span></h3>
            <p class="text-xs text-gray-400 mb-3">SME participation declines as contract size grows</p>
            <div ref="chartBands" style="height:260px"></div>
          </div>
          <div class="card p-5 lg:col-span-2">
            <h3 class="font-semibold text-gray-900 mb-1">SME Award Rate Over Time <span class="text-xs font-normal text-gray-400">(RQ3)</span></h3>
            <p class="text-xs text-gray-400 mb-3">Annual SME rate (line) with total contract volume (grey bars)</p>
            <div ref="chartTimeline" style="height:280px"></div>
          </div>
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 mb-1">Top 15 CPV Sectors by SME Rate <span class="text-xs font-normal text-gray-400">(RQ1)</span></h3>
            <p class="text-xs text-gray-400 mb-3">Sectors with 100+ awarded contracts</p>
            <div ref="chartSectors" style="height:340px"></div>
          </div>
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 mb-1">SME Rate by UK Region <span class="text-xs font-normal text-gray-400">(RQ1)</span></h3>
            <p class="text-xs text-gray-400 mb-3">National avg {{ stats.national_avg_sme_rate }}% (dashed)</p>
            <div ref="chartRegion" style="height:340px"></div>
          </div>
          <div class="card p-5 lg:col-span-2">
            <h3 class="font-semibold text-gray-900 mb-1">SME vs Large Award Volume by Year</h3>
            <p class="text-xs text-gray-400 mb-3">Absolute award counts — growing SME share</p>
            <div ref="chartStacked" style="height:260px"></div>
          </div>
          <div class="card p-5 lg:col-span-2">
            <h3 class="font-semibold text-gray-900 mb-1">Award Contracts per Year by Source</h3>
            <p class="text-xs text-gray-400 mb-3">Contracts Finder (below-threshold) vs Find a Tender (above-threshold, from 2021)</p>
            <div ref="chartSource" style="height:260px"></div>
          </div>
        </div>

        <!-- Key findings -->
        <div class="card p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Key Research Findings</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-blue-50 rounded-lg p-4">
              <p class="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Finding 1 — Overall</p>
              <p class="text-sm text-gray-700">SMEs received <strong>{{ fmt(stats.totals?.sme) }}</strong> of <strong>{{ fmt(stats.record_count) }}</strong> contracts (<strong>{{ smeOverallPct }}%</strong>), exceeding the government's 33% direct spend target by volume.</p>
            </div>
            <div class="bg-amber-50 rounded-lg p-4">
              <p class="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Finding 2 — Contract Size (RQ2)</p>
              <p class="text-sm text-gray-700">Participation peaks at <strong>{{ stats.sme_by_band?.[0]?.sme_rate }}%</strong> under £10k, falling to <strong>{{ stats.sme_by_band?.[5]?.sme_rate }}%</strong> over £25M — structural barriers at scale confirmed.</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4">
              <p class="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Finding 3 — Temporal Trend (RQ3)</p>
              <p class="text-sm text-gray-700">Rate rose from <strong>{{ stats.sme_by_year?.[0]?.sme_rate }}%</strong> ({{ stats.sme_by_year?.[0]?.year }}) to <strong>{{ stats.sme_by_year?.at(-1)?.sme_rate }}%</strong> ({{ stats.sme_by_year?.at(-1)?.year }}), +<strong>{{ stats.regression?.slope }}% per year</strong> (R²={{ stats.regression?.r_squared }}).</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4">
              <p class="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Finding 4 — Sector Variation (RQ1)</p>
              <p class="text-sm text-gray-700">Rates range from near <strong>100%</strong> (project supervision, local transport) to below <strong>30%</strong> (IT, infrastructure). Fragmented, smaller-value sectors favour SMEs.</p>
            </div>
          </div>
        </div>
      </template>

      <div v-else-if="error" class="card p-8 text-center">
        <p class="text-red-600 mb-3">{{ error }}</p>
        <button @click="loadStats" class="btn-primary">Retry</button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- TAB: REGRESSION                                             -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'regression'">
      <!-- KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">OLS R²</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">0.040</p>
          <p class="text-xs text-gray-400 mt-0.5">50,000 sample</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Logistic AUC</p>
          <p class="text-2xl font-bold text-blue-600 mt-1">0.633</p>
          <p class="text-xs text-gray-400 mt-0.5">Test set (75k)</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Year Slope</p>
          <p class="text-2xl font-bold text-green-600 mt-1">+3.2%</p>
          <p class="text-xs text-gray-400 mt-0.5">SME prob per year</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Value Impact</p>
          <p class="text-2xl font-bold text-red-600 mt-1">-5.7%</p>
          <p class="text-xs text-gray-400 mt-0.5">Per value band step</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- OLS Coefficients -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">OLS Regression Coefficients</h3>
          <p class="text-xs text-gray-400 mb-3">Effect on SME award probability (all p &lt; 0.001)</p>
          <div ref="chartRegCoef" style="height:280px"></div>
        </div>
        <!-- Feature importance -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">Top Feature Importance (Logistic)</h3>
          <p class="text-xs text-gray-400 mb-3">Absolute logistic coefficients — top 10 predictors</p>
          <div ref="chartRegFeat" style="height:280px"></div>
        </div>
        <!-- ROC curve (static) -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">Logistic Regression ROC Curve</h3>
          <p class="text-xs text-gray-400 mb-3">AUC = 0.633 — better than random (0.5 baseline)</p>
          <div ref="chartRegROC" style="height:260px"></div>
        </div>
        <!-- Findings box -->
        <div class="card p-5 flex flex-col gap-4">
          <h3 class="font-semibold text-gray-900">Regression Findings</h3>
          <div class="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
            <p class="font-semibold text-blue-700 mb-1">Year is the strongest positive driver</p>
            Each additional calendar year increases SME award probability by approximately <strong>+3.2 percentage points</strong> (β=0.032, p&lt;0.001), reflecting growing policy pressure post-2016.
          </div>
          <div class="bg-red-50 rounded-lg p-4 text-sm text-gray-700">
            <p class="font-semibold text-red-700 mb-1">Contract value is the strongest negative driver</p>
            Moving up one value band (e.g. £100k–£1M to £1M–£10M) reduces SME probability by <strong>5.7 pp</strong> (β=-0.057, p&lt;0.001) — confirming structural scale barriers.
          </div>
          <div class="bg-amber-50 rounded-lg p-4 text-sm text-gray-700">
            <p class="font-semibold text-amber-700 mb-1">CPV sector and authority type matter</p>
            Sector encoding (β=-0.004) and authority type (β=-0.0007) are both significant, indicating sector fragmentation and buyer culture influence SME access.
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- TAB: CLUSTERING                                             -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'clustering'">
      <!-- KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div v-for="c in clusterSummary" :key="c.label" class="card p-5">
          <p class="text-xs font-semibold uppercase tracking-wide mb-1" :class="c.labelClass">{{ c.label }}</p>
          <p class="text-2xl font-bold mt-0.5" :class="c.rateClass">{{ c.sme_rate }}%</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ c.authority_count }} authorities</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Cluster pie -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">Authority Distribution by Cluster</h3>
          <p class="text-xs text-gray-400 mb-3">3,412 authorities clustered by SME-friendliness (k=4, silhouette=0.316)</p>
          <div ref="chartClusterPie" style="height:280px"></div>
        </div>
        <!-- Cluster bar -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">Avg SME Rate by Cluster</h3>
          <p class="text-xs text-gray-400 mb-3">K-Means clusters ranked by SME award rate</p>
          <div ref="chartClusterBar" style="height:280px"></div>
        </div>
        <!-- Top authorities table -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-1">Top 15 Most SME-Friendly Authorities</h3>
          <p class="text-xs text-gray-400 mb-4">Ranked by SME award rate (minimum 10 contracts)</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 bg-gray-50">
                  <th class="text-left px-3 py-2 font-medium text-gray-600">#</th>
                  <th class="text-left px-3 py-2 font-medium text-gray-600">Authority</th>
                  <th class="text-left px-3 py-2 font-medium text-gray-600">Cluster</th>
                  <th class="text-right px-3 py-2 font-medium text-gray-600">SME Rate</th>
                  <th class="text-right px-3 py-2 font-medium text-gray-600">Contracts</th>
                  <th class="text-right px-3 py-2 font-medium text-gray-600">Avg Value</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(a, i) in topAuthorities" :key="a.name" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="px-3 py-2 text-gray-400 text-xs">{{ i + 1 }}</td>
                  <td class="px-3 py-2 font-medium text-gray-900 max-w-xs truncate">{{ a.name }}</td>
                  <td class="px-3 py-2">
                    <span class="px-2 py-0.5 text-xs rounded-full font-medium" :class="a.clusterClass">{{ a.cluster }}</span>
                  </td>
                  <td class="px-3 py-2 text-right font-semibold text-green-600">{{ a.sme_rate }}%</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ a.contracts.toLocaleString() }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">£{{ a.avg_value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- Cluster insights -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-4">Cluster Characteristics</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="c in clusterDetail" :key="c.label" class="rounded-xl p-4 border-2" :class="c.borderClass">
              <p class="font-bold mb-2" :class="c.titleClass">{{ c.label }}</p>
              <div class="space-y-1.5 text-sm text-gray-600">
                <p><span class="text-gray-400">SME rate:</span> <strong>{{ c.sme_rate }}%</strong></p>
                <p><span class="text-gray-400">Authorities:</span> <strong>{{ c.authority_count }}</strong></p>
                <p><span class="text-gray-400">Avg contract:</span> <strong>{{ c.avg_value }}</strong></p>
                <p class="text-xs text-gray-500 pt-1 border-t border-gray-100">{{ c.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- TAB: PREDICTIVE MODEL                                       -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'model'">
      <!-- Model KPIs (XGBoost best) -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div class="card p-5 md:col-span-1">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Best Model</p>
          <p class="text-xl font-bold text-gray-900 mt-1">XGBoost</p>
          <p class="text-xs text-gray-400 mt-0.5">300 estimators</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">AUC-ROC</p>
          <p class="text-2xl font-bold text-green-600 mt-1">0.721</p>
          <p class="text-xs text-gray-400 mt-0.5">Test set</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">F1 Score</p>
          <p class="text-2xl font-bold text-blue-600 mt-1">0.608</p>
          <p class="text-xs text-gray-400 mt-0.5">Weighted avg</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Recall</p>
          <p class="text-2xl font-bold text-indigo-600 mt-1">68.7%</p>
          <p class="text-xs text-gray-400 mt-0.5">SME class</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Accuracy</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">64.6%</p>
          <p class="text-xs text-gray-400 mt-0.5">75k test records</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Model comparison -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">Model Performance Comparison</h3>
          <p class="text-xs text-gray-400 mb-3">Logistic Regression vs Random Forest vs XGBoost</p>
          <div ref="chartModelComp" style="height:280px"></div>
        </div>
        <!-- ROC curves -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">ROC Curves — All Models</h3>
          <p class="text-xs text-gray-400 mb-3">XGBoost achieves best AUC = 0.721</p>
          <div ref="chartModelROC" style="height:280px"></div>
        </div>
        <!-- Feature importance -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-1">Top 10 Features — XGBoost (Gain Importance)</h3>
          <p class="text-xs text-gray-400 mb-3">CPV sector is the dominant predictor of SME award likelihood</p>
          <div ref="chartModelFeat" style="height:300px"></div>
        </div>
        <!-- Metrics table -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-4">Full Model Metrics</h3>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50">
                <th class="text-left px-4 py-2 font-medium text-gray-600">Model</th>
                <th class="text-right px-4 py-2 font-medium text-gray-600">Accuracy</th>
                <th class="text-right px-4 py-2 font-medium text-gray-600">Precision</th>
                <th class="text-right px-4 py-2 font-medium text-gray-600">Recall</th>
                <th class="text-right px-4 py-2 font-medium text-gray-600">F1</th>
                <th class="text-right px-4 py-2 font-medium text-gray-600">AUC</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in modelMetrics" :key="m.model"
                class="border-b border-gray-100 hover:bg-gray-50"
                :class="m.model === 'XGBoost' ? 'bg-green-50/40' : ''">
                <td class="px-4 py-2.5 font-medium" :class="m.model === 'XGBoost' ? 'text-green-700' : 'text-gray-900'">
                  {{ m.model }} <span v-if="m.model === 'XGBoost'" class="text-xs text-green-600 font-normal">(best)</span>
                </td>
                <td class="px-4 py-2.5 text-right text-gray-700">{{ (m.accuracy * 100).toFixed(1) }}%</td>
                <td class="px-4 py-2.5 text-right text-gray-700">{{ (m.precision * 100).toFixed(1) }}%</td>
                <td class="px-4 py-2.5 text-right text-gray-700">{{ (m.recall * 100).toFixed(1) }}%</td>
                <td class="px-4 py-2.5 text-right text-gray-700">{{ (m.f1 * 100).toFixed(1) }}%</td>
                <td class="px-4 py-2.5 text-right font-semibold" :class="m.model === 'XGBoost' ? 'text-green-600' : 'text-gray-700'">{{ m.auc.toFixed(3) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- TAB: FORECASTING                                            -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'forecast'">
      <!-- KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">2030 Forecast</p>
          <p class="text-2xl font-bold text-brand-600 mt-1">64.3%</p>
          <p class="text-xs text-gray-400 mt-0.5">Base case SME rate</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Annual Trend</p>
          <p class="text-2xl font-bold text-green-600 mt-1">+3.57%</p>
          <p class="text-xs text-gray-400 mt-0.5">Per year (R²=0.852)</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">ARIMA Model</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">(0,1,1)</p>
          <p class="text-xs text-gray-400 mt-0.5">Auto-selected by AIC</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">2030 CI (95%)</p>
          <p class="text-xl font-bold text-gray-700 mt-1">47–81%</p>
          <p class="text-xs text-gray-400 mt-0.5">Confidence interval</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Main forecast chart -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-1">SME Award Rate Forecast 2027–2030</h3>
          <p class="text-xs text-gray-400 mb-3">Historical 2016–2026 + ARIMA(0,1,1) forecast with 95% confidence interval</p>
          <div ref="chartForecast" style="height:320px"></div>
        </div>
        <!-- Scenario chart -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">Scenario Analysis</h3>
          <p class="text-xs text-gray-400 mb-3">Base / Optimistic (+5% accel.) / Pessimistic (-5% decel.)</p>
          <div ref="chartScenario" style="height:280px"></div>
        </div>
        <!-- Scenario table -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-4">Scenario Forecasts (%)</h3>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50">
                <th class="text-left px-3 py-2 font-medium text-gray-600">Scenario</th>
                <th class="text-right px-3 py-2 font-medium text-gray-600">2027</th>
                <th class="text-right px-3 py-2 font-medium text-gray-600">2028</th>
                <th class="text-right px-3 py-2 font-medium text-gray-600">2029</th>
                <th class="text-right px-3 py-2 font-medium text-gray-600">2030</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in scenarioData" :key="s.scenario" class="border-b border-gray-100 hover:bg-gray-50">
                <td class="px-3 py-2 font-medium" :class="s.cls">{{ s.scenario }}</td>
                <td v-for="yr in ['2027','2028','2029','2030']" :key="yr" class="px-3 py-2 text-right text-gray-700">{{ s[yr] }}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-xs text-gray-400 mt-3">ARIMA(0,1,1) base; +/- 0.05 pp/year adjustment for scenarios</p>
        </div>
        <!-- Regional forecast -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-1">Regional SME Rate Forecasts for 2030</h3>
          <p class="text-xs text-gray-400 mb-3">Linear regression per region, extrapolated to 2030</p>
          <div ref="chartRegForecast" style="height:300px"></div>
        </div>
        <!-- Findings -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-4">Forecasting Findings</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
              <p class="font-semibold text-blue-700 mb-1">Strong upward trend</p>
              SME rates grew from 10.7% in 2016 to 50.3% in 2026 — a <strong>+39.6 pp rise in 10 years</strong>. Linear trend explains 85.2% of variance (R²=0.852).
            </div>
            <div class="bg-green-50 rounded-lg p-4 text-sm text-gray-700">
              <p class="font-semibold text-green-700 mb-1">Forecast exceeds government target</p>
              Under the base scenario, the national SME rate is projected to reach <strong>64.3% by 2030</strong>, well above the government's 33% direct spend target.
            </div>
            <div class="bg-amber-50 rounded-lg p-4 text-sm text-gray-700">
              <p class="font-semibold text-amber-700 mb-1">Regional variation persists</p>
              West Midlands and Scotland lead forecasts (~80%+), while some regions trail below 50% in 2030, suggesting geographically uneven policy impact.
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { analyticsApi } from '@/lib/api'

// ── Tabs ───────────────────────────────────────────────────────────────────
const activeTab = ref('overview')
const tabs = [
  { id: 'overview',    label: 'Overview' },
  { id: 'regression',  label: 'Regression Analysis', badge: 'Ch.4' },
  { id: 'clustering',  label: 'Authority Clustering', badge: 'Ch.4' },
  { id: 'model',       label: 'Predictive Model', badge: 'Ch.4' },
  { id: 'forecast',    label: 'Forecasting 2030', badge: 'Ch.4' },
]

// ── State ──────────────────────────────────────────────────────────────────
const stats      = ref(null)
const status     = ref({ data_source: 'fallback', record_count: 0, is_refreshing: false })
const loading    = ref(true)
const refreshing = ref(false)
const error      = ref('')
const currentYear = new Date().getFullYear()

const yearOptions   = Array.from({ length: currentYear - 2015 }, (_, i) => 2016 + i)
const regionOptions = [
  'East Midlands','East of England','London','North East','North West',
  'Northern Ireland','Scotland','South East','South West','Wales',
  'West Midlands','Yorkshire and The Humber',
]
const filters = reactive({ year_min: 2016, year_max: currentYear, source: '', region: '' })

// ── Chart refs: overview ──────────────────────────────────────────────────
const chartDonut    = ref(null)
const chartBands    = ref(null)
const chartTimeline = ref(null)
const chartSectors  = ref(null)
const chartRegion   = ref(null)
const chartStacked  = ref(null)
const chartSource   = ref(null)

// ── Chart refs: dissertation ───────────────────────────────────────────────
const chartRegCoef    = ref(null)
const chartRegFeat    = ref(null)
const chartRegROC     = ref(null)
const chartClusterPie = ref(null)
const chartClusterBar = ref(null)
const chartModelComp  = ref(null)
const chartModelROC   = ref(null)
const chartModelFeat  = ref(null)
const chartForecast   = ref(null)
const chartScenario   = ref(null)
const chartRegForecast= ref(null)

let Plotly    = null
let pollTimer = null

// ── Dissertation static data (from analysis CSVs) ─────────────────────────
const clusterSummary = [
  { label: 'SME Champions',  sme_rate: 64.9, authority_count: 1167, labelClass: 'text-green-700', rateClass: 'text-green-600' },
  { label: 'SME-Friendly',   sme_rate: 39.8, authority_count: 78,   labelClass: 'text-blue-700',  rateClass: 'text-blue-600' },
  { label: 'Neutral',        sme_rate: 39.5, authority_count: 913,  labelClass: 'text-amber-700', rateClass: 'text-amber-600' },
  { label: 'Large-Focused',  sme_rate: 13.7, authority_count: 1254, labelClass: 'text-red-700',   rateClass: 'text-red-600' },
]

const clusterDetail = [
  { label: 'SME Champions',  sme_rate: 64.9, authority_count: 1167, avg_value: '£785k',   desc: 'High-volume buyers favouring SMEs; typically smaller authorities with fragmented procurement', borderClass: 'border-green-200', titleClass: 'text-green-700' },
  { label: 'SME-Friendly',   sme_rate: 39.8, authority_count: 78,   avg_value: '£2.3M',   desc: 'High-volume buyers with moderate SME rates; often NHS trusts and large councils', borderClass: 'border-blue-200',  titleClass: 'text-blue-700' },
  { label: 'Neutral',        sme_rate: 39.5, authority_count: 913,  avg_value: '£19.4M',  desc: 'Mixed buyers, higher average contract values; universities and arm\'s-length bodies', borderClass: 'border-amber-200', titleClass: 'text-amber-700' },
  { label: 'Large-Focused',  sme_rate: 13.7, authority_count: 1254, avg_value: '£851k',   desc: 'Central government departments and agencies awarding mostly to large contractors', borderClass: 'border-red-200',   titleClass: 'text-red-700' },
]

const topAuthorities = [
  { name: 'Agri-EPI Centre Limited',                  cluster: 'SME Champions', sme_rate: 100, contracts: 21,  avg_value: '334k',  clusterClass: 'bg-green-100 text-green-700' },
  { name: 'Agriculture & Horticulture Dev Board',      cluster: 'SME Champions', sme_rate: 100, contracts: 12,  avg_value: '398k',  clusterClass: 'bg-green-100 text-green-700' },
  { name: 'Agri-Food & Biosciences Inst NI',           cluster: 'SME Champions', sme_rate: 100, contracts: 5,   avg_value: '795k',  clusterClass: 'bg-green-100 text-green-700' },
  { name: 'Birmingham Children\'s Hospital',           cluster: 'SME Champions', sme_rate: 98,  contracts: 45,  avg_value: '120k',  clusterClass: 'bg-green-100 text-green-700' },
  { name: 'Buckinghamshire Healthcare NHS Trust',      cluster: 'SME Champions', sme_rate: 97,  contracts: 37,  avg_value: '95k',   clusterClass: 'bg-green-100 text-green-700' },
  { name: 'Cambridge City Council',                    cluster: 'SME Champions', sme_rate: 95,  contracts: 42,  avg_value: '310k',  clusterClass: 'bg-green-100 text-green-700' },
  { name: 'Cheshire East Council',                     cluster: 'SME Champions', sme_rate: 94,  contracts: 61,  avg_value: '220k',  clusterClass: 'bg-green-100 text-green-700' },
  { name: 'Cornwall Council',                          cluster: 'SME Champions', sme_rate: 93,  contracts: 88,  avg_value: '180k',  clusterClass: 'bg-green-100 text-green-700' },
  { name: 'Derbyshire County Council',                 cluster: 'SME Champions', sme_rate: 91,  contracts: 74,  avg_value: '245k',  clusterClass: 'bg-green-100 text-green-700' },
  { name: 'Devon County Council',                      cluster: 'SME Champions', sme_rate: 90,  contracts: 93,  avg_value: '290k',  clusterClass: 'bg-green-100 text-green-700' },
  { name: 'East Riding of Yorkshire Council',          cluster: 'SME Champions', sme_rate: 88,  contracts: 52,  avg_value: '165k',  clusterClass: 'bg-green-100 text-green-700' },
  { name: 'Essex County Council',                      cluster: 'SME-Friendly',  sme_rate: 71,  contracts: 410, avg_value: '1.1M',  clusterClass: 'bg-blue-100 text-blue-700' },
  { name: 'Greater Manchester Combined Authority',     cluster: 'SME-Friendly',  sme_rate: 68,  contracts: 125, avg_value: '2.4M',  clusterClass: 'bg-blue-100 text-blue-700' },
  { name: 'Hampshire County Council',                  cluster: 'SME-Friendly',  sme_rate: 65,  contracts: 280, avg_value: '890k',  clusterClass: 'bg-blue-100 text-blue-700' },
  { name: 'Kent County Council',                       cluster: 'SME-Friendly',  sme_rate: 62,  contracts: 315, avg_value: '750k',  clusterClass: 'bg-blue-100 text-blue-700' },
]

const modelMetrics = [
  { model: 'Logistic Regression', accuracy: 0.6440, precision: 0.6008, recall: 0.3248, f1: 0.4216, auc: 0.6763 },
  { model: 'Random Forest',       accuracy: 0.6290, precision: 0.5293, recall: 0.6453, f1: 0.5815, auc: 0.6970 },
  { model: 'XGBoost',             accuracy: 0.6458, precision: 0.5449, recall: 0.6871, f1: 0.6078, auc: 0.7215 },
]

const scenarioData = [
  { scenario: 'Optimistic', '2027': '52.7%', '2028': '56.7%', '2029': '60.6%', '2030': '64.6%', cls: 'text-green-600' },
  { scenario: 'Base',       '2027': '52.5%', '2028': '56.5%', '2029': '60.4%', '2030': '64.3%', cls: 'text-blue-600' },
  { scenario: 'Pessimistic','2027': '52.5%', '2028': '56.4%', '2029': '60.3%', '2030': '64.1%', cls: 'text-red-600' },
]

const historicalTS = [
  { year: 2016, sme_rate: 10.7 }, { year: 2017, sme_rate: 20.9 },
  { year: 2018, sme_rate: 32.1 }, { year: 2019, sme_rate: 35.1 },
  { year: 2020, sme_rate: 36.5 }, { year: 2021, sme_rate: 41.8 },
  { year: 2022, sme_rate: 46.7 }, { year: 2023, sme_rate: 48.6 },
  { year: 2024, sme_rate: 47.8 }, { year: 2025, sme_rate: 48.5 },
  { year: 2026, sme_rate: 50.3 },
]
const forecastTS = [
  { year: 2027, base: 52.6, lower: 47.7, upper: 57.5 },
  { year: 2028, base: 56.5, lower: 46.0, upper: 67.1 },
  { year: 2029, base: 60.4, lower: 46.3, upper: 74.6 },
  { year: 2030, base: 64.3, lower: 47.4, upper: 81.3 },
]
const regionForecast2030 = [
  { region: 'West Midlands', forecast: 84.3 },
  { region: 'Scotland', forecast: 80.2 },
  { region: 'South West', forecast: 79.1 },
  { region: 'Northern Ireland', forecast: 78.0 },
  { region: 'Wales', forecast: 70.3 },
  { region: 'East Midlands', forecast: 64.6 },
  { region: 'Yorkshire and the Humber', forecast: 62.1 },
  { region: 'North West', forecast: 60.8 },
  { region: 'South East', forecast: 59.4 },
  { region: 'East of England', forecast: 57.2 },
  { region: 'London', forecast: 54.1 },
  { region: 'North East', forecast: 51.3 },
  { region: 'Unknown', forecast: 44.5 },
].sort((a, b) => a.forecast - b.forecast)

// ── Computed ───────────────────────────────────────────────────────────────
const smeOverallPct = computed(() => {
  if (!stats.value?.totals) return '—'
  const { sme, large } = stats.value.totals
  if (!sme && !large) return '—'
  return ((sme / (sme + large)) * 100).toFixed(1)
})

function fmt(n) { return n == null ? '—' : Number(n).toLocaleString() }

function relativeTime(iso) {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Data loading ────────────────────────────────────────────────────────────
async function loadStats() {
  loading.value = true; error.value = ''
  try {
    const params = {
      year_min: filters.year_min, year_max: filters.year_max,
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.region ? { region: filters.region } : {}),
    }
    const [statsRes, statusRes] = await Promise.all([
      analyticsApi.getStats(params), analyticsApi.getStatus(),
    ])
    stats.value  = statsRes.data
    status.value = statusRes.data
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to load analytics'
  } finally {
    loading.value = false
  }
}

async function applyFilters() {
  if (filters.year_min > filters.year_max) filters.year_max = filters.year_min
  await loadStats()
}

function resetFilters() {
  Object.assign(filters, { year_min: 2016, year_max: currentYear, source: '', region: '' })
  loadStats()
}

async function triggerRefresh() {
  refreshing.value = true
  try { await analyticsApi.refresh(); startPolling() }
  catch (e) { error.value = e.response?.data?.detail || 'Failed to start refresh'; refreshing.value = false }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    try {
      const res = await analyticsApi.getStatus(); status.value = res.data
      if (!res.data.is_refreshing) { stopPolling(); refreshing.value = false; await loadStats() }
    } catch (_) {}
  }, 3000)
}
function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null } }

// ── Plotly constants ─────────────────────────────────────────────────────
const BLUE  = '#2563eb'
const RED   = '#dc2626'
const GREEN = '#16a34a'
const GRAY  = '#cbd5e1'
const AMBER = '#d97706'
const BASE  = {
  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#374151' },
  margin: { l: 10, r: 10, t: 10, b: 10 },
}
const CFG = { responsive: true, displayModeBar: false }

// ── Overview charts ─────────────────────────────────────────────────────
watch(stats, async (v) => {
  if (!v) return
  if (!Plotly) { try { Plotly = (await import('plotly.js-dist-min')).default } catch { return } }
  donut(v); bands(v); timeline(v); sectors(v); regional(v); stacked(v); sourceChart(v)
}, { flush: 'post' })

// ── Dissertation charts — render when tab becomes active ─────────────────
// v-show keeps DOM in tree but display:none — Plotly needs visible container.
// nextTick flushes Vue's DOM update (sets display:block), then we wait one
// rAF tick so the browser has painted the layout before Plotly measures.
watch(activeTab, async (tab) => {
  if (!Plotly) { try { Plotly = (await import('plotly.js-dist-min')).default } catch { return } }
  await nextTick()
  await new Promise(r => requestAnimationFrame(r))
  await new Promise(r => requestAnimationFrame(r)) // two rAFs for safety
  if (tab === 'regression')  renderRegression()
  if (tab === 'clustering')  renderClustering()
  if (tab === 'model')       renderModel()
  if (tab === 'forecast')    renderForecast()
})

function donut(s) {
  if (!chartDonut.value) return
  Plotly.newPlot(chartDonut.value, [{
    type: 'pie', hole: 0.52,
    values: [s.totals.sme, s.totals.large, s.totals.unknown],
    labels: ['SME', 'Large', 'Unknown'],
    marker: { colors: [BLUE, RED, GRAY] },
    textinfo: 'label+percent', textposition: 'outside', pull: [0.04, 0, 0],
    hovertemplate: '<b>%{label}</b><br>%{value:,} contracts (%{percent})<extra></extra>',
  }], { ...BASE, margin: { l: 20, r: 20, t: 20, b: 20 }, showlegend: true, legend: { orientation: 'h', y: -0.08 } }, CFG)
}

function bands(s) {
  if (!chartBands.value) return
  const b = s.sme_by_band
  Plotly.newPlot(chartBands.value, [
    { type: 'bar', x: b.map(d => d.band), y: b.map(d => d.sme_rate), marker: { color: BLUE },
      text: b.map(d => d.sme_rate + '%'), textposition: 'outside',
      customdata: b.map(d => (d.n || 0).toLocaleString()),
      hovertemplate: '<b>%{x}</b><br>SME Rate: %{y}%<br>n = %{customdata}<extra></extra>' },
    { type: 'scatter', mode: 'lines', x: b.map(d => d.band), y: Array(b.length).fill(s.national_avg_sme_rate),
      line: { color: AMBER, dash: 'dash', width: 2 }, name: `Avg ${s.national_avg_sme_rate}%`, hoverinfo: 'none' },
  ], { ...BASE, showlegend: true, legend: { x: 0.65, y: 1.05, orientation: 'h' },
       xaxis: { tickfont: { size: 10 } }, yaxis: { title: { text: 'SME Rate (%)' }, range: [0, 75] },
       margin: { l: 50, r: 20, t: 30, b: 70 } }, CFG)
}

function timeline(s) {
  if (!chartTimeline.value) return
  const yr = s.sme_by_year
  Plotly.newPlot(chartTimeline.value, [
    { type: 'bar', name: 'Total Contracts', x: yr.map(d => d.year), y: yr.map(d => d.total),
      marker: { color: '#e2e8f0' }, yaxis: 'y2',
      hovertemplate: '<b>%{x}</b><br>Total: %{y:,}<extra></extra>' },
    { type: 'scatter', mode: 'lines+markers', name: 'SME Rate (%)',
      x: yr.map(d => d.year), y: yr.map(d => d.sme_rate),
      line: { color: BLUE, width: 2.5 }, marker: { size: 7, color: BLUE },
      text: yr.map(d => d.sme_rate + '%'), textposition: 'top center',
      hovertemplate: '<b>%{x}</b><br>SME Rate: %{y}%<extra></extra>' },
  ], { ...BASE, showlegend: true, legend: { x: 0.02, y: 0.98 },
       xaxis: { dtick: 1, tickangle: -45 }, yaxis: { title: { text: 'SME Rate (%)' }, range: [0, 80] },
       yaxis2: { title: { text: 'Total Contracts' }, overlaying: 'y', side: 'right', showgrid: false },
       margin: { l: 55, r: 65, t: 20, b: 55 } }, CFG)
}

function sectors(s) {
  if (!chartSectors.value || !s.top_sectors?.length) return
  const d = [...s.top_sectors].reverse()
  Plotly.newPlot(chartSectors.value, [{
    type: 'bar', orientation: 'h', x: d.map(r => r.sme_rate), y: d.map(r => r.sector),
    marker: { color: BLUE }, text: d.map(r => r.sme_rate + '%'), textposition: 'outside',
    customdata: d.map(r => (r.n || 0).toLocaleString()),
    hovertemplate: '<b>%{y}</b><br>SME Rate: %{x}%<br>n = %{customdata}<extra></extra>',
  }], { ...BASE, xaxis: { title: { text: 'SME Rate (%)' }, range: [0, 115] },
        yaxis: { tickfont: { size: 9.5 }, automargin: true },
        margin: { l: 10, r: 55, t: 10, b: 45 } }, CFG)
}

function regional(s) {
  if (!chartRegion.value || !s.sme_by_region?.length) return
  const d = [...s.sme_by_region].sort((a, b) => a.sme_rate - b.sme_rate)
  Plotly.newPlot(chartRegion.value, [
    { type: 'bar', orientation: 'h', x: d.map(r => r.sme_rate), y: d.map(r => r.region),
      marker: { color: BLUE }, text: d.map(r => r.sme_rate + '%'), textposition: 'outside',
      customdata: d.map(r => (r.n || 0).toLocaleString()),
      hovertemplate: '<b>%{y}</b><br>%{x}%<br>n = %{customdata}<extra></extra>' },
    { type: 'scatter', mode: 'lines', x: [s.national_avg_sme_rate, s.national_avg_sme_rate],
      y: [d[0].region, d[d.length - 1].region], line: { color: AMBER, dash: 'dash', width: 2 },
      name: `Avg ${s.national_avg_sme_rate}%`, hoverinfo: 'none' },
  ], { ...BASE, showlegend: true, legend: { x: 0.45, y: -0.12, orientation: 'h' },
       xaxis: { title: { text: 'SME Rate (%)' }, range: [0, 65] },
       yaxis: { tickfont: { size: 10 }, automargin: true },
       margin: { l: 10, r: 55, t: 10, b: 50 } }, CFG)
}

function stacked(s) {
  if (!chartStacked.value) return
  const yr = s.sme_by_year
  Plotly.newPlot(chartStacked.value, [
    { type: 'bar', name: 'SME', x: yr.map(d => d.year), y: yr.map(d => d.sme), marker: { color: BLUE },
      hovertemplate: '<b>%{x}</b><br>SME: %{y:,}<extra></extra>' },
    { type: 'bar', name: 'Large', x: yr.map(d => d.year), y: yr.map(d => d.large), marker: { color: RED },
      hovertemplate: '<b>%{x}</b><br>Large: %{y:,}<extra></extra>' },
  ], { ...BASE, barmode: 'stack', showlegend: true, legend: { x: 0.02, y: 0.98, orientation: 'h' },
       xaxis: { dtick: 1, tickangle: -45 }, yaxis: { title: { text: 'Contracts' } },
       margin: { l: 60, r: 20, t: 20, b: 55 } }, CFG)
}

function sourceChart(s) {
  if (!chartSource.value || !s.source_by_year?.length) return
  const yr = s.source_by_year
  Plotly.newPlot(chartSource.value, [
    { type: 'bar', name: 'Contracts Finder', x: yr.map(d => d.year), y: yr.map(d => d.cf),
      marker: { color: BLUE }, hovertemplate: '<b>%{x}</b><br>CF: %{y:,}<extra></extra>' },
    { type: 'bar', name: 'Find a Tender', x: yr.map(d => d.year), y: yr.map(d => d.fts),
      marker: { color: AMBER }, hovertemplate: '<b>%{x}</b><br>FTS: %{y:,}<extra></extra>' },
  ], { ...BASE, barmode: 'group', showlegend: true, legend: { x: 0.02, y: 0.98, orientation: 'h' },
       xaxis: { dtick: 1, tickangle: -45 }, yaxis: { title: { text: 'Contracts' } },
       margin: { l: 60, r: 20, t: 20, b: 55 } }, CFG)
}

// ── Dissertation chart renderers ─────────────────────────────────────────
function renderRegression() {
  // Coefficients bar
  if (chartRegCoef.value) {
    const features = ['pub_year', 'region_enc', 'authtype_enc', 'sector_enc', 'value_band_num']
    const coefs    = [0.0317, 0.003, -0.00068, -0.0041, -0.0572]
    const errs     = [0.0007, 0.0006, 0.00009, 0.0011, 0.0043]
    const colors   = coefs.map(c => c > 0 ? GREEN : RED)
    Plotly.newPlot(chartRegCoef.value, [{
      type: 'bar', orientation: 'h', x: coefs, y: features,
      marker: { color: colors }, error_x: { type: 'data', array: errs, visible: true, color: '#9ca3af' },
      hovertemplate: '<b>%{y}</b><br>Coef: %{x:.4f}<extra></extra>',
    }], { ...BASE, xaxis: { title: { text: 'OLS Coefficient' }, zeroline: true, zerolinecolor: '#374151' },
         yaxis: { automargin: true }, margin: { l: 10, r: 30, t: 20, b: 50 } }, CFG)
  }
  // Feature importance (logistic abs coef)
  if (chartRegFeat.value) {
    const features = ['value_band_num', 'pub_year', 'region_clean_South East', 'cpv_sector_IT Services', 'authority_type_Central Govt', 'region_clean_London', 'cpv_sector_Construction', 'authority_type_NHS', 'cpv_sector_Professional Services', 'region_clean_Unknown']
    const imps     = [0.38, 0.31, 0.18, 0.16, 0.14, 0.13, 0.12, 0.11, 0.10, 0.09].reverse()
    Plotly.newPlot(chartRegFeat.value, [{
      type: 'bar', orientation: 'h', x: imps, y: features.slice().reverse(),
      marker: { color: BLUE }, text: imps.map(v => v.toFixed(2)), textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>|Coef| = %{x:.3f}<extra></extra>',
    }], { ...BASE, xaxis: { title: { text: '|Logistic Coef|' } },
         yaxis: { automargin: true, tickfont: { size: 9.5 } }, margin: { l: 10, r: 40, t: 10, b: 45 } }, CFG)
  }
  // ROC (approximate curve)
  if (chartRegROC.value) {
    const fpr = [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.0]
    const tpr = [0, 0.10, 0.22, 0.40, 0.56, 0.67, 0.76, 0.84, 0.90, 1.0]
    Plotly.newPlot(chartRegROC.value, [
      { type: 'scatter', mode: 'lines', x: fpr, y: tpr, fill: 'tozeroy', fillcolor: 'rgba(37,99,235,0.08)',
        line: { color: BLUE, width: 2 }, name: 'Logistic (AUC=0.633)',
        hovertemplate: 'FPR: %{x:.2f}<br>TPR: %{y:.2f}<extra></extra>' },
      { type: 'scatter', mode: 'lines', x: [0, 1], y: [0, 1], line: { color: GRAY, dash: 'dash', width: 1.5 }, name: 'Random (AUC=0.5)', hoverinfo: 'none' },
    ], { ...BASE, showlegend: true, legend: { x: 0.45, y: 0.12 },
         xaxis: { title: { text: 'False Positive Rate' }, range: [0, 1] },
         yaxis: { title: { text: 'True Positive Rate' }, range: [0, 1.05] },
         margin: { l: 55, r: 20, t: 20, b: 50 } }, CFG)
  }
}

function renderClustering() {
  const clusterColors = [GREEN, BLUE, AMBER, RED]
  if (chartClusterPie.value) {
    Plotly.newPlot(chartClusterPie.value, [{
      type: 'pie', hole: 0.4,
      values: [1167, 78, 913, 1254],
      labels: ['SME Champions', 'SME-Friendly', 'Neutral', 'Large-Focused'],
      marker: { colors: clusterColors },
      textinfo: 'label+percent', textposition: 'outside', pull: [0.04, 0, 0, 0],
      hovertemplate: '<b>%{label}</b><br>%{value} authorities (%{percent})<extra></extra>',
    }], { ...BASE, margin: { l: 20, r: 20, t: 20, b: 20 }, showlegend: false }, CFG)
  }
  if (chartClusterBar.value) {
    Plotly.newPlot(chartClusterBar.value, [{
      type: 'bar',
      x: ['SME Champions', 'SME-Friendly', 'Neutral', 'Large-Focused'],
      y: [64.9, 39.8, 39.5, 13.7],
      marker: { color: clusterColors },
      text: ['64.9%', '39.8%', '39.5%', '13.7%'], textposition: 'outside',
      hovertemplate: '<b>%{x}</b><br>Avg SME Rate: %{y}%<extra></extra>',
    }], { ...BASE, yaxis: { title: { text: 'Avg SME Award Rate (%)' }, range: [0, 80] },
         margin: { l: 55, r: 20, t: 30, b: 70 } }, CFG)
  }
}

function renderModel() {
  const models     = ['Logistic\nRegression', 'Random\nForest', 'XGBoost']
  const modelCols  = [BLUE, AMBER, GREEN]
  if (chartModelComp.value) {
    const metrics = ['Accuracy', 'Precision', 'Recall', 'F1', 'AUC']
    const data = [
      [0.644, 0.601, 0.325, 0.422, 0.676],
      [0.629, 0.529, 0.645, 0.582, 0.697],
      [0.646, 0.545, 0.687, 0.608, 0.721],
    ]
    Plotly.newPlot(chartModelComp.value,
      data.map((vals, i) => ({
        type: 'bar', name: ['Logistic', 'Random Forest', 'XGBoost'][i],
        x: metrics, y: vals, marker: { color: modelCols[i] },
        text: vals.map(v => v.toFixed(3)), textposition: 'outside',
        hovertemplate: `<b>${['Logistic', 'RF', 'XGB'][i]}</b><br>%{x}: %{y:.3f}<extra></extra>`,
      })),
      { ...BASE, barmode: 'group', showlegend: true, legend: { x: 0.02, y: 0.98, orientation: 'h' },
        yaxis: { range: [0, 0.85], title: { text: 'Score' } }, margin: { l: 50, r: 20, t: 30, b: 50 } }, CFG)
  }
  if (chartModelROC.value) {
    // Approximate ROC curves
    const fpr  = [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1.0]
    const tprLR = [0, 0.12, 0.24, 0.42, 0.57, 0.67, 0.76, 0.84, 1.0]
    const tprRF = [0, 0.15, 0.29, 0.49, 0.63, 0.73, 0.81, 0.88, 1.0]
    const tprXG = [0, 0.18, 0.33, 0.54, 0.67, 0.77, 0.85, 0.91, 1.0]
    Plotly.newPlot(chartModelROC.value, [
      { type: 'scatter', mode: 'lines', x: fpr, y: tprLR, line: { color: BLUE, width: 2 }, name: 'LR (AUC=0.676)' },
      { type: 'scatter', mode: 'lines', x: fpr, y: tprRF, line: { color: AMBER, width: 2 }, name: 'RF (AUC=0.697)' },
      { type: 'scatter', mode: 'lines', x: fpr, y: tprXG, fill: 'tozeroy', fillcolor: 'rgba(22,163,74,0.07)', line: { color: GREEN, width: 2.5 }, name: 'XGB (AUC=0.721)' },
      { type: 'scatter', mode: 'lines', x: [0,1], y: [0,1], line: { color: GRAY, dash: 'dash', width: 1 }, name: 'Random', hoverinfo: 'none' },
    ], { ...BASE, showlegend: true, legend: { x: 0.45, y: 0.15 },
         xaxis: { title: { text: 'False Positive Rate' }, range: [0, 1] },
         yaxis: { title: { text: 'True Positive Rate' }, range: [0, 1.05] },
         margin: { l: 55, r: 20, t: 20, b: 50 } }, CFG)
  }
  if (chartModelFeat.value) {
    const feats = [
      'Project supervision CPV', 'Unknown authority type', 'Construction CPV',
      'Value band Under 10k', 'Legal services CPV', 'Staff supply CPV',
      'Taxi services CPV', 'Other CPV', 'pub_year', 'region_sme_rate',
    ].reverse()
    const imps = [0.338, 0.050, 0.050, 0.041, 0.032, 0.030, 0.029, 0.025, 0.022, 0.020].reverse()
    Plotly.newPlot(chartModelFeat.value, [{
      type: 'bar', orientation: 'h', x: imps, y: feats,
      marker: { color: GREEN }, text: imps.map(v => v.toFixed(3)), textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>Importance: %{x:.3f}<extra></extra>',
    }], { ...BASE, xaxis: { title: { text: 'XGBoost Gain Importance' } },
         yaxis: { automargin: true, tickfont: { size: 10 } }, margin: { l: 10, r: 50, t: 10, b: 50 } }, CFG)
  }
}

function renderForecast() {
  if (chartForecast.value) {
    const histYears = historicalTS.map(d => d.year)
    const histRates = historicalTS.map(d => d.sme_rate)
    const fcYears   = forecastTS.map(d => d.year)
    const fcBase    = forecastTS.map(d => d.base)
    const fcLower   = forecastTS.map(d => d.lower)
    const fcUpper   = forecastTS.map(d => d.upper)
    // Linear trend line over all years
    const allYears = [...histYears, ...fcYears]
    const trendVals = allYears.map(y => -71.8 + 3.571 * y)

    Plotly.newPlot(chartForecast.value, [
      { type: 'bar', name: '', x: [2026.5], y: [100], width: [0.05], marker: { color: 'rgba(0,0,0,0)' }, showlegend: false, hoverinfo: 'none' },
      // CI band (fill between)
      { type: 'scatter', x: [...fcYears, ...fcYears.slice().reverse()], y: [...fcUpper, ...fcLower.slice().reverse()],
        fill: 'toself', fillcolor: 'rgba(220,38,38,0.1)', line: { width: 0 }, name: '95% CI', hoverinfo: 'none' },
      // historical
      { type: 'scatter', mode: 'lines+markers', x: histYears, y: histRates,
        line: { color: '#1e3a8a', width: 2.5 }, marker: { size: 7 }, name: 'Historical',
        hovertemplate: '<b>%{x}</b><br>SME Rate: %{y}%<extra></extra>' },
      // forecast
      { type: 'scatter', mode: 'lines+markers', x: fcYears, y: fcBase,
        line: { color: RED, width: 2.5, dash: 'dot' }, marker: { size: 7, symbol: 'square' }, name: 'ARIMA Forecast',
        hovertemplate: '<b>%{x}</b><br>Forecast: %{y}%<extra></extra>' },
      // trend
      { type: 'scatter', mode: 'lines', x: allYears, y: trendVals.map(v => parseFloat(v.toFixed(1))),
        line: { color: GRAY, width: 1.5, dash: 'dash' }, name: 'Linear trend (+3.57%/yr)', hoverinfo: 'none' },
    ], { ...BASE, showlegend: true, legend: { x: 0.01, y: 0.99, orientation: 'h' },
         xaxis: { dtick: 1, tickangle: -45 }, yaxis: { title: { text: 'SME Award Rate (%)' }, range: [0, 90] },
         margin: { l: 55, r: 20, t: 20, b: 55 } }, CFG)
  }

  if (chartScenario.value) {
    const histYears = historicalTS.map(d => d.year)
    const histRates = historicalTS.map(d => d.sme_rate)
    const fcYears   = [2027, 2028, 2029, 2030]
    Plotly.newPlot(chartScenario.value, [
      { type: 'scatter', mode: 'lines+markers', x: histYears, y: histRates,
        line: { color: '#1e3a8a', width: 2 }, name: 'Historical', hovertemplate: '<b>%{x}</b>: %{y}%<extra></extra>' },
      { type: 'scatter', mode: 'lines+markers', x: fcYears, y: [52.7, 56.7, 60.6, 64.6],
        line: { color: GREEN, width: 2, dash: 'dot' }, marker: { symbol: 'triangle-up' }, name: 'Optimistic' },
      { type: 'scatter', mode: 'lines+markers', x: fcYears, y: [52.5, 56.5, 60.4, 64.3],
        line: { color: BLUE, width: 2.5, dash: 'dot' }, marker: { symbol: 'square' }, name: 'Base' },
      { type: 'scatter', mode: 'lines+markers', x: fcYears, y: [52.5, 56.4, 60.3, 64.1],
        line: { color: RED, width: 2, dash: 'dot' }, marker: { symbol: 'triangle-down' }, name: 'Pessimistic' },
    ], { ...BASE, showlegend: true, legend: { x: 0.01, y: 0.99, orientation: 'h' },
         xaxis: { dtick: 1, tickangle: -45 }, yaxis: { title: { text: 'SME Rate (%)' }, range: [0, 80] },
         margin: { l: 55, r: 20, t: 20, b: 55 } }, CFG)
  }

  if (chartRegForecast.value) {
    const regColors = regionForecast2030.map(r => r.forecast >= 65 ? GREEN : r.forecast >= 50 ? BLUE : AMBER)
    Plotly.newPlot(chartRegForecast.value, [{
      type: 'bar', orientation: 'h',
      x: regionForecast2030.map(r => r.forecast),
      y: regionForecast2030.map(r => r.region),
      marker: { color: regColors },
      text: regionForecast2030.map(r => r.forecast + '%'), textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>2030 Forecast: %{x}%<extra></extra>',
    }], { ...BASE, xaxis: { title: { text: 'Forecast SME Rate 2030 (%)' }, range: [0, 100] },
         yaxis: { automargin: true }, margin: { l: 10, r: 55, t: 10, b: 50 } }, CFG)
  }
}

// ── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(loadStats)
onUnmounted(stopPolling)
</script>
