import env from "@/constants/env";

import { device, deviceHeaders, installId, timezone, userAgent } from "./index";

describe("device", () => {
  it("keeps one install id across calls", () => {
    const first = installId();

    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(installId()).toBe(first);
  });

  it("reports a timezone", () => {
    expect(timezone()).toEqual(expect.any(String));
  });

  it("names the app, build, OS and model in its user agent", () => {
    expect(userAgent()).toBe(
      `${env.appSlug}/${device.appVersion} (${device.buildNumber}; ${device.osName} ${device.osVersion}; ${device.model})`,
    );
  });

  it("describes the device in request headers", () => {
    expect(deviceHeaders()).toMatchObject({
      "X-App-Version": device.appVersion,
      "X-Platform": device.platform,
      "X-Install-Id": installId(),
      "X-Timezone": timezone(),
    });
  });
});
