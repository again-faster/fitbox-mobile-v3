import { Row, SkeletonView, Spacer } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { StyleSheet, View } from 'react-native';

const SessionLoader = () => {
	return (
		<View style={[layout.flex_1]}>
			<View style={styles.container}>
				<Row spacing="space-between">
					<SkeletonView width="47%" height={40} borderRadius={6} />
					<SkeletonView width="47%" height={40} borderRadius={6} />
				</Row>
				<View style={styles.tabContainer}>
					<Row spacing="space-between">
						<SkeletonView
							width="20%"
							height={40}
							borderRadius={6}
						/>
						<SkeletonView
							width="20%"
							height={40}
							borderRadius={6}
						/>
						<SkeletonView
							width="20%"
							height={40}
							borderRadius={6}
						/>
						<SkeletonView
							width="20%"
							height={40}
							borderRadius={6}
						/>
					</Row>
				</View>
			</View>
			<Spacer size="h4" />
			<SkeletonView
				width="100%"
				height="50%"
				borderRadius={5}
				bgColor="#ddd"
			/>
		</View>
	);
};

export default SessionLoader;

const styles = StyleSheet.create({
	container: {
		padding: config.metrics.rg,
	},
	tabContainer: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: config.fonts.colors.lightgrey,
		marginTop: config.metrics.rg,
		paddingTop: config.metrics.rg,
	},
});
