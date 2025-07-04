import { pipeInto } from "ts-functional-pipe";
import { type IndexedSelector, map } from "ts-iterable-functions";


export function toObject<T, K extends PropertyKey, V>(
  keySelector: IndexedSelector<T, K>,
  valueSelector: IndexedSelector<T, V>
) {
  return (arr: Iterable<T>): Record<K, V> => pipeInto(
    arr,
    map((v, i) => [keySelector(v, i), valueSelector(v, i)] as const),
    (v) => Object.fromEntries(v) as Record<K, V>
  );
}
