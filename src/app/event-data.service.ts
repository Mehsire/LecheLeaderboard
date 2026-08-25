import { computed, effect, inject, Injectable, resource, signal } from '@angular/core';
import { EventScoreboard } from './event-data';
import { EventLoaderService } from './event-loader.service';
import { EVENT_SHEET } from './sheet';

@Injectable({ providedIn: 'root' })
export class EventDataService {
  private readonly loader = inject(EventLoaderService);
  private readonly tick = signal(0);
  /** Keep showing the last successful payload while a refresh is in flight. */
  private readonly lastGood = signal<EventScoreboard | null>(null);

  private readonly eventResource = resource({
    params: () => this.tick(),
    loader: () => this.loader.loadEvent(),
  });

  readonly data = computed(() => this.eventResource.value() ?? this.lastGood());
  readonly error = computed(() => {
    if (this.data()) {
      return null;
    }
    return this.eventResource.error() ? 'Could not load scoreboard data.' : null;
  });
  /** True only for the initial load, not background refreshes. */
  readonly loading = computed(() => this.eventResource.isLoading() && !this.data());

  constructor() {
    effect(() => {
      const value = this.eventResource.value();
      if (value) {
        this.lastGood.set(value);
      }
    });

    effect((onCleanup) => {
      const handle = setInterval(
        () => this.tick.update((n) => n + 1),
        EVENT_SHEET.refreshSeconds * 1000,
      );
      onCleanup(() => clearInterval(handle));
    });
  }
}
