/**
 * Browsers don't expose whether assistive technology is running. React
 * Native Web returns `true` as a conservative sentinel, but treating that
 * as a detected screen reader would disable every expiring toast on web.
 */
export default function readScreenReaderEnabled(): Promise<boolean> {
  return Promise.resolve(false);
}
