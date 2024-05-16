import { config } from '@/theme/_config';
import { StyleSheet, View } from 'react-native';

type FooterProps = {
	children: React.ReactNode;
};
const Footer = ({ children }: FooterProps) => {
	return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
	container: {
		paddingTop: config.metrics.xs,
		paddingHorizontal: config.metrics.lg,
		paddingBottom: config.metrics.lg,
	},
});

export default Footer;
