import { IconButton } from "@/components/button";
import Icon from "@/components/icon";
import { useLocale } from "@/features/localization";
import { useTheme } from "@/features/theme";

type Props = {
  /** Whether the password is currently readable. */
  visible: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/**
 * The eye in a password field's right slot.
 *
 * Its accessible name is the action ("Show password") rather than the state,
 * so it stays unambiguous when the icon has flipped but the announcement
 * hasn't been re-read. The hit area is a full touch target because the eye
 * is 20pt of drawing sitting right beside the text.
 */
export default function VisibilityToggle({
  visible,
  disabled,
  onPress,
}: Props) {
  const { t } = useLocale();
  const theme = useTheme();

  return (
    <IconButton
      label={t(visible ? "input.password.hide" : "input.password.show")}
      disabled={disabled}
      onPress={onPress}
    >
      <Icon
        name={visible ? "eye-off" : "eye"}
        color={theme.colors.textSecondary}
      />
    </IconButton>
  );
}
