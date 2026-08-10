import type { GestureResponderEvent } from 'react-native';
import { MemberButton } from '@/components/member';

type Props = {
	label: string;
	onPress: (event?: GestureResponderEvent) => void;
	disabled?: boolean;
};

const PrimaryButton = ({ label, onPress, disabled = false }: Props) => (
	<MemberButton label={label} onPress={onPress} disabled={disabled} />
);

export default PrimaryButton;
