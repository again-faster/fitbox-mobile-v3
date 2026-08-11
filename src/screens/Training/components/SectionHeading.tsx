import { MemberSection } from '@/components/member';

type Props = {
	title: string;
	action?: string;
	onActionPress?: () => void;
};

const SectionHeading = ({ title, action, onActionPress }: Props) => (
	<MemberSection
		title={title}
		actionLabel={action}
		onActionPress={onActionPress}
	/>
);

export default SectionHeading;
