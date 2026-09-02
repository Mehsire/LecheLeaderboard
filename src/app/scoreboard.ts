import { DOCUMENT } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { EventDataService } from './event-data.service';
import { formatAmount, slotRankLabel, teamsByRankSlot } from './event-data';
import { ViewOptionsService } from './view-options';

const SLOT_ACCENTS: Record<number, string> = {
  1: '#5bbefa',
  2: '#29f084',
  3: '#febd11',
  4: '#f80a0b',
};

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.html',
  styleUrl: './scoreboard.css',
  providers: [ViewOptionsService],
})
export class Scoreboard {
  private readonly document = inject(DOCUMENT);
  private readonly eventData = inject(EventDataService);
  private readonly view = inject(ViewOptionsService);

  protected readonly backgroundUrl = new URL('background.png', this.document.baseURI).toString();
  protected readonly coinMaskUrl = `url("${new URL('currency-icon.svg', this.document.baseURI)}")`;
  protected readonly rankedSlots = computed(() => teamsByRankSlot(this.eventData.data()?.teams ?? []));
  protected readonly error = computed(() => this.eventData.error());
  protected readonly loading = computed(() => this.eventData.loading());
  protected readonly formatAmount = formatAmount;
  protected readonly slotRankLabel = slotRankLabel;

  protected slotAccent(position: number): string {
    return SLOT_ACCENTS[position] ?? SLOT_ACCENTS[1];
  }
}
