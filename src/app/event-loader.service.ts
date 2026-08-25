import { DOCUMENT } from '@angular/common';
import { inject, Injectable, NgZone } from '@angular/core';
import { EventScoreboard } from './event-data';
import {
  GvizResponse,
  mergeScoreboardAndSummaries,
  parseScoreboard,
  parseTeamSummaries,
} from './gviz';
import { EVENT_SHEET, sheetGvizUrl } from './sheet';

@Injectable({ providedIn: 'root' })
export class EventLoaderService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);

  loadEvent(): Promise<EventScoreboard> {
    return Promise.all([
      this.fetchRange(EVENT_SHEET.scoreboardRange),
      this.fetchRange(EVENT_SHEET.teamSummaryRange),
    ]).then(([scoreboardPayload, summaryPayload]) => {
      const scoreboard = parseScoreboard(scoreboardPayload);
      const summaries = parseTeamSummaries(summaryPayload);
      return mergeScoreboardAndSummaries(scoreboard, summaries);
    });
  }

  private fetchRange(range: string): Promise<GvizResponse> {
    const callback = `lecheGviz_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const url = sheetGvizUrl(callback, range);

    return new Promise<GvizResponse>((resolve, reject) => {
      const win = this.document.defaultView as (Window & Record<string, unknown>) | null;
      if (!win) {
        reject(new Error('No window for Google Sheet JSONP.'));
        return;
      }

      const script = this.document.createElement('script');
      let settled = false;
      const cleanup = () => {
        win.clearTimeout(timer);
        delete win[callback];
        script.remove();
      };

      const timer = win.setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(new Error('Timed out loading the Google Sheet.'));
      }, 15000);

      win[callback] = (payload: GvizResponse) => {
        this.zone.run(() => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          resolve(payload);
        });
      };

      script.onerror = () => {
        this.zone.run(() => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          reject(new Error('Could not reach the Google Sheet.'));
        });
      };

      script.src = url;
      this.document.body.appendChild(script);
    });
  }
}
