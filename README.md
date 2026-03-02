# Roast My GitHub

AI-powered developer profiling across GitHub, GitLab, Codeberg, and Bitbucket.
Enter a username, pick a tone, and get a structured assessment, comedy roast, or
creative take on any developer's public profile.

## Features

- **Multi-platform**: Analyze developers on GitHub, GitLab, Codeberg, and
  Bitbucket simultaneously
- **13 analysis tones**: Professional (Recruiter, Tech Lead, Senior Engineer, VC
  Investor, Blunt Coworker, Encouraging Mentor) and Fun (Comedy Roast, Code
  Detective, Sports Commentator, Code Therapist, Pirate Captain, Dungeon Master,
  Food Critic)
- **Temporal analysis**: Activity patterns across 30/90/365 day windows with
  trend detection (consistent, burst, declining, growing, inactive)
- **Conversational follow-ups**: Deep dive into repos, time frames, code review
  style, collaboration patterns, or ask custom questions
- **Export**: Download conversation as Markdown, plain text, HTML, or print to
  PDF
- **Text-to-speech**: Listen to the analysis via browser TTS or ElevenLabs
- **10 languages**: English, French, Portuguese, German, Dutch, Spanish,
  Italian, Japanese, Korean, Chinese
- **Custom personality**: Append your own instructions to any tone
- **Multiple LLM providers**: Anthropic (Claude), OpenAI (GPT), Google (Gemini)
- **Privacy**: All data stays in your browser. API keys stored in localStorage,
  never sent anywhere except the respective API endpoints

## Usage

1. Visit the app
2. Select one or more platforms and enter the username(s)
3. Pick a tone (Recruiter Report is the default for hiring assessments)
4. Click Analyze
5. After the analysis, use follow-up actions to go deeper
6. Export the conversation for your records

You need an API key from at least one LLM provider (Anthropic, OpenAI, or
Google). Configure it in Settings.

Platform tokens (GitHub PAT, GitLab token, etc.) are optional but recommended
for higher rate limits and access to more data.

## Development

```bash
make setup      # Install dependencies
make dev        # Run dev server
make test       # Run tests
make typecheck  # Type check
make build      # Production build
make format     # Format code
```

## Tech Stack

- SvelteKit + Svelte 5 (runes)
- TypeScript (strict)
- Tailwind CSS v4
- Vitest for testing
- marked for Markdown rendering
- simple-icons for platform logos
- Static site adapter (GitHub Pages / any static host)

## License

MIT
