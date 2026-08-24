import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Board, OverlayOptions, parseRows } from './board';
import { entriesFromGviz, GvizResponse } from './gviz';
import { spendingSheetUrl } from './sheet';

@Injectable({ providedIn: 'root' })
export class BoardLoader {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);

  async load(options: OverlayOptions): Promise<Board> {
    if (options.rows) {
      return {
        title: options.title?.trim() || 'Leaderboard',
        unit: options.unit ?? undefined,
        entries: parseRows(options.rows),
      };
    }

    if (options.src) {
      return this.getBoard(options.src);
    }

    return this.loadSpendingSheet();
  }

  private getBoard(url: string): Promise<Board> {
    return firstValueFrom(this.http.get<Board>(url));
  }

  private loadSpendingSheet(): Promise<Board> {
    const callback = `lecheGviz_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const url = spendingSheetUrl(callback);

    return new Promise<Board>((resolve, reject) => {
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
          try {
            resolve(entriesFromGviz(payload));
          } catch (error) {
            reject(error);
          }
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
