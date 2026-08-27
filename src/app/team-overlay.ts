import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { EventDataService } from './event-data.service';
import { formatAmount, CURRENCY_ICON, teamById } from './event-data';
import { loadEventSponsors } from './sponsors';
import { ViewOptionsService } from './view-options';

type Segment = 'team' | 'sponsors';

@Component({
  selector: 'app-team-overlay',
  templateUrl: './team-overlay.html',
  styleUrl: './overlay.css',
  providers: [ViewOptionsService],
})
export class TeamOverlay {
  private readonly route = inject(ActivatedRoute);
  private readonly eventData = inject(EventDataService);
  private readonly document = inject(DOCUMENT);
  protected readonly view = inject(ViewOptionsService);
  protected readonly currencyIcon = CURRENCY_ICON;

  private readonly teamId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('teamId')))),
    { requireSync: true },
  );

  private readonly stableSponsorImages = signal<string[]>([]);

  private readonly sponsorResource = resource({
    loader: () => loadEventSponsors(this.document.baseURI),
  });

  protected readonly segment = signal<Segment>('team');

  protected readonly team = computed(() => {
    const board = this.eventData.data();
    const id = this.teamId();
    return board && Number.isFinite(id) ? teamById(board, id) : undefined;
  });

  protected readonly error = computed(() => {
    if (this.eventData.error()) {
      return this.eventData.error();
    }
    if (this.eventData.data() && !this.team()) {
      return `No team found for Team ${this.teamId()}.`;
    }
    return null;
  });

  protected readonly loading = computed(() => this.eventData.loading());
  protected readonly formatAmount = formatAmount;

  protected readonly sponsorImages = computed(() => {
    const fresh = this.sponsorResource.value();
    return fresh?.length ? fresh : this.stableSponsorImages();
  });

  private readonly rotationConfig = computed(() => {
    const options = this.view.options();
    const images = this.stableSponsorImages();
    if (options.teamSec === null || options.sponsorSec === null || images.length === 0) {
      return null;
    }
    return { teamSec: options.teamSec, sponsorSec: options.sponsorSec };
  });

  protected readonly rotationEnabled = computed(() => this.rotationConfig() !== null);

  constructor() {
    effect(() => {
      const value = this.sponsorResource.value();
      if (value?.length) {
        this.stableSponsorImages.set(value);
      }
    });

    effect((onCleanup) => {
      const config = this.rotationConfig();
      if (!config) {
        this.segment.set('team');
        return;
      }

      let current: Segment = 'team';
      this.segment.set(current);

      let handle: ReturnType<typeof setTimeout> | undefined;
      const schedule = () => {
        const waitMs =
          (current === 'team' ? config.teamSec : config.sponsorSec) * 1000;
        handle = setTimeout(() => {
          current = current === 'team' ? 'sponsors' : 'team';
          this.segment.set(current);
          schedule();
        }, waitMs);
      };

      schedule();
      onCleanup(() => {
        if (handle) {
          clearTimeout(handle);
        }
      });
    });
  }
}
