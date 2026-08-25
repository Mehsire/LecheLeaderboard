import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { map } from 'rxjs';
import { parseViewOptions, ViewOptions } from './event-data';
import { EVENT_SHEET } from './sheet';

@Injectable()
export class ViewOptionsService {
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  readonly options = toSignal(
    this.route.queryParamMap.pipe(map((params) => parseViewOptions(toSearchParams(params)))),
    { requireSync: true },
  );

  logoSrc(options: ViewOptions): string {
    if (options.logoUrl) {
      return options.logoUrl;
    }
    return new URL(EVENT_SHEET.defaultLogo, this.document.baseURI).toString();
  }

  constructor() {
    effect((onCleanup) => {
      const preview = this.options().preview;
      this.document.body.classList.toggle('preview', preview);
      onCleanup(() => this.document.body.classList.remove('preview'));
    });
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
