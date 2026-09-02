import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  resource,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import {
  BugRotationTiming,
  formatBugScore,
  patchBugSvg,
  rankNumberFromSheet,
  updateBugValuesInDom,
} from './bug-svg';
import { EventDataService } from './event-data.service';
import { teamById } from './event-data';
import { ViewOptionsService } from './view-options';

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
  private readonly http = inject(HttpClient);
  protected readonly view = inject(ViewOptionsService);

  private readonly bugContainer = viewChild<ElementRef<HTMLElement>>('bugContainer');

  private readonly teamId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('teamId')))),
    { requireSync: true },
  );

  private readonly bugTemplate = resource({
    loader: () =>
      firstValueFrom(
        this.http.get(new URL('bug.svg', this.document.baseURI).toString(), {
          responseType: 'text',
        }),
      ),
  });

  protected readonly team = computed(() => {
    const board = this.eventData.data();
    const id = this.teamId();
    return board && Number.isFinite(id) ? teamById(board, id) : undefined;
  });

  private readonly rotationTiming = computed((): BugRotationTiming | null => {
    const options = this.view.options();
    if (options.teamSec === null || options.sponsorSec === null) {
      return null;
    }
    return { teamSec: options.teamSec, sponsorSec: options.sponsorSec };
  });

  private readonly bugShellKey = computed(() => {
    const rotation = this.rotationTiming();
    return rotation ? `${rotation.teamSec}:${rotation.sponsorSec}` : 'static';
  });

  protected readonly ready = computed(
    () => Boolean(this.bugTemplate.value()) && Boolean(this.team()),
  );

  protected readonly error = computed(() => {
    if (this.bugTemplate.error()) {
      return 'Could not load the overlay graphic.';
    }
    if (this.eventData.error()) {
      return this.eventData.error();
    }
    if (this.eventData.data() && !this.team()) {
      return `No team found for Team ${this.teamId()}.`;
    }
    return null;
  });

  protected readonly loading = computed(
    () => this.eventData.loading() || this.bugTemplate.isLoading(),
  );

  constructor() {
    afterRenderEffect(() => {
      if (!this.ready()) {
        return;
      }

      const template = this.bugTemplate.value();
      const data = this.team();
      const container = this.bugContainer()?.nativeElement;
      const shellKey = this.bugShellKey();
      const rotation = this.rotationTiming();

      if (!template || !data || !container) {
        return;
      }

      const values = {
        rankNumber: rankNumberFromSheet(data.rank),
        teamName: data.name,
        score: formatBugScore(data.total),
      };

      if (container.dataset['shellKey'] !== shellKey) {
        container.innerHTML = patchBugSvg(template, values, rotation);
        container.dataset['shellKey'] = shellKey;
        return;
      }

      updateBugValuesInDom(container, values);
    });
  }
}
