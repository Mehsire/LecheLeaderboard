import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { EventDataService } from './event-data.service';
import { formatAmount, teamById } from './event-data';
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
  protected readonly view = inject(ViewOptionsService);

  private readonly teamId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('teamId')))),
    { requireSync: true },
  );

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
}
