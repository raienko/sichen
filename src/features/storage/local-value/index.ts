import StorageValue from "../storage-value";
import localStorageAdapter from "./adapter";

/**
 * Persistent, on-device value backed by MMKV (react-native-mmkv), with a
 * localStorage fallback on web.
 *
 * @example
 * const value = new LocalValue<string>("example");
 * value.setValue("hello");
 * value.getValue(); // "hello"
 * value.useValue(); // reactive read, inside a component
 * value.reset();
 */
export default class LocalValue<T> extends StorageValue<T> {
  constructor(key: string) {
    super(localStorageAdapter, key);
  }
}
