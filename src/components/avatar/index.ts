/**
 * A barrel, plus one static. `AvatarGroup` draws `Avatar`s, so with the
 * component defined here the two would import each other — a require cycle
 * Metro allows but warns can leave a value uninitialised.
 */
import AvatarComponent from "./avatar";
import AvatarGroup from "./group";

const Avatar = Object.assign(AvatarComponent, { Group: AvatarGroup });

export default Avatar;
export { AvatarGroup };
export type { AvatarSize } from "./avatar";
export type { AvatarGroupPerson } from "./group";
