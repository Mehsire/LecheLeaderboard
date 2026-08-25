import { Component, computed, inject } from '@angular/core';
import { EventDataService } from './event-data.service';
import { formatAmount } from './event-data';
import { ViewOptionsService } from './view-options';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.html',
  styleUrl: './scoreboard.css',
  providers: [ViewOptionsService],
})
export class Scoreboard {
  private readonly eventData = inject(EventDataService);
  protected readonly view = inject(ViewOptionsService);

  protected readonly teams = computed(() => this.eventData.data()?.teams ?? []);
  protected readonly error = computed(() => this.eventData.error());
  protected readonly loading = computed(() => this.eventData.loading());
  protected readonly formatAmount = formatAmount;

  protected logo(options = this.view.options()): string {
    return this.view.logoSrc(options);
  }
}
