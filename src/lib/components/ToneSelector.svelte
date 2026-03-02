<script lang="ts">
  import { tones, toneCategories, type Tone } from '$lib/prompts';
  import { t } from '$lib/i18n';
  import type { Translations } from '$lib/i18n';

  let {
    selected = $bindable('recruiter'),
    language = 'en',
  }: {
    selected: string;
    language?: string;
  } = $props();

  let i = $derived(t(language));

  // Map tone id to i18n label/desc keys
  const toneI18nKeys: Record<
    string,
    { label: keyof Translations; desc: keyof Translations }
  > = {
    recruiter: { label: 'toneRecruiterLabel', desc: 'toneRecruiterDesc' },
    interviewer: { label: 'toneInterviewerLabel', desc: 'toneInterviewerDesc' },
    senior: { label: 'toneSeniorLabel', desc: 'toneSeniorDesc' },
    coworker: { label: 'toneCoworkerLabel', desc: 'toneCoworkerDesc' },
    mentor: { label: 'toneMentorLabel', desc: 'toneMentorDesc' },
    investor: { label: 'toneInvestorLabel', desc: 'toneInvestorDesc' },
    roast: { label: 'toneRoastLabel', desc: 'toneRoastDesc' },
    detective: { label: 'toneDetectiveLabel', desc: 'toneDetectiveDesc' },
    sportscaster: {
      label: 'toneSportscasterLabel',
      desc: 'toneSportscasterDesc',
    },
    therapist: { label: 'toneTherapistLabel', desc: 'toneTherapistDesc' },
    pirate: { label: 'tonePirateLabel', desc: 'tonePirateDesc' },
    dungeon_master: {
      label: 'toneDungeonMasterLabel',
      desc: 'toneDungeonMasterDesc',
    },
    foodcritic: { label: 'toneFoodCriticLabel', desc: 'toneFoodCriticDesc' },
  };

  function toneLabel(tone: Tone): string {
    const keys = toneI18nKeys[tone.id];
    return keys ? i[keys.label] : tone.label;
  }

  function toneDesc(tone: Tone): string {
    const keys = toneI18nKeys[tone.id];
    return keys ? i[keys.desc] : tone.description;
  }

  let categoryLabels = $derived<
    Record<string, { label: string; desc: string }>
  >({
    professional: {
      label: i.categoryProfessional,
      desc: i.categoryProfessionalDesc,
    },
    fun: {
      label: i.categoryFun,
      desc: i.categoryFunDesc,
    },
  });

  let tonesByCategory = $derived(
    toneCategories.map(cat => ({
      ...cat,
      displayLabel: categoryLabels[cat.id]?.label ?? cat.label,
      displayDesc: categoryLabels[cat.id]?.desc ?? cat.description,
      tones: tones.filter(t => t.category === cat.id),
    })),
  );
</script>

<div class="space-y-4">
  {#each tonesByCategory as category (category.id)}
    <div>
      <div class="mb-2 flex items-center gap-2">
        <h3
          class="text-xs font-semibold uppercase tracking-wider
                 {category.id === 'professional'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-violet-600 dark:text-violet-400'}"
        >
          {category.displayLabel}
        </h3>
        <span class="text-[11px] text-zinc-400 dark:text-zinc-500">
          {category.displayDesc}
        </span>
      </div>
      <div
        class="grid grid-cols-2 gap-1.5
               sm:grid-cols-3 lg:grid-cols-4"
      >
        {#each category.tones as tone (tone.id)}
          <button
            type="button"
            onclick={() => (selected = tone.id)}
            class="group rounded-xl border px-3 py-2 text-left
                   transition-all
                   {selected === tone.id
              ? category.id === 'professional'
                ? 'border-blue-500 bg-blue-50 shadow-sm ' +
                  'dark:border-blue-400 dark:bg-blue-950'
                : 'border-violet-500 bg-violet-50 shadow-sm ' +
                  'dark:border-violet-400 dark:bg-violet-950'
              : 'border-zinc-200 bg-white ' +
                'hover:border-zinc-300 hover:shadow-sm ' +
                'dark:border-zinc-700 dark:bg-zinc-800/50 ' +
                'dark:hover:border-zinc-600'}"
          >
            <div class="flex items-center gap-1.5">
              <span class="text-base">{tone.emoji}</span>
              <span
                class="text-sm font-medium leading-tight
                       {selected === tone.id
                  ? category.id === 'professional'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-violet-700 dark:text-violet-300'
                  : 'text-zinc-800 dark:text-zinc-200'}"
              >
                {toneLabel(tone)}
              </span>
            </div>
            <div
              class="mt-0.5 pl-6 text-[11px] leading-tight
                     text-zinc-500 dark:text-zinc-400"
            >
              {toneDesc(tone)}
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>
