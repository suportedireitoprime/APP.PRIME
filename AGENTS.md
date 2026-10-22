<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Direito Prime app imported wholesale into src/ (pages, components, hooks...) and mounted client-only via src/routes/index.tsx + $.tsx (LegacyAppHost) because the code touches window at import.
- react-router-dom is aliased in vite.config.ts to src/lib/router-compat.tsx (TanStack-backed shim) so the imported code runs unchanged; never install react-router-dom.
- Tailwind v3 config kept at tailwind.config.ts and loaded from src/styles.css via @config to preserve the original theme.
- Audioleis shares AudioaulasHero with configurable title and count unit to keep both audio screens visually consistent.
- Lazy page imports use the shared retry/recovery utility; the error boundary shares its reload guard to prevent reload loops without unregistering push workers or deleting offline media.
- Subscription prices live only in src/lib/precos.ts (tested in precos.test.ts); UI and reports must import from it so prices never diverge.
