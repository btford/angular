import {
  describeRouter,
  ddescribeRouter,
  describeWith,
  describeWithout,
  describeWithAndWithout,
  itShouldRoute
} from './util';

import {registerSpecs} from './impl/sync_route_spec_impl';

export function main() {
  registerSpecs();

  describeRouter('sync routes', () => {
    describeWithout('children', () => { describeWithAndWithout('params', itShouldRoute); });

    describeWith('sync children', () => {
      describeWithAndWithout('default routes',
                             () => { describeWithAndWithout('params', itShouldRoute); });
    });
  });
}
