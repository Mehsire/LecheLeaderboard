import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { map } from 'rxjs';
import { formatScore, parseOverlayOptions, rankBoard } from './board';
import { BoardLoader } from './board-loader';
import { findEntry } from './gviz';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class Leaderboard {
  private readonly route = inject(ActivatedRoute);
  private readonly loader = inject(BoardLoader);
  private readonly document = inject(DOCUMENT);
  private readonly tick = signal(0);

  protected readonly options = toSignal(
    this.route.queryParamMap.pipe(map((params) => parseOverlayOptions(toSearchParams(params)))),
    { requireSync: true },
  );

  private readonly boardResource = resource({
    params: () => {
      this.tick();
      return this.options();
    },
    loader: ({ params }) => this.loader.load(params),
  });

  protected readonly board = computed(() => {
    const value = this.boardResource.value();
    return value ? rankBoard(value, this.options()) : null;
  });

  protected readonly selected = computed(() => {
    const name = this.options().name;
    const board = this.board();
    if (!name || !board) {
      return undefined;
    }
    return findEntry(board.entries, name) ?? null;
  });

  protected readonly error = computed(() => {
    if (this.boardResource.error()) {
      return 'Could not load leaderboard data.';
    }
    if (this.options().name && this.board() && this.selected() === null) {
      return `No score found for "${this.options().name}".`;
    }
    return null;
  });

  protected readonly loading = computed(() => this.boardResource.isLoading());

  constructor() {
    effect((onCleanup) => {
      const seconds = this.options().refresh;
      if (!seconds) {
        return;
      }
      const handle = setInterval(() => this.tick.update((n) => n + 1), seconds * 1000);
      onCleanup(() => clearInterval(handle));
    });

    effect((onCleanup) => {
      const preview = this.options().preview;
      this.document.body.classList.toggle('preview', preview);
      onCleanup(() => this.document.body.classList.remove('preview'));
    });
  }

  protected medal(rank: number): string {
    return ['🥇', '🥈', '🥉'][rank] ?? String(rank + 1);
  }

  protected scoreText(entry: { name: string; score: number; display?: string }): string {
    return formatScore(entry, this.board()?.unit);
  }
}

function toSearchParams(params: ParamMap): URLSearchParams {
  const search = new URLSearchParams();
  for (const key of params.keys) {
    const value = params.get(key);
    if (value !== null) {
      search.set(key, value);
    }
  }
  return search;
}
