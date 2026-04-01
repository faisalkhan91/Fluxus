# Taming State with Angular Signals

State management is where frontend apps go to die. Redux boilerplate, RxJS marble diagrams, service spaghetti — we've all been there. Angular Signals offer a way out: reactive state that's simple to write, easy to trace, and performant by default.

In this post I'll share the patterns I've landed on after migrating a production app from a mix of BehaviorSubjects and component state to a Signals-first architecture.

## Why Signals Over RxJS?

RxJS isn't going anywhere — it's still the right tool for async streams, HTTP, and event composition. But for **synchronous, UI-bound state**, Signals win on every axis:

| Concern | BehaviorSubject | Signal |
|---------|----------------|--------|
| Boilerplate | `.getValue()`, `.next()`, `| async` | `.set()`, `.update()`, direct read |
| Change detection | Requires `OnPush` + `async` pipe | Granular, automatic |
| Debugging | Stack traces point to operators | Stack traces point to `.set()` call |
| Memory leaks | Easy to forget `unsubscribe` | No subscriptions to manage |
| Computed values | `combineLatest` + `map` | `computed()` — cached and lazy |

The mental model is simpler: a Signal is a value you can read synchronously and that automatically notifies anything that depends on it.

## Pattern 1: Service Signals for Shared State

Instead of a BehaviorSubject behind a getter:

```typescript
// Before — BehaviorSubject
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = new BehaviorSubject(true);
  isDark$ = this._isDark.asObservable();

  toggle(): void {
    this._isDark.next(!this._isDark.getValue());
  }
}
```

Use a signal directly:

```typescript
// After — Signal
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(true);

  toggle(): void {
    this.isDark.update(v => !v);
  }
}
```

No subscriptions, no `async` pipe, no `.getValue()` anti-pattern. Components read `themeService.isDark()` in templates and Angular handles the rest.

## Pattern 2: Computed Signals for Derived State

Computed signals replace `combineLatest` + `map` chains. They're lazy (only recalculate when read) and cached (don't recalculate if inputs haven't changed).

```typescript
@Injectable({ providedIn: 'root' })
export class BlogService {
  readonly posts = signal<BlogPost[]>([]);

  readonly latestPosts = computed(() =>
    [...this.posts()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3),
  );

  readonly tagCloud = computed(() => {
    const counts = new Map<string, number>();
    for (const post of this.posts()) {
      for (const tag of post.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return counts;
  });
}
```

`latestPosts` and `tagCloud` automatically stay in sync with `posts`. No glue code, no subscription management.

## Pattern 3: Component-Local Signals

For component state that doesn't need to be shared, signals replace class properties with reactive tracking:

```typescript
@Component({
  template: `
    @if (loading()) {
      <spinner />
    } @else {
      @for (item of items(); track item.id) {
        <card [data]="item" [expanded]="expandedIds().has(item.id)"
              (toggle)="onToggle(item.id)" />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly expandedIds = signal(new Set<string>());

  onToggle(id: string): void {
    this.expandedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
}
```

The `update()` pattern with immutable `Set` operations keeps change detection working correctly with `OnPush` — Angular sees a new reference, so it knows to re-render.

## Pattern 4: SSR Safety with afterNextRender

Signals play nicely with Angular's SSR story. Browser-only code (DOM access, scroll listeners, localStorage) goes inside `afterNextRender()`:

```typescript
export class ScrollComponent {
  readonly progress = signal(0);

  constructor() {
    afterNextRender(() => {
      const onScroll = () => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        this.progress.set(total > 0 ? (window.scrollY / total) * 100 : 0);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      inject(DestroyRef).onDestroy(() =>
        window.removeEventListener('scroll', onScroll),
      );
    });
  }
}
```

During SSR, `afterNextRender` simply doesn't execute — no `isPlatformBrowser` checks, no `typeof window` guards. The signal stays at its default value (`0`) and hydration picks up seamlessly.

## When to Still Use RxJS

Signals aren't a full replacement. Reach for RxJS when you need:

- **Async streams** — WebSockets, Server-Sent Events, polling intervals
- **Complex operators** — `debounceTime`, `switchMap`, `retry`, `distinctUntilChanged`
- **HTTP orchestration** — Chaining requests, race conditions, cancellation
- **Route params** — `ActivatedRoute.paramMap` is an Observable; use `switchMap` to react to changes, then land the result in a Signal

The bridge is `toSignal()` and `toObservable()`:

```typescript
readonly slug = toSignal(
  this.route.paramMap.pipe(map(p => p.get('slug') ?? '')),
  { initialValue: '' },
);
```

## Migration Strategy

If you're migrating an existing app, don't rewrite everything at once:

1. **New components** — Use signals from day one
2. **Shared services** — Migrate BehaviorSubjects to signals one service at a time
3. **Templates** — Replace `| async` with direct signal reads as you touch components
4. **Computed values** — Replace `combineLatest` chains with `computed()` signals
5. **Leave RxJS streams alone** — HTTP calls, route params, and WebSockets stay as Observables

The codebase will naturally converge over time. There's no big-bang migration required.

## Key Takeaways

- **Signals for state, RxJS for streams** — Draw a clear line
- **`computed()` is your best friend** — Free caching, automatic dependency tracking
- **`update()` for immutable patterns** — New references trigger `OnPush` change detection
- **`afterNextRender()` for browser APIs** — Clean SSR boundary, no platform checks
- **Migrate incrementally** — Signal and Observable code coexist happily

---

*The patterns in this post power the app you're reading right now. If you want to dig into the source, check out the [Projects](/projects) page or hit me up on [Contact](/contact).*
